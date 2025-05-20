// Import Firebase modules
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, updateDoc, arrayUnion, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import the bot class
import { RaveTycoonBot } from './bot.js';

// Define GAME_STATES locally
const GAME_STATES = {
    WAITING: 'waiting',
    STARTED: 'started',
    FINISHED: 'finished'
};

// Import game constants (GAME_STATES has been removed from here)
import { TURN_TIME, PLAYER_MESSAGES } from './constants.js';

// Import board components
import { Board, initializeBoard, getBoard } from './board.js';

// Logging System
const LogSystem = {
    turnStartTime: null,
    
    formatTime: (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    },
    
    addLogEntry: (entry, type = 'info') => {
        const logList = document.getElementById("log-list");
        if (!logList) return;
        
        const li = document.createElement('li');
        li.className = `log-entry log-${type}`;
        
        // Add timestamp
        const timestamp = new Date().toLocaleTimeString();
        li.innerHTML = `<span class="log-time">[${timestamp}]</span> ${entry}`;
        
        // Add to the top of the list
        logList.insertBefore(li, logList.firstChild);
        
        // Keep only the last 50 entries
        while (logList.children.length > 50) {
            logList.removeChild(logList.lastChild);
        }
    },
    
    logTurnStart: (playerName) => {
        LogSystem.turnStartTime = Date.now();
        const isBot = playerName.startsWith('bot-');
        const icon = isBot ? '🤖' : '👤';
        LogSystem.addLogEntry(`${icon} ${playerName}'s turn started`, 'turn');
    },
    
    logTurnEnd: (playerName) => {
        if (LogSystem.turnStartTime) {
            const duration = Date.now() - LogSystem.turnStartTime;
            const formattedDuration = LogSystem.formatTime(duration);
            const isBot = playerName.startsWith('bot-');
            const icon = isBot ? '🤖' : '👤';
            LogSystem.addLogEntry(`${icon} ${playerName}'s turn ended (Duration: ${formattedDuration})`, 'turn');
        }
    },
    
    logCardPlay: (playerName, cardType, cardContent) => {
        let icon = '🎯';
        switch(cardType.toLowerCase()) {
            case 'action': icon = '⚡'; break;
            case 'fuckup': icon = '💥'; break;
            case 'minimission': icon = '📋'; break;
            case 'partygoal': icon = '🎯'; break;
        }
        LogSystem.addLogEntry(`${icon} ${playerName} played ${cardType}: ${cardContent}`, 'card');
    },
    
    logDiceRoll: (playerName, dice1, dice2) => {
        const total = dice1 + dice2;
        LogSystem.addLogEntry(`🎲 ${playerName} rolled: ${dice1} + ${dice2} = ${total}`, 'dice');
    },
    
    logGoalChosen: (playerName, goalContent) => {
        LogSystem.addLogEntry(`🎯 ${playerName} chose goal: ${goalContent}`, 'goal');
    },
    
    logGoalCompleted: (playerName, goalContent, coins) => {
        LogSystem.addLogEntry(`✨ ${playerName} completed goal: ${goalContent} (+${coins} coins)`, 'achievement');
    },
    
    logMissionCompleted: (playerName, missionContent, coins) => {
        LogSystem.addLogEntry(`✅ ${playerName} completed mission: ${missionContent} (+${coins} coins)`, 'achievement');
    },
    
    logFuckupResolved: (playerName, fuckupContent) => {
        LogSystem.addLogEntry(`💪 ${playerName} resolved FCKUP: ${fuckupContent}`, 'fuckup');
    }
};

// Game State Variables
let gameState = GAME_STATES.WAITING; // Now uses the local GAME_STATES
let currentTurnPlayer = null;
let turnTimer = null;
let remainingTime = TURN_TIME;
let playerOrder = [];

// Initialize Firebase services
let db;
let auth;

// Add at the top with other state variables
let currentMusic = null;

// Create and add the music counter to the DOM
const musicCounter = document.createElement('div');
musicCounter.className = 'current-music-counter';
musicCounter.style.display = 'none';
document.body.appendChild(musicCounter);

// Add to the existing style element or create a new one
const styleUpdates = document.createElement('style');
styleUpdates.textContent = `
    .card {
        height: 300px !important;
        overflow-y: auto;
    }
    
    .choose-btn {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        border: 2px solid white;
        padding: 8px 15px;
        font-size: 14px;
        margin-top: 10px;
        width: auto;
        height: auto;
        transition: all 0.3s ease;
    }
    
    .choose-btn:hover {
        background-color: #f0f0f0;
    }
    
    .current-music-counter {
        position: fixed;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 0 0 10px 10px;
        z-index: 1000;
        text-align: center;
        font-size: 18px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
`;
document.head.appendChild(styleUpdates);

// Initialize Firebase services when the document is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading screen
    const loadingScreen = document.getElementById('initial-loading-screen');
    const loadingProgress = loadingScreen.querySelector('.loading-progress');
    
    // Function to update loading text with dots animation
    let dots = 0;
    const updateLoadingText = () => {
        dots = (dots + 1) % 4;
        loadingProgress.textContent = 'Loading' + '.'.repeat(dots);
    };
    const loadingInterval = setInterval(updateLoadingText, 500);
    
    // Record the start time of loading
    const startTime = Date.now();
    const minimumLoadTime = 1000; // 1 second minimum loading time
    
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
        
        // Calculate how long we've been loading
        const loadingDuration = Date.now() - startTime;
        
        // If we haven't met the minimum load time, wait the remaining time
        if (loadingDuration < minimumLoadTime) {
            await new Promise(resolve => setTimeout(resolve, minimumLoadTime - loadingDuration));
        }
        
        // Hide loading screen with fade out animation
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            clearInterval(loadingInterval);
        }, 500);
        
    } catch (error) {
        console.error("❌ Error initializing Firebase services:", error);
        loadingProgress.textContent = 'Error loading game. Please refresh the page.';
        loadingProgress.style.color = 'red';
        clearInterval(loadingInterval);
    }
});

