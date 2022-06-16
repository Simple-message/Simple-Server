'use strict';

const mysql = require('mysql');

class Database {
  constructor(details) {
    this.details = details;
  }

  exec(query, params) {
    return new Promise((resolve, reject) => {
      this.con.query(query, params, (err, script) => {
        if (err) reject(err);
        else resolve(script);
      });
    });
  }

  async handleDbConnection(script) {
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

  async handleQuery(sql, params) {
    return await this.handleDbConnection(async () => {
      try {
        const result = await this.exec(sql, params);
        return [200, result];
      } catch (err) {
        console.error(err);
        return [500, null];
      }
    });
  }

  async register(login) {
    const params = [login];
    const registerSql = `
      insert into users(name) values (?)
    `;
    return await this.handleQuery(registerSql, params);
  }

  async getUserId(name) {
    const params = [name];
    const getIdSql = `
      select id from users
      where name=?
    `;
    return await this.handleQuery(getIdSql, params);
  }

  async sendMessage(messageText, timeSent, senderId, recieverId) {
    const params = [senderId, recieverId, timeSent, messageText];
    const insertMessageSql = `
      insert into messages(sender_id, reciever_id, send_time, message_text) 
      values (?, ?, ?, ?)
    `;
    return await this.handleQuery(insertMessageSql, params);
  }




}

module.exports.Database = Database;
