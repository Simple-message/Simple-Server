'use strict';
const http = require('http');
const WebSocket = require('ws');
// const io = require('socket.io');
const utils = require('../utils.js');
const getKeyByValue = utils.getKeyByValue;

//also may use private fields?
class Server {
  constructor(port) {
    const messageHandlers = {
      'login': (connection, data) => this.handleLoginMessage(connection, data),
      'messageToChat': (connection, data) => this.handleMessageToChat(connection, data), 
      'register': (connection, data) => this.register(connection, data), 
      'getChats': (connection, data) => this.handleGetChats(connection, data), 
      'history': (connection, data) => this.getHistory(connection, data), 
    };

    const server = http.createServer();
    server.on('request', this.handleRequest);
    server.listen(port, () => {
      console.log('Server running on ' + port + '...');
    });


    // const ws = new WebSocket.Server({ server });
    const io = require('socket.io')(server);
    io.sockets.on('connection', socket => {
      for (const handlerType in messageHandlers) {
        socket.on(handlerType, mess => messageHandlers[handlerType](socket, mess));
      }
    });

    this.server = server;
    // this.ws = ws;
    this.connections = {};
  }

  setDatabase(database) {
    this.database = database;
  }

  handleRequest(req, res) {
    console.log('should handle request?');
  }

  // connectionMessage(connection, message) {
  //   console.log(message);
  //   const messageObject = JSON.parse(message);
  //   const messageType = messageObject.type;
  //   console.log(messageType);
  //   const messageHandler = this.messageHandlers[messageType];
  //   if (messageHandler) messageHandler(connection, messageObject.data)
  // }

  connectionClose(connectionClosed) {
    const connections = this.connections;
    const uids = Object.keys(this.connections);
    const closedUid = getKeyByValue(connectionClosed);
    for (const uid in uids) {
      const connection = connections[uid];
      if (connection == connectionClosed) delete this.connections[uid];
      else connection.send(JSON.stringify({type: 'toOffline', data: {closedUid}}));
    }
  }

  async handleLoginMessage(connection, login) {
    const result = await this.database.getUserId(login); //may add password
    let uid = null;
    const code = result.code;
    const resSql = result.result;
    if (resSql.length > 0) {
      uid = resSql[0].id;
      if (code == 200 && uid) {
        const existsUid = getKeyByValue(connection);
        if (existsUid) delete this.connections[uid];
        this.connections[uid] = connection;
      }
    }
    connection.emit("login", JSON.stringify({code, uid}));
  }

  async handleGetChats(connection, uid) {
    const result = await this.database.getChats(uid);
    console.log(result);
    connection.emit("chats", JSON.stringify(result));
  }

  async register(connection, data) {
    const login = data.login;
    const result = await this.database.register(login); //may add password
    const code = result.code;
    const resSql = result.result;
    const uid = resSql.insertId;
    if (code == 200 && uid) {
      const existsUid = getKeyByValue(connection);
      if (existsUid) delete this.connections[uid];
      this.connections[uid] = connection;
    }
    connection.send(JSON.stringify(result));
  }

  async handleMessageToChat(connection, data) {
    const messageText = data.text;
    const timeSent = data.time;
    const senderId = data.id;
    const recieverId = data.recieverId;
    const result = await this.database.sendMessage(messageText, timeSent, senderId, recieverId);
    console.log(result);
    connection.send(JSON.stringify(result));
  }

  async getHistory(connection, data) {
    data = JSON.parse(data);
    const senderId = data.sender_id;
    const recieverId = data.reciever_id;
    const result = await this.database.getHistory(senderId, recieverId);
    connection.emit('history', result);
  }

}

module.exports.Server = Server;
