const COLORS = [
    { id: 0, name: 'Red', hex: '#ff4757' },
    { id: 1, name: 'Blue', hex: '#1e90ff' },
    { id: 2, name: 'Green', hex: '#2ed573' },
    { id: 3, name: 'Yellow', hex: '#ffa502' },
    { id: 4, name: 'Purple', hex: '#a29bfe' }
];

const LEFT_KEYS = ['q', 'w', 'e', 'r', 't'];
const ALL_RIGHT_KEYS = ['y', 'u', 'i', 'o', 'p'];

let numCups = 5;
let targetArrangement = [];
let tableCups = [];
let attempts = 0;
let selectedTableIndex = null;
let timerInterval = null;
let startTime = 0;
let timerRunning = false;
let gameWon = false;

const boardContainer = document.getElementById('boardContainer');
const historyContainer = document.getElementById('historyContainer');
const timerDisplay = document.getElementById('timerDisplay');
const themeToggle = document.getElementById('themeToggle');
const modeRadios = document.getElementsByName('cupMode');
const newGameBtn = document.getElementById('newGameBtn');
const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');

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

// History toggle
toggleHistoryBtn.addEventListener('click', () => {
    const isHidden = historyContainer.classList.toggle('hidden');
    toggleHistoryBtn.textContent = isHidden ? 'Show History' : 'Hide History';
});

// Mode selection listener
modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        numCups = parseInt(e.target.value);
        initGame();
    });
});

// Map to store DOM elements referencing the cups for animation
let cupElements = {};

function renderEmptyHistory() {
    historyContainer.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const row = document.createElement('div');
        row.className = 'history-row empty-row';
        row.style.opacity = '0.3';
        row.style.animation = 'none';
        
        let slotsHtml = '';
        for (let j = 0; j < numCups; j++) {
            slotsHtml += `<div class="history-cup" style="background: transparent; border: 2px dashed var(--empty-cup-border); box-shadow: none; position: relative;"></div>`;
        }

        row.innerHTML = `
            <div class="history-slots">
                ${slotsHtml}
            </div>
            <div class="history-result" style="color: var(--instruction-color); text-shadow: none; opacity: 0.5;">- / ${numCups}</div>
        `;
        historyContainer.appendChild(row);
    }
}

function getActiveHotkeys() {
    return {
        left: LEFT_KEYS.slice(0, numCups),
        right: ALL_RIGHT_KEYS.slice(5 - numCups)
    };
}

function generateDerangement(colors) {
    let deranged = [...colors];
    let isDeranged = false;
    
    // For small arrays (3-5), shuffling until deranged is very fast
    while (!isDeranged) {
        deranged.sort(() => Math.random() - 0.5);
        isDeranged = deranged.every((color, i) => color.id !== colors[i].id);
    }
    return deranged;
}

function getScale() {
    const style = getComputedStyle(document.documentElement);
    const pitch = parseInt(style.getPropertyValue('--cup-pitch')) || 80;
    const paddingLeft = 15; // Padding for the board itself
    const columnWidth = 100; // Space for the 'X/Y' text (more room for 5-cup mode)
    const boardWidth = 5 * pitch + paddingLeft * 2;
    return {
        pitch,
        top: parseInt(style.getPropertyValue('--cup-top')) || 75,
        boardWidth,
        containerWidth: boardWidth + columnWidth + 30 // Include row padding
    };
}

function initGame() {
    const currentColors = COLORS.slice(0, numCups);
    targetArrangement = [...currentColors].sort(() => Math.random() - 0.5);
    
    tableCups = generateDerangement(targetArrangement);
    attempts = 0;
    selectedTableIndex = null;
    gameWon = false;
    
    boardContainer.innerHTML = '';
    cupElements = {};
    
    const hotkeys = getActiveHotkeys();
    const instructionKeys = `${hotkeys.right.join('')} / <span style="opacity: 0.6">${hotkeys.left.join('')}</span>`;
    document.querySelector('.instructions').innerHTML = `Guess the correct order. <br>Keys: <b>${instructionKeys}</b> to swap.`;
    
    const scale = getScale();
    const containerContentWidth = scale.containerWidth - 30; // Accounting for 15px padding on each side
    const centeringOffset = (containerContentWidth - (numCups * scale.pitch)) / 2;
    
    if (historyContainer) {
        historyContainer.style.width = `${scale.containerWidth}px`;
    }
    const gameArea = document.querySelector('.game-area');
    if (gameArea) gameArea.style.width = `${scale.containerWidth}px`;

    renderEmptyHistory();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    timerRunning = false;
    timerDisplay.textContent = '0.0s';
    
    renderBoard();
    updateActiveScore();
}

