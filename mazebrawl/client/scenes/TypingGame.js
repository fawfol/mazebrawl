export default class TypingGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingGame' });
  }

  init(data) {
    this.socket = data.socket;
    this.players = data.players;
    this.myIndex = data.myIndex;
    this.sentence = data.sentence || 'The race is about to begin.';
    
    this.words = this.sentence.split(' ');
    this.currentWordIndex = 0;

    this.playerChars = {}; // To hold character DOM elements
    this.wordBlocks = [];  // To hold word block DOM elements
  }

  create() {
    document.body.innerHTML = '';

    // Main container
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

    // --- 1. Create the Race Track UI ---
    this.createRaceTrack();

    // --- 2. Create the Input Box ---
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
    
    // --- 3. Create Player Progress Bars ---
    this.createProgressBars();
    
    // --- 4. Setup Event Listeners ---
    this.input.addEventListener('keydown', this.handleInput.bind(this));
    this.socket.on('updateProgress', ({ playerId, progress }) => {
      this.updateCharacterPosition(playerId, progress);
    });

    // Initial UI setup
    this.updateBlockStyles();
    this.players.forEach(p => this.updateCharacterPosition(p.id, 0));
  }
  
  // --- UI Creation Methods ---
  
  createRaceTrack() {
    const track = document.createElement('div');
    track.className = 'race-track';
    
    // Start Block
    const startBlock = document.createElement('div');
    startBlock.className = 'block start-finish';
    startBlock.innerText = 'START';
    track.appendChild(startBlock);

    //word Blocks
    this.words.forEach(word => {
      const wordBlock = document.createElement('div');
      wordBlock.className = 'block';
      wordBlock.innerText = word;
      track.appendChild(wordBlock);
      this.wordBlocks.push(wordBlock);
    });

    //finish Block
    const finishBlock = document.createElement('div');
    finishBlock.className = 'block start-finish';
    finishBlock.innerText = 'FINISH';
    track.appendChild(finishBlock);

    this.container.appendChild(track);
    this.trackElement = track; //save reference for positioning

    //player Characters
    const playerEmojis = ['🏃', '🏇', '🚴', '🤸', '🚶', '🤾', '💃'];
    this.players.forEach((p, index) => {
        const char = document.createElement('div');
        char.className = 'player-char';
        char.innerText = playerEmojis[index % playerEmojis.length];
        track.appendChild(char);
        this.playerChars[p.id] = char;
    });
  }

  createProgressBars() {
    const progressContainer = document.createElement('div');
    Object.assign(progressContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      width: '90%',
      maxWidth: '1000px'
    });
    
    this.progressBars = {}; //to hold progress bar elements

    this.players.forEach(p => {
      const barContainer = document.createElement('div');
      
      const barWrapper = document.createElement('div');
      Object.assign(barWrapper.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      });
      
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
        transition: 'width 0.3s ease-in-out'
      });
      
      const percentage = document.createElement('span');
      percentage.innerText = '0%';
      percentage.style.width = '40px'; //align percentages
      
      bar.appendChild(fill);
      barWrapper.appendChild(nameLabel);
      barWrapper.appendChild(bar);
      barWrapper.appendChild(percentage);
      barContainer.appendChild(barWrapper);
      progressContainer.appendChild(barContainer);

      this.progressBars[p.id] = { fill, percentage };
    });
    this.container.appendChild(progressContainer);
  }

  // --- Gameplay and Update Methods ---

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
      
      // Local update for instant feedback
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
      if (index < this.currentWordIndex) {
        block.className = 'block completed';
      } else if (index === this.currentWordIndex) {
        block.className = 'block current';
      } else {
        block.className = 'block';
      }
    });
  }

  updateCharacterPosition(playerId, progress) {
    const char = this.playerChars[playerId];
    const bar = this.progressBars[playerId];
    if (!char || !bar) return;

    // Update progress bar
    const percentage = (progress * 100).toFixed(0);
    bar.fill.style.width = `${percentage}%`;
    bar.percentage.innerText = `${percentage}%`;
    
    // Move character on the track
    const totalBlocks = this.words.length + 1; // +1 for start block
    const targetBlockIndex = Math.floor(progress * totalBlocks);

    let targetElement;
    if (progress >= 1) {
        targetElement = this.trackElement.querySelector('.block.start-finish:last-child');
    } else {
        targetElement = this.trackElement.children[targetBlockIndex];
    }
    
    if (targetElement) {
      const trackRect = this.trackElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const centerOfBlock = (targetRect.left - trackRect.left) + targetRect.width / 2;
      char.style.left = `${centerOfBlock}px`;
    }
  }
}
