// mazebrawl/client/scenes/LobbyScene.js
import LanguageManager from '../LanguageManager.js';
import AudioManager from '../AudioManager.js';

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }
	
	preload() {
    AudioManager.loadMusic(this);
  }
  
   async create() {
    document.body.innerHTML = '';

    AudioManager.playMusic();

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
    
   
    const audioControls = AudioManager.createAudioControls();
    Object.assign(audioControls.style, {
        position: 'absolute',
        top: '10px',
        left: '10px'
    });
    this.container.appendChild(audioControls);
    
    this.langContainer = document.createElement('div');
    Object.assign(this.langContainer.style, {
        position: 'absolute',
        top: '10px',
        right: '10px', // Position on the right
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
    });
    
    this.languageControls = document.createElement('div');
    this.languageControls.style.display = 'contents';
    this.langContainer.appendChild(this.languageControls);

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
        // If we are a leader, notify the server
        if (this.leaderId && this.socket.id === this.leaderId) {
            this.socket.emit('changeLanguage', newLang);
        }
    };
    this.languageControls.appendChild(langLabel);
    this.languageControls.appendChild(this.languageSelector);
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

    //status text is now a container for the ID and share button
    this.statusContainer = document.createElement('div');
    this.statusContainer.style.marginTop = '25px';
    this.statusContainer.style.display = 'flex';
    this.statusContainer.style.alignItems = 'center';
    this.statusContainer.style.justifyContent = 'center';
    this.statusContainer.style.gap = '10px';
    this.statusContainer.style.minHeight = '40px'; // Reserve space
    this.container.appendChild(this.statusContainer);

    this.statusText = document.createElement('div');
    this.statusContainer.appendChild(this.statusText);

    this.shareBtn = document.createElement('button');
    this.shareBtn.style.display = 'none'; //hidden by default
    this.statusContainer.appendChild(this.shareBtn);

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
    this.socket.on('roomCreated', (roomId) => this.logActivity(this.languageManager.get('logRoomCreated', { id: roomId })));
    this.socket.on('playerJoined', (name) => this.logActivity(this.languageManager.get('logPlayerJoined', { name: name })));
    this.socket.on('playerLeft', (name) => this.logActivity(this.languageManager.get('logPlayerLeft', { name: name })));
    this.socket.on('leaderChanged', (newLeaderName) => this.logActivity(this.languageManager.get('logNewLeader', { name: newLeaderName })));
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
        language: this.languageManager.currentLang 
	  });
	});

    await this.languageManager.loadLanguage(this.languageManager.currentLang);
    this.updateUIText();

    this.checkUrlForRoomId();
  }
  
  //new method to check URL hash for a Room ID
  checkUrlForRoomId() {
    const roomIdFromUrl = window.location.hash.substring(1).toUpperCase();
    if (roomIdFromUrl && roomIdFromUrl.length === 5) {
        this.roomInput.value = roomIdFromUrl;
        this.logActivity(this.languageManager.get('logFoundRoomId', { id: roomIdFromUrl }));
        this.nameInput.focus(); // Focus on name input for convenience
    }
  }

  //new method to update all UI text from translation files
  updateUIText() {
    this.title.innerText = this.languageManager.get('varyBrawlTitle');
    this.nameInput.placeholder = this.languageManager.get('enterYourName');
    this.roomInput.placeholder = this.languageManager.get('enterRoomId');
    this.createBtn.innerText = this.languageManager.get('createRoomButton');
    this.joinBtn.innerText = this.languageManager.get('joinRoomButton');
    this.leaveBtn.innerText = this.languageManager.get('leaveRoomButton');
    this.startBtn.innerText = this.languageManager.get('startGameButton');
    this.shareBtn.innerText = this.languageManager.get('share');
  }

  createRoom() {
    const playerName = this.nameInput.value.trim();
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    //send current language when creating a room
    this.socket.emit('createRoom', playerName, this.languageManager.currentLang, (response) => {
      if (response.success) {
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
          const msg = this.languageManager.get('logYouLeft');
              this.languageControls.style.display = 'contents';
                  this.shareBtn.style.display = 'none';
                  window.location.hash = '';
        } else {
          alert(response.message || 'Error leaving room.');
        }
      });
    }


	showLobbyUI(data) {
      this.formContainer.style.display = 'none';
      this.languageControls.style.display = 'none'; 
      this.leaveBtn.style.display = 'inline-block';

      this.statusText.innerText = this.languageManager.get('roomIdDisplay', { id: data.roomId });
      Object.assign(this.statusText.style, {
        fontSize: '17px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        color: 'yellow',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px 20px',
        borderRadius: '5px'
      });
      this.shareBtn.style.display = 'inline-block';
      const shareUrl = `${window.location.origin}${window.location.pathname}#${data.roomId}`;
      this.shareBtn.onclick = () => {
          navigator.clipboard.writeText(shareUrl).then(() => {
              this.shareBtn.innerText = '✔';
              setTimeout(() => { this.shareBtn.innerText = this.languageManager.get('share'); }, 5000);
          }).catch(err => {
              console.error('Failed to copy: ', err);
              alert('Failed to copy link.');
          });
      };
      window.location.hash = data.roomId; //set URL hash for refreshes


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
    //language synchronization logic
    if (data.language && data.language !== this.languageManager.currentLang) {
        console.log(`Room language is ${data.language}, switching...`);
        await this.languageManager.loadLanguage(data.language);
        this.languageSelector.value = data.language;
        this.updateUIText();
    }
    //only allow leader to change language
    this.languageSelector.disabled = (this.socket.id !== data.leaderId && data.players.some(p => p.id === this.socket.id));


    this.players = data.players;
    this.leaderId = data.leaderId;

    this.playerListDiv.innerHTML = '';

    const maxPlayers = data.maxPlayers || 4;
    this.capacityText.innerText = this.languageManager.get('playersCountLobby', {
		count: data.players.length,
		max: maxPlayers
	});

    data.players.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        let displayName = player.name;

        if (player.id === data.leaderId) {
            displayName = `${displayName} [LEADER]`;
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
        //use language manager for button text
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
