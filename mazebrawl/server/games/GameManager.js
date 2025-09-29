// mazebrawl/server/games/GameManager.js

const TypingRace = require('./typingRace.js');

class GameManager {
  constructor(io, rooms) {
    this.io = io;
    this.rooms = rooms; // Reference to the main rooms map
    this.activeGames = new Map(); // roomId => gameInstance
  }

  startNewGame(roomId, gameType, players, callback) {
    if (this.activeGames.has(roomId)) {
      if (callback) callback({ success: false, message: 'A game is already active in this room.' });
      return;
    }

    let gameInstance = null;
    switch (gameType) {
      case 'TypingRace':
        gameInstance = new TypingRace(this.io, roomId, players);
        break;
      // Add more cases for future games here
      // case 'NewGame':
      //   gameInstance = new NewGame(this.io, roomId, players);
      //   break;
      default:
        if (callback) callback({ success: false, message: 'Invalid game type.' });
        return;
    }

    this.activeGames.set(roomId, gameInstance);
    console.log(`${gameType} game started in room ${roomId}`);
    if (callback) callback({ success: true });
  }

  handleGameEvent(playerId, eventType, data) {
    const room = Array.from(this.rooms.values()).find(r => r.players.some(p => p.id === playerId));
    if (!room) return;

    const gameInstance = this.activeGames.get(room.id);
    if (gameInstance) {
      switch (eventType) {
        case 'typingProgress':
          if (gameInstance.updateProgress) {
            gameInstance.updateProgress(playerId, data);
          }
          break;
        // Add more cases for handling other game events
        default:
          console.warn(`Unhandled game event: ${eventType}`);
      }
    }
  }

  endGame(roomId) {
    if (this.activeGames.has(roomId)) {
      this.activeGames.delete(roomId);
      console.log(`Game ended in room ${roomId}.`);
    }
  }
}

module.exports = GameManager;
