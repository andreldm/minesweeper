import explode from "./explosion.js";
import {touchEventHandler, randomInt } from "./util.js";

const TEMPLATE = `
<div class="grid"
     v-on:mouseup.middle="toggleHighlight(false, undefined)"
     v-on:mouseleave="toggleHighlight(false, undefined)">
    <div
        class="cell"
        v-for="cell in cells"
        v-bind:class="{ highlight: cell.highlight, clickable: !cell.visible && !cell.flagged && !gameOver, hidden: !cell.visible, bomb: cell.visible && cell.value == 'X' }"
        v-bind:style="{ color: cell.flagged ? 'red' : cell.color }"
        v-on:click.left.prevent="reveal(cell)"
        v-on:contextmenu.prevent="flag(cell)"
        v-on:touchstart="touch(cell, $event)"
        v-on:touchend="touch(cell, $event)"
        v-on:touchmove="touch(cell, $event)"
        v-on:touchcancel="touch(cell, $event)"
        v-on:dblclick.prevent="revealSurroundings(cell)"
        v-on:click.middle.prevent="revealSurroundings(cell)"
        v-on:mousedown.middle.prevent="toggleHighlight(true, cell)"
        v-on:mouseleave="highlight(cell, false)"
        v-on:mouseenter="highlight(cell, true)"
        v-html="render(cell)">
    </div>
</div>
<div class="controls">
    <div class="mine-counter" v-if="success">You won!</div>
    <div class="mine-counter" v-if="!success && gameOver">You lost!</div>
    <div class="mine-counter" v-if="!success && !gameOver">{{ Math.max(minesLeft, 0) }} mine{{ minesLeft == 1 ? '' : 's' }} left</div>
    <div class="time">{{ time }}</div>
    <div>
        <button class="button" v-on:click="reset">Reset</button>
        <button class="button" v-on:click="menu">Menu</button>
    </div>
</div>`;

const CONFIG = {
    "easy": {
        width: 9,
        height: 9,
        mines: 10,
    },
    "medium": {
        width: 16,
        height: 16,
        mines: 40,
    },
    "hard": {
        width: 30,
        height: 16,
        mines: 99,
    },
};

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

function getSurroundings(cells, i, width, size) {
    const firstRow = i < width;
    const lastRow = i >= size - width;
    const leftBorder = i % width == 0;
    const rightBorder = (i + 1) % width == 0;

    let surroundings = [];

    if (!firstRow && !leftBorder) surroundings.push(cells[i-width-1]);
    if (!firstRow) surroundings.push(cells[i-width]);
    if (!firstRow && !rightBorder) surroundings.push(cells[i-width+1]);

    if (!leftBorder) surroundings.push(cells[i-1]);
    if (!rightBorder) surroundings.push(cells[i+1]);

    if (!lastRow && !leftBorder) surroundings.push(cells[i+width-1]);
    if (!lastRow) surroundings.push(cells[i+width]);
    if (!lastRow && !rightBorder) surroundings.push(cells[i+width+1]);

    return surroundings;
}

export default {
    name: 'Game',
    template: TEMPLATE,
    data: function () {
      return {
        highlightEnabled: false,
        gameOver: false,
        success: false,
        minesLeft: 0,
        cells: [],
        width: 0,
        size: 0,
        mines: 0,
        time: 0,
        timeTimerId: undefined,
      }
    },
    props: {
        difficulty: String,
    },
    mounted: function () {
        this.width = CONFIG[this.difficulty].width;
        this.minesLeft = this.mines = CONFIG[this.difficulty].mines;
        this.size = this.width * CONFIG[this.difficulty].height;
        document.querySelector('.grid').style.gridTemplateColumns = matchMedia('(max-width: 800px)').matches ?
        `repeat(${this.width}, 5vh)` : `repeat(${this.width}, 24px)`;
        this.reset();

            
    },
    methods: {
        toggleHighlight: function (value, cell) {
            if (this.highlightEnabled == value || this.gameOver) return;

            if (this.highlightEnabled = value) {
                this.highlight (cell, true);
            } else {
                this.cells.forEach(c => c.highlight = false);
            }
        },
        highlight: function (cell, value) {
            if (this.gameOver) return;

            cell.highlight = value;

            if (this.highlightEnabled)
                getSurroundings(this.cells, cell.index, this.width, this.size)
                    .forEach(c => c.highlight = value);
        },
        flag: function (cell) {
            if (!this.gameOver && !cell.visible) {
                cell.flagged = !cell.flagged;
                this.minesLeft += cell.flagged ? -1 : 1;
            };
        },
        render: function (cell) {
            if (cell.flagged) return '&#9873;';
            if (!cell.visible || cell.value == 0) return '';
            if (cell.value == 'X') return '&#128163;';
            return cell.value;
        },
        reveal: function (cell) {
            if (this.gameOver || cell.visible || cell.flagged) return;

            // Start game
            if (cell.value == -1) {
                this.plantMines(cell.index);
                this.startTimer();
            }

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
                this.stopTimer();
                return;
            }

            if (cell.value == 0) {
                getSurroundings(this.cells, cell.index, this.width, this.size)
                    .forEach(c => this.reveal(c));
            }

            if (this.cells.filter(c => !c.visible).length == this.mines) {
                this.cells.filter(c => c.value == 'X').forEach(c => c.flagged = true);
                this.success = true;
                this.gameOver = true;
                this.stopTimer();
            }
        },
        revealSurroundings: function (cell) {
            if (!cell.visible || cell.value == 'x' || cell.value == 0) return;

            const surroundings = getSurroundings(this.cells, cell.index, this.width, this.size);

            if (surroundings.filter(c => c.flagged).length == cell.value) {
                surroundings
                    .filter(c => !c.flagged)
                    .sort((a, b) => a.value.toString() > b.value.toString())
                    .forEach(c => this.reveal(c));
            }
        },
        plantMines: function (selectedCellIndex) {
            const mines = new Set();

            while (mines.size < this.mines) {
                const i = randomInt(0, this.size);
                if (i == selectedCellIndex || mines.has(i))
                    continue;
                this.cells[i].value = 'X';
                mines.add(i);
            }

            for (let i = 0; i < this.size; i++) {
                if (this.cells[i].value == 'X') continue;

                this.cells[i].value = getSurroundings(this.cells, i, this.width, this.size)
                    .filter(c => c.value == 'X')
                    .length;

                this.cells[i].color = getColor(this.cells[i].value);
            }
        },
        reset: function () {
            const highestTimeoutId = setTimeout(";");
            for (let i = 0; i < highestTimeoutId; i++) clearTimeout(i);

            Array.from(document.getElementsByTagName('canvas'))
                .forEach(e => document.body.removeChild(e));

            this.highlightEnabled = false;
            this.gameOver = false;
            this.success = false;
            this.minesLeft = this.mines;
            this.cells = [];

            for (let i = 0; i < this.size; i++) {
                this.cells.push({
                    index: i,
                    color: 'default',
                    value: -1,
                    highlight: false,
                    flagged: false,
                    visible: false
                });
            }

            this.stopTimer();
            this.time = 0;
        },
        startTimer: function() {
            this.timeTimerId = setInterval(() => this.time++, 1000);
        },
        stopTimer: function() {
            clearTimeout(this.timeTimerId);
            this.timeTimerId = undefined;
        },
        menu: function () {
            this.reset();
            this.$router.push('/');
        },
        touch: function (cell, event) {
            touchEventHandler(event,
                              () => this.reveal(cell),
                              () => this.revealSurroundings(cell),
                              () => this.flag(cell));
        }
    }
}
