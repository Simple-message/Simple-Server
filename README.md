# Simple-Server
## Short Description
Simple server on nodejs, which provides backend functionality for Simple Message project. 
## Concept
Chat provides possibility to talk to people, who use the same app. Users are able to do that in separate rooms.
## Functionality
* registration;
* login;
* choose name/nickname;
* upload avatar;
* seeing all previous chats;
* separate rooms;
* seeing messages in specific rooms;
* saving in database.
## Important to know before using 
For simplicity, every login/name is unique, therefore there can not be two users with the same name.
### Simple-Server project
Backend is written in nodejs and with the help of websockets, more precisely with [socket.io](https://github.com/socketio/socket.io), which was chosen for the simplicity and ease of usage for connecting app and server. Transfer of data over the Hyper Text Transfer Protocol is being performed by a built-in nodejs module http (is being used, when loading avatars from backend).  
The main file - index.js - includes class **Server**, which handles every function, and message from server. We also use class **Database**, which helps handling database functions and stores them in a comfortable way to use. We use mysql for database anf [mysql](https://github.com/mysqljs/mysql) for saving data.
We also use **File Server to store images** (and in future other type of data).
## Todos:
* write tests;  
* add new methods for hadling not implemented socket events.
## Author
[Gorbunova Yelyzaveta](https://github.com/lizardlynx)  
[Maksym Marchenko](https://github.com/kertnique)
## License
MIT © [simple-server](https://github.com/Simple-message/Simple-Server)


