// mazebrawl/server/server.js

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const GameManager = require('./games/GameManager.js');
const CooperativeDrawing = require('./games/CooperativeDrawing.js');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://varybrawl.onrender.com",
    methods: ["GET", "POST"]
  }
});

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
    maxPlayers: 7,
    language: room.language
  });
}

// --- SOCKET CONNECTION ---
io.on('connection', (socket) => {
  console.log(`New connection: ${socket.id}`);

  // --- ROOM EVENTS ---
  socket.on('createRoom', (playerName, lang, callback) => {
    if (typeof callback !== 'function') return;
    let roomId;
    do { roomId = generateRoomID(); } while (rooms.has(roomId));
    const room = {
      players: [{ id: socket.id, name: playerName, ready: false }],
      leaderId: socket.id,
      language: lang || 'en'
    };
    rooms.set(roomId, room);
    socket.join(roomId);
    console.log(`Room created: ${roomId} by ${playerName} with language ${lang}`);
    socket.emit('roomCreated', roomId);
    broadcastRoomUpdate(roomId);
    callback({ success: true, roomId, leaderId: socket.id, players: room.players, language: room.language });
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

  socket.on('changeLanguage', (newLang) => {
    for (const [roomId, room] of rooms.entries()) {
        if (room.leaderId === socket.id) {
            room.language = newLang;
            broadcastRoomUpdate(roomId);
            console.log(`Language in room ${roomId} changed to ${newLang}`);
            break;
        }
    }
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
  
	socket.on('selectGame', (gameType, options, callback) => {
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
		    const gameLang = playerRoom.language || 'en';
		    
		    if (gameType === 'TypingGame') {
		        const preCountdownDuration = 10;
		        io.to(playerRoomId).emit('preCountdown', { duration: preCountdownDuration, gameType });
		        const gameStartTimer = setTimeout(() => {
		            activeGames.startNewGame(playerRoomId, 'TypingRace', playerRoom.players, gameLang, callback);
		            if (playerRoom) delete playerRoom.gameStartTimer;
		        }, preCountdownDuration * 1000);
		        playerRoom.gameStartTimer = gameStartTimer;

		    } else if (gameType === 'DrawingGame') {
		          const preCountdownDuration = 5; //give 5 seconds to show "Game Starting"
		          // we tell the client to switch to the 'DrawingGameScene'
		          io.to(playerRoomId).emit('preCountdown', { duration: preCountdownDuration, gameType: 'DrawingGameScene' });
		          
		          //we wait for the countdown duration before actually creating the game instance
		          const gameStartTimer = setTimeout(() => {
		              activeGames.startNewGame(playerRoomId, 'CooperativeDrawing', playerRoom.players, gameLang, callback, options.difficulty);
		              if (playerRoom) delete playerRoom.gameStartTimer;
		          }, preCountdownDuration * 1000);
		          playerRoom.gameStartTimer = gameStartTimer;

		    } else {
		          if (callback) callback({ success: false, message: 'Invalid game type selected.' });
		    }
		} else {
		    if (callback) callback({ success: false, message: 'Cannot start game: permission denied or room not found.' });
		}
	});
  
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
    if (playerRoom && playerRoom.leaderId === socket.id && playerRoom.gameStartTimer) {
        console.log(`Leader in room ${playerRoomId} is skipping the tutorial.`);
        clearTimeout(playerRoom.gameStartTimer);
        delete playerRoom.gameStartTimer;
        io.to(playerRoomId).emit('tutorialSkipped');
        setTimeout(() => {
            const gameLang = playerRoom.language || 'en';
            activeGames.startNewGame(playerRoomId, 'TypingRace', playerRoom.players, gameLang, () => {});
        }, 3000);
    }
  });

  socket.on('typingProgress', (progress) => {
    activeGames.handleGameEvent(socket.id, 'typingProgress', progress);
  });
  
  socket.on('playerFinishedDrawing', () => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        //broadcast to everyone in the room *except* the sender
        socket.to(roomId).emit('playerStatusUpdate', { playerId: socket.id });
        break;
      }
    }
  });
  
  socket.on('drawingAction', (canvasData) => {
    activeGames.handleGameEvent(socket.id, 'drawingAction', canvasData);
  });

  socket.on('submitDrawing', (finalImage) => {
    activeGames.handleGameEvent(socket.id, 'submitDrawing', finalImage);
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
        io.to(playerRoomId).emit('gameChatMessage', { name: player.name, text: msg });
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
