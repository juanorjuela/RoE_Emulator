// Game Statistics Management
import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

class StatisticsManager {
    constructor() {
        this.db = getFirestore();
        this.currentRoomId = null;
    }

    initialize(roomId) {
        this.currentRoomId = roomId;
    }

    async updatePlayerStats(playerName, statType, value) {
        if (!this.currentRoomId) return;

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const statsUpdate = {};
        statsUpdate[`playerStats.${playerName}.${statType}`] = value;
        await updateDoc(roomRef, statsUpdate);
    }

    async incrementPlayerStat(playerName, statType) {
        if (!this.currentRoomId) return;

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const roomDoc = await getDoc(roomRef);
        const currentStats = roomDoc.data()?.playerStats?.[playerName] || {};
        const currentValue = currentStats[statType] || 0;

        const statsUpdate = {};
        statsUpdate[`playerStats.${playerName}.${statType}`] = currentValue + 1;
        await updateDoc(roomRef, statsUpdate);
    }

    async updateTurnTime(playerName, turnDuration) {
        if (!this.currentRoomId) return;

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const roomDoc = await getDoc(roomRef);
        const currentStats = roomDoc.data()?.playerStats?.[playerName] || {};
        
        const turns = currentStats.turns || [];
        turns.push(turnDuration);
        
        const averageTurnTime = turns.reduce((a, b) => a + b, 0) / turns.length;
        
        await updateDoc(roomRef, {
            [`playerStats.${playerName}.turns`]: turns,
            [`playerStats.${playerName}.averageTurnTime`]: averageTurnTime
        });
    }

    async getGameStats() {
        if (!this.currentRoomId) return null;

        const roomRef = doc(this.db, "rooms", this.currentRoomId);
        const roomDoc = await getDoc(roomRef);
        const roomData = roomDoc.data();

        const musicHistory = roomData.musicHistory || [];
        const playerStats = roomData.playerStats || {};
        const guestCount = roomData.guestCount || 0;
        const currentPlayerId = window.currentPlayerId; // Get current player ID from global scope

        // Calculate most popular music genre
        const genreCounts = {};
        musicHistory.forEach(entry => {
            genreCounts[entry.type] = (genreCounts[entry.type] || 0) + 1;
        });
        const mostPopularGenre = Object.entries(genreCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

        // Calculate fastest and slowest players
        const playerTimes = Object.entries(playerStats)
            .map(([name, stats]) => ({
                name,
                averageTime: stats.averageTurnTime || 0
            }))
            .sort((a, b) => a.averageTime - b.averageTime);

        const fastestPlayer = playerTimes[0]?.name || 'None';
        const slowestPlayer = playerTimes[playerTimes.length - 1]?.name || 'None';

        // Calculate total stats
        const totalStats = Object.values(playerStats).reduce((acc, stats) => {
            acc.totalCoins += stats.coins || 0;
            acc.totalMiniMissions += stats.miniMissionsCompleted || 0;
            return acc;
        }, { totalCoins: 0, totalMiniMissions: 0 });

        // Get current player's stats
        const myStats = playerStats[currentPlayerId] || {
            coins: 0,
            completedGoals: [],
            fuckupsResolved: 0,
            actionsPlayed: 0,
            miniMissionsResolved: 0
        };

        return {
            guestCount,
            musicStats: {
                playlist: musicHistory,
                mostPopularGenre
            },
            playerPerformance: {
                fastest: fastestPlayer,
                slowest: slowestPlayer
            },
            totalStats,
            playerStats: myStats // Return current player's stats instead of all player stats
        };
    }
}

export const statisticsManager = new StatisticsManager(); 