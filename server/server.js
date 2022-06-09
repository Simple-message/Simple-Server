"use strict";
const http = require("http");
const WebSocket = require("ws");

//also may use private fields?
class Server {

  constructor(port) {
    const server = http.createServer();
    server.on("request", this.handleRequest);
    server.listen(port, () => {
      console.log("Server running on " + port + "...");
    });

    const ws = new WebSocket.Server({ server });
    setInterval(() => this.onConnection(), 5000);
    ws.on("connection", connection => {
      this.onConnection(connection);
      connection.on("message", mess => this.connectionMessage(connection, mess));
      connection.on("close", () => this.connectionClose(connection));
    });

    this.server = server;
    this.ws = ws;

  }

  handleRequest(req, res) {
    console.log("should handle request?");
  }

  onConnection(connection) {
    console.log("new connection");
    console.log(connection);
  }

  connectionMessage(connection, message) {
    console.log("new message");
    console.log(message);
  }

  connectionClose(connection) {
    console.log("connection closed");
    console.log(connection);
  }


}

module.exports.Server = Server;
