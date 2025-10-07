// mazebrawl/server/games/CooperativeDrawing.js

const { createCanvas, loadImage } = require('canvas');
const DrawingAnalyzer = require('./DrawingAnalyzer');

// --- Word Lists For Topic Generation ---
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

const jpMap = {
  adjectives: {
    // Basic emotions
    "Happy": "うれしい",
    "Sad": "かなしい",
    "Angry": "おこっている",
    "Excited": "わくわくした",
    "Lonely": "さびしい",
    "Curious": "こうきしんな",
    "Peaceful": "おだやかな",
    "Scared": "こわがっている",
    "Brave": "ゆうかんな",
    "Nervous": "きんちょうした",
    "Sleepy": "ねむい",
    "Surprised": "おどろいた",
    "Proud": "ほこらしい",
    "Jealous": "うらやましい",
    "Lazy": "なまけものの",
    "Hopeful": "きぼうにみちた",
    "Shy": "はずかしがりやの",
    "Playful": "あそびずきの",
    "Serious": "まじめな",
    "Calm": "おだやかな",
    "Cheerful": "あかるい",
    "Bored": "たいくつな",
    "Confused": "まよっている",
    "Energetic": "げんきな",

    // Size & appearance
    "Giant": "巨大な",
    "Tiny": "とても小さな",
    "Tall": "せの高い",
    "Short": "せの低い",
    "Round": "まるい",
    "Square": "しかくい",
    "Thin": "ほそい",
    "Fat": "ふとった",
    "Fluffy": "ふわふわの",
    "Smooth": "なめらかな",
    "Spiky": "とげとげしい",
    "Fuzzy": "もじゃもじゃの",
    "Glowing": "かがやく",
    "Shiny": "ピカピカの",
    "Rusty": "さびた",
    "Colorful": "いろとりどりの",
    "Pale": "あわい",
    "Bright": "あかるい",
    "Dark": "くらい",
    "Striped": "しましまの",
    "Spotted": "ぶちの",
    "Transparent": "とうめいな",
    "Metallic": "きんぞくの",
    "Golden": "きんいろの",
    "Silver": "ぎんいろの",
    "Wooden": "きでできた",
    "Plastic": "プラスチックの",

    // Personality or behavior
    "Friendly": "しんせつな",
    "Grumpy": "きげんのわるい",
    "Sneaky": "こっそりした",
    "Clever": "かしこい",
    "Clumsy": "ぶきような",
    "Polite": "れいぎただしい",
    "Loud": "うるさい",
    "Quiet": "しずかな",
    "Funny": "おもしろい",
    "Smart": "かしこい",
    "Silly": "ばかげた",
    "Gentle": "やさしい",
    "Wild": "やせいの",
    "Greedy": "よくばりな",
    "Kind": "しんせつな",
    "Bold": "ゆうかんな",

    // Creative / vibe adjectives
    "Ancient": "こだいの",
    "Frozen": "こおった",
    "Burning": "もえている",
    "Dreamy": "ゆめのような",
    "Magic": "まほうの",
    "Flying": "とんでいる",
    "Invisible": "みえない",
    "Floating": "ういている",
    "Underwater": "すいちゅうの",
    "Electric": "でんきの",
    "Rainbow": "にじいろの",
    "Shadowy": "かげのような",
    "Orange": "オレンジの",
    "Purple": "むらさきの",
    "Yellow": "きいろい",
    "Blue": "あおい",
    "Red": "あかい",
    "Green": "みどりの"
  },
	  
	 subjects : {
	  "Cat": "ネコ",
	  "Dog": "イヌ",
	  "Bird": "トリ",
	  "Fish": "サカナ",
	  "Elephant": "ゾウ",
	  "Lion": "ライオン",
	  "Tiger": "トラ",
	  "Monkey": "サル",
	  "Rabbit": "ウサギ",
	  "Bear": "クマ",
	  "Fox": "キツネ",
	  "Panda": "パンダ",
	  "Horse": "ウマ",
	  "Frog": "カエル",
	  "Penguin": "ペンギン",
	  "Dolphin": "イルカ",
	  "Giraffe": "キリン",
	  "Sheep": "ヒツジ",
	  "Chicken": "ニワトリ",
	  "Pig": "ブタ",
	  "Duck": "アヒル",
	  "Bee": "ハチ",
	  "Butterfly": "チョウ",
	  "Snake": "ヘビ",
	  "Turtle": "カメ",

	  "Wizard": "魔法使い",
	  "Knight": "騎士",
	  "Pirate": "海賊",
	  "Ninja": "忍者",
	  "Astronaut": "宇宙飛行士",
	  "Chef": "シェフ",
	  "Doctor": "医者",
	  "Farmer": "農夫",
	  "Teacher": "先生",
	  "Artist": "芸術家",
	  "Detective": "探偵",
	  "Soldier": "兵士",
	  "Robot": "ロボット",
	  "Alien": "エイリアン",
	  "Ghost": "幽霊",
	  "Clown": "ピエロ",
	  "Superhero": "スーパーヒーロー",
	  "Ballerina": "バレリーナ",
	  "Magician": "マジシャン",
	  "Explorer": "探検家",
	  "King": "王さま",
	  "Queen": "女王",
	  "Thief": "どろぼう",
	  "Scientist": "科学者",

	  "Car": "車",
	  "Bicycle": "自転車",
	  "Rocket": "ロケット",
	  "Train": "電車",
	  "Boat": "船",
	  "Airplane": "ひこうき",
	  "Umbrella": "かさ",
	  "Clock": "時計",
	  "Candle": "ろうそく",
	  "Book": "本",
	  "Computer": "コンピューター",
	  "Camera": "カメラ",
	  "Telephone": "電話",
	  "Guitar": "ギター",
	  "Piano": "ピアノ",
	  "Drum": "ドラム",
	  "Balloon": "ふうせん",
	  "Cupcake": "カップケーキ",
	  "Ice Cream": "アイスクリーム",
	  "Pizza": "ピザ",
	  "Burger": "ハンバーガー",
	  "Cake": "ケーキ",
	  "Sandwich": "サンドイッチ",
	  "Donut": "ドーナツ",
	  "Cookie": "クッキー",

	  "Tree": "木",
	  "Flower": "花",
	  "Mountain": "山",
	  "Cloud": "雲",
	  "Star": "星",
	  "Sun": "太陽",
	  "Moon": "月",
	  "Rainbow": "にじ",
	  "Volcano": "火山",
	  "River": "川",
	  "Ocean": "海",
	  "Island": "島",
	  "Snowman": "雪だるま",
	  "Fire": "火",
	  "Leaf": "葉",

	  "Dragon": "ドラゴン",
	  "Unicorn": "ユニコーン",
	  "Mermaid": "人魚",
	  "Fairy": "妖精",
	  "Zombie": "ゾンビ",
	  "Monster": "モンスター",
	  "Robot Cat": "ロボットネコ",
	  "Talking Fish": "話すサカナ",
	  "Time Traveler": "時間旅行者",
	  "Giant Snail": "巨大なカタツムリ",
	  "Baby Dinosaur": "赤ちゃん恐竜"
	},
	actions : {
	  "Sleeping": "ねている",
	  "Eating": "食べている",
	  "Running": "走っている",
	  "Jumping": "ジャンプしている",
	  "Dancing": "おどっている",
	  "Singing": "歌っている",
	  "Reading": "読んでいる",
	  "Writing": "書いている",
	  "Drawing": "絵をかいている",
	  "Laughing": "わらっている",
	  "Crying": "泣いている",
	  "Smiling": "ほほえんでいる",
	  "Thinking": "考えている",
	  "Walking": "歩いている",
	  "Talking": "話している",
	  "Watching TV": "テレビを見ている",
	  "Cooking": "料理している",
	  "Playing": "遊んでいる",
	  "Listening to music": "音楽を聴いている",
	  "Cleaning": "掃除している",

	  "Flying": "飛んでいる",
	  "Swimming": "泳いでいる",
	  "Climbing": "登っている",
	  "Skating": "スケートしている",
	  "Skiing": "スキーしている",
	  "Surfing": "サーフィンしている",
	  "Hiking": "ハイキングしている",
	  "Riding a bike": "自転車に乗っている",
	  "Riding a horse": "馬に乗っている",
	  "Driving a car": "車を運転している",
	  "Sailing a boat": "船を操縦している",
	  "Fishing": "釣りをしている",
	  "Camping": "キャンプしている",
	  "Running through the forest": "森を走っている",
	  "Jumping over a fence": "フェンスを飛び越えている",

	  "Dancing in the rain": "雨の中で踊っている",
	  "Flying a kite": "たこあげをしている",
	  "Painting the sky": "空に絵を描いている",
	  "Sleeping on a cloud": "雲の上で寝ている",
	  "Sitting on the moon": "月に座っている",
	  "Chasing stars": "星を追いかけている",
	  "Talking to animals": "動物と話している",
	  "Eating ice cream in space": "宇宙でアイスを食べている",
	  "Time traveling": "時間旅行をしている",
	  "Building a robot": "ロボットを作っている",
	  "Casting a spell": "魔法をかけている",
	  "Playing chess with a ghost": "幽霊とチェスをしている",
	  "Swimming with dolphins": "イルカと泳いでいる",
	  "Exploring a volcano": "火山を探検している",
	  "Hiding under a rainbow": "虹の下に隠れている",
	  "Planting magical seeds": "魔法の種を植えている",
	  "Floating in zero gravity": "無重力で浮かんでいる",
	  "Cooking pizza underwater": "水中でピザを作っている",

	  "Meditating": "瞑想している",
	  "Gardening": "庭仕事をしている",
	  "Writing a letter": "手紙を書いている",
	  "Making origami": "折り紙を作っている",
	  "Painting a sunset": "夕日を描いている",
	  "Watching the ocean": "海を見ている",
	  "Taking a photo": "写真を撮っている",
	  "Playing the piano": "ピアノを弾いている",

	  "Juggling": "ジャグリングしている",
	  "Sneezing": "くしゃみをしている",
	  "Snoring": "いびきをかいている",
	  "Spinning around": "くるくる回っている",
	  "Tickling someone": "だれかをくすぐっている",
	  "Eating noodles": "麺を食べている",
	  "Blowing bubbles": "シャボン玉を吹いている",
	  "Wearing funny glasses": "おかしなメガネをかけている",
	  "Building a sandcastle": "砂の城を作っている",

	  "Arguing": "口げんかしている",
	  "Hugging": "抱き合っている",
	  "Helping": "助けている",
	  "Teaching": "教えている",
	  "Chasing": "追いかけている",
	  "Racing": "レースしている",
	  "Fighting": "戦っている",
	  "Playing catch": "キャッチボールをしている",
	  "Sharing food": "食べ物を分け合っている",
	  "Dancing together": "一緒に踊っている",
	  "Running away": "逃げている",
	  "Celebrating": "お祝いしている"
	}
};



	
const timers = { easy: 60, hard: 90, difficult : 120, pro: 160 };

