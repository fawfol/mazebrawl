// mazebrawl/client/scenes/GameScene.js

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.players = data.players || [];
    this.myIndex = data.myIndex ?? 0;
    this.socket = data.socket;
    this.isLeader = (this.players[this.myIndex]?.id === data.leaderId);
  }

  create() {
    console.log('GameScene started');

    document.body.innerHTML = '';

    // Delegate game start logic to the new preCountdown event
    this.socket.off('preCountdown'); // Prevent duplicate listeners
    this.socket.on('preCountdown', ({ duration, gameType }) => {
        this.statusText.innerText = 'Game starting...';
        
        // Immediately transition to the TypingGame scene
        this.scene.stop('GameScene');
        this.scene.start(gameType, {
            players: this.players,
            myIndex: this.myIndex,
            socket: this.socket,
            preCountdown: duration // Pass the countdown duration to the next scene
        });
    });

    this.domContainer = document.createElement('div');
    this.domContainer.className = 'game-container';
    Object.assign(this.domContainer.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#222',
      color: '#fff',
      fontFamily: 'sans-serif',
      gap: '1rem',
      padding: '20px',
      boxSizing: 'border-box'
    });
    document.body.appendChild(this.domContainer);

    this.statusText = document.createElement('h1');
    this.statusText.innerText = this.isLeader
      ? 'Choose a game to start'
      : 'Waiting for leader to choose a game...';
    this.domContainer.appendChild(this.statusText);

    if (this.isLeader) {
      this.renderGameSelectionUI();
    }
    this.renderChatBox();

    this.socket.off('gameChatMessage');
    this.socket.on('gameChatMessage', (data) => {
      this.addChatMessage(`${data.name}: ${data.text}`);
    });
  }

  renderGameSelectionUI() {
    const gameList = document.createElement('div');
    gameList.style.display = 'flex';
    gameList.style.flexDirection = 'column';
    gameList.style.gap = '0.5rem';

    // Typing Race Button
    const typingRaceBtn = document.createElement('button');
    typingRaceBtn.innerText = 'Start Typing Race';
    Object.assign(typingRaceBtn.style, { padding: '10px 20px', fontSize: '1.2rem', cursor: 'pointer' });
    typingRaceBtn.onclick = () => {
      this.statusText.innerText = 'Starting Typing Race...';
      // Correct the gameType to 'TypingGame'
      this.socket.emit('selectGame', 'TypingGame', (response) => {
        if (!response.success) {
          this.statusText.innerText = response.message;
        }
      });
    };
    gameList.appendChild(typingRaceBtn);

	
    // Add more game buttons here
    // const newGameBtn = document.createElement('button');
    // newGameBtn.innerText = 'Start New Game';
    // newGameBtn.onclick = () => {
    //   this.socket.emit('selectGame', 'NewGame', (response) => { ... });
    // };
    // gameList.appendChild(newGameBtn);
		
    this.domContainer.appendChild(gameList);
  }



  renderChatBox() {
    // ... (rest of the renderChatBox and related methods are unchanged)
    this.chatContainer = document.createElement('div');
    Object.assign(this.chatContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      width: '80%',
      maxWidth: '500px',
      height: '130px',
      background: '#fff',
      color: '#000',
      padding: '10px',
      overflowY: 'auto',
      borderRadius: '10px',
      fontSize: '14px',
      marginTop: '10px'
    });
    this.domContainer.appendChild(this.chatContainer);

    const inputWrapper = document.createElement('div');
    Object.assign(inputWrapper.style, {
      display: 'flex',
      gap: '5px',
      width: '80%',
      maxWidth: '500px',
      marginTop: '5px'
    });

    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = 'Chat with others...';
    this.chatInput.style.flex = '1';
    this.chatInput.style.padding = '5px';

    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send';
    sendBtn.style.padding = '5px 10px';
	sendBtn.style.height = '30px';
    sendBtn.onclick = () => this.sendChatMessage();

    inputWrapper.appendChild(this.chatInput);
    inputWrapper.appendChild(sendBtn);
    this.domContainer.appendChild(inputWrapper);

    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });
  }
  
	sendChatMessage() {
		const text = this.chatInput.value.trim();
		if (!text) return;
		this.socket.emit('gameChatMessage', text);
		this.chatInput.value = '';
	}

  addChatMessage(msg) {
    const p = document.createElement('p');
    p.innerText = msg;
    p.style.margin = '2px 0';
    this.chatContainer.appendChild(p);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  shutdown() {
    console.log('GameScene shutting down, removing listeners.');
    this.socket.off('startGame');
    this.socket.off('gameChatMessage');
  }
}
