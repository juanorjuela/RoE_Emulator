// Original deck data from your repo (RoE_Emulator)
const decks = {
  party: [
    { name: "Loud Music", effect: "+2 Party Points. Risk: Neighbors complain." },
    { name: "Snacks", effect: "All players gain 1 Energy." },
    { name: "Neighbors Call Police", effect: "-3 Party Points." },
    { name: "Dance Off", effect: "Roll a die. Gain Party Points equal to the roll." },
    { name: "Karaoke", effect: "All players lose 1 Energy. +1 Party Point." },
    // ... (other cards from your repo)
  ],
  // Add other decks (goals, events) here if needed
};

// Game state (matches your existing variables)
let partyDeck = [];
let partyHand = [];
let partyDiscard = [];
let gameLog = [];

// Initialize the game (preserves your setup)
function initGame() {
  partyDeck = shuffleDeck([...decks.party]); // Improved shuffle
  partyHand = [];
  partyDiscard = [];
  gameLog = [];
  updateUI();
}

// NEW: Fisher-Yates shuffle + no consecutive repeats
function shuffleDeck(deck) {
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Avoid consecutive repeats
  for (let i = 1; i < deck.length; i++) {
    if (deck[i].name === deck[i - 1].name) {
      const j = Math.floor(Math.random() * (deck.length - i)) + i;
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  return deck;
}

// Draw a party card (matches your existing function)
function drawPartyCard() {
  if (partyDeck.length === 0) {
    addToGameLog("Deck is empty! Reshuffling discard pile...");
    partyDeck = shuffleDeck([...partyDiscard]);
    partyDiscard = [];
  }

  const card = partyDeck.pop();
  partyHand.push(card);
  addToGameLog(`Drew: ${card.name}`);
  updateUI();
}

// Play a party card (matches your existing function)
function playPartyCard(index) {
  if (partyHand[index]) {
    const card = partyHand.splice(index, 1)[0];
    partyDiscard.push(card);
    addToGameLog(`Played: ${card.name}`);
    updateUI();
  }
}

// Roll a die (matches your existing function)
function rollDie() {
  const roll = Math.floor(Math.random() * 6) + 1;
  addToGameLog(`Rolled a ${roll}!`);
  return roll;
}

// Add to game log (matches your existing function)
function addToGameLog(text) {
  gameLog.push(text);
  const logElement = document.getElementById("game-log");
  logElement.innerHTML = gameLog.map(entry => `<div>${entry}</div>`).join("");
  logElement.scrollTop = logElement.scrollHeight;
}

// Update UI (matches your existing IDs and structure)
function updateUI() {
  document.getElementById("party-deck-count").textContent = partyDeck.length;
  document.getElementById("party-hand").innerHTML = partyHand
    .map((card, index) => `
      <div class="card" onclick="playPartyCard(${index})">
        <strong>${card.name}</strong><br>${card.effect}
      </div>
    `)
    .join("");
}

// Initialize on load (matches your repo)
window.onload = initGame;