function isSafariMobile() {
    var ua = window.navigator.userAgent;
    var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    var webkit = !!ua.match(/WebKit/i);
    return iOS && webkit && !ua.match(/CriOS/i);
}

/**
 * Safari on iOS does not support right click events as long presses.
 * Therefore this unholy hack is necessary to mimic the behavior of sane browsers.
 * Screw you Apple!
 */
export const touchEventHandler = function () {
    const EVENT_DELAY = 350;
    let touchTimer = undefined;
    let lastTimeStamp = -10000;

    const start = (event, dblClickCallback, longClickCallback) => {
        if (event.timeStamp - lastTimeStamp < EVENT_DELAY) {
            event.preventDefault();
            lastTimeStamp = -10000;
            dblClickCallback();
            return;
        }

        lastTimeStamp = event.timeStamp;

        touchTimer = setTimeout(() => {
            event.preventDefault();
            touchTimer = undefined; longClickCallback();
        }, EVENT_DELAY);
    }

    const end = (event, clickCallback) => {
        event.preventDefault();

        if (touchTimer) {
            clearTimeout(touchTimer);
            clickCallback();
        }
    }

    const cancel = () => {
        clearTimeout(touchTimer);
        touchTimer = undefined;
    }

    return (event, clickCallback, dblClickCallback, longClickCallback) => {
        if (!isSafariMobile()) return;
        if (event.touches.length > 1) {
            cancel();
            return;
        }

        switch (event.type) {
            case 'touchstart':
                start(event, dblClickCallback, longClickCallback);
                break;
            case 'touchend':
                end(event, clickCallback);
                break;
            default:
                cancel();
                break;
        }
    }
}();

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) ) + min;
}

export default { touchEventHandler, randomInt };