// Function to initialize the game
async function initializeGame() {
    try {
        // Initialize the game board
        console.log("Initializing game board...");
        await initializeBoard();
        
        // Initialize all other game components
        initializeDecks();
        
        // Hide game area initially
        const gameArea = document.querySelector('.game-area');
        if (gameArea) {
            gameArea.classList.remove('visible');
            gameArea.style.display = 'none';
        }
        
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
            return;
        }

        // Initialize game controls
        initializeGameControls();
        
        console.log("✅ Game initialization complete");
    } catch (error) {
        console.error("❌ Error initializing game:", error);
        // Add error message to the page
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = `❌ Error initializing game: ${error.message}`;
        document.querySelector('.container').prepend(errorDiv);
    }
}

// Card Decks
let playerDeck = [

    ...Array(3).fill("<div><h4>🍕<br> <br>Order Pizza</h4></div>"),
    ...Array(3).fill("<div><h4>🍻<br> <br>Order Drinks</h4></div>"),
    ...Array(3).fill("<div><h4>🔊<br> <br>Add a new dancefloor</h4></div>"),
    ...Array(3).fill("<div><h4>🚾<br> <br>Add a new Toilet </h4></div>"),

    ...Array(3).fill("<div><h4>🏃 Rush: </h4><br> <p>This turn you move with 3 dice<p/></div>"),

    ...Array(3).fill("<div><h4>🚪<br> Come In: <br>Everyone in the entrance moves inside</h4></div>"),
    ...Array(3).fill("<div><h4>🧽<br> Clean 🚾: <br>Everyone in the toilet must go elsewhere</h4></div>"),
    ...Array(4).fill("<div><h4>🥸<br> <br>Invite Random Guest from a genre of your choosing</h4></div>"),

    ...Array(4).fill("<div> <h4>🎵 Play Music:<br> <br>Rock<br></h4><p>3 Rockers arrive to the party and someone who hates rock music leaves</p></div>"),
    ...Array(4).fill("<div> <h4>🎵 Play Music:<br> <br>Pop<br></h4><p>3 Poppers arrive to the party and someone who hates pop music leaves</p></div>"),
    ...Array(4).fill("<div> <h4>🎵 Play Music:<br> <br>Latin<br></h4><p>3 Latinos arrive to the party and someone who hates latin music leaves</p></div>"),
    ...Array(4).fill("<div> <h4>🎵 Play Music:<br> <br>Rap<br></h4><p>3 Rappers arrive to the party and someone who hates rap music leaves</p></div>"),
    ...Array(4).fill("<div> <h4>🎵 Play Music:<br> <br>Techno<br></h4><p>3 Ravers arrive to the party and someone who hates techno music leaves</p></div>"),
    ...Array(4).fill("<div> <h4>🎵 Play Music:<br> <br>Disco<br></h4><p>3 Discoheads arrive to the party and someone who hates disco music leaves</p></div>"),

    ...Array(2).fill("<div><h4>💣 The DROP:</h4><br><p>Your party is so lit that you are able to cancel the effect of one FCKUP</p></div>"),
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
    ...Array(1).fill("🇲🇽 5 de Mayo: <br>Most guests and most songs played should be LATIN <br> <br>(20 coins)"), 
    ...Array(1).fill("🔊 Underground Rave:<br> Most guests and most songs played should be TECHNO <br> <br>(20 coins)"), 
    ...Array(1).fill("🕺 Disco Fever: <br>Most guests and most songs played should be DISCO <br> <br> (20 coins)"), 
    ...Array(1).fill("🎤 Karaoke Vibes: <br>Most guests and most songs played should be POP <br> <br>   (20 coins)"), 
    ...Array(1).fill("🤘 Mosh Pit: <br>    Most guests and most songs played should be ROCK <br> <br>  (20 coins)"),
    ...Array(1).fill("⚔️ Rap Battle: <br>Most guests and most songs played should be HIP HOP <br> <br> (20 coins)"), 

    ...Array(1).fill("🧑‍🤝‍🧑🧑‍🤝‍🧑🧑‍🤝‍🧑 <br>A Proper Mixer: <br>Have 6 or more guests of each gernre at the end of the party <br> <br> (20 coins)"),  

    ...Array(1).fill("🌮 Hood Party Ese: <br>Have a mayority HIP HOP and LATIN music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("🎸 Electro Clash: <br>Have a mayority TECHNO and ROCK music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("👑 Disco Divas Night: <br>Have a mayority DISCO and POP music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("🚨 Rage Against the Public Enemy: <br>Have a mayority ROCK and HIP-HOP music fans at the end of the party <br> <br> (15 coins)"),
    ...Array(1).fill("👯👯👯 K-Pop night: <br>Have a mayority POP and TECHNO music fans at the end of the party <br> <br> (15 coins)"),

    ...Array(1).fill("🍻🍻🍻 <br> Beer Fest: <br>Have 3 or more DRINK stations running at the end of the party <br> <br> (10 coins)"),
    ...Array(1).fill("🍕🍗🌭 <br> Banquet: <br>Have 3 or more FOOD stations running at the end of the party <br> <br> (10 coins)"),
    ...Array(1).fill("☮️🕉️✡️ <br> Multi-Environment: <br> Have 3 or more DANCE FLOORS running at the end of the party <br> <br> (10 coins)"),
    ...Array(1).fill("🚽🚽🚽 <br> Too many porcelain: <br> Have 3 or more TOILETS running at the end of the party <br> <br> (10 coins)"),

    ...Array(1).fill("💂 Disco Guards: <br>Have a DISCO QUEEN in every room at the end of the party <br> <br> (10 coins)"),   
    ...Array(1).fill("🩰 TikTok Dance Crew: <br>Have a group of 8 POPPERS dancing together at the end of the party <br> <br> (10 coins)"),  
    ...Array(1).fill("🐓 Cock Fight: <br>Have a group of 8 LATINOS in a circle at the end of the party <br> <br> (10 coins)"),
    ...Array(1).fill("🚬 Smoke Circle: <br>Have a group of 8 ROCKERS in a circle at the end of the party <br> <br> (10 coins)"),
    ...Array(1).fill("🔫 B-BOYZ: <br>Have a group of 8 HIP HOPPERS in a circle at the end of the party <br> <br> (10 coins)"),
    ...Array(1).fill("🍬 DJ Crew: <br>Have a TECHNO RAVER in every room at the end of the party <br> <br> (10 coins)"), 
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
                // Check if it's a music card and extract the music type
                const musicMatch = card.match(/Play Music:.*?<br>.*?<br>(.*?)<br>/);
                if (musicMatch && musicMatch[1]) {
                    const musicType = musicMatch[1].trim();
                    updateCurrentMusic(musicType);
                }

                const playedCard = playerHand.splice(i, 1)[0];
                console.log(`Playing card: ${playedCard}`);
                await discardToSharedPile([playedCard]);
                paintPlayerHand();
                
                // Log the card play using the new system
                LogSystem.logCardPlay(currentPlayerId, 'action', playedCard);
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
    if (hasUnresolvedFckup) return;
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    const drawnCards = await drawFromDeck('fuckups', 1);
    if (drawnCards.length === 0) {
        LogSystem.addLogEntry("No more FCKUP cards available!", 'info');
        return;
    }
    
    const card = drawnCards[0];
    LogSystem.logCardPlay(currentPlayerId, 'fuckup', card);
    
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
    
    roundCardDiv.innerHTML = '';
    roundCardDiv.appendChild(newCardDiv);

    hasUnresolvedFckup = true;
    document.getElementById("round-card-btn").disabled = true;
    document.getElementById("your-turn-btn").disabled = true;

    const resolveBtn = newCardDiv.querySelector(".resolve-btn");
    resolveBtn.addEventListener("click", async () => {
        totalFckupsResolved++;
        updateFckupsDisplay();
        newCardDiv.innerHTML = `<div class="resolved-state">✔ RESOLVED</div>`;
        LogSystem.logFuckupResolved(currentPlayerId, card);
        
        hasUnresolvedFckup = false;
        document.getElementById("round-card-btn").disabled = false;
        document.getElementById("your-turn-btn").disabled = false;
        
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
        LogSystem.logMissionCompleted(currentPlayerId, card, coinCount);
        
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

    const drawnCards = await drawFromDeck('partyGoals', PARTY_GOAL_COUNT);
    
    if (drawnCards.length === 0) {
        LogSystem.addLogEntry("No more Party Goals available!", 'info');
        return;
    }

    const container = document.getElementById("party-goal-container");
    
    for (const card of drawnCards) {
        const cardDiv = document.createElement("div");
        cardDiv.className = "round-card";
        const coinCount = extractCoinCount(card);

        cardDiv.innerHTML = `
            <span><h3>PARTY GOAL</h3> <br> <br> ${card} <br> <br></span>
            <div class="card-buttons">
                <button class="choose-btn">🎯 CHOOSE</button>
            </div>
        `;

        const chooseBtn = cardDiv.querySelector(".choose-btn");
        chooseBtn.addEventListener("click", async () => {
            try {
                const roomRef = doc(db, "rooms", currentRoomId);
                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) {
                    console.error("Room not found when choosing goal");
                    return;
                }
                
                const roomData = roomDoc.data();
                const playerGoals = roomData.playerGoals || {};
                const myGoals = playerGoals[currentPlayerId] || { goals: [], completed: [] };
                
                // Mark this goal as chosen
                const updatedGoals = myGoals.goals.map(g => 
                    g === card ? { text: g, chosen: true } : g
                );
                
                // Get goals to discard (all except chosen)
                const goalsToDiscard = myGoals.goals.filter(g => g !== card);
                
                // Update in Firestore
                await updateDoc(roomRef, {
                    [`playerGoals.${currentPlayerId}.goals`]: [{ text: card, chosen: true }]
                });
                
                // Log the goal choice
                LogSystem.logGoalChosen(currentPlayerId, card);
                
                // Discard unwanted goals
                for (const goalToDiscard of goalsToDiscard) {
                    await discardToPile('partyGoals', [goalToDiscard]);
                }

                // Update UI to show the chosen goal
                container.innerHTML = '';
                displayChosenPartyGoal({ text: card, chosen: true }, container);
            } catch (error) {
                console.error("Error choosing party goal:", error);
            }
        });

        container.appendChild(cardDiv);
    }
});

// Update the displayChosenPartyGoal function
function displayChosenPartyGoal(card, container) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "round-card chosen-goal";
    const cardText = card.text || card;
    const coinCount = extractCoinCount(cardText);

    cardDiv.innerHTML = `
        <span><h3>CHOSEN PARTY GOAL</h3> <br> <br> ${cardText} <br> <br></span>
        <div class="card-buttons">
            <button class="resolve-btn">✔ RESOLVE</button>
        </div>
    `;

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
                myGoals.goals = [];
                myGoals.completed = myGoals.completed || [];
                myGoals.completed.push(cardText);
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
            
            // Log the goal completion
            LogSystem.logGoalCompleted(currentPlayerId, cardText, coinCount);
            
            await discardToPile('partyGoals', [cardText]);
        } catch (error) {
            console.error("Error resolving party goal:", error);
        }
    });

    container.appendChild(cardDiv);
}

