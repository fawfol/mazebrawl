// mazebrawl/client/main.js

import LobbyScene from './scenes/LobbyScene.js';
import GameScene from './scenes/GameScene.js';

// Connect to Render-hosted server
// Replace <your-render-service> with your Render URL
const socket = io("https://varybrawl.onrender.com");

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth, 
  height: window.innerHeight,
  backgroundColor: '#222222',
  scene: [
    new LobbyScene({ socket }),  // pass socket to scene
    new GameScene({ socket })
  ],
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
