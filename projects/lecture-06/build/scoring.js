export class Score {
    value = 0;
    add(correct) { if (correct)
        this.value++; return this.value; }
    get total() { return this.value; }
    reset() { this.value = 0; }
}
