'use strict';
const http = require('http');
const WebSocket = require('ws');


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
    if (messageObject.type == 'login') this.handleLoginMessage(connection, messageObject.data);
  }

  connectionClose(connection) {
    console.log('connection closed');
    console.log(connection);
  }

  async handleLoginMessage(connection, data) {
    const login = data.login;
    const result = await this.database.getUserId(login); //may add password
    const uid = result.uid;
    const code = result.code;
    if (code == 200 && uid) this.connections[uid] = connection;
    connection.send(JSON.stringify(result));
  }


}

module.exports.Server = Server;
