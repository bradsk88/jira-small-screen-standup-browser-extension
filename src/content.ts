import {runtime} from "webextension-polyfill";

console.log("content");

const cardsByOwner: {[owner: string]: HTMLElement[]} = {};
const facesByOwner: {[owner: string]: string} = {};
let adjusted: HTMLElement[] = [];
let currentOwner: string | null = null;
let currentIndex: number | null = null;

let originalAspectRatio = 1;
let originalHeight = 100;

function styleCard(card: HTMLElement) {
    card.style.height = "100%";
    card.style.background = "white";
    card.style.margin = "0 auto";
    return card;
}

function adjustWidthAndFont(c: HTMLElement, originalAspectRatio: number, originalHeight: number) {
    const zoomedHeight = c.offsetHeight;
    const zoomedWidth = zoomedHeight / originalAspectRatio;
    c.style.width = zoomedWidth + "px";
    if (adjusted.includes(c)) {
        return;
    }
    adjusted = adjusted.concat([c])
    adjustFontSizeEm(c, zoomedHeight / originalHeight);
}

function registerWithOwner(card: HTMLElement) {
    const ownerLabel = findElement([card], "id", "-avatar-label")[0];
    const ownerName = ownerLabel?.innerText?.split('Assignee: ')[1];
    cardsByOwner[ownerName] = (cardsByOwner[ownerName] || []).concat(card);
    facesByOwner[ownerName] = ownerLabel.parentElement!.querySelector('img')!.src;
    if (currentOwner == null) {
        currentOwner = ownerName;
    }
}

function findElement(cards: HTMLElement[], qualifiedName: string, content: string): HTMLElement[] {
    cards = cards.flatMap(v => Array.from(v.querySelectorAll("*")).map(v => <HTMLElement>v));
    return cards.filter(v => v.getAttribute(qualifiedName)?.includes(content));
}

function showNextCard(cardSpot: HTMLDivElement, offset = 1) {
    const oldIndex = currentIndex;
    if (currentIndex === null || currentIndex === undefined) {
        currentIndex = 0;
    } else {
        currentIndex += offset;
    }
    console.log('index from', oldIndex, 'to', currentIndex);

    const owners = Object.keys(facesByOwner);
    const oldOwner = currentOwner;
    if (!currentOwner) {
        currentOwner = owners[0];
    }

    const cards = cardsByOwner[currentOwner];
    const ownerIndex = owners.indexOf(currentOwner);
    if (currentIndex >= cards.length) {
        currentIndex = 0;
        currentOwner = owners[(ownerIndex + offset) % owners.length];
        console.log('owner from', oldOwner, 'to', currentOwner);
    }
    cardSpot.innerHTML = "";
    let card = cardsByOwner[currentOwner][currentIndex];

    styleCard(card);
    cardSpot.appendChild(card);
    requestAnimationFrame(() => adjustWidthAndFont(card, originalAspectRatio, originalHeight));
}

runtime.onMessage.addListener(async (message) => {
    if (message.action !== "start") {
        return false;
    }
    const overlay = document.createElement("div");
    overlay.style.background = "white";
    overlay.style.position = "absolute";
    overlay.style.inset = '8px';
    overlay.style.overflowY = "scroll";
    overlay.style.padding = '8px';
    overlay.style.display = 'flex';
    overlay.style.flexFlow = 'column';
    overlay.style.gap = '8px';
    overlay.style.zIndex = '99999';

    document.body.appendChild(overlay);

    let cards: HTMLElement[] = Array.from(document.querySelectorAll(
        "[data-testid=\"software-board.board-container.board.card-container.card-with-icc\"]",
    ));

    cards = findElement(cards, "class", "_content");
    cards.forEach((card: HTMLElement) => {
        registerWithOwner(<HTMLElement>card.cloneNode(true));
        originalAspectRatio = card.offsetHeight / card.offsetWidth;
        originalHeight = card.offsetHeight;
    });

    const faces = document.createElement("div");
    faces.style.background = 'white';
    faces.style.width = '100%';
    faces.style.borderRadius = '8px';
    faces.style.gap = '8px';
    faces.style.padding = '8px';
    faces.style.display = 'flex';
    faces.style.boxSizing = 'border-box';

    Object.entries(facesByOwner).forEach(([key, value]) => {
        const img = document.createElement('img');
        img.src = value;
        img.alt = key;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.borderRadius = '8px';

        faces.appendChild(img);
    })

    const ui = document.createElement('div');
    ui.style.background = 'yellow';
    ui.style.display = 'flex';
    ui.style.flexGrow = '1';

    const cardSpot = document.createElement('div');
    cardSpot.style.width = '80%';
    cardSpot.style.margin = '0 auto';
    cardSpot.style.background = 'lightgray';
    let prevButton = document.createElement('button');
    prevButton.innerText = 'Prev'
    prevButton.style.width = '200px';
    prevButton.addEventListener('click', () => showNextCard(cardSpot, -1));
    ui.appendChild(prevButton);
    ui.appendChild(cardSpot);
    let nextButton = document.createElement('button');
    nextButton.innerText = 'Next';
    nextButton.style.width = '200px';
    nextButton.addEventListener('click', () => showNextCard(cardSpot));
    ui.appendChild(nextButton);

    overlay.appendChild(faces);
    overlay.appendChild(ui);
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
    element.style.setProperty('font-size', `${adjustedSize}${fontSize.unit}`, 'important')
}
