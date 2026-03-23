const COLORS = [
    { id: 0, name: 'Red', hex: '#ff4757' },
    { id: 1, name: 'Blue', hex: '#1e90ff' },
    { id: 2, name: 'Green', hex: '#2ed573' },
    { id: 3, name: 'Yellow', hex: '#ffa502' }
];

let targetArrangement = [];
let poolCups = []; 
let tableCups = [null, null, null, null];
let attempts = 0;
let selectedTableIndex = null;
let timerInterval = null;
let startTime = 0;
let timerRunning = false;
let gameWon = false;

const boardContainer = document.getElementById('boardContainer');
const historyContainer = document.getElementById('historyContainer');
const submitBtn = document.getElementById('submitBtn');
const resetAfterGuessCheckbox = document.getElementById('resetAfterGuess');
const timerDisplay = document.getElementById('timerDisplay');
const themeToggle = document.getElementById('themeToggle');

let isDark = false;
themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = '☀️ Light';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.textContent = '🌙 Dark';
    }
});

// Map to store DOM elements referencing the cups for animation
const cupElements = {};

function renderEmptyHistory() {
    historyContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const row = document.createElement('div');
        row.className = 'history-row empty-row';
        row.style.opacity = '0.3';
        row.style.animation = 'none';
        row.innerHTML = `
            <div class="history-slots">
                <div class="history-cup" style="background: transparent; border: 2px dashed var(--empty-cup-border); box-shadow: none; position: relative;"></div>
                <div class="history-cup" style="background: transparent; border: 2px dashed var(--empty-cup-border); box-shadow: none; position: relative;"></div>
                <div class="history-cup" style="background: transparent; border: 2px dashed var(--empty-cup-border); box-shadow: none; position: relative;"></div>
                <div class="history-cup" style="background: transparent; border: 2px dashed var(--empty-cup-border); box-shadow: none; position: relative;"></div>
            </div>
            <div class="history-result" style="color: var(--instruction-color); text-shadow: none; opacity: 0.5;">- / 4</div>
        `;
        historyContainer.appendChild(row);
    }
}

function initGame() {
    targetArrangement = [...COLORS].sort(() => Math.random() - 0.5);
    poolCups = [...COLORS]; 
    tableCups = [null, null, null, null];
    attempts = 0;
    selectedTableIndex = null;
    gameWon = false;
    
    submitBtn.textContent = 'Submit Guess';
    submitBtn.style.backgroundColor = '';
    document.querySelector('.instructions').innerHTML = 'Guess the correct order. Shortcuts: <b>7, 8, 9, 0</b> to pick/swap. <b>Backspace</b> to remove/cancel. <b>Enter/Space</b> to submit.';
    
    renderEmptyHistory();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerDisplay.textContent = '0.0s';
    
    renderBoard();
}

function startTimer() {
    if (!timerRunning) {
        timerRunning = true;
        startTime = performance.now();
        timerInterval = setInterval(updateTimer, 100);
    }
}

function updateTimer() {
    const elapsed = (performance.now() - startTime) / 1000;
    timerDisplay.textContent = elapsed.toFixed(1) + 's';
}

function renderBoard() {
    // Initialize DOM exactly once
    if (Object.keys(cupElements).length === 0) {
        // Draw physical empty slots on board
        const keys = ['7', '8', '9', '0'];
        for(let i=0; i<4; i++) {
            const tableSlot = document.createElement('div');
            tableSlot.className = `slot table-slot pos-${i}`;
            tableSlot.setAttribute('data-key', keys[i]);
            tableSlot.addEventListener('click', () => handleTableSlotClick(i));
            boardContainer.appendChild(tableSlot);

            const poolSlot = document.createElement('div');
            poolSlot.className = `slot pool-slot pos-${i}`;
            boardContainer.appendChild(poolSlot);
        }

        // Create the 4 absolute-positioned cups
        COLORS.forEach(color => {
            const cup = document.createElement('div');
            cup.className = 'cup';
            cup.style.backgroundColor = color.hex;

            cup.addEventListener('click', () => handleCupClick(color.id));
            boardContainer.appendChild(cup);
            cupElements[color.id] = cup;
        });
    }

    // Update cup physical positions smoothly
    COLORS.forEach(color => {
        const el = cupElements[color.id];
        el.classList.remove('selected');

        const tableIdx = tableCups.findIndex(c => c && c.id === color.id);
        const poolIdx = poolCups.findIndex(c => c && c.id === color.id);

        if (tableIdx !== -1) {
            el.style.top = '130px';
            el.style.left = `${10 + tableIdx * 80}px`;
            if (selectedTableIndex === tableIdx) {
                el.classList.add('selected');
            }
        } else if (poolIdx !== -1) {
            el.style.top = '20px';
            el.style.left = `${10 + poolIdx * 80}px`;
        }
    });

    submitBtn.disabled = tableCups.includes(null);
}