class CooperativeDrawing {

  constructor(io, roomId, players, lang = 'en', onGameEnd, difficulty = 'easy') {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.lang = lang;
    this.onGameEnd = onGameEnd;
    this.difficulty = difficulty;
	this.analyzer = new DrawingAnalyzer();
    this.playerCanvases = {};
    this.gameTimer = null;
    this.prompt = '';
    this.englishPrompt = '';

    //this.startGame();
  }

	//translation handler
	async translateTopic(text, targetLang) {
	  if (targetLang !== 'ja') return text;

	  try {
		//split the English topic into parts
		const words = text.replace(/^A[n]?\s+/i, '').split(' ');

		let adj = null, sub = null, act = null;

		//match words against our dictionary maps
		for (const word of words) {
		  if (jpMap.adjectives[word]) adj = jpMap.adjectives[word];
		  if (jpMap.subjects[word]) sub = jpMap.subjects[word];
		  if (jpMap.actions[word]) act = jpMap.actions[word];
		}

		//cconstruct Japanese sentence pattern
		//base structure: "<subject> が <adjective> です" or "<subject> が <action>"
		let phrase = '';

		if (sub && act) {
		  phrase = `${sub}が${act}`;
		} else if (adj && sub) {
		  phrase = `${adj}${sub}`;
		} else if (sub) {
		  phrase = sub;
		} else {
		  phrase = text; //fallback
		}

		return phrase;
	  } catch (err) {
		console.error("Japanese translation error:", err);
		return text;
	  }
	}


