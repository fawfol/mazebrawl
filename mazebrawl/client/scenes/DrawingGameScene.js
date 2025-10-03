// mazebrawl/client/scenes/DrawingGameScene.js
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

        //drawing state
        this.isDrawing = false;
        this.currentColor = '#FFFFFF';
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
        this.promptText.innerText = 'Waiting for prompt...';
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

        // Tools
        this.createToolbar(main);
    }
    
    createToolbar(container) {
        const toolbar = document.createElement('div');
        toolbar.className = 'draw-toolbar';
        
        //colors
        const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];
        colors.forEach(color => {
            const colorBtn = document.createElement('button');
            colorBtn.className = 'draw-tool-color';
            colorBtn.style.backgroundColor = color;
            if (color === this.currentColor) colorBtn.classList.add('selected');
            colorBtn.onclick = () => {
                this.currentColor = color;
                toolbar.querySelector('.selected')?.classList.remove('selected');
                colorBtn.classList.add('selected');
            };
            toolbar.appendChild(colorBtn);
        });
        
        //brush Size
        const brushSizeSlider = document.createElement('input');
        brushSizeSlider.type = 'range';
        brushSizeSlider.min = '1';
        brushSizeSlider.max = '20';
        brushSizeSlider.value = this.currentBrushSize;
        brushSizeSlider.oninput = (e) => this.currentBrushSize = e.target.value;
        toolbar.appendChild(brushSizeSlider);
        
        //eraser
        const eraserBtn = document.createElement('button');
        eraserBtn.innerText = 'Eraser';
        eraserBtn.onclick = () => this.currentColor = '#1e1e1e'; // BG color
        toolbar.appendChild(eraserBtn);

        container.appendChild(toolbar);
    }

    updatePromptText() {
        this.promptText.innerText = `Prompt: "${this.prompt}"`;
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
        
        //determine grid layout
        const cols = Math.ceil(Math.sqrt(this.playerCount));
        const rows = Math.ceil(this.playerCount / cols);
        this.canvasContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

        for (let i = 0; i < this.playerCount; i++) {
            const segment = this.segments.find(s => s.segmentIndex === i);
            const playerId = segment?.playerId;

            if (i === this.mySegmentIndex) {
                this.myCanvas = document.createElement('canvas');
                this.myCanvas.className = 'draw-canvas my-canvas';
                this.canvasContainer.appendChild(this.myCanvas);
                this.setupDrawingListeners();
            } else {
                const otherCanvas = document.createElement('img'); //use img for read-only display
                otherCanvas.className = 'draw-canvas';
                this.canvasContainer.appendChild(otherCanvas);
                if (playerId) this.otherCanvases[playerId] = otherCanvas;
            }
        }
        this.resizeCanvas();
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
        finalCtx.fillStyle = '#1e1e1e';
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

            if (sourceElement) {
                finalCtx.drawImage(sourceElement, x, y, segmentWidth, segmentHeight);
            }
        });
        
        //send the final combined image to the server
        this.socket.emit('submitDrawing', finalCanvas.toDataURL());
        
        //show "Evaluating..." overlay
        this.showOverlay("<h2>Evaluating your masterpiece...</h2><p>Our highly sophisticated AI is judging your work!</p>");
    }

    showFinalResults(results) {
        const content = `
            <h2>Results are in!</h2>
            <p>For the prompt: <strong>"${results.prompt}"</strong></p>
            <img src="${results.finalImage}" style="width: 90%; max-width: 400px; border: 2px solid #fff; margin: 10px 0;"/>
            <h3>AI Score: <span style="color: #00bfff;">${results.score}%</span></h3>
            <p>${results.feedback}</p>
        `;
        this.showOverlay(content, true);
    }
    
    showOverlay(innerHTML, showExitButton = false) {
        document.querySelector('.draw-overlay')?.remove(); //remove old overlay
        
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
