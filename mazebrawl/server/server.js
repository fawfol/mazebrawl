// mazebrawl/server/server.js

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const TypingRace = require('./games/typingRace.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..', 'client')));

// --- ROOM MANAGEMENT ---
const rooms = new Map();        // roomId => { players: [{id,name,ready}], leaderId }
const activeGames = new Map();  // roomId => gameInstance

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

  // --- CREATE ROOM ---
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

  // --- JOIN ROOM ---
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

  // --- TOGGLE READY ---
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

  // --- REQUEST RANDOM SENTENCE ---
  socket.on('requestTypingSentence', callback => {
    const sentence = TypingRace.prototype.getRandomSentence();
    if (callback) callback(sentence);
  });

  // --- START GAME ---
  socket.on('startGame', (gameType, sentence) => {
    let playerRoomId = null;
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        playerRoomId = roomId;
        if (room.leaderId !== socket.id) return; // only leader

        if (room.players.length < 3) {
          socket.emit('gameStartError', 'Not enough players (min 3)');
          return;
        }
        if (!room.players.filter(p => p.id !== socket.id).every(p => p.ready)) {
          socket.emit('gameStartError', 'All players must be ready');
          return;
        }

        // --- START SPECIFIC GAME ---
        if (gameType === 'TypingRace') {
          const gameInstance = new TypingRace(io, roomId, room.players);
          activeGames.set(roomId, gameInstance);
        }

        io.to(roomId).emit('gameStarted');
        console.log(`Game started in room ${roomId} by leader ${socket.id}`);
        break;
      }
    }
  });

  // --- TYPING PROGRESS (handled in game module) ---
  socket.on('typingProgress', (progress) => {
    // TypingRace instance handles broadcasting updates
    for (const [roomId, game] of activeGames.entries()) {
      if (game.progress.hasOwnProperty(socket.id)) {
        game.updateProgress(socket.id, progress);
      }
    }
  });

  // --- LEAVE ROOM ---
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
          activeGames.delete(roomId);
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

  //-- MESSAGE LSITENER ---
	//-- MESSAGE LISTENER ---
	socket.on('gameChatMessage', (msg) => {
	  // Find the room of this socket
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



  // --- DISCONNECT ---
  socket.on('disconnect', () => {
    console.log(`Disconnected: ${socket.id}`);
    // same as leaveRoom logic
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
          activeGames.delete(roomId);
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
