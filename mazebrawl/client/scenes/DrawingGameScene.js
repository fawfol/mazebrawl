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
    }
     
    async create() {
        this.languageManager = new LanguageManager(this);
        await this.languageManager.loadLanguage(this.language);

        this.setupSocketListeners();
        this.createUI();
    }

    setupSocketListeners() {
        this.socket.off('startGame');
        this.socket.on('startGame', (gameType, prompt, extra) => {
            if (gameType !== 'DrawingGameScene') return;
            this.prompt = prompt;
            this.timeLimit = extra.timeLimit;
            this.segments = extra.segments;
            this.layout = extra.layout;
            this.playerCount = extra.playerCount;
            this.mySegmentIndex = this.segments.find(s => s.playerId === this.socket.id)?.segmentIndex ?? -1;
            
            this.updatePromptText();
            this.startTimer();
            this.initializeCanvases();
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

    createUI() {
        document.body.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'draw-container';
        document.body.appendChild(container);

        //header
        const header = document.createElement('div');
        header.className = 'draw-header';
        this.promptText = document.createElement('h2');
        this.promptText.innerText = this.languageManager.get('waitingForPrompt');
        this.timerText = document.createElement('div');
        this.timerText.className = 'draw-timer';
        header.appendChild(this.promptText);
        header.appendChild(this.timerText);
        container.appendChild(header);

        //main content (Canvas + Tools)
        const main = document.createElement('div');
        main.className = 'draw-main';
        container.appendChild(main);

        //canvasarea
        this.canvasContainer = document.createElement('div');
        this.canvasContainer.className = 'draw-canvas-container';
        main.appendChild(this.canvasContainer);

        // tools
        this.createToolbar(main);
    }

    createToolbar(container) {
        const toolbar = document.createElement('div');
        toolbar.className = 'draw-toolbar';

        // --- ColorPaletteGroup ---
        const colorGroup = document.createElement('div');
        colorGroup.className = 'tool-group';
        colorGroup.innerHTML = `<h3>🎨</h3>`; 
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FFFFFF', '#000000'];
        const colorContainer = document.createElement('div');
        colorContainer.className = 'color-container';
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'draw-tool-color';
            colorBtn.style.backgroundColor = color;
            if (color === this.baseColor) colorBtn.classList.add('selected');
            colorBtn.onclick = () => {
                this.baseColor = color;
                this.lightness = 50;
                const lightnessSlider = document.getElementById('lightness-slider');
                if(lightnessSlider) lightnessSlider.value = 50;
                this.updateCurrentColor();
                toolbar.querySelector('.selected')?.classList.remove('selected');
                colorBtn.classList.add('selected');
            };
            colorContainer.appendChild(colorBtn);
        });
        colorGroup.appendChild(colorContainer);
        toolbar.appendChild(colorGroup); 

        // --- LightnessGroup ---
        const lightnessGroup = document.createElement('div');
        lightnessGroup.className = 'tool-group';
        lightnessGroup.innerHTML = `<h3>☀️</h3>`; 
        const lightnessSlider = document.createElement('input');
        lightnessSlider.type = 'range';
        lightnessSlider.id = 'lightness-slider';
        lightnessSlider.min = '0';
        lightnessSlider.max = '100';
        lightnessSlider.value = this.lightness;
        lightnessSlider.oninput = (e) => {
            this.lightness = e.target.value;
            this.updateCurrentColor();
        };
        lightnessGroup.appendChild(lightnessSlider);
        toolbar.appendChild(lightnessGroup); // 

        // --- BrushSizeGroup ---
        const brushGroup = document.createElement('div');
        brushGroup.className = 'tool-group';
        brushGroup.innerHTML = `<h3>🖌️</h3>`; 
        const brushSizeSlider = document.createElement('input');
        brushSizeSlider.type = 'range';
        brushSizeSlider.min = '2';
        brushSizeSlider.max = '30';
        brushSizeSlider.value = this.currentBrushSize;
        brushSizeSlider.oninput = (e) => {
            this.currentBrushSize = e.target.value;
        };
        brushGroup.appendChild(brushSizeSlider);
        toolbar.appendChild(brushGroup); 

        // --- actions group ---
        const actionsGroup = document.createElement('div');
        actionsGroup.className = 'tool-group';
        actionsGroup.innerHTML = `<h3>⚙️</h3>`; // Icon heading
        
        const eraserBtn = document.createElement('button');
        eraserBtn.className = 'eraser-btn';
        eraserBtn.innerText = this.languageManager.get('toolbarEraser');
        eraserBtn.onclick = () => {
            this.currentColor = '#FFFFFF';
            toolbar.querySelector('.selected')?.classList.remove('selected');
            eraserBtn.classList.add('selected');
        };
        actionsGroup.appendChild(eraserBtn);
        
        const doneBtn = document.createElement('button');
		doneBtn.className = 'done-btn';
		doneBtn.innerText = this.languageManager.get('toolbarDone');
		doneBtn.onclick = () => {
		    this.myCanvas.classList.add('finished-canvas');
		    doneBtn.disabled = true;
		    doneBtn.innerText = this.languageManager.get('toolbarFinished');
		    this.socket.emit('playerFinishedDrawing');
		};
		actionsGroup.appendChild(doneBtn);
        toolbar.appendChild(actionsGroup);

        container.appendChild(toolbar);
        this.updateCurrentColor();
    }

    updatePromptText() {
        this.promptText.innerText = this.languageManager.get('drawingTopic', { prompt: this.prompt });
    }
     
    startTimer() {
        let timeLeft = this.timeLimit;
        this.timerText.innerText = timeLeft;
        const interval = setInterval(() => {
            timeLeft--;
            this.timerText.innerText = timeLeft;
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
        //first, combine all the canvases into one image
        const cols = Math.ceil(Math.sqrt(this.playerCount));
        const rows = Math.ceil(this.playerCount / cols);
        const segmentWidth = this.myCanvas.width;
        const segmentHeight = this.myCanvas.height;

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = segmentWidth * cols;
        finalCanvas.height = segmentHeight * rows;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.fillStyle = '#FFFFFF';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        this.segments.forEach(seg => {
            const col = seg.segmentIndex % cols;
            const row = Math.floor(seg.segmentIndex / cols);
            const x = col * segmentWidth;
            const y = row * segmentHeight;

            let sourceElement;
            if (seg.playerId === this.socket.id) {
                sourceElement = this.myCanvas;
            } else {
                sourceElement = this.otherCanvases[seg.playerId];
            }

            if (sourceElement && sourceElement.width > 0 && sourceElement.height > 0) {
                finalCtx.drawImage(sourceElement, x, y, segmentWidth, segmentHeight);
            }
        });
        
        this.socket.emit('submitDrawing', finalCanvas.toDataURL());
        this.showOverlay(`<h2>${this.languageManager.get('evaluatingTitle')}</h2>    <p>${this.languageManager.get('evaluatingSubtitle')}</p>`);
    }

    showFinalResults(results) {
        document.getElementById('results-panel')?.remove(); 
        const header = document.querySelector('.draw-header');
        if (header) header.style.display = 'none';
        
        //hide the original canvas container and toolbar.
        if (this.canvasContainer) this.canvasContainer.style.display = 'none';
        const toolbar = document.querySelector('.draw-toolbar');
        if (toolbar) toolbar.style.display = 'none'; 

        const mainContainer = document.querySelector('.draw-main');
        if (mainContainer) mainContainer.classList.add('results-active');

        // Create the new, unified results panel.
        const resultsPanel = document.createElement('div');
        resultsPanel.id = 'results-panel';

        //topic add
        const title = document.createElement('h2');
        title.innerText = this.languageManager.get('resultsTitle');
        resultsPanel.appendChild(title);

		const promptEl = document.createElement('p');
		promptEl.innerHTML = this.languageManager.get('drawingTopic', { prompt: `<strong>"${results.prompt}"</strong>` });
		resultsPanel.appendChild(promptEl);
        //add final combined image INSIDE the panel
        const finalImage = document.createElement('img');
        finalImage.src = results.finalImage;
        Object.assign(finalImage.style, {
            width: '100%',
            borderRadius: '5px',
            margin: '15px 0'
        });
        resultsPanel.appendChild(finalImage);

        //add ai score and feedback
        const scoreEl = document.createElement('h3');
		scoreEl.innerHTML = this.languageManager.get('resultsScore', { score: results.score });
		resultsPanel.appendChild(scoreEl);

        //add list of cooperating players
        const playersEl = document.createElement('div');
		const playerNames = this.players.map(p => p.name).join(', ');
		playersEl.innerHTML = this.languageManager.get('resultsDrawnBy', { playerNames: playerNames });

        playersEl.style.marginTop = '15px';
        resultsPanel.appendChild(playersEl);
        
         //add the actionbuttons (exit n download)
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
        //resultsPanel.appendChild(exitBtn);
        
        // CREATE DOWNLOAD BUTTON
        const downloadBtn = document.createElement('button');
        downloadBtn.innerText = this.languageManager.get('resultsDownloadButton');
        downloadBtn.style.background = '#4CAF50'; 

        downloadBtn.onclick = () => {
            // --- downlaod logic ---
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            //set canvas size
            canvas.width = 800;
            canvas.height = 1000;

            //create a background
            ctx.fillStyle = '#2a2a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            //load the final drawing
            const finalImage = new Image();
            finalImage.onload = () => {
                //draw the co-op image
                ctx.drawImage(finalImage, 50, 200, 700, 500); // x, y, width, height

                //set text styles
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';

                //draw Title
                ctx.font = 'bold 50px Poppins';
                ctx.fillText('VARY-BRAWL', canvas.width / 2, 80);

                //draw Prompt
                ctx.font = '25px Poppins';
				ctx.fillText(this.languageManager.get('drawingTopic', { prompt: results.prompt }), canvas.width / 2, 140);

                //draw Score
                ctx.font = 'bold 70px Poppins';
				ctx.fillStyle = '#00bfff';
				ctx.fillText(this.languageManager.get('resultsScore', { score: results.score }).replace(/<[^>]*>/g, ''), canvas.width / 2, 780);

                //draw Players
                ctx.font = '25px Poppins';
				ctx.fillStyle = 'white';
				const playerNames = this.players.map(p => p.name).join(', ');
				ctx.fillText(this.languageManager.get('resultsDrawnBy', { playerNames: playerNames }).replace(/<[^>]*>/g, ''), canvas.width / 2, 840);
								
                //draw Watermark
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.font = '16px Poppins';
                ctx.fillText('play : https://varybrawl.onrender.com', canvas.width / 2, 950);

                //trigger download
                const link = document.createElement('a');
                link.download = 'varybrawl-drawing.png';
                link.href = canvas.toDataURL();
                link.click();
            };
            finalImage.src = results.finalImage;
        };

        //add the completed panel to the screen
        buttonWrapper.appendChild(exitBtn);
        buttonWrapper.appendChild(downloadBtn);
        resultsPanel.appendChild(buttonWrapper);
        //lastly add
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
