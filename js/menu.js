const TEMPLATE = `
<div class="controls">
  <h1>Minesweeper</h1>
  <button class="button" v-on:click="start('easy')">Easy</button>
  <button class="button" v-on:click="start('medium')">Medium</button>
  <button class="button" v-on:click="start('hard')">Hard</button>
<div>
`;

export default {
    name: 'Menu',
    template: TEMPLATE,
    methods: {
        start: function (difficulty) {
            this.$router.push(`/game/${difficulty}`);
        }
    }
}
