'use strict';

const mysql = require('mysql');

class Database {
  constructor(details) {
    this.details = details;
  }

  async handleDbFunc(script) {
    this.con = await mysql.createConnection(this.details);
    return new Promise((resolve, reject) => {
      this.con.connect(async err => {
        if (err) reject(err);
        else {
          const result = await script();
          resolve(result);
        }
        console.log('destroy connection');
        this.con.destroy();
      });
    });
  }

  exec(query) {
    return new Promise((resolve, reject) => {
      this.con.query(query, (err, script) => {
        if (err) reject(err);
        else resolve(script);
      });
    });
  }

  async addMessage(message) {
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

  async getUserId(name) {
    return await this.handleDbFunc(async () => {
      const getIdSql = `
        select id from users
        where name='${name}'
      `;
      try {
        const name = await this.exec(getIdSql);
        return [200, name];
      } catch (err) {
        console.error('file->database.js | function->getUserId | error-> ', err);
        return [500, null];
      }
    });
  }


}

module.exports.Database = Database;
