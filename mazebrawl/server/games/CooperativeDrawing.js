// mazebrawl/server/games/CooperativeDrawing.js

const prompts = {
    easy: ["A happy yellow sun", "A red apple on a table", "A simple house with a chimney", "A smiling snowman", "A big blue whale"],
    hard: ["A cat playing a tiny piano", "A robot drinking coffee in the rain", "Two giraffes wearing top hats", "A penguin riding a skateboard", "A dragon eating a taco"],
    pro: ["An astronaut playing a guitar on the moon", "A detailed world map made of fruit", "A photorealistic portrait of a smiling capybara", "A medieval castle under siege by rubber chickens", "The Mona Lisa, but as a robot"]
};

const timers = { easy: 90, hard: 120, pro: 180 };

class CooperativeDrawing {
  constructor(io, roomId, players, lang = 'en', onGameEnd, difficulty = 'easy') {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.onGameEnd = onGameEnd;
    this.difficulty = difficulty;
    this.lang = lang; // Language support can be added later

    this.playerCanvases = {}; // { playerId: 'base64_image_data' }
    this.gameTimer = null;

    this.startGame();
  }

  startGame() {
    const promptList = prompts[this.difficulty] || prompts['easy'];
    this.prompt = promptList[Math.floor(Math.random() * promptList.length)];
    this.timeLimit = timers[this.difficulty] || timers['easy'];

    // Assign each player a segment of the canvas
    const segments = this.players.map((p, index) => ({ playerId: p.id, segmentIndex: index }));
    
    this.io.to(this.roomId).emit('startGame', 'DrawingGameScene', this.prompt, {
        timeLimit: this.timeLimit,
        segments: segments,
        playerCount: this.players.length
    });

    console.log(`Cooperative Drawing started in room ${this.roomId} with prompt: "${this.prompt}"`);

    this.gameTimer = setTimeout(() => {
        this.endGame();
    }, this.timeLimit * 1000);
  }

  handleDrawing(playerId, canvasData) {
    this.playerCanvases[playerId] = canvasData;
    // Broadcast the drawing update to all other players in the room
    this.io.to(this.roomId).emit('drawingUpdate', { playerId, canvasData });
  }

  // This is where the AI judgment would happen.
  // For now, we'll simulate it with a random score.
  async getAIScore(combinedImage, prompt) {
    console.log('Simulating AI judgment for prompt:', prompt);
    // In a real implementation, you would send the `combinedImage` (base64)
    // and `prompt` to a multimodal AI model API.
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return a random score for demonstration purposes
    const randomScore = Math.floor(Math.random() * 51) + 45; // Score between 45 and 95
    return {
        score: randomScore,
        feedback: "AI feedback is a future feature!"
    };
  }

  async endGame() {
     if (this.gameTimer) {
        clearTimeout(this.gameTimer);
        this.gameTimer = null;
    }
    
    console.log(`Game ended in room ${this.roomId}. Evaluating drawing...`);
    this.io.to(this.roomId).emit('evaluatingDrawing');
    
    // The client will send the final combined image.
    // We'll wait for that event.
  }
  
  async handleSubmit(finalImage) {
      const result = await this.getAIScore(finalImage, this.prompt);

      this.io.to(this.roomId).emit('gameEnded', {
          prompt: this.prompt,
          finalImage: finalImage,
          score: result.score,
          feedback: result.feedback
      });

      // Schedule cleanup
      setTimeout(() => {
        if (this.onGameEnd) {
          console.log(`Auto-cleaning CooperativeDrawing game in room ${this.roomId}.`);
          this.onGameEnd();
        }
      }, 8000); // 8-second delay to let players see the results
  }
}

module.exports = CooperativeDrawing;
