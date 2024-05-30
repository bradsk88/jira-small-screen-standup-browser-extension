import {runtime} from "webextension-polyfill";

console.log('content');

runtime.onMessage.addListener(async (message) => {
    if (message.action !== "start") {
        return false;
    }
    const overlay = document.createElement('div');
    overlay.style.background = 'blue';
    overlay.style.position = 'absolute';
    overlay.style.left = '50px';
    overlay.style.right = '50px';
    overlay.style.top = '50px';
    overlay.style.bottom = '50px';
    overlay.style.overflowY = 'scroll';

    document.body.appendChild(overlay);

    const cards = Array.from(document.querySelectorAll(
        '[data-testid="software-board.board-container.board.card-container.card-with-icc"]'
    ));

    cards.forEach(card => {
        const c: HTMLElement = <HTMLElement>card.cloneNode(true);
        c.style.fontSize = '6em';
        c.style.maxWidth = '80%';
        c.style.margin = '5px 100px';
        c.style.zIndex = '99999';
        overlay.appendChild(c);
    })


    console.log('added', overlay);

    return true;
})
