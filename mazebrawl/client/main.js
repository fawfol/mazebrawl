// mazebrawl/client/main.js

import LobbyScene from './scenes/LobbyScene.js';
import GameScene from './scenes/GameScene.js';
import TypingGame from './scenes/TypingGame.js';

//determine server URL dynamically
const SERVER_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://varybrawl.onrender.com'; 

//pass server URL to scenes via data object
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight *0.8,
  backgroundColor: '#111111',
  scene: [LobbyScene, GameScene, TypingGame],
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

