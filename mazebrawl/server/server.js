const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'client')));

const rooms = new Map();

function generateRoomID() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 5; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function broadcastRoomUpdate(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  io.to(roomId).emit('roomUpdate', {
    leaderId: room.leaderId,
    players: room.players,
  });
}

io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  socket.on('startGame', (callback) => {
    if (typeof callback !== 'function') return;

    let playerRoomId = null;
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        playerRoomId = roomId;

        if (room.leaderId !== socket.id) {
          callback({ success: false, message: 'Only leader can start the game.' });
          return;
        }

        const minPlayers = 3;
        const othersReady = room.players
          .filter(p => p.id !== socket.id)
          .every(p => p.ready);

        if (room.players.length < minPlayers) {
          callback({ success: false, message: 'Not enough players to start.' });
          return;
        }
        if (!othersReady) {
          callback({ success: false, message: 'All players must be ready.' });
          return;
        }

        io.to(roomId).emit('gameStarted');
        callback({ success: true });
        console.log(`Game started in room ${roomId} by leader ${socket.id}`);
        return;
      }
    }

    if (!playerRoomId) {
      callback({ success: false, message: 'Player not in any room.' });
    }
  });

  socket.on('createRoom', (playerName, callback) => {
    if (typeof callback !== 'function') return;

    let roomId;
    do {
      roomId = generateRoomID();
    } while (rooms.has(roomId));

    const room = {
      players: [{ id: socket.id, name: playerName, ready: false }],
      leaderId: socket.id,
    };
    rooms.set(roomId, room);

    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${playerName}`);

    //dbug: notify creator room was created
    socket.emit('roomCreated', roomId);

    callback({ success: true, roomId, leaderId: socket.id, players: room.players });
  });

  socket.on('joinRoom', (roomId, playerName, callback) => {
    if (typeof callback !== 'function') return;

    if (!rooms.has(roomId)) {
      callback({ success: false, message: 'Room does not exist.' });
      return;
    }

    const room = rooms.get(roomId);
    if (room.players.length >= 7) {
      callback({ success: false, message: 'Room is full.' });
      return;
    }

    room.players.push({ id: socket.id, name: playerName, ready: false });
    socket.join(roomId);

    //notify everyone that a new player joined
    io.to(roomId).emit('playerJoined', playerName);

    broadcastRoomUpdate(roomId);

    callback({ success: true, roomId, leaderId: room.leaderId, players: room.players });
    console.log(`${playerName} joined room ${roomId}`);
  });

  socket.on('toggleReady', () => {
    for (const [roomId, room] of rooms.entries()) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        if (room.leaderId !== socket.id) {
          player.ready = !player.ready;
          broadcastRoomUpdate(roomId);
          console.log(`Player ${player.name} toggled ready to ${player.ready}`);
        }
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);

    rooms.forEach((room, roomId) => {
      const index = room.players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        const leftPlayer = room.players[index].name;
        room.players.splice(index, 1);

        if (room.leaderId === socket.id) {
          room.leaderId = room.players.length > 0 ? room.players[0].id : null;
          if (room.leaderId) {
            const newLeader = room.players[0].name;
            io.to(roomId).emit('leaderChanged', newLeader);
            console.log(`Leader reassigned to ${newLeader}`);
          }
        }

        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          io.to(roomId).emit('playerLeft', leftPlayer);
          broadcastRoomUpdate(roomId);
        }
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
