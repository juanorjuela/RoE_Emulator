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
                    z-index: 0;
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
        // Get global references
        const currentRoomId = window.currentRoomId;
        const db = window.db;
        
        // Pause game elements and game loop
        clearInterval(window.turnTimer);
        const turnStartPopup = document.querySelector('.turn-start-popup');
        if (turnStartPopup) turnStartPopup.style.display = 'none';
        
        // Clear any active timers
        const timerContainer = document.querySelector('.timer-container');
        if (timerContainer) timerContainer.style.display = 'none';

        // Create and start confetti
        const confetti = document.createElement('canvas');
        confetti.id = 'confetti-canvas';
        confetti.style.position = 'fixed';
        confetti.style.top = '0';
        confetti.style.left = '0';
        confetti.style.width = '100%';
        confetti.style.height = '100%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999999999999';
        document.body.appendChild(confetti);

        const popup = document.createElement('div');
        popup.className = 'winner-popup';
        popup.innerHTML = `
            <div class="winner-content">
                <div class="party-goals-review">
                    <h3>Review Your Party Goals</h3>
                    <div id="party-goals-container"></div>
                    <button class="resolve-goals-btn">Resolve Party Goals</button>
                </div>

                <div class="celebration-title">
                    <h1 class="animate-pop">Your party is officially EPIC</h1>
                    <div class="party-emoji animate-bounce">🎉</div>
                </div>
                <p class="animate-fade-in">Congratulations, you people were able to put together the party of the season, everyone will be talking about tonight for the rest of the year!</p>
                
                <h2 class="guest-count animate-slide-up">Your party had <span class="highlight">${stats.guestCount || 0}</span> guests</h2>
                
                <div class="stats-section">
                    <h3 class="animate-slide-up">Player Stats</h3>
                    <div id="player-stats-container">
                        <ul class="animate-stats">
                            <li class="stat-item">Coins Achieved: <span class="highlight">${stats.playerStats?.coins || 0}</span></li>
                            <li class="stat-item">Party Goals: <span class="highlight">${stats.playerStats?.completedGoals?.join(', ') || 'None'}</span></li>
                            <li class="stat-item">Fuckups Resolved: <span class="highlight">${stats.playerStats?.fuckupsResolved || 0}</span></li>
                            <li class="stat-item">Actions Played: <span class="highlight">${stats.playerStats?.actionsPlayed || 0}</span></li>
                            <li class="stat-item">Mini Missions Resolved: <span class="highlight">${stats.playerStats?.miniMissionsResolved || 0}</span></li>
                        </ul>
                    </div>

                    <h3 class="animate-slide-up">Party Stats</h3>
                    <ul class="animate-stats">
                        <li class="stat-item">Playlist: <span class="highlight">${stats.musicStats?.playlist?.map(entry => entry.type).join(', ') || 'No songs played'}</span></li>
                        <li class="stat-item">Most Popular Genre: <span class="highlight">${stats.musicStats?.mostPopularGenre || 'N/A'}</span></li>
                        <li class="stat-item">Total Mini Missions: <span class="highlight">${stats.totalStats?.totalMiniMissions || 0}</span></li>
                        <li class="stat-item">Total Coins: <span class="highlight">${stats.totalStats?.totalCoins || 0}</span></li>
                        <li class="stat-item">Fastest Player: <span class="highlight">${stats.playerPerformance?.fastest || 'N/A'}</span></li>
                        <li class="stat-item">Slowest Player: <span class="highlight">${stats.playerPerformance?.slowest || 'N/A'}</span></li>
                    </ul>
                </div>

                <button class="new-game-btn animate-pop">NEW GAME</button>
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
                z-index: 999999;
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
                box-shadow: 0 0 50px rgba(46, 204, 113, 0.3);
            }

            .celebration-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 20px;
                margin-bottom: 30px;
            }

            .party-emoji {
                font-size: 48px;
            }

            .winner-content h1 {
                color: #2ecc71;
                margin-bottom: 20px;
                font-size: 36px;
            }

            .highlight {
                color: #2ecc71;
                font-weight: bold;
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
                padding: 15px;
                background: rgba(46, 204, 113, 0.1);
                border-radius: 10px;
                transform: translateX(-50px);
                opacity: 0;
                animation: slideIn 0.5s ease forwards;
            }

            .stats-section li:nth-child(1) { animation-delay: 0.1s; }
            .stats-section li:nth-child(2) { animation-delay: 0.2s; }
            .stats-section li:nth-child(3) { animation-delay: 0.3s; }
            .stats-section li:nth-child(4) { animation-delay: 0.4s; }
            .stats-section li:nth-child(5) { animation-delay: 0.5s; }
            .stats-section li:nth-child(6) { animation-delay: 0.6s; }

            .new-game-btn {
                margin-top: 30px;
                padding: 15px 30px;
                font-size: 18px;
                background: #2ecc71;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
                transform: scale(1);
            }

            .new-game-btn:hover {
                background: #27ae60;
                transform: scale(1.05);
                box-shadow: 0 5px 15px rgba(46, 204, 113, 0.3);
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideIn {
                from { 
                    transform: translateX(-50px);
                    opacity: 0;
                }
                to { 
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .animate-pop {
                animation: pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }

            .animate-bounce {
                animation: bounce 2s infinite;
            }

            .animate-fade-in {
                opacity: 0;
                animation: fadeIn 1s ease forwards;
                animation-delay: 0.5s;
            }

            .animate-slide-up {
                opacity: 0;
                transform: translateY(20px);
                animation: slideUp 0.5s ease forwards;
                animation-delay: 0.7s;
            }

            @keyframes pop {
                0% { transform: scale(0); }
                80% { transform: scale(1.1); }
                100% { transform: scale(1); }
            }

            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-20px); }
                60% { transform: translateY(-10px); }
            }

            @keyframes slideUp {
                from { 
                    transform: translateY(20px);
                    opacity: 0;
                }
                to { 
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .party-goals-review {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 255, 255, 0.95);
                padding: 20px;
                border-radius: 10px;
                max-width: 300px;
                text-align: left;
                box-shadow: 0 0 20px rgba(46, 204, 113, 0.2);
            }

            .party-goal-card {
                background: rgba(46, 204, 113, 0.1);
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border: 1px solid rgba(46, 204, 113, 0.2);
            }

            .player-name {
                font-weight: bold;
                color: #2ecc71;
                margin-bottom: 5px;
            }

            .goal-text {
                margin-bottom: 10px;
            }

            .goal-status {
                display: flex;
                gap: 10px;
            }

            .goal-status-btn {
                padding: 5px 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: transform 0.2s ease;
            }

            .goal-status-btn:hover {
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(style);

        // Add the popup to the document
        document.body.appendChild(popup);

        // Initialize confetti
        const ctx = confetti.getContext('2d');
        const confettiPieces = [];
        const colors = ['#2ecc71', '#3498db', '#e74c3c', '#f1c40f', '#9b59b6'];
        
        function createConfetti() {
            return {
                x: Math.random() * confetti.width,
                y: -20,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 3 + 2,
                angle: Math.random() * 6.28,
                spin: Math.random() * 0.2 - 0.1
            };
        }

        function drawConfetti() {
            ctx.clearRect(0, 0, confetti.width, confetti.height);
            
            if (confettiPieces.length < 100) {
                confettiPieces.push(createConfetti());
            }

            for (let i = confettiPieces.length - 1; i >= 0; i--) {
                const piece = confettiPieces[i];
                
                piece.y += piece.speed;
                piece.angle += piece.spin;
                
                ctx.save();
                ctx.translate(piece.x, piece.y);
                ctx.rotate(piece.angle);
                ctx.fillStyle = piece.color;
                ctx.fillRect(-piece.size/2, -piece.size/2, piece.size, piece.size);
                ctx.restore();
                
                if (piece.y > confetti.height + 20) {
                    confettiPieces.splice(i, 1);
                }
            }
            
            requestAnimationFrame(drawConfetti);
        }

        // Set canvas size
        function resizeCanvas() {
            confetti.width = window.innerWidth;
            confetti.height = window.innerHeight;
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        drawConfetti();

        // Add click handler for goal status buttons
        popup.addEventListener('click', async (e) => {
            if (e.target.classList.contains('goal-status-btn')) {
                const goalCard = e.target.closest('.party-goal-card');
                const goalText = goalCard.querySelector('.goal-text').textContent;
                const status = e.target.dataset.status;
                const coinMatch = goalText.match(/\((\d+)\s*coins\)/i);
                const coinValue = coinMatch ? parseInt(coinMatch[1]) : 0;

                // Update stats based on goal completion
                if (status === 'success') {
                    const roomRef = doc(db, "rooms", currentRoomId);
                    await runTransaction(db, async (transaction) => {
                        const roomDoc = await transaction.get(roomRef);
                        const roomData = roomDoc.data();
                        const playerStats = roomData.playerStats || {};
                        const myStats = playerStats[currentPlayerId] || {
                            coins: 0,
                            completedGoals: [],
                            fuckupsResolved: 0,
                            actionsPlayed: 0,
                            miniMissionsResolved: 0
                        };

                        myStats.coins = (myStats.coins || 0) + coinValue;
                        myStats.completedGoals = myStats.completedGoals || [];
                        myStats.completedGoals.push(goalText);
                        playerStats[currentPlayerId] = myStats;

                        transaction.update(roomRef, { playerStats });

                        // Update the stats display
                        const statsContainer = document.getElementById('player-stats-container');
                        statsContainer.innerHTML = `
                            <ul class="animate-stats">
                                <li class="stat-item">Coins Achieved: <span class="highlight">${myStats.coins}</span></li>
                                <li class="stat-item">Party Goals: <span class="highlight">${myStats.completedGoals.join(', ')}</span></li>
                                <li class="stat-item">Fuckups Resolved: <span class="highlight">${myStats.fuckupsResolved}</span></li>
                                <li class="stat-item">Actions Played: <span class="highlight">${myStats.actionsPlayed}</span></li>
                                <li class="stat-item">Mini Missions Resolved: <span class="highlight">${myStats.miniMissionsResolved}</span></li>
                            </ul>
                        `;
                    });
                }

                // Remove the goal card after resolution
                goalCard.style.animation = 'fadeOut 0.5s ease forwards';
                setTimeout(() => goalCard.remove(), 500);

                // If no more goals to review, hide the review section
                const remainingGoals = popup.querySelectorAll('.party-goal-card').length;
                if (remainingGoals <= 1) {
                    const reviewSection = popup.querySelector('.party-goals-review');
                    reviewSection.style.animation = 'fadeOut 0.5s ease forwards';
                    setTimeout(() => reviewSection.remove(), 500);
                }
            }
        });

        // Add click handler for new game button
        popup.querySelector('.new-game-btn').addEventListener('click', () => {
            window.location.reload();
        });

        // Fetch and display party goals
        if (currentRoomId) {
            const roomRef = doc(db, "rooms", currentRoomId);
            getDoc(roomRef).then(roomDoc => {
                if (roomDoc.exists()) {
                    const roomData = roomDoc.data();
                    const playerGoals = roomData.playerGoals || {};
                    const myGoals = playerGoals[currentPlayerId]?.goals || [];
                    const goalsContainer = popup.querySelector('#party-goals-container');
                    
                    myGoals.forEach(goal => {
                        if (goal.chosen) {
                            const goalCard = document.createElement('div');
                            goalCard.className = 'party-goal-card';
                            const goalText = goal.text || goal;
                            goalCard.innerHTML = `
                                <div class="player-name">${currentPlayerId}'s Goal</div>
                                <div class="goal-text">${goalText}</div>
                                <div class="goal-status">
                                    <button class="goal-status-btn" data-status="success">✅ Achieved</button>
                                    <button class="goal-status-btn" data-status="fail">❌ Failed</button>
                                </div>
                            `;
                            goalsContainer.appendChild(goalCard);
                        }
                    });
                }
            });
        }
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