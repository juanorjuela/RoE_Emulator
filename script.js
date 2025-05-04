// Card Decks
let playerDeck = [

    ...Array(4).fill("🍕\n\nOrder Pizza"),
    ...Array(4).fill("🍻\n\nOrder Drinks"),
    ...Array(4).fill("🔊\n\nHire a new DJ Station"),
    ...Array(2).fill("🏃\n\nRush:\nYou got extra Dice. \nThis turn you move with 3 dice"),
    ...Array(2).fill("🏇\n\nFreedom: \nYou got an extra MOVE this round"),
    ...Array(4).fill("🛁\n\nAdd access to a new 🚾 "),
    ...Array(4).fill("🚪\n\nCome In:\nEveryone in the entrance moves inside"),
    ...Array(3).fill("🧽\n\nClean 🚾\nEveryone in the 🚾 must go elsewhere"),
    ...Array(8).fill("🥸\n\nInvite Random Guest from a genre of your choosing"),
    ...Array(3).fill("🎵\n\nPlay Music:\nRock\n\n3 Rockers arrive to the party and someone who hates rock music leaves"),
    ...Array(3).fill("🎵\n\nPlay Music:\nPop\n\n3 Poppers arrive to the party and someone who hates pop music leaves"),
    ...Array(3).fill("🎵\n\nPlay Music:\nLatin\n\n3 Rockers arrive to the party and someone who hates rock music leaves"),
    ...Array(3).fill("🎵\n\nPlay Music:\nRap\n\n3 Rappers arrive to the party and someone who hates rap music leaves"),
    ...Array(3).fill("🎵\n\nPlay Music:\nTechno\n\n3 Ravers arrive to the party and someone who hates techno music leaves"),
    ...Array(3).fill("🎵\n\nPlay Music:\nDisco\n\n3 Discoheads arrive to the party and someone who hates disco music leaves"),
    ...Array(2).fill("🎉\n\nThe DROP:\nYour party is so lit that you are able to cancel the effect of one FCKUP"),
];

const fuckupsDeck = [
    ...Array(6).fill("🎶 Change Music: Go to the dancefloor room and play any music card from your hand. If the music doesn't change now, 2 guests will leave the party."),
    ...Array(1).fill("🐈‍⬛ Unlucky: Draw 2 more FCKUP cards."),
    ...Array(1).fill("💤 Lazy Bastard: Discard 3 action cards from your hand. You can only play with 3 cards for the next round."),
    ...Array(1).fill("🥴 Too Much to Drink: You can only play 1 action per round for the next 1 round."),
    ...Array(1).fill("😵 Diarrhea: You need to rush immediately to the 🚾! All guests currently in the 🚾 leave the party."),
    ...Array(1).fill("💡 Power Outage: (Roll 🎲) guests leave the party."),
    ...Array(1).fill("🚑 Overdose: 2 guests leave with the ambulance."),
    ...Array(1).fill("🥊 Bar Fight: The noise triggers a neighbor complaint."),
    ...Array(1).fill("🔌 Unplugged System: Everyone leaves the dancefloor."),
    ...Array(1).fill("🌿 The Munchies: (Roll 🎲) guests head to the kitchen to eat."),
    ...Array(4).fill("🕺🏽 Night Fever: (Roll 🎲) guests head to the dancefloor."),
    ...Array(1).fill("🍹 Shots!: (Roll 🎲) guests head to the bar."),
    ...Array(1).fill("🚽 Pee Rush: (Roll 🎲) guests rush to the 🚾."),
    ...Array(1).fill("🤮 Hold My Hair: 2 guests rush to the 🚾."),
    ...Array(1).fill("🪠 EWWW: If you don't clean the 🚾, all guests needing the 🚾 will leave."),
    ...Array(1).fill("🧻 No TP: You forgot to put a new roll, one nasty ass guests leaves the party."),
    ...Array(3).fill("🤫 Neighbor Complaint - If you collect 3 neighbor complaints, the police shows up and 6 guests must leave the party."),
    ...Array(3).fill("🏺 Something broke: Find the guest responsible and kick it out of the party."),
    ...Array(1).fill("😈 Unwanted Graffiti: 3 guests are vandalizing the walls, kick them out!."),
    ...Array(1).fill("🚩 Red Flag: There are 2 idiots bullying random people, not cool, kick them out!."),

];


