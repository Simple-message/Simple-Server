'use strict';
const http = require('http');
const utils = require('../utils.js');
const getKeyByValue = utils.getKeyByValue;
const getFormattedDate = utils.getFormattedDate;
const getFormattedDateISO = utils.getFormattedDateISO;

class Server {
  constructor(port) {
    const messageHandlers = {
      'login': (connection, data) => this.handleLoginMessage(connection, data),
      'messageToChat': (connection, data) => this.handleMessageToChat(connection, data), 
      'register': (connection, data) => this.register(connection, data), 
      'getChats': (connection) => this.handleGetChats(connection), 
      'history': (connection, data) => this.getHistory(connection, data), 
    };

    const server = http.createServer();
    server.listen(port, () => {
      console.log('Server running on ' + port + '...');
    });


    // const ws = new WebSocket.Server({ server });
    const io = require('socket.io')(server);
    io.sockets.on('connection', socket => {
      for (const handlerType in messageHandlers) {
        socket.on(handlerType, mess => messageHandlers[handlerType](socket, mess));
      }
      socket.on('disconnect', () => this.connectionClose(socket));
    });

    this.server = server;
    // this.ws = ws;
    this.connections = {};
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
    connection.emit("login", JSON.stringify({code, uid}));
  }

  async handleGetChats(connection) {
    const socketId = connection.id;
    console.log('handleGetChats', this.connections);
    const uid = this.connections[socketId];
    if (!uid) {
      const resultAnauthorized = {code: 401, message: 'Anauthorized'};
      connection.emit("chats", JSON.stringify(resultAnauthorized));
      return;
    }
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
      const socketId = connection.id;
      this.connections[socketId] = uid;
    }
    connection.send(JSON.stringify(result));
  }

  async handleMessageToChat(connection, jsonData) {
    // const socketId = connection.id;
    // const senderId = this.connections[socketId];
    // if (!senderId) {
    //   const resultAnauthorized = {code: 401, message: 'Anauthorized'};
    //   connection.emit('messageToChat', JSON.stringify(resultAnauthorized));
    //   return;
    // }
    const data = JSON.parse(jsonData);
    const messageText = data.text;
    const timeSent = getFormattedDate();
    const recieverId = data.reciever_id;
    const senderId = data.sender_id;
    const result = await this.database.sendMessage(messageText, timeSent, senderId, recieverId);
    const datetimeISO = getFormattedDateISO(timeSent);
    const messageData = {code: result.code, success: !!result.result.affectedRows, send_time: datetimeISO, message_text: messageText, sender_id: senderId};
    console.log(messageData);
    connection.emit('messageToChat', JSON.stringify(messageData));
  }

  async getHistory(connection, data) {
    // const socketId = connection.id;
    // console.log('socketId', socketId);
    // console.log('getHistory', this.connections);
    // const senderId = this.connections[socketId];
    // console.log('senderID', senderId);
    // if (!senderId) {
    //   const resultAnauthorized = {code: 401, message: 'Anauthorized'};
    //   connection.emit('messageToChat', JSON.stringify(resultAnauthorized));
    //   return;
    // }
    data = JSON.parse(data);
    const recieverId = data.reciever_id;
    const senderId = data.sender_id;
    const result = await this.database.getHistory(senderId, recieverId);
    console.log(result);
    connection.emit('history', result);
  }

}

module.exports.Server = Server;