function handleCupClick(colorId) {
    if (gameWon) return;
    
    startTimer();
    
    const tableIdx = tableCups.findIndex(c => c && c.id === colorId);
    const poolIdx = poolCups.findIndex(c => c && c.id === colorId);

    if (poolIdx !== -1) {
        // Move from pool to table rightmost empty slot
        const firstEmptyTableIdx = tableCups.findLastIndex(c => c === null);
        if (firstEmptyTableIdx !== -1) {
            const cup = poolCups[poolIdx];
            poolCups[poolIdx] = null;
            tableCups[firstEmptyTableIdx] = cup;
            
            // Cancel any selection on table
            selectedTableIndex = null;
        }
    } else if (tableIdx !== -1) {
        // Handle actions for cups already on table
        if (selectedTableIndex === null) {
            // Select cup
            selectedTableIndex = tableIdx;
        } else if (selectedTableIndex === tableIdx) {
            // Unselect if same
            selectedTableIndex = null;
        } else {
            // Swap two table cups!
            const temp = tableCups[selectedTableIndex];
            tableCups[selectedTableIndex] = tableCups[tableIdx];
            tableCups[tableIdx] = temp;
            selectedTableIndex = null;
        }
    }
    renderBoard();
}

function handleTableHotkey(tableIndex) {
    if (gameWon) return;
    
    if (tableCups[tableIndex] === null) {
        // Pull right-most available pool cup
        const poolCupIdx = poolCups.findLastIndex(c => c !== null);
        if (poolCupIdx !== -1) {
            startTimer();
            const cup = poolCups[poolCupIdx];
            poolCups[poolCupIdx] = null;
            tableCups[tableIndex] = cup;
            selectedTableIndex = null;
            renderBoard();
        }
    } else {
        // Cup exists on table here, interact with it
        startTimer();
        if (selectedTableIndex === null) {
            selectedTableIndex = tableIndex;
        } else if (selectedTableIndex === tableIndex) {
            selectedTableIndex = null;
        } else {
            const temp = tableCups[selectedTableIndex];
            tableCups[selectedTableIndex] = tableCups[tableIndex];
            tableCups[tableIndex] = temp;
            selectedTableIndex = null;
        }
        renderBoard();
    }
}

function handleTableSlotClick(slotIndex) {
    if (gameWon) return;
    
    if (selectedTableIndex !== null && tableCups[slotIndex] === null) {
        // Move selected table cup to empty table slot
        tableCups[slotIndex] = tableCups[selectedTableIndex];
        tableCups[selectedTableIndex] = null;
        selectedTableIndex = null;
        renderBoard();
    }
}

function removeLastCup() {
    if (gameWon) return;
    
    if (selectedTableIndex !== null) {
        // Option 1: cancel selection
        selectedTableIndex = null;
    } else {
        // Option 2: remove rightmost cup from table
        for (let i = 3; i >= 0; i--) {
            if (tableCups[i] !== null) {
                const cup = tableCups[i];
                tableCups[i] = null;
                // Return to original pool slot
                poolCups[cup.id] = cup;
                break;
            }
        }
    }
    renderBoard();
}

function submitGuess() {
    if (tableCups.includes(null)) return;
    
    attempts++;
    
    let correctCount = 0;
    for (let i = 0; i < 4; i++) {
        if (tableCups[i].id === targetArrangement[i].id) {
            correctCount++;
        }
    }
    
    addHistoryItem([...tableCups], correctCount);
    
    if (correctCount === 4) {
        clearInterval(timerInterval);
        gameWon = true;
        submitBtn.disabled = false;
        submitBtn.textContent = 'New Game';
        submitBtn.style.backgroundColor = '#4cd137';
        
        document.querySelector('.instructions').innerHTML = `🎉 <b style="color: var(--accent);">You Won!</b> Guessed in <b style="color: var(--accent);">${attempts}</b> attempts. Time: <b style="color: var(--accent);">${timerDisplay.textContent}</b> 🎉`;
        
        selectedTableIndex = null;
        renderBoard();
    } else {
        // Clear selection to allow quick edits for next row
        selectedTableIndex = null;
        
        if (resetAfterGuessCheckbox.checked) {
            for (let i = 0; i < 4; i++) {
                if (tableCups[i] !== null) {
                    const cup = tableCups[i];
                    tableCups[i] = null;
                    poolCups[cup.id] = cup;
                }
            }
        }
        
        renderBoard();
    }
}

function addHistoryItem(arrangement, correctCount) {
    const emptyRows = historyContainer.querySelectorAll('.empty-row');
    if (emptyRows.length > 0) {
        historyContainer.removeChild(emptyRows[emptyRows.length - 1]);
    }

    const row = document.createElement('div');
    row.className = 'history-row';
    
    const slotsDiv = document.createElement('div');
    slotsDiv.className = 'history-slots';
    
    arrangement.forEach(cup => {
        const miniCup = document.createElement('div');
        miniCup.className = 'history-cup';
        miniCup.style.backgroundColor = cup.hex;
        slotsDiv.appendChild(miniCup);
    });
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'history-result';
    resultDiv.textContent = `${correctCount}/4`;
    
    row.appendChild(slotsDiv);
    row.appendChild(resultDiv);
    
    // Insert at the top (upside down)
    historyContainer.insertBefore(row, historyContainer.firstChild);
    
    // Auto-scroll to top smoothly
    historyContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (gameWon) {
            initGame();
        } else if (!submitBtn.disabled) {
            submitGuess();
        }
        return;
    }

    if (gameWon) return;

    if (e.key === 'Backspace') {
        removeLastCup();
        return;
    }

    const TABLE_KEYS = ['7', '8', '9', '0'];
    const tableIndex = TABLE_KEYS.indexOf(e.key);
    if (tableIndex !== -1) {
        handleTableHotkey(tableIndex);
        return;
    }
});

submitBtn.addEventListener('click', () => {
    if (gameWon) initGame();
    else submitGuess();
});

// Boot game
initGame();
