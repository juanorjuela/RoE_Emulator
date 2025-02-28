// Card Decks
let playerDeck = [
    ...Array(5).fill("Order Pizza"),
    ...Array(5).fill("Order Drinks"),
    ...Array(4).fill("Clean WC"),
    ...Array(1).fill("The DROP"),
    ...Array(8).fill("Invite Random"),
    ...Array(4).fill("Music/Rock"),
    ...Array(4).fill("Music/Pop"),
    ...Array(4).fill("Music/Latin"),
    ...Array(4).fill("Music/HipHop"),
    ...Array(1).fill("Music/Classical"),
];

// Needs of the round. a.k.a Fuckups
const fuckupsDeck = [
    ...Array(22).fill("Need Drink"),
    ...Array(22).fill("Need Food"),
    ...Array(20).fill("Need WC"),
    ...Array(25).fill("Need Dance"),
];

const playerHand = [];

// DOM Elements
const playerCardsDiv = document.getElementById("player-cards");
const roundCardDiv = document.getElementById("round-card");
const diceResultsDiv = document.getElementById("dice-results");
const logList = document.getElementById("log-list");

// Shuffle Function
const shuffle = (deck) => deck.sort(() => Math.random() - 0.5);

const paintPlayerHand = () => {
    playerCardsDiv.innerHTML = "";
    playerHand.forEach((card, i) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.textContent = card;
        cardElement.addEventListener("click", () => {
            // Send to cementery
            playerCardsDiv.removeChild(cardElement);
            playerHand.splice(i, 1);
            paintPlayerHand();
            console.log(playerHand);
        });
        playerCardsDiv.appendChild(cardElement);
    });
};

document.getElementById("grab-action-cards-btn").addEventListener("click", () => {
    if (!playerDeck.length) {
        logList.innerHTML += `<li>No more cards to select</li>`;
        return
    }

    const handLength = playerHand.length;
    const missing = 3 - handLength;

    if (missing === 0) {
        return;
    }

    const selectedCards = [];
    for (let i = 0; i < missing; i++) {
        const poppedCard = playerDeck.pop()
        if (poppedCard) {
            selectedCards.push(poppedCard)
        }
    }
    playerHand.push(...selectedCards);

    paintPlayerHand();

    logList.innerHTML += `<li>Player selected: ${selectedCards.join(", ")}. Actions deck has now ${playerDeck.length} cards</li>`;

    console.log(playerHand);
});

// Grab Round Card
document.getElementById("round-card-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle([...fuckupsDeck]);
    const card = shuffledDeck[0];
    roundCardDiv.textContent = `Fuckup: ${card}`;
    logList.innerHTML += `<li>Round FCKUP: ${card}</li>`;
});

// Roll Dice
const rollDice = (diceId) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    document.getElementById(diceId).textContent = roll;
};

["roll-dice-1-btn", "roll-dice-2-btn"].forEach((btnId, idx) => {
    document.getElementById(btnId).addEventListener("click", () => {
        rollDice(`dice-${idx + 1}`);
    });
});

// Reset Game
document.getElementById("reset-btn").addEventListener("click", () => {
    playerCardsDiv.innerHTML = "";
    roundCardDiv.textContent = "";
    diceResultsDiv.innerHTML = "";
    logList.innerHTML = "";
    logList.innerHTML += `<li>Game reset!</li>`;
});

function main() {
    // Add Dice Elements
    [1, 2].forEach((num) => {
        const diceDiv = document.createElement("div");
        diceDiv.className = "dice";
        diceDiv.id = `dice-${num}`;
        diceResultsDiv.appendChild(diceDiv);
    });

    playerDeck = shuffle([...playerDeck]);
    logList.innerHTML += `<li>Actions deck starts with ${playerDeck.length} cards</li>`;
}

main();