// Function to extract coin count from card text
const extractCoinCount = (cardText) => {
    // Handle both string and object inputs
    const textToSearch = typeof cardText === 'object' && cardText.text ? cardText.text : 
                         typeof cardText === 'string' ? cardText : '';
    
    if (!textToSearch) {
        console.warn("Invalid card text format:", cardText);
        return 1; // Default coin count
    }
    
    const match = textToSearch.match(/\((\d+)\s*coins?\)/i);
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

// Function to handle single dice roll
const rollSingleDice = async (diceNumber) => {
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    
    try {
        const roomRef = doc(db, "rooms", currentRoomId);
        const roomSnap = await getDoc(roomRef);
        const currentDice = roomSnap.data().dice || {};
        
        // Get the other dice value to log both dice
        const otherDiceValue = diceNumber === 1 ? currentDice.dice2 : currentDice.dice1;
        
        // Update only the clicked dice while preserving the other dice's value
        const updatedDice = {
            ...currentDice,
            [`dice${diceNumber}`]: diceValue,
            lastRolled: Date.now(),
            rolledBy: currentPlayerId
        };
        
        await updateDoc(roomRef, {
            dice: updatedDice
        });
        
        // Log the dice roll with both values
        if (diceNumber === 1) {
            LogSystem.logDiceRoll(currentPlayerId, diceValue, otherDiceValue || 1);
        } else {
            LogSystem.logDiceRoll(currentPlayerId, otherDiceValue || 1, diceValue);
        }
    } catch (error) {
        console.error("Error updating single dice:", error);
    }
};

// Listen to dice changes in the room
function listenToDiceChanges(roomId) {
    const roomRef = doc(db, "rooms", roomId);
    let previousDice = { dice1: null, dice2: null };
    
    return onSnapshot(roomRef, (snapshot) => {
        const data = snapshot.data();
        if (data && data.dice) {
            const currentDice = data.dice;
            
            // Only update and animate dice if values have changed
            if (currentDice.dice1 !== previousDice.dice1) {
                updateDiceUI(dice1, currentDice.dice1);
                previousDice.dice1 = currentDice.dice1;
            }
            
            if (currentDice.dice2 !== previousDice.dice2) {
                updateDiceUI(dice2, currentDice.dice2, true);
                previousDice.dice2 = currentDice.dice2;
            }
            
            // Only log the roll if either dice changed
            if (currentDice.dice1 !== previousDice.dice1 || currentDice.dice2 !== previousDice.dice2) {
                LogSystem.logDiceRoll(currentDice.rolledBy, currentDice.dice1, currentDice.dice2);
            }
        }
    });
}

// Update dice click handlers
dice1.addEventListener("click", () => rollSingleDice(1));
dice2.addEventListener("click", () => rollSingleDice(2));

// Create and add YOUR TURN button
const yourTurnBtn = document.createElement('button');
yourTurnBtn.id = 'your-turn-btn';
yourTurnBtn.textContent = '🎲 YOUR TURN 🎲';

// Insert the button at the top of the page - this will be moved later in moveYourTurnButton()
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
    
    await rollSingleDice(1);
    await rollSingleDice(2);
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
            
            // Get current state first
            const roomDoc = await getDoc(roomRef);
            if (!roomDoc.exists()) {
                throw new Error("Room not found");
            }
            
            const roomData = roomDoc.data();
            if (!roomData.decks || !roomData.decks[deckType]) {
                console.error(`❌ Deck ${deckType} not found in room data:`, roomData);
                return [];
            }

            const currentDeck = roomData.decks[deckType];
            let deckToUse = [...(currentDeck.deck || [])];
            
            // If deck is empty, try to reshuffle discard pile
            if (deckToUse.length === 0 && currentDeck.discardPile && currentDeck.discardPile.length > 0) {
                deckToUse = shuffle([...currentDeck.discardPile]);
                await updateDoc(roomRef, {
                    [`decks.${deckType}.deck`]: deckToUse,
                    [`decks.${deckType}.discardPile`]: []
                });
            }

            if (deckToUse.length === 0) {
                return [];
            }

            const cardsToDrawCount = Math.min(count, deckToUse.length);
            const drawnCards = deckToUse.slice(0, cardsToDrawCount);
            const remainingDeck = deckToUse.slice(cardsToDrawCount);

            // Update the deck with remaining cards
            await updateDoc(roomRef, {
                [`decks.${deckType}.deck`]: remainingDeck
            });

            return drawnCards;
        } catch (error) {
            console.error(`❌ Error drawing cards from ${deckType} (attempt ${4 - retryCount}/3):`, error);
            retryCount--;
            if (retryCount === 0) {
                console.error(`❌ All retry attempts failed for ${deckType}`);
                return [];
            }
            // Increased wait time between retries
            await delay(1000);
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
                    playerMapping: {
                        [name]: auth.currentUser.uid
                    },
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

        // Get current players and check if player name already exists
        const currentPlayers = roomData.players || [];
        if (currentPlayers.includes(playerName)) {
            alert("A player with this name already exists in the room. Please choose a different name.");
            return;
        }
        
        // Add new player to the list
        const updatedPlayers = [...currentPlayers, playerName];
        
        // Create player mapping
        const playerMapping = {
            ...(roomData.playerMapping || {}),
            [playerName]: auth.currentUser.uid
        };
        
        // Update room with new player and mapping
        await updateDoc(roomRef, {
            players: updatedPlayers,
            playerMapping: playerMapping,
            lastUpdated: Date.now()
        });

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
                        <ul id="player-list-ul"></ul>
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
            clearInterval(turnTimer);
            turnTimer = null;
            // Instead of directly calling endTurn, show a message first
            showLoading('Time is up!');
            setTimeout(() => {
                endTurn(); // This will now handle showing the appropriate waiting screen
            }, 1000);
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
    try {
        const localPlayerUid = auth.currentUser ? auth.currentUser.uid : null;
        if (!localPlayerUid) {
            console.error("End turn: Current user not authenticated.");
            return;
        }

        // Log the end of the current turn
        LogSystem.logTurnEnd(currentTurnPlayer);

        // Fetch the latest room data to get playerMapping if not readily available
        let currentRoomData = {};
        if (currentRoomId) {
            const roomDoc = await getDoc(doc(db, "rooms", currentRoomId));
            if (roomDoc.exists()) {
                currentRoomData = roomDoc.data();
            }
        }
        const playerMapping = currentRoomData.playerMapping || {};
        const turnPlayerUid = playerMapping[currentTurnPlayer];

        if (!currentTurnPlayer || !turnPlayerUid || turnPlayerUid !== localPlayerUid) {
            console.warn('Not your turn to end.');
            return;
        }
        
        // Save final board state
        try {
            const board = getBoard();
            if (board) {
                const boardState = board.getBoardState();
                if (boardState) {
                    await updateBoardState(boardState);
                }
            }
        } catch (error) {
            console.error("Error saving board state:", error);
        }
        
        if (turnTimer) {
            clearInterval(turnTimer);
            turnTimer = null;
        }
        
        // Determine the next player
        const roomPlayerOrder = currentRoomData.playerOrder || currentRoomData.players || [];
        if (roomPlayerOrder.length > 0) {
            playerOrder = roomPlayerOrder;
        }
        
        const currentPlayerIndex = playerOrder.indexOf(currentTurnPlayer);
        const nextPlayerIndex = (currentPlayerIndex + 1) % playerOrder.length;
        const nextPlayerName = playerOrder[nextPlayerIndex];
        
        // Update room with next player's turn
        if (currentRoomId) {
            await updateDoc(doc(db, "rooms", currentRoomId), {
                currentTurn: nextPlayerName,
                turnStartTime: Date.now(),
                lastUpdated: Date.now()
            });
        }
        
        // Update local game state
        currentTurnPlayer = nextPlayerName;
        
        // Log the start of the next turn
        LogSystem.logTurnStart(nextPlayerName);
        
        // Show waiting screen for the player who just finished their turn
        const nextPlayerUid = playerMapping[nextPlayerName];
        const isBot = nextPlayerName.startsWith('bot-');
        
        if (isBot) {
            showLoading(`Bot ${nextPlayerName} is playing...`, { isBotTurn: true });
        } else if (nextPlayerUid === localPlayerUid) {
            showLoading('Your turn!');
            setTimeout(hideLoading, 1500);
        } else {
            showLoading(`Waiting for ${nextPlayerName}...`, { isThirdPlayer: true });
        }
        
    } catch (error) {
        console.error("Error ending turn:", error);
        hideLoading();
    }
}

