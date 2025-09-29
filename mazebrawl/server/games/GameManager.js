const TypingRace = require('./typingRace.js');

class GameManager {
  constructor(io, rooms) {
    this.io = io;
    this.rooms = rooms; // Reference to main rooms map
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
      default:
        if (callback) callback({ success: false, message: 'Invalid game type.' });
        return;
    }

    this.activeGames.set(roomId, gameInstance);
    console.log(`${gameType} game started in room ${roomId}`);
    if (callback) callback({ success: true });
  }

  handleGameEvent(playerId, eventType, data) {
    const roomEntry = Array.from(this.rooms.entries()).find(([roomId, room]) =>
      room.players.some(p => p.id === playerId)
    );

    if (!roomEntry) return;

    const [roomId, room] = roomEntry;
    const gameInstance = this.activeGames.get(roomId);
    if (!gameInstance) return;

    switch (eventType) {
      case 'typingProgress':
        if (gameInstance.updateProgress) {
          gameInstance.updateProgress(playerId, data);
        }
        break;
      default:
        console.warn(`Unhandled game event: ${eventType}`);
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
