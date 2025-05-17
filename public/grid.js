class GridManager {
    constructor() {
        this.boardContainer = document.getElementById('board-container');
        this.gridContainer = document.querySelector('.grid-container');
        this.pieces = new Map(); // Store active pieces on the board
        this.draggedPiece = null;
        this.cellSize = 0;
        
        this.init();
    }

    init() {
        // Create grid cells
        this.createGrid();
        
        // Initialize drag and drop
        this.initDragAndDrop();
        
        // Calculate cell size
        this.updateCellSize();
        
        // Handle window resize
        window.addEventListener('resize', () => this.updateCellSize());
    }

    createGrid() {
        // Clear existing grid
        this.gridContainer.innerHTML = '';
        
        // Create 20x20 grid
        for (let i = 0; i < 400; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;
            this.gridContainer.appendChild(cell);
        }
    }

    initDragAndDrop() {
        // Handle piece dragging
        document.addEventListener('mousedown', (e) => {
            const piece = e.target.closest('.piece');
            if (!piece) return;
            
            this.startDragging(piece, e);
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.draggedPiece) return;
            this.drag(e);
        });

        document.addEventListener('mouseup', () => {
            if (!this.draggedPiece) return;
            this.stopDragging();
        });

        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            const piece = e.target.closest('.piece');
            if (!piece) return;
            
            this.startDragging(piece, e.touches[0]);
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.draggedPiece) return;
            e.preventDefault();
            this.drag(e.touches[0]);
        });

        document.addEventListener('touchend', () => {
            if (!this.draggedPiece) return;
            this.stopDragging();
        });
    }

    startDragging(piece, event) {
        this.draggedPiece = piece;
        this.draggedPiece.classList.add('dragging');
        
        // Calculate initial offset
        const rect = piece.getBoundingClientRect();
        this.dragOffset = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    drag(event) {
        if (!this.draggedPiece) return;
        
        const x = event.clientX - this.dragOffset.x;
        const y = event.clientY - this.dragOffset.y;
        
        this.draggedPiece.style.transform = `translate(${x}px, ${y}px)`;
    }

    stopDragging() {
        if (!this.draggedPiece) return;
        
        // Find the closest cell
        const cell = this.findClosestCell(this.draggedPiece);
        if (cell) {
            this.snapToCell(this.draggedPiece, cell);
        }
        
        this.draggedPiece.classList.remove('dragging');
        this.draggedPiece = null;
    }

    findClosestCell(piece) {
        const pieceRect = piece.getBoundingClientRect();
        const pieceCenter = {
            x: pieceRect.left + pieceRect.width / 2,
            y: pieceRect.top + pieceRect.height / 2
        };
        
        let closestCell = null;
        let minDistance = Infinity;
        
        this.gridContainer.querySelectorAll('.grid-cell').forEach(cell => {
            const cellRect = cell.getBoundingClientRect();
            const cellCenter = {
                x: cellRect.left + cellRect.width / 2,
                y: cellRect.top + cellRect.height / 2
            };
            
            const distance = Math.hypot(
                pieceCenter.x - cellCenter.x,
                pieceCenter.y - cellCenter.y
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                closestCell = cell;
            }
        });
        
        return closestCell;
    }

    snapToCell(piece, cell) {
        const cellRect = cell.getBoundingClientRect();
        const boardRect = this.boardContainer.getBoundingClientRect();
        
        const x = cellRect.left - boardRect.left;
        const y = cellRect.top - boardRect.top;
        
        piece.style.transform = `translate(${x}px, ${y}px)`;
        
        // Store piece position
        this.pieces.set(piece.dataset.type, {
            x: cell.dataset.index % 20,
            y: Math.floor(cell.dataset.index / 20)
        });
    }

    updateCellSize() {
        const boardRect = this.boardContainer.getBoundingClientRect();
        this.cellSize = boardRect.width / 20;
    }

    // Method to create a new piece
    createPiece(type) {
        const piece = document.createElement('div');
        piece.className = `piece ${type}`;
        piece.dataset.type = type;
        
        const label = document.createElement('span');
        label.className = 'piece-label';
        label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        
        piece.appendChild(label);
        return piece;
    }

    // Method to add a piece to the board
    addPiece(type, x, y) {
        const piece = this.createPiece(type);
        this.boardContainer.appendChild(piece);
        
        const cell = this.gridContainer.children[y * 20 + x];
        if (cell) {
            this.snapToCell(piece, cell);
        }
    }
}

// Initialize the grid manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gridManager = new GridManager();
    
    // Make the grid manager available globally
    window.gridManager = gridManager;
}); 