function updateActiveScore(count) {
    if (count === undefined) {
        count = 0;
        for (let i = 0; i < numCups; i++) {
            if (tableCups[i].id === targetArrangement[i].id) count++;
        }
    }
    const scoreEl = document.getElementById('activeScore');
    if (scoreEl) {
        scoreEl.textContent = `${count}/${numCups}`;
        if (count === numCups) {
            scoreEl.classList.add('correct-all');
        } else {
            scoreEl.classList.remove('correct-all');
        }
    }
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
    const hotkeys = getActiveHotkeys();
    const scale = getScale();
    const containerContentWidth = scale.containerWidth - 30; // Accounting for 15px padding on each side
    const centeringOffset = (containerContentWidth - (numCups * scale.pitch)) / 2;

    if (Object.keys(cupElements).length === 0) {
        for(let i=0; i<numCups; i++) {
            const leftPos = centeringOffset + i * scale.pitch + (scale.pitch / 2 - 35); // 35 is half-width of slot
            
            const tableSlot = document.createElement('div');
            tableSlot.className = `slot table-slot`;
            tableSlot.style.left = `${leftPos}px`;
            tableSlot.style.top = `${scale.top}px`; 
            tableSlot.setAttribute('data-key-primary', hotkeys.right[i]);
            tableSlot.setAttribute('data-key-secondary', hotkeys.left[i]);
            tableSlot.addEventListener('click', () => handleTableSlotClick(i));
            boardContainer.appendChild(tableSlot);
        }

        tableCups.forEach(color => {
            const cup = document.createElement('div');
            cup.className = 'cup';
            cup.style.backgroundColor = color.hex;

            cup.addEventListener('click', () => handleCupClick(color.id));
            boardContainer.appendChild(cup);
            cupElements[color.id] = cup;
        });

        const activeResult = document.createElement('div');
        activeResult.className = 'history-result';
        activeResult.id = 'activeScore';
        boardContainer.appendChild(activeResult);
    }

    tableCups.forEach((color, tableIdx) => {
        if (!color) return;
        const el = cupElements[color.id];
        el.classList.remove('selected');

        el.style.top = `${scale.top}px`;
        el.style.left = `${centeringOffset + tableIdx * scale.pitch + (scale.pitch / 2 - 35)}px`;
        if (selectedTableIndex === tableIdx) {
            el.classList.add('selected');
        }
    });
}

function handleCupClick(colorId) {
    if (gameWon) return;
    startTimer();
    
    const tableIdx = tableCups.findIndex(c => c && c.id === colorId);
    if (tableIdx !== -1) {
        if (selectedTableIndex === null) {
            selectedTableIndex = tableIdx;
        } else if (selectedTableIndex === tableIdx) {
            selectedTableIndex = null;
        } else {
            swapAndSubmit(selectedTableIndex, tableIdx);
        }
    }
    renderBoard();
}

function handleTableHotkey(tableIndex) {
    if (gameWon) return;
    startTimer();
    
    if (selectedTableIndex === null) {
        selectedTableIndex = tableIndex;
    } else if (selectedTableIndex === tableIndex) {
        selectedTableIndex = null;
    } else {
        swapAndSubmit(selectedTableIndex, tableIndex);
    }
    renderBoard();
}

function handleTableSlotClick(slotIndex) {
    if (gameWon) return;
    if (selectedTableIndex !== null) {
        swapAndSubmit(selectedTableIndex, slotIndex);
        renderBoard();
    }
}

function swapAndSubmit(idx1, idx2) {
    const temp = tableCups[idx1];
    tableCups[idx1] = tableCups[idx2];
    tableCups[idx2] = temp;
    selectedTableIndex = null;
    submitGuess();
}

function removeLastCup() {
    if (gameWon) return;
    selectedTableIndex = null;
    renderBoard();
}

function submitGuess() {
    attempts++;
    
    let correctCount = 0;
    for (let i = 0; i < numCups; i++) {
        if (tableCups[i].id === targetArrangement[i].id) {
            correctCount++;
        }
    }
    
    addHistoryItem([...tableCups], correctCount);
    updateActiveScore(correctCount);
    
    if (correctCount === numCups) {
        clearInterval(timerInterval);
        gameWon = true;
        
        document.querySelector('.instructions').innerHTML = `🎉 <b style="color: #2ecc71;">Win!</b> Swaps: <b>${attempts}</b> | Time: <b>${timerDisplay.textContent}</b> 🎉`;
        
        selectedTableIndex = null;
        renderBoard();
        updateActiveScore(correctCount); // Ensure green score
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
    
    const scale = getScale();
    const containerContentWidth = scale.containerWidth - 30;
    const centeringOffset = (containerContentWidth - (numCups * scale.pitch)) / 2;
    
    arrangement.forEach((cup, i) => {
        const miniCup = document.createElement('div');
        miniCup.className = 'history-cup';
        miniCup.style.backgroundColor = cup.hex;
        miniCup.style.left = `${centeringOffset + i * scale.pitch + (scale.pitch / 2 - 25)}px`; // 25 is half-width of mini-cup
        slotsDiv.appendChild(miniCup);
    });
    
    const resultDiv = document.createElement('div');
    resultDiv.className = 'history-result';
    resultDiv.textContent = `${correctCount}/${numCups}`;
    
    row.appendChild(slotsDiv);
    row.appendChild(resultDiv);
    
    historyContainer.insertBefore(row, historyContainer.firstChild);
    historyContainer.scrollTo({ top: 0, behavior: 'smooth' });
    
    return row;
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (key === 'enter' || key === ' ') {
        e.preventDefault();
        if (gameWon) initGame();
        return;
    }

    if (gameWon) return;

    const hotkeys = getActiveHotkeys();
    const rightIndex = hotkeys.right.indexOf(key);
    const leftIndex = hotkeys.left.indexOf(key);
    const tableIndex = rightIndex !== -1 ? rightIndex : leftIndex;

    if (tableIndex !== -1) {
        handleTableHotkey(tableIndex);
        return;
    }
});

newGameBtn.addEventListener('click', () => initGame());

window.addEventListener('resize', () => {
    const scale = getScale();
    if (historyContainer) historyContainer.style.width = `${scale.containerWidth}px`;
    const gameArea = document.querySelector('.game-area');
    if (gameArea) gameArea.style.width = `${scale.containerWidth}px`;
    renderBoard();
});

// Boot game
initGame();
