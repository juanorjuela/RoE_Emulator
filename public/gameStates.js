// Game States Management
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const GAME_OUTCOME = {
    IN_PROGRESS: 'in_progress',
    LAST_TURN: 'last_turn',
    WIN: 'win',
    LOSE: 'lose'
};

class GameStateManager {
    constructor() {
        this.db = getFirestore();
        this.currentRoomId = null;
        this.lastTurnActivated = false;
        this.playersCompletedLastTurn = new Set();
    }

    initialize(roomId) {
        this.currentRoomId = roomId;
    }

    async checkGameState(guestCount, targetCount, initialCount) {
        if (!this.currentRoomId) return GAME_OUTCOME.IN_PROGRESS;

        // Check lose condition first
        if (guestCount < (initialCount / 2)) {
            return GAME_OUTCOME.LOSE;
        }

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) return GAME_OUTCOME.IN_PROGRESS;

        const roomData = roomDoc.data();
        const currentOutcome = roomData.gameOutcome || GAME_OUTCOME.IN_PROGRESS;
        const playersCompletedLastTurn = roomData.playersCompletedLastTurn || [];
        const allPlayers = roomData.players || [];
        const currentTurn = roomData.currentTurn;
        const lastTurnTriggeredBy = roomData.lastTurnTriggeredBy;

        // If we're already in LAST_TURN state
        if (currentOutcome === GAME_OUTCOME.LAST_TURN) {
            // Check if guest count dropped below target during someone's turn
            if (guestCount < targetCount) {
                // Only reset after the current player's turn is complete
                if (playersCompletedLastTurn.includes(currentTurn)) {
                    await this.resetLastTurnState();
                    return GAME_OUTCOME.IN_PROGRESS;
                }
            }
            
            // Check if all players have completed their last turn
            // Make sure the triggering player also gets their last turn
            const allPlayersHadLastTurn = allPlayers.every(player => 
                playersCompletedLastTurn.includes(player) || 
                (player === lastTurnTriggeredBy && playersCompletedLastTurn.length === allPlayers.length - 1)
            );

            if (allPlayersHadLastTurn) {
                // If guest count is still at or above target after all players had their last turn
                if (guestCount >= targetCount) {
                    return GAME_OUTCOME.WIN;
                } else {
                    // Reset last turn state if guest count dropped below target
                    await this.resetLastTurnState();
                    return GAME_OUTCOME.IN_PROGRESS;
                }
            }
            // Continue last turn state until all players have had their turn
            return GAME_OUTCOME.LAST_TURN;
        }

        // Check if we should enter last turn state
        // We'll mark this turn as the triggering turn, but not activate last turn state yet
        if (guestCount >= targetCount && currentOutcome === GAME_OUTCOME.IN_PROGRESS && !roomData.pendingLastTurn) {
            await updateDoc(roomRef, {
                pendingLastTurn: true,
                lastTurnTriggeredBy: currentTurn
            });
        }

        return GAME_OUTCOME.IN_PROGRESS;
    }

    async initializeLastTurnState() {
        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const roomDoc = await getDoc(roomRef);
        const roomData = roomDoc.data();
        
        await updateDoc(roomRef, {
            gameOutcome: GAME_OUTCOME.LAST_TURN,
            playersCompletedLastTurn: [],
            lastTurnStartTime: Date.now(),
            pendingLastTurn: false,
            lastTurnTriggeredBy: roomData.lastTurnTriggeredBy || null
        });
    }

    async resetLastTurnState() {
        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        await updateDoc(roomRef, {
            gameOutcome: GAME_OUTCOME.IN_PROGRESS,
            playersCompletedLastTurn: [],
            lastTurnStartTime: null,
            pendingLastTurn: false,
            lastTurnTriggeredBy: null
        });
    }

    async markPlayerLastTurnComplete(playerName) {
        if (!this.currentRoomId || !playerName) return;

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const roomDoc = await getDoc(roomRef);
        if (!roomDoc.exists()) return;

        const roomData = roomDoc.data();
        const playersCompletedLastTurn = roomData.playersCompletedLastTurn || [];

        if (!playersCompletedLastTurn.includes(playerName)) {
            await updateDoc(roomRef, {
                playersCompletedLastTurn: [...playersCompletedLastTurn, playerName]
            });
        }
    }
}

export const gameStateManager = new GameStateManager(); 