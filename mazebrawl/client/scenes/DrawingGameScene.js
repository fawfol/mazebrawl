import LanguageManager from '../LanguageManager.js';

export default class DrawingGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DrawingGameScene' });
    }

    init(data) {
        this.socket = data.socket;
        this.players = data.players;
        this.leaderId = data.leaderId;
        this.language = data.language || 'en';
        this.preCountdownDuration = data.preCountdown || 60;
        
        //game-specific data from server
        this.prompt = '';
        this.timeLimit = 120;
        this.segments = [];
        this.playerCount = 0;
        this.mySegmentIndex = -1;
        this.layout = {};

        //drawing state
        this.isDrawing = false;
        this.baseColor = '#000000';
        this.lightness = 50;         //slider value (0-100)
        this.currentColor = '#000000';   //final color after lightness is applied
        this.currentBrushSize = 5;
        this.isErasing = false;
    }
     
    async create() {
        this.languageManager = new LanguageManager(this);
        await this.languageManager.loadLanguage(this.language);
		this.createUI();
        this.showTutorial();
        this.setupSocketListeners();
        this.startTutorialCountdown();
    }

    setupSocketListeners() {
        //hides the tutorial and then starts the game
        this.socket.off('startGame');
        this.socket.on('startGame', (gameType, prompt, extra) => {
            if (gameType !== 'DrawingGameScene') return;
            
            this.hideTutorialAndStartGame(prompt, extra);
        });

        //listener for the skip event
        this.socket.off('drawingTutorialSkipped');
        this.socket.on('drawingTutorialSkipped', () => {
            const tutorial = document.getElementById('tutorial-overlay');
            if (tutorial) tutorial.remove();
        });

        this.socket.on('drawingUpdate', ({ playerId, canvasData }) => {
            this.updatePlayerCanvas(playerId, canvasData);
        });

        this.socket.on('evaluatingDrawing', () => {
            this.showEvaluationScreen();
        });

        this.socket.on('gameEnded', (results) => {
            this.showFinalResults(results);
        });
        
        this.socket.on('playerStatusUpdate', ({ playerId }) => {
            const segmentWrapper = this.otherCanvases[playerId]?.parentElement;
            if (segmentWrapper) {
                segmentWrapper.classList.add('player-finished');
            }
        });
    }
    hideTutorialAndStartGame(prompt, extra) {
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial) tutorial.remove();

        this.prompt = prompt;
        this.timeLimit = extra.timeLimit;
        this.segments = extra.segments;
        this.layout = extra.layout;
        this.playerCount = extra.playerCount;
        this.mySegmentIndex = this.segments.find(s => s.playerId === this.socket.id)?.segmentIndex ?? -1;
        
        this.updatePromptText();
        this.startTimer();
        this.initializeCanvases();
    }
    
    startTutorialCountdown() {
        let timeLeft = this.preCountdownDuration;
        const countdownEl = document.getElementById('tutorial-countdown-text');

        if (!countdownEl) return;

        const updateText = () => {
            countdownEl.innerText = this.languageManager.get('tutorialDrawingCountdown', { countdown: timeLeft });
        };
        
        updateText(); // Set initial text

        const interval = setInterval(() => {
            timeLeft--;
            if (timeLeft >= 0) {
                updateText();
            } else {
                clearInterval(interval);
            }
        }, 1000);
    }

    
    showTutorial() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: '1000',
            color: 'white', padding: '20px', boxSizing: 'border-box'
        });

        const content = document.createElement('div');
        Object.assign(content.style, {
            maxWidth: '600px', textAlign: 'center'
        });
         content.innerHTML = `
            <h2>${this.languageManager.get('tutorialDrawingTitle')}</h2>
            <ul style="text-align: left; list-style-position: inside; padding: 0 20px;">
                <li style="margin-bottom: 10px;">${this.languageManager.get('tutorialDrawingStep1')}</li>
                <li style="margin-bottom: 10px;">${this.languageManager.get('tutorialDrawingStep2')}</li>
                <li style="margin-bottom: 10px;">${this.languageManager.get('tutorialDrawingStep3')}</li>
                <li style="margin-bottom: 10px;">${this.languageManager.get('tutorialDrawingStep4')}</li>
            </ul>
            
            <p id="tutorial-countdown-text" style="margin-top: 30px; font-size: 0.9em;"></p>

            <p style="margin-top: 10px; font-style: italic;">${this.languageManager.get('tutorialDrawingWaiting')}</p>
        `;
        
        const skipBtn = document.createElement('button');
        skipBtn.style.marginTop = '20px';

        if (this.socket.id === this.leaderId) {
            skipBtn.innerText = this.languageManager.get('tutorialDrawingSkipButton');
            skipBtn.disabled = false; // Leader's button is enabled
            skipBtn.onclick = () => {
                skipBtn.disabled = true;
                this.socket.emit('leaderSkipDrawingTutorial');
            };
        } else {
            skipBtn.innerText = this.languageManager.get('tutorialDrawingWaitingForLeaderSkip');
            skipBtn.disabled = true; // Non-leader's button is disabled
        }
        
        content.appendChild(skipBtn);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    createUI() {
        document.body.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'draw-container';
        document.body.appendChild(container);

        const header = document.createElement('div');
        header.className = 'draw-header';
        this.promptText = document.createElement('h2');
        this.promptText.innerText = this.languageManager.get('waitingForPrompt');

        const timerWrapper = document.createElement('div');
        timerWrapper.className = 'draw-timer-wrapper';

        timerWrapper.innerHTML = `
            <svg class="draw-timer-svg" viewBox="0 0 36 36">
                <circle class="timer-circle timer-track" cx="18" cy="18" r="16"></circle>
                <circle class="timer-circle timer-progress" cx="18" cy="18" r="16"></circle>
            </svg>
            <div class="timer-number"></div>
        `;
        
        this.timerProgressCircle = timerWrapper.querySelector('.timer-progress');
        this.timerNumberEl = timerWrapper.querySelector('.timer-number');
        
        header.appendChild(this.promptText);
        header.appendChild(timerWrapper);
        container.appendChild(header);

        const main = document.createElement('div');
        main.className = 'draw-main';
        container.appendChild(main);

        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'draw-canvas-container';
        main.appendChild(this.canvasContainer);

        this.createToolbar(main);
    }

	//TOOLBAR 
    createToolbar(container) {
        const toolbar = document.createElement('div');
        toolbar.className = 'draw-toolbar';

        const toolbarLeft = document.createElement('div');
        toolbarLeft.className = 'toolbar-column';

        const toolbarRight = document.createElement('div');
        toolbarRight.className = 'toolbar-column';

        // --- Color Palette (Left Column) ---
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FFFFFF', '#000000'];
        const colorContainer = document.createElement('div');
        colorContainer.className = 'color-container';
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'draw-tool-color';
            colorBtn.style.backgroundColor = color;
            if (color === this.baseColor) colorBtn.classList.add('selected');
            colorBtn.onclick = () => {
            	this.isErasing = false;
                this.baseColor = color;
                this.lightness = 50;
                document.getElementById('lightness-slider').value = 50;
                toolbar.querySelector('.selected')?.classList.remove('selected');
                colorBtn.classList.add('selected');
                this.updateToolbarVisuals();
            };
            colorContainer.appendChild(colorBtn);
        });
        toolbarLeft.appendChild(colorContainer);

        // --- Eraser Button (Left Column) ---
        const eraserBtn = document.createElement('button');
        eraserBtn.className = 'eraser-btn';
        eraserBtn.innerText = this.languageManager.get('toolbarEraser');
        eraserBtn.onclick = () => {
        	this.isErasing = true;
            this.currentColor = '#FFFFFF';
            toolbar.querySelector('.selected')?.classList.remove('selected');
            eraserBtn.classList.add('selected');
        };
        toolbarLeft.appendChild(eraserBtn);

        // --- Sliders (Right Column) ---
        const slidersContainer = document.createElement('div');
        slidersContainer.className = 'sliders-container';

        // Lightness Slider Group
        const lightnessGroup = document.createElement('div');
        lightnessGroup.className = 'slider-group';
        const lightnessSlider = document.createElement('input');
        lightnessSlider.type = 'range';
        lightnessSlider.id = 'lightness-slider';
        lightnessSlider.min = '0';
        lightnessSlider.max = '100';
        lightnessSlider.value = this.lightness;
        lightnessSlider.oninput = (e) => {
            this.lightness = e.target.value;
            this.updateToolbarVisuals();
        };
        lightnessGroup.appendChild(lightnessSlider);
        slidersContainer.appendChild(lightnessGroup);

        // thickness label
        const thicknessLabel = document.createElement('p');
        thicknessLabel.className = 'slider-label';
        thicknessLabel.id = 'paintbrushthicktext';
        thicknessLabel.innerText = this.languageManager.get('paintbrushthicktext', { defaultValue: 'Thickness' });
        slidersContainer.appendChild(thicknessLabel);

        //brush size slider group
        const brushGroup = document.createElement('div');
        brushGroup.className = 'slider-group brush-slider-group'; 
        const brushPreviewDot = document.createElement('div');
        brushPreviewDot.className = 'brush-preview-dot';
        const brushSizeSlider = document.createElement('input');
        brushSizeSlider.type = 'range';
        brushSizeSlider.min = '2';
        brushSizeSlider.max = '30';
        brushSizeSlider.value = this.currentBrushSize;
        brushSizeSlider.oninput = (e) => {
            this.currentBrushSize = e.target.value;
            this.updateToolbarVisuals();
        };
        brushGroup.appendChild(brushSizeSlider);
        brushGroup.appendChild(brushPreviewDot);
        slidersContainer.appendChild(brushGroup);
        
        toolbarRight.appendChild(slidersContainer);

        // --- DONE Button (Right Column) ---
        const doneBtn = document.createElement('button');
        doneBtn.className = 'done-btn';
        doneBtn.innerText = this.languageManager.get('toolbarDone');
        doneBtn.onclick = () => {
            this.myCanvas.classList.add('finished-canvas');
            doneBtn.disabled = true;
            doneBtn.innerText = this.languageManager.get('toolbarFinished', { defaultValue: 'Finished' });
            this.socket.emit('playerFinishedDrawing');
        };
        toolbarRight.appendChild(doneBtn);

        toolbar.appendChild(toolbarLeft);
        toolbar.appendChild(toolbarRight);
        
        container.appendChild(toolbar);
        this.updateToolbarVisuals();
    }
    //TOOLBAR HELPER
   updateToolbarVisuals() {
    const brushPreviewDot = document.querySelector('.brush-preview-dot');

    // if we are erasing, lock the color to white and stop.
    if (this.isErasing) {
        if (brushPreviewDot) {
            brushPreviewDot.style.width = `${this.currentBrushSize}px`;
            brushPreviewDot.style.height = `${this.currentBrushSize}px`;
            brushPreviewDot.style.backgroundColor = '#FFFFFF';
        }
        return;
    }

    //code only runs when NOT erasing
    const [h, s] = this.hexToHsl(this.baseColor);
    this.currentColor = this.hslToHex(h, s, this.lightness);

    const lightnessSlider = document.getElementById('lightness-slider');
    if (lightnessSlider) {
        const darkVersion = this.hslToHex(h, s, 10);
        const lightVersion = this.hslToHex(h, s, 90);
        lightnessSlider.style.background = `linear-gradient(to right, ${darkVersion}, ${this.baseColor}, ${lightVersion})`;
        
        lightnessSlider.style.setProperty('--thumb-color', this.currentColor);
    }
    
    if (brushPreviewDot) {
        brushPreviewDot.style.width = `${this.currentBrushSize}px`;
        brushPreviewDot.style.height = `${this.currentBrushSize}px`;
        brushPreviewDot.style.backgroundColor = this.currentColor;
    }
}

    updatePromptText() {
        this.promptText.innerText = this.languageManager.get('drawingTopic', { prompt: this.prompt });
    }
     
    startTimer() {
        const radius = this.timerProgressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;

        this.timerProgressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        this.timerProgressCircle.style.strokeDashoffset = circumference;

        let timeLeft = this.timeLimit;
        
        const setProgress = (percent) => {
            const offset = circumference - percent * circumference;
            this.timerProgressCircle.style.strokeDashoffset = offset;
        };

        setProgress(timeLeft / this.timeLimit);
        this.timerNumberEl.innerText = timeLeft;

        const interval = setInterval(() => {
            timeLeft--;

            //update the number and the progress circle
            this.timerNumberEl.innerText = timeLeft;
            setProgress(timeLeft / this.timeLimit);

            //change colors based on time remaining
            this.timerProgressCircle.classList.remove('warn', 'danger');
            if (timeLeft <= 10) {
                this.timerProgressCircle.classList.add('danger');
            } else if (timeLeft <= 20) {
                this.timerProgressCircle.classList.add('warn');
            }

            if (timeLeft <= 0) {
                clearInterval(interval);
            }
        }, 1000);
    }

    initializeCanvases() {
        this.canvasContainer.innerHTML = '';
        this.otherCanvases = {};

        //apply grid layout instructions from the server
        this.canvasContainer.style.gridTemplateAreas = this.layout.gridTemplateAreas;
        this.canvasContainer.style.gridTemplateColumns = this.layout.gridTemplateColumns;
        this.canvasContainer.style.gridTemplateRows = this.layout.gridTemplateRows;

        this.segments.forEach(segment => {
            const player = this.players.find(p => p.id === segment.playerId);
            
            const segmentWrapper = document.createElement('div');
            segmentWrapper.className = 'canvas-segment';
            segmentWrapper.style.gridArea = segment.area; //assign to its grid area

            let canvasElement;

            if (segment.playerId === this.socket.id) {
                this.myCanvas = document.createElement('canvas');
                this.myCanvas.className = 'draw-canvas my-canvas';
                this.setupDrawingListeners();
                canvasElement = this.myCanvas;
            } else {
                const otherCanvas = document.createElement('img');
                otherCanvas.className = 'draw-canvas';
                if (segment.playerId) this.otherCanvases[segment.playerId] = otherCanvas;
                canvasElement = otherCanvas;
            }

            segmentWrapper.appendChild(canvasElement);

            if (player) {
                const nameplate = document.createElement('div');
                nameplate.className = 'player-nameplate';
                nameplate.innerText = player.name;
                segmentWrapper.appendChild(nameplate);
            }
            this.canvasContainer.appendChild(segmentWrapper);
        });
        
        requestAnimationFrame(() => this.resizeCanvas());
    }


    resizeCanvas() {
        const canvasEl = this.myCanvas;
        if (!canvasEl) return;
        const rect = canvasEl.parentElement.getBoundingClientRect();
        canvasEl.width = rect.width;
        canvasEl.height = rect.height;
        this.ctx = canvasEl.getContext('2d');
    }

    setupDrawingListeners() {
        const canvas = this.myCanvas;
        canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        canvas.addEventListener('mouseup', () => this.stopDrawing());
        canvas.addEventListener('mouseleave', () => this.stopDrawing());
        canvas.addEventListener('mousemove', (e) => this.draw(e));

        canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        canvas.addEventListener('touchend', () => this.stopDrawing());
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
    }

    getPos(event) {
        const rect = this.myCanvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }

    hexToHsl(hex) {
        if (!hex || hex.length < 6) { return [0, 0, 0]; }
        let [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }
 
    updateCurrentColor() {
        const [h, s] = this.hexToHsl(this.baseColor);
        this.currentColor = this.hslToHex(h, s, this.lightness);
        const brushDot = document.querySelector('.brush-dot');
        if (brushDot) {
            brushDot.style.backgroundColor = this.currentColor;
        }
    }

    startDrawing(e) {
        this.isDrawing = true;
        this.lastPos = this.getPos(e);
    }
     
    stopDrawing() {
        this.isDrawing = false;
        this.ctx.beginPath(); //reset the path
        //send the final state of this segment to the server
        this.socket.emit('drawingAction', this.myCanvas.toDataURL());
    }

    draw(e) {
        if (!this.isDrawing) return;
        const pos = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.lineWidth = this.currentBrushSize;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.currentColor;
        this.ctx.moveTo(this.lastPos.x, this.lastPos.y);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.lastPos = pos;
    }

    updatePlayerCanvas(playerId, canvasData) {
        const imgElement = this.otherCanvases[playerId];
        if (imgElement) {
            imgElement.src = canvasData;
        }
    }
     
     showEvaluationScreen() {
        this.showOverlay(`<h2>${this.languageManager.get('evaluatingTitle')}</h2><p>${this.languageManager.get('evaluatingSubtitle')}</p>`);
    }

    showFinalResults(results) {
        document.getElementById('results-panel')?.remove(); 
        const header = document.querySelector('.draw-header');
        if (header) header.style.display = 'none';
        
        if (this.canvasContainer) this.canvasContainer.style.display = 'none';
        const toolbar = document.querySelector('.draw-toolbar');
        if (toolbar) toolbar.style.display = 'none'; 

        const mainContainer = document.querySelector('.draw-main');
        if (mainContainer) mainContainer.classList.add('results-active');

        const resultsPanel = document.createElement('div');
        resultsPanel.id = 'results-panel';

        const title = document.createElement('h2');
        title.innerText = this.languageManager.get('resultsTitle');
        resultsPanel.appendChild(title);

		const promptEl = document.createElement('p');
		promptEl.innerHTML = this.languageManager.get('drawingTopic', { prompt: `<strong>"${results.prompt}"</strong>` });
		resultsPanel.appendChild(promptEl);
        
        const finalImage = document.createElement('img');
        finalImage.src = results.finalImage;
        Object.assign(finalImage.style, {
            width: '100%',
            borderRadius: '5px',
            margin: '15px 0'
        });
        resultsPanel.appendChild(finalImage);

        const scoreEl = document.createElement('h3');
		scoreEl.innerHTML = this.languageManager.get('resultsScore', { score: results.score });
		resultsPanel.appendChild(scoreEl);
        
        // --- get the translated difficulty name ---
        const difficultyKey = 'difficulty' + results.difficulty.charAt(0).toUpperCase() + results.difficulty.slice(1);
        const translatedDifficulty = this.languageManager.get(difficultyKey);

        // --- display the difficulty on the results panel ---
        const difficultyEl = document.createElement('p');
        difficultyEl.innerHTML = this.languageManager.get('resultsDifficulty', { difficulty: translatedDifficulty });
        difficultyEl.style.marginTop = '15px';
        resultsPanel.appendChild(difficultyEl);

        const playersEl = document.createElement('div');
		const playerNames = this.players.map(p => p.name).join(', ');
		playersEl.innerHTML = this.languageManager.get('resultsDrawnBy', { playerNames: playerNames });
        playersEl.style.marginTop = '5px'; // Adjusted margin
        resultsPanel.appendChild(playersEl);
        
       const buttonWrapper = document.createElement('div');
       buttonWrapper.className = 'results-buttons';

        const exitBtn = document.createElement('button');
        exitBtn.innerText = this.languageManager.get('exitToGameSelectionButton');
        exitBtn.onclick = () => {
            this.scene.stop('DrawingGameScene');
            this.scene.start('GameScene', {
                players: this.players,
                myIndex: this.players.findIndex(p => p.id === this.socket.id),
                socket: this.socket,
                leaderId: this.leaderId,
                language: this.language
            });
        };
        
        const downloadBtn = document.createElement('button');
        downloadBtn.innerText = this.languageManager.get('resultsDownloadButton');
        downloadBtn.style.background = '#4CAF50'; 

        downloadBtn.onclick = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = 800;
            canvas.height = 1000;

            ctx.fillStyle = '#2a2a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const finalImage = new Image();
            finalImage.onload = () => {
                ctx.drawImage(finalImage, 50, 200, 700, 500);

                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';

                ctx.font = 'bold 50px Poppins';
                ctx.fillText('VARY-BRAWL', canvas.width / 2, 80);

                ctx.font = '25px Poppins';
				ctx.fillText(this.languageManager.get('drawingTopic', { prompt: results.prompt }), canvas.width / 2, 140);

                ctx.font = 'bold 70px Poppins';
				ctx.fillStyle = '#00bfff';
				ctx.fillText(this.languageManager.get('resultsScore', { score: results.score }).replace(/<[^>]*>/g, ''), canvas.width / 2, 780);

                ctx.font = '25px Poppins';
				ctx.fillStyle = 'white';
				const playerNames = this.players.map(p => p.name).join(', ');
				ctx.fillText(this.languageManager.get('resultsDrawnBy', { playerNames: playerNames }).replace(/<[^>]*>/g, ''), canvas.width / 2, 840);
								
                // --- draw diffuclty on the downloadable image ---
                const difficultyString = this.languageManager.get('resultsDifficulty', { difficulty: translatedDifficulty }).replace(/<[^>]*>/g, '');
                ctx.font = '25px Poppins';
                ctx.fillStyle = 'white';
                ctx.fillText(difficultyString, canvas.width / 2, 880);


                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '16px Poppins';
                ctx.fillText('play : https://varybrawl.onrender.com', canvas.width / 2, 950);

                const link = document.createElement('a');
                link.download = 'varybrawl-drawing.png';
                link.href = canvas.toDataURL();
                link.click();
            };
            finalImage.src = results.finalImage;
        };

        buttonWrapper.appendChild(exitBtn);
        buttonWrapper.appendChild(downloadBtn);
        resultsPanel.appendChild(buttonWrapper);
        mainContainer.appendChild(resultsPanel);
    }
     
    showOverlay(innerHTML, showExitButton = false) {
        document.querySelector('.draw-overlay')?.remove();
        
        const overlay = document.createElement('div');
        overlay.className = 'draw-overlay';
        
        const box = document.createElement('div');
        box.className = 'draw-overlay-box';
        box.innerHTML = innerHTML;

        if (showExitButton) {
            const exitBtn = document.createElement('button');
            exitBtn.innerText = this.languageManager.get('exitToGameSelectionButton');
            exitBtn.onclick = () => {
                this.scene.stop('DrawingGameScene');
                this.scene.start('GameScene', {
                    players: this.players,
                    myIndex: this.players.findIndex(p => p.id === this.socket.id),
                    socket: this.socket,
                    leaderId: this.leaderId,
                    language: this.language
                });
            };
            box.appendChild(exitBtn);
        }
        
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
}
