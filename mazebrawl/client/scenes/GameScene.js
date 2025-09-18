export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {

    this.load.image('weapon', 'assets/sprites/weapon.png');
  }

  create() {
    this.socket = io();

    this.add.rectangle(400, 300, 800, 600, 0x444444);

    this.players = new Map();

    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.input.mouse.disableContextMenu();
    this.pointer = this.input.activePointer;

    this.inputTimer = 0;
    this.inputInterval = 50; 

    this.socket.on('gameState', (playersData) => {
      this.updatePlayers(playersData);
    });

    this.socket.emit('playerReadyInGame');
  }

  update(time, delta) {
    this.inputTimer += delta;
    if (this.inputTimer >= this.inputInterval) {
      this.inputTimer = 0;
      this.sendInput();
    }
  }

  sendInput() {
    const input = {
      up: this.keys.up.isDown,
      down: this.keys.down.isDown,
      left: this.keys.left.isDown,
      right: this.keys.right.isDown,
      aimX: this.pointer.worldX,
      aimY: this.pointer.worldY
    };
    this.socket.emit('playerInput', input);
  }

  updatePlayers(playersData) {

    for (const id of this.players.keys()) {
      if (!playersData[id]) {
        this.players.get(id).container.destroy();
        this.players.delete(id);
      }
    }

    for (const id in playersData) {
      const data = playersData[id];
      if (!this.players.has(id)) {

        const container = this.add.container(data.x, data.y);

        const circle = this.add.circle(0, 0, 20, data.color);
        const weapon = this.add.sprite(0, 0, 'weapon').setOrigin(0.5, 0.5);

        container.add(circle);
        container.add(weapon);

        this.players.set(id, { container, circle, weapon });
      }

      const player = this.players.get(id);
      player.container.x = data.x;
      player.container.y = data.y;

      const dx = data.aimX - data.x;
      const dy = data.aimY - data.y;
      player.weapon.rotation = Math.atan2(dy, dx);
    }
  }
}