const minimissionsDeck = [
    ...Array(1).fill("🧚 Fairy Dusk: Visit the 🚾 and bring 2 guests with you (3 coins)"), 
    ...Array(1).fill("🛏️ Hooked: Be alone in a bedroom with another guest (3 coins)"), 
    ...Array(1).fill("🧑‍🍳 House Chef: Chill out in a full kitchen (5 coins)"), 
    ...Array(1).fill("🧳 Nomad: Visit 3 different rooms in a single turn (2 coins)"), 
    ...Array(1).fill("💃 Sweaty Dancefloor: Dance with 7 other guests on the dancefloor (2 coins)"), 
    ...Array(1).fill("🧑‍🤝‍🧑 Hook-Up: Meet someone alone in the corridor (3 coins)"), 
    ...Array(1).fill("🦠 Germophobe: Wash your hands, leave the 🚾, go back and wash again (2 coins)"), 
    ...Array(1).fill("💊 Get Enhancers: Catch a disco queen in the corner that has what you are looking(2 coins)"), 
    ...Array(1).fill("📚 Sophisto Prick: Suddenly feel like reading a book from the library (1 coin)"), 
    ...Array(1).fill("😴 Powernap: Take a quick break in the bedroom (1 coin)"), 
    ...Array(1).fill("🕵️ Creeper: Watch people dancing from a non-danceable corner (1 coin)"), 
    ...Array(1).fill("🍾 Barman: Serve drinks at a full drinking station (5 coins)"),
];

const PartyGoalsDeck = [
    ...Array(1).fill("5 de Mayo: Most guests should be Latin music fans and most songs played should be Latin (20 coins)"), 
    ...Array(1).fill("Underground Rave: Most guests should be Trance fans and most songs played should be Techno/Trance (20 coins)"), 
    ...Array(1).fill("Disco Fever: Most guests should be Disco fans and most songs played should be Disco (20 coins)"), 
    ...Array(1).fill("Karaoke Vibes: Most guests should be Pop fans and most songs played should be Pop (20 coins)"), 
    ...Array(1).fill("Mosh Pit: Most guests should be Rock fans and most songs played should be Rock (20 coins)"),
    ...Array(1).fill("Rap Battle: Most guests should be Hip-Hop fans and most songs played should be Hip-Hop (20 coins)"),  
    ...Array(1).fill("A Proper Mixer: Have 15 guests of each gernre at the end of the party (15 coins)"),  
    ...Array(1).fill("Hood Party Ese: Have a mayority Hip-Hop and Latin music fans at the end of the party (15 coins)"),
    ...Array(1).fill("Electro Clash: Have a mayority Techno and Rock music fans at the end of the party (15 coins)"),
    ...Array(1).fill("Disco Divas Night: Have a mayority Disco and Pop music fans at the end of the party (15 coins)"),
    ...Array(1).fill("Rage Against the Public Enemy: Have a mayority Rock and Hip-Hop music fans at the end of the party (15 coins)"),
    ...Array(1).fill("K-Pop night: Have a mayority Pop and Techno music fans at the end of the party (15 coins)"),
    ...Array(1).fill("Beer Fest: Have 3 or more drink stations running at the end of the party (10 coins)"),
    ...Array(1).fill("Disco Guards: Have a disco queen in every room at the end of the party (10 coins)"),   
    ...Array(1).fill("TikTok Dance Crew: Have a group of 6 poppers dancing at the end of the party (10 coins)"),  
];

/*const htmlOutput = playerDeck.join('<br><br>').replace(/\n/g, '<br>');
document.getElementById("player-cards").innerHTML = htmlOutput;*/

const playerHand = [];

