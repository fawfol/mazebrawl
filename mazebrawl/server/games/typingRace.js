// mazebrawl/server/games/typingRace.js

const enSentences = [
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
  "Happiness is not something readymade rather it comes from your own actions",
  "Knowledge is power but applied knowledge is freedom",
  "Dream big and dare to fail spectacularly",
  "Imagination is more important than knowledge",
  "Do one thing every day that scares you",
  "Strive not to be a success, but rather to be of value",
  "Small steps in the right direction can turn out to be the biggest steps of your life",
  "Quality is not an act but it is a habit",
  "Action is the foundational key to all success",
  "The only limit to our realization of tomorrow is our doubts of today",
  "A person who never made a mistake never tried anything new",
  "Simplicity is the ultimate sophistication",
  "Do not go where the path may lead, go instead where there is no path and leave a trail",
  "Success usually comes to those who are too busy to be looking for it",
  "Believe you can and you are halfway there",
  "Great minds discuss ideas; average minds discuss events; small minds discuss people",
  "Do what you can, with what you have, where you are",
  "The harder you work for something, the greater you'll feel when you achieve it",
  "Don't watch the clock, do what it does and keep going",
  "Sometimes later becomes might turn to never so do it now",
  "The man who moves a mountain begins by carrying away small stones",
  "Little by little, one travels far Dream it Wish it Do it",
  "If opportunity doesn't knock, build a door",
  "Your limitation is just your own imagination",
  "Push yourself, because no one else is going to do it for you",
  "Great things never come from comfort zones",
  "Success is not in what you have but who you become",
  "The expert in anything was once a beginner",
  "Don't wait for the perfect moment. Take the moment and make it perfect",
  "Everything you’ve ever wanted is on the other side of fear",
  "You are braver than you believe, stronger than you seem, and smarter than you think",
  "The way to get started is to quit talking and begin doing",
  "Life is ten percent what happens to us and ninety percent how we react to it",
  "Do what you love and you will never work a day in your life",
  "Time you enjoy wasting is not wasted time",
  "Do not let what you cannot do interfere with what you can do",
  "Hustle in silence and let your success make the noise",
  "Opportunities are usually disguised as hard work",
  "Success is walking from failure to failure with no loss of enthusiasm",
  "Do thing that feels right not what feels easy",
  "Courage is resistance to fear, mastery of fear, not absence of fear",
  "Hard work beats talent when talent doesn't work hard",
  "A goal without a plan is just a wish",
  "Strive for progress and not perfection in an imperfect world",
  "Motivation is what gets you started, habit is what keeps you going",
  "Every day is a new beginning so take a deep breath and start again",
  "Don't limit your challenges rather challenge your limits",
];
const jaSentences = [
  	"なぜ 鶏 は 道路 を 渡った のか",
	"素早い 茶色 の 狐 が 怠け者 の 犬 を 飛び越える",
	"良い 本 の 力 を 決して 見くびって は いけない",
	"テンジン カルサン は とても ハンサム で 心優しい 少年 です",
	"テクノロジー は 私たち の 生活 と 仕事 の 仕方 に 革命 を もたらしました",
	"千里 の 道 も 一歩 から",
	"創造性 とは 知性 が 楽しんでいる ことである",
	"学び は 決して 心 を 疲れさせる ことなく、むしろ それ を 活性化 させる",
	"継続 は あらゆる 新しい スキル を 習得 する ため の 鍵 です",
	"転がる 石 に 苔 は 生えぬ、しかし 好奇心 は 知識 を 集める",
	"挑戦 が 人生 を 面白く し、それ を 乗り越える こと が 人生 を 意味深い もの に する",
	"イノベーション が リーダー と フォロワー を 区別 する",	
	"打たなかった シュート は 100% 外れる",	
	"成功 とは 日々 繰り返される 小さな 努力 の 積み重ね である",
	"すべて の 達成 は 挑戦 する という 決断 から 始まる",
	"鉄 は 熱い うち に 打て と 待つな。打つ こと で 鉄 を 熱く せよ",
	"未来 を 予測 する 最善 の 方法 は、それ を 創造 する ことだ",
	"チャンス は 偶然 やってくる ものではない。自分 で 作り出す ものだ",
	"幸福 とは 既製品 ではない。むしろ 自分 自身 の 行動 から 生まれる ものだ",
	"知識 は 力 なり。しかし 応用 された 知識 は 自由 なり",
	"大きな 夢 を 抱き、見事に 失敗 する 勇気 を 持て",
	"想像力 は 知識 より も 重要 である",
	"毎日 一つ、自分 が 怖い と 思う こと を しなさい",
	"成功者 に なる こと を 目指す のではなく、価値 の ある 人間 に なる こと を 目指しなさい",
	"正しい 方向 へ の 小さな 一歩 が、人生 最大 の 一歩 に なる こと も ある",
	"品質 とは 行為 ではなく 習慣 である",
	"行動 こそ が すべて の 成功 の 基礎 と なる 鍵 である",
	"明日 の 実現 を 妨げる 唯一 の 限界 は、今日 の 我々 の 疑い である",
	"一度 も 間違い を した こと が ない 人 は、何も 新しい こと に 挑戦 した こと が ない 人 だ",
	"シンプルさ は 究極 の 洗練 である",
	"道 が ある ところ に 行く のではなく、道 が ない ところ に 行き、足跡 を 残せ",
	"成功 は 普通、それ を 探す のに 忙しすぎる 人々 の もと へ やってくる",
	"できる と 信じれば、もう 半分 は 終わっている",
	"偉大な 心 は アイデア を 語り、平凡な 心 は 出来事 を 語り、小さな 心 は 他人 の こと を 語る",
	"あなた が いる 場所 で、あなた が 持っている もの を 使って、あなた が できる こと を しなさい",
	"何か の ため に 懸命に 努力 すれば するほど、達成 した とき の 喜び は 大きくなる",
	"時計 を 見るな。時計 と 同じように 動き続けろ",
	"時には「後で」が「決してない」に なる こと も ある。だから 今 すぐ やれ",
	"山 を 動かす 者 も、最初は 小さな 石 を 運び出す こと から 始める",
	"少しずつ、人は 遠くへ 旅 を する 夢見て、願って、実行 せよ",
	"機会 が ノック して こない なら、ドア を 作れば いい",
	"あなた の 限界 は、あなた 自身 の 想像力 だけ だ",
	"自分 を 追い込め。他 の 誰も あなた の ため に は やってくれない",
	"素晴らしい もの は 決して 快適な 場所 からは 生まれない",
	"成功 とは 何 を 持っている か ではなく、どんな 人間 に なる か だ",
	"どんな 分野 の 専門家 も、かつては 初心者 だった",
	"完璧な 瞬間 を 待つな。その 瞬間 を 掴み、完璧な もの に しろ",
	"あなた が 今まで 欲しかった もの すべて は、恐怖 の 向こう側 に ある",
	"あなた は 自分 が 信じている より も 勇敢 で、見た目 より も 強く、思っている より も 賢い",
	"物事 を 始める 方法 は、話す の を やめて 行動 し 始める ことだ",
	"人生 とは、我々 に 起こる こと が 10 パーセント で、それ に どう 反応 する か が 90 パーセント である",
	"好き な こと を 仕事 に すれば、一生 働く こと は ないだろう",
	"楽しんで 無駄に した 時間 は、無駄な 時間 ではない",
	"できない こと に、できる こと を 邪魔 させては いけない",
	"静かに 努力 し、成功 に 騒がせろ",
	"機会 は 通常、大変な 努力 という 服 を 着ている",
	"成功 とは、情熱 を 失う ことなく 失敗 から 失敗 へ と 歩き続ける ことである",
	"簡単だと 感じる こと ではなく、正しい と 感じる こと を しなさい",
	"勇気 とは 恐怖 へ の 抵抗、恐怖 の 克服 であり、恐怖 が ない こと ではない",
	"才能 が 努力 しない とき、努力 が 才能 を 打ち負かす",
	"計画 の ない 目標 は、ただ の 願い事 に すぎない",
	"不完全な 世界 で、完璧 ではなく 進歩 を 目指しなさい",
	"モチベーション が あなた を 始め させ、習慣 が あなた を 続け させる",
	"毎日 が 新しい 始まり だから、深呼吸 して もう一度 始めよう",
	"挑戦 を 制限 するな、むしろ 自分 の 限界 に 挑戦 しろ"
];

