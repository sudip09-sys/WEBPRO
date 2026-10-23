"use strict";
var Player;
(function (Player) {
    Player[Player["One"] = 0] = "One";
    Player[Player["Two"] = 1] = "Two";
})(Player || (Player = {}));
function shuffled(items) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
} return result; }
class MemoryGame {
    settings;
    grid;
    status;
    cards = [];
    flipped = [];
    moves = 0;
    player = Player.One;
    scores = [0, 0];
    locked = false;
    timer = null;
    hintTimer = null;
    constructor(settings, grid, status) {
        this.settings = settings;
        this.grid = grid;
        this.status = status;
        this.reset(settings);
    }
    reset(settings) { if (this.timer)
        clearTimeout(this.timer); if (this.hintTimer)
        clearTimeout(this.hintTimer); this.settings = settings; const symbols = ['◆', '●', '▲', '★', '♣', '♥', '☀', '✿'].slice(0, settings.pairs); this.cards = shuffled(symbols.flatMap(symbol => [{ symbol, matched: false }, { symbol, matched: false }])); this.flipped = []; this.moves = 0; this.player = Player.One; this.scores = [0, 0]; this.locked = false; this.render(); }
    flip(index) { if (this.locked || this.cards[index].matched || this.flipped.includes(index))
        return; this.flipped.push(index); if (this.flipped.length === 2) {
        this.moves++;
        const [a, b] = this.flipped;
        if (this.cards[a].symbol === this.cards[b].symbol) {
            this.cards[a].matched = this.cards[b].matched = true;
            this.scores[this.player]++;
            this.flipped = [];
        }
        else {
            this.locked = true;
            this.timer = setTimeout(() => { this.flipped = []; this.locked = false; if (this.settings.multiplayer)
                this.player = this.player === Player.One ? Player.Two : Player.One; this.render(); }, 700);
        }
    } this.render(); }
    hint() { if (this.locked || this.flipped.length)
        return; this.locked = true; this.grid.querySelectorAll('button').forEach((b, i) => b.textContent = this.cards[i].symbol); this.hintTimer = setTimeout(() => { this.locked = false; this.render(); }, 850); }
    render() { this.grid.replaceChildren(); this.cards.forEach((card, index) => { const button = document.createElement('button'); const visible = card.matched || this.flipped.includes(index); button.className = 'card' + (card.matched ? ' matched' : ''); button.textContent = visible ? card.symbol : '?'; button.disabled = card.matched; button.setAttribute('aria-label', visible ? `Card ${index + 1}: ${card.symbol}` : `Reveal card ${index + 1}`); button.addEventListener('click', () => this.flip(index)); this.grid.append(button); }); const found = this.cards.filter(c => c.matched).length / 2, over = found === this.settings.pairs; this.status.textContent = (over ? `Complete in ${this.moves} moves!` : `${found}/${this.settings.pairs} pairs · ${this.moves} moves`) + (this.settings.multiplayer ? ` · Player ${this.player + 1} · Scores ${this.scores.join(' / ')}` : ''); this.status.dataset['player'] = String(this.player); }
}
const pairs = document.getElementById('pairs');
const game = new MemoryGame({ pairs: Number(pairs.value), multiplayer: document.body.dataset['lecture'] === '7' }, document.getElementById('board'), document.getElementById('status'));
document.getElementById('restart').addEventListener('click', () => game.reset({ pairs: Number(pairs.value), multiplayer: document.body.dataset['lecture'] === '7' }));
pairs.addEventListener('change', () => game.reset({ pairs: Number(pairs.value), multiplayer: document.body.dataset['lecture'] === '7' }));
document.getElementById('hint')?.addEventListener('click', () => game.hint());
