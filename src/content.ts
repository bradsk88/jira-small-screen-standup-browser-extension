import {runtime} from "webextension-polyfill";

console.log("content");

runtime.onMessage.addListener(async (message) => {
    if (message.action !== "start") {
        return false;
    }
    const overlay = document.createElement("div");
    overlay.style.background = "blue";
    overlay.style.position = "absolute";
    overlay.style.left = "50px";
    overlay.style.right = "50px";
    overlay.style.top = "50px";
    overlay.style.bottom = "50px";
    overlay.style.overflowY = "scroll";

    document.body.appendChild(overlay);

    let cards: HTMLElement[] = Array.from(document.querySelectorAll(
        "[data-testid=\"software-board.board-container.board.card-container.card-with-icc\"]",
    ));

    cards = cards.flatMap(v => Array.from(v.querySelectorAll("*")).map(v => <HTMLElement>v));
    cards = cards.filter(v => v.getAttribute("class")?.includes("_content"));
    cards.slice(0, 1).forEach((card: HTMLElement) => {
        const c = <HTMLElement>card.cloneNode(true);
        c.style.position = "absolute";
        c.style.top = "50%";
        c.style.left = "50%";
        c.style.transform = "translate(-50%, -50%)";
        c.style.height = "80%";
        c.style.background = "white";

        const originalAspectRatio = card.offsetHeight / card.offsetWidth;
        const originalHeight = card.offsetHeight;
        overlay.appendChild(c);

        requestAnimationFrame(() => {
            const zoomedHeight = c.offsetHeight;
            const zoomedWidth = zoomedHeight / originalAspectRatio;
            c.style.width = zoomedWidth + "px";
            adjustFontSizeEm(c, zoomedHeight / originalHeight);
        });
    });
    return true;
});

function getFontSizeEm(element: HTMLElement): { num: number, unit: string } {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = computedStyle.fontSize;
    const num = parseFloat(fontSize);
    return {num: num, unit: fontSize.split(`${num}`)[1]};
}

function adjustFontSizeEm(element: HTMLElement, multiplier: number) {
    const fontSize = getFontSizeEm(element);
    const adjustedSize = fontSize.num * multiplier;
    element.style.fontSize = `${adjustedSize}${fontSize.unit}`;
}
