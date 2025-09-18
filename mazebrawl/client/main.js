import LobbyScene from './scenes/LobbyScene.js';

const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,  //full width
  height: window.innerHeight, //take full height
  backgroundColor: '#222222',
  scene: [LobbyScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,   //canvas resizes with window
    autoCenter: Phaser.Scale.CENTER_BOTH, //center canvas on screen
  }
};

const game = new Phaser.Game(config);