// Function to show/hide finish turn button based on current player
function updateFinishTurnButton() {
    const finishTurnBtn = document.querySelector('.finish-turn-btn');
    const timerContainer = document.querySelector('.timer-container');
    if (!finishTurnBtn) return;

    const localPlayerUid = auth.currentUser ? auth.currentUser.uid : null;
    const playerMapping = window.currentRoomDataForButton?.playerMapping || {};
    const turnPlayerUid = playerMapping[currentTurnPlayer];
    const isMyTurn = localPlayerUid && turnPlayerUid === localPlayerUid;

    console.log("Updating finish turn button:", { 
        isMyTurn, 
        gameState, 
        currentTurnPlayer,
        localPlayerUid,
        turnPlayerUid
    });

    if (isMyTurn && gameState === GAME_STATES.STARTED) {
        finishTurnBtn.style.display = 'block';
        finishTurnBtn.classList.add('visible');
        finishTurnBtn.disabled = false;
        
        if (timerContainer) {
            timerContainer.style.display = 'block';
            timerContainer.classList.add('visible');
        }
    } else {
        finishTurnBtn.style.display = 'none';
        finishTurnBtn.classList.remove('visible');
        finishTurnBtn.disabled = true;
        
        if (timerContainer) {
            timerContainer.style.display = 'none';
            timerContainer.classList.remove('visible');
            timerContainer.classList.remove('warning');
        }
    }
}

