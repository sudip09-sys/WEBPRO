export class QuizUI {
    root;
    constructor(root) {
        this.root = root;
    }
    question(question, index, total, onAnswer) { this.root.replaceChildren(); const h = document.createElement('h2'); h.textContent = question.text; const s = document.createElement('p'); s.textContent = `Question ${index + 1} / ${total}`; this.root.append(s, h); question.answers.forEach((text, i) => { const b = document.createElement('button'); b.textContent = text; b.className = 'answer'; b.addEventListener('click', () => { this.root.querySelectorAll('button').forEach((button, j) => { button.disabled = true; if (j === question.correct)
        button.classList.add('correct'); }); if (i !== question.correct)
        b.classList.add('wrong'); onAnswer(i); }); this.root.append(b); }); }
    next(score, handler) { const p = document.createElement('p'); p.textContent = 'Score: ' + score; const button = document.createElement('button'); button.textContent = 'Continue →'; button.addEventListener('click', handler); this.root.append(p, button); }
    complete(score, total, handler) { this.root.replaceChildren(); const h = document.createElement('h2'); h.textContent = `Finished: ${score} / ${total}`; const b = document.createElement('button'); b.textContent = 'Restart'; b.addEventListener('click', handler); this.root.append(h, b); }
}
