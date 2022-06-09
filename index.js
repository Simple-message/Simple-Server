const Server = require('./server/server.js').Server;

const port = process.env.PORT || 8000;
const server = new Server(port);
