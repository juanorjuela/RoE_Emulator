// Import Firebase modules
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, updateDoc, arrayUnion, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import the bot class
import { RaveTycoonBot } from './bot.js';

// Import game constants
import { GAME_STATES, TURN_TIME, PLAYER_MESSAGES } from './constants.js';

// Import and initialize the board
import { Board } from './board.js';
let gameBoard;

// Game State Variables
let gameState = GAME_STATES.WAITING;
let currentTurnPlayer = null;
let turnTimer = null;
let remainingTime = TURN_TIME;
let playerOrder = [];

// Initialize Firebase services
let db;
let auth;

// Initialize Firebase services when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for Firebase to be initialized by the script in index.html
        while (!window.db || !window.auth) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Get the Firebase instances
        db = window.db;
        auth = window.auth;
        
        console.log("✅ Firebase services initialized in script.js");
        
        // Initialize the game
        await initializeGame();
    } catch (error) {
        console.error("❌ Error initializing Firebase services:", error);
    }
});

// Function to initialize the game
async function initializeGame() {
    try {
        // Initialize the game board only if it doesn't exist
        if (!window.gameBoard) {
            console.log("Creating new game board...");
            window.gameBoard = new Board();
        }

        // Wait for board to be fully initialized
        await new Promise((resolve, reject) => {
            const checkBoard = () => {
                if (window.gameBoard && 
                    window.gameBoard.container && 
                    window.gameBoard.gridContainer && 
                    window.gameBoard.piecesContainer) {
                    resolve();
                } else if (document.querySelector('.error-message')) {
                    reject(new Error('Board initialization failed'));
                } else {
                    setTimeout(checkBoard, 100);
                }
            };
            checkBoard();
        });
        
        // Initialize all other game components
        initializeDecks();
        
        // Hide game area initially
        document.querySelector('.game-area').classList.remove('visible');
        
        // Create and add timer container if it doesn't exist
        let timerContainer = document.querySelector('.timer-container');
        if (!timerContainer) {
            timerContainer = document.createElement('div');
            timerContainer.className = 'timer-container';
            timerContainer.innerHTML = '2:00';
            document.body.appendChild(timerContainer);
        }
        
        // Create and add finish turn button if it doesn't exist
        let finishTurnBtn = document.querySelector('.finish-turn-btn');
        if (!finishTurnBtn) {
            finishTurnBtn = document.createElement('button');
            finishTurnBtn.className = 'finish-turn-btn';
            finishTurnBtn.textContent = '✅ Finish Turn';
            finishTurnBtn.addEventListener('click', () => {
                if (currentTurnPlayer === currentPlayerId) {
                    endTurn();
                }
            });
            document.body.appendChild(finishTurnBtn);
        }
        
        // Create and add loading overlay if it doesn't exist
        let loadingOverlay = document.querySelector('.loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="dice-loading"></div>
                <div class="current-player-message"></div>
            `;
            document.body.appendChild(loadingOverlay);
        }
        
        // Verify Firebase setup
        const verificationResult = await verifyFirebaseSetup();
        if (!verificationResult) {
            // Disable room creation and joining if verification fails
            document.getElementById('create-room-btn').disabled = true;
            document.getElementById('join-room-btn').disabled = true;
            document.getElementById('room-info').innerHTML = `
                <div class="error-message">
                    ❌ Firebase setup verification failed. Please check the console for details.
                </div>
            `;
        }

        // Initialize game controls
        initializeGameControls();
    } catch (error) {
        console.error("❌ Error initializing game:", error);
        // Add error message to the page
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `❌ Error initializing game: ${error.message}`;
        document.querySelector('.container').prepend(errorDiv);
        throw error;
    }
}

// Card Decks
let playerDeck = [

    ...Array(3).fill("<div><h4>🍕<br> <br>Order Pizza</h4></div>"),
    ...Array(3).fill("<div><h4>🍻<br> <br>Order Drinks</h4></div>"),
    ...Array(2).fill("<div><h4>🔊<br> <br>Add a new dancefloor</h4></div>"),
    ...Array(2).fill("<div><h4>🚾<br> <br>Add a new Toilet </h4></div>"),

    ...Array(1).fill("<div><h4>🏃 Rush: </h4><br> <p>This turn you move with 3 dice<p/></div>"),

    ...Array(2).fill("<div><h4>🚪<br> Come In: <br>Everyone in the entrance moves inside</h4></div>"),
    ...Array(2).fill("<div><h4>🧽<br> Clean 🚾: <br>Everyone in the toilet must go elsewhere</h4></div>"),
    ...Array(4).fill("<div><h4>🥸<br> <br>Invite Random Guest from a genre of your choosing</h4></div>"),

    ...Array(3).fill("<div> <h4>🎵 Play Music:<br> <br>Rock<br></h4><p>3 Rockers arrive to the party and someone who hates rock music leaves</p></div>"),
    ...Array(3).fill("<div> <h4>🎵 Play Music:<br> <br>Pop<br></h4><p>3 Poppers arrive to the party and someone who hates pop music leaves</p></div>"),
    ...Array(3).fill("<div> <h4>🎵 Play Music:<br> <br>Latin<br></h4><p>3 Latinos arrive to the party and someone who hates latin music leaves</p></div>"),
    ...Array(3).fill("<div> <h4>🎵 Play Music:<br> <br>Rap<br></h4><p>3 Rappers arrive to the party and someone who hates rap music leaves</p></div>"),
    ...Array(3).fill("<div> <h4>🎵 Play Music:<br> <br>Techno<br></h4><p>3 Ravers arrive to the party and someone who hates techno music leaves</p></div>"),
    ...Array(3).fill("<div> <h4>🎵 Play Music:<br> <br>Disco<br></h4><p>3 Discoheads arrive to the party and someone who hates disco music leaves</p></div>"),

    ...Array(1).fill("<div><h4>🎉 The DROP:</h4><br><p>Your party is so lit that you are able to cancel the effect of one FCKUP</p></div>"),
];

const fuckupsDeck = [
    ...Array(6).fill("🎶 Change Music: <br> <br> Go to the dancefloor room and play any music card from your hand. <br> <br>If the music doesn't change now, 2 guests will leave the party."),
    ...Array(3).fill("🔇 Neighbor Complaint 🔇 <br><br> If you collect 3 neighbor complaints, the police shows up and 6 guests must leave the party."),

    ...Array(1).fill("🐈‍⬛ Unlucky: <br><br>Draw 2 more FCKUP cards."),

    //...Array(1).fill("💤 Lazy Bastard: Discard 3 action cards from your hand. You can only play with 3 cards for the next round."),
    //...Array(1).fill("🥴 Too Much to Drink: You can only play 1 action per round for the next 1 round."),

    ...Array(1).fill("🥊 Bar Fight: <br><br>The noise triggers a neighbor complaint."),

    ...Array(1).fill("😵 Diarrhea: <br><br>You need to rush immediately to the 🚾! All guests currently in the 🚾 leave the party."),

    ...Array(1).fill("🤮 Hold My Hair: <br><br>2 guests rush to the 🚾."),
    ...Array(1).fill("🪠 EWWW: If you don't clean the 🚾, all guests needing the 🚾 will leave until you clean it."),

    ...Array(1).fill("💡 Power Outage: <br><br>(Roll 🎲) guests leave the party."),

    ...Array(2).fill("🌿 The Munchies: <br><br>(Roll 🎲) guests head to the kitchen to eat."),
    ...Array(2).fill("🕺🏽 Night Fever: <br><br>(Roll 🎲) guests head to the dancefloor."),
    ...Array(2).fill("🍹 Shots!: <br><br>(Roll 🎲) guests head to the bar."),
    ...Array(2).fill("🚽 Pee Rush: <br><br>(Roll 🎲) guests rush to the 🚾."),

    ...Array(1).fill("🔌 Unplugged System: <br><br>Everyone leaves the dancefloor."),
    //...Array(1).fill("🧻 No TP: <br><br>You forgot to put a new roll, one nasty ass guests leaves the party."),

    ...Array(1).fill("🏺 Something broke: <br><br>Find the guest responsible and kick it out of the party."),
    ...Array(1).fill("😈 Unwanted Graffiti:<br><br> 2 guests are vandalizing the walls, kick them out!."),
    ...Array(1).fill("🚩 Red Flag:<br><br> There are 2 idiots bullying random people, not cool, kick them out!."),
    ...Array(1).fill("🚑 Overdose:<br><br> 1 guest leaves with the ambulance."),


];


const minimissionsDeck = [
    ...Array(1).fill("🧚 Fairy Dusk: <br><br>Visit the 🚾 and bring 2 guests with you <br> <br> (5 coins)"), 
    ...Array(1).fill("🛏️ Hooked: <br><br>Be alone in a bedroom with another guest <br> <br> (10 coins)"), 
    ...Array(1).fill("🧳 Nomad: <br><br>Visit 3 different rooms in a single turn <br> <br> (5 coins)"), 
    ...Array(1).fill("🧑‍🤝‍🧑 Hook-Up: <br><br>Meet someone alone in the corridor <br> <br> (5 coins)"), 
    ...Array(1).fill("🦠 Germophobe: <br><br>Wash your hands, leave the 🚾, go back and wash again <br> <br>  (5 coins)"), 
    ...Array(1).fill("💊 Get Enhancers: <br><br>Catch a disco queen in the corner of the room <br> <br>(5 coins)"), 

    ...Array(1).fill("📚 Sophisto Prick: <br><br>Suddenly feel like reading a book from the library <br> <br> (1 coin)"), 
    ...Array(1).fill("😴 Powernap: <br><br>Take a quick break in the bedroom <br> <br> (1 coin)"), 
    ...Array(1).fill("🕵️ Creeper: <br><br>Watch people dancing from a non-danceable corner <br> <br> (1 coin)"), 

    ...Array(1).fill("🍾 Barman: <br><br>Serve drinks at a full drinking station <br> <br> (10 coins)"),
    ...Array(1).fill("🧑‍🍳 House Chef: <br><br>Chill out in a full kitchen <br> <br> (10 coins)"), 
    ...Array(1).fill("💃 Sweaty Dancefloor: <br><br>Dance with 7 other guests on the dancefloor <br> <br> (10 coins)"), 

];

const PartyGoalsDeck = [
    ...Array(1).fill("5 de Mayo: <br>Most guests should be Latin music fans and most songs played should be Latin <br> <br>(20 coins)"), 
    ...Array(1).fill("Underground Rave:<br> Most guests should be Trance fans and most songs played should be Techno/Trance <br> <br>(20 coins)"), 
    ...Array(1).fill("Disco Fever: <br>Most guests should be Disco fans and most songs played should be Disco <br> <br> (20 coins)"), 
    ...Array(1).fill("Karaoke Vibes: <br>   Most guests should be Pop fans and most songs played should be Pop <br> <br>   (20 coins)"), 
    ...Array(1).fill("Mosh Pit: <br>    Most guests should be Rock fans and most songs played should be Rock <br> <br>  (20 coins)"),
    ...Array(1).fill("Rap Battle: <br>Most guests should be Hip-Hop fans and most songs played should be Hip-Hop <br> <br> (20 coins)"), 

    ...Array(1).fill("A Proper Mixer: <br>Have 8 or more guests of each gernre at the end of the party <br> <br> (20 coins)"),  

    ...Array(1).fill("Hood Party Ese: <br>Have a mayority Hip-Hop and Latin music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("Electro Clash: <br>Have a mayority Techno and Rock music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("Disco Divas Night: <br>Have a mayority Disco and Pop music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("Rage Against the Public Enemy: <br>Have a mayority Rock and Hip-Hop music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("K-Pop night: <br>Have a mayority Pop and Techno music fans at the end of the party <br> <br> (15 coins)"),

    ...Array(1).fill("Beer Fest: <br>Have 3 or more drink stations running at the end of the party <br> <br>    (10 coins)"),
    ...Array(1).fill("Disco Guards: <br>Have a disco queen in every room at the end of the party <br> <br> (10 coins)"),   
    ...Array(1).fill("TikTok Dance Crew: <br>Have a group of 6 poppers dancing together at the end of the party <br> <br> (10 coins)"),  
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

// Create the discard duplicates button
const discardDuplicatesBtn = document.createElement('button');
discardDuplicatesBtn.id = 'discard-duplicates-btn';
discardDuplicatesBtn.textContent = '🔄 Discard Duplicates';
discardDuplicatesBtn.style.display = 'none';

// Insert the button into the actions-section before the player-cards div
const actionsSection = document.querySelector('.actions-section');
actionsSection.insertBefore(discardDuplicatesBtn, document.getElementById('player-cards'));

// Function to find duplicate cards
const findDuplicateCards = () => {
    const cardCounts = {};
    let hasDuplicates = false;
    let duplicateSets = [];
    
    playerHand.forEach((card, index) => {
        if (cardCounts[card]) {
            cardCounts[card].count++;
            cardCounts[card].indices.push(index);
            hasDuplicates = true;
        } else {
            cardCounts[card] = { count: 1, indices: [index] };
        }
    });

    // Create array of duplicate sets
    Object.entries(cardCounts).forEach(([card, info]) => {
        if (info.count > 1) {
            duplicateSets.push({
                card: card,
                indices: info.indices,
                count: info.count
            });
        }
    });
    
    return { hasDuplicates, duplicateSets };
};

// Colors for different duplicate sets
const duplicateColors = [
    { border: '#FF4081', glow: '#FF4081', hover: '#F50057' },  // Pink
    { border: '#64B5F6', glow: '#64B5F6', hover: '#2196F3' },  // Blue
    { border: '#81C784', glow: '#81C784', hover: '#4CAF50' }   // Green
];

// Function to highlight duplicate cards
const highlightDuplicateCards = () => {
    const { hasDuplicates, duplicateSets } = findDuplicateCards();
    const cardElements = playerCardsDiv.querySelectorAll('.card');
    
    // Remove existing duplicate classes and buttons
    cardElements.forEach(card => {
        card.classList.remove('duplicate');
        card.style.borderColor = '';
        card.style.boxShadow = '';
    });
    
    const existingButtons = document.querySelectorAll('.duplicate-discard-btn');
    existingButtons.forEach(btn => btn.remove());

    if (hasDuplicates) {
        // Create container for discard buttons if it doesn't exist
        let btnContainer = document.querySelector('.duplicate-buttons-container');
        if (!btnContainer) {
            btnContainer = document.createElement('div');
            btnContainer.className = 'duplicate-buttons-container';
            actionsSection.insertBefore(btnContainer, document.getElementById('player-cards'));
        } else {
            btnContainer.innerHTML = ''; // Clear existing buttons
        }

        // Add buttons and highlight cards for each duplicate set
        duplicateSets.forEach((set, index) => {
            const color = duplicateColors[index % duplicateColors.length];
            
            // Create discard button for this set
            const discardBtn = document.createElement('button');
            discardBtn.className = 'duplicate-discard-btn';
            discardBtn.innerHTML = `🔄 Discard ${set.count} ${set.card.split('<')[0].trim()}`;
            discardBtn.style.backgroundColor = color.border;
            discardBtn.style.display = 'block';
            
            // Add hover effect
            discardBtn.addEventListener('mouseover', () => {
                discardBtn.style.backgroundColor = color.hover;
            });
            discardBtn.addEventListener('mouseout', () => {
                discardBtn.style.backgroundColor = color.border;
            });

            // Add click handler for this specific set
            discardBtn.addEventListener('click', () => removeDuplicateSet(set.indices));
            
            btnContainer.appendChild(discardBtn);

            // Highlight cards in this set
            set.indices.forEach(cardIndex => {
                const cardElement = cardElements[cardIndex];
                cardElement.classList.add('duplicate');
                cardElement.style.borderColor = color.border;
                cardElement.style.boxShadow = `0 0 10px ${color.glow}`;
            });
        });
    }
};

// Function to remove a specific set of duplicate cards
const removeDuplicateSet = async (indices) => {
    console.log(`Removing duplicate set with indices:`, indices);
    const cardElements = playerCardsDiv.querySelectorAll('.card');
    
    // Animate cards in this set
    indices.forEach(index => {
        const card = cardElements[index];
        if (card) {
            card.style.animation = 'cardRemoval 0.5s ease-in-out forwards';
        }
    });
    
    // Wait for animation to complete before removing cards
    setTimeout(async () => {
        try {
            // Collect cards to discard
            const cardsToDiscard = indices.map(index => playerHand[index]);
            console.log(`Discarding cards:`, cardsToDiscard);
            
            // Remove cards from playerHand (in reverse order to maintain correct indices)
            Array.from(indices)
                .sort((a, b) => b - a)
                .forEach(index => {
                    playerHand.splice(index, 1);
                });
            
            // Discard the cards to the shared discard pile
            await discardToSharedPile(cardsToDiscard);
            
            // Update the display
            paintPlayerHand();
            highlightDuplicateCards();
            
            logList.innerHTML += `<li>Removed ${indices.length} duplicate cards</li>`;
        } catch (error) {
            console.error("Error removing duplicate set:", error);
        }
    }, 500);
};

// Modify the paintPlayerHand function to respect disabled state
const paintPlayerHand = () => {
    console.log("Painting player hand");
    playerCardsDiv.innerHTML = "";
    playerHand.forEach((card, i) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.innerHTML = card;
        
        // Add click handler to each card
        cardElement.addEventListener("click", async () => {
            // Don't allow card play if it's not our turn
            if (currentTurnPlayer !== currentPlayerId || gameState !== GAME_STATES.STARTED) {
                console.log("Not your turn or game hasn't started");
                return;
            }

            console.log(`Card ${i} clicked`);
            try {
                const playedCard = playerHand.splice(i, 1)[0];
                console.log(`Playing card: ${playedCard}`);
                await discardToSharedPile([playedCard]);
                paintPlayerHand();
                logList.innerHTML += `<li>Played card: ${playedCard}</li>`;
            } catch (error) {
                console.error("Error playing card:", error);
                // Revert the splice if discard fails
                playerHand.splice(i, 0, card);
                paintPlayerHand();
            }
        });
        
        // Add disabled class if it's not our turn or game hasn't started
        if (currentTurnPlayer !== currentPlayerId || gameState !== GAME_STATES.STARTED) {
            cardElement.classList.add('disabled');
        }
        
        playerCardsDiv.appendChild(cardElement);
    });
    
    // Check for duplicates after painting the hand
    highlightDuplicateCards();
};

// Game Constants
const PARTY_GOAL_COUNT = 3;  // Number of party goals to draw per click

// Game State
let totalCoinsEarned = 0;
let totalFckupsResolved = 0;
let hasUnresolvedFckup = false;

// Deck States
let currentFckupDeck = [];
let discardedFckupCards = [];
let currentMiniMissionDeck = [];
let discardedMiniMissionCards = [];
let currentPartyGoalsDeck = [];
let discardedPartyGoalsCards = [];

// Initialize decks
const initializeDecks = () => {
    currentFckupDeck = shuffle([...fuckupsDeck]);
    discardedFckupCards = [];
    currentMiniMissionDeck = shuffle([...minimissionsDeck]);
    discardedMiniMissionCards = [];
    currentPartyGoalsDeck = shuffle([...PartyGoalsDeck]);
    discardedPartyGoalsCards = [];
    totalCoinsEarned = 0;
    totalFckupsResolved = 0;
    updateCoinsDisplay();
    updateFckupsDisplay();
    logList.innerHTML += `<li>FCKUP deck initialized with ${currentFckupDeck.length} cards</li>`;
    logList.innerHTML += `<li>Mini Mission deck initialized with ${currentMiniMissionDeck.length} cards</li>`;
    logList.innerHTML += `<li>Party Goals deck initialized with ${currentPartyGoalsDeck.length} cards</li>`;
};

// Reshuffle discarded cards back into deck
const reshuffleFckupDeck = () => {
    if (currentFckupDeck.length === 0 && discardedFckupCards.length > 0) {
        currentFckupDeck = shuffle([...discardedFckupCards]);
        discardedFckupCards = [];
        logList.innerHTML += `<li>FCKUP deck reshuffled with ${currentFckupDeck.length} cards</li>`;
    }
};

const reshuffleMiniMissionDeck = () => {
    if (currentMiniMissionDeck.length === 0 && discardedMiniMissionCards.length > 0) {
        currentMiniMissionDeck = shuffle([...discardedMiniMissionCards]);
        discardedMiniMissionCards = [];
        logList.innerHTML += `<li>Mini Mission deck reshuffled with ${currentMiniMissionDeck.length} cards</li>`;
    }
};

// Function to update the FCKUPS display
const updateFckupsDisplay = () => {
    const fckupsDisplay = document.getElementById("fckups-display");
    if (!fckupsDisplay) {
        const display = document.createElement("div");
        display.id = "fckups-display";
        display.className = "fckups-display";
        document.body.appendChild(display);
    }
    document.getElementById("fckups-display").innerHTML = `🚫 FCKUPS Resolved: ${totalFckupsResolved}`;
};

// Modify Round Card (FCKUP) drawing
document.getElementById("round-card-btn").addEventListener("click", async () => {
    // Don't allow drawing if there's an unresolved FCKUP
    if (hasUnresolvedFckup) {
        return;
    }

    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    // Draw a card from the shared fuckups deck
    const drawnCards = await drawFromDeck('fuckups', 1);
    
    if (drawnCards.length === 0) {
        logList.innerHTML += `<li>No more FCKUP cards available!</li>`;
        return;
    }
    
    const card = drawnCards[0];
    
    const newCardDiv = document.createElement("div");
    newCardDiv.className = "monopoly-card fckup-card";
    
    newCardDiv.innerHTML = `
        <div class="card-header">
            <h3>FCKUP</h3>
        </div>
        <div class="card-content">
            ${card}
        </div>
        <button class="resolve-btn">✔ Resolved</button>
    `;
    
    // Clear previous card and add new one
    roundCardDiv.innerHTML = '';
    roundCardDiv.appendChild(newCardDiv);

    // Set unresolved state and disable buttons
    hasUnresolvedFckup = true;
    document.getElementById("round-card-btn").disabled = true;
    document.getElementById("your-turn-btn").disabled = true;

    // Add resolve button functionality
    const resolveBtn = newCardDiv.querySelector(".resolve-btn");
    resolveBtn.addEventListener("click", async () => {
        totalFckupsResolved++;
        updateFckupsDisplay();
        newCardDiv.innerHTML = `<div class="resolved-state">✔ RESOLVED</div>`;
        logList.innerHTML += `<li>FCKUP resolved! (Total resolved: ${totalFckupsResolved})</li>`;
        
        // Reset unresolved state and enable buttons
        hasUnresolvedFckup = false;
        document.getElementById("round-card-btn").disabled = false;
        document.getElementById("your-turn-btn").disabled = false;
        
        // Discard the resolved card
        await discardToPile('fuckups', [card]);
    });
});

// Grab Mini Mission
document.getElementById("mini-mission-btn").addEventListener("click", async () => {
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    // Draw a card from the shared mini missions deck
    const drawnCards = await drawFromDeck('miniMissions', 1);
    
    if (drawnCards.length === 0) {
        logList.innerHTML += `<li>No more Mini Mission cards available!</li>`;
        return;
    }

    const card = drawnCards[0];
    
    const container = document.getElementById("mini-mission-container");
    const newCardDiv = document.createElement("div");
    newCardDiv.className = "round-card";

    newCardDiv.innerHTML = `
        <span><h3>MINI MISSION</h3><br><br> ${card}<br><br></span>
        <button class="resolve-btn">✔ Resolved</button>
    `;

    container.appendChild(newCardDiv);

    const resolveBtn = newCardDiv.querySelector(".resolve-btn");
    resolveBtn.addEventListener("click", async () => {
        const coinCount = extractCoinCount(card);
        totalCoinsEarned += coinCount;
        newCardDiv.innerHTML = `
            <div class="resolved-card">
                <h3>COMPLETED!</h3>
                <div class="coin-reward">
                    <span class="coin-icon">💰</span>
                    <span class="coin-amount">+${coinCount}</span>
                </div>
            </div>
        `;
        updateCoinsDisplay();
        logList.innerHTML += `<li>Earned ${coinCount} coins from Mini Mission!</li>`;
        
        // Discard the resolved card
        await discardToPile('miniMissions', [card]);
    });
});

// Party Goals
document.getElementById("party-goals-btn").addEventListener("click", async () => {
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    // Draw cards from the shared party goals deck
    const drawnCards = await drawFromDeck('partyGoals', PARTY_GOAL_COUNT);
    
    if (drawnCards.length === 0) {
        logList.innerHTML += `<li>No more Party Goals available!</li>`;
        return;
    }

    const container = document.getElementById("party-goal-container");
    
    for (const card of drawnCards) {
        const cardDiv = document.createElement("div");
        cardDiv.className = "round-card";

        // Extract coin count from the card text
        const coinCount = extractCoinCount(card);

        // Set the inner HTML of the card
        cardDiv.innerHTML = `
            <span><h3>PARTY GOAL</h3> <br> <br> ${card} <br> <br></span>
            <div class="card-buttons">
                <button class="resolve-btn">✔ Resolved</button>
                <button class="discard-btn">✖ Discard</button>
            </div>
        `;

        // Add event listener for the "Resolve" button
        const resolveBtn = cardDiv.querySelector(".resolve-btn");
        resolveBtn.addEventListener("click", async () => {
            totalCoinsEarned += coinCount;
            cardDiv.innerHTML = `
                <div class="resolved-card">
                    <h3>GOAL ACHIEVED!</h3>
                    <div class="coin-reward">
                        <span class="coin-icon">💰</span>
                        <span class="coin-amount">+${coinCount}</span>
                    </div>
                </div>
            `;
            updateCoinsDisplay();
            logList.innerHTML += `<li>Earned ${coinCount} coins from Party Goal!</li>`;
            
            // Discard the resolved card
            await discardToPile('partyGoals', [card]);
        });

        // Add event listener for the "Discard" button
        const discardBtn = cardDiv.querySelector(".discard-btn");
        discardBtn.addEventListener("click", async () => {
            cardDiv.remove();
            
            // Discard the card
            await discardToPile('partyGoals', [card]);
        });

        container.appendChild(cardDiv);
    }

    if (drawnCards.length < PARTY_GOAL_COUNT) {
        logList.innerHTML += `<li>Warning: Only ${drawnCards.length} Party Goals remaining!</li>`;
    }
});

// Function to extract coin count from card text
const extractCoinCount = (cardText) => {
    const match = cardText.match(/\((\d+)\s*coins?\)/i);
    return match ? parseInt(match[1], 10) : 1;
};

// Function to update the coins display
const updateCoinsDisplay = () => {
    const coinsDisplay = document.getElementById("coins-display");
    if (!coinsDisplay) {
        const display = document.createElement("div");
        display.id = "coins-display";
        display.className = "coins-display";
        document.body.appendChild(display);
    }
    document.getElementById("coins-display").innerHTML = `💰 Total Coins: ${totalCoinsEarned}`;
    logList.innerHTML += `<li>Coins updated: ${totalCoinsEarned} total</li>`;
};

// Dice state management
const dice1 = document.getElementById("dice");
const dice2 = document.getElementById("dice2");

// Function to update dice UI with animation
const updateDiceUI = (diceElement, value, isSecondDice = false) => {
    diceElement.classList.add("roll");
    
    setTimeout(() => {
        diceElement.querySelector(isSecondDice ? ".number2" : ".number").textContent = value;
        diceElement.classList.remove("roll");
    }, 250);
};

// Function to update dice values in Firestore
async function updateDiceInRoom(dice1Value, dice2Value) {
    if (!currentRoomId) return;
    
    try {
        const roomRef = doc(db, "rooms", currentRoomId);
        await updateDoc(roomRef, {
            dice: {
                dice1: dice1Value,
                dice2: dice2Value,
                lastRolled: Date.now(),
                rolledBy: currentPlayerId
            }
        });
    } catch (error) {
        console.error("Error updating dice:", error);
    }
}

// Function to handle dice roll
const rollDice = async () => {
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    const dice1Value = Math.floor(Math.random() * 6) + 1;
    const dice2Value = Math.floor(Math.random() * 6) + 1;
    
    // Update Firestore with new dice values
    await updateDiceInRoom(dice1Value, dice2Value);
};

// Listen to dice changes in the room
function listenToDiceChanges(roomId) {
    const roomRef = doc(db, "rooms", roomId);
    return onSnapshot(roomRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.dice) {
            // Update dice UI
            updateDiceUI(dice1, data.dice.dice1);
            updateDiceUI(dice2, data.dice.dice2, true);
            
            // Log the roll
            const total = data.dice.dice1 + data.dice.dice2;
            logList.innerHTML += `<li>${data.dice.rolledBy} rolled: ${data.dice.dice1} + ${data.dice.dice2} = ${total}</li>`;
        }
    });
}

// Update dice click handlers
dice1.addEventListener("click", rollDice);
dice2.addEventListener("click", rollDice);

// Create and add YOUR TURN button
const yourTurnBtn = document.createElement('button');
yourTurnBtn.id = 'your-turn-btn';
yourTurnBtn.textContent = '🎲 YOUR TURN 🎲';

// Insert the button at the top of the page
document.querySelector('.container').insertBefore(
    yourTurnBtn,
    document.querySelector('.container').firstChild
);

// Function to simulate clicking the dice
const simulateDiceRolls = async () => {
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }
    
    await rollDice();
};

// Function to perform all turn actions
const performTurnActions = async () => {
    // Don't proceed if there's an unresolved FCKUP
    if (hasUnresolvedFckup) {
        return;
    }
    
    // Disable the YOUR TURN button temporarily
    yourTurnBtn.disabled = true;
    
    // 1. Fill up action cards
    document.getElementById("grab-action-cards-btn").click();
    
    // Small delay between actions for better visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 2. Grab mini mission if not disabled
    const miniMissionBtn = document.getElementById("mini-mission-btn");
    if (!miniMissionBtn.disabled) {
        miniMissionBtn.click();
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 3. Grab FCKUP if not disabled
    const fckupBtn = document.getElementById("round-card-btn");
    if (!fckupBtn.disabled && !hasUnresolvedFckup) {
        fckupBtn.click();
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 4. Roll the dice
    simulateDiceRolls();
    
    // Re-enable the YOUR TURN button only if there's no unresolved FCKUP
    setTimeout(() => {
        yourTurnBtn.disabled = hasUnresolvedFckup;
    }, 500);
};

// Add click event listener to YOUR TURN button
yourTurnBtn.addEventListener('click', performTurnActions);

// Multiplayer Lobby Logic
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const playerNameInput = document.getElementById("player-name");
const roomIdInput = document.getElementById("room-id");
const roomInfoDiv = document.getElementById("room-info");

let currentRoomId = null;
let currentPlayerId = null;

// Generate random room code
const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Initialize authentication
async function initializeAuth() {
    try {
        // Check if auth is initialized
        if (!auth) {
            console.error("❌ Auth not initialized");
            return false;
        }

        // Check if we're already signed in
        if (auth.currentUser) {
            console.log("✅ Already signed in:", auth.currentUser.uid);
            return true;
        }

        // Try to sign in anonymously with retries
        let retries = 3;
        while (retries > 0) {
            try {
                const userCredential = await signInAnonymously(auth);
                console.log("✅ Signed in anonymously:", userCredential.user.uid);
                
                // Wait a short moment to ensure the auth state is fully propagated
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                return true;
            } catch (error) {
                console.warn(`Authentication attempt failed (${retries} retries left):`, error);
                if (error.code === 'auth/configuration-not-found') {
                    console.error("Please enable Anonymous Authentication in Firebase Console");
                    alert("Anonymous Authentication is not enabled. Please contact the administrator.");
                    return false;
                }
                retries--;
                if (retries === 0) {
                    console.error("❌ All authentication attempts failed");
                    return false;
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        return false;
    } catch (error) {
        console.error("❌ Authentication error:", error);
        return false;
    }
}

// Initialize shared deck in room
async function initializeSharedDeck(roomId) {
    try {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
            throw new Error("Room not found");
        }

        const roomData = roomSnap.data();
        
        // Initialize all decks and dice if they don't exist
        if (!roomData.decks) {
            // Use a transaction to handle concurrent initialization
            await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                if (!roomDoc.exists()) {
                    throw new Error("Room not found during transaction");
                }
                
                const currentData = roomDoc.data();
                if (currentData.decks) {
                    // Another client already initialized the decks
                    return;
                }
                
                // Initialize all decks in a single transaction
                transaction.update(roomRef, {
                    decks: {
                        actions: {
                            deck: shuffle([...playerDeck]),
                            discardPile: []
                        },
                        fuckups: {
                            deck: shuffle([...fuckupsDeck]),
                            discardPile: []
                        },
                        miniMissions: {
                            deck: shuffle([...minimissionsDeck]),
                            discardPile: []
                        },
                        partyGoals: {
                            deck: shuffle([...PartyGoalsDeck]),
                            discardPile: []
                        }
                    },
                    dice: {
                        dice1: 1,
                        dice2: 1,
                        lastRolled: Date.now(),
                        rolledBy: "Game Start"
                    },
                    lastUpdated: Date.now()
                });
            });
            
            console.log("✅ All shared decks and dice initialized");
            return true;
        } else {
            console.log("ℹ️ Decks already exist");
            return true;
        }
    } catch (error) {
        console.error("❌ Error initializing shared components:", error);
        return false;
    }
}

// Listen to deck changes
function listenToDeckChanges(roomId) {
    const roomRef = doc(db, "rooms", roomId);
    return onSnapshot(roomRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.decks) {
            const actionsDeck = data.decks.actions;
            if (actionsDeck) {
                const deckSize = actionsDeck.deck ? actionsDeck.deck.length : 0;
                const discardSize = actionsDeck.discardPile ? actionsDeck.discardPile.length : 0;
                logList.innerHTML += `<li>Deck status: ${deckSize} cards in deck, ${discardSize} in discard</li>`;
            }
        }
    }, (error) => {
        console.error("Error listening to deck changes:", error);
    });
}

// Add a delay between operations to prevent rapid-fire updates
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generic function to draw cards from any deck with retry mechanism
async function drawFromDeck(deckType, count, retryCount = 3) {
    if (!currentRoomId) {
        console.error("❌ Not in a room");
        return [];
    }

    // Add a small delay to prevent rapid-fire updates
    await delay(300);

    while (retryCount > 0) {
        try {
            const roomRef = doc(db, "rooms", currentRoomId);
            console.log(`Attempting to draw ${count} cards from ${deckType} deck (retry ${4 - retryCount}/3)`);
            
            const result = await runTransaction(db, async (transaction) => {
                const roomDoc = await transaction.get(roomRef);
                
                if (!roomDoc.exists()) {
                    throw new Error("Room not found");
                }
                
                const roomData = roomDoc.data();
                if (!roomData.decks || !roomData.decks[deckType]) {
                    console.error(`❌ Deck ${deckType} not found in room data:`, roomData);
                    return { cards: [], remainingDeck: [] };
                }

                const currentDeck = roomData.decks[deckType];
                
                if (!currentDeck || !currentDeck.deck) {
                    console.error(`❌ Invalid deck structure for ${deckType}`);
                    return { cards: [], remainingDeck: [] };
                }
                
                let deckToUse = [...currentDeck.deck];
                
                if (deckToUse.length === 0 && currentDeck.discardPile && currentDeck.discardPile.length > 0) {
                    deckToUse = shuffle([...currentDeck.discardPile]);
                    
                    // Update deck and clear discard pile in one transaction
                    transaction.update(roomRef, {
                        [`decks.${deckType}.deck`]: deckToUse,
                        [`decks.${deckType}.discardPile`]: []
                    });
                }

                if (deckToUse.length === 0) {
                    return { cards: [], remainingDeck: [] };
                }

                const cardsToDrawCount = Math.min(count, deckToUse.length);
                const drawnCards = deckToUse.slice(0, cardsToDrawCount);
                const remainingDeck = deckToUse.slice(cardsToDrawCount);

                // Update only the deck array
                transaction.update(roomRef, {
                    [`decks.${deckType}.deck`]: remainingDeck
                });

                return { cards: drawnCards, remainingDeck };
            });

            return result.cards;
        } catch (error) {
            console.error(`❌ Error drawing cards from ${deckType} (attempt ${4 - retryCount}/3):`, error);
            retryCount--;
            if (retryCount === 0) {
                console.error(`❌ All retry attempts failed for ${deckType}`);
                return [];
            }
            // Increased wait time between retries
            await delay(500);
        }
    }
    return [];
}

// Generic function to discard cards with retry mechanism
async function discardToPile(deckType, cards, retryCount = 3) {
    if (!currentRoomId || !cards.length) return;

    while (retryCount > 0) {
        try {
            const roomRef = doc(db, "rooms", currentRoomId);
            console.log(`Attempting to discard ${cards.length} cards to ${deckType} (retry ${4 - retryCount}/3)`);
            
            // Get current state first
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) {
                throw new Error("Room not found");
            }

            const roomData = roomDoc.data();
            const currentDiscardPile = roomData.decks?.[deckType]?.discardPile || [];
            
            // Update with new cards
            await updateDoc(roomRef, {
                [`decks.${deckType}.discardPile`]: [...currentDiscardPile, ...cards]
            });
            
            logList.innerHTML += `<li>Discarded ${cards.length} cards to ${deckType} pile</li>`;
            return;
        } catch (error) {
            console.error(`❌ Error discarding cards to ${deckType} (attempt ${4 - retryCount}/3):`, error);
            retryCount--;
            if (retryCount === 0) {
                console.error(`❌ All retry attempts failed for ${deckType}`);
                return;
            }
            // Wait before retrying
            await delay(1000);
        }
    }
}

// Update the grab-action-cards-btn click handler
document.addEventListener('DOMContentLoaded', () => {
    const grabActionCardsBtn = document.getElementById("grab-action-cards-btn");
    if (!grabActionCardsBtn) {
        console.error("❌ Could not find grab-action-cards-btn");
        return;
    }

    grabActionCardsBtn.addEventListener("click", async () => {
        console.log("Grab action cards button clicked");
        
        if (!currentRoomId) {
            alert("Please join a room first!");
            return;
        }

        const handLength = playerHand.length;
        const missing = 6 - handLength;
        console.log(`Current hand size: ${handLength}, need to draw: ${missing}`);

        if (missing <= 0) {
            console.log("Hand is already full");
            return;
        }
        
        const drawnCards = await drawFromSharedDeck(missing);
        console.log(`Drew ${drawnCards.length} cards:`, drawnCards);
        
        if (drawnCards.length > 0) {
            playerHand.push(...drawnCards);
            paintPlayerHand();
            console.log(`Updated hand size: ${playerHand.length}`);
        } else {
            alert("No cards available to draw!");
        }
    });
});

// Update drawFromSharedDeck to use the generic function
async function drawFromSharedDeck(count) {
    console.log(`Attempting to draw ${count} cards from shared deck`);
    return drawFromDeck('actions', count);
}

// Add back the discardToSharedPile function
async function discardToSharedPile(cards) {
    console.log(`Discarding ${cards.length} cards to shared pile`);
    return discardToPile('actions', cards);
}

// Bot Management
let botCount = 0;
const MAX_BOTS = 3;
let activeBots = new Map();

// Show host controls only to the room creator
const showHostControls = (isHost) => {
    const hostControls = document.querySelector('.host-controls');
    if (hostControls) {
        hostControls.style.display = isHost ? 'flex' : 'none';
        hostControls.classList.toggle('visible', isHost);
        
        // Explicitly show/hide start game button
        const startGameBtn = hostControls.querySelector('.start-game-btn');
        if (startGameBtn) {
            startGameBtn.style.display = isHost ? 'block' : 'none';
        }
    }
};

// Update createRoomBtn click handler
createRoomBtn.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    if (!name) {
        alert("Please enter your player name");
        return;
    }

    try {
        // Ensure authentication
        const authSuccess = await initializeAuth();
        if (!authSuccess) {
            alert("Failed to authenticate. Please try again.");
            return;
        }

        // Double check we're authenticated
        if (!auth.currentUser) {
            alert("Authentication state is invalid. Please refresh the page and try again.");
            return;
        }

        // Generate room code and create room document
        const roomCode = generateRoomCode();
        const roomRef = doc(db, "rooms", roomCode);
        
        // Create room with retries
        let retries = 3;
        while (retries > 0) {
            try {
                await setDoc(roomRef, {
                    status: "waiting",
                    gameState: GAME_STATES.WAITING,
                    createdAt: Date.now(),
                    hostId: auth.currentUser.uid,
                    players: [name],
                    lastUpdated: Date.now()
                });

                currentRoomId = roomCode;
                currentPlayerId = name;

                // Show game area and host controls
                document.querySelector('.game-area').classList.add('visible');
                showHostControls(true);
                
                showRoomInfo(roomCode);
                listenToPlayers(roomCode);
                listenToDiceChanges(roomCode);
                listenToGameState(roomCode);
                
                console.log("✅ Room created successfully:", roomCode);
                await initializeSharedDeck(roomCode);
                listenToDeckChanges(roomCode);
                return;
            } catch (error) {
                console.warn(`Room creation attempt failed (${retries} retries left):`, error);
                retries--;
                if (retries === 0) {
                    throw error;
                }
                await delay(1000);
            }
        }
    } catch (error) {
        console.error("❌ Error creating room:", error);
        alert("Failed to create room. Please try again.");
    }
});

// Update joinRoom function
async function joinRoom(roomCode, playerName) {
    try {
        const roomRef = doc(db, "rooms", roomCode);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
            alert("Room not found. Please check the room code.");
            return;
        }

        const roomData = roomSnap.data();
        
        // Don't allow joining if game has already started
        if (roomData.gameState === GAME_STATES.STARTED) {
            alert("This game has already started. Please join a different room.");
            return;
        }

        // Get current players and add new player
        const updatedPlayers = [...(roomData.players || []), playerName];
        
        // Update room with new player
        await setDoc(roomRef, {
            players: updatedPlayers,
            playerOrder: updatedPlayers,
            lastUpdated: Date.now()
        }, { merge: true });

        currentRoomId = roomCode;
        currentPlayerId = playerName;
        
        // Update local player order
        playerOrder = updatedPlayers;

        // Show game area and host controls if host
        document.querySelector('.game-area').classList.add('visible');
        showHostControls(roomData.hostId === auth.currentUser.uid);
        
        // Initialize game state
        updateGameAreaState();
        
        showRoomInfo(roomCode);
        listenToPlayers(roomCode);
        listenToDiceChanges(roomCode);
        listenToGameState(roomCode);
        
        console.log("✅ Joined room successfully:", roomCode);
        await initializeSharedDeck(roomCode);
        listenToDeckChanges(roomCode);
    } catch (error) {
        console.error("❌ Error joining room:", error);
        alert("Failed to join room. Please try again.");
    }
}

// Add bot button click handler
document.getElementById("add-bot-btn").addEventListener("click", async () => {
    if (!currentRoomId || botCount >= MAX_BOTS) return;

    const bot = new RaveTycoonBot(currentRoomId);
    const success = await bot.join();
    
    if (success) {
        botCount++;
        activeBots.set(bot.botName, bot);
        
        // Update button text
        const addBotBtn = document.getElementById("add-bot-btn");
        addBotBtn.textContent = `ADD BOT (${botCount}/3)`;
        
        // Disable button if max bots reached
        if (botCount >= MAX_BOTS) {
            addBotBtn.disabled = true;
        }
    }
});

// Clean up bots when leaving room
const cleanupBots = () => {
    activeBots.forEach(bot => bot.disconnect());
    activeBots.clear();
    botCount = 0;
    const addBotBtn = document.getElementById("add-bot-btn");
    if (addBotBtn) {
        addBotBtn.textContent = `ADD BOT (0/3)`;
        addBotBtn.disabled = false;
    }
};

// Update room leaving logic
window.addEventListener("beforeunload", () => {
    cleanupBots();
});

// Listen for player list changes with error handling
function listenToPlayers(roomCode) {
    if (!roomCode) {
        console.warn("No room code provided to listenToPlayers");
        return;
    }

    try {
        const roomRef = doc(db, "rooms", roomCode);
        const unsubscribe = onSnapshot(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                const players = data.players || [];
                roomInfoDiv.innerHTML = `
                    <div class="room-info">
                        <h3>Room: ${roomCode}</h3>
                        <h4>Players:</h4>
                        <ul>
                            ${players.map(player => `<li>${player}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
        }, (error) => {
            console.error("Error listening to players:", error);
        });

        // Store unsubscribe function for cleanup
        window.currentRoomListener = unsubscribe;
    } catch (error) {
        console.error("Error setting up player listener:", error);
    }
}

// Firebase Configuration Verification
async function verifyFirebaseSetup() {
    console.log("🔍 Verifying Firebase setup...");
    
    // Check if Firebase is initialized
    if (!window.db || !window.auth) {
        console.error("❌ Firebase is not properly initialized");
        alert("Firebase initialization failed. Please check your configuration.");
        return false;
    }

    // Test authentication
    try {
        const authResult = await initializeAuth();
        if (!authResult) {
            console.error("❌ Firebase Authentication test failed");
            alert("Firebase Authentication is not properly configured. Please check your Firebase Console settings.");
            return false;
        }
    } catch (error) {
        console.error("❌ Authentication test error:", error);
        alert("Failed to test Firebase Authentication. Error: " + error.message);
        return false;
    }

    // Test Firestore access
    try {
        const testRoomId = `test_${Math.random().toString(36).substring(2, 7)}`;
        const testRef = doc(db, "rooms", testRoomId);
        
        // Try to write
        await setDoc(testRef, { test: true });
        
        // Try to read
        const docSnap = await getDoc(testRef);
        if (!docSnap.exists()) {
            throw new Error("Test document not found after writing");
        }
        
        // Clean up test document
        await deleteDoc(testRef);
        
        console.log("✅ Firestore read/write test successful");
    } catch (error) {
        console.error("❌ Firestore test error:", error);
        alert("Failed to access Firestore. Please check your Firebase Console and security rules. Error: " + error.message);
        return false;
    }

    console.log("✅ Firebase setup verification completed successfully");
    return true;
}

// Run verification when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const verificationResult = await verifyFirebaseSetup();
    if (!verificationResult) {
        // Disable room creation and joining if verification fails
        createRoomBtn.disabled = true;
        joinRoomBtn.disabled = true;
        roomInfoDiv.innerHTML = `
            <div class="error-message">
                ❌ Firebase setup verification failed. Please check the console for details.
            </div>
        `;
    }
});

// Timer Management Functions
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    const timerContainer = document.querySelector('.timer-container');
    const finishTurnBtn = document.querySelector('.finish-turn-btn');
    
    if (!timerContainer || !finishTurnBtn) {
        console.error('Timer container or finish turn button not found');
        return;
    }
    
    timerContainer.classList.add('active');
    finishTurnBtn.classList.add('visible');
    
    remainingTime = TURN_TIME;
    updateTimerDisplay();
    
    clearInterval(turnTimer);
    turnTimer = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        // Warning when 30 seconds or less remain
        if (remainingTime <= 30) {
            timerContainer.classList.add('warning');
        }
        
        if (remainingTime <= 0) {
            endTurn();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerContainer = document.querySelector('.timer-container');
    if (!timerContainer) {
        console.error('Timer container not found');
        return;
    }
    timerContainer.innerHTML = formatTime(remainingTime);
}

// Function to end turn
async function endTurn() {
    console.log("Attempting to end turn...");
    if (!currentRoomId || currentTurnPlayer !== currentPlayerId) {
        console.log("Cannot end turn - not current player's turn");
        return;
    }

    // Clear the turn timer
    clearInterval(turnTimer);
    
    // Update UI elements
    const timerContainer = document.querySelector('.timer-container');
    const finishTurnBtn = document.querySelector('.finish-turn-btn');
    
    if (timerContainer) timerContainer.style.display = 'none';
    if (finishTurnBtn) {
        finishTurnBtn.style.display = 'none';
        finishTurnBtn.classList.remove('visible');
    }

    // Get the next player
    const roomRef = doc(db, "rooms", currentRoomId);
    const roomDoc = await getDoc(roomRef);
    const roomData = roomDoc.data();
    
    if (!roomData) {
        console.error("Room data not found");
        return;
    }

    const currentPlayerIndex = playerOrder.indexOf(currentTurnPlayer);
    const nextPlayerIndex = (currentPlayerIndex + 1) % playerOrder.length;
    const nextPlayer = playerOrder[nextPlayerIndex];

    // Update the turn in the room
    await updateTurnInRoom(nextPlayer);
    
    // Reset remaining time for next turn
    remainingTime = TURN_TIME;
    
    console.log(`Turn ended. Next player: ${nextPlayer}`);
}

// Function to show/hide finish turn button based on current player
function updateFinishTurnButton() {
    const finishTurnBtn = document.querySelector('.finish-turn-btn');
    if (!finishTurnBtn) return;

    if (currentTurnPlayer === currentPlayerId) {
        finishTurnBtn.style.display = 'block';
        finishTurnBtn.classList.add('visible');
        finishTurnBtn.disabled = false;
    } else {
        finishTurnBtn.style.display = 'none';
        finishTurnBtn.classList.remove('visible');
        finishTurnBtn.disabled = true;
    }
}

// Add this to the game state listener
function listenToGameState(roomId) {
    const roomRef = doc(db, "rooms", roomId);
    
    return onSnapshot(roomRef, (snapshot) => {
        if (!snapshot.exists()) return;
        
        const data = snapshot.data();
        if (!data) return;
        
        // Update current turn player
        currentTurnPlayer = data.currentTurn;
        
        // Update player order if it exists
        if (data.playerOrder) {
            playerOrder = data.playerOrder;
        }
        
        // Update UI elements
        updateFinishTurnButton();
        updateGameAreaState();
        
        // Start timer if it's the current player's turn
        if (currentTurnPlayer === currentPlayerId) {
            startTimer();
        }
        
        // Update room info display
        const roomInfo = document.getElementById('room-info');
        if (roomInfo) {
            roomInfo.innerHTML = `
                <div class="room-info">
                    <p>Room Code: ${roomId}</p>
                    <p>Current Turn: ${data.players[currentTurnPlayer]?.name || 'Unknown'}</p>
                    <p>Players: ${Object.values(data.players).map(p => p.name).join(', ')}</p>
                </div>
            `;
        }
        
        // Update player list
        updatePlayerList(data.players, currentTurnPlayer);
    });
}

// Add this to the game initialization
function initializeGameControls() {
    const finishTurnBtn = document.querySelector('.finish-turn-btn');
    if (finishTurnBtn) {
        finishTurnBtn.addEventListener('click', () => {
            if (currentTurnPlayer === currentPlayerId) {
                endTurn();
            }
        });
    }
}

// Update player list with current turn indicator
function updatePlayerList(players, currentTurn) {
    const playerList = players.map(player => 
        `<li class="${player === currentTurn ? 'current-turn' : ''}">${player}${player === currentTurn ? ' (Current Turn)' : ''}</li>`
    ).join('');
    
    const roomInfo = document.querySelector('.room-info');
    if (roomInfo) {
        roomInfo.innerHTML = `
            <h3>Room: ${currentRoomId}</h3>
            <h4>Players:</h4>
            <ul>${playerList}</ul>
        `;
    }
}

// Function to get a random player message
function getRandomPlayerMessage() {
    return PLAYER_MESSAGES[Math.floor(Math.random() * PLAYER_MESSAGES.length)];
}

// Function to update game area state
function updateGameAreaState() {
    const gameArea = document.querySelector('.game-area');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const currentPlayerMessage = document.querySelector('.current-player-message');
    const finishTurnBtn = document.querySelector('.finish-turn-btn');
    const grabActionCardsBtn = document.getElementById("grab-action-cards-btn");
    const roundCardBtn = document.getElementById("round-card-btn");
    const miniMissionBtn = document.getElementById("mini-mission-btn");
    
    if (!gameArea) {
        console.error("Game area not found");
        return;
    }

    // Always show the game area when game has started
    if (gameState === GAME_STATES.STARTED) {
        gameArea.classList.add('visible');
        gameArea.style.display = 'block';

        // Show finish turn button only during player's turn
        if (finishTurnBtn) {
            if (currentTurnPlayer === currentPlayerId) {
                finishTurnBtn.style.display = 'block';
                finishTurnBtn.classList.add('visible');
                console.log("Showing finish turn button");
            } else {
                finishTurnBtn.style.display = 'none';
                finishTurnBtn.classList.remove('visible');
                console.log("Hiding finish turn button");
            }
        }

        // Enable/disable action buttons based on turn
        const isPlayerTurn = currentTurnPlayer === currentPlayerId;
        if (grabActionCardsBtn) grabActionCardsBtn.disabled = !isPlayerTurn;
        if (roundCardBtn) roundCardBtn.disabled = !isPlayerTurn;
        if (miniMissionBtn) miniMissionBtn.disabled = !isPlayerTurn;

    } else {
        gameArea.classList.remove('visible');
        gameArea.style.display = 'none';
        if (finishTurnBtn) {
            finishTurnBtn.style.display = 'none';
            finishTurnBtn.classList.remove('visible');
        }
    }
}

// Add CSS styles for disabled cards
const style = document.createElement('style');
style.textContent = `
    .card.disabled {
        opacity: 0.6;
        pointer-events: none;
        cursor: not-allowed;
    }
    .game-area.disabled {
        opacity: 0.8;
        pointer-events: none;
    }
    .game-area.disabled .card {
        pointer-events: none;
        cursor: not-allowed;
    }
    .loading-overlay {
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }
    .loading-overlay.visible {
        opacity: 1;
        pointer-events: auto;
    }
    .current-player-message {
        color: white;
        font-size: 24px;
        margin-top: 20px;
        text-align: center;
        padding: 20px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.5);
    }
`;
document.head.appendChild(style);

// Join room button event listener
joinRoomBtn.addEventListener("click", async () => {
    const name = playerNameInput.value.trim();
    const roomCode = roomIdInput.value.trim().toUpperCase();
    
    if (!name || !roomCode) {
        alert("Please enter both your name and the room code");
        return;
    }

    try {
        // Ensure authentication
        const authSuccess = await initializeAuth();
        if (!authSuccess) {
            alert("Failed to authenticate. Please try again.");
            return;
        }

        // Double check we're authenticated
        if (!auth.currentUser) {
            alert("Authentication state is invalid. Please refresh the page and try again.");
            return;
        }

        await joinRoom(roomCode, name);
    } catch (error) {
        console.error("❌ Error joining room:", error);
        alert("Failed to join room. Please try again.");
    }
});

// Game State Management Functions
async function startGame(roomId) {
    try {
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) return;
        
        const roomData = roomSnap.data();
        playerOrder = [...roomData.players];
        currentTurnPlayer = playerOrder[0];

        // Initialize player goals in Firestore
        const playerGoals = {};
        
        // Draw Party Goals for each player
        for (const player of playerOrder) {
            console.log(`Drawing Party Goals for player: ${player}`);
            const partyGoalsCards = await drawFromDeck('partyGoals', PARTY_GOAL_COUNT);
            playerGoals[player] = {
                goals: partyGoalsCards,
                completed: []
            };
        }

        // Update room with all players' goals
        await updateDoc(roomRef, {
            gameState: GAME_STATES.STARTED,
            currentTurn: currentTurnPlayer,
            turnStartTime: Date.now(),
            playerOrder: playerOrder,
            playerGoals: playerGoals
        });
        
        // Show game area
        document.querySelector('.game-area').classList.add('visible');
        
        // Start timer for first player
        if (currentTurnPlayer === currentPlayerId) {
            startTimer();
        }
        
        // Hide start game button
        document.querySelector('.start-game-btn')?.classList.remove('visible');
        
        // Initialize game state for all players
        updateGameAreaState();
        
        console.log("✅ Game started successfully with", playerOrder.length, "players");
    } catch (error) {
        console.error("Error starting game:", error);
    }
}

// Add a function to display Party Goals
function displayPartyGoals(goals) {
    console.log("Displaying Party Goals:", goals);
    const container = document.getElementById("party-goal-container");
    container.innerHTML = ''; // Clear existing goals
    
    for (const card of goals) {
        const cardDiv = document.createElement("div");
        cardDiv.className = "round-card";
        const coinCount = extractCoinCount(card);

        cardDiv.innerHTML = `
            <span><h3>PARTY GOAL</h3> <br> <br> ${card} <br> <br></span>
            <div class="card-buttons">
                <button class="resolve-btn">✔ Resolved</button>
                <button class="discard-btn">✖ Discard</button>
            </div>
        `;

        // Add event listener for the "Resolve" button
        const resolveBtn = cardDiv.querySelector(".resolve-btn");
        resolveBtn.addEventListener("click", async () => {
            try {
                const roomRef = doc(db, "rooms", currentRoomId);
                await runTransaction(db, async (transaction) => {
                    const roomDoc = await transaction.get(roomRef);
                    const roomData = roomDoc.data();
                    const playerGoals = roomData.playerGoals || {};
                    const myGoals = playerGoals[currentPlayerId] || { goals: [], completed: [] };
                    
                    // Move goal from active to completed
                    myGoals.goals = myGoals.goals.filter(g => g !== card);
                    myGoals.completed.push(card);
                    playerGoals[currentPlayerId] = myGoals;
                    
                    transaction.update(roomRef, { playerGoals });
                });

                totalCoinsEarned += coinCount;
                cardDiv.innerHTML = `
                    <div class="resolved-card">
                        <h3>GOAL ACHIEVED!</h3>
                        <div class="coin-reward">
                            <span class="coin-icon">💰</span>
                            <span class="coin-amount">+${coinCount}</span>
                        </div>
                    </div>
                `;
                updateCoinsDisplay();
                logList.innerHTML += `<li>Earned ${coinCount} coins from Party Goal!</li>`;
                await discardToPile('partyGoals', [card]);
            } catch (error) {
                console.error("Error resolving party goal:", error);
            }
        });

        // Add event listener for the "Discard" button
        const discardBtn = cardDiv.querySelector(".discard-btn");
        discardBtn.addEventListener("click", async () => {
            try {
                const roomRef = doc(db, "rooms", currentRoomId);
                await runTransaction(db, async (transaction) => {
                    const roomDoc = await transaction.get(roomRef);
                    const roomData = roomDoc.data();
                    const playerGoals = roomData.playerGoals || {};
                    const myGoals = playerGoals[currentPlayerId] || { goals: [], completed: [] };
                    
                    // Remove goal from active goals
                    myGoals.goals = myGoals.goals.filter(g => g !== card);
                    playerGoals[currentPlayerId] = myGoals;
                    
                    transaction.update(roomRef, { playerGoals });
                });

                cardDiv.remove();
                await discardToPile('partyGoals', [card]);
            } catch (error) {
                console.error("Error discarding party goal:", error);
            }
        });

        container.appendChild(cardDiv);
    }
}

// Add start game button functionality
document.querySelector('.start-game-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to start the game with the current players?')) {
        startGame(currentRoomId);
    }
});

// Display room info with better error handling
function showRoomInfo(roomCode) {
    try {
        if (!roomCode) {
            console.warn("No room code provided to showRoomInfo");
            return;
        }
        roomInfoDiv.innerHTML = `
            <div class="room-info">
                <h3>Room: ${roomCode}</h3>
                <p>Share this code with other players to join!</p>
            </div>
        `;
    } catch (error) {
        console.error("Error showing room info:", error);
    }
}

// Expose necessary functions for bots
window.drawFromDeck = drawFromDeck;
window.discardToPile = discardToPile;
