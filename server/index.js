const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configure Redis adapter for Socket.IO
const redisEndpoint = process.env.REDIS_HOST;
const pubClient = new Redis(`redis://${redisEndpoint}:6379`);
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const setupSocket = require('./models/socketHandler');

setupSocket(io);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/placeImg', express.static(path.join(__dirname, 'placeImg')));
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.static(path.join(__dirname, '../client/dist')));

const postHandling = require('./routes/postHandling');
const blogListHandling = require('./routes/blogListHandling');
const signInHandling = require('./routes/signInHandling');
const mapRoomHandling = require('./routes/mapRoomHandling');
const index = require('./routes/index');

const placeRoutes = require('./routes/placeRoutes');
const markRoutes = require('./routes/markRoutes');

app.use(markRoutes);
app.use(postHandling);
app.use(blogListHandling);
app.use(signInHandling);
app.use(mapRoomHandling);
app.use(placeRoutes);
app.use(index);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
