const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const session = require('express-session');
const Redis = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');
const dotenv = require('dotenv');
const { connectToDb } = require('./models/db');

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

const placeRoutes = require('./routes/placeRoutes');
const markRoutes = require('./routes/markRoutes');
const postRoutes = require('./routes/postRoutes');
const mapRoutes = require('./routes/mapRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');

// Connect to the database and initialize routes only after a successful connection
connectToDb((err) => {
  if (!err) {
    app.use(markRoutes);
    app.use(postRoutes);
    app.use(blogRoutes);
    app.use(userRoutes);
    app.use(mapRoutes);
    app.use(placeRoutes);
    app.use(authRoutes);

    server.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } else {
    console.error('Failed to connect to the database:', err);
  }
});
