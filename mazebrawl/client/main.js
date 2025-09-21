// mazebrawl/client/main.js

import LobbyScene from './scenes/LobbyScene.js';
import GameScene from './scenes/GameScene.js';

//determine server URL dynamically
const SERVER_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://varybrawl.onrender.com'; 

//pass server URL to scenes via data object
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
  },
  dom: {
    createContainer: true
  }
};

const game = new Phaser.Game(config);

//make SERVER_URL globally available in scenes
game.SERVER_URL = SERVER_URL;

