// Wait for PIXI to be available
let PIXI;
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
    
    return new Promise(resolve => {
        // Wait a bit longer to ensure PIXI is fully initialized
        setTimeout(resolve, 500);
    });
}

// Board configuration
const GRID_SIZE = 70; // 70x70 grid
const CELL_SIZE = 10; // Size of each cell in pixels
const BOARD_WIDTH = GRID_SIZE * CELL_SIZE;
const BOARD_HEIGHT = GRID_SIZE * CELL_SIZE;

// Guest types configuration with custom icons
const GUEST_TYPES = {
    rocker: {
        color: 0x000000,
        borderWidth: 3,
        icon: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="black" d="M12,4 C7.58,4 4,7.58 4,12 C4,16.42 7.58,20 12,20 C16.42,20 20,16.42 20,12 C20,7.58 16.42,4 12,4 M12,6 C13.1,6 14,6.9 14,8 C14,9.1 13.1,10 12,10 C10.9,10 10,9.1 10,8 C10,6.9 10.9,6 12,6 M12,18 C9.39,18 7.19,16.41 6.33,14 C6.37,12 10,11 12,11 C13.99,11 17.63,12 17.67,14 C16.81,16.41 14.61,18 12,18 Z"/>
                <path fill="black" d="M15,8 L19,8 M5,8 L9,8 M12,2 L12,4 M12,20 L12,22" stroke="black" stroke-width="2"/>
            </svg>`
    },
    hopper: {
        color: 0x3498db,
        borderWidth: 3,
        icon: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#3498db" d="M12,4 C7.58,4 4,7.58 4,12 C4,16.42 7.58,20 12,20 C16.42,20 20,16.42 20,12 C20,7.58 16.42,4 12,4 M12,6 C13.1,6 14,6.9 14,8 C14,9.1 13.1,10 12,10 C10.9,10 10,9.1 10,8 C10,6.9 10.9,6 12,6 M12,18 C9.39,18 7.19,16.41 6.33,14 C6.37,12 10,11 12,11 C13.99,11 17.63,12 17.67,14 C16.81,16.41 14.61,18 12,18 Z"/>
                <rect fill="#3498db" x="8" y="14" width="8" height="2" rx="1"/>
            </svg>`
    },
    diva: {
        color: 0x8b4513,
        borderWidth: 3,
        icon: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#8b4513" d="M12,4 C7.58,4 4,7.58 4,12 C4,16.42 7.58,20 12,20 C16.42,20 20,16.42 20,12 C20,7.58 16.42,4 12,4 M12,6 C15,6 16,8 16,8 C16,8 15,10 12,10 C9,10 8,8 8,8 C8,8 9,6 12,6 M12,18 C9.39,18 7.19,16.41 6.33,14 C6.37,12 10,11 12,11 C13.99,11 17.63,12 17.67,14 C16.81,16.41 14.61,18 12,18 Z"/>
                <circle fill="#8b4513" cx="12" cy="8" r="2"/>
            </svg>`
    },
    princess: {
        color: 0xe91e63,
        borderWidth: 3,
        icon: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#e91e63" d="M12,4 C7.58,4 4,7.58 4,12 C4,16.42 7.58,20 12,20 C16.42,20 20,16.42 20,12 C20,7.58 16.42,4 12,4 M12,6 L14,9 L12,12 L10,9 L12,6 M12,18 C9.39,18 7.19,16.41 6.33,14 C6.37,12 10,11 12,11 C13.99,11 17.63,12 17.67,14 C16.81,16.41 14.61,18 12,18 Z"/>
                <polygon fill="#e91e63" points="12,2 14,6 12,8 10,6"/>
            </svg>`
    },
    latino: {
        color: 0xf39c12,
        borderWidth: 3,
        icon: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#f39c12" d="M12,4 C7.58,4 4,7.58 4,12 C4,16.42 7.58,20 12,20 C16.42,20 20,16.42 20,12 C20,7.58 16.42,4 12,4 M12,6 C13.1,6 14,6.9 14,8 C14,9.1 13.1,10 12,10 C10.9,10 10,9.1 10,8 C10,6.9 10.9,6 12,6 M12,18 C9.39,18 7.19,16.41 6.33,14 C6.37,12 10,11 12,11 C13.99,11 17.63,12 17.67,14 C16.81,16.41 14.61,18 12,18 Z"/>
                <path fill="#f39c12" d="M8,4 L16,4 L12,8 Z"/>
            </svg>`
    },
    raver: {
        color: 0x2ecc71,
        borderWidth: 3,
        icon: `
            <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="#2ecc71" d="M12,4 C7.58,4 4,7.58 4,12 C4,16.42 7.58,20 12,20 C16.42,20 20,16.42 20,12 C20,7.58 16.42,4 12,4 M12,6 C13.1,6 14,6.9 14,8 C14,9.1 13.1,10 12,10 C10.9,10 10,9.1 10,8 C10,6.9 10.9,6 12,6 M12,18 C9.39,18 7.19,16.41 6.33,14 C6.37,12 10,11 12,11 C13.99,11 17.63,12 17.67,14 C16.81,16.41 14.61,18 12,18 Z"/>
                <circle fill="#2ecc71" cx="8" cy="8" r="2"/>
                <circle fill="#2ecc71" cx="16" cy="8" r="2"/>
            </svg>`
    }
};

// Initialize PixiJS Application
let app = null;

// Board state management
export class Board {
    constructor() {
        this.initialize();
    }

    async initialize() {
        try {
            console.log("Initializing board...");
            await waitForPixi();
            
            // Create the application only if it doesn't exist
            if (!app) {
                console.log("Creating PIXI application...");
                
                // Create a canvas element
                const canvas = document.createElement('canvas');
                canvas.width = BOARD_WIDTH;
                canvas.height = BOARD_HEIGHT;
                
                // Basic PIXI application configuration
                const options = {
                    view: canvas,
                    width: BOARD_WIDTH,
                    height: BOARD_HEIGHT,
                    backgroundColor: 0x1a1a1a,
                    resolution: 1,
                    antialias: true,
                    preserveDrawingBuffer: true,
                    powerPreference: 'default'
                };

                // Try WebGL2 first
                try {
                    options.context = canvas.getContext('webgl2', {
                        alpha: false,
                        stencil: true,
                        antialias: true,
                        premultipliedAlpha: false,
                        preserveDrawingBuffer: true
                    });
                    console.log("Using WebGL2");
                } catch (e) {
                    console.log("WebGL2 not available, trying WebGL1");
                    try {
                        options.context = canvas.getContext('webgl', {
                            alpha: false,
                            stencil: true,
                            antialias: true,
                            premultipliedAlpha: false,
                            preserveDrawingBuffer: true
                        });
                        console.log("Using WebGL1");
                    } catch (e) {
                        console.log("WebGL not available, using canvas renderer");
                        options.forceCanvas = true;
                    }
                }

                app = new PIXI.Application(options);
                
                // Handle context loss
                canvas.addEventListener('webglcontextlost', (event) => {
                    event.preventDefault();
                    console.log("WebGL context lost, attempting to restore...");
                    
                    // Stop the render loop
                    app.stop();
                    
                    // Try to restore in 1 second
                    setTimeout(() => {
                        try {
                            // Attempt to restore the context
                            if (options.context) {
                                options.context.restore();
                            }
                            // Restart the render loop
                            app.start();
                            console.log("Context restored successfully");
                        } catch (e) {
                            console.error("Failed to restore context:", e);
                            // Fall back to canvas renderer
                            options.forceCanvas = true;
                            this.initialize();
                        }
                    }, 1000);
                });

                canvas.addEventListener('webglcontextrestored', () => {
                    console.log("WebGL context restored");
                    app.start();
                });

                console.log("PIXI Application created:", app);
                console.log("Renderer type:", app.renderer.type);
            }

            // Find and prepare the container
            console.log("Finding board container...");
            this.container = document.getElementById('board-container');
            if (!this.container) {
                console.error("Board container element not found");
                throw new Error('Board container not found');
            }

            // Clear the container
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }

            // Set container styles
            this.container.style.width = `${BOARD_WIDTH}px`;
            this.container.style.height = `${BOARD_HEIGHT}px`;
            this.container.style.position = 'relative';
            this.container.style.overflow = 'hidden';
            this.container.style.backgroundColor = '#1a1a1a';
            this.container.style.display = 'block';
            
            console.log("Adding canvas to container...");
            this.container.appendChild(app.view);
            
            // Initialize containers
            console.log("Creating PIXI containers...");
            this.gridContainer = new PIXI.Container();
            this.piecesContainer = new PIXI.Container();
            
            // Set container properties
            this.gridContainer.sortableChildren = true;
            this.piecesContainer.sortableChildren = true;
            this.piecesContainer.interactive = true;
            
            app.stage.addChild(this.gridContainer);
            app.stage.addChild(this.piecesContainer);
            
            // Setup grid and interactions
            console.log("Setting up grid...");
            this.setupGrid();
            console.log("Setting up interaction...");
            this.setupInteraction();
            console.log("Setting up zoom and pan...");
            this.setupZoomAndPan();
            console.log("Setting up Firebase sync...");
            await this.setupFirebaseSync();
            console.log("Setting up piece drag and drop...");
            await this.setupPieceDragAndDrop();
            
            // Initialize pieces map
            this.pieces = new Map();

            // Make the board instance globally available
            window.gameBoard = this;
            
            // Initialize control buttons after board is fully set up
            this.initializeControlButtons();
            
            // Start the render loop
            app.ticker.add(() => {
                if (app && app.renderer) {
                    app.renderer.render(app.stage);
                }
            });
            
            console.log("Board initialization complete!");
        } catch (error) {
            console.error('Error initializing board:', error);
            // Try to recover by forcing canvas renderer
            if (!app) {
                console.log("Attempting recovery with canvas renderer...");
                try {
                    app = new PIXI.Application({
                        width: BOARD_WIDTH,
                        height: BOARD_HEIGHT,
                        backgroundColor: 0x1a1a1a,
                        forceCanvas: true,
                        resolution: 1
                    });
                    if (app && app.renderer) {
                        console.log("Recovery successful with canvas renderer");
                        this.initialize(); // Retry initialization
                        return;
                    }
                } catch (recoveryError) {
                    console.error("Recovery failed:", recoveryError);
                }
            }
        }
    }

    setupGrid() {
        // Add background first
        const background = new PIXI.Graphics();
        background.beginFill(0x1a1a1a);
        background.drawRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);
        background.endFill();
        
        // Create grid
        const grid = new PIXI.Graphics();
        grid.lineStyle(1, 0x444444, 1);

        // Draw vertical lines
        for (let x = 0; x <= BOARD_WIDTH; x += CELL_SIZE) {
            grid.moveTo(x, 0);
            grid.lineTo(x, BOARD_HEIGHT);
        }

        // Draw horizontal lines
        for (let y = 0; y <= BOARD_HEIGHT; y += CELL_SIZE) {
            grid.moveTo(0, y);
            grid.lineTo(BOARD_WIDTH, y);
        }

        // Clear and set up grid container
        this.gridContainer.removeChildren();
        this.gridContainer.addChild(background);
        this.gridContainer.addChild(grid);
        this.gridContainer.visible = true;
        this.gridContainer.alpha = 1;
        
        // Ensure the grid container is at the bottom layer
        app.stage.addChildAt(this.gridContainer, 0);

        console.log("Grid setup complete - grid should be visible");
    }

    initializeControlButtons() {
        const resetViewBtn = document.getElementById('reset-view-btn');
        const toggleGridBtn = document.getElementById('toggle-grid-btn');

        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                console.log("Resetting view...");
                if (this.gridContainer && this.piecesContainer) {
                    gsap.to([this.gridContainer, this.piecesContainer], {
                        x: 0,
                        y: 0,
                        scale: 1,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                }
            });
        }

        if (toggleGridBtn) {
            toggleGridBtn.addEventListener('click', () => {
                console.log("Toggling grid visibility...");
                if (this.gridContainer) {
                    this.gridContainer.visible = !this.gridContainer.visible;
                    console.log("Grid visibility:", this.gridContainer.visible);
                }
            });
        }

        // Log button initialization
        console.log("Control buttons initialized");
    }

    setupInteraction() {
        // Enable drag and drop functionality
        if (app && app.renderer) {
            app.stage.interactive = true;
            app.stage.hitArea = app.screen;
        }
    }

    setupZoomAndPan() {
        if (!app || !app.renderer) return;

        let isDragging = false;
        let lastPosition = null;

        app.stage.on('pointerdown', (event) => {
            isDragging = true;
            lastPosition = event.data.global.clone();
        });

        app.stage.on('pointermove', (event) => {
            if (isDragging && lastPosition) {
                const newPosition = event.data.global;
                const dx = newPosition.x - lastPosition.x;
                const dy = newPosition.y - lastPosition.y;

                this.gridContainer.x += dx;
                this.gridContainer.y += dy;
                this.piecesContainer.x += dx;
                this.piecesContainer.y += dy;

                lastPosition = newPosition.clone();
            }
        });

        app.stage.on('pointerup', () => {
            isDragging = false;
            lastPosition = null;
        });

        // Add zoom with mouse wheel
        this.container.addEventListener('wheel', (event) => {
            event.preventDefault();
            const scale = event.deltaY > 0 ? 0.95 : 1.05;
            
            this.gridContainer.scale.x *= scale;
            this.gridContainer.scale.y *= scale;
            this.piecesContainer.scale.x *= scale;
            this.piecesContainer.scale.y *= scale;
        });
    }

    setupPieceDragAndDrop() {
        // Set up event listeners for the piece templates
        const pieces = document.querySelectorAll('.piece');
        pieces.forEach(piece => {
            piece.style.cursor = 'pointer';
            piece.style.userSelect = 'none';
            piece.style.webkitUserSelect = 'none';
            
            const handleStart = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handlePieceTemplateClick(e, piece);
            };
            
            piece.addEventListener('mousedown', handleStart);
            piece.addEventListener('touchstart', handleStart, { passive: false });
        });
    }

    handlePieceTemplateClick(e, pieceElement) {
        const type = pieceElement.dataset.type;
        if (!type) return;

        const piece = this.createPiece(type);
        if (!piece) return;

        // Get the board's position relative to the viewport
        const boardRect = this.container.getBoundingClientRect();
        
        // Calculate the initial position in board coordinates
        const x = (e.clientX || e.touches[0].clientX) - boardRect.left;
        const y = (e.clientY || e.touches[0].clientY) - boardRect.top;
        
        // Set the piece position
        piece.x = x;
        piece.y = y;
        
        // Start dragging the new piece
        this.startDragging(piece, e);
    }

    createPiece(type) {
        if (!GUEST_TYPES[type]) return null;

        const piece = new PIXI.Container();
        piece.interactive = true;
        piece.buttonMode = true;
        piece.type = type;
        
        // Create the piece graphics
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(GUEST_TYPES[type].borderWidth, GUEST_TYPES[type].color);
        graphics.beginFill(GUEST_TYPES[type].color, 0.2);
        graphics.drawCircle(0, 0, CELL_SIZE / 2);
        graphics.endFill();
        
        piece.addChild(graphics);
        
        // Add event listeners for dragging
        piece.on('mousedown', (e) => this.startDragging(piece, e))
            .on('touchstart', (e) => this.startDragging(piece, e));
        
        this.piecesContainer.addChild(piece);
        return piece;
    }

    startDragging(piece, event) {
        event.stopPropagation();
        piece.dragging = true;
        piece.dragData = event.data;
        piece.zIndex = 1000;

        const dragMove = (e) => this.onDragMove(e, piece);
        const dragEnd = () => this.stopDragging(piece);

        piece.on('mousemove', dragMove)
            .on('touchmove', dragMove)
            .on('mouseup', dragEnd)
            .on('mouseupoutside', dragEnd)
            .on('touchend', dragEnd)
            .on('touchendoutside', dragEnd);
    }

    onDragMove(event, piece) {
        if (piece.dragging) {
            const newPosition = piece.dragData.getLocalPosition(this.piecesContainer);
            piece.x = newPosition.x;
            piece.y = newPosition.y;
        }
    }

    stopDragging(piece) {
        piece.dragging = false;
        piece.dragData = null;
        piece.zIndex = 1;

        // Remove all move and end listeners
        piece.removeAllListeners('mousemove')
            .removeAllListeners('touchmove')
            .removeAllListeners('mouseup')
            .removeAllListeners('mouseupoutside')
            .removeAllListeners('touchend')
            .removeAllListeners('touchendoutside');

        // Snap to grid and sync position
        const snappedPos = this.snapToGrid({ x: piece.x, y: piece.y });
        piece.x = snappedPos.x;
        piece.y = snappedPos.y;
        this.syncPiecePosition(piece);
    }

    async syncPiecePosition(piece) {
        if (!currentRoomId) return;
        
        try {
            const pieceData = {
                type: piece.type,
                x: piece.boardX,
                y: piece.boardY,
                id: piece.id || Date.now().toString()
            };
            
            if (!piece.id) {
                piece.id = pieceData.id;
            }
            
            const roomRef = doc(window.db, "rooms", currentRoomId);
            await updateDoc(roomRef, {
                [`pieces.${piece.id}`]: pieceData
            });
        } catch (error) {
            console.error("Error syncing piece position:", error);
        }
    }

    setupFirebaseSync() {
        // Get reference to the game room's board state
        const roomId = localStorage.getItem('currentRoomId');
        if (!roomId) return;

        const boardRef = window.db.collection('rooms').doc(roomId).collection('board');

        // Listen for changes to board state
        boardRef.onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    this.updatePiecePosition(change.doc.data());
                } else if (change.type === 'removed') {
                    this.removePiece(change.doc.id);
                }
            });
        });

        // Add piece sync listener
        if (roomId) {
            const roomRef = doc(window.db, "rooms", roomId);
            onSnapshot(roomRef, (snapshot) => {
                const data = snapshot.data();
                if (data && data.pieces) {
                    this.updatePiecesFromFirebase(data.pieces);
                }
            });
        }
    }

    updatePiecesFromFirebase(pieces) {
        // Remove pieces that no longer exist
        for (const [id, piece] of this.pieces) {
            if (!pieces[id]) {
                piece.destroy();
                this.pieces.delete(id);
            }
        }

        // Update or add pieces
        for (const [id, pieceData] of Object.entries(pieces)) {
            if (!this.pieces.has(id)) {
                // Create new piece
                const piece = this.createPiece(pieceData.type);
                piece.id = id;
                piece.position.set(pieceData.x * CELL_SIZE, pieceData.y * CELL_SIZE);
                this.piecesContainer.addChild(piece);
                this.pieces.set(id, piece);
            } else {
                // Update existing piece
                const piece = this.pieces.get(id);
                piece.position.set(pieceData.x * CELL_SIZE, pieceData.y * CELL_SIZE);
            }
        }
    }

    updatePiecePosition(pieceData) {
        // Implementation for updating piece positions
        // This will be expanded when we add game pieces
    }

    async removePiece(piece) {
        if (!piece || !piece.id) return;
        
        try {
            // Remove from Firebase
            const roomRef = doc(window.db, "rooms", currentRoomId);
            await updateDoc(roomRef, {
                [`pieces.${piece.id}`]: deleteField()
            });
            
            // Remove from local map and destroy
            this.pieces.delete(piece.id);
            piece.destroy();
            
            // Add removal effect
            const effect = new PIXI.Graphics();
            effect.lineStyle(2, 0xFF0000);
            effect.drawCircle(piece.x, piece.y, 35);
            this.piecesContainer.addChild(effect);
            
            // Animate and remove effect
            gsap.to(effect, {
                alpha: 0,
                duration: 0.5,
                onComplete: () => effect.destroy()
            });
            
        } catch (error) {
            console.error("Error removing piece:", error);
        }
    }

    snapToGrid(position) {
        return {
            x: Math.round(position.x / CELL_SIZE) * CELL_SIZE,
            y: Math.round(position.y / CELL_SIZE) * CELL_SIZE
        };
    }
}

// Initialize board when document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gameBoard = new Board();
}); 