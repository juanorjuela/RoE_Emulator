// Initialize the card stack
let cardStack = [];

// Function to add cards by color
const addCards = (color, count) => {
    for (let i = 0; i < count; i++) {
        cardStack.push(color);
    }
};

// Function to initialize the deck
const initializeDeck = () => {
    cardStack = [];
    addCards("Red", 100);
    addCards("Blue", 10);
    addCards("Yellow", 10);
    addCards("Green", 10);
    addCards("Black", 10);
    addCards("Purple", 6);
    addCards("Brown", 4);
    shuffleStack(cardStack);
};

// Shuffle function
const shuffleStack = (stack) => {
    for (let i = stack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [stack[i], stack[j]] = [stack[j], stack[i]];
    }
};

// Select DOM elements
const cardDisplay = document.getElementById("card-display");
const shuffleButton = document.getElementById("shuffle-button");
const resetButton = document.getElementById("reset-button");
const remainingCards = document.getElementById("remaining-cards");

// Update remaining card count
const updateRemainingCards = () => {
    remainingCards.textContent = `Remaining cards: ${cardStack.length}`;
};

// Display card as a colored square
const displayCard = (color) => {
    cardDisplay.innerHTML = `<div class="card" style="background-color: ${color};"></div>`;
};

// Shuffle button functionality
shuffleButton.addEventListener("click", () => {
    if (cardStack.length > 0) {
        const card = cardStack.pop(); // Draw the top card
        displayCard(card);
        updateRemainingCards();
    } else {
        cardDisplay.innerHTML = `<p class="card-placeholder">No more cards to draw!</p>`;
        shuffleButton.disabled = true;
    }
});

// Reset button functionality
resetButton.addEventListener("click", () => {
    initializeDeck();
    cardDisplay.innerHTML = `<p class="card-placeholder">Press "Shuffle" to draw a card!</p>`;
    shuffleButton.disabled = false;
    updateRemainingCards();
});

// Initialize the deck and update the UI
initializeDeck();
updateRemainingCards();
