// Wait for PIXI to be available
let PIXI;
let app = null;
let contextLostCount = 0;
const MAX_CONTEXT_LOST_RETRIES = 3;
let isRecoveringContext = false;
let hasInitialContextLoss = false;

async function waitForPixi() {
    console.log("Waiting for PIXI.js to load...");
    let retries = 0;
    const maxRetries = 10;
    
    while (!window.PIXI && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
        console.log(`Attempt ${retries}/${maxRetries} to load PIXI.js...`);
    }
    
    if (!window.PIXI) {
        throw new Error('Failed to load PIXI.js after multiple attempts');
    }
    
    PIXI = window.PIXI;
    console.log("PIXI.js loaded successfully");
    
    // Verify PIXI.js functionality
    if (!PIXI.Application) {
        throw new Error('PIXI.Application not found - incomplete PIXI.js load');
    }
    
    return PIXI;
}

// Board configuration
const GRID_SIZE = 20;
const CELL_SIZE = 50;
const BOARD_WIDTH = GRID_SIZE * CELL_SIZE;
const BOARD_HEIGHT = GRID_SIZE * CELL_SIZE;

// Create board instance
let boardInstance = null;

// Guest types configuration
const GUEST_TYPES = {
    rocker: {
        color: '#000000',
        icon: '🤘'
    },
    hopper: {
        color: '#3498db',
        icon: '🎤'
    },
    diva: {
        color: '#8b4513',
        icon: '💃'
    },
    princess: {
        color: '#e91e63',
        icon: '👸'
    },
    latino: {
        color: '#f39c12',
        icon: '💃'
    },
    raver: {
        color: '#2ecc71',
        icon: '🕺'
    }
};

async function initializeRenderer(options) {
    try {
        // Try Canvas first as it's more reliable
        options.forceCanvas = true;
        console.log("Attempting Canvas renderer initialization...");
        return new PIXI.Application(options);
    } catch (canvasError) {
        console.warn("Canvas initialization failed, trying WebGL:", canvasError);
        try {
            // Try WebGL as fallback
            options.forceCanvas = false;
            return new PIXI.Application(options);
        } catch (webglError) {
            console.error("All renderer initialization attempts failed:", webglError);
            throw new Error("Could not initialize any renderer");
        }
    }
}

// Add context recovery handling
function setupContextRecovery(app) {
    if (!app || !app.renderer) return;

    app.renderer.on('context', () => {
        console.log("WebGL context changed");
    });

    app.renderer.on('contextlost', (event) => {
        event.preventDefault(); // Prevent default handling
        console.log("WebGL context lost - attempting recovery");
        
        // Stop all rendering
        app.ticker.stop();
        
        // Clear the stage
        app.stage.removeChildren();
        
        setTimeout(async () => {
            try {
                // Attempt to reset the renderer
                if (app && app.renderer) {
                    await app.renderer.reset();
                    console.log("Renderer reset successful");
                    
                    // Restart rendering
                    app.ticker.start();
                    
                    // Reinitialize the board
                    initializeBoard();
                }
            } catch (error) {
                console.error("Failed to recover from context loss:", error);
                // Force page reload as last resort
                location.reload();
            }
        }, 1000);
    });

    app.renderer.on('contextrestored', () => {
        console.log("WebGL context restored");
        if (app && app.stage) {
            app.stage.removeChildren();
            initializeBoard();
        }
    });
}

class Board {
    constructor() {
        if (boardInstance) {
            return boardInstance;
        }
        
        this.boardContainer = null;
        this.gridContainer = null;
        this.piecesContainer = null;
        this.pieces = new Map();
        this.isDragging = false;
        this.draggedPiece = null;
        
        boardInstance = this;
    }

    async initialize() {
        console.log("Initializing board with HTML/CSS approach...");
        
        try {
            // Get the container
            this.boardContainer = document.getElementById('board-container');
            if (!this.boardContainer) {
                throw new Error('Board container not found');
            }
            
            // Clear existing content
            this.boardContainer.innerHTML = '';
            
            // Create grid container
            this.gridContainer = document.createElement('div');
            this.gridContainer.className = 'grid-container';
            this.boardContainer.appendChild(this.gridContainer);
            
            // Create pieces container
            this.piecesContainer = document.createElement('div');
            this.piecesContainer.className = 'pieces-container';
            this.boardContainer.appendChild(this.piecesContainer);
            
            // Create grid cells
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    this.gridContainer.appendChild(cell);
                }
            }
            
            // Initialize control buttons
            this.initializeControlButtons();
            
            // Add drag and drop handlers
            this.setupDragAndDrop();
            
