//mazebrawl/client/main.js 


import LobbyScene from './scenes/LobbyScene.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth, 
  height: window.innerHeight,
  backgroundColor: '#222222',
  scene: [LobbyScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  }
};

const game = new Phaser.Game(config);
