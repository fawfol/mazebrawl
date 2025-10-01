// mazebrawl/client/scenes/LobbyScene.js
import LanguageManager from '../LanguageManager.js';

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

   async create() {
	document.body.innerHTML = '';


    this.socket = io(this.game.SERVER_URL);
    this.languageManager = new LanguageManager(this);
    
    const isMobile = this.scale.width < 768;

   	this.container = document.createElement('div');
	this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.paddingTop = '20px';
    this.container.style.color = 'white';
    this.container.style.fontFamily = 'Arial, sans-serif';
    this.container.style.textAlign = 'center';
    this.container.style.gap = '15px';
    document.body.appendChild(this.container);
    
    // ADDED: Language Selector
    this.langContainer = document.createElement('div');
    Object.assign(this.langContainer.style, {
        position: 'absolute', top: '10px', right: '10px'
    });
    const langLabel = document.createElement('span');
    langLabel.innerText = 'Language: ';
    this.languageSelector = document.createElement('select');
    ['en', 'ja'].forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.innerText = lang.toUpperCase();
        this.languageSelector.appendChild(option);
    });
    this.languageSelector.value = this.languageManager.currentLang;
    this.languageSelector.onchange = async () => {
        const newLang = this.languageSelector.value;
        await this.languageManager.loadLanguage(newLang);
        this.updateUIText();
        // If we are a leader, notify the server
        if (this.leaderId && this.socket.id === this.leaderId) {
            this.socket.emit('changeLanguage', newLang);
        }
    };
    this.langContainer.appendChild(langLabel);
    this.langContainer.appendChild(this.languageSelector);
    this.container.appendChild(this.langContainer);
    
    //title
	this.title = document.createElement('h1');
    Object.assign(this.title.style, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        margin: '0 0 10px 0'
    });
    this.title.style.fontSize = isMobile ? '36px' : '48px';
    this.container.appendChild(this.title);

    // form container
    this.formContainer = document.createElement('div');
    this.formContainer.style.display = 'flex';
    this.formContainer.style.flexDirection = 'column';
    this.formContainer.style.alignItems = 'center';
    this.formContainer.style.gap = '12px';
    this.container.appendChild(this.formContainer);

    // name input
    this.nameInput = document.createElement('input');
    this.nameInput.style.textAlign = 'center';
    this.nameInput.style.padding = '8px';
    this.nameInput.style.borderRadius = '5px';
    this.nameInput.style.border = 'none';
    this.nameInput.style.outline = 'none';
    this.nameInput.addEventListener('input', () => {
      this.nameInput.value = this.nameInput.value.toUpperCase();
    });
    this.formContainer.appendChild(this.nameInput);

    // room input
    this.roomInput = document.createElement('input');
    this.roomInput.style.textAlign = 'center';
    this.roomInput.style.padding = '8px';
    this.roomInput.style.borderRadius = '5px';
    this.roomInput.style.border = 'none';
    this.roomInput.style.outline = 'none';
    this.roomInput.style.textTransform = 'uppercase';
    this.roomInput.addEventListener('input', () => {
      this.roomInput.value = this.roomInput.value.toUpperCase();
    });
    this.formContainer.appendChild(this.roomInput);

    // buttons
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'lobby-buttons-wrapper';
    this.formContainer.appendChild(btnWrapper);

    this.createBtn = document.createElement('button');
    btnWrapper.appendChild(this.createBtn);

    this.joinBtn = document.createElement('button');
    btnWrapper.appendChild(this.joinBtn);

    // room capacity display
    this.capacityText = document.createElement('div');
    this.capacityText.style.marginTop = '10px';
    this.capacityText.style.fontSize = '16px';
    this.container.appendChild(this.capacityText);

    // status text
    this.statusText = document.createElement('div');
    this.statusText.style.marginTop = '25px';
    this.container.appendChild(this.statusText);

    // player list
    this.playerListDiv = document.createElement('div');
    this.playerListDiv.style.marginTop = '20px';
    this.container.appendChild(this.playerListDiv);

    // ready and start buttons
    this.readyBtn = document.createElement('button');
    this.readyBtn.style.marginTop = '10px';
    this.readyBtn.style.height = '40px';
    this.readyBtn.style.fontSize = '20px';
    this.readyBtn.style.display = 'none';
    this.container.appendChild(this.readyBtn);

    this.startBtn = document.createElement('button');
    this.startBtn.style.marginTop = '10px';
    this.startBtn.style.height = '40px';
    this.startBtn.style.fontSize = '20px';
    this.startBtn.style.display = 'none';
    this.container.appendChild(this.startBtn);

    // activity logs
    this.activityLogDiv = document.createElement('div');
    this.activityLogDiv.style.marginTop = '20px';
    this.activityLogDiv.style.fontSize = '14px';
    this.activityLogDiv.style.textAlign = 'left';
    this.activityLogDiv.style.maxWidth = '300px';
    this.container.appendChild(this.activityLogDiv);
    this.activityLogDiv.style.height = '100px';
    this.activityLogDiv.style.overflowY = 'auto';
    this.activityLogDiv.style.background = 'rgba(0,0,0,0.3)';
    this.activityLogDiv.style.padding = '5px';
    this.activityLogDiv.style.borderRadius = '5px';
    this.activityLogDiv.style.width = '80%';
    this.activityLogDiv.style.maxWidth = '400px';

	//leave room button
	this.leaveBtn = document.createElement('button');
	this.leaveBtn.style.marginTop = '10px';
	this.leaveBtn.style.height = '40px';
	this.leaveBtn.style.fontSize = '20px';
	this.leaveBtn.style.display = 'none';
	this.container.appendChild(this.leaveBtn);

	this.leaveBtn.onclick = () => this.leaveRoom();

    this.logActivity = (message) => {
      const time = new Date().toLocaleTimeString();
      const entry = document.createElement('div');
      entry.innerText = `[${time}] ${message}`;
      this.activityLogDiv.appendChild(entry);
      while (this.activityLogDiv.childNodes.length > 5) {
        this.activityLogDiv.removeChild(this.activityLogDiv.firstChild);
      }
    };

    this.createBtn.onclick = () => this.createRoom();
    this.joinBtn.onclick = () => this.joinRoom();
    this.readyBtn.onclick = () => this.toggleReady();
    
    this.startBtn.onclick = () => {
      this.socket.emit('lobbyStart', (response) => {
        if (!response.success) {
          alert(response.message);
        } else {
          this.statusText.innerText = 'Game starting...';
        }
      });
    };

    //SOCKET EVENT HANDLERS
    this.socket.on('roomCreated', (roomId) => this.logActivity(`Room created! ID: ${roomId}`));
    this.socket.on('playerJoined', (name) => this.logActivity(`${name} joined the room`));
    this.socket.on('playerLeft', (name) => this.logActivity(`${name} left the room`));
    this.socket.on('leaderChanged', (newLeaderName) => this.logActivity(`Leader left — new leader is ${newLeaderName}`));
    this.socket.on('roomUpdate', (data) => this.updateRoom(data));
	
    this.socket.on('gameHasStarted', () => {
	  this.statusText.innerText = 'Game Started! Moving to game selection...';
	  document.body.querySelectorAll('div').forEach(el => el.remove());
	  this.children.removeAll(true);
      
      this.scene.stop('LobbyScene');
	  this.scene.start('GameScene', {
		players: this.players,
		myIndex: this.players.findIndex(p => p.id === this.socket.id),
		socket: this.socket,
		leaderId: this.leaderId,
        language: this.languageManager.currentLang // ADDED: Pass language
	  });
	});

    await this.languageManager.loadLanguage(this.languageManager.currentLang);
    this.updateUIText();
  }
  
  // ADDED: New method to update all UI text from translation files
  updateUIText() {
    this.title.innerText = this.languageManager.get('varyBrawlTitle');
    this.nameInput.placeholder = this.languageManager.get('enterYourName');
    this.roomInput.placeholder = this.languageManager.get('enterRoomId');
    this.createBtn.innerText = this.languageManager.get('createRoomButton');
    this.joinBtn.innerText = this.languageManager.get('joinRoomButton');
    this.leaveBtn.innerText = this.languageManager.get('leaveRoomButton');
    this.startBtn.innerText = this.languageManager.get('startGameButton');
  }

  createRoom() {
    const playerName = this.nameInput.value.trim();
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    // CHANGED: Send current language when creating a room
    this.socket.emit('createRoom', playerName, this.languageManager.currentLang, (response) => {
      if (response.success) {
		this.statusText.style.fontSize = '17px';
		this.statusText.style.fontWeight = 'bold';
		this.statusText.style.letterSpacing = '1px';
		this.statusText.style.color = 'yellow';
		this.statusText.style.background = 'rgba(0,0,0,0.5)';
		this.statusText.style.padding = '10px';
		this.statusText.style.borderRadius = '2px';
      
		this.statusText.innerText = `Room ID: ${response.roomId}`;
        this.showLobbyUI(response);
      } else {
        alert('Error creating room.');
      }
    });
  }

  joinRoom() {
    const playerName = this.nameInput.value.trim();
    const roomId = this.roomInput.value.trim();
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    if (roomId.length !== 5) {
      alert('Room ID must be 5 characters.');
      return;
    }
    this.socket.emit('joinRoom', roomId, playerName, (response) => {
      if (response.success) {
        this.statusText.innerText = `Joined room : ${response.roomId}`;
        this.showLobbyUI(response);
      } else {
        alert(response.message || 'Error joining room.');
      }
    });
  }

	leaveRoom() {
      this.socket.emit('leaveRoom', (response) => {
        if (response.success) {
          this.formContainer.style.display = 'flex';
          this.readyBtn.style.display = 'none';
          this.startBtn.style.display = 'none';
          this.leaveBtn.style.display = 'none';
          this.playerListDiv.innerHTML = '';
          this.capacityText.innerText = '';
          this.statusText.innerText = 'You left the room.';
          this.logActivity('You left the room.');
          this.langContainer.style.display = 'block'; // Show language selector again
        } else {
          alert(response.message || 'Error leaving room.');
        }
      });
    }

	showLobbyUI(data) {
	  this.formContainer.style.display = 'none';
      this.langContainer.style.display = 'none'; // Hide main language selector
	  this.leaveBtn.style.display = 'inline-block';

	  if (this.socket.id !== data.leaderId) {
		this.readyBtn.style.display = 'inline-block';
	  } else {
		this.readyBtn.style.display = 'none';
	  }

	  if (this.socket.id === data.leaderId) {
		this.startBtn.style.display = 'inline-block';
		this.startBtn.disabled = true;
	  } else {
		this.startBtn.style.display = 'none';
	  }

	  this.updateRoom(data);
	}

  toggleReady() {
    this.socket.emit('toggleReady');
  }

  async updateRoom(data) {
    // ADDED: Language synchronization logic
    if (data.language && data.language !== this.languageManager.currentLang) {
        console.log(`Room language is ${data.language}, switching...`);
        await this.languageManager.loadLanguage(data.language);
        this.languageSelector.value = data.language;
        this.updateUIText();
    }
    // Only allow leader to change language
    this.languageSelector.disabled = (this.socket.id !== data.leaderId && data.players.some(p => p.id === this.socket.id));


    this.players = data.players;
    this.leaderId = data.leaderId;

    this.playerListDiv.innerHTML = '';

    const maxPlayers = data.maxPlayers || 7;
    this.capacityText.innerText = `Players: ${data.players.length}/${maxPlayers} (minimum 2 required)`;

    data.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        let displayName = player.name;

        if (player.id === data.leaderId) {
            displayName = `👑 ${displayName} [LEADER]`;
            playerDiv.style.color = 'lime';
        } else {
            displayName = `${displayName} ${player.ready ? '[READY]' : '[NOT READY]'}`;
            playerDiv.style.color = player.ready ? 'lime' : 'red';
        }
        playerDiv.textContent = `#${index + 1} ${displayName}`;
        this.playerListDiv.appendChild(playerDiv);
    });

    if (this.socket.id === data.leaderId) {
        this.readyBtn.style.display = 'none';
        this.startBtn.style.display = 'inline-block';
    } else {
        this.readyBtn.style.display = 'inline-block';
        this.startBtn.style.display = 'none';
    }

    const currentPlayer = data.players.find(p => p.id === this.socket.id);
    if (currentPlayer && this.socket.id !== data.leaderId) {
        // CHANGED: Use language manager for button text
        this.readyBtn.innerText = currentPlayer.ready 
            ? this.languageManager.get('notReadyButton') 
            : this.languageManager.get('readyButton');
    }

    if (this.socket.id === data.leaderId) {
        const minPlayers = 2;
        const othersReady = data.players.filter(p => p.id !== data.leaderId).every(p => p.ready);
        this.startBtn.disabled = !(data.players.length >= minPlayers && othersReady);
    }
}

  shutdown() {
	console.log('LobbyScene shutting down, removing listeners and DOM elements.');
    if (this.container) this.container.remove();
    this.socket.off('gameHasStarted');
    this.socket.off('roomUpdate');
    this.socket.off('roomCreated');
    this.socket.off('playerJoined');
    this.socket.off('playerLeft');
    this.socket.off('leaderChanged');
  }
}
