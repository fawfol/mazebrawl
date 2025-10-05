// mazebrawl/server/games/typingRace.js

const enSentences = [
	"WHY DID THE CHICKEN CROSSED THE ROAD",
	"THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
	"NEVER UNDERESTIMATE THE POWER OF A GOOD BOOK",
	"TENZIN KALSANG IS A VERY GOOD LOOKING AND A KIND HEARTED BOY",
	"TECHNOLOGY HAS REVOLUTIONIZED THE WAY WE LIVE AND WORK",
	"THE JOURNEY OF A THOUSAND MILES BEGINS WITH A SINGLE STEP",
	"CREATIVITY IS INTELLIGENCE HAVING FUN IN UNEXPECTED WAYS",
	"LEARNING NEVER EXHAUSTS THE MIND IT ONLY FUELS IT",
	"PERSISTENCE IS THE KEY TO MASTERING ANY NEW SKILL",
	"A ROLLING STONE GATHERS NO MOSS, BUT CURIOSITY GATHERS KNOWLEDGE",
	"CHALLENGES ARE WHAT MAKE LIFE INTERESTING AND OVERCOMING THEM IS WHAT MAKES LIFE MEANINGFUL",
	"INNOVATION DISTINGUISHES BETWEEN A LEADER AND A FOLLOWER",
	"YOU MISS 100 PERCENT OF THE SHOTS YOU DON NOT TAKE",
	"SUCCESS IS THE SUM OF SMALL EFFORTS REPEATED DAY IN AND DAY OUT",
	"EVERY ACCOMPLISHMENT STARTS WITH THE DECISION TO TRY",
	"DO NOT WAIT TO STRIKE TILL THE IRON IS HOT; MAKE IT HOT BY STRIKING",
	"THE BEST WAY TO PREDICT THE FUTURE IS TO CREATE IT",
	"OPPORTUNITIES DO NOT HAPPEN. YOU CREATE THEM",
	"HAPPINESS IS NOT SOMETHING READY MADE RATHER IT COMES FROM YOUR OWN ACTIONS",
	"KNOWLEDGE IS POWER BUT APPLIED KNOWLEDGE IS FREEDOM",
	"DREAM BIG AND DARE TO FAIL SPECTACULARLY",
	"IMAGINATION IS MORE IMPORTANT THAN KNOWLEDGE",
	"DO ONE THING EVERY DAY THAT SCARES YOU",
	"STRIVE NOT TO BE SUCCESSFUL, BUT RATHER TO BE OF VALUE",
	"SMALL STEPS IN THE RIGHT DIRECTION CAN TURN OUT TO BE THE BIGGEST STEPS OF YOUR LIFE",
	"QUALITY IS NOT AN ACT BUT IT IS A HABIT",
	"ACTION IS THE FOUNDATIONAL KEY TO ALL SUCCESS",
	"THE ONLY LIMIT TO OUR REALIZATION OF TOMORROW IS OUR DOUBTS OF TODAY",
	"A PERSON WHO NEVER MADE A MISTAKE NEVER TRIED ANYTHING NEW",
	"SIMPLICITY IS THE ULTIMATE SOPHISTICATION",
	"DO NOT GO WHERE THE PATH MAY LEAD INSTEAD GO WHERE THERE IS NO PATH AND LEAVE A TRAIL",
	"SUCCESS USUALLY COMES TO THOSE WHO ARE TOO BUSY TO BE LOOKING FOR IT",
	"BELIEVE YOU CAN AND YOU ARE HALFWAY THERE",
	"GREAT MINDS DISCUSS IDEAS WHILE AVERAGE MINDS DISCUSS EVENTS AND SMALL MINDS DISCUSS PEOPLE",
	"DO WHAT YOU CAN WITH WHAT YOU HAVE AND WHERE EVER YOU ARE",
	"THE HARDER YOU WORK FOR SOMETHING, THE GREATER YOU WILL FEEL WHEN YOU ACHIEVE IT",
	"DO NOT WATCH THE CLOCK DO WHAT IT DOES AND KEEP GOING",
	"SOMETIMES LATER BECOMES MIGHT TURN TO NEVER SO DO IT NOW",
	"THE MAN WHO MOVES A MOUNTAIN BEGINS BY CARRYING AWAY SMALL STONES",
	"LITTLE BY LITTLE ONE TRAVELS FAR DREAM IT WISH IT DO IT",
	"IF OPPORTUNITY DOES NOT KNOCK THEN BUILD A DOOR",
	"YOUR LIMITATION IS JUST YOUR OWN IMAGINATION",
	"PUSH YOURSELF BECAUSE NO ONE ELSE IS GOING TO DO IT FOR YOU",
	"GREAT THINGS NEVER COME FROM COMFORT ZONES",
	"SUCCESS IS NOT IN WHAT YOU HAVE BUT WHO YOU BECOME",
	"THE EXPERT IN ANYTHING WAS ONCE A BEGINNER",
	"DO NOT WAIT FOR THE PERFECT MOMENT TAKE THE MOMENT AND MAKE IT PERFECT",
	"EVERYTHING YOU HAVE EVER WANTED IS ON THE OTHER SIDE OF FEAR",
	"YOU ARE BRAVER THAN YOU BELIEVE WHILE STRONGER THAN YOU SEEM, AND SMARTER THAN YOU THINK",
	"THE WAY TO GET STARTED IS TO QUIT TALKING AND BEGIN DOING",
	"LIFE IS TEN PERCENT WHAT HAPPENS TO US AND NINETY PERCENT HOW WE REACT TO IT",
	"DO WHAT YOU LOVE AND YOU WILL NEVER WORK A DAY IN YOUR LIFE",
	"TIME YOU ENJOY WASTING IS NOT WASTED TIME",
	"DO NOT LET WHAT YOU CANNOT DO INTERFERE WITH WHAT YOU CAN DO",
	"HUSTLE IN SILENCE AND LET YOUR SUCCESS MAKE THE NOISE",
	"OPPORTUNITIES ARE USUALLY DISGUISED AS HARD WORK",
	"SUCCESS IS WALKING FROM FAILURE TO FAILURE WITH NO LOSS OF ENTHUSIASM",
	"DO THING THAT FEELS RIGHT NOT WHAT FEELS EASY",
	"COURAGE IS RESISTANCE TO FEAR, MASTERY OF FEAR, NOT ABSENCE OF FEAR",
	"HARD WORK BEATS TALENT WHEN TALENT DOES NOT WORK HARD",
	"A GOAL WITHOUT A PLAN IS JUST A WISH",
	"STRIVE FOR PROGRESS AND NOT PERFECTION IN AN IMPERFECT WORLD",
	"MOTIVATION IS WHAT GETS YOU STARTED BUT HABIT IS WHAT KEEPS YOU GOING",
	"EVERY DAY IS A NEW BEGINNING SO TAKE A DEEP BREATH AND START AGAIN",
	"DO NOT LIMIT YOUR CHALLENGES RATHER CHALLENGE YOUR LIMITS"
];
const jaSentences = [
  	"なぜ 鶏 は 道路 を 渡った の ですか",
	"素早い 茶色 の 狐 が 怠け者 の 犬 を 飛び越える",
	"良い 本 の 力 を 決して 見くびって は いけない",
	"テンジン カルサン は とても ハンサム で 心 優しい 少年 です",
	"ラブちゃん は とても 可愛くて 優しい 女の子 です",
	"テクノロジー は 私たち の 生活 と 仕事 の 仕方 に 革命 を もたらしました",
	"千里 の 道 も 一歩 から",
	"創造性 とは 知性 が 楽しんでいる ことである",
	"学び は 決して 心 を 疲れさせる ことなく、 むしろ それを 活性化 させる",
	"継続 は あらゆる 新しい スキル を 習得 する ため の 鍵 です",
	"転がる 石に 苔は 生えぬ しかし 好奇心 は 知識 を 集める",
	"挑戦 が 人生 を 面白く し それ を 乗り越える こと が 人生 を 意味深い もの に する",
	"イノベーション が リーダー と フォロワー を 区別 する",
	"成功 とは 日々 繰り返される 小さな 努力 の 積み重ね である",
	"すべて の 達成 は 挑戦 する という 決断 から 始まる",
	"鉄 は 熱い うち に 打て と 待つな。 打つ こと で 鉄 を 熱く せよ",
	"未来 を 予測 する 最善 の 方法 は それ を 創造 する ことだ",
	"チャンス は 偶然 やってくる もの ではない 自分 で 作り出す ものだ",
	"幸福 とは 既製品 ではない。 むしろ 自分 自身 の 行動 から 生まれる ものだ",
	"知識 は 力 なり。 しかし 応用 された 知識 は 自由 なり",
	"大きな 夢 を 抱き、 見事に 失敗 する 勇気 を 持て",
	"想像力 は 知識 より も 重要 である",
	"毎日 一つ、 自分 が 怖い と 思う こと を しなさい",
	"成功者 に なる こと を 目指す のではなく、 価値 の ある 人間 に なる こと を 目指しなさい",
	"正しい 方向 へ の 小さな 一歩 が、 人生 最大 の 一歩 に なる こと も ある",
	"品質 とは 行為 ではなく 習慣 である",
	"行動 こそ が すべて の 成功 の 基礎 と なる 鍵 である",
	"明日 の 実現 を 妨げる 唯一 の 限界 は、 今日 の 我々 の 疑い である",
	"一度 も 間違い を した こと が ない 人 は、 何も 新しい こと に 挑戦 した こと が ない 人 だ",
	"シンプルさ は 究極 の 洗練 である",
	"道 が ある ところ に 行く のではなく、 道 が ない ところ に 行き、 足跡 を 残せ",
	"成功 は 普通、 それ を 探す のに 忙しすぎる 人々 の もと へ やってくる",
	"できる と 信じれば、 もう 半分 は 終わっている",
	"偉大な 心 は アイデア を 語り、 平凡な 心 は 出来事 を 語り、 小さな 心 は 他人 の こと を 語る",
	"あなた が いる 場所 で、 あなた が 持っている もの を 使って、 あなた が できる こと を しなさい",
	"何か の ため に 懸命に 努力 すれば するほど、 達成 した とき の 喜び は 大きくなる",
	"時計 を 見るな。 時計 と 同じように 動き続けろ",
	"時には 後で が 決してない に なる こと も ある。 だから 今 すぐ やれ",
	"山 を 動かす 者 も、 最初は 小さな 石 を 運び出す こと から 始める",
	"少しずつ、 人は 遠くへ 旅 を する 夢見て、 願って、 実行 せよ",
	"機会 が ノック して こない なら、 ドア を 作れば いい",
	"あなた の 限界 は、 あなた 自身 の 想像力 だけ だ",
	"自分 を 追い込め。 他 の 誰も あなた の ため に は やってくれない",
	"素晴らしい もの は 決して 快適な 場所 からは 生まれない",
	"成功 とは 何 を 持っている か ではなく、 どんな 人間 に なる か だ",
	"どんな 分野 の 専門家 も、 かつては 初心者 だった",
	"完璧な 瞬間 を 待つな。 その 瞬間 を 掴み、 完璧な もの に しろ",
	"あなた が 今まで 欲しかった もの すべて は、 恐怖 の 向こう側 に ある",
	"あなた は 自分 が 信じている より も 勇敢 で、 見た目 より も 強く、 思っている より も 賢い",
	"物事 を 始める 方法 は、 話す の を やめて 行動 し 始める ことだ",
	"人生 とは、 我々 に 起こる こと が 10 パーセント で、 それ に どう 反応 する か が 90 パーセント である",
	"好き な こと を 仕事 に すれば、 一生 働く こと は ないだろう",
	"楽しんで 無駄に した 時間 は、 無駄な 時間 ではない",
	"できない こと に、 できる こと を 邪魔 させては いけない",
	"静かに 努力 し、 成功 に 騒がせろ",
	"機会 は 通常、 大変な 努力 という 服 を 着ている",
	"成功 とは、 情熱 を 失う ことなく 失敗 から 失敗 へ と 歩き続ける ことである",
	"簡単だと 感じる こと ではなく、 正しい と 感じる こと を しなさい",
	"勇気 とは 恐怖 へ の 抵抗、 恐怖 の 克服 であり、 恐怖 が ない こと ではない",
	"才能 が 努力 しない とき、 努力 が 才能 を 打ち負かす",
	"計画 の ない 目標 は、 ただ の 願い事 に すぎない",
	"不完全な 世界 で、 完璧 ではなく 進歩 を 目指しなさい",
	"モチベーション が あなた を 始め させ、 習慣 が あなた を 続け させる",
	"毎日 が 新しい 始まり だから、 深呼吸 して もう一度 始めよう",
	"挑戦 を 制限 するな、 むしろ 自分 の 限界 に 挑戦 しろ"
];

