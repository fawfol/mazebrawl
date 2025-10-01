//mazebrawl/client/scenes/TypingGame.js
export default class TypingGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingGame' });
  }

  init(data) {
    this.socket = data.socket;
    this.players = data.players;
    this.myIndex = data.myIndex;
    this.sentence = data.sentence || 'The race is about to begin.';
    this.round = data.round || 1;
    this.maxRounds = data.maxRounds || 5;
    this.timeLimit = data.timeLimit || 60; // default to 60 seconds if not provided
    this.countdownTimer = null; // A timer variable to track the countdown
    
    // NEW: Check for a pre-countdown duration
    this.preCountdownDuration = data.preCountdown || 0;

    this.words = this.sentence.split(' ');
    this.currentWordIndex = 0;

    this.playerChars = {}; // character DOM elements
    this.wordBlocks = [];
    
    // NEW: Bind event listener for game start
    this.socket.off('startGame');
    this.socket.on('startGame', (gameType, sentence, extra) => {
        this.sentence = sentence;
        this.round = extra.round;
        this.maxRounds = extra.maxRounds;
        this.timeLimit = extra.timeLimit;
        this.startRound();
    });
  }
  
  // NEW: A separate method to set up the game UI and logic
  startRound() {
    // Reset game state for the new round
    this.words = this.sentence.split(' ');
    this.currentWordIndex = 0;
    
    document.body.innerHTML = '';
    this.createUI();
  }

	//round end modal
	showRoundResults(scores) {
		const overlay = document.createElement('div');
		Object.assign(overlay.style, {
		    position: 'fixed', top: '0', left: '0',
		    width: '100%', height: '100%',
		    background: 'rgba(0,0,0,0.7)',
		    display: 'flex',
		    alignItems: 'center',
		    justifyContent: 'center',
		    zIndex: 1000
		});

		const box = document.createElement('div');
		Object.assign(box.style, {
		    background: '#222',
		    color: '#fff',
		    padding: '20px',
		    borderRadius: '10px',
		    textAlign: 'center',
		    minWidth: '300px'
		});

		const title = document.createElement('h2');
		title.innerText = `Round ${this.round - 0} Results`;
		box.appendChild(title);

		const list = document.createElement('div');
		Object.entries(scores).forEach(([id, score]) => {
		    const p = document.createElement('p');
		    const player = this.players.find(pl => pl.id === id);
		    p.innerText = `${player.name}: ${score}`;
		    list.appendChild(p);
		});
		box.appendChild(list);

		const countdownText = document.createElement('p');
		countdownText.style.marginTop = '10px';
		countdownText.style.fontSize = '18px';
		box.appendChild(countdownText);

		overlay.appendChild(box);
		document.body.appendChild(overlay);

		// Countdown
		let countdown = 8;
		countdownText.innerText = `Next round in ${countdown}...`;
		const interval = setInterval(() => {
		    countdown--;
		    if (countdown > 0) {
		        countdownText.innerText = `Next round in ${countdown}...`;
		    } else {
		        clearInterval(interval);
		        overlay.remove();
		    }
		}, 1000);
	}

	//show round final end game results
	showFinalResults(rankedPlayers) {
		const overlay = document.createElement('div');
		Object.assign(overlay.style, {
		    position: 'fixed', top: '0', left: '0',
		    width: '100%', height: '100%',
		    background: 'rgba(0,0,0,0.85)',
		    display: 'flex',
		    alignItems: 'center',
		    justifyContent: 'center',
		    zIndex: 1000
		});

		const box = document.createElement('div');
		Object.assign(box.style, {
		    background: '#222',
		    color: '#fff',
		    padding: '20px',
		    borderRadius: '10px',
		    textAlign: 'center',
		    minWidth: '300px'
		});

		const title = document.createElement('h2');
		title.innerText = `Final Rankings`;
		box.appendChild(title);

		rankedPlayers.forEach(p => {
		    const pDiv = document.createElement('p');
		    const player = this.players.find(pl => pl.id === p.id);
		    pDiv.innerText = `${p.place}. ${player.name} (${p.score} pts)`;
		    box.appendChild(pDiv);
		});

		const exitBtn = document.createElement('button');
		exitBtn.innerText = 'Exit to Game Selection';
		Object.assign(exitBtn.style, {
		    marginTop: '15px',
		    padding: '8px 16px',
		    fontSize: '16px',
		    cursor: 'pointer',
		    background: '#444',
		    color: 'white',
		    border: 'none',
		    borderRadius: '6px'
		});
		exitBtn.onclick = () => {
		    overlay.remove();
		    // Go back to GameScene
		    this.scene.stop('TypingGame');
		    this.scene.start('GameScene', {
		        players: this.players,
		        myIndex: this.myIndex,
		        socket: this.socket,
		        leaderId: this.players[this.myIndex].id
		    });
		};
		box.appendChild(exitBtn);

		overlay.appendChild(box);
		document.body.appendChild(overlay);
	}
	
	create() {
        if (this.preCountdownDuration > 0) {
            this.showPreCountdown();
        } else {
            this.startRound();
        }
    }

    showPreCountdown() {
        document.body.innerHTML = '';
        
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0',
            width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000'
        });
        document.body.appendChild(overlay);

        const countdownText = document.createElement('h1');
        countdownText.style.fontSize = '10rem';
        countdownText.style.color = 'white';
        countdownText.innerText = this.preCountdownDuration;
        overlay.appendChild(countdownText);

        let currentCount = this.preCountdownDuration;
        const countdownInterval = setInterval(() => {
            currentCount--;
            if (currentCount >= 0) {
                countdownText.innerText = currentCount === 0 ? 'GO!' : currentCount;
            } else {
                clearInterval(countdownInterval);
                overlay.remove();
                // The startGame event from the server will trigger the actual game start
            }
        }, 1000);
    }
  
  createUI() {
    // This method now contains the code to set up the game UI, previously in create()
    document.body.innerHTML = '';
    
    //main container
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around',
      height: '100vh',
      background: '#222',
      color: '#fff',
      fontFamily: 'sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    });
    document.body.appendChild(this.container);

    //round info and timer
    this.header = document.createElement('div');
    Object.assign(this.header.style, {
        display: 'flex',
        justifyContent: 'space-between',
        width: '80%',
        maxWidth: '1000px',
        alignItems: 'center'
    });

    this.roundText = document.createElement('h2');
    this.roundText.innerText = `Round ${this.round} / ${this.maxRounds}`;
    this.header.appendChild(this.roundText);
    
    // NEW: Timer element
    this.timerText = document.createElement('h2');
    this.timerText.innerText = `Time: ${this.timeLimit}s`;
    this.header.appendChild(this.timerText);

    this.container.appendChild(this.header);
    
    // start the timer
    let timeLeft = this.timeLimit;
    this.countdownTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            this.timerText.innerText = `Time: ${timeLeft}s`;
        } else {
            clearInterval(this.countdownTimer);
        }
    }, 1000);

    //create race track
    this.createRaceTrack();

    //input box
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Type the highlighted word and press space...';
    Object.assign(this.input.style, {
      fontSize: '1.5rem',
      width: '80%',
      maxWidth: '600px',
      padding: '10px',
      textAlign: 'center',
      borderRadius: '5px',
      border: '2px solid #ccc'
    });
    this.container.appendChild(this.input);
    this.input.focus();

    //progress bars
    this.createProgressBars();

    //event listeners
    this.input.addEventListener('keydown', this.handleInput.bind(this));
    this.socket.on('updateProgress', ({ playerId, progress }) => {
      this.updateCharacterPosition(playerId, progress);
    });

	this.socket.off('roundEnded'); // prevent duplicate listeners
	this.socket.on('roundEnded', ({ scores, finishOrder }) => {
	  clearInterval(this.countdownTimer); // Stop the timer on round end
	  this.showRoundResults(scores);
	});


    this.socket.on('gameEnded', ({ rankedPlayers }) => {
        clearInterval(this.countdownTimer); // Stop the timer on game end
	    this.showFinalResults(rankedPlayers);
	});


    //initial UI update
    this.updateBlockStyles();
    this.players.forEach(p => this.updateCharacterPosition(p.id, 0));
  }
  
  // NEW: Add a shutdown method to clean up listeners
  shutdown() {
    if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
    }
    this.socket.off('updateProgress');
    this.socket.off('roundEnded');
    this.socket.off('gameEnded');
  }


  // --- UI Creation ---

  createRaceTrack() {
    const track = document.createElement('div');
    track.className = 'race-track';
    track.style.display = 'flex';
    track.style.alignItems = 'flex-end';
    track.style.gap = '5px';
    track.style.marginBottom = '20px';
    
    const startBlock = document.createElement('div');
    startBlock.className = 'block start-finish';
    startBlock.innerText = 'START';
    track.appendChild(startBlock);

    this.words.forEach(word => {
      const wordBlock = document.createElement('div');
      wordBlock.className = 'block';
      wordBlock.innerText = word;
      track.appendChild(wordBlock);
      this.wordBlocks.push(wordBlock);
    });

    const finishBlock = document.createElement('div');
    finishBlock.className = 'block start-finish';
    finishBlock.innerText = 'FINISH';
    track.appendChild(finishBlock);

    this.container.appendChild(track);
    this.trackElement = track;

    // player characters
    const emojis = ['馃弮','馃弴','馃毚','馃じ','馃毝','馃ぞ','馃拑'];
    this.players.forEach((p, idx) => {
      const char = document.createElement('div');
      char.className = 'player-char';
      char.innerText = emojis[idx % emojis.length];
      char.style.position = 'absolute';
      char.style.bottom = '100px';
      char.style.transition = 'left 0.3s';
      track.appendChild(char);
      this.playerChars[p.id] = char;
    });
  }

  createProgressBars() {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '8px';
    container.style.width = '90%';
    container.style.maxWidth = '1000px';

    this.progressBars = {};

    this.players.forEach(p => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '10px';

      const nameLabel = document.createElement('span');
      nameLabel.innerText = p.name;
      nameLabel.style.width = '100px';

      const bar = document.createElement('div');
      Object.assign(bar.style, {
        height: '15px',
        flex: '1',
        background: '#555',
        borderRadius: '5px',
        overflow: 'hidden'
      });

      const fill = document.createElement('div');
      Object.assign(fill.style, {
        height: '100%',
        width: '0%',
        background: 'lime',
        transition: 'width 0.3s'
      });

      const percentage = document.createElement('span');
      percentage.innerText = '0%';
      percentage.style.width = '40px';

      bar.appendChild(fill);
      wrapper.appendChild(nameLabel);
      wrapper.appendChild(bar);
      wrapper.appendChild(percentage);
      container.appendChild(wrapper);

      this.progressBars[p.id] = { fill, percentage };
    });

    this.container.appendChild(container);
  }

  // --- Gameplay ---

  handleInput(e) {
    if (e.key !== ' ' && e.code !== 'Space') return;
    e.preventDefault();

    const typedWord = this.input.value.trim();
    const targetWord = this.words[this.currentWordIndex];

    if (typedWord === targetWord) {
      this.input.classList.remove('input-error');
      this.input.value = '';
      this.currentWordIndex++;

      const progress = this.currentWordIndex / this.words.length;
      this.socket.emit('typingProgress', progress);
      this.updateCharacterPosition(this.socket.id, progress);
      this.updateBlockStyles();

      if (this.currentWordIndex === this.words.length) {
        this.input.disabled = true;
        this.input.placeholder = 'You finished!';
      }
    } else {
      this.input.classList.add('input-error');
      setTimeout(() => this.input.classList.remove('input-error'), 200);
    }
  }

  updateBlockStyles() {
    this.wordBlocks.forEach((block, index) => {
      if (index < this.currentWordIndex) block.className = 'block completed';
      else if (index === this.currentWordIndex) block.className = 'block current';
      else block.className = 'block';
    });
  }

  updateCharacterPosition(playerId, progress) {
    const char = this.playerChars[playerId];
    const bar = this.progressBars[playerId];
    if (!char || !bar) return;

    // progress bar
    const percent = (progress * 100).toFixed(0);
    bar.fill.style.width = `${percent}%`;
    bar.percentage.innerText = `${percent}%`;

    // track position
    const totalBlocks = this.words.length + 1;
    const targetIndex = Math.floor(progress * totalBlocks);

    let targetEl = (progress >= 1) ? 
      this.trackElement.querySelector('.block.start-finish:last-child') :
      this.trackElement.children[targetIndex];

    if (targetEl) {
      const trackRect = this.trackElement.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const center = (targetRect.left - trackRect.left) + targetRect.width / 2;
      char.style.left = `${center}px`;
    }
  }
}
