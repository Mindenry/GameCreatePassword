// Advanced game levels
const levels = [
    {
        name: "Basic Security",
        requirements: ["Length ≥ 4 characters"],
        description: "Bypass basic security system",
        check: (pwd) => pwd.length >= 4,
        baseScore: 100
    },
    {
        name: "Numeric Enhancement",
        requirements: ["Length ≥ 6 characters", "Include at least 1 number"],
        description: "Crack enhanced numeric security",
        check: (pwd) => pwd.length >= 6 && /\d/.test(pwd),
        baseScore: 200
    },
    {
        name: "Special Operations",
        requirements: ["Length ≥ 8 characters", "Include numbers", "Include special chars (@#$%^&*)"],
        description: "Penetrate special character security layer",
        check: (pwd) => pwd.length >= 8 && /\d/.test(pwd) && /[@#$%^&*]/.test(pwd),
        baseScore: 300
    },
    {
        name: "Capital Defense",
        requirements: ["Length ≥ 10 characters", "Include numbers", "Include special chars", "Include uppercase"],
        description: "Break through capital letter defense system",
        check: (pwd) => pwd.length >= 10 && /\d/.test(pwd) && /[@#$%^&*]/.test(pwd) && /[A-Z]/.test(pwd),
        baseScore: 400
    },
    {
        name: "Pattern Recognition",
        requirements: ["Previous requirements", "No sequential numbers (123, 456)", "No common words (password, admin)"],
        description: "Defeat pattern recognition system",
        check: (pwd) => pwd.length >= 10 && /\d/.test(pwd) && /[@#$%^&*]/.test(pwd) && /[A-Z]/.test(pwd) 
            && !/123|456|789/.test(pwd) && !/password|admin/i.test(pwd),
        baseScore: 500
    },
    {
        name: "Advanced Encryption",
        requirements: ["Length ≥ 12 characters", "All previous requirements", "At least 2 numbers", "At least 2 special chars"],
        description: "Bypass advanced encryption system",
        check: (pwd) => pwd.length >= 12 && /\d.*\d/.test(pwd) && /[@#$%^&*].*[@#$%^&*]/.test(pwd) && /[A-Z]/.test(pwd),
        baseScore: 600
    },
    {
        name: "Ultimate Security",
        requirements: ["Length ≥ 14 characters", "All previous requirements", "Numbers, specials, and capitals must be mixed"],
        description: "Challenge the ultimate security system",
        check: (pwd) => pwd.length >= 14 && /\d.*[@#$%^&*].*[A-Z]/.test(pwd) && /[A-Z].*\d.*[@#$%^&*]/.test(pwd),
        baseScore: 1000
    }
];

// Game state
let currentLevel = 0;
let score = 0;
let xp = 0;
let timeLeft = 30;
let timerInterval;
let scoreMultiplier = 1;
let achievements = new Set();

// Matrix background effect
const canvas = document.getElementById('matrixBg');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*";
const drops = [];
const fontSize = 10;
const columns = canvas.width / fontSize;

for(let i = 0; i < columns; i++) {
    drops[i] = 1;
}

function drawMatrix() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#33ff33';
    ctx.font = fontSize + 'px monospace';

    for(let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Terminal effects
function addTerminalLine(text) {
    const terminal = document.getElementById('terminal');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `> ${text}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;

    while (terminal.children.length > 10) {
        terminal.removeChild(terminal.firstChild);
    }
}

function addSystemLog(text) {
    const log = document.getElementById('systemLog');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;

    while (log.children.length > 8) {
        log.removeChild(log.firstChild);
    }
}

// Achievement system
const achievementsList = {
    'speed_demon': 'Complete a level in under 10 seconds',
    'perfect_score': 'Achieve 100% password strength',
    'persistent': 'Try 5 different passwords in one level',
    'power_user': 'Use 3 different power-ups',
    'master_hacker': 'Complete all levels'
};

function addAchievement(id) {
    if (!achievements.has(id) && achievementsList[id]) {
        achievements.add(id);
        const achievementsDiv = document.getElementById('achievements');
        const achievement = document.createElement('div');
        achievement.className = 'achievement glow';
        achievement.textContent = achievementsList[id];
        achievementsDiv.appendChild(achievement);
        addXP(200);
        addSystemLog(`Achievement unlocked: ${achievementsList[id]}`);
    }
}

// Power-up system
const powerups = {
    timeBoost: {
        cost: 500,
        effect: () => {
            timeLeft += 10;
            updateTimer();
            addTerminalLine('Time boost activated: +10 seconds');
        }
    },
    hintBoost: {
        cost: 300,
        effect: () => {
            const hints = [
                'Try adding special characters like @#$',
                'Mix uppercase and lowercase letters',
                'Use numbers in unexpected positions',
                'Make it longer than required',
                'Avoid common patterns'
            ];
            addTerminalLine(`HINT: ${hints[Math.floor(Math.random() * hints.length)]}`);
        }
    },
    skipLevel: {
        cost: 1000,
        effect: () => {
            if (currentLevel < levels.length - 1) {
                currentLevel++;
                updateLevel();
                addTerminalLine('Level skipped successfully');
            }
        }
    },
    scoreBoost: {
        cost: 800,
        effect: () => {
            scoreMultiplier = 2;
            setTimeout(() => {
                scoreMultiplier = 1;
                addTerminalLine('Score multiplier expired');
            }, 30000);
            addTerminalLine('Score multiplier activated: 2x for 30 seconds');
        }
    }
};

function usePowerup(id) {
    const powerup = powerups[id];
    if (powerup && xp >= powerup.cost) {
        addXP(-powerup.cost);
        powerup.effect();
        document.getElementById(id).classList.add('shake');
        setTimeout(() => document.getElementById(id).classList.remove('shake'), 500);
        
        let powerupsUsed = parseInt(localStorage.getItem('powerupsUsed') || '0');
        powerupsUsed++;
        localStorage.setItem('powerupsUsed', powerupsUsed);
        
        if (powerupsUsed >= 3) {
            addAchievement('power_user');
        }
    } else {
        addTerminalLine('Not enough XP for power-up!');
    }
}

// Score and XP system
function addScore(points) {
    score += points * scoreMultiplier;
    document.getElementById('score').textContent = score;
    updateLeaderboard();
}

function addXP(points) {
    xp += points;
    document.getElementById('xp').textContent = xp;
    updatePowerups();
}

function updatePowerups() {
    for (const [id, powerup] of Object.entries(powerups)) {
        const element = document.getElementById(id);
        element.classList.toggle('available', xp >= powerup.cost);
    }
}

// Leaderboard system
function updateLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard.push({ score, date: new Date().toLocaleDateString() });
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard.splice(10); // Keep top 10
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

    const leaderboardDiv = document.getElementById('leaderboard');
    leaderboardDiv.innerHTML = leaderboard.map((entry, i) => 
        `<div class="stat-item">#${i + 1}: ${entry.score} (${entry.date})</div>`
    ).join('');
}

// Password strength calculation
function calculateStrength(password) {
    let strength = 0;
    const checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        special: /[@#$%^&*]/.test(password),
        mixed: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*]).+$/.test(password),
        noCommon: !/password|123456|admin/i.test(password)
    };

    strength += password.length * 5;
    strength += Object.values(checks).filter(Boolean).length * 10;

    if (checks.mixed) strength += 20;
    if (checks.noCommon) strength += 10;

    strength = Math.min(100, strength);

    const strengthBar = document.getElementById('strengthBar');
    strengthBar.style.width = `${strength}%`;
    
    if (strength >= 100) {
        addAchievement('perfect_score');
    }

    return strength;
}


// Initialize game elements
const startButton = document.getElementById('start-button');
const hackerAlias = document.getElementById('hacker-alias');
const errorMessage = document.getElementById('error-message');
const gameStart = document.getElementById('game-start');
const gameContainer = document.getElementById('game-container');

// Add event listeners
startButton.addEventListener('click', validateAndStartGame);
hackerAlias.addEventListener('input', validateAlias);
document.getElementById('check-password').addEventListener('click', checkPassword);
document.getElementById('password-input').addEventListener('input', (e) => {
    calculateStrength(e.target.value);
});

function validateAlias() {
    const alias = hackerAlias.value.trim();
    if (alias.length < 3) {
        errorMessage.textContent = 'Alias must be at least 3 characters long';
        return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
        errorMessage.textContent = 'Alias can only contain letters, numbers, underscores, and hyphens';
        return false;
    }
    errorMessage.textContent = '';
    return true;
}

function validateAndStartGame() {
    if (validateAlias()) {
        startGame();
    }
}

function startGame() {
    const playerAlias = hackerAlias.value.trim();
    gameStart.style.display = 'none';
    gameContainer.style.display = 'grid';
    
    gameActive = true;
    currentLevel = 0;
    score = 0;
    xp = 0;
    
    addSystemLog(`Welcome, ${playerAlias}! System initialized.`);
    addTerminalLine('Starting security breach simulation...');
    
    updateLevel();
    startTimer();
}

function addTerminalLine(text) {
    const terminal = document.getElementById('terminal');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `> ${text}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

function addSystemLog(text) {
    const log = document.getElementById('system-log');
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
}

function calculateStrength(password) {
    let strength = 0;
    strength += password.length * 5;
    if (/[A-Z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 10;
    if (/[^A-Za-z0-9]/.test(password)) strength += 15;
    
    strength = Math.min(100, strength);
    document.getElementById('strengthBar').style.width = `${strength}%`;
    return strength;
}

function updateLevel() {
    document.getElementById('level').textContent = currentLevel + 1;
    document.getElementById('challenge-description').textContent = levels[currentLevel].description;
    
    const reqDiv = document.getElementById('requirements');
    reqDiv.innerHTML = levels[currentLevel].requirements.map(req =>
        `<div class="requirement">${req}</div>`
    ).join('');
}

function startTimer() {
    clearInterval(timerInterval);
    timeLeft = 30;
    updateTimer();
    
    timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            gameOver();
        }
    }, 1000);
}

function updateTimer() {
    document.getElementById('timer').textContent = timeLeft;
}

function checkPassword() {
    if (!gameActive) return;
    
    const input = document.getElementById('password-input');
    const password = input.value;
    const level = levels[currentLevel];

    if (level.check(password)) {
        const totalScore = level.baseScore + (timeLeft * 10);
        score += totalScore;
        xp += 100;
        
        document.getElementById('score').textContent = score;
        document.getElementById('xp').textContent = xp;
        
        addTerminalLine(`Access granted! Score: ${totalScore}`);
        
        if (currentLevel < levels.length - 1) {
            currentLevel++;
            updateLevel();
            input.value = '';
            startTimer();
        } else {
            gameOver(true);
        }
    } else {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        addTerminalLine('Access denied: Password requirements not met');
    }
}

function gameOver(completed = false) {
    gameActive = false;
    clearInterval(timerInterval);
    
    if (completed) {
        addTerminalLine('Congratulations! All security systems breached!');
        addSystemLog(`Game completed with score: ${score}`);
    } else {
        addTerminalLine('Time out! Security systems locked!');
        addSystemLog('Game over: Time expired');
    }
    
    // Add restart option
    setTimeout(() => {
        if (confirm('Game Over! Would you like to play again?')) {
            resetGame();
        }
    }, 1000);
}

function resetGame() {
    gameActive = false;
    gameStart.style.display = 'block';
    gameContainer.style.display = 'none';
    hackerAlias.value = '';
    document.getElementById('password-input').value = '';
    errorMessage.textContent = '';
}

// Level management
function updateLevel() {
    document.getElementById('level').textContent = currentLevel + 1;
    document.getElementById('challenge-description').textContent = levels[currentLevel].description;
    
    const reqDiv = document.getElementById('requirements');
    reqDiv.innerHTML = levels[currentLevel].requirements.map(req =>
        `<div class="requirement">${req}</div>`
    ).join('');

    startTimer();
    addTerminalLine(`Level ${currentLevel + 1} initialized: ${levels[currentLevel].name}`);
    addSystemLog(`Starting level ${currentLevel + 1}`);
}

function checkPassword() {
    const input = document.getElementById('passwordInput');
    const password = input.value;
    const level = levels[currentLevel];

    if (level.check(password)) {
        const timeBonus = timeLeft * 10;
        const strengthBonus = calculateStrength(password);
        const totalScore = (level.baseScore + timeBonus) * scoreMultiplier;
        
        addScore(totalScore);
        addXP(100 + Math.floor(strengthBonus));
        
        if (timeLeft > 20) {
            addAchievement('speed_demon');
        }

        if (currentLevel < levels.length - 1) {
            showLevelComplete(totalScore, timeBonus);
            currentLevel++;
            updateLevel();
        } else {
            addAchievement('master_hacker');
            showGameComplete();
        }
    } else {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        addTerminalLine('Access denied: Password requirements not met');
        
        let attempts = parseInt(localStorage.getItem('attempts') || '0');
        attempts++;
        localStorage.setItem('attempts', attempts);
        
        if (attempts >= 5) {
            addAchievement('persistent');
        }
    }
}

// Modal handling
function showLevelComplete(score, bonus) {
    document.getElementById('levelScore').textContent = score;
    document.getElementById('levelBonus').textContent = bonus;
    document.getElementById('levelCompleteModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function showGameComplete() {
    const modal = document.getElementById('levelCompleteModal');
    modal.innerHTML = `
        <h2>Congratulations!</h2>
        <p>You've completed all levels!</p>
        <p>Final Score: ${score}</p>
        <p>XP Earned: ${xp}</p>
        <p>Achievements: ${achievements.size}/${Object.keys(achievementsList).length}</p>
        <button class="button" onclick="resetGame()">Play Again</button>
    `;
    modal.style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('levelCompleteModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Add these variables at the beginning
let gameActive = false;
let selectedDifficulty = 'normal';
let playerAlias = '';

// Modified initialization
window.onload = function() {
    // Initialize matrix background
    setInterval(drawMatrix, 50);

    // Setup difficulty selection
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            selectedDifficulty = this.getAttribute('data-difficulty');
        });
    });

    // Setup start game button
    document.getElementById('startGameBtn').addEventListener('click', validateAndStartGame);

    // Setup alias input validation
    document.getElementById('hackerAlias').addEventListener('input', function() {
        validateAlias(this.value);
    });
};

function validateAlias(alias) {
    const errorElement = document.getElementById('aliasError');
    if (alias.length < 3) {
        errorElement.textContent = 'Alias must be at least 3 characters long';
        return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
        errorElement.textContent = 'Alias can only contain letters, numbers, underscores, and hyphens';
        return false;
    }
    errorElement.textContent = '';
    return true;
}

function validateAndStartGame() {
    const alias = document.getElementById('hackerAlias').value;
    if (!validateAlias(alias)) {
        return;
    }

    playerAlias = alias;
    startGame();
}

function startGame() {
    // Hide start screen and show game
    document.getElementById('gameStart').style.display = 'none';
    document.getElementById('gameContainer').classList.add('active');

    // Initialize game state
    gameActive = true;
    currentLevel = 0;
    score = 0;
    xp = 0;
    scoreMultiplier = 1;

    // Update display with player info
    addSystemLog(`Welcome, ${playerAlias}! Difficulty: ${selectedDifficulty}`);
    addTerminalLine('System initialized. Starting security breach simulation...');

    // Apply difficulty modifications
    applyDifficultySettings();

    // Initialize first level
    updateLevel();
}

function applyDifficultySettings() {
    switch(selectedDifficulty) {
        case 'easy':
            timeLeft = 45; // More time
            scoreMultiplier = 0.8; // Lower scores
            break;
        case 'hard':
            timeLeft = 20; // Less time
            scoreMultiplier = 1.5; // Higher scores
            // Add additional requirements to levels
            levels.forEach(level => {
                level.baseScore *= 1.5;
            });
            break;
        default: // normal
            timeLeft = 30;
            scoreMultiplier = 1;
    }
}

// Modified timer function
function startTimer() {
    if (!gameActive) return;
    
    clearInterval(timerInterval);
    updateTimer();
    
    timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            addTerminalLine('TIME OUT: Security system reset');
            gameOver();
        }
    }, 1000);
}

function gameOver() {
    gameActive = false;
    showGameComplete();
}

// Modified reset function
function resetGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    // Show start screen again
    document.getElementById('gameContainer').classList.remove('active');
    document.getElementById('gameStart').style.display = 'flex';
    
    // Reset game elements
    document.getElementById('passwordInput').value = '';
    document.getElementById('score').textContent = '0';
    document.getElementById('xp').textContent = '0';
    document.getElementById('hackerAlias').value = '';
    
    // Reset game state
    currentLevel = 0;
    score = 0;
    xp = 0;
    scoreMultiplier = 1;
    
    closeModal();
}

// Timer system
function startTimer() {
    timeLeft = 30;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            addTerminalLine('TIME OUT: Security system reset');
            resetGame();
        }
    }, 1000);
}

function updateTimer() {
    document.getElementById('timer').textContent = timeLeft;
}

// Game initialization and reset
function resetGame() {
    currentLevel = 0;
    score = 0;
    xp = 0;
    scoreMultiplier = 1;
    document.getElementById('passwordInput').value = '';
    document.getElementById('score').textContent = '0';
    document.getElementById('xp').textContent = '0';
    updateLevel();
    closeModal();
}

// Initialize game
window.onload = function() {
    resetGame();
    setInterval(drawMatrix, 50);
};

// Event listeners
document.getElementById('passwordInput').addEventListener('input', (e) => {
    calculateStrength(e.target.value);
});