const Server = require('./server/server.js').Server;
const Database = require('./database/database.js').Database;
const databaseConfig = require('./config.js').databaseConfig;

const port = process.env.PORT || 8000;

const database = new Database(databaseConfig);
const server = new Server(port);
server.setDatabase(database);
