// mazebrawl/client/scenes/GameScene.js
import LanguageManager from '../LanguageManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.players = data.players || [];
        this.myIndex = data.myIndex ?? 0;
        this.socket = data.socket;
        this.leaderId = data.leaderId;
        this.isLeader = this.players[this.myIndex]?.id === data.leaderId;
        this.maxPlayers = 7;
        this.language = data.language || 'en'; //receive language from Lobby
    }

    async create() { 
        console.log('GameScene started');
        document.body.innerHTML = '';

        this.languageManager = new LanguageManager(this);
        await this.languageManager.loadLanguage(this.language);

        this.socket.off('preCountdown');
        this.socket.on('preCountdown', ({ duration, gameType }) => {
            this.statusText.innerText = 'Game starting...';
            this.scene.stop('GameScene');
            this.scene.start(gameType, {
                players: this.players,
                myIndex: this.myIndex,
                socket: this.socket,
                leaderId: this.leaderId,
                preCountdown: duration,
                language: this.language,
            });
        });

        this.domContainer = document.createElement('div');
        this.domContainer.className = 'gamescene-container';

        // --- MODIFIED FOR MOBILE LAYOUT ---
        //flexbox to control the main layout and ensure it fits the screen height
        Object.assign(this.domContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            height: '100dvh', //dynamic viewport height for mobile
            padding: '20px',
            boxSizing: 'border-box'
        });
        document.body.appendChild(this.domContainer);
        
        // --- language selector is now part of mainContent so it flows with the layout ---
        const mainContent = document.createElement('div');
        mainContent.className = 'gamescene-main';
        this.domContainer.appendChild(mainContent);

        // ---only create language selector if leader, but don't position absolutely ---
        if (this.isLeader) {
            this.renderLanguageSelector(mainContent);
        }

        this.statusText = document.createElement('h1');
        this.statusText.className = 'gamescene-status';
        mainContent.appendChild(this.statusText);

        this.playerCountText = document.createElement('div');
        this.playerCountText.style.fontSize = '1.2rem';
        this.playerCountText.style.marginBottom = '20px';
        mainContent.appendChild(this.playerCountText);
        this.updatePlayerCount();

        this.renderGameSelectionUI(mainContent);
        this.renderChatBox(this.domContainer); // append chat to main container
        this.renderBackButton();

        //ocket listeners
        this.socket.off('gameChatMessage');
        this.socket.on('gameChatMessage', (data) => {
            this.addChatMessage(`${data.name}: ${data.text}`);
        });

        this.socket.off('roomUpdate');
        this.socket.on('roomUpdate', async (data) => {
            if (data.language && data.language !== this.languageManager.currentLang) {
                await this.languageManager.loadLanguage(data.language);
                if(this.languageSelector) this.languageSelector.value = data.language;
                this.updateUIText();
                
                const langKey = data.language === 'en' ? 'English' : '日本語';
                const langName = this.languageManager.get(langKey);
                const chatMessage = this.languageManager.get('logLanguageChanged', { lang: langName });
                this.addChatMessage(chatMessage, '#0030FF');
            }

            this.players = data.players;
            this.leaderId = data.leaderId;
            this.isLeader = this.socket.id === this.leaderId;
            this.updatePlayerCount();
            this.updateUIText();
            this.updateLeaderControls(); 
        });

        this.socket.off('playerLeft');
        this.socket.on('playerLeft', (playerName) => {
            this.addChatMessage(`${playerName} has left the game.`, 'red');
        });
        
        this.updateUIText();
        this.updateLeaderControls();
    }

    // --- method to keep language selector logic clean ---
    renderLanguageSelector(container) {
        const langContainer = document.createElement('div');
        Object.assign(langContainer.style, {
            marginBottom: '15px',
            textAlign: 'center'
        });

        const langLabel = document.createElement('span');
        langLabel.innerText = 'LANG/言語: ';
        langLabel.style.color = 'white';

        this.languageSelector = document.createElement('select');
        const languages = [
            { code: 'en', name: 'English' },
            { code: 'ja', name: '日本語' }
        ];

        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.innerText = lang.name;
            this.languageSelector.appendChild(option);
        });
        this.languageSelector.value = this.languageManager.currentLang;
        this.languageSelector.onchange = async () => {
            const newLang = this.languageSelector.value;
            await this.languageManager.loadLanguage(newLang);
            this.updateUIText();
            this.socket.emit('changeLanguage', newLang);
            
            const selectedOption = this.languageSelector.options[this.languageSelector.selectedIndex];
            const langName = selectedOption.text;
            const chatMessage = this.languageManager.get('logLanguageChanged', { lang: langName });
            this.addChatMessage(chatMessage, '#0030FF');
        };

        langContainer.appendChild(langLabel);
        langContainer.appendChild(this.languageSelector);
        container.appendChild(langContainer);
    }

    // --- creates the difficulty selection modal ---
    showDifficultyModal() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: '1000'
        });

        const modal = document.createElement('div');
        modal.className = 'difficulty-modal';
        Object.assign(modal.style, {
            background: '#2c3e50', padding: '20px', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', gap: '10px'
        });
		
		//underdev
		const devMessage = document.createElement('p');
        devMessage.innerText = 'Under Development/開発中';
        Object.assign(devMessage.style, {
            color: 'red',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 10px 0' // Adds some space below the message
        });
        modal.appendChild(devMessage);        

        const title = document.createElement('h3');
        title.innerText = this.languageManager.get('selectDifficulty');
        title.style.color = 'white';
        title.style.margin = '0 0 10px 0';
        title.style.textAlign = 'center';
        modal.appendChild(title);

        // Define difficulties with their server value and language key
        const difficulties = [
            { value: 'easy', langKey: 'difficultyEasy' },
            { value: 'hard', langKey: 'difficultyHard' },
            { value: 'pro',  langKey: 'difficultyPro' }
        ];

        // Create buttons using the language manager
        difficulties.forEach(difficulty => {
            const btn = document.createElement('button');
            // Fetch the translated text from the language manager
            btn.innerText = this.languageManager.get(difficulty.langKey);
            btn.onclick = () => {
                this.statusText.innerText = 'Starting Cooperative Drawing...';
                // Send the consistent 'value' to the server
                this.socket.emit('selectGame', 'DrawingGame', { difficulty: difficulty.value }, (response) => {
                    if (!response.success) {
                        this.statusText.innerText = response.message;
                    }
                });
                document.body.removeChild(overlay);
            };
            modal.appendChild(btn);
        });
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };
    }

    updateUIText() {
        this.statusText.innerText = this.isLeader
            ? this.languageManager.get('chooseAGame')
            : this.languageManager.get('waitingForLeader');
        
        // --- also update placeholders and buttons on language change ---
        if (this.chatInput) this.chatInput.placeholder = this.languageManager.get('chatPlaceholder');
        if (this.sendBtn) this.sendBtn.innerText = this.languageManager.get('sendButton');
        if (this.backBtn) this.backBtn.innerText = this.languageManager.get('backToLobbyButton');
        if (this.typingRaceBtn) this.typingRaceBtn.innerText = this.languageManager.get('startTypingRace');
        if (this.drawGameBtn) this.drawGameBtn.innerText = this.languageManager.get('startDrawingGame');
    }

    updateLeaderControls() {
        const isNotLeader = !this.isLeader;
        if (this.typingRaceBtn) this.typingRaceBtn.disabled = isNotLeader;
        if (this.drawGameBtn) this.drawGameBtn.disabled = isNotLeader;
        if (this.languageSelector) this.languageSelector.disabled = isNotLeader;
    }

    updatePlayerCount() {
        this.playerCountText.innerText = this.languageManager.get('playersCount', {
            count: this.players.length,
            max: this.maxPlayers
        });
    }

    renderGameSelectionUI(container) {
        const gameList = document.createElement('div');
        gameList.className = 'gamescene-selection';

        this.typingRaceBtn = document.createElement('button');
        this.typingRaceBtn.innerText = this.languageManager.get('startTypingRace');
        this.typingRaceBtn.onclick = () => {
            this.statusText.innerText = 'Starting Typing Race...';
            this.socket.emit('selectGame', 'TypingGame', (response) => {
                if (!response.success) this.statusText.innerText = response.message;
            });
        };
        gameList.appendChild(this.typingRaceBtn);
        
        this.drawGameBtn = document.createElement('button');
        this.drawGameBtn.innerText = this.languageManager.get('startDrawingGame');
        
        // ---onclick now opens the modal ---
        this.drawGameBtn.onclick = () => {
            this.showDifficultyModal();
        };
        gameList.appendChild(this.drawGameBtn);

        container.appendChild(gameList);

        const soonBtn = document.createElement('button');
        soonBtn.innerText = this.languageManager.get('moreGamesSoon');
        soonBtn.disabled = true;
        gameList.appendChild(soonBtn);
    }
    
    renderChatBox(container) {
        const chatWrapper = document.createElement('div');
        chatWrapper.className = 'gamescene-chat-wrapper';

        // --- MODIFIED FOR MOBILE LAYOUT ---
        //this wrapper will grow to fill available space
        Object.assign(chatWrapper.style, {
            display: 'flex',
            flexDirection: 'column',
            flex: '1', //ths the magic property that makes it grow
            minHeight: '0', //important for flex children in some browsers
            marginTop: '20px'
        });

        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'chat-container';
        
        // --- MODIFIED FOR MOBILE LAYOUT ---
        //container will be scrollable
        Object.assign(this.chatContainer.style, {
            flex: '1', //let it take all the space inside the wrapper
            overflowY: 'auto', //add a scrollbar if content overflows
            marginBottom: '10px'
        });
        chatWrapper.appendChild(this.chatContainer);

        const inputWrapper = document.createElement('div');
        inputWrapper.className = 'chat-input-wrapper';
        inputWrapper.style.display = 'flex';

        this.chatInput = document.createElement('input');
        this.chatInput.type = 'text';
        this.chatInput.placeholder = this.languageManager.get('chatPlaceholder');
        this.chatInput.className = 'chat-input';
        this.chatInput.style.flex = '1';

        this.sendBtn = document.createElement('button');
        this.sendBtn.innerText = this.languageManager.get('sendButton');
        this.sendBtn.className = 'chat-send-btn';
        this.sendBtn.onclick = () => this.sendChatMessage();

        inputWrapper.appendChild(this.chatInput);
        inputWrapper.appendChild(this.sendBtn);
        chatWrapper.appendChild(inputWrapper);
        
        container.appendChild(chatWrapper); 

        this.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });
    }

    renderBackButton() {
        const footer = document.createElement('div');
        //removed absolute positioning,now part of the flex flow
        Object.assign(footer.style, {
            width: '100%',
            textAlign: 'center',
            marginTop: '20px' //some space from the chat box
        });

        this.backBtn = document.createElement('button');
        this.backBtn.innerText = this.languageManager.get('backToLobbyButton');
        this.backBtn.onclick = () => {
            this.backBtn.disabled = true;
            this.backBtn.innerText = this.languageManager.get('leavingButton');
            this.socket.emit('leaveRoom', (response) => {
                if (response.success) {
                    this.scene.stop('GameScene');
                    this.scene.start('LobbyScene');
                } else {
                    this.backBtn.disabled = false;
                    this.backBtn.innerText = this.languageManager.get('backToLobbyButton');
                }
            });
        };

        footer.appendChild(this.backBtn);
        this.domContainer.appendChild(footer);
    }

    sendChatMessage() {
        const text = this.chatInput.value.trim();
        if (!text) return;
        this.socket.emit('gameChatMessage', text);
        this.chatInput.value = '';
    }

    addChatMessage(msg, color = 'white') { //changed default to white for dark theme
        const p = document.createElement('p');
        p.innerText = msg;
        p.style.color = color;
        this.chatContainer.appendChild(p);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    shutdown() {
        console.log('GameScene shutting down, removing listeners.');
        if (this.domContainer) this.domContainer.remove();
        
        this.socket.off('preCountdown');
        this.socket.off('gameChatMessage');
        this.socket.off('roomUpdate');
        this.socket.off('playerLeft');
    }
}
