create database simple_chat;

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
