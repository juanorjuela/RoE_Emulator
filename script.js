// Card Decks
let playerDeck = [
    ...Array(5).fill("Order Pizza"),
    ...Array(5).fill("Order Drinks"),
    ...Array(5).fill("Upgrade DJ Station"),
    ...Array(4).fill("Clean WC"),
    ...Array(9).fill("Invite Random Guest"),
    ...Array(3).fill("Play Music: Rock"),
    ...Array(3).fill("Play Music: Pop"),
    ...Array(3).fill("Play Music: Latin"),
    ...Array(3).fill("Play Music: Hip-Hop"),
    ...Array(3).fill("Play Music: Techno"),
    ...Array(3).fill("Play Music: Disco"),
    ...Array(2).fill("The DROP: Cancel the effect of one FCKUP"),
];

// Needs of the round a.k.a FCKUPs
const fuckupsDeck = [

    ...Array(5).fill("Change Music: Play any music card from your hand — you don't need to be at a dance room. If the music doesn't change now, 3 guests will leave the party."),
    ...Array(1).fill("Unlucky: Draw 2 more FCKUP cards."),
    ...Array(1).fill("Lazy Bastard: Discard 3 action cards from your hand. You can only play with 3 cards for the next 2 rounds."),
    ...Array(1).fill("Too Much to Drink: You can only play 1 action per round for the next 2 rounds."),
    ...Array(1).fill("Diarrhea: Rush immediately to the WC! All guests currently in the WC leave the party."),
    ...Array(1).fill("Power Outage: (DICE) Some guests leave the party."),
    ...Array(1).fill("Overdose: (DICE) Some guests leave with the ambulance."),
    ...Array(1).fill("Bar Fight: Triggers a neighbor complaint."),
    ...Array(1).fill("Unplugged System: Everyone leaves the dancefloor."),
    ...Array(1).fill("The Munchies: (DICE) guests head to the kitchen to eat."),
    ...Array(5).fill("Night Fever: (DICE) guests head to the dancefloor."),
    ...Array(1).fill("Shots!: (DICE) guests head to the bar."),
    ...Array(1).fill("Quick Pee: (DICE) guests rush to the WC."),
    ...Array(1).fill("Hold My Hair: (DICE) guests rush to the WC."),
    ...Array(1).fill("Broken WC: If you don't clean it, all guests needing the WC will leave."),
    ...Array(3).fill("Neighbor Complaint - All guests at the entrance must leave. If you collect 3 neighbor complaints, the police show up and 10 guests must leave."),
];

// Mini Missions during the game
const minimissionsDeck = [

    ...Array(1).fill("Fairy Dusk: Visit the WC and bring 2 guests with you (3 coins)"), 
    ...Array(1).fill("Hooked: Be alone in a bedroom with another guest (3 coins)"), 
    ...Array(1).fill("House Chef: Chill out in a full kitchen (3 coins)"), 
    ...Array(1).fill("Nomad: Visit 3 different rooms in a single turn (2 coins)"), 
    ...Array(1).fill("Sweaty Dancefloor: Dance with 7 other guests on the dancefloor (2 coins)"), 
    ...Array(1).fill("Hook-Up: Meet someone alone in the corridor (3 coins)"), 
    ...Array(1).fill("Germophobe: Wash your hands, leave the WC, go back and wash again (2 coins)"), 
    ...Array(1).fill("Get Some: That disco queen in the corner is calling you (2 coins)"), 
    ...Array(1).fill("Sophisto Prick: Suddenly feel like reading a book from the library (1 coin)"), 
    ...Array(1).fill("Powernap: Take a quick break in the bedroom (1 coin)"), 
    ...Array(1).fill("Creeper: Watch people dancing from a non-danceable corner (1 coin)"), 
    ...Array(1).fill("Barman: Serve drinks at a full drinking station (2 coins)"),
];

// Goals for when the party is over
const PartyGoalsDeck = [

    ...Array(1).fill("5 de Mayo: Most guests should be Latin music fans and most songs played should be Latin (30 coins)"), 
    ...Array(1).fill("Underground Rave: Most guests should be Trance fans and most songs played should be Techno/Trance (30 coins)"), 
    ...Array(1).fill("Disco Fever: Most guests should be Disco fans and most songs played should be Disco (30 coins)"), 
    ...Array(1).fill("Karaoke Vibes: Most guests should be Pop fans and most songs played should be Pop (30 coins)"), 
    ...Array(1).fill("Mosh Pit: Most guests should be Rock fans and most songs played should be Rock (30 coins)"),
    ...Array(1).fill("Rap Battle: Most guests should be Hip-Hop fans and most songs played should be Hip-Hop (30 coins)"),  
];




const playerHand = [];

// DOM Elements
const playerCardsDiv = document.getElementById("player-cards");
const roundCardDiv = document.getElementById("round-card");
const miniMissionDiv = document.getElementById("mini-mission");
const partyGoalDiv = document.getElementById("party-goal");
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
    const missing = 6 - handLength;

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
    roundCardDiv.textContent = `FCKUP// ${card}`;
    logList.innerHTML += `<li>FCKUP// ${card}</li>`;
});

// Grab Mini Mission
document.getElementById("mini-mission-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle([...minimissionsDeck]);
    const card = shuffledDeck[0];
    miniMissionDiv.textContent = `MINI MISSION// ${card}`;
    logList.innerHTML += `<li>MINI MISSION// ${card}</li>`;
});

// Grab Party Goal
document.getElementById("party-goals-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle([...PartyGoalsDeck]);
    const card = shuffledDeck[0];
    partyGoalDiv.textContent = `PARTY GOAL// ${card}`;
    logList.innerHTML += `<li>PARTY GOAL// ${card}</li>`;
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
