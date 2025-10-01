// mazebrawl/client/scenes/LobbyScene.js

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

   create() {
    const isMobile = this.scale.width < 768;
    const titleFontSize = isMobile ? '32px' : '48px';
    const topMargin = 40; //approx 2.5rem (2.5 * 16px)

    const title = this.add.text(
      this.scale.width / 2,
      topMargin,
      'VARY BRAWL',
      { fontSize: titleFontSize, fill: '#ffffff', fontFamily: 'Arial', align: 'center' }
    );
    title.setOrigin(0.5, 0); // Center horizontally, align to the top vertically

    this.socket = io(this.game.SERVER_URL);
    
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = 0;
    container.style.left = 0;
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.paddingTop = '70px';
    container.style.color = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.textAlign = 'center';
    container.style.gap = '15px';
    document.body.appendChild(container);

    // form container
    this.formContainer = document.createElement('div');
    this.formContainer.style.display = 'flex';
    this.formContainer.style.flexDirection = 'column';
    this.formContainer.style.alignItems = 'center';
    this.formContainer.style.gap = '12px';
    container.appendChild(this.formContainer);

    // name input
    this.nameInput = document.createElement('input');
    this.nameInput.placeholder = 'ENTER YOUR NAME';
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
    this.roomInput.placeholder = 'Enter Room ID (5 chars)';
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
    this.createBtn.innerText = 'CREATE ROOM';
    btnWrapper.appendChild(this.createBtn);

    this.joinBtn = document.createElement('button');
    this.joinBtn.innerText = 'JOIN ROOM';
    btnWrapper.appendChild(this.joinBtn);

    // room capacity display
    this.capacityText = document.createElement('div');
    this.capacityText.style.marginTop = '10px';
    this.capacityText.style.fontSize = '16px';
    container.appendChild(this.capacityText);

    // status text
    this.statusText = document.createElement('div');
    this.statusText.style.marginTop = '25px';
    container.appendChild(this.statusText);

    // player list
    this.playerListDiv = document.createElement('div');
    this.playerListDiv.style.marginTop = '20px';
    container.appendChild(this.playerListDiv);

    // ready and start buttons
    this.readyBtn = document.createElement('button');
    this.readyBtn.innerText = 'READY';
    this.readyBtn.style.marginTop = '10px';
    this.readyBtn.style.height = '40px';
    this.readyBtn.style.fontSize = '20px';
    this.readyBtn.style.display = 'none';
    container.appendChild(this.readyBtn);
    this.startBtn = document.createElement('button');
    this.startBtn.innerText = 'START GAME';
    this.startBtn.style.marginTop = '10px';
    this.startBtn.style.height = '40px';
    this.startBtn.style.fontSize = '20px';
    this.startBtn.style.display = 'none';
    container.appendChild(this.startBtn);

    // activity logs
    this.activityLogDiv = document.createElement('div');
    this.activityLogDiv.style.marginTop = '20px';
    this.activityLogDiv.style.fontSize = '14px';
    this.activityLogDiv.style.textAlign = 'left';
    this.activityLogDiv.style.maxWidth = '300px';
    container.appendChild(this.activityLogDiv);
    this.activityLogDiv.style.height = '100px';
    this.activityLogDiv.style.overflowY = 'auto';
    this.activityLogDiv.style.background = 'rgba(0,0,0,0.3)';
    this.activityLogDiv.style.padding = '5px';
    this.activityLogDiv.style.borderRadius = '5px';
    this.activityLogDiv.style.width = '80%';
    this.activityLogDiv.style.maxWidth = '400px';

	//leave room button
	this.leaveBtn = document.createElement('button');
	this.leaveBtn.innerText = 'LEAVE ROOM';
	this.leaveBtn.style.marginTop = '10px';
	this.leaveBtn.style.height = '40px';
	this.leaveBtn.style.fontSize = '20px';
	this.leaveBtn.style.display = 'none'; // hidden until inside a room
	container.appendChild(this.leaveBtn);

	this.leaveBtn.onclick = () => this.leaveRoom();

    // helper method to log events
    this.logActivity = (message) => {
      const time = new Date().toLocaleTimeString();
      const entry = document.createElement('div');
      entry.innerText = `[${time}] ${message}`;
      this.activityLogDiv.appendChild(entry);

      //keep only last 5 logs
      while (this.activityLogDiv.childNodes.length > 5) {
        this.activityLogDiv.removeChild(this.activityLogDiv.firstChild);
      }
    };

    // event listeners
    this.createBtn.onclick = () => this.createRoom();
    this.joinBtn.onclick = () => this.joinRoom();
    this.readyBtn.onclick = () => this.toggleReady();
    
    // UPDATED: Use the new 'lobbyStart' event
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
    this.socket.on('roomCreated', (roomId) => {
      this.logActivity(`Room created! ID: ${roomId}`);
    });

    this.socket.on('playerJoined', (name) => {
      this.logActivity(`${name} joined the room`);
    });

    this.socket.on('playerLeft', (name) => {
      this.logActivity(`${name} left the room`);
    });

    this.socket.on('leaderChanged', (newLeaderName) => {
      this.logActivity(`Leader left — new leader is ${newLeaderName}`);
    });

    this.socket.on('roomUpdate', (data) => this.updateRoom(data));
	
	// NEW: Add a listener for the pre-countdown event from the server
	this.socket.on('startPreCountdown', (countdownValue) => {
		this.hideLobbyUI();

		// Create a container for the countdown
		this.countdownContainer = document.createElement('div');
		Object.assign(this.countdownContainer.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100%',
			height: '100%',
			background: 'rgba(0,0,0,0.8)',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			zIndex: '100'
		});

		// Create the countdown text element
		this.countdownText = document.createElement('h1');
		this.countdownText.style.fontSize = '10rem';
		this.countdownText.style.color = 'white';
		this.countdownText.innerText = countdownValue;
		this.countdownContainer.appendChild(this.countdownText);

		document.body.appendChild(this.countdownContainer);

		let currentCount = countdownValue;
		const countdownInterval = setInterval(() => {
			currentCount--;
			if (currentCount > 0) {
				this.countdownText.innerText = currentCount;
			} else {
				this.countdownText.innerText = 'GO!';
				clearInterval(countdownInterval);
				// The scene transition will be handled by the gameHasStarted event
			}
		}, 1000);
	});
	
	// UPDATED: Listen for the new 'gameHasStarted' event
    this.socket.on('gameHasStarted', () => {
	  this.statusText.innerText = 'Game Started! Moving to game selection...';
	  
	  if (this.countdownContainer) {
		this.countdownContainer.remove();
	  }

	  document.body.querySelectorAll('div').forEach(el => el.remove());
	  this.children.removeAll(true);
      
      // Pass player data to the next scene
	  const myPlayerIndex = this.players.findIndex(p => p.id === this.socket.id);

	  this.scene.stop('LobbyScene');
	  this.scene.start('GameScene', {
		players: this.players,
		myIndex: myPlayerIndex,
		socket: this.socket,
		leaderId: this.leaderId
	  });
	});

  }
	//create room
  createRoom() {
    const playerName = this.nameInput.value.trim();
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    this.socket.emit('createRoom', playerName, (response) => {
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

	//join room
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
    } else {
      alert(response.message || 'Error leaving room.');
    }
  });
}

	showLobbyUI(data) {
	  this.formContainer.style.display = 'none';
	  this.leaveBtn.style.display = 'inline-block';

	  if (this.socket.id !== data.leaderId) {
		this.readyBtn.style.display = 'inline-block';
		this.readyBtn.innerText = 'READY';
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
	
	// NEW: Helper function to hide the lobby UI
	hideLobbyUI() {
		this.formContainer.style.display = 'none';
		this.leaveBtn.style.display = 'none';
		this.readyBtn.style.display = 'none';
		this.startBtn.style.display = 'none';
		this.playerListDiv.style.display = 'none';
		this.capacityText.style.display = 'none';
		this.statusText.style.display = 'none';
		this.activityLogDiv.style.display = 'none';
	}


  toggleReady() {
    this.socket.emit('toggleReady');
  }

  updateRoom(data) {
    // Store player data for passing to next scene
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
        this.readyBtn.innerText = currentPlayer.ready ? 'NOT READY' : 'READY';
    }

    if (this.socket.id === data.leaderId) {
        const minPlayers = 2;
        const othersReady = data.players.filter(p => p.id !== data.leaderId).every(p => p.ready);
        this.startBtn.disabled = !(data.players.length >= minPlayers && othersReady);
    }
}

  shutdown() {
    console.log('LobbyScene shutting down, removing listeners.');
    this.socket.off('gameHasStarted'); // UPDATED
    this.socket.off('roomUpdate');
    this.socket.off('roomCreated');
    this.socket.off('playerJoined');
    this.socket.off('playerLeft');
    this.socket.off('leaderChanged');
  }
}
