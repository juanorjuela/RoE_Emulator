let remainingRoundDeck = [...roundDeck]; // Clone the roundDeck array for tracking


// Card Decks
const playerDeck = [
    ...Array(15).fill("Pizza Station"),
    ...Array(15).fill("Drink Stations"),
    ...Array(15).fill("WC Station"),
    ...Array(15).fill("DJ Station"),
    ...Array(25).fill("Order More Pizza"),
    ...Array(25).fill("Order More Drinks"),
    ...Array(50).fill("Clean WC"),
    ...Array(30).fill("Adjust Volume"),
    ...Array(10).fill("Extra Queue"),
    ...Array(10).fill("Helping Hand"),
    ...Array(10).fill("Police Enchanter"),
    ...Array(5).fill("The DROP"),
];

const roundDeck = [
    ...Array(100).fill("Add Guest"),
    ...Array(20).fill("Need Drink"),
    ...Array(15).fill("Need Food"),
    ...Array(10).fill("Need WC"),
    ...Array(5).fill("Neighbour Visit"),
    ...Array(5).fill("Something Broke"),
    ...Array(5).fill("WC Maintenance"),
];

// DOM Elements
const playerCardsDiv = document.getElementById("player-cards");
const roundCardDiv = document.getElementById("round-card");
const diceResultsDiv = document.getElementById("dice-results");
const logList = document.getElementById("log-list");

// Shuffle Function
const shuffle = (deck) => deck.sort(() => Math.random() - 0.5);

// Prep Game Start
document.getElementById("prep-game-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle([...playerDeck]);
    const selectedCards = shuffledDeck.slice(0, 5);
    playerCardsDiv.innerHTML = "";
    selectedCards.forEach((card) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.textContent = card;
        cardElement.addEventListener("click", () => {
            cardElement.classList.toggle("black");
        });
        playerCardsDiv.appendChild(cardElement);
    });
    logList.innerHTML += `<li>Game prepped with cards: ${selectedCards.join(", ")}</li>`;
});

// New Round
document.getElementById("new-round-btn").addEventListener("click", () => {
    document.getElementById("prep-game-btn").click();
    logList.innerHTML += `<li>New round started!</li>`;
});

// Grab Round Card
function grabRoundCard() {
    // Shuffle the deck
    remainingRoundDeck.sort(() => Math.random() - 0.5);

    if (remainingRoundDeck.length > 0) {
        // Draw a card
        const roundCard = remainingRoundDeck.shift(); // Remove the top card from the deck
        const roundCardContainer = document.getElementById("roundCard");
        roundCardContainer.innerHTML = ""; // Clear previous card

        // Create image element for the round card
        const cardImage = document.createElement("img");
        cardImage.src = `images/${roundCard.toLowerCase().replace(/ /g, "_")}.png`;
        cardImage.alt = roundCard;
        cardImage.classList.add("card-image");

        // Append the image to the container
        roundCardContainer.appendChild(cardImage);

        // Log the card in the visual log
        addToLog(`Round Card Drawn: ${roundCard}`);
    } else {
        alert("No more cards in the deck! Start a new round to reset the deck.");
    }

    // Update the deck count display
function updateDeckCount() {
    const deckCountElement = document.getElementById("roundDeckCount");
    deckCountElement.textContent = `Remaining Cards: ${remainingRoundDeck.length}`;
}



// Roll Dice
const rollDice = (diceId) => {
    const roll = Math.floor(Math.random() * 3) + 1;
    document.getElementById(diceId).textContent = roll;
};

["roll-dice-1-btn", "roll-dice-2-btn", "roll-dice-3-btn"].forEach((btnId, idx) => {
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

// Add Dice Elements
[1, 2, 3].forEach((num) => {
    const diceDiv = document.createElement("div");
    diceDiv.className = "dice";
    diceDiv.id = `dice-${num}`;
    diceResultsDiv.appendChild(diceDiv);
});
