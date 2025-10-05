// mazebrawl/server/games/CooperativeDrawing.js

const prompts = {
    easy: ["A happy yellow sun", "A red apple on a table", "A simple house with a chimney", "A smiling snowman", "A big blue whale"],
    hard: ["A cat playing a tiny piano", "A robot drinking coffee in the rain", "Two giraffes wearing top hats", "A penguin riding a skateboard", "A dragon eating a taco"],
    pro: ["An astronaut playing a guitar on the moon", "A detailed world map made of fruit", "A photorealistic portrait of a smiling capybara", "A medieval castle under siege by rubber chickens", "The Mona Lisa, but as a robot"]
};

const timers = { easy: 40, hard: 60, pro: 90 };

class CooperativeDrawing {

	/**
   * calculates grid layout and segment positions for a given number of players  Keeps the overall canvas square
   * @param {number} playerCount The number of players
   * @returns {object} an object containing grid dimensions and segment definitions
   */
  calculateSegments(playerCount) {
    let segments = [];
    let gridTemplateAreas = '';
    let gridTemplateColumns = '1fr';
    let gridTemplateRows = '1fr';

    //define layouts for different player counts
    switch (playerCount) {
      case 1:
        gridTemplateAreas = '"a"';
        segments = [{ segmentIndex: 0, area: 'a' }];
        break;
      case 2:
        gridTemplateColumns = '1fr 1fr';
        gridTemplateAreas = '"a b"';
        segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }];
        break;
      case 3: //users requested layout for 3 players
        gridTemplateColumns = '1fr 1fr';
        gridTemplateRows = '1fr 1fr';
        gridTemplateAreas = '"a b" "c c"';
        segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }];
        break;
      case 4:
        gridTemplateColumns = '1fr 1fr';
        gridTemplateRows = '1fr 1fr';
        gridTemplateAreas = '"a b" "c d"';
        segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }, { segmentIndex: 3, area: 'd' }];
        break;
      case 5:
        gridTemplateColumns = '1fr 1fr 1fr';
        gridTemplateRows = '1fr 1fr';
        gridTemplateAreas = '"a b c" "d e e"';
        segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }, { segmentIndex: 3, area: 'd' }, { segmentIndex: 4, area: 'e' }];
        break;
      case 6:
        gridTemplateColumns = '1fr 1fr 1fr';
        gridTemplateRows = '1fr 1fr';
        gridTemplateAreas = '"a b c" "d e f"';
        segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }, { segmentIndex: 3, area: 'd' }, { segmentIndex: 4, area: 'e' }, { segmentIndex: 5, area: 'f' }];
        break;
      default: //fallback for 7 players or more
        gridTemplateColumns = '1fr 1fr';
        gridTemplateRows = '1fr 1fr 1fr 1fr';
        gridTemplateAreas = '"a b" "c d" "e f" "g g"';
         for (let i = 0; i < playerCount; i++) {
            segments.push({ segmentIndex: i, area: String.fromCharCode(97 + i) });
        }
        break;
    }

    //assign player IDs to the calculated segments
    const assignedSegments = segments.map((seg, index) => ({
      ...seg,
      playerId: this.players[index]?.id || null,
    }));
    
    return { layout: { gridTemplateAreas, gridTemplateColumns, gridTemplateRows }, segments: assignedSegments };
  }


  startGame() {
    const promptList = prompts[this.difficulty] || prompts['easy'];
    this.prompt = promptList[Math.floor(Math.random() * promptList.length)];
    this.timeLimit = timers[this.difficulty] || timers['easy'];

    //use the new function to get the layout and segments
    const { layout, segments } = this.calculateSegments(this.players.length);
    
    this.io.to(this.roomId).emit('startGame', 'DrawingGameScene', this.prompt, {
        timeLimit: this.timeLimit,
        segments: segments, //send new rich segment data
        layout: layout,     //send new layout instructions
        playerCount: this.players.length
    });

    console.log(`Cooperative Drawing started in room ${this.roomId} with prompt: "${this.prompt}"`);

    this.gameTimer = setTimeout(() => {
        this.endGame();
    }, this.timeLimit * 1000);
  }	
  constructor(io, roomId, players, lang = 'en', onGameEnd, difficulty = 'easy') {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.onGameEnd = onGameEnd;
    this.difficulty = difficulty;
    this.lang = lang; //language support can be added later

    this.playerCanvases = {}; // { playerId: 'base64_image_data' }
    this.gameTimer = null;

    this.startGame();
  }

  handleDrawing(playerId, canvasData) {
    this.playerCanvases[playerId] = canvasData;
    //broadcast the drawing update to all other players in the room
    this.io.to(this.roomId).emit('drawingUpdate', { playerId, canvasData });
  }

  //this is where the AI judgment would happen.
  //for now, we'll simulate it with a random score.
  async getAIScore(combinedImage, prompt) {
    console.log('Simulating AI judgment for prompt:', prompt);
    //in a real implementation, you would send the `combinedImage` (base64)
    //s nd `prompt` to a multimodal AI model API.
    
    //dimulate API call delay
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
    
    //the client will send the final combined image.
    //wll wait for that event.
  }
  
  async handleSubmit(finalImage) {
      const result = await this.getAIScore(finalImage, this.prompt);

      this.io.to(this.roomId).emit('gameEnded', {
          prompt: this.prompt,
          finalImage: finalImage,
          score: result.score,
          feedback: result.feedback
      });

      //schedule cleanup
      setTimeout(() => {
        if (this.onGameEnd) {
          console.log(`Auto-cleaning CooperativeDrawing game in room ${this.roomId}.`);
          this.onGameEnd();
        }
      }, 8000); // 8-second delay to let players see the results
  }
}

module.exports = CooperativeDrawing;
