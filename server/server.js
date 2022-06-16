'use strict';
const http = require('http');
const WebSocket = require('ws');
const utils = require('../utils.js');
const getKeyByValue = utils.getKeyByValue;

//also may use private fields?
class Server {
  constructor(port) {
    const server = http.createServer();
    server.on('request', this.handleRequest);
    server.listen(port, () => {
      console.log('Server running on ' + port + '...');
    });

    const ws = new WebSocket.Server({ server });
    setInterval(() => this.onConnection(), 5000);
    ws.on('connection', connection => {
      this.onConnection(connection);
      connection.on('message', mess => this.connectionMessage(connection, mess));
      connection.on('close', () => this.connectionClose(connection));
    });

    this.messageHandlers = {
      'login': (connection, data) => this.handleLoginMessage(connection, data),
      'messageToChat': (connection, data) => this.handleMessageToChat(connection, data), 
      'register': (connection, data) => this.register(connection, data), 
    }

    this.server = server;
    this.ws = ws;
    this.connections = {};
  }

  setDatabase(database) {
    this.database = database;
  }

  handleRequest(req, res) {
    console.log('should handle request?');
  }

  onConnection(connection) {
    if (!connection) return;
  }

  connectionMessage(connection, message) {
    const messageObject = JSON.parse(message);
    const messageType = messageObject.type;
    console.log(messageType);
    const messageHandler = this.messageHandlers[messageType];
    if (messageHandler) messageHandler(connection, messageObject.data)
  }

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

  async handleLoginMessage(connection, data) {
    const login = data.login;
    const [code, resSql] = await this.database.getUserId(login); //may add password
    const uid = resSql[0].id;
    if (code == 200 && uid) {
      const existsUid = getKeyByValue(connection);
      if (existsUid) delete this.connections[uid];
      this.connections[uid] = connection;
    }
    connection.send(JSON.stringify({code, uid}));
  }

  async register(connection, data) {
    const login = data.login;
    const [code, resSql] = await this.database.register(login); //may add password
    const uid = resSql.insertId;
    if (code == 200 && uid) {
      const existsUid = getKeyByValue(connection);
      if (existsUid) delete this.connections[uid];
      this.connections[uid] = connection;
    }
    connection.send(JSON.stringify({code, uid}));
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


}

module.exports.Server = Server;
