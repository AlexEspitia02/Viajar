const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use((req, res, next) => {
  req.io = io;
  next();
});

const setupSocket = require('./models/socketHandler');

setupSocket(io);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/placeImg', express.static(path.join(__dirname, 'placeImg')));
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/dist')));

const markHandling = require('./routes/markHandling');
const postHandling = require('./routes/postHandling');
const blogListHandling = require('./routes/blogListHandling');
const signInHandling = require('./routes/signInHandling');
const mapRoomHandling = require('./routes/mapRoomHandling');
const placeHandling = require('./routes/placeHandling');

app.use(markHandling);
app.use(postHandling);
app.use(blogListHandling);
app.use(signInHandling);
app.use(mapRoomHandling);
app.use(placeHandling);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
