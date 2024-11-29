// Deck Definitions (Player Cards and Round Cards)
let roundDeck = [
    "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest",
    "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest", "Add Guest",
    "Need Drink", "Need Drink", "Need Drink", "Need Drink", "Need Drink", "Need Drink", "Need Drink", "Need Drink", "Need Drink", "Need Drink",
    "Need Food", "Need Food", "Need Food", "Need Food", "Need Food", "Need WC", "Need WC", "Need WC", "Neighbour Visit", "Neighbour Visit",
    "Something Broke", "Something Broke", "WC Maintenance", "WC Maintenance", "WC Maintenance", "WC Maintenance", "WC Maintenance"
]; // Add the remaining cards for full deck

let remainingRoundDeck = [...roundDeck]; // Clone the roundDeck array for tracking

// Function to update the remaining deck count
function updateDeckCount() {
    const deckCountElement = document.getElementById("roundDeckCount");
    deckCountElement.textContent = `Remaining Cards: ${remainingRoundDeck.length}`;
}

// Function to shuffle and draw a card from the round deck
function grabRoundCard() {
    if (remainingRoundDeck.length > 0) {
        // Shuffle the deck
        remainingRoundDeck.sort(() => Math.random() - 0.5);

        // Draw a card
        const roundCard = remainingRoundDeck.shift(); // Remove the top card from the deck
        const roundCardContainer = document.getElementById("roundCard");
        roundCardContainer.innerHTML = ""; // Clear previous card

        // Create image element for the round card (placeholder)
        const cardImage = document.createElement("img");
        cardImage.src = `images/${roundCard.toLowerCase().replace(/ /g, "_")}.png`; // Placeholder image path
        cardImage.alt = roundCard;
        cardImage.classList.add("card-image");

        // Append the image to the container
        roundCardContainer.appendChild(cardImage);

        // Log the card in the visual log
        addToLog(`Round Card Drawn: ${roundCard}`);
    } else {
        alert("No more cards in the deck! Start a new round to reset the deck.");
    }

    // Update the deck count
    updateDeckCount();
}

// Function to start a new round and reset the deck
function startNewRound() {
    // Reset the deck
    remainingRoundDeck = [...roundDeck]; // Restore the full deck
    updateDeckCount(); // Update the deck count display

    // Clear the visual log and round card display
    document.getElementById("roundCard").innerHTML = "";
    addToLog("New Round Started! Deck Reset.");
}

// Function to add log entries in the visual log
function addToLog(message) {
    const logContainer = document.getElementById("log");
    const logEntry = document.createElement("p");
    logEntry.textContent = message;
    logContainer.appendChild(logEntry);
}

// Prep game start button
function prepGameStart() {
    // Start the game by preparing the initial deck
    const prepButton = document.getElementById("prepGameStart");
    prepButton.style.display = "none"; // Hide the Prep Game Start button after it is clicked

    // Shuffle the deck and pick 10 random cards
    let shuffledDeck = [...roundDeck].sort(() => Math.random() - 0.5);
    let selectedCards = shuffledDeck.slice(0, 10); // Draw 10 cards

    const playerCardContainer = document.getElementById("playerCardsContainer");
    playerCardContainer.innerHTML = ""; // Clear previous cards

    selectedCards.forEach(card => {
        // Create card image element
        const cardImage = document.createElement("img");
        cardImage.src = `images/${card.toLowerCase().replace(/ /g, "_")}.png`; // Placeholder image path
        cardImage.alt = card;
        cardImage.classList.add("card-image");
        cardImage.onclick = function () {
            this.classList.toggle("flipped"); // Toggle between the image and black back
        };

        // Append the card to the container
        playerCardContainer.appendChild(cardImage);
    });
}

// Event listener for Prep game start button
document.getElementById("prepGameStart").addEventListener("click", prepGameStart);
