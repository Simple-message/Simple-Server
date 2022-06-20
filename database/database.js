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
        return {code: 200, result};
      } catch (err) {
        console.error(err);
        return {code: 500, result: null};
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

  async getChats(uid) {
    const params = [uid];
    const getChatsSql = `
      select * 
      from messages 
      where id in (
        select a.id as "id" 
        from (
          select reciever_id, max(id) as "id" 
          from messages 
          where sender_id = ?
          group by reciever_id)
        a )
    `;
    return await this.handleQuery(getChatsSql, params);
  }

  async getHistory(senderId, recieverId) {
    const params = [senderId, recieverId, senderId, recieverId];
    console.log(params);
    const getHistorySql = `
      select * from messages 
      where sender_id in (?, ?) and reciever_id in (?, ?) 
      order by send_time asc
    `;
    return await this.handleQuery(getHistorySql, params);
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
