// mazebrawl/server/games/CooperativeDrawing.js

const { createCanvas, loadImage } = require('canvas');

// --- Word Lists for Topic Generation ---
const wordLists = {
    adjectives: ["Happy", "Sad", "Angry", "Sleepy", "Giant", "Tiny", "Red", "Blue", "Yellow", "Green", "Purple", "Orange",
  // moods & emotions
  "Happy", "Sad", "Angry", "Excited", "Lonely", "Curious", "Peaceful", "Scared",
  "Brave", "Nervous", "Sleepy", "Surprised", "Proud", "Jealous", "Lazy", "Hopeful",
  "Shy", "Playful", "Serious", "Calm", "Cheerful", "Bored", "Confused", "Energetic",

  // looks & size
  "Giant", "Tiny", "Tall", "Short", "Round", "Square", "Thin", "Fat", "Fluffy", "Smooth",
  "Spiky", "Fuzzy", "Glowing", "Shiny", "Rusty", "Colorful", "Pale", "Bright", "Dark",
  "Striped", "Spotted", "Transparent", "Metallic", "Golden", "Silver", "Wooden", "Plastic",

  // personality or behavior
  "Friendly", "Grumpy", "Sneaky", "Clever", "Clumsy", "Polite", "Loud", "Quiet",
  "Funny", "Serious", "Smart", "Silly", "Gentle", "Wild", "Greedy", "Kind", "Lazy", "Bold",

  // light creative ones (few “vibe” adjectives to keep rare spice)
  "Ancient", "Frozen", "Burning", "Dreamy", "Magic", "Flying", "Invisible", "Floating",
  "Underwater", "Electric", "Rainbow", "Shadowy"],
    
   subjects: [
	  // animals
	  "Cat", "Dog", "Bird", "Fish", "Elephant", "Lion", "Tiger", "Monkey", "Rabbit",
	  "Bear", "Fox", "Panda", "Horse", "Frog", "Penguin", "Dolphin", "Giraffe", "Sheep",
	  "Chicken", "Pig", "Duck", "Bee", "Butterfly", "Snake", "Turtle",

	  // people & roles
	  "Wizard", "Knight", "Pirate", "Ninja", "Astronaut", "Chef", "Doctor", "Farmer",
	  "Teacher", "Artist", "Detective", "Soldier", "Robot", "Alien", "Ghost", "Clown",
	  "Superhero", "Ballerina", "Magician", "Explorer", "King", "Queen", "Thief", "Scientist",

	  // objects & items
	  "Car", "Bicycle", "Rocket", "Train", "Boat", "Airplane", "Umbrella", "Clock", "Candle",
	  "Book", "Computer", "Camera", "Telephone", "Guitar", "Piano", "Drum", "Balloon",
	  "Cupcake", "Ice Cream", "Pizza", "Burger", "Cake", "Sandwich", "Donut", "Cookie",

	  // nature & things
	  "Tree", "Flower", "Mountain", "Cloud", "Star", "Sun", "Moon", "Rainbow", "Volcano",
	  "River", "Ocean", "Island", "Snowman", "Fire", "Leaf",

	  // fantasy & special
	  "Dragon", "Unicorn", "Mermaid", "Fairy", "Zombie", "Monster", "Robot Cat", "Talking Fish",
	  "Time Traveler", "Giant Snail", "Baby Dinosaur"
	],

  actions: [
	  // simple everyday actions
	  "Sleeping", "Eating", "Running", "Jumping", "Dancing", "Singing", "Reading",
	  "Writing", "Drawing", "Laughing", "Crying", "Smiling", "Thinking", "Walking",
	  "Talking", "Watching TV", "Cooking", "Playing", "Listening to music", "Cleaning",

	  // outdoor / movement
	  "Flying", "Swimming", "Climbing", "Skating", "Skiing", "Surfing", "Hiking",
	  "Riding a bike", "Riding a horse", "Driving a car", "Sailing a boat",
	  "Fishing", "Camping", "Running through the forest", "Jumping over a fence",

	  // imaginative & fun
	  "Dancing in the rain", "Flying a kite", "Painting the sky", "Sleeping on a cloud",
	  "Sitting on the moon", "Chasing stars", "Talking to animals", "Eating ice cream in space",
	  "Time traveling", "Building a robot", "Casting a spell", "Playing chess with a ghost",
	  "Swimming with dolphins", "Exploring a volcano", "Hiding under a rainbow",
	  "Planting magical seeds", "Floating in zero gravity", "Cooking pizza underwater",

	  // artistic & calm
	  "Meditating", "Gardening", "Writing a letter", "Making origami",
	  "Painting a sunset", "Watching the ocean", "Taking a photo", "Playing the piano",

	  // silly & cute
	  "Juggling", "Sneezing", "Snoring", "Spinning around", "Tickling someone",
	  "Eating noodles", "Blowing bubbles", "Wearing funny glasses", "Building a sandcastle",

	  // duo or scene actions
	  "Arguing", "Hugging", "Helping", "Teaching", "Chasing", "Racing", "Fighting",
	  "Playing catch", "Sharing food", "Dancing together", "Running away", "Celebrating"
	]

};
	