class TypingRace {
   constructor(io, roomId, players, lang = 'en', onGameEnd) {
    this.io = io;
    this.roomId = roomId;
    this.players = players;
    this.lang = lang;
    this.onGameEnd = onGameEnd;
    this.progress = {};
    this.scores = {};
    this.round = 1;
    this.maxRounds = 5;
    this.roundTimer = null;

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
    let timeLimit = Math.ceil(letterCount * 1.2); // 1.2 is the 20% buffer
    timeLimit = Math.min(timeLimit, 60);


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

  //handle players who time out
  handleTimeOut() {
    console.log(`Round timed out in room ${this.roomId}`);
    this.players.forEach((p) => {
      if (!this.finishOrder.includes(p.id)) {
        //Player timed out, set their progress to 1 and add to finish order with 0 points
        this.progress[p.id] = 1;
        this.handlePlayerFinish(p.id);
      }
    });
    this.endRound();
  }

  endRound() {
    //look up the full player object for each ID in the finishOrder array
    const rankedRoundPlayers = this.finishOrder.map(playerId => {
        return this.players.find(p => p.id === playerId);
    }).filter(p => p); //filter out any undefined players just in case

    //then send this new, richer array of objects to the client
    this.io.to(this.roomId).emit('roundEnded', {
      scores: this.scores,
      finishOrder: rankedRoundPlayers, //sending the new array
    });

    this.round++;
    if (this.round <= this.maxRounds) {
      setTimeout(() => this.startRound(), 8000); 
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

    //after sending results, schedule the game to be removed from the server
    setTimeout(() => {
      if (this.onGameEnd) {
        console.log(`Auto-cleaning TypingRace game in room ${this.roomId}.`);
        this.onGameEnd();
      }
    }, 2000); // 2-second delay to ensure clients receive the 'gameEnded' message first
  }

  getRandomDefaultSentence() {
    return defaultSentences[
      Math.floor(Math.random() * defaultSentences.length)
    ];
  }
}

module.exports = TypingRace;
