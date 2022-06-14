'use strict';

const mysql = require('mysql');
const Receiver = require('ws/lib/receiver');

class Database {
  constructor(details) {
    this.details = details;
  }

  async createConnection() {
    this.con = await mysql.createConnection(this.loginSettings);
    return this.con;
  }

  exec(query) {
    return new Promise((resolve, reject) => {
      this.con.query(query, (err, script) => {
        if (err) reject(err);
        else resolve(script);
      });
    });
  }

  addMessage(message) {
    const [senderCode, senderId] = this.getUserId(message.senderName);
    const [recieverCode, recieverId] = this.getUserId(message.recieverName);
    if (senderCode == 500 || recieverCode == 500) return [500, null];

    const sendTime = message.sendTime;
    const messageText = message.messageText;
    const addMessageSql = `
      insert into messages(sender_id, reciever_id, send_time, messsage_text)
      values(${senderId}, ${recieverId}, ${sendTime}, ${messageText});
    `;

    try {
      const sqlResult = await this.exec(addMessageSql);
      const insertId = sqlResult.insertId;
      return [200, insertId];
    } catch (err) {
      console.log('file->database.js | function->addMessage | error-> ', err);
      return [500, null];
    }
  }

  getUserId(name) {
    const getIdSql = `
      select id from users
      where name=${name}
    `;
    try {
      const name = await this.exec(getIdSql);
      return [200, name];
    } catch (err) {
      console.error('file->database.js | function->getUserId | error-> ', err);
      return [500, null];
    }
  }


}
