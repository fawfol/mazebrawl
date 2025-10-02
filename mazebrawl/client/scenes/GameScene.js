// mazebrawl/client/scenes/GameScene.js
import LanguageManager from '../LanguageManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.players = data.players || [];
    this.myIndex = data.myIndex ?? 0;
    this.socket = data.socket;
    this.leaderId = data.leaderId;
    this.isLeader = this.players[this.myIndex]?.id === data.leaderId;
    this.maxPlayers = 7;
    this.language = data.language || 'en'; //receive language from Lobby
  }

  async create() { 
    console.log('GameScene started');
    document.body.innerHTML = '';

    //instantiate and load language
    this.languageManager = new LanguageManager(this);
    await this.languageManager.loadLanguage(this.language);

    this.socket.off('preCountdown');
    this.socket.on('preCountdown', ({ duration, gameType }) => {
      this.statusText.innerText = 'Game starting...';
      this.scene.stop('GameScene');
      this.scene.start(gameType, {
        players: this.players,
        myIndex: this.myIndex,
        socket: this.socket,
        leaderId: this.leaderId,
        preCountdown: duration,
        language: this.language,
      });
    });

    this.domContainer = document.createElement('div');
    this.domContainer.className = 'gamescene-container';
    this.domContainer.style.justifyContent = 'center'; 
    document.body.appendChild(this.domContainer);

    //language Selector for leader
    if (this.isLeader) {
        const langContainer = document.createElement('div');
        Object.assign(langContainer.style, {
            position: 'absolute', top: '10px', right: '10px', color: 'white'
        });
        const langLabel = document.createElement('span');
        langLabel.innerText = 'LANG/言語: ';
    this.languageSelector = document.createElement('select');
    const languages = [
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' }
	];

	languages.forEach(lang => {
		const option = document.createElement('option');
		option.value = lang.code; // Use 'en' or 'ja' as the value
		option.innerText = lang.name; // Use 'English' or '日本語' as the display text
		this.languageSelector.appendChild(option);
	});
        this.languageSelector.value = this.languageManager.currentLang;
        this.languageSelector.onchange = async () => {
            const newLang = this.languageSelector.value;
            await this.languageManager.loadLanguage(newLang);
            this.updateUIText();
            this.socket.emit('changeLanguage', newLang);
            
            const selectedOption = this.languageSelector.options[this.languageSelector.selectedIndex];
			const langName = selectedOption.text;
			const chatMessage = this.languageManager.get('logLanguageChanged', { lang: langName });
			this.addChatMessage(chatMessage, '#0030FF');
        };
        langContainer.appendChild(langLabel);
        langContainer.appendChild(this.languageSelector);
        this.domContainer.appendChild(langContainer);
    }

    const mainContent = document.createElement('div');
    mainContent.className = 'gamescene-main';
    this.domContainer.appendChild(mainContent);

    this.statusText = document.createElement('h1');
    this.statusText.className = 'gamescene-status';
    mainContent.appendChild(this.statusText);

    this.playerCountText = document.createElement('div');
    this.playerCountText.style.fontSize = '1.2rem';
    this.playerCountText.style.marginBottom = '20px';
    mainContent.appendChild(this.playerCountText);
    this.updatePlayerCount();

    if (this.isLeader) {
      this.renderGameSelectionUI(mainContent);
    }

    this.renderChatBox(mainContent); 
    this.renderBackButton();

    this.socket.off('gameChatMessage');
    this.socket.on('gameChatMessage', (data) => {
      this.addChatMessage(`${data.name}: ${data.text}`);
    });

    this.socket.off('roomUpdate');
    this.socket.on('roomUpdate', async (data) => { //made async
        //language synchronization
        if (data.language && data.language !== this.languageManager.currentLang) {
            await this.languageManager.loadLanguage(data.language);
            if(this.languageSelector) this.languageSelector.value = data.language;
            this.updateUIText();
            
            const langKey = data.language === 'en' ? 'English' : '日本語';
            const langName = this.languageManager.get(langKey);
            const chatMessage = this.languageManager.get('logLanguageChanged', { lang: langName });
            this.addChatMessage(chatMessage, '#0030FF');
        }

        this.players = data.players;
        this.leaderId = data.leaderId;
        this.isLeader = this.socket.id === this.leaderId;
        this.updatePlayerCount();
        this.updateUIText();
    });

    this.socket.off('playerLeft');
    this.socket.on('playerLeft', (playerName) => {
        this.addChatMessage(`${playerName} has left the game.`, 'red');
    });
    
    // ADDED: Initial UI text update
    this.updateUIText();
  }

  // ADDED: New method to update UI text based on language
  updateUIText() {
    this.statusText.innerText = this.isLeader
      ? this.languageManager.get('chooseAGame')
      : this.languageManager.get('waitingForLeader');
  }

  updatePlayerCount() {
    this.playerCountText.innerText = this.languageManager.get('playersCount', {
		count: this.players.length,
		max: this.maxPlayers
	});
  }

  renderGameSelectionUI(container) {
    const gameList = document.createElement('div');
    gameList.className = 'gamescene-selection';

    const typingRaceBtn = document.createElement('button');
    typingRaceBtn.innerText = this.languageManager.get('startTypingRace');
    typingRaceBtn.onclick = () => {
      this.statusText.innerText = 'Starting Typing Race...';
      this.socket.emit('selectGame', 'TypingGame', (response) => {
        if (!response.success) {
          this.statusText.innerText = response.message;
        }
      });
    };
    gameList.appendChild(typingRaceBtn);

    const soonBtn = document.createElement('button');
    soonBtn.innerText = this.languageManager.get('moreGamesSoon');
    soonBtn.disabled = true;
    gameList.appendChild(soonBtn);

    container.appendChild(gameList);
  }
  
  renderChatBox(container) {
    const chatWrapper = document.createElement('div');
    chatWrapper.className = 'gamescene-chat-wrapper';
    chatWrapper.style.marginTop = '20px';

    this.chatContainer = document.createElement('div');
    this.chatContainer.className = 'chat-container';
    this.chatContainer.style.height = '200px'; 
    chatWrapper.appendChild(this.chatContainer);

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'chat-input-wrapper';

    this.chatInput = document.createElement('input');
    this.chatInput.type = 'text';
    this.chatInput.placeholder = this.languageManager.get('chatPlaceholder');
    this.chatInput.className = 'chat-input';

    const sendBtn = document.createElement('button');
	sendBtn.innerText = this.languageManager.get('sendButton');
    sendBtn.className = 'chat-send-btn';
    sendBtn.onclick = () => this.sendChatMessage();

    inputWrapper.appendChild(this.chatInput);
    inputWrapper.appendChild(sendBtn);
    chatWrapper.appendChild(inputWrapper);
    
    container.appendChild(chatWrapper); 

    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendChatMessage();
    });
  }

  renderBackButton() {
    const footer = document.createElement('div');
    Object.assign(footer.style, {
        position: 'absolute',
        bottom: '20px',
        width: '100%',
        textAlign: 'center'
    });

    const backBtn = document.createElement('button');
    backBtn.innerText = this.languageManager.get('backToLobbyButton');
	backBtn.onclick = () => {
		backBtn.disabled = true;
		backBtn.innerText = this.languageManager.get('leavingButton');
        this.socket.emit('leaveRoom', (response) => {
            if (response.success) {
                this.scene.stop('GameScene');
                this.scene.start('LobbyScene');
            } else {
                backBtn.disabled = false;
                backBtn.innerText = this.languageManager.get('backToLobbyButton');
            }
        });
    };

    footer.appendChild(backBtn);
    this.domContainer.appendChild(footer);
  }

  sendChatMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    this.socket.emit('gameChatMessage', text);
    this.chatInput.value = '';
  }

  addChatMessage(msg, color = '#000') {
    const p = document.createElement('p');
    p.innerText = msg;
    p.style.color = color;
    this.chatContainer.appendChild(p);
    this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
  }

  shutdown() {
    console.log('GameScene shutting down, removing listeners.');
	if (this.domContainer) this.domContainer.remove();
	
    this.socket.off('preCountdown');
    this.socket.off('gameChatMessage');
    this.socket.off('roomUpdate');
    this.socket.off('playerLeft');
  }
}
