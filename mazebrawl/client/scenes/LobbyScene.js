export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
	
	const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 200, 'VARY BRAWL LOBBY', { fontSize: '48px', fill: '#ffffff', fontFamily: 'Arial' }); title.setOrigin(0.5);	
	
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
    btnWrapper.style.display = 'flex';
    btnWrapper.style.gap = '5px';
    btnWrapper.style.marignTop = '10px';
    btnWrapper.style.height = '40px';
    btnWrapper.style.fontSize = '25px';
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
    this.startBtn.onclick = () => {
      this.socket.emit('startGame', (response) => {
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

    this.socket.on('gameStarted', () => {
	  this.statusText.innerText = 'Game Started!';

	  // remove DOM elements
	  document.body.querySelectorAll('div').forEach(el => el.remove());

	  // remove Phaser objects
	  this.children.removeAll(true);

	  // stop LobbyScene so its objects no longer render
	  this.scene.stop('LobbyScene');

	  // start GameScene
	  this.scene.start('GameScene', {
		players: this.players,
		myIndex: this.myIndex,
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
      //reset UI back to prelobby state
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
	  this.leaveBtn.style.display = 'inline-block'; // show leave button

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


  toggleReady() {
    this.socket.emit('toggleReady');
  }

  updateRoom(data) {
    this.playerListDiv.innerHTML = '';

    const maxPlayers = data.maxPlayers || 7;
    this.capacityText.innerText = `Players: ${data.players.length}/${maxPlayers} (minimum 3 required)`;

    data.players.forEach((player, index) => {
      const playerDiv = document.createElement('div');

      if (player.id === data.leaderId) {
        playerDiv.appendChild(document.createTextNode(`#${index + 1} ${player.name}`));

        const leaderSpan = document.createElement('span');
        leaderSpan.style.color = 'lime';
        leaderSpan.style.marginLeft = '8px';
        leaderSpan.style.fontWeight = 'bold';
        leaderSpan.textContent = '[LEADER]';
        playerDiv.appendChild(leaderSpan);
      } else {
        playerDiv.textContent = `#${index + 1} ${player.name}`;

        const statusSpan = document.createElement('span');
        statusSpan.style.marginLeft = '8px';
        statusSpan.style.fontWeight = 'bold';
        if (player.ready) {
          statusSpan.style.color = 'lime';
          statusSpan.textContent = '[READY]';
        } else {
          statusSpan.style.color = 'red';
          statusSpan.textContent = '[NOT READY]';
        }
        playerDiv.appendChild(statusSpan);
      }

      this.playerListDiv.appendChild(playerDiv);
    });

    if (this.socket.id === data.leaderId) {
      this.readyBtn.style.display = 'none';
      this.startBtn.style.display = 'inline-block';
    } else {
      this.readyBtn.style.display = 'inline-block';
      this.startBtn.style.display = 'none';
    }

    // update Ready Button Text for current player
    const currentPlayer = data.players.find(p => p.id === this.socket.id);
    if (currentPlayer && this.socket.id !== data.leaderId) {
      this.readyBtn.innerText = currentPlayer.ready ? 'NOT READY' : 'READY';
    }

    // enable start button if enough players and all are ready
    if (this.socket.id === data.leaderId) {
      const minPlayers = 3;
      const othersReady = data.players
        .filter(p => p.id !== data.leaderId)
        .every(p => p.ready);
      this.startBtn.disabled = !(data.players.length >= minPlayers && othersReady);
    }
  }
}
