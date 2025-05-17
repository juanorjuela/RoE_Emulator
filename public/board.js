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
        this.dragOffset = { x: 0, y: 0 };
        this.piecePositions = new Map();
        this.lastKnownPositions = new Map();
        this.scale = 1;
        this.position = { x: 0, y: 0 };
        this.onBoardStateChange = null;
        this.isDraggingFromSource = false;
        
        boardInstance = this;
    }

    async initialize() {
        console.log("Initializing board with HTML/CSS approach...");
        
        try {
            this.boardContainer = document.getElementById('board-container');
            if (!this.boardContainer) {
                throw new Error('Board container not found');
            }
            
            this.boardContainer.innerHTML = '';
            
            this.gridContainer = document.createElement('div');
            this.gridContainer.className = 'grid-container';
            this.boardContainer.appendChild(this.gridContainer);
            
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
            
            // Initialize pan and zoom
            this.initializePanAndZoom();
            
            // Initialize control buttons
            this.initializeControlButtons();
            
            // Add drag and drop handlers
            this.setupDragAndDrop();
            
            // Add mutation observer for board initialization
            this.setupMutationObserver();
            
            console.log("Board initialized successfully!");
            return true;
        } catch (error) {
            console.error("Error initializing board:", error);
            return false;
        }
    }

    initializePanAndZoom() {
        let isPanning = false;
        let startX, startY;
        let startPanX, startPanY;

        this.boardContainer.addEventListener('mousedown', (e) => {
            if (e.target === this.boardContainer || e.target === this.gridContainer) {
                isPanning = true;
                startX = e.clientX;
                startY = e.clientY;
                startPanX = this.position.x;
                startPanY = this.position.y;
                this.boardContainer.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isPanning) return;
            
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            this.position.x = startPanX + dx;
            this.position.y = startPanY + dy;
            
            this.updateTransform();
        });

        document.addEventListener('mouseup', () => {
            isPanning = false;
            this.boardContainer.style.cursor = 'grab';
        });

        this.boardContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.5, Math.min(2, this.scale * delta));
            
            // Calculate mouse position relative to board
            const rect = this.boardContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Adjust position to zoom towards mouse cursor
            this.position.x = x - (x - this.position.x) * (newScale / this.scale);
            this.position.y = y - (y - this.position.y) * (newScale / this.scale);
            
            this.scale = newScale;
            this.updateTransform();
        });
    }

    updateTransform() {
        const transform = `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`;
        this.gridContainer.style.transform = transform;
        this.piecesContainer.style.transform = transform;
    }

    setupMutationObserver() {
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
        let startX, startY;
        let initialPieceX, initialPieceY;

        // Handle dragging from game pieces section
        const gamePiecesSection = document.querySelector('.game-pieces-section');
        if (gamePiecesSection) {
            gamePiecesSection.addEventListener('mousedown', (e) => {
                const piece = e.target.closest('.piece');
                if (!piece) return;

                // Create a clone of the piece for dragging
                const clone = piece.cloneNode(true);
                clone.style.position = 'absolute';
                clone.style.zIndex = '1000';
                document.body.appendChild(clone);

                const rect = piece.getBoundingClientRect();
                this.dragOffset.x = e.clientX - rect.left;
                this.dragOffset.y = e.clientY - rect.top;
                
                startX = e.clientX;
                startY = e.clientY;
                
                this.isDragging = true;
                this.isDraggingFromSource = true;
                this.draggedPiece = clone;
                clone.classList.add('dragging');
                
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        }

        const onMouseDown = (e, piece) => {
            if (this.isDragging) return;
            
            const rect = piece.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            
            startX = e.clientX;
            startY = e.clientY;
            initialPieceX = parseInt(piece.style.left) || 0;
            initialPieceY = parseInt(piece.style.top) || 0;
            
            this.isDragging = true;
            this.isDraggingFromSource = false;
            this.draggedPiece = piece;
            piece.classList.add('dragging');
            
            this.lastKnownPositions.set(piece.id, {
                x: initialPieceX,
                y: initialPieceY
            });
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };

        const onMouseMove = (e) => {
            if (!this.isDragging || !this.draggedPiece) return;
            
            e.preventDefault();
            
            const newX = e.clientX - this.dragOffset.x;
            const newY = e.clientY - this.dragOffset.y;
            
            if (this.isDraggingFromSource) {
                this.draggedPiece.style.left = `${newX}px`;
                this.draggedPiece.style.top = `${newY}px`;
            } else {
                const boardRect = this.boardContainer.getBoundingClientRect();
                const relativeX = newX - boardRect.left;
                const relativeY = newY - boardRect.top;
                this.draggedPiece.style.transform = `translate3d(${relativeX}px, ${relativeY}px, 0)`;
            }
        };

        const onMouseUp = (e) => {
            if (!this.isDragging || !this.draggedPiece) return;
            
            if (this.isDraggingFromSource) {
                const boardRect = this.boardContainer.getBoundingClientRect();
                const relativeX = e.clientX - boardRect.left;
                const relativeY = e.clientY - boardRect.top;
                
                const gridX = Math.floor(relativeX / CELL_SIZE);
                const gridY = Math.floor(relativeY / CELL_SIZE);
                
                if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
                    const snappedX = gridX * CELL_SIZE;
                    const snappedY = gridY * CELL_SIZE;
                    
                    // Create new piece on the board
                    const type = this.draggedPiece.className.split(' ')[1];
                    const newPiece = this.createPiece(type);
                    newPiece.style.left = `${snappedX}px`;
                    newPiece.style.top = `${snappedY}px`;
                    
                    this.piecePositions.set(newPiece.id, {
                        x: snappedX,
                        y: snappedY
                    });

                    if (this.onBoardStateChange) {
                        this.onBoardStateChange(this.getBoardState());
                    }
                }
                
                // Remove the dragged clone
                this.draggedPiece.remove();
            } else {
                const finalX = e.clientX;
                const finalY = e.clientY;
                
                const boardRect = this.boardContainer.getBoundingClientRect();
                const relativeX = finalX - boardRect.left;
                const relativeY = finalY - boardRect.top;
                
                const gridX = Math.floor(relativeX / CELL_SIZE);
                const gridY = Math.floor(relativeY / CELL_SIZE);
                
                if (gridX >= 0 && gridX < GRID_SIZE && gridY >= 0 && gridY < GRID_SIZE) {
                    const snappedX = gridX * CELL_SIZE;
                    const snappedY = gridY * CELL_SIZE;
                    
                    this.draggedPiece.style.transform = 'none';
                    this.draggedPiece.style.left = `${snappedX}px`;
                    this.draggedPiece.style.top = `${snappedY}px`;
                    
                    this.piecePositions.set(this.draggedPiece.id, {
                        x: snappedX,
                        y: snappedY
                    });

                    if (this.onBoardStateChange) {
                        this.onBoardStateChange(this.getBoardState());
                    }
                } else {
                    const lastPos = this.lastKnownPositions.get(this.draggedPiece.id);
                    if (lastPos) {
                        this.draggedPiece.style.transform = 'none';
                        this.draggedPiece.style.left = `${lastPos.x}px`;
                        this.draggedPiece.style.top = `${lastPos.y}px`;
                    }
                }
            }
            
            this.draggedPiece.classList.remove('dragging');
            this.isDragging = false;
            this.isDraggingFromSource = false;
            this.draggedPiece = null;
            
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        // Add drag handlers to pieces in the board
        this.piecesContainer.addEventListener('mousedown', (e) => {
            const piece = e.target.closest('.piece');
            if (piece) {
                onMouseDown(e, piece);
            }
        });
    }

    createPiece(type) {
        const piece = document.createElement('div');
        piece.className = `piece ${type}`;
        piece.id = `piece-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        piece.innerHTML = GUEST_TYPES[type].icon;
        
        // Set initial position
        const initialX = 0;
        const initialY = 0;
        piece.style.left = `${initialX}px`;
        piece.style.top = `${initialY}px`;
        
        // Store initial position
        this.piecePositions.set(piece.id, {
            x: initialX,
            y: initialY
        });
        
        this.piecesContainer.appendChild(piece);
        this.pieces.set(piece.id, piece);
        
        return piece;
    }

    // Save board state
    getBoardState() {
        const state = {
            pieces: Array.from(this.piecePositions.entries()).map(([id, pos]) => ({
                id,
                type: this.pieces.get(id).className.split(' ')[1],
                x: pos.x,
                y: pos.y
            }))
        };
        return state;
    }

    // Restore board state
    restoreBoardState(state) {
        if (!state || !state.pieces) return;

        // Clear existing pieces
        this.piecesContainer.innerHTML = '';
        this.pieces.clear();
        this.piecePositions.clear();
        
        // Restore pieces
        state.pieces.forEach(pieceData => {
            const piece = this.createPiece(pieceData.type);
            piece.id = pieceData.id;
            piece.style.left = `${pieceData.x}px`;
            piece.style.top = `${pieceData.y}px`;
            
            this.piecePositions.set(piece.id, {
                x: pieceData.x,
                y: pieceData.y
            });
        });
    }

    // Set callback for board state changes
    setBoardStateChangeCallback(callback) {
        this.onBoardStateChange = callback;
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