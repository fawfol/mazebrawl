// mazebrawl/client/scenes/GameScene.js

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.players = data.players || [];
    this.myIndex = data.myIndex ?? 0;
    this.socket = data.socket;
    this.isLeader = this.players[this.myIndex]?.id === data.leaderId;
  }

  create() {
    console.log('GameScene started');
    document.body.innerHTML = '';

    // Listen for the pre-countdown event from the server
    this.socket.off('preCountdown'); // Prevent duplicate listeners
    this.socket.on('preCountdown', ({ duration, gameType }) => {
      this.statusText.innerText = 'Game starting...';
      this.scene.stop('GameScene');
      this.scene.start(gameType, {
        players: this.players,
        myIndex: this.myIndex,
        socket: this.socket,
        preCountdown: duration,
      });
    });

    // --- Create the main layout containers ---
    this.domContainer = document.createElement('div');
    this.domContainer.className = 'gamescene-container';
    document.body.appendChild(this.domContainer);

    const mainContent = document.createElement('div');
    mainContent.className = 'gamescene-main';
    this.domContainer.appendChild(mainContent);

    // --- Create the UI elements ---
    this.statusText = document.createElement('h1');
    this.statusText.className = 'gamescene-status';
    this.statusText.innerText = this.isLeader
      ? 'Choose a Game'
      : 'Waiting for the leader to choose a game...';
    mainContent.appendChild(this.statusText);

    if (this.isLeader) {
      this.renderGameSelectionUI(mainContent);
    }

    this.renderChatBox(); // This will now append to the main container

    // Listen for incoming chat messages
    this.socket.off('gameChatMessage');
    this.socket.on('gameChatMessage', (data) => {
      this.addChatMessage(`${data.name}: ${data.text}`);
    });
  }

  renderGameSelectionUI(container) {
    const gameList = document.createElement('div');
    gameList.className = 'gamescene-selection';

    // Typing Race Button
    const typingRaceBtn = document.createElement('button');
    typingRaceBtn.innerText = 'Start Typing Race';
    typingRaceBtn.onclick = () => {
      this.statusText.innerText = 'Starting Typing Race...';
      this.socket.emit('selectGame', 'TypingGame', (response) => {
        if (!response.success) {
          this.statusText.innerText = response.message;
        }
      });
    };
    gameList.appendChild(typingRaceBtn);

    // Placeholder for more games
    const soonBtn = document.createElement('button');
    soonBtn.innerText = 'More Games Soon...';
    soonBtn.disabled = true;
    gameList.appendChild(soonBtn);

    container.appendChild(gameList);
  }

  renderChatBox() {
    const chatWrapper = document.createElement('div');
    chatWrapper.className = 'gamescene-chat-wrapper';

    // Chat messages container
    this.chatContainer = document.createElement('div');
    this.chatContainer.className = 'chat-container';
    chatWrapper.appendChild(this.chatContainer);

    // Wrapper for the input and button
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'chat-input-wrapper';

    // Chat text input
    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = 'Chat with others...';
    this.chatInput.className = 'chat-input';

    // Send button
    const sendBtn = document.createElement('button');
    sendBtn.innerText = 'Send';
    sendBtn.className = 'chat-send-btn';
    sendBtn.onclick = () => this.sendChatMessage();

    // Add elements to the DOM
    inputWrapper.appendChild(this.chatInput);
    inputWrapper.appendChild(sendBtn);
    chatWrapper.appendChild(inputWrapper);
    this.domContainer.appendChild(chatWrapper);

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
    this.chatContainer.appendChild(p);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  shutdown() {
    console.log('GameScene shutting down, removing listeners.');
    this.socket.off('preCountdown');
    this.socket.off('gameChatMessage');
  }
}