// Loading state management
let loadingState = {
    isLoading: false,
    message: '',
    isBotTurn: false,
    isThirdPlayer: false
};

function showLoading(message = '', options = {}) {
    loadingState = {
        isLoading: true,
        message,
        isBotTurn: options.isBotTurn || false,
        isThirdPlayer: options.isThirdPlayer || false
    };
    
    const loadingOverlay = document.querySelector('.loading-overlay');
    const messageElement = loadingOverlay.querySelector('.current-player-message');
    
    if (loadingState.isThirdPlayer) {
        loadingOverlay.classList.add('third-player');
    } else {
        loadingOverlay.classList.remove('third-player');
    }
    
    if (loadingState.isBotTurn) {
        document.querySelector('.game-area').classList.add('bot-turn');
    }
    
    messageElement.textContent = message;
    loadingOverlay.classList.add('visible');
    document.body.classList.add('loading');
}

function hideLoading() {
    // Clear any existing timers
    if (window.hideLoadingTimer) {
        clearTimeout(window.hideLoadingTimer);
        window.hideLoadingTimer = null;
    }
    
    loadingState.isLoading = false;
    
    const loadingOverlay = document.querySelector('.loading-overlay');
    document.querySelector('.game-area').classList.remove('bot-turn');
    loadingOverlay.classList.remove('visible', 'third-player');
    document.body.classList.remove('loading');
    
    // Small delay to ensure smooth transition
    window.hideLoadingTimer = setTimeout(() => {
        if (!loadingState.isLoading) {
            loadingOverlay.querySelector('.current-player-message').textContent = '';
        }
    }, 300);
}

