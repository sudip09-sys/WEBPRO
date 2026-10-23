"use strict";
class PianoKey {
    data;
    button;
    audio;
    constructor(data, container) {
        this.data = data;
        this.audio = new Audio(data.sound);
        this.audio.preload = 'auto';
        this.button = document.createElement('button');
        this.button.textContent = data.note + ' / ' + data.keyboard.toUpperCase();
        this.button.setAttribute('aria-label', 'Play ' + data.note);
        this.button.addEventListener('click', () => void this.play());
        container.append(this.button);
    }
    async play() { this.audio.pause(); this.audio.currentTime = 0; try {
        await this.audio.play();
        this.button.classList.add('active');
        setTimeout(() => this.button.classList.remove('active'), 180);
        document.getElementById('status').textContent = 'Playing ' + this.data.note;
    }
    catch {
        document.getElementById('status').textContent = 'Click a key to enable audio playback.';
    } }
    stop() { this.audio.pause(); this.audio.currentTime = 0; this.button.classList.remove('active'); }
}
class MelodyPlayer {
    keys;
    melody = [];
    cursor = 0;
    running = false;
    timer = null;
    remaining = 0;
    startTime = 0;
    constructor(keys) {
        this.keys = keys;
    }
    async load() { this.reset(); try {
        const response = await fetch('melody.json');
        if (!response.ok)
            throw Error('HTTP ' + response.status);
        const data = await response.json();
        if (!Array.isArray(data) || !data.every((n) => this.keys.some(k => k.data.note === n.note) && Number.isFinite(n.duration) && n.duration > 0))
            throw Error('Invalid melody');
        this.melody = data;
        const strip = document.getElementById('melody');
        strip.replaceChildren();
        this.melody.forEach(n => { const b = document.createElement('button'); b.textContent = n.note; b.addEventListener('click', () => void this.keys.find(k => k.data.note === n.note).play()); strip.append(b); });
        document.getElementById('status').textContent = data.length + ' notes loaded';
    }
    catch {
        document.getElementById('status').textContent = 'Could not load the melody. Serve the project over HTTP.';
    } }
    toggle() { if (!this.melody.length) {
        document.getElementById('status').textContent = 'Load a melody first.';
        return;
    } if (this.running) {
        this.running = false;
        if (this.timer)
            clearTimeout(this.timer);
        this.remaining = Math.max(0, this.remaining - (performance.now() - this.startTime));
        document.getElementById('status').textContent = 'Paused';
    }
    else {
        this.running = true;
        if (this.remaining > 0) {
            this.startTime = performance.now();
            this.timer = setTimeout(() => { this.remaining = 0; this.advance(); }, this.remaining);
        }
        else
            this.advance();
    } }
    advance() { if (!this.running)
        return; if (this.cursor === this.melody.length) {
        this.running = false;
        this.cursor = 0;
        this.remaining = 0;
        document.getElementById('status').textContent = 'Melody complete';
        return;
    } const note = this.melody[this.cursor++]; void this.keys.find(k => k.data.note === note.note).play(); this.remaining = note.duration; this.startTime = performance.now(); this.timer = setTimeout(() => this.advance(), note.duration); }
    reset() { if (this.timer)
        clearTimeout(this.timer); this.running = false; this.cursor = 0; this.remaining = 0; this.keys.forEach(k => k.stop()); document.getElementById('status').textContent = 'Ready'; }
}
const data = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note, i) => ({ note, keyboard: ['a', 's', 'd', 'f', 'g', 'h', 'j'][i], sound: 'sounds/' + note + '.mp3' }));
const keys = data.map(d => new PianoKey(d, document.getElementById('piano')));
const player = new MelodyPlayer(keys);
document.addEventListener('keydown', (event) => { if (event.repeat || event.ctrlKey || event.metaKey || event.altKey)
    return; const key = keys.find(k => k.data.keyboard === event.key.toLowerCase()); if (key) {
    event.preventDefault();
    void key.play();
} if (event.code === 'Space' && document.getElementById('play')) {
    event.preventDefault();
    player.toggle();
} });
document.getElementById('load')?.addEventListener('click', () => void player.load());
document.getElementById('play')?.addEventListener('click', () => player.toggle());
document.getElementById('reset')?.addEventListener('click', () => player.reset());
