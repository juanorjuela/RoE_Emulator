// Create the card stack
const cardStack = [];

// Add cards by color
const addCards = (color, count) => {
    for (let i = 0; i < count; i++) {
        cardStack.push(color);
    }
};

// Initialize the card stack
addCards("Red", 100);
addCards("Blue", 10);
addCards("Yellow", 10);
addCards("Green", 10);
addCards("Black", 10);
addCards("Purple", 6);
addCards("Brown", 4);

// Shuffle function
const shuffleStack = (stack) => {
    for (let i = stack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [stack[i], stack[j]] = [stack[j], stack[i]];
    }
};

// Shuffle the initial stack
shuffleStack(cardStack);

// Select DOM elements
const cardDisplay = document.getElementById("card-display");
const shuffleButton = document.getElementById("shuffle-button");
const remainingCards = document.getElementById("remaining-cards");

// Update remaining card count
const updateRemainingCards = () => {
    remainingCards.textContent = `Remaining cards: ${cardStack.length}`;
};

// Shuffle button functionality
shuffleButton.addEventListener("click", () => {
    if (cardStack.length > 0) {
        const card = cardStack.pop(); // Draw the top card
        cardDisplay.textContent = `You drew a ${card} card!`;
        updateRemainingCards();
    } else {
        cardDisplay.textContent = "No more cards to draw!";
        shuffleButton.disabled = true;
    }
});

// Initial remaining card count display
updateRemainingCards();
