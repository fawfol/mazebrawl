// mazebrawl/server/games/typingRace.js

const https = require('https');

const defaultSentences = [
  "Why did the chicken crossed the road",
  "The quick brown fox jumps over the lazy dog",
  "Never underestimate the power of a good book",
  "Tenzin Kalsang is a very good looking and a kind hearted boy",
  "Technology has revolutionized the way we live and work",
  "The journey of a thousand miles begins with a single step",
  "Creativity is intelligence having fun in unexpected ways",
  "Learning never exhausts the mind; it only fuels it",
  "Persistence is the key to mastering any new skill",
  "A rolling stone gathers no moss, but curiosity gathers knowledge",
  "Challenges are what make life interesting; overcoming them is what makes life meaningful",
  "Innovation distinguishes between a leader and a follower",
  "You miss 100% of the shots you don't take",
  "Success is the sum of small efforts repeated day in and day out",
  "Every accomplishment starts with the decision to try",
  "Do not wait to strike till the iron is hot; make it hot by striking",
  "The best way to predict the future is to create it",
  "Opportunities don't happen. You create them",
  "Happiness is not something readymade It comes from your own actions",
  "Knowledge is power, but applied knowledge is freedom",
  "Dream big and dare to fail spectacularly",
  "Imagination is more important than knowledge",
  "Do one thing every day that scares you",
  "Strive not to be a success, but rather to be of value",
  "Small steps in the right direction can turn out to be the biggest steps of your life",
  "Quality is not an act, it is a habit",
  "Action is the foundational key to all success",
  "The only limit to our realization of tomorrow is our doubts of today",
  "A person who never made a mistake never tried anything new",
  "Simplicity is the ultimate sophistication",
  "Do not go where the path may lead, go instead where there is no path and leave a trail",
  "Success usually comes to those who are too busy to be looking for it",
  "Believe you can and you're halfway there",
  "Great minds discuss ideas; average minds discuss events; small minds discuss people",
  "Do what you can, with what you have, where you are",
  "The harder you work for something, the greater you'll feel when you achieve it",
  "Don't watch the clock; do what it does. Keep going",
  "Sometimes later becomes never Do it now",
  "The man who moves a mountain begins by carrying away small stones",
  "Little by little, one travels far Dream it Wish it Do it",
  "If opportunity doesn't knock, build a door",
  "Your limitation—it's only your imagination",
  "Push yourself, because no one else is going to do it for you",
  "Great things never come from comfort zones",
  "Success is not in what you have, but who you become",
  "The expert in anything was once a beginner",
  "Don't wait for the perfect moment. Take the moment and make it perfect",
  "Everything you’ve ever wanted is on the other side of fear",
  "You are braver than you believe, stronger than you seem, and smarter than you think",
  "The way to get started is to quit talking and begin doing",
  "Life is 10% what happens to us and 90% how we react to it",
  "Do what you love, and you’ll never work a day in your life",
 "Time you enjoy wasting is not wasted time",
  "Do not let what you cannot do interfere with what you can do",
  "Hustle in silence and let your success make the noise",
  "Opportunities are usually disguised as hard work",
  "Success is walking from failure to failure with no loss of enthusiasm",
  "Do what is right, not what is easy",
  "Courage is resistance to fear, mastery of fear, not absence of fear",
  "Hard work beats talent when talent doesn't work hard",
  "A goal without a plan is just a wish",
  "Strive for progress, not perfection",
  "Motivation is what gets you started, habit is what keeps you going",
  "Every day is a new beginning, take a deep breath and start again",
  "Don't limit your challenges, challenge your limits"
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
	this.roundTimer = null; // A timer to enforce the time limit

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
    
    // Calculate the time limit based on sentence length
    const letterCount = sentence.replace(/\s/g, '').length;
    const timeLimit = Math.ceil(letterCount * 1.2); // 1.2 is the 20% buffer

    // reset per-round state
    this.progress = {};
    this.finishOrder = [];
    this.players.forEach(p => this.progress[p.id] = 0);

    // broadcast to all players in room
    this.io.to(this.roomId).emit('startGame', 'TypingRace', this.sentence, {
      round: this.round,
      maxRounds: this.maxRounds,
	  timeLimit: timeLimit // send the time limit to the client
    });

    // Start the server-side timer for this round
    this.roundTimer = setTimeout(() => {
        this.handleTimeOut();
    }, timeLimit * 1000);

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
		else points = 0; // No points for 4th place and below

        this.scores[playerId] += points;
    }

    if (this.finishOrder.length === this.players.length) {
        clearTimeout(this.roundTimer); // Stop the timer if everyone finishes early
        this.endRound();
    }
  }
  
  // NEW: Handle players who time out
  handleTimeOut() {
    console.log(`Round timed out in room ${this.roomId}`);
    this.players.forEach(p => {
        if (!this.finishOrder.includes(p.id)) {
            // Player timed out, set their progress to 1 and add to finish order with 0 points
            this.progress[p.id] = 1;
            this.handlePlayerFinish(p.id);
        }
    });
    this.endRound();
  }


  endRound() {
    this.io.to(this.roomId).emit('roundEnded', {
      scores: this.scores,
      finishOrder: this.finishOrder
    });

    this.round++;
    if (this.round <= this.maxRounds) {
      setTimeout(() => this.startRound(), 8000); //8 sec delay
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