// DOM Elements
const playerCardsDiv = document.getElementById("player-cards");
const roundCardDiv = document.getElementById("round-card");
const miniMissionDiv = document.getElementById("mini-mission");
const partyGoalDiv = document.getElementById("party-goal");
const diceResultsDiv = document.getElementById("dice-results");
const logList = document.getElementById("log-list");

// Shuffle Function
const shuffle = (deck) => {
    let shuffledDeck = [...deck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    return shuffledDeck;
};

// Paint Player Hand
const paintPlayerHand = () => {
    playerCardsDiv.innerHTML = "";
    playerHand.forEach((card, i) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.textContent = card;
        cardElement.addEventListener("click", () => {
            playerCardsDiv.removeChild(cardElement);
            playerHand.splice(i, 1);
            paintPlayerHand();
            console.log(playerHand);
        });
        playerCardsDiv.appendChild(cardElement);
    });
};

// Grab/Refill Action Cards
document.getElementById("grab-action-cards-btn").addEventListener("click", () => {
    if (!playerDeck.length) {
        logList.innerHTML += `<li>No more cards to select</li>`;
        return;
    }

    const handLength = playerHand.length;
    const missing = 6 - handLength;

    if (missing === 0) {
        return;
    }

    // Shuffle the player deck before drawing new cards
    playerDeck = shuffle(playerDeck);

    const selectedCards = [];
    for (let i = 0; i < missing; i++) {
        const poppedCard = playerDeck.pop();
        if (poppedCard) {
            selectedCards.push(poppedCard);
        }
    }
    playerHand.push(...selectedCards);

    paintPlayerHand();

    logList.innerHTML += `<li>Player selected: ${selectedCards.join(", ")}. Actions deck has now ${playerDeck.length} cards</li>`;

    console.log(playerHand);
});

// Grab Round Card
document.getElementById("round-card-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle(fuckupsDeck);
    const card = shuffledDeck[0];
    roundCardDiv.textContent = `FCKUP/ ${card}`;
    logList.innerHTML += `<li>FCKUP/ ${card}</li>`;
});

// Grab Mini Mission
/*
document.getElementById("mini-mission-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle(minimissionsDeck);
    const card = shuffledDeck[0];
    miniMissionDiv.textContent += `MINI MISSION/ ${card}`;
    logList.innerHTML += `<li>MINI MISSION/ ${card}</li>`;
});
*/

document.getElementById("mini-mission-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle(minimissionsDeck);
    const drawnCards = shuffledDeck.slice(0, 1); // Or however many you want

    const container = document.getElementById("mini-mission-container");

    drawnCards.forEach(card => {
        const newCardDiv = document.createElement("div");
        newCardDiv.className = "round-card";

        newCardDiv.innerHTML = `
            <span>MINI MISSION/ ${card}</span>
            <button class="resolve-btn">✔ Resolved</button>
        `;

        container.appendChild(newCardDiv);

        const resolveBtn = newCardDiv.querySelector(".resolve-btn");
        resolveBtn.addEventListener("click", () => {
            // Extract coin number from card text (e.g. "(3 coins)")
            const match = card.match(/\((\d+)\s*coins?\)/i);
            const coinCount = match ? parseInt(match[1], 10) : 1;

            // Replace with that many emojis
            newCardDiv.innerHTML = `💸`.repeat(coinCount);
        });

        logList.innerHTML += `<li>MINI MISSION/ ${card}</li>`;
    });

});

// Grab Party Goal
/*
document.getElementById("party-goals-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle(PartyGoalsDeck);
    const card = shuffledDeck[0];
    partyGoalDiv.textContent += `PARTY GOAL/ ${card}`;
    logList.innerHTML += `<li>PARTY GOAL/ ${card}</li>`;
});

*/
// Initialize a Set to keep track of drawn party goals
const drawnPartyGoals = new Set();

// Number of party goals to draw per click
const PARTY_GOAL_COUNT = 3;

