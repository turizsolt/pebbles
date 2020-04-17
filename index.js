// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', socket => {
  socket.on('create', data => {
    socket.broadcast.emit('created', data);
  });

  socket.on('move', data => {
    socket.broadcast.emit('moved', data);
  });

  socket.on('table', data => {
    socket.broadcast.emit('tabled', data);
  });
});
