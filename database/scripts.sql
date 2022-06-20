create database simple_chat;

use simple_chat;

create table messages(
  id int not null primary key auto_increment,
  sender_id int not null,
  reciever_id int not null,
  send_time datetime not null,
  message_text varchar(300) not null
);

create table users(
  id int not null primary key auto_increment,
  name varchar(100),
  unique(name)
);

insert into users(name) values('Bender');
insert into messages(sender_id, reciever_id, send_time, message_text) values(1, 7, '2020-12-03', 'Hello! How are you?');
insert into messages(sender_id, reciever_id, send_time, message_text) values(1, 8, '2020-12-04', 'Goodbye');
