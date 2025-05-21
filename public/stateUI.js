// Game State UI Components
import { GAME_OUTCOME } from './gameStates.js';

class StateUI {
    constructor() {
        this.lastTurnBanner = null;
        this.createLastTurnBanner();
    }

    createLastTurnBanner() {
        // Create the last turn banner if it doesn't exist
        if (!this.lastTurnBanner) {
            this.lastTurnBanner = document.createElement('div');
            this.lastTurnBanner.className = 'last-turn-banner';
            this.lastTurnBanner.innerHTML = `
                <div class="banner-content">
                    <div class="scrolling-text">LAST TURN • LAST TURN • LAST TURN • LAST TURN • LAST TURN</div>
                </div>
            `;
            document.body.appendChild(this.lastTurnBanner);

            // Add styles for the banner
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
                    z-index: 999;
                    display: none;
                    opacity: 0;
                    transition: opacity 0.5s ease;
                    animation: rainbow 15s linear infinite;
                }

                .last-turn-banner.visible {
                    display: block;
                    opacity: 0.8;
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
                    font-size: 24px;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
                    animation: scrollText 20s linear infinite;
                    width: max-content;
                    line-height: 50px;
                }

                @keyframes rainbow {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 700% 50%; }
                }

                @keyframes scrollText {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    showLastTurnBanner() {
        if (this.lastTurnBanner) {
            this.lastTurnBanner.classList.add('visible');
        }
    }

    hideLastTurnBanner() {
        if (this.lastTurnBanner) {
            this.lastTurnBanner.classList.remove('visible');
        }
    }

    showWinnerPopup(stats) {
        const popup = document.createElement('div');
        popup.className = 'winner-popup';
        popup.innerHTML = `
            <div class="winner-content">
                <h1>Your party is officially EPIC</h1>
                <p>Congratulations, you people were able to put together the party of the season, everyone will be talking about tonight for the rest of the year!</p>
                
                <h2>Your party had ${stats.finalGuestCount} guests</h2>
                
                <div class="stats-section">
                    <h3>Player Stats</h3>
                    <ul>
                        <li>Coins Achieved: ${stats.playerStats.coins || 0}</li>
                        <li>Party Goals: ${stats.playerStats.completedGoals || []}</li>
                        <li>Fuckups Resolved: ${stats.playerStats.fuckupsResolved || 0}</li>
                        <li>Actions Played: ${stats.playerStats.actionsPlayed || 0}</li>
                        <li>Mini Missions Resolved: ${stats.playerStats.miniMissionsResolved || 0}</li>
                    </ul>

                    <h3>Party Stats</h3>
                    <ul>
                        <li>Playlist: ${stats.partyStats.playlist.join(', ') || 'No songs played'}</li>
                        <li>Most Popular Genre: ${stats.partyStats.popularGenre || 'N/A'}</li>
                        <li>Total Mini Missions: ${stats.partyStats.totalMiniMissions || 0}</li>
                        <li>Total Coins: ${stats.partyStats.totalCoins || 0}</li>
                        <li>Most Common Fuckup: ${stats.partyStats.commonFuckup || 'N/A'}</li>
                        <li>Most Common Action: ${stats.partyStats.commonAction || 'N/A'}</li>
                        <li>Winning Party Goals: ${stats.partyStats.winningGoals.join(', ') || 'None'}</li>
                        <li>Slowest Player: ${stats.partyStats.slowestPlayer || 'N/A'}</li>
                        <li>Fastest Player: ${stats.partyStats.fastestPlayer || 'N/A'}</li>
                    </ul>
                </div>

                <button class="new-game-btn">NEW GAME</button>
            </div>
        `;

        // Add styles for the winner popup
        const style = document.createElement('style');
        style.textContent = `
            .winner-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.5s ease;
            }

            .winner-content {
                background: rgba(255, 255, 255, 0.95);
                padding: 40px;
                border-radius: 20px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                text-align: center;
            }

            .winner-content h1 {
                color: #2ecc71;
                margin-bottom: 20px;
            }

            .stats-section {
                text-align: left;
                margin-top: 30px;
            }

            .stats-section ul {
                list-style: none;
                padding: 0;
            }

            .stats-section li {
                margin: 10px 0;
                padding: 5px;
                background: rgba(46, 204, 113, 0.1);
                border-radius: 5px;
            }

            .new-game-btn {
                margin-top: 30px;
                padding: 15px 30px;
                font-size: 18px;
                background: #2ecc71;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: background 0.3s ease;
            }

            .new-game-btn:hover {
                background: #27ae60;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        // Add the popup to the document
        document.body.appendChild(popup);

        // Add click handler for new game button
        popup.querySelector('.new-game-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    showGameOverPopup() {
        const popup = document.createElement('div');
        popup.className = 'game-over-popup';
        popup.innerHTML = `
            <div class="game-over-content">
                <h1>GAME OVER</h1>
                <button class="new-game-btn">NEW GAME</button>
            </div>
        `;

        // Add styles for the game over popup
        const style = document.createElement('style');
        style.textContent = `
            .game-over-popup {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 1000;
                display: flex;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.5s ease;
            }

            .game-over-content {
                text-align: center;
            }

            .game-over-content h1 {
                color: #e74c3c;
                font-size: 72px;
                margin-bottom: 30px;
                text-shadow: 0 0 20px rgba(231, 76, 60, 0.5);
            }

            .game-over-popup .new-game-btn {
                padding: 15px 30px;
                font-size: 18px;
                background: #e74c3c;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: background 0.3s ease;
            }

            .game-over-popup .new-game-btn:hover {
                background: #c0392b;
            }
        `;
        document.head.appendChild(style);

        // Add the popup to the document
        document.body.appendChild(popup);

        // Add click handler for new game button
        popup.querySelector('.new-game-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }
}

export const stateUI = new StateUI(); 