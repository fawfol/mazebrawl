//mazebrawl/server/games/typingRace.js


const https = require('https');

const defaultSentences = [
  "The quick brown fox jumps over the lazy dog.",
  "Never underestimate the power of a good book.",
  "Tenzin Kalsang is a very good looking boy.",
  "Technology has revolutionized the way we live and work.",
  "The journey of a thousand miles begins with a single step."
];

class TypingRace {
  constructor(io, roomId, players) {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.progress = {}; // { playerId: 0..1 }
    this.scores = {};   // total scores
    this.round = 1;
    this.maxRounds = 5;

    players.forEach(p => {
      this.progress[p.id] = 0;
      this.scores[p.id] = 0;
    });

    this.setupSocketListeners();
    this.startRound();
  }

  setupSocketListeners() {
    // can add additional per-game listeners here if needed
  }

  async startRound() {
    let sentence = await this.fetchQuote() || this.getRandomDefaultSentence();
    this.sentence = sentence;

    // reset per-round state
    this.progress = {};
    this.finishOrder = [];
    this.players.forEach(p => this.progress[p.id] = 0);

    // broadcast to all players in room
    this.io.to(this.roomId).emit('startGame', 'TypingGame', this.sentence, {
      round: this.round,
      maxRounds: this.maxRounds
    });

    // also emit initial progress for new/late joining players
    this.io.to(this.roomId).emit('updateProgress', { playerId: null, progress: this.progress });
  }

  updateProgress(playerId, prog) {
    this.progress[playerId] = prog;
    this.io.to(this.roomId).emit('updateProgress', { playerId, progress: prog });

    if (prog >= 1) this.handlePlayerFinish(playerId);
  }

  handlePlayerFinish(playerId) {
    if (!this.finishOrder.includes(playerId)) {
        this.finishOrder.push(playerId);

        const position = this.finishOrder.length;
        let points = 0;
        if (position === 1) points = 3;
        else if (position === 2) points = 2;
        else if (position === 3) points = 1;

        this.scores[playerId] += points;
    }

    if (this.finishOrder.length === this.players.length) this.endRound();
}


  endRound() {
    this.io.to(this.roomId).emit('roundEnded', {
      scores: this.scores,
      finishOrder: this.finishOrder
    });

    this.round++;
    if (this.round <= this.maxRounds) {
      setTimeout(() => this.startRound(), 5000); //3 sec delay
    } else {
      this.endGame();
    }

    this.finishOrder = [];
  }

  endGame() {
    const rankedPlayers = Object.entries(this.scores)
      .sort((a, b) => b[1] - a[1])
      .map(([id, score], idx) => ({ id, score, place: idx + 1 }));

    this.io.to(this.roomId).emit('gameEnded', { rankedPlayers });
  }

  getRandomDefaultSentence() {
    return defaultSentences[Math.floor(Math.random() * defaultSentences.length)];
  }

  async fetchQuote() {
    return new Promise((resolve) => {
      https.get('https://api.quotable.io/random', res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const quote = JSON.parse(data).content;
            resolve(quote);
          } catch {
            resolve(null);
          }
        });
      }).on('error', () => resolve(null));
    });
  }
}

module.exports = TypingRace;
