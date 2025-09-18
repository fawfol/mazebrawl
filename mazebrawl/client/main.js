import LobbyScene from './scenes/LobbyScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#222222',
  scene: [LobbyScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  }
};

const game = new Phaser.Game(config);
