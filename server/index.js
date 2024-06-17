const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
// const amqp = require('amqplib');
const markHandling = require('./routes/markHandling');
const postHandling = require('./routes/postHandling');
const blogListHandling = require('./routes/blogListHandling');

const app = express();
const server = http.createServer(app);
const io = socketIo(server
//   ,{
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"]
//   }
// }
);

let mapLock = null;

// const AMQP_URL = 'amqp://guest:guest@http://127.0.0.1:15672/';

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use(markHandling);
app.use(postHandling);
app.use(blogListHandling);

io.on('connection', (socket) => {
  const userId = socket.id;
  console.log('新客戶端連接', userId);


  socket.emit('init', { id: userId });

  socket.on('requestMapControl',(callback) => {
    if (!mapLock) {
      mapLock = userId;
      callback({ granted: true });
    } else {
      callback({ granted: false });
    }
  });

  socket.on('releaseMapControl', () => {
    if (mapLock === userId) {
      mapLock = null;
    }
  });

  socket.on('mouseMove', (data) => {
    data.id = userId;
    socket.broadcast.emit('mouseMove', data);
  });

  socket.on('mapMove', (data) => {
    if (mapLock === userId) {
      socket.broadcast.emit('mapMove', data);
    }
  });

  socket.on('newMarker', (data) => {
    socket.broadcast.emit('newMarker', data);
  });


  socket.on('disconnect', () => {
    if (mapLock === userId) {
      mapLock = null;
      console.log('客戶端斷開連接');
    }

  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});