// Turn management
async function handleTurnChange(nextPlayerName) { // Parameter is nextPlayerName
    try {
        const localPlayerUid = auth.currentUser ? auth.currentUser.uid : null;
        if (!localPlayerUid) {
            console.error("Handle turn change: Current user not authenticated.");
            hideLoading();
            return;
        }

        // Fetch playerMapping again for safety, or ensure it's up-to-date
        let currentRoomData = {};
        if (currentRoomId) {
            const roomDoc = await getDoc(doc(db, "rooms", currentRoomId));
            if (roomDoc.exists()) {
                currentRoomData = roomDoc.data();
            }
        }
        const playerMapping = currentRoomData.playerMapping || {};

        const nextPlayerUid = playerMapping[nextPlayerName];
        const isBot = nextPlayerName.startsWith('bot-'); // Assuming bot names indicate they are bots
        const isCurrentClientNext = nextPlayerUid === localPlayerUid;
        
        // Save current board state before turn change (already done in endTurn, but can be a safeguard)
        // const board = getBoard(); /* ... save state ... */
        
        console.log(`Changing turn to ${nextPlayerName}. Is bot: ${isBot}, Is current client next: ${isCurrentClientNext}`);

        // Update turn in Firestore. This will trigger onSnapshot for all clients.
        if (currentRoomId) { // Ensure currentRoomId is valid
            await updateDoc(doc(db, "rooms", currentRoomId), {
                currentTurn: nextPlayerName, // Store player name as currentTurn
                turnStartTime: Date.now(),
                lastUpdated: Date.now()
            });
        }
        
        // The onSnapshot in listenToGameState should handle UI updates for all clients,
        // including showing loading screens and starting timers.
        // So, direct calls to showLoading/hideLoading/startTimer here might be redundant or conflicting.

        // If the next player is a bot and this client is the host (or designated bot controller),
        // then trigger bot's turn.
        // For simplicity, let's assume bots play immediately if their turn comes up.
        // This logic might need refinement based on who controls the bots.
        if (isBot) {
            // Bot turn handling logic might need to be centralized or triggered by host
            console.log(`Bot ${nextPlayerName}'s turn. Bot should act now.`);
            // Temporary: if this client is host, make the bot play
            if (currentRoomData.hostId === localPlayerUid) {
                 showLoading(`Bot ${nextPlayerName} is thinking...`, { isBotTurn: true });
                 const botInstance = activeBots.get(nextPlayerName); // Assuming activeBots map stores bot instances by name
                 if (botInstance) {
                    await botInstance.performTurn();
                    // After bot performs turn, it should call endTurn().
                    // This might create a loop if not handled carefully.
                    // For now, let's assume performTurn includes ending its turn.
                 } else {
                    console.warn(`Bot instance ${nextPlayerName} not found.`);
                    hideLoading(); // Hide bot thinking if instance not found
                 }
            } else {
                // If not host, just show waiting for bot (handled by onSnapshot)
            }
        }
        
    } catch (error) {
        console.error('Error handling turn change:', error);
        hideLoading(); // Ensure loading is hidden on error
    }
}

