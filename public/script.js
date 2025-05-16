// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { doc, setDoc, getDoc, collection, onSnapshot, deleteDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Get Firebase instances from window object
const db = window.db;
const auth = window.auth;

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDJ3g2PKE-A_1wn5axTeO4nfNIlIsBJXY",
    authDomain: "rave-tycoon.firebaseapp.com",
    projectId: "rave-tycoon",
    storageBucket: "rave-tycoon.firebasestorage.app",
    messagingSenderId: "230788414135",
    appId: "1:230788414135:web:be2732ed317f9d6fdd6b32",
    measurementId: "G-P4XSYXE1S9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

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
    playSound(SoundEffects.removeDuplicates);
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
        // Collect cards to discard
        const cardsToDiscard = indices.map(index => playerHand[index]);
        
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
    }, 500);
};

// Modify the existing paintPlayerHand function to check for duplicates
const paintPlayerHand = () => {
    playerCardsDiv.innerHTML = "";
    playerHand.forEach((card, i) => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.innerHTML = card;
        cardElement.addEventListener("click", async () => {
            playSound(SoundEffects.playCard);
            const playedCard = playerHand.splice(i, 1)[0];
            await discardToSharedPile([playedCard]);
            paintPlayerHand();
            logList.innerHTML += `<li>Played card: ${playedCard}</li>`;
        });
        playerCardsDiv.appendChild(cardElement);
    });
    
    // Check for duplicates after painting the hand
    highlightDuplicateCards();
};

// Sound Effects System
const SoundEffects = {
    drawCard: new Audio('sounds/card-shuffle.mp3'),
    playCard: new Audio('sounds/card-play.mp3'),
    discardCard: new Audio('sounds/card-discard.mp3'),
    resolveMission: new Audio('sounds/mission-complete.mp3'),
    earnCoins: new Audio('sounds/coins.mp3'),
    drawFckup: new Audio('sounds/fckup.mp3'),
    resolveFckup: new Audio('sounds/fckup-resolve.mp3'),
    removeDuplicates: new Audio('sounds/remove-duplicates.mp3'),
    error: new Audio('sounds/error.mp3')
};

// Global mute state
let isMuted = false;

// Create mute button
const muteButton = document.createElement('button');
muteButton.id = 'mute-button';
muteButton.className = 'mute-button';
muteButton.innerHTML = '🔊';

// Style the mute button
muteButton.style.position = 'fixed';
muteButton.style.top = '20px';
muteButton.style.left = '20px';
muteButton.style.padding = '10px 15px';
muteButton.style.fontSize = '24px';
muteButton.style.backgroundColor = '#fff';
muteButton.style.border = '2px solid #333';
muteButton.style.borderRadius = '50%';
muteButton.style.cursor = 'pointer';
muteButton.style.zIndex = '1000';
muteButton.style.transition = 'all 0.3s ease';
muteButton.style.width = '50px';
muteButton.style.height = '50px';

// Add hover effect
muteButton.addEventListener('mouseover', () => {
    muteButton.style.transform = 'scale(1.1)';
    muteButton.style.backgroundColor = '#f0f0f0';
});

muteButton.addEventListener('mouseout', () => {
    muteButton.style.transform = 'scale(1)';
    muteButton.style.backgroundColor = '#fff';
});

document.body.appendChild(muteButton);

// Function to toggle mute state
const toggleMute = () => {
    isMuted = !isMuted;
    muteButton.innerHTML = isMuted ? '🔇' : '🔊';
    // Update all audio elements
    Object.values(SoundEffects).forEach(sound => {
        sound.muted = isMuted;
    });
};

// Add click handler for mute button
muteButton.addEventListener('click', toggleMute);

// Function to play sound with error handling
const playSound = (sound) => {
    if (!isMuted && sound) {
        try {
            sound.volume = 0.3; // Set volume to 30%
            sound.currentTime = 0; // Reset sound to start
            const playPromise = sound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('Sound play prevented:', error);
                    // Don't show errors to users as sound is not critical
                });
            }
        } catch (error) {
            console.warn('Sound play error:', error);
            // Don't show errors to users as sound is not critical
        }
    }
};

