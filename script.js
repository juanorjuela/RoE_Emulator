// Card Decks
let playerDeck = [
    ...Array(5).fill("Order Pizza"),
    ...Array(5).fill("Order Drinks"),
    ...Array(5).fill("Upgrade DJ station"),
    ...Array(4).fill("Clean WC"),
    ...Array(9).fill("Invite Random"),
    ...Array(3).fill("Music/Rock"),
    ...Array(3).fill("Music/Pop"),
    ...Array(3).fill("Music/Latin"),
    ...Array(3).fill("Music/HipHop"),
    ...Array(3).fill("Music/Techno"),
    ...Array(3).fill("Music/Disco"),
    ...Array(4).fill("The DROP: Cancels the effect of a FCKUP"),
];

// Needs of the round. a.k.a Fuckups
const fuckupsDeck = [

    ...Array(6).fill("Change Music: Use a music card from your deck, no need to be in a dance room. If the music does not change now, 3 people will leave the party."), 
    ...Array(1).fill("Unlucky: Take 2 more fuckups"),
    ...Array(1).fill("Lazy Bastrad: Take out 3 action cards from your hand, you can only play with 3 cards for 2 rounds"),
    ...Array(1).fill("Too much to drink: You can now only play one action for the next 2 rounds"),
    ...Array(1).fill("Diarrhea: Go immediately to the WC, everyone currently in the WC leaves the party"),
    ...Array(1).fill("Electricity is out: (DICE) Guests leave the party"),
    ...Array(1).fill("Overdose: (DICE) people leave in the ambulance"),
    ...Array(1).fill("Bar fight: triggers a neighbour call"),
    ...Array(1).fill("Unpluged system: Everyone leaves the dancefloor"),
    ...Array(1).fill("The munchies: (DICE) people go to eat."),
    ...Array(5).fill("Night Fever: (DICE) people go to dance."),
    ...Array(1).fill("Shots!: (DICE) people go to drink."),
    ...Array(1).fill("Quick pee: (DICE) people go to the WC."),
    ...Array(1).fill("Hold my hair: (DICE) people go to the WC."),
    ...Array(1).fill("Broken WC: unless you clean this mess, all the guests that need the WC will leave."),
    ...Array(3).fill("Neighbour Call - All guests in the entrance must leave. When your party collect 3 neighbour cards, the police will arrive and 10 guests must leave the party."),

];

// Mini Mission to be done in-game
const minimissionsDeck = [

    ...Array(1).fill("Fairy Dusk: go to a WC and bring 2 guests with you (3 coins)"), 
    ...Array(1).fill("Hooked: In bedroom with someone else, only the 2 of you (3 coins)"), 
    ...Array(1).fill("House Chef: Chill in a full kitchen (3 coins)"), 
    ...Array(1).fill("Nomad: move to 3 rooms in one turn (2 coins)"), 
    ...Array(1).fill("Nothing like a sweaty dancefloor: Dance with other 7 fellow dancers, in a dancefloor (2 coins)"), 
    ...Array(1).fill("Hook-Up: Be with someone alone in the corridor (3 coins)"), 
    ...Array(1).fill("Germofobe: Wash your hands, leave the WC, go back and wash them again. (2 coins)"), 
    ...Array(1).fill("Get some: That disco queen in the corner has something for you (2 coins)"), 
    ...Array(1).fill("Sophisto Prick: suddenly you got an urge to read a book from the library (1 coin)"), 
    ...Array(1).fill("Powernap: Quick bedroom break, need to rest a sec (1 coin)"), 
    ...Array(1).fill("Creeper: Watching people dance from a non-danceble corner (1 coin)"), 
    ...Array(1).fill("Barman:"),
];

// Goals for when the pary is over
const PartyGoalsDeck = [

    ...Array(1).fill("5 de Mayo: Most people should be Latin Fans and most music palyed should be Latin Music (30 coins)"), 
    ...Array(1).fill("Underground Rave: Most people should be Trance Fans and most music palyed should be Trance Music (30 coins)"), 
    ...Array(1).fill("Disco Fever: Most people should be Disco Fans and most music palyed should be Disco Music (30 coins)"), 
    ...Array(1).fill("Karaoke Vibes: Most people should be Pop Fans and most music palyed should be Pop Music (30 coins)"), 
    ...Array(1).fill("Mosh Pitt: Most people should be Rock Fans and most music palyed should be Rock Music (30 coins)"),
    ...Array(1).fill("Rap Battle: Most people should be Hip-Hop Fans and most music palyed should be Hip-Hop Music (30 coins)"),  
   
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
    roundCardDiv.textContent = `Fuckup: ${card}`;
    logList.innerHTML += `<li>Round FCKUP: ${card}</li>`;
});

// Grab Mini Mission
document.getElementById("mini-mission-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle([...minimissionsDeck]);
    const card = shuffledDeck[0];
    miniMissionDiv.textContent = `Mini Mission: ${card}`;
    logList.innerHTML += `<li>Mini Mission: ${card}</li>`;
});

// Grab Party Goal
document.getElementById("party-goals-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle([...PartyGoalsDeck]);
    const card = shuffledDeck[0];
    partyGoalDiv.textContent = `Party Goal: ${card}`;
    logList.innerHTML += `<li>Party Goal: ${card}</li>`;
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
