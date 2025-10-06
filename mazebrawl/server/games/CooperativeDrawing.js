// mazebrawl/server/games/CooperativeDrawing.js

const prompts = {
    en: {
        easy: ["A happy yellow sun", "A red apple on a table", "A simple house with a chimney", "A smiling snowman", "A big blue whale"],
        hard: ["A cat playing a tiny piano", "A robot drinking coffee in the rain", "Two giraffes wearing top hats", "A penguin riding a skateboard", "A dragon eating a taco"],
        pro: ["An astronaut playing a guitar on the moon", "A detailed world map made of fruit", "A photorealistic portrait of a smiling capybara", "A medieval castle under siege by rubber chickens", "The Mona Lisa, but as a robot"]
    },
    ja: {
        easy: ["幸せな黄色い太陽", "テーブルの上の赤いリンゴ", "煙突のある簡単な家", "笑っている雪だるま", "大きな青いクジラ"],
        hard: ["小さなピアノを弾いている猫", "雨の中コーヒーを飲むロボット", "シルクハットをかぶった二頭のキリン", "スケートボードに乗るペンギン", "タコスを食べるドラゴン"],
        pro: ["月でギターを弾く宇宙飛行士", "果物で作られた詳細な世界地図", "笑っているカピバラの写実的な肖像画", "ゴム製の鶏に包囲された中世の城", "ロボットとしてのモナ・リザ"]
    }
};

const timers = { easy: 40, hard: 60, pro: 90 };

class CooperativeDrawing {

  constructor(io, roomId, players, lang = 'en', onGameEnd, difficulty = 'easy') {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.lang = lang;
    this.onGameEnd = onGameEnd;
    this.difficulty = difficulty;

    this.playerCanvases = {};
    this.gameTimer = null;

    this.startGame();
  }

  calculateSegments(playerCount) {
    let segments = [];
    let gridTemplateAreas = '';
    let gridTemplateColumns = '1fr';
    let gridTemplateRows = '1fr';

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
      case 3:
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
      default:
        gridTemplateColumns = '1fr 1fr';
        gridTemplateRows = '1fr 1fr 1fr 1fr';
        gridTemplateAreas = '"a b" "c d" "e f" "g g"';
         for (let i = 0; i < playerCount; i++) {
            segments.push({ segmentIndex: i, area: String.fromCharCode(97 + i) });
        }
        break;
    }

    const assignedSegments = segments.map((seg, index) => ({
      ...seg,
      playerId: this.players[index]?.id || null,
    }));
    
    return { layout: { gridTemplateAreas, gridTemplateColumns, gridTemplateRows }, segments: assignedSegments };
  }

  startGame() {
    // Select the prompt list based on language and difficulty, with a fallback to English
    const promptList = (prompts[this.lang] && prompts[this.lang][this.difficulty]) || prompts['en'][this.difficulty];
    
    this.prompt = promptList[Math.floor(Math.random() * promptList.length)];
    this.timeLimit = timers[this.difficulty] || timers['easy'];

    const { layout, segments } = this.calculateSegments(this.players.length);
    
    this.io.to(this.roomId).emit('startGame', 'DrawingGameScene', this.prompt, {
        timeLimit: this.timeLimit,
        segments: segments,
        layout: layout,
        playerCount: this.players.length
    });

    console.log(`Cooperative Drawing started in room ${this.roomId} (lang: ${this.lang}) with prompt: "${this.prompt}"`);

    this.gameTimer = setTimeout(() => {
        this.endGame();
    }, this.timeLimit * 1000);
  }	
 
  handleDrawing(playerId, canvasData) {
    this.playerCanvases[playerId] = canvasData;
    this.io.to(this.roomId).emit('drawingUpdate', { playerId, canvasData });
  }

  async getAIScore(combinedImage, prompt) {
    console.log('Simulating AI judgment for prompt:', prompt);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const randomScore = Math.floor(Math.random() * 51) + 45;
    return {
        score: randomScore,
        feedback: "A truly collaborative masterpiece!" // A generic feedback
    };
  }

  async endGame() {
     if (this.gameTimer) {
        clearTimeout(this.gameTimer);
        this.gameTimer = null;
    }
    console.log(`Game ended in room ${this.roomId}. Evaluating drawing...`);
    this.io.to(this.roomId).emit('evaluatingDrawing');
  }
  
  async handleSubmit(finalImage) {
      const result = await this.getAIScore(finalImage, this.prompt);

      this.io.to(this.roomId).emit('gameEnded', {
          prompt: this.prompt,
          finalImage: finalImage,
          score: result.score,
          feedback: result.feedback
      });

      setTimeout(() => {
        if (this.onGameEnd) {
          console.log(`Auto-cleaning CooperativeDrawing game in room ${this.roomId}.`);
          this.onGameEnd();
        }
      }, 8000);
  }
}

module.exports = CooperativeDrawing;
