// mazebrawl/client/scenes/GameScene.js
//import { getPlayerColor } from '../colors.js';

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
    document.querySelectorAll('.lobby-container').forEach(el => el.remove());

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
      color: '#fff',
      fontFamily: 'sans-serif',
      gap: '1rem',
      padding: '20px',
      boxSizing: 'border-box'
    });
    document.body.appendChild(this.domContainer);

    //staltus message
    this.statusText = document.createElement('h1');
    this.statusText.innerText = this.isLeader
      ? 'Choose a game to start'
      : 'Waiting for leader to choose a game...';
    this.domContainer.appendChild(this.statusText);

    //iff leader, render game selection buttons
    if (this.isLeader) {
      this.renderGameSelectionUI();
    } else {
      // Non-leader sees chat box
      this.renderChatBox();
    }

    this.socket.on('startGame', (gameType, sentence) => {
      console.log('startGame received:', gameType);
      if (gameType === 'TypingRace') {
        this.startTypingRace(sentence);
      }
    });

    // Listen for chat messages from server
    this.socket.on('gameChatMessage', (msg) => {
      this.addChatMessage(msg);
    });
  }

  renderGameSelectionUI() {
    const gameList = document.createElement('div');
    gameList.style.display = 'flex';
    gameList.style.flexDirection = 'column';
    gameList.style.gap = '0.5rem';

    const typingRaceBtn = document.createElement('button');
    typingRaceBtn.innerText = 'Start Typing Race';
    typingRaceBtn.style.padding = '10px 20px';
    typingRaceBtn.style.fontSize = '1.2rem';
    typingRaceBtn.style.cursor = 'pointer';

    typingRaceBtn.onclick = () => {
      this.statusText.innerText = 'Starting Typing Race...';
      this.socket.emit('startGame', (response) => {
        if (!response.success) {
          alert(response.message);
          this.statusText.innerText = 'Choose a game to start';
        }
      });
    };

    gameList.appendChild(typingRaceBtn);
    this.domContainer.appendChild(gameList);

    // Optional: leaders can also chat with players
    this.renderChatBox();
  }

  renderChatBox() {
    this.chatContainer = document.createElement('div');
    this.chatContainer.style.display = 'flex';
    this.chatContainer.style.flexDirection = 'column';
    this.chatContainer.style.alignItems = 'flex-start';
    this.chatContainer.style.width = '80%';
    this.chatContainer.style.maxWidth = '500px';
    this.chatContainer.style.height = '200px';
    this.chatContainer.style.background = '#333';
    this.chatContainer.style.padding = '10px';
    this.chatContainer.style.overflowY = 'auto';
    this.chatContainer.style.borderRadius = '10px';
    this.chatContainer.style.fontSize = '14px';
    this.chatContainer.style.marginTop = '10px';
    this.domContainer.appendChild(this.chatContainer);

    // input box
    const inputWrapper = document.createElement('div');
    inputWrapper.style.display = 'flex';
    inputWrapper.style.gap = '5px';
    inputWrapper.style.width = '80%';
    inputWrapper.style.maxWidth = '500px';
    inputWrapper.style.marginTop = '5px';

    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = 'Chat with others...';
    this.chatInput.style.flex = '1';
    this.chatInput.style.padding = '5px';

    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send';
    sendBtn.style.padding = '5px 10px';

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

  startTypingRace(sentence) {
    this.domContainer.innerHTML = ''; // clear previous UI
    const title = document.createElement('h2');
    title.innerText = 'Typing Race!';
    this.domContainer.appendChild(title);

    const sentenceDisplay = document.createElement('p');
    sentenceDisplay.innerText = sentence;
    sentenceDisplay.style.fontSize = '1.5rem';
    this.domContainer.appendChild(sentenceDisplay);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Start typing...';
    input.style.fontSize = '1.2rem';
    input.style.padding = '5px';
    input.style.width = '80%';
    this.domContainer.appendChild(input);

    input.focus();
    input.addEventListener('input', () => {
      if (input.value === sentence) {
        this.statusText.innerText = '✅ You finished!';
        this.domContainer.appendChild(this.statusText);
        input.disabled = true;
      }
    });
  }

  shutdown() {
    if (this.domContainer) this.domContainer.remove();
  }
}
