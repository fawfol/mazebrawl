// mazebrawl/server/games/typingRace.js

const https = require('https');

// Default sentences to use if the API fetch fails
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
    this.players = players; // array of {id, name}
    this.progress = {}; // { playerId: 0..1 }

    // initialize progress for all players
    players.forEach(p => this.progress[p.id] = 0);

    this.setupSocketListeners();
    this.startGameWithQuote();
  }

  /**
   * Fetches a random quote from the quotable.io API within a specific length range.
   * @returns {Promise<string|null>} A promise that resolves with the quote content or null on failure.
   */
  fetchQuote() {
    return new Promise((resolve) => {
      const options = {
        hostname: 'api.quotable.io',
        path: '/random?minLength=70&maxLength=150', // Fetch quotes between 70 and 150 chars
        method: 'GET',
        headers: {
          'User-Agent': 'Node.js'
        }
      };

      const req = https.get(options, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`API request failed with status code: ${res.statusCode}`);
          return resolve(null);
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            // The API might return an array of quotes when filtering
            const quote = Array.isArray(parsedData) ? parsedData[0] : parsedData;
            resolve(quote.content);
          } catch (e) {
            console.error("Failed to parse quote API response:", e);
            resolve(null);
          }
        });
      });

      req.on('error', (e) => {
        console.error("Failed to fetch quote due to network error:", e);
        resolve(null);
      });
    });
  }


  /**
   * Gets a random sentence from the default list.
   * @returns {string} A random default sentence.
   */
  getRandomDefaultSentence() {
    return defaultSentences[Math.floor(Math.random() * defaultSentences.length)];
  }

  /**
   * Starts the game by fetching a quote or using a default sentence,
   * then emits the 'startGame' event to all clients in the room.
   */
  async startGameWithQuote() {
    let sentence = await this.fetchQuote();

    // If fetching the quote failed, use one of the default sentences
    if (!sentence) {
      console.log("Using a default sentence as fallback.");
      sentence = this.getRandomDefaultSentence();
    }

    this.sentence = sentence;
    this.io.to(this.roomId).emit('startGame', 'TypingRace', this.sentence);
  }

  /**
   * Sets up socket listeners for each player to handle typing progress.
   */
  setupSocketListeners() {
    this.players.forEach(p => {
      const socket = this.io.sockets.sockets.get(p.id);
      if (socket) {
        // It's good practice to remove old listeners to prevent duplicates if games restart
        socket.removeAllListeners('typingProgress');
        socket.on('typingProgress', prog => this.updateProgress(p.id, prog));
      }
    });
  }

  /**
   * Updates a player's progress and broadcasts it to the room.
   * @param {string} playerId The ID of the player.
   * @param {number} prog The new progress value (0 to 1).
   */
  updateProgress(playerId, prog) {
    this.progress[playerId] = prog;
    // broadcast to other players
    this.io.to(this.roomId).emit('updateProgress', { playerId, progress: prog });
  }
}

module.exports = TypingRace;