// Modify the existing grab-action-cards-btn click handler
document.getElementById("grab-action-cards-btn").addEventListener("click", async () => {
    if (!currentRoomId) {
        alert("Please join a room first!");
        return;
    }

    const handLength = playerHand.length;
    const missing = 6 - handLength;

    if (missing === 0) {
        return;
    }

    playSound(SoundEffects.drawCard);
    
    const drawnCards = await drawFromSharedDeck(missing);
    if (drawnCards.length > 0) {
        playerHand.push(...drawnCards);
        paintPlayerHand();
    } else {
        playSound(SoundEffects.error);
        alert("No cards available to draw!");
    }
});

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
document.getElementById("round-card-btn").addEventListener("click", () => {
    // Don't allow drawing if there's an unresolved FCKUP
    if (hasUnresolvedFckup) {
        return;
    }

    // Initialize deck if it's empty
    if (currentFckupDeck.length === 0 && discardedFckupCards.length === 0) {
        initializeDecks();
    }
    
    // Try to reshuffle if deck is empty
    reshuffleFckupDeck();
    
    // Check if we have cards to draw
    if (currentFckupDeck.length === 0) {
        logList.innerHTML += `<li>No more FCKUP cards available!</li>`;
        return;
    }
    
    playSound(SoundEffects.drawFckup);
    // Draw a card
    const card = currentFckupDeck.pop();
    discardedFckupCards.push(card);
    
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
    resolveBtn.addEventListener("click", () => {
        totalFckupsResolved++;
        updateFckupsDisplay();
        newCardDiv.innerHTML = `<div class="resolved-state">✔ RESOLVED</div>`;
        logList.innerHTML += `<li>FCKUP resolved! (Total resolved: ${totalFckupsResolved})</li>`;
        
        // Reset unresolved state and enable buttons
        hasUnresolvedFckup = false;
        document.getElementById("round-card-btn").disabled = false;
        document.getElementById("your-turn-btn").disabled = false;
    });
    
    logList.innerHTML += `<li>FCKUP/ ${card} (${currentFckupDeck.length} cards remaining)</li>`;
});

// Grab Mini Mission
document.getElementById("mini-mission-btn").addEventListener("click", () => {
    // Initialize deck if it's empty
    if (currentMiniMissionDeck.length === 0 && discardedMiniMissionCards.length === 0) {
        initializeDecks();
    }
    
    // Try to reshuffle if deck is empty
    reshuffleMiniMissionDeck();
    
    // Check if we have cards to draw
    if (currentMiniMissionDeck.length === 0) {
        playSound(SoundEffects.error);
        logList.innerHTML += `<li>No more Mini Mission cards available!</li>`;
        return;
    }

    // Draw a card
    playSound(SoundEffects.drawCard);
    const card = currentMiniMissionDeck.pop();
    discardedMiniMissionCards.push(card);
    
    const container = document.getElementById("mini-mission-container");
    const newCardDiv = document.createElement("div");
    newCardDiv.className = "round-card";

    newCardDiv.innerHTML = `
        <span><h3>MINI MISSION</h3><br><br> ${card}<br><br></span>
        <button class="resolve-btn">✔ Resolved</button>
    `;

    container.appendChild(newCardDiv);

    const resolveBtn = newCardDiv.querySelector(".resolve-btn");
    resolveBtn.addEventListener("click", () => {
        playSound(SoundEffects.earnCoins);
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
    });

    logList.innerHTML += `<li>MINI MISSION/ ${card} (${currentMiniMissionDeck.length} cards remaining)</li>`;
});

