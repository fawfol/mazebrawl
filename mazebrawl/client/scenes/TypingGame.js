//mazebrawl/client/scenes/TypingGame.js
export default class TypingGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingGame' });
  }

  init(data) {
    this.socket = data.socket;
    this.players = data.players;
    this.myIndex = data.myIndex;
    this.leaderId = data.leaderId;
    this.sentence = data.sentence || 'The race is about to begin.';
    this.round = data.round || 1;
    this.maxRounds = data.maxRounds || 5;
    this.timeLimit = data.timeLimit || 60; // default to 60 seconds if not provided
    this.countdownTimer = null; //timer variable to track the countdown
    this.maxPlayers = 7;
    
    //check for a pre-countdown duration
    this.preCountdownDuration = data.preCountdown || 0;

    this.words = this.sentence.split(' ');
    this.currentWordIndex = 0;

    this.playerChars = {}; //character DOM elements
    this.wordBlocks = [];
    
    //bind event listener for game start
    this.socket.off('startGame');
    this.socket.on('startGame', (gameType, sentence, extra) => {
        this.sentence = sentence;
        this.round = extra.round;
        this.maxRounds = extra.maxRounds;
        this.timeLimit = extra.timeLimit;
        this.startRound();
    });
  }
  
  //separate method to set up the game UI and logic
  startRound() {
    //reset game state for the new round
    this.words = this.sentence.split(' ');
    this.currentWordIndex = 0;
    this.wordBlocks = [];
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
		title.innerText = `Round ${this.round} Results`;
		box.appendChild(title);

		const list = document.createElement('div');
		Object.entries(scores).forEach(([id, score]) => {
		    const p = document.createElement('p');
		    const player = this.players.find(pl => pl.id === id);
            if (player) { // Check if player exists before showing score
		        p.innerText = `${player.name}: ${score}`;
		        list.appendChild(p);
            }
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
		countdownText.innerText = `Next round in ... ${countdown}`;
		const interval = setInterval(() => {
		    countdown--;
		    if (countdown > 0) {
		        countdownText.innerText = `Next round in ... ${countdown}`;
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
            if (player) { // Check if player exists
		        pDiv.innerText = `${p.place}. ${player.name} (${p.score} pts)`;
		        box.appendChild(pDiv);
            }
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
		        myIndex: this.players.findIndex(p => p.id === this.socket.id),
		        socket: this.socket,
		        leaderId: this.leaderId
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
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
            gap: '10px'
        });
        document.body.appendChild(overlay);

        const countdownText = document.createElement('h1');
        countdownText.style.fontSize = '10rem';
        countdownText.style.color = 'white';
        overlay.appendChild(countdownText);

        const tutorialText = document.createElement('p');
        tutorialText.innerText = 'How to Play: Type the highlighted word and press SPACE to submit.';
        Object.assign(tutorialText.style, {
            color: '#eee',
            fontSize: '1.5rem',
            maxWidth: '80%',
            textAlign: 'center'
        });
        overlay.appendChild(tutorialText);

        let skipButton;
        if (this.socket.id === this.leaderId) {
            skipButton = document.createElement('button');
            skipButton.innerText = 'Skip Tutorial (Start in 3s)';
            Object.assign(skipButton.style, {
                padding: '10px 20px',
                fontSize: '1.2rem',
                cursor: 'pointer'
            });
            skipButton.onclick = () => {
                this.socket.emit('leaderSkipTutorial');
                skipButton.disabled = true;
                skipButton.innerText = 'Skipping...';
            };
            overlay.appendChild(skipButton);
        }

        let countdownInterval;

        // This function is now ONLY for the final, short countdown
        const startFinalCountdown = (duration) => {
            if (countdownInterval) clearInterval(countdownInterval); // Clear the long timer
            
            if (skipButton) skipButton.style.display = 'none';
            tutorialText.style.display = 'none';

            let count = duration;
            countdownText.innerText = count;

            const finalInterval = setInterval(() => {
                count--;
                if (count >= 0) {
                    countdownText.innerText = count === 0 ? 'GO!' : count;
                } else {
                    clearInterval(finalInterval);
                    overlay.remove();
                }
            }, 1000);
        };
        
        // Listen for the skip event from the server
        this.socket.once('tutorialSkipped', () => {
            startFinalCountdown(3);
        });

        // THE FIX: This is the new, separate logic for the initial long countdown
        let currentCount = this.preCountdownDuration;
        countdownText.innerText = currentCount;

        countdownInterval = setInterval(() => {
            currentCount--;
            
            if (currentCount > 3) {
                // Just tick down while the tutorial is showing
                countdownText.innerText = currentCount;
            } else if (currentCount >= 0) {
                // Once the timer gets low, hide the tutorial and button automatically
                if (skipButton) skipButton.style.display = 'none';
                tutorialText.style.display = 'none';
                countdownText.innerText = currentCount === 0 ? 'GO!' : currentCount;
            } else {
                // Timer finished naturally
                clearInterval(countdownInterval);
                overlay.remove();
            }
        }, 1000);
    }
 
  
  createUI() {
    document.body.innerHTML = '';
    
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

    // --- Header ---
    this.header = document.createElement('div');
    this.header.className = 'typing-game-header';

    // Round Info
    const roundItem = this.createHeaderItem('Round');
    this.roundText = roundItem.querySelector('.header-value');
    this.roundText.innerText = `${this.round}/${this.maxRounds}`;

    // Player Count Info
    const playerCountItem = this.createHeaderItem('Players');
    this.playerCountText = playerCountItem.querySelector('.header-value');

    // Time Info
    const timeItem = this.createHeaderItem('Time');
    this.timerText = timeItem.querySelector('.header-value');
    this.timerText.innerText = `${this.timeLimit}s`;
    
    this.header.appendChild(roundItem);
    this.header.appendChild(playerCountItem);
    this.header.appendChild(timeItem);
    this.container.appendChild(this.header);
    
    let timeLeft = this.timeLimit;
    this.countdownTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft >= 0) {
            this.timerText.innerText = `${timeLeft}s`;
        } else {
            clearInterval(this.countdownTimer);
        }
    }, 1000);

    this.createRaceTrack();

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
    
    //autocap for english
	 this.input.addEventListener('input', () => {
        //if lang is not Japanese.
        if (this.language !== 'ja') {
            this.input.value = this.input.value.toUpperCase();
        }
    });

    this.createProgressBars();

    // Event Listeners
    this.input.addEventListener('input', this.handleInput.bind(this));
    
    this.socket.off('updateProgress');
    this.socket.on('updateProgress', ({ playerId, progress }) => {
      this.updateCharacterPosition(playerId, progress);
    });

	this.socket.off('roundEnded');
	this.socket.on('roundEnded', ({ scores, finishOrder }) => {
	  clearInterval(this.countdownTimer);
	  this.showRoundResults(scores);
	});

    this.socket.off('gameEnded');
    this.socket.on('gameEnded', ({ rankedPlayers }) => {
        clearInterval(this.countdownTimer);
	    this.showFinalResults(rankedPlayers);
	});

    this.socket.off('roomUpdate');
    this.socket.on('roomUpdate', (data) => {
        this.players = data.players;
        this.leaderId = data.leaderId;
        this.updatePlayerCount();
        
        Object.keys(this.playerChars).forEach(playerId => {
            if (!this.players.some(p => p.id === playerId)) {
                if (this.playerChars[playerId]) this.playerChars[playerId].style.display = 'none';
                if (this.progressBars[playerId]) {
                    this.progressBars[playerId].fill.parentElement.parentElement.style.display = 'none';
                }
            }
        });
    });

    // Initial UI update
    this.updateBlockStyles();
    this.players.forEach(p => this.updateCharacterPosition(p.id, 0));
    this.updatePlayerCount();
  }

  createHeaderItem(labelText) {
      const item = document.createElement('div');
      item.className = 'header-item';
      
      const label = document.createElement('span');
      label.className = 'header-label';
      label.innerText = labelText;
      
      const value = document.createElement('span');
      value.className = 'header-value';
      
      item.appendChild(label);
      item.appendChild(value);
      
      return item;
  }
  
  updatePlayerCount() {
    if (this.playerCountText) {
        this.playerCountText.innerText = `${this.players.length}/${this.maxPlayers}`;
    }
  }
  
  shutdown() {
    if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
    }
    this.socket.off('updateProgress');
    this.socket.off('roundEnded');
    this.socket.off('gameEnded');
    this.socket.off('roomUpdate');
  }

  createRaceTrack() {
    const track = document.createElement('div');
    track.className = 'race-track';
    
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

    const emojis = ['🏎️', '🚗', '🚙', '🚕', '🚓', '🚑', '🚚'];
    this.players.forEach((p, idx) => {
      const char = document.createElement('div');
      char.className = 'player-char';
      char.innerText = emojis[idx % emojis.length];
      char.style.position = 'absolute';
      char.style.transition = 'left 0.3s';
      track.appendChild(char);
      this.playerChars[p.id] = char;
    });
  }

  createProgressBars() {
    const container = document.createElement('div');
    Object.assign(container.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '90%',
        maxWidth: '1000px',
        marginTop: '10px'
    });

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

  //logic of word recong
	handleInput(e) {
    const inputValue = this.input.value;

    if (this.language === 'ja') {
        // --- JAPANESE LOGIC: character-by-character check ---
        let correctChars = 0;
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i] === this.sentence[i]) {
                correctChars++;
            } else {
                //if a character is wrong, stop and show an error.
                this.input.classList.add('input-error');
                return; //exit the function early
            }
        }
        
        //if we got this far, all typed characters are correct.
        this.input.classList.remove('input-error');

        const progress = correctChars / this.sentence.length;
        this.socket.emit('typingProgress', progress);
        this.updateCharacterPosition(this.socket.id, progress);
        
        //visually update the track for Japanese (simplified)
        this.currentWordIndex = Math.floor(progress * this.words.length);
        this.updateBlockStyles();

        if (progress >= 1) {
            this.input.disabled = true;
            this.input.placeholder = 'You finished!';
        }

    } else {
        // --- ENGLISH LOGIC: Word-by-word check (your existing logic) ---
        if (inputValue.slice(-1) !== ' ') return; //check for spacebar press
        
        const typedWord = inputValue.trim();
        if (!typedWord) {
            this.input.value = '';
            return;
        }

        const targetWord = this.words[this.currentWordIndex];

        if (typedWord === targetWord) {
            this.input.classList.remove('input-error');
            this.input.value = ''; //clear input
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
        }
    }
  }

 updateBlockStyles() {
    this.wordBlocks.forEach((block, index) => {
      if (index < this.currentWordIndex) {
        block.className = 'block completed';
      } else if (index === this.currentWordIndex) {
        block.className = 'block current';
      } else {
        block.className = 'block';
      }
    });

    const currentBlock = this.wordBlocks[this.currentWordIndex];
    if (currentBlock) {
      currentBlock.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }

  updateCharacterPosition(playerId, progress) {
    const char = this.playerChars[playerId];
    const bar = this.progressBars[playerId];
    if (!char || !bar) return;

    const percent = (progress * 100).toFixed(0);
    bar.fill.style.width = `${percent}%`;
    bar.percentage.innerText = `${percent}%`;

    const allBlocks = this.trackElement.querySelectorAll('.block');
    if (allBlocks.length === 0) return;

    const targetIndex = Math.floor(progress * this.words.length);

    let targetEl = (progress >= 1)
      ? allBlocks[allBlocks.length - 1]
      : allBlocks[targetIndex + 1];

    if (targetEl) {
      const trackRect = this.trackElement.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const center = (targetRect.left - trackRect.left) + targetRect.width / 2;
      char.style.left = `${center}px`;
    }
  }
}