// Update the listenToGameState function
function listenToGameState(roomId) {
    let previousTurnPlayer = null;  // Add this to track turn changes

    return onSnapshot(doc(db, 'rooms', roomId), async (snapshot) => {
        const data = snapshot.data();
        if (!data) return;
        window.currentRoomDataForButton = data;
        
        const previousGameState = gameState;
        
        // Only update game state if it's different
        if (data.gameState !== gameState) {
            gameState = data.gameState;
        }

        // Handle turn changes
        if (data.currentTurn !== previousTurnPlayer) {
            const localPlayerUid = auth.currentUser ? auth.currentUser.uid : null;
            const playerMapping = data.playerMapping || {};
            const turnPlayerUid = playerMapping[data.currentTurn];
            const isMyTurn = localPlayerUid && turnPlayerUid === localPlayerUid;
            const wasMyTurn = localPlayerUid && playerMapping[previousTurnPlayer] === localPlayerUid;
            const isBot = data.currentTurn && data.currentTurn.startsWith('bot-');

            console.log("Turn change detected:", {
                from: previousTurnPlayer,
                to: data.currentTurn,
                isMyTurn,
                wasMyTurn
            });

            // Always show appropriate loading screen on turn change
            if (isMyTurn) {
                showLoading('Your turn!');
                setTimeout(hideLoading, 1500);
                startTimer();
            } else if (isBot) {
                showLoading(`Bot ${data.currentTurn} is playing...`, { isBotTurn: true });
            } else if (data.currentTurn) {
                showLoading(`Waiting for ${data.currentTurn}...`, { isThirdPlayer: true });
            }

            currentTurnPlayer = data.currentTurn;
            previousTurnPlayer = data.currentTurn;  // Update previous turn player
        }

        // Update music counter if changed
        if (data.currentMusic !== currentMusic) {
            currentMusic = data.currentMusic;
            if (currentMusic) {
                musicCounter.textContent = `🎵 Now Playing: ${currentMusic}`;
                musicCounter.style.display = 'block';
            } else {
                musicCounter.style.display = 'none';
            }
        }

        // Restore board state if it changed
        const board = getBoard();
        if (board && data.boardState) {
            // Only restore if the board state is different from current
            const currentState = board.getBoardState();
            const newState = data.boardState;
            
            if (JSON.stringify(currentState) !== JSON.stringify(newState)) {
                board.restoreBoardState(newState);
            }
        }
        
        // Handle party goals if game just started or party goals updated
        if (data.playerGoals && data.playerGoals[currentPlayerId]) {
            const myGoals = data.playerGoals[currentPlayerId].goals || [];
            if (myGoals.length > 0) {
                const currentGoalsContainer = document.getElementById("party-goal-container");
                if (currentGoalsContainer.children.length === 0 || 
                    (myGoals.some(goal => typeof goal === 'object' && goal.chosen === true) && 
                     !currentGoalsContainer.querySelector('.chosen-goal'))) {
                    console.log("Displaying updated party goals:", myGoals);
                    displayPartyGoals(myGoals);
                }
            }
        }
        
        updatePlayerList(data.players || [], currentTurnPlayer, playerMapping);
        updateGameAreaState();
        updateFinishTurnButton();
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

    // Set up board state change callback
    const board = getBoard();
    if (board) {
        board.setBoardStateChangeCallback(async (boardState) => {
            // Only update if it's the current player's turn
            const localPlayerUid = auth.currentUser ? auth.currentUser.uid : null;
            const playerMapping = window.currentRoomDataForButton?.playerMapping || {};
            const turnPlayerUid = playerMapping[currentTurnPlayer];
            const isMyTurn = localPlayerUid && turnPlayerUid === localPlayerUid;

            if (isMyTurn) {
                await updateBoardState(boardState);
            }
        });
    }
    
    // Create and add the UI toggle menu
    createUIToggleMenu();
    
    // Move YOUR TURN button above dice section
    moveYourTurnButton();
}

// Function to create the UI toggle menu
function createUIToggleMenu() {
    const menu = document.createElement('div');
    menu.className = 'ui-toggle-menu';
    
    // Define toggle buttons with their icons, targets, and default states
    const toggleButtons = [
        { icon: '⏱️', target: '.timer-container, .finish-turn-btn', title: 'Toggle Turn Timer', defaultActive: true },
        { icon: '🏠', target: '.lobby-section', title: 'Toggle Lobby', defaultActive: true },
        { icon: '🎮', target: '.board-section, .game-pieces-section', title: 'Toggle Board', defaultActive: false },
        { icon: '🎲', target: '.dice-section', title: 'Toggle Dice', defaultActive: true },
        { icon: '📝', target: '.log-section', title: 'Toggle Log', defaultActive: false }
    ];
    
    // Create buttons and add to menu
    toggleButtons.forEach(({ icon, target, title, defaultActive }) => {
        const button = document.createElement('button');
        button.className = 'ui-toggle-btn';
        button.innerHTML = icon;
        button.title = title;
        button.dataset.target = target;
        
        // Set initial state
        if (!defaultActive) {
            const targetElements = document.querySelectorAll(target);
            targetElements.forEach(element => {
                element.classList.add('hidden-element');
            });
        } else {
            button.classList.add('active');
        }
        
        // Add click event to toggle visibility
        button.addEventListener('click', () => {
            const targetElements = document.querySelectorAll(target);
            const isActive = button.classList.toggle('active');
            
            targetElements.forEach(element => {
                element.classList.toggle('hidden-element', !isActive);
            });
        });
        
        menu.appendChild(button);
    });
    
    // Add menu to document
    document.body.appendChild(menu);
    
    // Store menu in window for access from other functions
    window.uiToggleMenu = menu;
}

// Function to move YOUR TURN button above dice section
function moveYourTurnButton() {
    const yourTurnBtn = document.getElementById('your-turn-btn');
    const diceSection = document.querySelector('.dice-section');
    
    if (!yourTurnBtn || !diceSection) return;
    
    // Remove YOUR TURN button from its current location
    if (yourTurnBtn.parentNode) {
        yourTurnBtn.parentNode.removeChild(yourTurnBtn);
    }
    
    // Insert it before the dice section
    diceSection.parentNode.insertBefore(yourTurnBtn, diceSection);
}

// Update player list with current turn indicator
function updatePlayerList(players, currentTurn, playerMapping = {}) {
    const playerListHtml = players.map(playerName => {
        const isCurrent = playerName === currentTurn;
        return `<li class="${isCurrent ? 'current-turn' : ''}">${playerName}${isCurrent ? ' (Current Turn)' : ''}</li>`;
    }).join('');
    
    const playerList = document.getElementById('player-list-ul');
    if (playerList) {
        playerList.innerHTML = playerListHtml;
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
    const timerContainer = document.querySelector('.timer-container');
    
    if (!gameArea) {
        console.error("Game area not found");
        return;
    }

    console.log("Updating game area state:", {
        gameState: gameState,
        currentTurnPlayer: currentTurnPlayer,
        currentPlayerId: currentPlayerId
    });

    // Show/hide game area based on game state
    if (gameState === GAME_STATES.STARTED) {
        // First make it visible but with opacity 0
        gameArea.style.display = 'block';
        gameArea.style.opacity = '0';
        
        // Force a reflow
        gameArea.offsetHeight;
        
        // Then add the visible class for smooth transition
        requestAnimationFrame(() => {
            gameArea.classList.add('visible');
            gameArea.style.opacity = '1';
        });
        
        // Show/hide timer and finish turn button based on current player
        if (currentTurnPlayer === currentPlayerId) {
            if (timerContainer) {
                timerContainer.style.display = 'block';
                timerContainer.classList.add('visible');
            }
            if (finishTurnBtn) {
                finishTurnBtn.style.display = 'block';
                finishTurnBtn.classList.add('visible');
            }
        } else {
            if (timerContainer) {
                timerContainer.style.display = 'none';
                timerContainer.classList.remove('visible');
            }
            if (finishTurnBtn) {
                finishTurnBtn.style.display = 'none';
                finishTurnBtn.classList.remove('visible');
            }
        }
    } else {
        // Hide game area if game hasn't started
        gameArea.classList.remove('visible');
        gameArea.style.opacity = '0';
        setTimeout(() => {
            if (gameState !== GAME_STATES.STARTED) {
                gameArea.style.display = 'none';
            }
        }, 300);
    }

    // Update player controls visibility
    const playerControls = document.querySelectorAll('.player-controls button');
    playerControls.forEach(button => {
        button.disabled = currentTurnPlayer !== currentPlayerId || gameState !== GAME_STATES.STARTED;
    });

    // Update cards state
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.classList.toggle('disabled', currentTurnPlayer !== currentPlayerId || gameState !== GAME_STATES.STARTED);
    });
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
        console.log("Starting game with room ID:", roomId);
        const roomRef = doc(db, "rooms", roomId);
        const roomSnap = await getDoc(roomRef);
        
        if (!roomSnap.exists()) {
            console.error("Room not found when starting game");
            return;
        }
        
        const roomData = roomSnap.data();
        console.log("Room data:", roomData);
        
        // Ensure we have players before starting
        if (!roomData.players || roomData.players.length === 0) {
            console.error("No players in room");
            return;
        }
        
        // Set game state first
        gameState = GAME_STATES.STARTED;
        
        // Initialize player order and first turn
        playerOrder = [...roomData.players];
        const firstPlayer = playerOrder[0];
        currentTurnPlayer = firstPlayer;

        // Hide lobby for all players by updating room data
        await updateDoc(roomRef, {
            gameState: GAME_STATES.STARTED,
            currentTurn: firstPlayer,
            turnStartTime: Date.now(),
            playerOrder: playerOrder,
            playerGoals: await initializePlayerGoals(playerOrder),
            lastUpdated: Date.now(),
            hideLobby: true // Add this flag to trigger lobby hiding for all players
        });

        // Rest of the existing startGame function code...
        // ... existing code ...

    } catch (error) {
        console.error("Error starting game:", error);
        alert("Failed to start game. Please try again.");
    }
}

