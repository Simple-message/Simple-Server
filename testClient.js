'use strict';
const socket = new WebSocket('ws://localhost:8000');

socket.onopen = function() {
  socket.send(JSON.stringify({ type: 'login', data: { login: 'Bender' } }));
};

socket.onmessage = function(event) {
  console.log(event);
};
