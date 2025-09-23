export default class TypingGame extends Phaser.Scene {
  constructor() {
    super({ key: 'TypingGame' });
  }

  init(data) {
    this.socket = data.socket;
    this.players = data.players;
    this.myIndex = data.myIndex;
    this.sentence = data.sentence || '';
    this.progress = {};
    this.players.forEach(p => this.progress[p.id] = 0);
  }

  create() {
    // clear previous DOM
    document.body.innerHTML = '';

    // main container
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#222',
      color: '#fff',
      fontFamily: 'sans-serif',
      gap: '1rem'
    });
    document.body.appendChild(this.container);

    // sentence display
    this.sentenceDisplay = document.createElement('p');
    this.sentenceDisplay.innerText = this.sentence;
    this.sentenceDisplay.style.fontSize = '1.5rem';
    this.container.appendChild(this.sentenceDisplay);

    // input box
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Start typing...';
    this.input.style.fontSize = '1.2rem';
    this.input.style.width = '80%';
    this.container.appendChild(this.input);
    this.input.focus();

    // status
    this.status = document.createElement('h2');
    this.status.innerText = 'Start typing!';
    this.container.appendChild(this.status);

    // progress display for all players
    this.progressContainer = document.createElement('div');
    Object.assign(this.progressContainer.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      width: '80%',
      maxWidth: '400px'
    });
    this.container.appendChild(this.progressContainer);

    this.players.forEach(p => {
      const barWrapper = document.createElement('div');
      Object.assign(barWrapper.style, {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px'
      });
      barWrapper.innerHTML = `<span>${p.name}</span><span>0%</span>`;
      const bar = document.createElement('div');
      Object.assign(bar.style, {
        height: '10px',
        width: '100%',
        background: '#555',
        marginTop: '3px',
        borderRadius: '5px',
        overflow: 'hidden'
      });
      const fill = document.createElement('div');
      Object.assign(fill.style, {
        height: '100%',
        width: '0%',
        background: 'lime'
      });
      bar.appendChild(fill);
      barWrapper.appendChild(bar);
      this.progressContainer.appendChild(barWrapper);
      this.progress[p.id] = { wrapper: barWrapper, fill, text: barWrapper.querySelector('span:nth-child(2)') };
    });

    // typing input listener
    this.input.addEventListener('input', () => {
      const typed = this.input.value;
      const prog = Math.min(typed.length / this.sentence.length, 1);
      this.socket.emit('typingProgress', prog);

      // local update
      this.updateProgress(this.socket.id, prog);

      if (typed === this.sentence) {
        this.input.disabled = true;
        this.status.innerText = 'You finished!';
      }
    });

    // listen for other players progress
    this.socket.on('updateProgress', ({ playerId, progress }) => {
      this.updateProgress(playerId, progress);
    });
  }

  updateProgress(playerId, prog) {
    const p = this.progress[playerId];
    if (!p) return;
    p.fill.style.width = `${(prog * 100).toFixed(0)}%`;
    p.text.innerText = `${Math.floor(prog * 100)}%`;
  }
}
