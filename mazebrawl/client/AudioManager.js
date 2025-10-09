class AudioManager {
    constructor() {
        this.music = null;
        this.isMuted = true;
        this.game = null;
    }

    //call this once in main.js to give the manager access to the game instance
    init(game) {
        this.game = game;
        //load the mute preference from browser storage, default to true (muted) if not set
        const savedMuteState = localStorage.getItem('varybrawl-muted');
        this.isMuted = savedMuteState !== null ? JSON.parse(savedMuteState) : true;
    }

    //call this from your preload scene (LobbyScene in this case)
    loadMusic(scene) {
        scene.load.audio('bg-music', 'assets/bg_music.mp3');
    }

    //call this after the music has been loaded
    playMusic() {
        if (!this.game || this.music) return; 

        this.music = this.game.sound.add('bg-music', {
            loop: true,
            volume: 0.4 
        });

        this.music.play();
        this.game.sound.mute = this.isMuted;
    }

    toggleMute() {
        if (!this.game) return;
        this.isMuted = !this.isMuted;
        this.game.sound.mute = this.isMuted;
        //save the user's preference to their browser
        localStorage.setItem('varybrawl-muted', this.isMuted);

        //this allows us to update the button icon externally
        document.dispatchEvent(new CustomEvent('muteToggled', { detail: { isMuted: this.isMuted } }));
    }

    //a helper to create the mute button, ensuring it has the correct icon and event listener
    createMuteButton() {
        const muteButton = document.createElement('button');
        muteButton.textContent = this.isMuted ? '🔇' : '🔊';
        muteButton.className = 'mute-button'; 
        
        muteButton.onclick = () => {
            this.toggleMute();
            muteButton.textContent = this.isMuted ? '🔇' : '🔊'; 
        };
        
        //listen for external toggles to keep the icon in sync
        document.addEventListener('muteToggled', (event) => {
            muteButton.textContent = event.detail.isMuted ? '🔇' : '🔊';
        });

        return muteButton;
    }
}

export default new AudioManager();
