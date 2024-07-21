module.exports = (io) => {
  let mapLock = null;
  io.on('connection', (socket) => {
    const userId = socket.id;
    console.log('新客戶端連接', userId);

    socket.emit('init', { id: userId });

    socket.on('joinRoom', ({ mapId }) => {
      if (mapId) {
        socket.join(mapId);
      }
    });

    socket.on('requestMapControl', (callback) => {
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

    socket.on('requestControl', ({ mapId }) => {
      if (mapId) {
        socket.to(mapId).emit('disableButton');
      }
    });

    socket.on('releaseControl', ({ mapId }) => {
      if (mapId) {
        socket.to(mapId).emit('enableButton');
      }
    });

    socket.on('mouseMove', (data) => {
      const {
        mapId,
        loginUserId,
        loginUserName,
        clientX,
        clientY,
        innerWidth,
        innerHeight,
      } = data;
      const centerX = innerWidth / 2;
      const centerY = innerHeight / 2;
      const xOffset = clientX - centerX;
      const yOffset = clientY - centerY;

      if (loginUserId && mapId) {
        socket.to(mapId).emit('mouseMove', {
          id: userId,
          mapId,
          loginUserId,
          loginUserName,
          xOffset,
          yOffset,
        });
      }
    });

    socket.on('mapMove', (data) => {
      if (mapLock === userId) {
        socket.to(data.mapId).emit('mapMove', data);
      }
    });

    socket.on('newMarker', (data) => {
      socket.broadcast.emit('newMarker', data);
    });

    socket.on('newEmptyMarker', (data) => {
      socket.broadcast.emit('newEmptyMarker', data);
    });

    socket.on('hideCursor', (data) => {
      socket.broadcast.emit('hideCursor', data);
    });

    socket.on('showCursor', (data) => {
      socket.broadcast.emit('showCursor', data);
    });

    socket.on('toggleCursorsVisibility', (data) => {
      socket.broadcast.emit('toggleCursorsVisibility', data);
    });

    socket.on('deleteMarker', (data) => {
      socket.broadcast.emit('deleteMarker', data);
    });

    socket.on('disconnect', () => {
      if (mapLock === userId) {
        mapLock = null;
        console.log('客戶端斷開連接');
      }
    });
  });
};
