// Game State UI Components
import { GAME_OUTCOME } from './gameStates.js';

class StateUI {
    constructor() {
        this.lastTurnBanner = null;
        this.createLastTurnBanner();
    }

    createLastTurnBanner() {
        this.lastTurnBanner = document.createElement('div');
        this.lastTurnBanner.className = 'last-turn-banner';
        this.lastTurnBanner.innerHTML = `
            <div class="banner-content">
                <div class="scrolling-text">LAST TURN • LAST TURN • LAST TURN • LAST TURN • LAST TURN</div>
            </div>
        `;
        document.body.appendChild(this.lastTurnBanner);

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .last-turn-banner {
                position: fixed;
                top: 50%;
                left: 0;
                width: 100%;
                height: 50px;
                background: linear-gradient(90deg, 
                    #ff0000, #ff7f00, #ffff00, #00ff00, 
                    #0000ff, #4b0082, #8f00ff
                );
                background-size: 700% 100%;
                animation: rainbow 15s linear infinite;
                z-index: 100;
                display: none;
                pointer-events: none;
            }

            .banner-content {
                width: 100%;
                height: 100%;
                overflow: hidden;
                position: relative;
            }

            .scrolling-text {
                position: absolute;
                white-space: nowrap;
                font-size: 30px;
                font-weight: bold;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                animation: scroll 20s linear infinite;
                padding: 8px 0;
            }

            @keyframes rainbow {
                0% { background-position: 0% 50%; }
                100% { background-position: 700% 50%; }
            }

            @keyframes scroll {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }

            .game-over-popup, .winner-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                color: white;
                padding: 20px;
                overflow-y: auto;
            }

            .game-over-popup {
                background: rgba(139, 0, 0, 0.95);
            }

            .winner-popup {
                background: rgba(0, 100, 0, 0.95);
            }

            .popup-content {
                max-width: 800px;
                width: 90%;
                text-align: center;
            }

            .popup-title {
                font-size: 48px;
                margin-bottom: 20px;
                color: #FFD700;
            }

            .popup-subtitle {
                font-size: 24px;
                margin-bottom: 30px;
            }

            .stats-section {
                margin: 20px 0;
                padding: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
            }

            .new-game-btn {
                margin-top: 20px;
                padding: 15px 30px;
                font-size: 20px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background 0.3s;
            }

            .new-game-btn:hover {
                background: #45a049;
            }
        `;
        document.head.appendChild(style);
    }

    showLastTurnBanner() {
        if (this.lastTurnBanner) {
            this.lastTurnBanner.style.display = 'block';
        }
    }

    hideLastTurnBanner() {
        if (this.lastTurnBanner) {
            this.lastTurnBanner.style.display = 'none';
        }
    }

    showGameOverPopup() {
        const popup = document.createElement('div');
        popup.className = 'game-over-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <h1 class="popup-title">GAME OVER</h1>
                <p class="popup-subtitle">Your party was a total disaster!</p>
                <button class="new-game-btn" onclick="window.location.reload()">NEW GAME</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    showWinnerPopup(stats) {
        const popup = document.createElement('div');
        popup.className = 'winner-popup';
        
        let playerStatsHTML = '';
        for (const [playerName, playerStats] of Object.entries(stats.playerStats)) {
            playerStatsHTML += `
                <div class="stats-section">
                    <h3>${playerName}'s Stats</h3>
                    <p>Coins: ${playerStats.coins || 0}</p>
                    <p>Party Goal: ${playerStats.partyGoal || 'None'}</p>
                    <p>Fuckups Resolved: ${playerStats.fuckupsResolved || 0}</p>
                    <p>Actions Played: ${playerStats.actionsPlayed || 0}</p>
                    <p>Mini Missions Completed: ${playerStats.miniMissionsCompleted || 0}</p>
                </div>
            `;
        }

        popup.innerHTML = `
            <div class="popup-content">
                <h1 class="popup-title">Your party is officially EPIC</h1>
                <p class="popup-subtitle">
                    Congratulations, you people were able to put together the party of the season, 
                    everyone will be talking about tonight for the rest of the year!
                </p>
                <p>Your party had ${stats.totalStats.guestCount || 0} guests</p>
                
                <div class="stats-section">
                    <h2>Player Stats</h2>
                    ${playerStatsHTML}
                </div>

                <div class="stats-section">
                    <h2>Party Stats</h2>
                    <p>Most Popular Genre: ${stats.musicStats.mostPopularGenre}</p>
                    <p>Total Mini Missions: ${stats.totalStats.totalMiniMissions}</p>
                    <p>Total Coins: ${stats.totalStats.totalCoins}</p>
                    <p>Fastest Player: ${stats.playerPerformance.fastest}</p>
                    <p>Slowest Player: ${stats.playerPerformance.slowest}</p>
                </div>

                <button class="new-game-btn" onclick="window.location.reload()">NEW GAME</button>
            </div>
        `;
        document.body.appendChild(popup);
    }
}

export const stateUI = new StateUI(); 