            // Add mutation observer to reinitialize drag and drop when game area becomes visible
            const gameArea = document.querySelector('.game-area');
            if (gameArea) {
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            if (gameArea.style.display === 'block') {
                                console.log("Game area visible, reinitializing drag and drop");
                                this.setupDragAndDrop();
                            }
                        }
                    });
                });
                observer.observe(gameArea, { attributes: true });
            }
            
            console.log("Board initialized successfully!");
            return true;
        } catch (error) {
            console.error("Error initializing board:", error);
            return false;
        }
    }

    initializeControlButtons() {
        const resetViewBtn = document.getElementById('reset-view-btn');
        const toggleGridBtn = document.getElementById('toggle-grid-btn');

        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetView();
            });
        }

        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => {
                this.toggleGrid();
            });
        }

        console.log("Control buttons initialized");
    }

    resetView() {
        this.gridContainer.style.transform = 'scale(1)';
        this.gridContainer.style.translate = '0px 0px';
        this.piecesContainer.style.transform = 'scale(1)';
        this.piecesContainer.style.translate = '0px 0px';
    }

    toggleGrid() {
        this.gridContainer.classList.toggle('hidden');
    }

    setupDragAndDrop() {
        let isDragging = false;
        let startX, startY;
        let scrollLeft, scrollTop;

        // Pan functionality
        this.boardContainer.addEventListener('mousedown', (e) => {
            if (!e.target.classList.contains('board-piece') && !e.target.classList.contains('piece')) {
                isDragging = true;
                this.boardContainer.style.cursor = 'grabbing';
                startX = e.pageX - this.boardContainer.offsetLeft;
                startY = e.pageY - this.boardContainer.offsetTop;
                scrollLeft = this.boardContainer.scrollLeft;
                scrollTop = this.boardContainer.scrollTop;
            }
        });

        this.boardContainer.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - this.boardContainer.offsetLeft;
            const y = e.pageY - this.boardContainer.offsetTop;
            const moveX = (x - startX);
            const moveY = (y - startY);

            this.boardContainer.scrollLeft = scrollLeft - moveX;
            this.boardContainer.scrollTop = scrollTop - moveY;
        });

        this.boardContainer.addEventListener('mouseup', () => {
            isDragging = false;
            this.boardContainer.style.cursor = 'grab';
        });

        this.boardContainer.addEventListener('mouseleave', () => {
            isDragging = false;
            this.boardContainer.style.cursor = 'grab';
        });

        // Zoom functionality
        this.boardContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const scale = e.deltaY > 0 ? 0.9 : 1.1;
            const currentScale = parseFloat(this.gridContainer.style.transform.replace('scale(', '')) || 1;
            const newScale = Math.min(Math.max(currentScale * scale, 0.5), 2);
            
            this.gridContainer.style.transform = `scale(${newScale})`;
            this.piecesContainer.style.transform = `scale(${newScale})`;
        });

        // Setup drag and drop for guest pieces
        const guestPieces = document.querySelectorAll('.piece');
        guestPieces.forEach(piece => {
            piece.setAttribute('draggable', true);
            
            piece.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', piece.dataset.type);
                piece.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            piece.addEventListener('dragend', () => {
                piece.classList.remove('dragging');
            });
        });

        // Handle dropping on the board
        this.boardContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Calculate grid position for preview
            const rect = this.boardContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const gridX = Math.floor(x / CELL_SIZE);
            const gridY = Math.floor(y / CELL_SIZE);
            
            // Highlight the target cell
            const cells = this.gridContainer.querySelectorAll('.grid-cell');
            cells.forEach(cell => cell.classList.remove('drop-target'));
            if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
                const targetCell = this.gridContainer.children[gridY * GRID_SIZE + gridX];
                if (targetCell) {
                    targetCell.classList.add('drop-target');
                }
            }
        });

        this.boardContainer.addEventListener('dragleave', () => {
            // Remove all drop target highlights
            const cells = this.gridContainer.querySelectorAll('.grid-cell');
            cells.forEach(cell => cell.classList.remove('drop-target'));
        });

        this.boardContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Remove all drop target highlights
            const cells = this.gridContainer.querySelectorAll('.grid-cell');
            cells.forEach(cell => cell.classList.remove('drop-target'));
            
            const pieceType = e.dataTransfer.getData('text/plain');
            const rect = this.boardContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate grid position
            const gridX = Math.floor(x / CELL_SIZE);
            const gridY = Math.floor(y / CELL_SIZE);
            
            // Only place if within grid bounds
            if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
                const piece = this.createPiece(pieceType);
                piece.style.left = `${gridX * CELL_SIZE}px`;
                piece.style.top = `${gridY * CELL_SIZE}px`;
                this.piecesContainer.appendChild(piece);
            }
        });
    }

    createPiece(type) {
        const piece = document.createElement('div');
        piece.className = `board-piece ${type}`;
        piece.style.width = `${CELL_SIZE}px`;
        piece.style.height = `${CELL_SIZE}px`;
        piece.style.position = 'absolute';
        piece.style.display = 'flex';
        piece.style.alignItems = 'center';
        piece.style.justifyContent = 'center';
        piece.style.fontSize = `${CELL_SIZE * 0.6}px`;
        piece.style.cursor = 'grab';
        piece.style.userSelect = 'none';
        piece.style.zIndex = '10';
        piece.setAttribute('draggable', true);

        // Add the guest type's emoji
        piece.innerHTML = GUEST_TYPES[type].icon;

        // Make the piece draggable within the board
        piece.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', type);
            piece.classList.add('dragging');
        });

        piece.addEventListener('dragend', () => {
            piece.classList.remove('dragging');
        });

        return piece;
    }

    snapToGrid(x, y) {
        return {
            x: Math.round(x / CELL_SIZE) * CELL_SIZE,
            y: Math.round(y / CELL_SIZE) * CELL_SIZE
        };
    }
}

// Initialize board function
const initializeBoard = async () => {
    if (!boardInstance) {
        boardInstance = new Board();
    }
    return boardInstance.initialize();
};

// Get board instance
const getBoard = () => boardInstance;

// Export both the class and helper functions
export { Board, initializeBoard, getBoard };

// Initialize board when document is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeBoard();
        console.log("Board setup complete!");
    } catch (error) {
        console.error("Board initialization failed:", error);
    }
}); 