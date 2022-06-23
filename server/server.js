'use strict';
const http = require('http');
const utils = require('../utils.js');
const fs = require('fs');
const getKeyByValue = utils.getKeyByValue;
const getFormattedDate = utils.getFormattedDate;
const getFormattedDateISO = utils.getFormattedDateISO;

const mime = {
  'html': 'text/html',
  'js': 'text/javascript',
  'css': 'text/css',
  'png': 'image/png',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'json': 'text/plain',
  'txt': 'text/plain',
};

class Server {
  constructor(port) {
    const messageHandlers = {
      'login': (connection, data) => this.handleLoginMessage(connection, data),
      'messageToChat': (connection, data) => this.handleMessageToChat(connection, data), 
      'register': (connection, data) => this.register(connection, data), 
      'getChats': (connection) => this.handleGetChats(connection), 
      'history': (connection, data) => this.getHistory(connection, data), 
      'avatar': (connection, data) => this.getAvatar(connection, data),
      'uid': (connection, data) => this.getUidByName(connection, data)
    };

    const server = http.createServer();
    server.listen(port, () => {
      console.log('Server running on ' + port + '...');
    });
    server.on('request', this.handleRequest);


    // const ws = new WebSocket.Server({ server });
    const io = require('socket.io')(server);
    io.sockets.on('connection', socket => {
      console.log('new connection');
      for (const handlerType in messageHandlers) {
        socket.on(handlerType, mess => messageHandlers[handlerType](socket, mess));
      }
      socket.on('disconnect', () => this.connectionClose(socket));
    });

    this.server = server;
    // this.ws = ws;
    this.connections = {};
  }

  //handle request in http server
  async handleRequest(req, res) {
    let name = req.url;
    console.log(req.method, name);
    const extention = name.split('.')[1];
    const typeAns = mime[extention];
    fs.readFile('.' + name, (err, data) => {
      if (err) console.error('in handle request ' + err);
      else {
        res.writeHead(200, { 'Content-Type': `${typeAns}; charset=utf-8` });
        res.write(data);
      };
      res.end();
    });
  }

  setDatabase(database) {
    this.database = database;
  }

  connectionClose(connectionClosed) {
    const socketClosedId = connectionClosed.id;
    delete this.connections[socketClosedId];
    console.log("close " + socketClosedId);
  }

  async handleLoginMessage(connection, login) {
    const result = await this.database.getUserId(login);
    let uid = null;
    const code = result.code;
    const resSql = result.result;
    if (resSql.length > 0) {
      uid = resSql[0].id;
      if (code == 200 && uid) {
        const socketId = connection.id;
        this.connections[socketId] = uid;
      }
    }
    console.log({code, uid});
    connection.emit("login", JSON.stringify({code, uid}));
  }

  async getUidByName(connection, name) {
    const result = await this.database.getUserId(name);
    let uid = null;
    let code = 404;
    const resSql = result.result;
    if (resSql.length > 0) {
      uid = resSql[0].id;
      code = 200;
    }
    connection.emit("uid", JSON.stringify({code, uid, name}));
  }

  async handleGetChats(connection) {
    const socketId = connection.id;
    const uid = this.connections[socketId];
    if (!uid) {
      const resultAnauthorized = {code: 401, message: 'Anauthorized'};
      connection.emit("chats", JSON.stringify(resultAnauthorized));
      return;
    }
    const result = await this.database.getChats(uid);
    connection.emit("chats", JSON.stringify(result));
  }

  async register(connection, data) {
    const dataParsed = JSON.parse(data);
    const login = dataParsed.login;
    const loginResult = await this.database.getUserId(login);
    let code = loginResult.code;
    let resSql = loginResult.result;
    let uid = null;
    if (code != 200 || resSql.length == 0) {
      const result = await this.database.register(login); //may add password
      code = result.code;
      resSql = result.result;
      uid = resSql.insertId;
    } else if (resSql.length > 0){
      uid = resSql[0].id;
    }

    if (code == 200 && uid) {
      const socketId = connection.id;
      this.connections[socketId] = uid;

      const avatar = dataParsed.avatar;
      fs.writeFile('./fileServer/avatars/' + uid + '.png', avatar, 'base64', function(err) {
        console.log(err);
      });
    }
    connection.emit("login", JSON.stringify({code, uid}));
  }

  async handleMessageToChat(connection, jsonData) {
    const socketId = connection.id;
    const senderId = this.connections[socketId];
    if (!senderId) {
      const resultAnauthorized = {code: 401, message: 'Anauthorized'};
      connection.emit('messageToChat', JSON.stringify(resultAnauthorized));
      return;
    }
    const data = JSON.parse(jsonData);
    const messageText = data.text;
    const timeSent = getFormattedDate();
    const recieverId = data.reciever_id;
    const result = await this.database.sendMessage(messageText, timeSent, senderId, recieverId);
    const datetimeISO = getFormattedDateISO(timeSent);
    const messageData = {
      code: result.code,
      success: !!result.result.affectedRows, 
      send_time: datetimeISO, 
      message_text: messageText, 
      sender_id: senderId
    };
    
    const senderConnectionId = getKeyByValue(this.connections, recieverId);
    const senderConnection = this.connections[senderConnectionId];
    if (senderConnection) senderConnection.emit('messageToChat', JSON.stringify(messageData));
    connection.emit('messageToChat', JSON.stringify(messageData));
  }

  async getHistory(connection, data) {
    const socketId = connection.id;
    const senderId = this.connections[socketId];
    if (!senderId) {
      const resultAnauthorized = {code: 401, message: 'Anauthorized'};
      connection.emit('messageToChat', JSON.stringify(resultAnauthorized));
      return;
    }
    data = JSON.parse(data);
    const recieverId = data.reciever_id;
    const result = await this.database.getHistory(senderId, recieverId);
    console.log(result);
    connection.emit('history', result);
  }

}

module.exports.Server = Server;