document.getElementById("party-goals-btn").addEventListener("click", () => {
    const shuffledDeck = shuffle(PartyGoalsDeck);
    const container = document.getElementById("party-goal-container");
    let drawn = 0;

    for (let i = 0; i < shuffledDeck.length && drawn < PARTY_GOAL_COUNT; i++) {
        const card = shuffledDeck[i];
        if (!drawnPartyGoals.has(card)) {
            drawnPartyGoals.add(card);
            drawn++;

            const cardDiv = document.createElement("div");
            cardDiv.className = "round-card";

            // Extract coin count from the card text
            const match = card.match(/\((\d+)\s*coins?\)/i);
            const coinCount = match ? parseInt(match[1], 10) : 1;

            // Set the inner HTML of the card
            cardDiv.innerHTML = `
                <span>PARTY GOAL/ ${card}</span>
                <div class="card-buttons">
                    <button class="resolve-btn">✔ Resolved</button>
                    <button class="discard-btn">✖ Discard</button>
                </div>
            `;

            // Append the card to the container
            container.appendChild(cardDiv);

            // Add event listener for the "Resolve" button
            const resolveBtn = cardDiv.querySelector(".resolve-btn");
            resolveBtn.addEventListener("click", () => {
                cardDiv.innerHTML = `⭐`.repeat(coinCount);
                updateResolvedCount();
            });

            // Add event listener for the "Discard" button
            const discardBtn = cardDiv.querySelector(".discard-btn");
            discardBtn.addEventListener("click", () => {
                cardDiv.remove();
                drawnPartyGoals.delete(card);
                updateResolvedCount();
            });

            // Log the drawn card
            logList.innerHTML += `<li>PARTY GOAL/ ${card}</li>`;
        }
    }

    if (drawn < PARTY_GOAL_COUNT) {
        alert("No more unique party goals available.");
    }
});

// Function to update the count of resolved goals
function updateResolvedCount() {
    const container = document.getElementById("party-goal-container");
    const resolvedCards = container.querySelectorAll(".round-card");
    let resolvedCount = 0;

    resolvedCards.forEach(card => {
        if (!card.querySelector(".resolve-btn")) {
            resolvedCount++;
        }
    });

    // Display the resolved count
    document.getElementById("resolved-count").textContent = `Resolved Goals: ${resolvedCount}`;
}


/*
// Roll Dice
const rollDice = (diceId) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    document.getElementById(diceId).textContent = roll;
};

["roll-dice-1-btn", "roll-dice-2-btn"].forEach((btnId, idx) => {
    document.getElementById(btnId).addEventListener("click", () => {
        rollDice(dice-${idx + 1});
    });
});

*/
const dice = document.getElementById("dice");

dice.addEventListener("click", () => {
  // Trigger the dice roll animation
  dice.classList.add("roll");

  // Simulate a dice number after the roll (random from 1 to 6)
  setTimeout(() => {
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    dice.querySelector(".number").textContent = randomNumber;

    // Remove the 'roll' class to reset the animation
    dice.classList.remove("roll");
  }, 250); // Set the timeout duration to match the animation duration
});

const dice2 = document.getElementById("dice2");

dice2.addEventListener("click", () => {
  // Trigger the dice roll animation
  dice2.classList.add("roll");

  // Simulate a dice number after the roll (random from 1 to 6)
  setTimeout(() => {
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    dice2.querySelector(".number2").textContent = randomNumber;

    // Remove the 'roll' class to reset the animation
    dice2.classList.remove("roll");
  }, 250); // Set the timeout duration to match the animation duration
});

/*
// Reset Game
document.getElementById("reset-btn").addEventListener("click", () => {
    playerCardsDiv.innerHTML = "";
    roundCardDiv.textContent = "";
    diceResultsDiv.innerHTML = "";
    logList.innerHTML = "";
    logList.innerHTML += <li>Game reset!</li>;
});

function main() {
    // Add Dice Elements
    [1, 2].forEach((num) => {
        const diceDiv = document.createElement("div");
        diceDiv.className = "dice";
        diceDiv.id = dice-${num};
        diceResultsDiv.appendChild(diceDiv);
    });

    playerDeck = shuffle([...playerDeck]);
    logList.innerHTML += <li>Actions deck starts with ${playerDeck.length} cards</li>;
}

main();*/
