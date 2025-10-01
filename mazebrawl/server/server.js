// mazebrawl/server/server.js

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const GameManager = require('./games/GameManager.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'client')));

// --- ROOM MANAGEMENT ---
const rooms = new Map();
const activeGames = new GameManager(io, rooms);

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
    maxPlayers: 7
  });
}

// --- SOCKET CONNECTION ---
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // --- ROOM EVENTS ---
  socket.on('createRoom', (playerName, callback) => {
    if (typeof callback !== 'function') return;

    let roomId;
    do { roomId = generateRoomID(); } while (rooms.has(roomId));

    const room = {
      players: [{ id: socket.id, name: playerName, ready: false }],
      leaderId: socket.id
    };
    rooms.set(roomId, room);

    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${playerName}`);
    socket.emit('roomCreated', roomId);
    broadcastRoomUpdate(roomId);

    callback({ success: true, roomId, leaderId: socket.id, players: room.players });
  });

  socket.on('joinRoom', (roomId, playerName, callback) => {
    if (typeof callback !== 'function') return;

    const room = rooms.get(roomId);
    if (!room) return callback({ success: false, message: 'Room does not exist.' });
    if (room.players.length >= 7) return callback({ success: false, message: 'Room is full.' });

    room.players.push({ id: socket.id, name: playerName, ready: false });
    socket.join(roomId);

    io.to(roomId).emit('playerJoined', playerName);
    broadcastRoomUpdate(roomId);

    callback({ success: true, roomId, leaderId: room.leaderId, players: room.players });
    console.log(`${playerName} joined room ${roomId}`);
  });

  socket.on('toggleReady', () => {
    for (const [roomId, room] of rooms.entries()) {
      const player = room.players.find(p => p.id === socket.id);
      if (player && room.leaderId !== socket.id) {
        player.ready = !player.ready;
        broadcastRoomUpdate(roomId);
        console.log(`Player ${player.name} toggled ready to ${player.ready}`);
        break;
      }
    }
  });

  socket.on('lobbyStart', (callback) => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        if (room.leaderId !== socket.id) return;

        const minPlayers = 2;
        const othersReady = room.players.filter(p => p.id !== socket.id).every(p => p.ready);

        if (room.players.length < minPlayers) {
          if (callback) callback({ success: false, message: 'Not enough players (min 2)' });
          return;
        }
        if (!othersReady) {
          if (callback) callback({ success: false, message: 'All players must be ready' });
          return;
        }

        io.to(roomId).emit('gameHasStarted');
        console.log(`Session started in room ${roomId}. Moving to GameScene.`);
        if (callback) callback({ success: true });
        break;
      }
    }
  });

  // --- GAME EVENTS (Delegated to GameManager) ---
  socket.on('selectGame', (gameType, callback) => {
    let playerRoomId = null;
    let playerRoom = null;
    for (const [roomId, room] of rooms.entries()) {
        if (room.players.some(p => p.id === socket.id)) {
            playerRoomId = roomId;
            playerRoom = room;
            break;
        }
    }

    if (playerRoom && playerRoom.leaderId === socket.id) {
        if (gameType === 'TypingGame') {
            const preCountdownDuration = 10; // CHANGED: Increased from 5 to 10 seconds
            
            // Emit the pre-game countdown event
            io.to(playerRoomId).emit('preCountdown', { duration: preCountdownDuration, gameType });
            console.log(`Pre-countdown for TypingRace started in room ${playerRoomId}.`);

            setTimeout(() => {
                activeGames.startNewGame(playerRoomId, 'TypingRace', playerRoom.players, callback);
            }, preCountdownDuration * 1000);
        } else {
            // For other game types, start immediately
            activeGames.startNewGame(playerRoomId, gameType, playerRoom.players, callback);
        }
    } else {
        if (callback) callback({ success: false, message: 'Cannot start game: permission denied or room not found.' });
    }
});
	
	//New event listener for the leader skipping the tutorial
  socket.on('leaderSkipTutorial', () => {
    let playerRoomId = null;
    let playerRoom = null;
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        playerRoomId = roomId;
        playerRoom = room;
        break;
      }
    }

    if (playerRoom && playerRoom.leaderId === socket.id) {
        console.log(`Leader in room ${playerRoomId} skipped the tutorial.`);
        io.to(playerRoomId).emit('tutorialSkipped');
    }
  });


  socket.on('typingProgress', (progress) => {
    activeGames.handleGameEvent(socket.id, 'typingProgress', progress);
  });

  socket.on('leaveRoom', (callback) => {
    let found = false;
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
          }
        }
        if (room.players.length === 0) {
          rooms.delete(roomId);
          activeGames.endGame(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          io.to(roomId).emit('playerLeft', leftPlayer);
          broadcastRoomUpdate(roomId);
        }
        found = true;
      }
    });
    if (callback) callback({ success: found });
  });

  socket.on('gameChatMessage', (msg) => {
    let playerRoomId = null;
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        playerRoomId = roomId;
        break;
      }
    }

    if (playerRoomId) {
      const room = rooms.get(playerRoomId);
      const player = room.players.find(p => p.id === socket.id);

      if (player) {
        io.to(playerRoomId).emit('gameChatMessage', {
          name: player.name,
          text: msg
        });
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
          }
        }
        if (room.players.length === 0) {
          rooms.delete(roomId);
          activeGames.endGame(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        } else {
          io.to(roomId).emit('playerLeft', leftPlayer);
          broadcastRoomUpdate(roomId);
        }
      }
    });
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