document.getElementById("party-goals-btn").addEventListener("click", () => {
    // Initialize deck if it's empty
    if (currentPartyGoalsDeck.length === 0 && discardedPartyGoalsCards.length === 0) {
        initializeDecks();
    }
    
    // Check if we have enough cards to draw
    if (currentPartyGoalsDeck.length === 0) {
        playSound(SoundEffects.error);
        logList.innerHTML += `<li>No more Party Goals available!</li>`;
        return;
    }

    playSound(SoundEffects.drawCard);
    const container = document.getElementById("party-goal-container");
    const cardsToDraw = Math.min(PARTY_GOAL_COUNT, currentPartyGoalsDeck.length);
    
    for (let i = 0; i < cardsToDraw; i++) {
        // Draw a card
        const card = currentPartyGoalsDeck.pop();
        discardedPartyGoalsCards.push(card);

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
        resolveBtn.addEventListener("click", () => {
            playSound(SoundEffects.earnCoins);
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
        });

        // Add event listener for the "Discard" button
        const discardBtn = cardDiv.querySelector(".discard-btn");
        discardBtn.addEventListener("click", () => {
            playSound(SoundEffects.discardCard);
            cardDiv.remove();
        });

        container.appendChild(cardDiv);
        logList.innerHTML += `<li>PARTY GOAL/ ${card} (${currentPartyGoalsDeck.length} cards remaining)</li>`;
    }

    if (cardsToDraw < PARTY_GOAL_COUNT) {
        logList.innerHTML += `<li>Warning: Only ${cardsToDraw} Party Goals remaining!</li>`;
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
const simulateDiceRolls = () => {
    const dice1 = document.getElementById("dice");
    const dice2 = document.getElementById("dice2");
    
    // Trigger dice roll animations
    dice1.classList.add("roll");
    dice2.classList.add("roll");

    // Generate random numbers
    setTimeout(() => {
        const randomNumber1 = Math.floor(Math.random() * 6) + 1;
        const randomNumber2 = Math.floor(Math.random() * 6) + 1;
        
        dice1.querySelector(".number").textContent = randomNumber1;
        dice2.querySelector(".number2").textContent = randomNumber2;
        
        // Remove roll classes
        dice1.classList.remove("roll");
        dice2.classList.remove("roll");
    }, 250);
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
        
        // Only initialize deck if it doesn't exist
        if (!roomSnap.data().deck) {
            await setDoc(roomRef, {
                deck: shuffle([...playerDeck]),
                discardPile: [],
                lastUpdated: Date.now()
            }, { merge: true });
            console.log("✅ Shared deck initialized");
        }
    } catch (error) {
        console.error("❌ Error initializing shared deck:", error);
    }
}

// Draw cards from shared deck
async function drawFromSharedDeck(count) {
    if (!currentRoomId) {
        console.error("❌ Not in a room");
        return [];
    }

    try {
        const roomRef = doc(db, "rooms", currentRoomId);
        
        // Use a transaction to ensure atomic updates
        return await db.runTransaction(async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            const roomData = roomDoc.data();
            
            if (!roomData.deck || roomData.deck.length === 0) {
                // If deck is empty, shuffle discard pile back in
                if (roomData.discardPile && roomData.discardPile.length > 0) {
                    const newDeck = shuffle([...roomData.discardPile]);
                    transaction.update(roomRef, {
                        deck: newDeck,
                        discardPile: [],
                        lastUpdated: Date.now()
                    });
                    roomData.deck = newDeck;
                    roomData.discardPile = [];
                } else {
                    console.warn("No cards available to draw");
                    return [];
                }
            }

            const cardsToDrawCount = Math.min(count, roomData.deck.length);
            const drawnCards = roomData.deck.slice(0, cardsToDrawCount);
            const remainingDeck = roomData.deck.slice(cardsToDrawCount);

            // Update the deck in Firestore
            transaction.update(roomRef, {
                deck: remainingDeck,
                lastUpdated: Date.now()
            });

            logList.innerHTML += `<li>Drew ${cardsToDrawCount} cards. ${remainingDeck.length} cards remaining in deck.</li>`;
            return drawnCards;
        });
    } catch (error) {
        console.error("❌ Error drawing cards:", error);
        return [];
    }
}

// Discard cards to shared discard pile
async function discardToSharedPile(cards) {
    if (!currentRoomId || !cards.length) return;

    try {
        const roomRef = doc(db, "rooms", currentRoomId);
        await updateDoc(roomRef, {
            discardPile: arrayUnion(...cards),
            lastUpdated: Date.now()
        });
    } catch (error) {
        console.error("❌ Error discarding cards:", error);
    }
}

// Listen to deck changes
function listenToDeckChanges(roomId) {
    const roomRef = doc(db, "rooms", roomId);
    return onSnapshot(roomRef, (snapshot) => {
        const data = snapshot.data();
        if (data) {
            logList.innerHTML += `<li>Deck update: ${data.deck ? data.deck.length : 0} cards remaining</li>`;
        }
    });
}

// Update room creation to initialize deck
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
                    createdAt: Date.now(),
                    hostId: auth.currentUser.uid,
                    players: [name],
                    lastUpdated: Date.now()
                });

                currentRoomId = roomCode;
                currentPlayerId = name;

                showRoomInfo(roomCode);
                listenToPlayers(roomCode);
                
                console.log("✅ Room created successfully:", roomCode);
                await initializeSharedDeck(roomCode);
                listenToDeckChanges(roomCode);
                return;
            } catch (error) {
                console.warn(`Room creation attempt failed (${retries} retries left):`, error);
                if (error.code === 'permission-denied') {
                    console.error("Permission denied. Please check Firebase rules and authentication.");
                    alert("Permission denied. Please ensure you're properly signed in.");
                    return;
                }
                retries--;
                if (retries === 0) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error("❌ Error creating room:", error);
        alert("Failed to create room. Please try again.");
    }
});

// Update room joining to listen to deck
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

        // Try to join room with retries
        let retries = 3;
        while (retries > 0) {
            try {
                const roomRef = doc(db, "rooms", roomCode);
                const roomSnap = await getDoc(roomRef);
                
                if (!roomSnap.exists()) {
                    alert("Room not found. Please check the room code.");
                    return;
                }

                // Update room with new player
                await setDoc(roomRef, {
                    players: [...(roomSnap.data().players || []), name],
                    lastUpdated: Date.now()
                }, { merge: true });

                currentRoomId = roomCode;
                currentPlayerId = name;

                showRoomInfo(roomCode);
                listenToPlayers(roomCode);
                
                console.log("✅ Joined room successfully:", roomCode);
                await initializeSharedDeck(roomCode);
                listenToDeckChanges(roomCode);
                return;
            } catch (error) {
                console.warn(`Room join attempt failed (${retries} retries left):`, error);
                if (error.code === 'permission-denied') {
                    console.error("Permission denied. Please check Firebase rules and authentication.");
                    alert("Permission denied. Please ensure you're properly signed in.");
                    return;
                }
                retries--;
                if (retries === 0) {
                    throw error;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    } catch (error) {
        console.error("❌ Error joining room:", error);
        alert("Failed to join room. Please try again.");
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
