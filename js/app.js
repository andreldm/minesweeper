import explode from "./explosion.js";

const W = 24;
const H = 20;
const SIZE = W * H;
const MINES = 99;

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

function getColor(value) {
    switch (value) {
        case 1: return '#1976d2';
        case 2: return '#56964d';
        case 3: return '#d32f2f';
        case 4: return '#7b1fa2';
        case 5: return '#ff8f00';
        case 6: return '#008a84';
        case 7: return '#840084';
        case 8: return '#555';
    }

    return 'default';
}

function getSurroundings(cells, i) {
    const firstRow = i < W;
    const lastRow = i >= SIZE - W;
    const leftBorder = i % W == 0;
    const rightBorder = (i + 1) % W == 0;

    let surroundings = [];

    if (!firstRow && !leftBorder) surroundings.push(cells[i-W-1]);
    if (!firstRow) surroundings.push(cells[i-W]);
    if (!firstRow && !rightBorder) surroundings.push(cells[i-W+1]);

    if (!leftBorder) surroundings.push(cells[i-1]);
    if (!rightBorder) surroundings.push(cells[i+1]);

    if (!lastRow && !leftBorder) surroundings.push(cells[i+W-1]);
    if (!lastRow) surroundings.push(cells[i+W]);
    if (!lastRow && !rightBorder) surroundings.push(cells[i+W+1]);

    return surroundings;
}

var app = new Vue({
    el: '#app',
    data: {
        highlightEnabled: false,
        gameOver: false,
        minesLeft: MINES,
        cells: []
    },
    created: function () {
        this.reset();
    },
    methods: {
        toggleHighlight: function(value, cell, event) {
            event.preventDefault();
            if (this.highlightEnabled == value || this.gameOver) return;

            if (this.highlightEnabled = value) {
                this.highlight (cell, true);
            } else {
                this.cells.forEach(c => c.highlight = false);
            }
        },
        highlight: function(cell, value) {
            cell.highlight = value;

            if (this.highlightEnabled)
                getSurroundings(this.cells, cell.index)
                    .forEach(c => c.highlight = value);
        },
        flag: function(cell, event) {
            event.preventDefault();
            if (!this.gameOver && !cell.visible) {
                cell.flagged = !cell.flagged;
                this.minesLeft += cell.flagged ? -1 : 1;
            };
        },
        render: function(cell) {
            if (cell.flagged) return '&#9873;';
            if (!cell.visible || cell.value == 0) return '';
            if (cell.value == 'X') return '&#128163;';
            return cell.value;
        },
        reveal: function(cell) {
            if (this.gameOver || cell.visible || cell.flagged) return;

            cell.flagged = false;
            cell.visible = true;

            if (cell.value == 'X') {
                const grid = document.getElementsByClassName('grid')[0];

                explode(grid.childNodes[cell.index]);

                this.cells
                    .filter(c => c.value == 'X' && !c.visible)
                    .forEach(c => setTimeout(()=> {
                        c.flagged = false;
                        c.visible = true;
                        explode(grid.childNodes[c.index]);
                    }, randomInt (500, 7500)));

                this.gameOver = true;
                return;
            }

            if (cell.value == 0) {
                getSurroundings(this.cells, cell.index)
                    .forEach(c => this.reveal(c));
            }
        },
        revealSurroundings: function(cell, event) {
            event.preventDefault();

            if (!cell.visible || cell.value == 'x' || cell.value == 0) return;

            const surroundings = getSurroundings(this.cells, cell.index);

            if (surroundings.filter(c => c.flagged).length == cell.value) {
                surroundings
                    .filter(c => !c.flagged)
                    .sort((a, b) => a.value.toString() > b.value.toString())
                    .forEach(c => this.reveal(c));
            }
        },
        reset: function() {
            const highestTimeoutId = setTimeout(";");
            for (let i = 0; i < highestTimeoutId; i++) clearTimeout(i);

            Array.from(document.getElementsByTagName('canvas'))
                .forEach(e => document.body.removeChild(e));

            this.gameOver = false;
            this.minesLeft = MINES;
            this.cells = [];
            let mines = new Set();

            while (mines.size < MINES) {
                mines.add(randomInt(0, SIZE));
            }

            for (let i = 0; i < SIZE; i++) {
                this.cells.push({
                    index: i,
                    color: 'default',
                    value: mines.has(i) ? 'X' : 0,
                    highlight: false,
                    flagged: false,
                    visible: false
                });
            }

            for (let i = 0; i < SIZE; i++) {
                if (this.cells[i].value == 'X') continue;

                this.cells[i].value = getSurroundings(this.cells, i)
                    .filter(c => c.value == 'X')
                    .length;

                this.cells[i].color = getColor(this.cells[i].value);
            }
        }
    }
});
