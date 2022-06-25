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
      'messageToChat': (connection, data) =>
        this.handleMessageToChat(connection, data),
      'register': (connection, data) => this.register(connection, data),
      'getChats': connection => this.handleGetChats(connection),
      'history': (connection, data) => this.getHistory(connection, data),
      'avatar': (connection, data) => this.getAvatar(connection, data),
      'uid': (connection, data) => this.getUidByName(connection, data)
    };

    const presetMessages = {
      'resultAnauthorized':
        JSON.stringify({ code: 401, message: 'Anauthorized' }),
    };
    const authorizationNotRequiredEvents = ['login', 'register'];
    const checkAuthorization = this.checkAuthorization;

    const server = http.createServer();
    server.listen(port, () => {
      console.log('Server running on ' + port + '...');
    });
    server.on('request', this.handleRequest);

    const io = require('socket.io')(server);
    io.sockets.on('connection', socket => {
      console.log('new connection');
      for (const handlerType in messageHandlers) {
        socket.on(handlerType, mess => {
          if (!authorizationNotRequiredEvents.includes(handlerType)) {
            const auth = checkAuthorization(socket, handlerType);
            if (!auth) return;
          }
          messageHandlers[handlerType](socket, mess);
        });
      }
      socket.on('disconnect', () => this.connectionClose(socket));
    });

    this.server = server;
    this.connections = {};
    this.presetMessages = presetMessages;
  }

  checkAuthorization(connection, handlerType) {
    const socketId = connection.id;
    const uid = this.connections[socketId];
    if (!uid) {
      connection.emit(handlerType, this.presetMessages.resultAnauthorized);
      return false;
    }
    return true;
  }

  //handle request in http server
  async handleRequest(req, res) {
    const name = req.url;
    console.log(req.method, name);
    const extention = name.split('.')[1];
    const typeAns = mime[extention];
    fs.readFile('.' + name, (err, data) => {
      if (err) console.error('in handle request ' + err);
      else {
        res.writeHead(200, { 'Content-Type': `${typeAns}; charset=utf-8` });
        res.write(data);
      }
      res.end();
    });
  }

  setDatabase(database) {
    this.database = database;
  }

  connectionClose(connectionClosed) {
    const socketClosedId = connectionClosed.id;
    delete this.connections[socketClosedId];
    console.log('close ' + socketClosedId);
  }

  async handleLoginMessage(connection, login) {
    const result = await this.database.getUserId(login);
    let uid = null;
    const code = result.code;
    const resSql = result.result;
    if (resSql.length > 0) {
      uid = resSql[0].id;
      if (code === 200 && uid) {
        const socketId = connection.id;
        this.connections[socketId] = uid;
      }
    }
    const loginResult = JSON.stringify({ code, uid });
    connection.emit('login', loginResult);
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
    const uidResult = JSON.stringify({ code, uid, name });
    connection.emit('uid', uidResult);
  }

  async handleGetChats(connection) {
    const socketId = connection.id;
    const uid = this.connections[socketId];
    const chatResult = await this.database.getChats(uid);
    const chatResultStringified = JSON.stringify(chatResult);
    connection.emit('chats', chatResultStringified);
  }

  async register(connection, data) {
    const dataParsed = JSON.parse(data);
    const login = dataParsed.login;
    const loginResult = await this.database.getUserId(login);
    let code = loginResult.code;
    let resSql = loginResult.result;
    let uid = null;
    if (code !== 200 || resSql.length === 0) {
      const result = await this.database.register(login);
      code = result.code;
      resSql = result.result;
      uid = resSql.insertId;
    } else if (resSql.length > 0) {
      uid = resSql[0].id;
    }

    if (code === 200 && uid) {
      const socketId = connection.id;
      this.connections[socketId] = uid;

      const avatar = dataParsed.avatar;
      const avatarPath = './fileServer/avatars/' + uid + '.png';
      fs.writeFile(avatarPath, avatar, 'base64', err => {
        console.log(err);
      });
    }
    const loginResultStringified = JSON.stringify({ code, uid });
    connection.emit('login', loginResultStringified);
  }

  async handleMessageToChat(connection, jsonData) {
    const socketId = connection.id;
    const senderId = this.connections[socketId];
    const data = JSON.parse(jsonData);
    const messageText = data.text;
    const timeSent = getFormattedDate();
    const recieverId = data.reciever_id;
    const result = await this.database.sendMessage(
      messageText,
      timeSent,
      senderId,
      recieverId);
    const datetimeISO = getFormattedDateISO(timeSent);
    const success = !!result.result.affectedRows;
    const messageData = JSON.stringify({
      'code': result.code,
      success,
      'send_time': datetimeISO,
      'message_text': messageText,
      'sender_id': senderId
    });

    const senderConnectionId = getKeyByValue(this.connections, recieverId);
    const senderConnection = this.connections[senderConnectionId];
    connection.emit('messageToChat', messageData);
    if (senderConnection)
      senderConnection.emit('messageToChat', messageData);
  }

  async getHistory(connection, data) {
    const socketId = connection.id;
    const senderId = this.connections[socketId];
    data = JSON.parse(data);
    const recieverId = data.reciever_id;
    const result = await this.database.getHistory(senderId, recieverId);
    connection.emit('history', result);
  }
}

module.exports.Server = Server;
