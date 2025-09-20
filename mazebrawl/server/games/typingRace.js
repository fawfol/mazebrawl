// mazebrawl/server/games/typingRace.js

const sampleSentences = [
  "The quick brown fox jumps over the lazy dog",
  "Phaser makes HTML5 game development fun",
  "Typing speed is measured by words per minute",
];

class TypingRace {
  constructor(io, roomId, players) {
    this.io = io;
    this.roomId = roomId;
    this.players = players; // array of {id, name}
    this.sentence = this.getRandomSentence();
    this.progress = {}; // { playerId: 0..1 }

    // initialize progress
    players.forEach(p => this.progress[p.id] = 0);

    // broadcast sentence to all players in room
    this.io.to(roomId).emit('startGame', 'TypingRace', this.sentence);

    // set up socket listeners for typing progress
    this.players.forEach(p => {
      const socket = this.io.sockets.sockets.get(p.id);
      if (socket) {
        socket.on('typingProgress', prog => this.updateProgress(p.id, prog));
      }
    });
  }

  getRandomSentence() {
    return sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
  }

  updateProgress(playerId, prog) {
    this.progress[playerId] = prog;
    // broadcast to other players
    this.io.to(this.roomId).emit('updateProgress', { playerId, progress: prog });
  }
}

module.exports = TypingRace;