class TypingRace {
  constructor(io, roomId, players, lang= 'en') {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.lang=lang;
    this.progress = {}; // { playerId: 0..1 }
    this.scores = {}; // total scores
    this.round = 1;
    this.maxRounds = 5;
    this.roundTimer = null; // A timer to enforce the time limit

    players.forEach((p) => {
      this.progress[p.id] = 0;
      this.scores[p.id] = 0;
    });

    this.setupSocketListeners();
    this.startRound();
  }

  setupSocketListeners() {
    // can add additional per-game listeners here if needed
  }

  startRound() {
    //directly get a sentence from the local list
    let sentence = (this.lang === 'ja')
      ? jaSentences[Math.floor(Math.random() * jaSentences.length)]
      : enSentences[Math.floor(Math.random() * enSentences.length)];

    this.sentence = sentence;

    // Calculate the time limit based on sentence length
    const letterCount = sentence.replace(/\s/g, '').length;
    const timeLimit = Math.ceil(letterCount * 1.2); // 1.2 is the 20% buffer

    // reset per-round state
    this.progress = {};
    this.finishOrder = [];
    this.players.forEach((p) => (this.progress[p.id] = 0));

    // broadcast to all players in room
    this.io.to(this.roomId).emit('startGame', 'TypingRace', this.sentence, {
      round: this.round,
      maxRounds: this.maxRounds,
      timeLimit: timeLimit, // send the time limit to the client
    });

    // Start the server-side timer for this round
    this.roundTimer = setTimeout(() => {
      this.handleTimeOut();
    }, timeLimit * 1000);

    // also emit initial progress for new/late joining players
    this.io
      .to(this.roomId)
      .emit('updateProgress', { playerId: null, progress: this.progress });
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
      else points = 0; //no points for 4th place and below

      this.scores[playerId] += points;
    }

    if (this.finishOrder.length === this.players.length) {
      clearTimeout(this.roundTimer); // Stop the timer if everyone finishes early
      this.endRound();
    }
  }

  // Handle players who time out
  handleTimeOut() {
    console.log(`Round timed out in room ${this.roomId}`);
    this.players.forEach((p) => {
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
      finishOrder: this.finishOrder,
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
    return defaultSentences[
      Math.floor(Math.random() * defaultSentences.length)
    ];
  }
}

module.exports = TypingRace;