  // Mad Libs topic generator (No AI)
  async generateTopic() {
    const { adjectives, subjects, actions } = wordLists;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];
    const getArticle = w => /^[aeiou]/i.test(w) ? 'An' : 'A';

    const difficulty = this.difficulty.toLowerCase();

    //
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
        if (wordLists.places && Math.random() < 0.9) place = pick(wordLists.places);
        break;
    }

    // --- construct the English topic string ---
    let mainPhrase = '';
    if (adj && sub && act) mainPhrase = `${adj} ${sub} ${act}`;
    else if (adj && sub) mainPhrase = `${adj} ${sub}`;
    else if (sub) mainPhrase = `${sub}`;

    let topic = `${getArticle(mainPhrase)} ${mainPhrase}`;
    if (tone) topic = `${getArticle(tone)} ${tone} ${topic.split(' ').slice(1).join(' ')}`;
    if (place) topic += ` in ${place}`; // added "in" for better phrasing
    
    this.englishPrompt = topic;

    // --- translate the final topic if needed ---
    const finalTopic = await this.translateTopic(topic, this.lang);

    console.log(`Generated topic (${this.difficulty}, ${this.lang}): ${finalTopic}`);
    return finalTopic;
  }

  //keyword-Based Scoring (No AI)
  async getDrawingScore(base64Image, prompt) {
    console.log("Delegating analysis to DrawingAnalyzer for:", prompt);
    try {
        const result = await this.analyzer.analyzeDrawing(base64Image, prompt);
        return result;
    } catch (err) {
        console.error("Drawing analysis failed:", err);
        return {
            score: 30, // Default score on error
            feedback: "There was an error analyzing the drawing.",
            breakdown: {}
        };
    }
  }

  async initialize() {
    this.prompt = await this.generateTopic(); // using await here
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
    const result = await this.getDrawingScore(finalImage, this.englishPrompt); 
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