// Function to display Party Goals
function displayPartyGoals(goals) {
    console.log("Displaying Party Goals:", goals);
    const container = document.getElementById("party-goal-container");
    container.innerHTML = ''; // Clear existing goals
    
    // Ensure goals is an array
    if (!Array.isArray(goals)) {
        console.warn("Goals is not an array:", goals);
        return;
    }
    
    // If we have a single chosen goal
    const chosenGoal = goals.find(goal => 
        (typeof goal === 'object' && goal !== null && goal.chosen === true)
    );
    
    if (chosenGoal) {
        console.log("Found chosen goal:", chosenGoal);
        displayChosenPartyGoal(chosenGoal, container);
        return;
    }
    
    // Display all goals with CHOOSE buttons
    for (const card of goals) {
        const cardDiv = document.createElement("div");
        cardDiv.className = "round-card";
        const coinCount = extractCoinCount(card);
        const cardText = typeof card === 'object' && card.text ? card.text : card;

        cardDiv.innerHTML = `
            <span><h3>PARTY GOAL</h3> <br> <br> ${cardText} <br> <br></span>
            <div class="card-buttons">
                <button class="choose-btn">🎯 CHOOSE</button>
            </div>
        `;

        // Add event listener for the "CHOOSE" button
        const chooseBtn = cardDiv.querySelector(".choose-btn");
        chooseBtn.addEventListener("click", async () => {
            try {
                const roomRef = doc(db, "rooms", currentRoomId);
                const roomDoc = await getDoc(roomRef);
                if (!roomDoc.exists()) {
                    console.error("Room not found when choosing goal");
                    return;
                }
                
                const roomData = roomDoc.data();
                const playerGoals = roomData.playerGoals || {};
                const myGoals = playerGoals[currentPlayerId] || { goals: [], completed: [] };
                
                // Get goals to discard (all except chosen)
                const cardValue = typeof card === 'object' && card.text ? card.text : card;
                const goalsToDiscard = myGoals.goals.filter(g => {
                    const gValue = typeof g === 'object' && g.text ? g.text : g;
                    return gValue !== cardValue;
                });
                
                // Update in Firestore
                await updateDoc(roomRef, {
                    [`playerGoals.${currentPlayerId}.goals`]: [{ text: cardValue, chosen: true }]
                });
                
                // Discard unwanted goals
                for (const goalToDiscard of goalsToDiscard) {
                    const goalValue = typeof goalToDiscard === 'object' && goalToDiscard.text ? 
                                     goalToDiscard.text : goalToDiscard;
                    await discardToPile('partyGoals', [goalValue]);
                }

                // Update UI to show the chosen goal
                container.innerHTML = '';
                displayChosenPartyGoal({ text: cardValue, chosen: true }, container);
                
                // Log the goal choice using LogSystem
                LogSystem.logGoalChosen(currentPlayerId, cardValue);
            } catch (error) {
                console.error("Error choosing party goal:", error);
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
                <h4>Players:</h4>
                <ul id="player-list-ul"></ul>
            </div>
        `;
    } catch (error) {
        console.error("Error showing room info:", error);
    }
}

// Expose necessary functions for bots
window.drawFromDeck = drawFromDeck;
window.discardToPile = discardToPile;
window.getBoard = getBoard;

// Add updateTurnInRoom function
async function updateTurnInRoom(nextPlayer) {
    if (!currentRoomId) return;
    
    try {
        const roomRef = doc(db, "rooms", currentRoomId);
        await updateDoc(roomRef, {
            currentTurn: nextPlayer,
            turnStartTime: Date.now(),
            lastUpdated: Date.now()
        });
        
        console.log(`Turn updated to ${nextPlayer}`);
    } catch (error) {
        console.error("Error updating turn:", error);
    }
}

// At the top of script.js, or in a shared state module if you have one:
window.currentRoomDataForButton = {}; // To store room data for button updates

// Function to update board state in Firestore
async function updateBoardState(boardState) {
    if (!currentRoomId) return;
    
    try {
        const roomRef = doc(db, "rooms", currentRoomId);
        await updateDoc(roomRef, {
            boardState: boardState,
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error("Error updating board state:", error);
    }
}

// Function to update current music
function updateCurrentMusic(musicType) {
    currentMusic = musicType;
    musicCounter.textContent = `🎵 Now Playing: ${musicType}`;
    musicCounter.style.display = 'block';
    
    // Update in Firestore so all players can see it
    if (currentRoomId) {
        const roomRef = doc(db, "rooms", currentRoomId);
        updateDoc(roomRef, {
            currentMusic: musicType,
            lastUpdated: Date.now()
        });
    }
}

// Add log filtering functionality
document.addEventListener('DOMContentLoaded', () => {
    const logFilters = document.querySelectorAll('.log-filter');
    const logList = document.getElementById('log-list');

    logFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            // Update active state of filters
            logFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');

            const type = filter.dataset.type;
            const entries = logList.querySelectorAll('.log-entry');

            entries.forEach(entry => {
                if (type === 'all') {
                    entry.style.display = '';
                } else {
                    entry.style.display = entry.classList.contains(`log-${type}`) ? '' : 'none';
                }
            });
        });
    });
});

// Function to hide lobby when game starts
function hideLobbyOnGameStart() {
    const lobbyButton = document.querySelector('.ui-toggle-btn[data-target=".lobby-section"]');
    if (lobbyButton) {
        lobbyButton.classList.remove('active');
        const lobbySection = document.querySelector('.lobby-section');
        if (lobbySection) {
            lobbySection.classList.add('hidden-element');
        }
    }
}

// Function to initialize player goals
async function initializePlayerGoals(players) {
    const playerGoals = {};
    
    // Initialize goals for each player
    for (const player of players) {
        // Draw 3 random goals for each player
        const drawnGoals = await drawFromDeck('partyGoals', 3);
        
        playerGoals[player] = {
            goals: drawnGoals,
            completed: []
        };
    }
    
    return playerGoals;
}
