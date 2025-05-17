// Import Firebase modules
import { getFirestore, doc, getDoc, updateDoc, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Import game constants
import { GAME_STATES } from './constants.js';

// Bot Configuration
const BOT_NAMES = [
    "RaveBot 🤖",
    "PartyAI 🎉",
    "DanceBot 💃",
    "RoboRaver 🦾",
    "TechnoTron 🎧",
    "DiscoBot 🕺",
    "BeatBot 🎵",
    "GrooveAI 🌟"
];

// Get Firebase instances from window
const db = window.db;
const auth = window.auth;

// Add delay utility
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Export the bot class
export class RaveTycoonBot {
    constructor(roomId) {
        this.roomId = roomId;
        this.botName = this.generateBotName();
        this.hand = [];
        this.isPlaying = false;
        this.unsubscribe = null;
    }

    generateBotName() {
        const randomIndex = Math.floor(Math.random() * BOT_NAMES.length);
        return BOT_NAMES[randomIndex];
    }

    async join() {
        try {
            const roomRef = doc(db, "rooms", this.roomId);
            const roomDoc = await getDoc(roomRef);
            
            if (!roomDoc.exists()) {
                throw new Error("Room not found");
            }

            const roomData = roomDoc.data();
            const players = roomData.players || [];

            if (!players.includes(this.botName)) {
                await updateDoc(roomRef, {
                    players: [...players, this.botName]
                });
                console.log(`${this.botName} joined room ${this.roomId}`);
            }

            // Start listening for game state changes
            this.startListening();
            return true;
        } catch (error) {
            console.error(`Error joining room:`, error);
            return false;
        }
    }

    async startListening() {
        const roomRef = doc(db, "rooms", this.roomId);
        
        this.unsubscribe = onSnapshot(roomRef, async (doc) => {
            if (!doc.exists()) return;
            
            const roomData = doc.data();
            const currentTurn = roomData.currentTurn;
            const gameState = roomData.gameState;

            if (gameState === GAME_STATES.STARTED && currentTurn === this.botName && !this.isPlaying) {
                this.isPlaying = true;
                await this.playTurn();
                this.isPlaying = false;
            }
        });
    }

    async drawActionCards() {
        const cardsNeeded = 6 - this.hand.length;
        if (cardsNeeded <= 0) return;
        
        const drawnCards = await window.drawFromDeck('actions', cardsNeeded);
        await delay(500); // Add delay after drawing cards
        this.hand.push(...drawnCards);
        console.log(`${this.botName} drew ${drawnCards.length} cards`);
    }

    async drawMiniMission() {
        await window.drawFromDeck('miniMissions', 1);
        await delay(500); // Add delay after drawing mini mission
        console.log(`${this.botName} drew a mini mission`);
    }

    async drawFckupCard() {
        await window.drawFromDeck('fuckups', 1);
        await delay(500); // Add delay after drawing FCKUP card
        console.log(`${this.botName} drew a FCKUP card`);
    }

    async playRandomCard() {
        if (this.hand.length === 0) return;
        
        await delay(500); // Add delay before playing card
        
        // Play a random card from hand
        const cardIndex = Math.floor(Math.random() * this.hand.length);
        const playedCard = this.hand.splice(cardIndex, 1)[0];
        
        await window.discardToPile('actions', [playedCard]);
        console.log(`${this.botName} played card: ${playedCard}`);
        
        await delay(500); // Add delay after playing card
    }

    async playTurn() {
        try {
            // Show loading overlay
            const loadingOverlay = document.querySelector('.loading-overlay');
            const currentPlayerMessage = document.querySelector('.current-player-message');
            if (loadingOverlay && currentPlayerMessage) {
                currentPlayerMessage.textContent = `${this.botName} is playing...`;
                loadingOverlay.classList.add('visible');
            }

            // Add initial delay before starting turn
            await delay(1000);
            
            // Draw action cards if needed
            await this.drawActionCards();
            
            // 50% chance to draw a mini mission
            if (Math.random() < 0.5) {
                await this.drawMiniMission();
            }
            
            // 30% chance to draw a FCKUP card
            if (Math.random() < 0.3) {
                await this.drawFckupCard();
            }
            
            // Play 1-2 random cards
            const cardsToPlay = Math.min(1 + Math.floor(Math.random() * 2), this.hand.length);
            for (let i = 0; i < cardsToPlay; i++) {
                await this.playRandomCard();
            }
            
            // Add final delay before ending turn
            await delay(1000);
            
            // End turn
            const roomRef = doc(db, "rooms", this.roomId);
            const roomDoc = await getDoc(roomRef);
            
            if (!roomDoc.exists()) return;
            
            const roomData = roomDoc.data();
            const playerOrder = roomData.playerOrder || [];
            const currentIndex = playerOrder.indexOf(this.botName);
            const nextPlayer = playerOrder[(currentIndex + 1) % playerOrder.length];
            
            await updateDoc(roomRef, {
                currentTurn: nextPlayer,
                turnStartTime: Date.now()
            });

            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.classList.remove('visible');
            }
            
        } catch (error) {
            console.error(`Error during ${this.botName}'s turn:`, error);
            // Hide loading overlay on error
            const loadingOverlay = document.querySelector('.loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.classList.remove('visible');
            }
        }
    }

    disconnect() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
    }
} 