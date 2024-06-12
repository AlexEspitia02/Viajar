const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const markHandling = require('./routes/markHandling');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));
app.use(markHandling);

io.on('connection', (socket) => {
  console.log('新客戶端連接');
  socket.on('disconnect', () => {
    console.log('客戶端斷開連接');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});