/* eslint-disable prettier/prettier */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client from 'socket.io-client';

// 引入你的 Socket.IO 服務器模塊
import setupSocketIO from '../services/socketHandler';

let io; let httpServer; let serverSocket;
let clientSocketUrl;

beforeAll((done) => {
  // 創建 HTTP 服務器並將其與 Socket.IO 服務器關聯
  httpServer = createServer();
  io = new Server(httpServer);

  // 配置你的 Socket.IO 服務器
  setupSocketIO(io);

  // 監聽 HTTP 服務器的連接
  httpServer.listen(() => {
    const {port} = httpServer.address();
    clientSocketUrl = `http://localhost:${port}`;

    io.on('connection', (socket) => {
      serverSocket = socket;
      console.log('beforeAll: serverSocket connected');
    });

    done();
  });
});

afterAll(() => {
  if (io) io.close();
  if (httpServer) httpServer.close();
});

beforeEach((done) => {
  console.log('beforeEach: initializing and connecting clientSocket');
  const clientSocket = new Client(clientSocketUrl);

  clientSocket.on('connect', () => {
    console.log('beforeEach: clientSocket connected');
    done();
  });
});

describe('Socket.IO server', () => {
  it('should connect and disconnect', (done) => {
    const clientSocket = new Client(clientSocketUrl);
    clientSocket.on('connect', () => {
      expect(serverSocket).toBeDefined();
      clientSocket.close();
      serverSocket.on('disconnect', () => {
        console.log('Test: serverSocket disconnected');
        done();
      });
    });
  });

  it('should join room and receive messages', (done) => {
    const room = 'testRoom';
    const clientSocket = new Client(clientSocketUrl);
    io.on('connection', (socket) => {
      socket.on('joinRoom', ({ mapId }) => {
        expect(mapId).toBe(room);
        socket.join(mapId);
        done();
      });
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinRoom', { mapId: room });
    });
  });

  it('should handle requestMapControl correctly', (done) => {
    const clientSocket = new Client(clientSocketUrl);
    io.on('connection', (socket) => {
      socket.on('requestMapControl', (callback) => {
        callback({ granted: true });
      });
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('requestMapControl', (response) => {
        expect(response.granted).toBe(true);
        done();
      });
    });
  });

  it('should handle releaseMapControl correctly', (done) => {
    const clientSocket = new Client(clientSocketUrl);
    io.on('connection', (socket) => {
      socket.on('requestMapControl', (callback) => {
        callback({ granted: true });
        socket.emit('releaseMapControl');
        socket.on('releaseMapControl', () => {
          socket.emit('requestMapControl', (callback) => {
            callback({ granted: true });
            done();
          });
        });
      });
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('requestMapControl', (response) => {
        expect(response.granted).toBe(true);
        clientSocket.emit('releaseMapControl');
      });
    });
  });

  it('should broadcast mouseMove to the correct room', (done) => {
    const room = 'testRoom';
    const clientSocket = new Client(clientSocketUrl);
    const data = {
      mapId: room,
      loginUserId: 'user1',
      loginUserName: 'User One',
      clientX: 100,
      clientY: 100,
      innerWidth: 800,
      innerHeight: 600,
    };

    io.on('connection', (socket) => {
      socket.on('joinRoom', ({ mapId }) => {
        socket.join(mapId);
      });

      socket.on('mouseMove', (moveData) => {
        expect(moveData.mapId).toBe(room);
        expect(moveData.loginUserId).toBe(data.loginUserId);
        expect(moveData.loginUserName).toBe(data.loginUserName);
        done();
      });
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('joinRoom', { mapId: room });
      clientSocket.emit('mouseMove', data);
    });
  });
});
