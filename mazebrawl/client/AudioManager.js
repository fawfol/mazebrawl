class AudioManager {
    constructor() {
        this.music = null;
        this.isMuted = true;
        this.volume = 0.5; // Default volume at 50%
        this.game = null;
    }

    init(game) {
        this.game = game;
        
        // Load mute state, default to true (muted)
        const savedMuteState = localStorage.getItem('varybrawl-muted');
        this.isMuted = savedMuteState !== null ? JSON.parse(savedMuteState) : true;

        // Load volume state, default to 0.5
        const savedVolume = localStorage.getItem('varybrawl-volume');
        this.volume = savedVolume !== null ? parseFloat(savedVolume) : 0.5;

        // Apply initial settings
        this.game.sound.mute = this.isMuted;
        this.game.sound.volume = this.volume;
    }

    loadMusic(scene) {
        scene.load.audio('bg-music', 'assets/bg_music.mp3');
    }

    playMusic() {
        if (!this.game || this.music) return;

        this.music = this.game.sound.add('bg-music', {
            loop: true,
            volume: 1.0 // Start at full volume, but master volume will control it
        });

        this.music.play();
    }
    
    setVolume(value) {
        if (!this.game) return;
        const newVolume = parseFloat(value);
        this.volume = newVolume;
        this.game.sound.volume = newVolume;
        localStorage.setItem('varybrawl-volume', this.volume);
    }

    toggleMute() {
        if (!this.game) return;
        this.isMuted = !this.isMuted;
        this.game.sound.mute = this.isMuted;
        localStorage.setItem('varybrawl-muted', this.isMuted);

        // Broadcast a global event that the UI elements can listen for
        document.dispatchEvent(new CustomEvent('muteToggled', { detail: { isMuted: this.isMuted } }));
    }

    // This function now creates both the mute button and the volume slider
    createAudioControls() {
        const controlsContainer = document.createElement('div');
        Object.assign(controlsContainer.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        });

        const muteButton = document.createElement('button');
        muteButton.textContent = this.isMuted ? '🔇' : '🔊';
        muteButton.className = 'mute-button';

        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '1';
        volumeSlider.step = '0.01';
        volumeSlider.value = this.volume;
        volumeSlider.className = 'volume-slider';
        volumeSlider.disabled = this.isMuted; // Disable slider if muted

        muteButton.onclick = () => {
            this.toggleMute();
        };
        
        volumeSlider.oninput = (event) => {
            this.setVolume(event.target.value);
            // If user adjusts volume, implicitly unmute them if they were muted
            if (this.isMuted && parseFloat(event.target.value) > 0) {
                this.toggleMute();
            }
        };

        // Listen for our global event to keep the UI in sync
        document.addEventListener('muteToggled', (event) => {
            const isMuted = event.detail.isMuted;
            muteButton.textContent = isMuted ? '🔇' : '🔊';
            volumeSlider.disabled = isMuted;
        });
        
        controlsContainer.appendChild(muteButton);
        controlsContainer.appendChild(volumeSlider);

        return controlsContainer;
    }
}

export default new AudioManager();
