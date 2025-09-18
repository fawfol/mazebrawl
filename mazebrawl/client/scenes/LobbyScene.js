export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    this.add.text(20, 20, 'Maze Brawl Lobby', { fontSize: '32px', fill: '#ffffff' });

    this.socket = io();

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
	container.style.color = 'white';
	container.style.fontFamily = 'Arial, sans-serif';
	container.style.textAlign = 'center';
	document.body.appendChild(container);


    this.formContainer = document.createElement('div');
    container.appendChild(this.formContainer);

    this.nameInput = document.createElement('input');
    this.nameInput.placeholder = 'ENTER YOUR NAME';
    this.nameInput.style.marginBottom = '10px';
    this.nameInput.addEventListener('input', () => {
	  this.nameInput.value = this.nameInput.value.toUpperCase();
	});

    this.formContainer.appendChild(this.nameInput);
    this.formContainer.appendChild(document.createElement('br'));
    this.roomInput = document.createElement('input');
    this.roomInput.placeholder = 'Enter Room ID (5 chars)';
    this.roomInput.style.marginBottom = '10px';
    this.roomInput.style.textTransform = 'uppercase';
    this.roomInput.addEventListener('input', () => {
      this.roomInput.value = this.roomInput.value.toUpperCase();
    });
    this.formContainer.appendChild(this.roomInput);
    this.formContainer.appendChild(document.createElement('br'));

    // Buttons
    this.createBtn = document.createElement('button');
    this.createBtn.innerText = 'Create Room';
    this.createBtn.style.marginRight = '10px';
    this.formContainer.appendChild(this.createBtn);

    this.joinBtn = document.createElement('button');
    this.joinBtn.innerText = 'Join Room';
    this.formContainer.appendChild(this.joinBtn);

    this.statusText = document.createElement('div');
    this.statusText.style.marginTop = '20px';
    container.appendChild(this.statusText);

    this.playerListDiv = document.createElement('div');
    this.playerListDiv.style.marginTop = '20px';
    container.appendChild(this.playerListDiv);

    this.readyBtn = document.createElement('button');
    this.readyBtn.innerText = 'Ready';
    this.readyBtn.style.marginTop = '10px';
    this.readyBtn.style.display = 'none';
    container.appendChild(this.readyBtn);

    this.startBtn = document.createElement('button');
    this.startBtn.innerText = 'Start Game';
    this.startBtn.style.marginTop = '10px';
    this.startBtn.style.display = 'none';
    container.appendChild(this.startBtn);

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

    this.socket.on('roomUpdate', (data) => this.updateRoom(data));

    this.socket.on('gameStarted', () => {
      this.statusText.innerText = 'Game Started!';
      console.log('Received gameStarted event');
      // TODO: this.scene.start('GameScene');
    });
  }

  createRoom() {
    const playerName = this.nameInput.value.trim();
    if (!playerName) {
      alert('Please enter your name.');
      return;
    }
    this.socket.emit('createRoom', playerName, (response) => {
      if (response.success) {
        this.statusText.innerText = `Room created! Room ID: ${response.roomId}\nYou are the leader.`;
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
        this.statusText.innerText = `Joined room ${response.roomId}`;
        this.showLobbyUI(response);
      } else {
        alert(response.message || 'Error joining room.');
      }
    });
  }

  showLobbyUI(data) {
    this.formContainer.style.display = 'none';

    if (this.socket.id !== data.leaderId) {
      this.readyBtn.style.display = 'inline-block';
      this.readyBtn.innerText = 'Ready';
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
      const minPlayers = 3;
      const othersReady = data.players
        .filter(p => p.id !== data.leaderId)
        .every(p => p.ready);
      this.startBtn.disabled = !(data.players.length >= minPlayers && othersReady);
    }
  }
}
