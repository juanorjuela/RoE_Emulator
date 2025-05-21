// Game States Management
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const GAME_OUTCOME = {
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
        const roomData = roomDoc.data();

        // Check if we're in last turn state
        if (guestCount >= targetCount) {
            if (!this.lastTurnActivated) {
                // Activate last turn state
                await updateDoc(roomRef, {
                    gameOutcome: GAME_OUTCOME.LAST_TURN,
                    lastTurnStarted: Date.now(),
                    playersCompletedLastTurn: []
                });
                this.lastTurnActivated = true;
            }

            // Check if all players have completed their last turn
            const allPlayersCompleted = roomData.playersCompletedLastTurn?.length === roomData.players?.length;
            if (allPlayersCompleted) {
                return GAME_OUTCOME.WIN;
            }
            return GAME_OUTCOME.LAST_TURN;
        } else if (this.lastTurnActivated) {
            // Deactivate last turn if guest count drops below target
            this.lastTurnActivated = false;
            await updateDoc(roomRef, {
                gameOutcome: GAME_OUTCOME.IN_PROGRESS,
                lastTurnStarted: null,
                playersCompletedLastTurn: []
            });
        }

        return GAME_OUTCOME.IN_PROGRESS;
    }

    async markPlayerLastTurnComplete(playerName) {
        if (!this.currentRoomId || !this.lastTurnActivated) return;

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        await updateDoc(roomRef, {
            playersCompletedLastTurn: arrayUnion(playerName)
        });
    }
}

export const gameStateManager = new GameStateManager();
export { GAME_OUTCOME }; 