const timers = { easy: 40, hard: 60, difficult : 90, pro: 120 };

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
    this.prompt = '';

    this.startGame();
  }

  // Mad Libs topic generator (No AI)
  generateTopic() {
    const { adjectives, subjects, actions, places } = wordLists;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const getArticle = w => /^[aeiou]/i.test(w) ? 'An' : 'A';

    let topic = '';
    const difficulty = this.difficulty.toLowerCase();

    // --- pick english words based on difficulty ---
    let adj = '', sub = '', act = '', tone = '', place = '';

    switch (difficulty) {
      case 'easy':
        sub = pick(subjects);
        break;
      case 'hard':
        adj = pick(adjectives);
        sub = pick(subjects);
        break;
      case 'difficult':
        adj = pick(adjectives);
        sub = pick(subjects);
        act = pick(actions);
      break;
      case 'pro': 
      default:
        adj = pick(adjectives);
        sub = pick(subjects);
        act = pick(actions);
        if (Math.random() < 0.5) tone = pick(["Retro", "Futuristic", "Fantasy", "Cyberpunk", "Cartoonish"]);
        if (Math.random() < 0.9 && places) place = pick(places);
        break;
    }

    // --- construct the topic string based on language ---
    if (this.lang === 'ja') {
        // --- Japanese Mode ---
        const adj_ja = wordTranslations[adj] || adj;
        const sub_ja = wordTranslations[sub] || sub;
        const act_ja = wordTranslations[act] || act;
        
        //japanese grammar rules (Adjective + Noun + ga + Verb)
        let parts = [];
        if (adj_ja) parts.push(adj_ja);
        if (sub_ja) parts.push(sub_ja);
        
        let subjectPart = parts.join('');
        
        if (act_ja) {
            topic = `${subjectPart}が${act_ja}`;
        } else {
            topic = subjectPart;
        }
        topic = `「${topic}」`; //japanese quotes for style

    } else {
        // --- english Mode ---
        let mainPhrase = '';
        if (adj && sub && act) mainPhrase = `${adj} ${sub} ${act}`;
        else if (adj && sub) mainPhrase = `${adj} ${sub}`;
        else if (sub) mainPhrase = `${sub}`;

        topic = `${getArticle(mainPhrase)} ${mainPhrase}`;
        if (tone) topic = `${getArticle(tone)} ${tone} ${topic.split(' ').slice(1).join(' ')}`;
        if (place) topic += ` ${place}`;
    }

    //rare mutation for fun that freaking works for both languages conceptually coz im a genius lol jk im fked
    if (Math.random() < 0.01) {
        const sub2 = pick(subjects);
        if (this.lang === 'ja') {
            const sub2_ja = wordTranslations[sub2] || sub2;
            topic += ` と ${sub2_ja}`;
        } else {
            topic += ` and ${getArticle(sub2)} ${sub2}`;
        }
    }

    console.log(`Generated topic (${this.difficulty}, ${this.lang}): ${topic}`);
    return topic;
  }

  //keyword-Based Scoring (No AI)
  async getAIScore(base64Image, prompt) {
    console.log('Running keyword-based analysis for prompt:', prompt);
    const colorMap = {
        red: [255, 0, 0], yellow: [255, 255, 0], blue: [0, 0, 255],
        green: [0, 128, 0], orange: [255, 165, 0], purple: [128, 0, 128]
    };
    let score = 40;
    let feedback = "A good collaborative effort! ";
    try {
        const image = await loadImage(base64Image);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const totalPixels = pixels.length / 4;
        let promptColorsFound = 0;

        for (const colorName in colorMap) {
            if (prompt.toLowerCase().includes(colorName)) {
                promptColorsFound++;
                let colorPixelCount = 0;
                const targetRgb = colorMap[colorName];
                for (let i = 0; i < pixels.length; i += 4) {
                    const distance = Math.sqrt(
                        Math.pow(pixels[i] - targetRgb[0], 2) +
                        Math.pow(pixels[i+1] - targetRgb[1], 2) +
                        Math.pow(pixels[i+2] - targetRgb[2], 2)
                    );
                    if (distance < 120) colorPixelCount++;
                }
                if ((colorPixelCount / totalPixels) * 100 > 3) {
                    score += 50 / promptColorsFound; //give up to 50 bonus points for color matching
                    feedback += `Excellent use of ${colorName}! `;
                } else {
                    feedback += `I was hoping to see more ${colorName}. `;
                }
            }
        }
        if (promptColorsFound === 0) {
            score += Math.floor(Math.random() * 21) + 10; //add 10-30 random points if no color
            feedback += "Looks very creative!";
        }
    } catch (err) {
        console.error("Error processing image for scoring:", err);
        return { score: 50, feedback: "Error analyzing the drawing." };
    }
    return { score: Math.floor(Math.min(score, 99)), feedback: feedback.trim() };
  }

  startGame() {
    this.prompt = this.generateTopic(); //use the new topic generator
    this.timeLimit = timers[this.difficulty] || timers['easy'];
    const { layout, segments } = this.calculateSegments(this.players.length);
    
    this.io.to(this.roomId).emit('startGame', 'DrawingGameScene', this.prompt, {
        timeLimit: this.timeLimit,
        segments: segments,
        layout: layout,
        playerCount: this.players.length
    });
    console.log(`Co-op Drawing started in room ${this.roomId} with prompt: "${this.prompt}"`);
    this.gameTimer = setTimeout(() => { this.endGame(); }, this.timeLimit * 1000);
  }
  
  //functions below remain unchanged
  calculateSegments(playerCount) {
    let segments = [];
    let gridTemplateAreas = '';
    let gridTemplateColumns = '1fr';
    let gridTemplateRows = '1fr';
    switch (playerCount) {
      case 1: gridTemplateAreas = '"a"'; segments = [{ segmentIndex: 0, area: 'a' }]; break;
      case 2: gridTemplateColumns = '1fr 1fr'; gridTemplateAreas = '"a b"'; segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }]; break;
      case 3: gridTemplateColumns = '1fr 1fr'; gridTemplateRows = '1fr 1fr'; gridTemplateAreas = '"a b" "c c"'; segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }]; break;
      case 4: gridTemplateColumns = '1fr 1fr'; gridTemplateRows = '1fr 1fr'; gridTemplateAreas = '"a b" "c d"'; segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }, { segmentIndex: 3, area: 'd' }]; break;
      case 5: gridTemplateColumns = '1fr 1fr 1fr'; gridTemplateRows = '1fr 1fr'; gridTemplateAreas = '"a b c" "d e e"'; segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }, { segmentIndex: 3, area: 'd' }, { segmentIndex: 4, area: 'e' }]; break;
      case 6: gridTemplateColumns = '1fr 1fr 1fr'; gridTemplateRows = '1fr 1fr'; gridTemplateAreas = '"a b c" "d e f"'; segments = [{ segmentIndex: 0, area: 'a' }, { segmentIndex: 1, area: 'b' }, { segmentIndex: 2, area: 'c' }, { segmentIndex: 3, area: 'd' }, { segmentIndex: 4, area: 'e' }, { segmentIndex: 5, area: 'f' }]; break;
      default: gridTemplateColumns = '1fr 1fr'; gridTemplateRows = '1fr 1fr 1fr 1fr'; gridTemplateAreas = '"a b" "c d" "e f" "g g"'; for (let i = 0; i < playerCount; i++) { segments.push({ segmentIndex: i, area: String.fromCharCode(97 + i) }); } break;
    }
    const assignedSegments = segments.map((seg, index) => ({ ...seg, playerId: this.players[index]?.id || null }));
    return { layout: { gridTemplateAreas, gridTemplateColumns, gridTemplateRows }, segments: assignedSegments };
  }

  handleDrawing(playerId, canvasData) {
    this.playerCanvases[playerId] = canvasData;
    this.io.to(this.roomId).emit('drawingUpdate', { playerId, canvasData });
  }

  async endGame() {
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
    console.log(`Game ended in room ${this.roomId}. Evaluating drawing...`);

    // --- server assembles the final image ---
    this.io.to(this.roomId).emit('evaluatingDrawing'); //tell clients to show "Evaluating..."

    const { layout, segments } = this.calculateSegments(this.players.length);
    const playerCount = this.players.length;

    let cols = 1, rows = 1;
    if (layout.gridTemplateColumns) cols = layout.gridTemplateColumns.split(' ').length;
    if (layout.gridTemplateRows) rows = layout.gridTemplateRows.split(' ').length;
    
    //for irregular grids (like 3 or 5 players) parse the areas to get dimensions
    if (playerCount === 3 || playerCount === 5 || playerCount > 6) {
        const areas = layout.gridTemplateAreas.replace(/"/g, '').split(' ');
        rows = areas.length;
        cols = areas[0].length;
    }

    const segmentWidth = 500; 
    const segmentHeight = 500; 
    const finalCanvas = createCanvas(segmentWidth * cols, segmentHeight * rows);
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.fillStyle = '#FFFFFF';
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    const promises = segments.map(async (seg, index) => {
        const playerData = this.playerCanvases[seg.playerId];
        if (!playerData) return;

        const col = index % cols;
        const row = Math.floor(index / cols);

        //for complex layouts, more advanced mapping based on grid-area
        const x = col * segmentWidth;
        const y = row * segmentHeight;

        const image = await loadImage(playerData);
        finalCtx.drawImage(image, x, y, segmentWidth, segmentHeight);
    });

    await Promise.all(promises);
    
    this.handleSubmit(finalCanvas.toDataURL());
  }

  async handleSubmit(finalImage) {
      const result = await this.getAIScore(finalImage, this.prompt);
      this.io.to(this.roomId).emit('gameEnded', {
          prompt: this.prompt,
          finalImage: finalImage,
          score: result.score,
          feedback: result.feedback,
          difficulty: this.difficulty
      });
      setTimeout(() => {
        if (this.onGameEnd) { this.onGameEnd(); }
      }, 8000); 
  }
}

module.exports = CooperativeDrawing;
