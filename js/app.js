const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: "menu",
            component: () => import('./menu.js'),
        },
        {
            path: '/game/:difficulty',
            name: "game",
            component: () => import('./game.js'),
            props: true,
        },
    ],
});

const app = Vue.createApp({});
app.use(router);
app.mount('#app');
