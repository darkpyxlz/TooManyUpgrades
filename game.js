// TooManyUpgrades - Core Game Logic
// Created: 2025-12-15

// Game State Object
const gameState = {
  currency: 0,
  totalClicks: 0,
  upgrades: [],
  activeEffects: [],
  lastSaveTime: null,
  gameStartTime: Date.now(),
};

// Upgrade definitions
const upgradeDefinitions = [
  {
    id: 'click-multiplier-1',
    name: 'Click Multiplier I',
    description: 'Multiply clicks by 1.5x',
    cost: 100,
    effect: { type: 'multiplier', value: 1.5 },
    maxLevel: 5,
  },
  {
    id: 'passive-income-1',
    name: 'Passive Income I',
    description: 'Generate 1 currency per second',
    cost: 500,
    effect: { type: 'passive', value: 1 },
    maxLevel: 10,
  },
  {
    id: 'critical-click',
    name: 'Critical Click',
    description: '5% chance to deal 10x damage',
    cost: 1000,
    effect: { type: 'criticalChance', value: 0.05, damageMultiplier: 10 },
    maxLevel: 3,
  },
  {
    id: 'auto-clicker',
    name: 'Auto Clicker',
    description: 'Automatically click every 2 seconds',
    cost: 2000,
    effect: { type: 'autoClick', value: 1 },
    maxLevel: 5,
  },
];

/**
 * Initialize the game
 * @param {Object} savedData - Optional saved game data
 */
function initializeGame(savedData = null) {
  if (savedData && savedData.currency !== undefined) {
    Object.assign(gameState, savedData);
  } else {
    gameState.currency = 0;
    gameState.totalClicks = 0;
    gameState.upgrades = [];
    gameState.activeEffects = [];
    gameState.gameStartTime = Date.now();
  }

  // Initialize upgrades with level 0
  gameState.upgrades = upgradeDefinitions.map((upgrade) => ({
    ...upgrade,
    level: 0,
    purchaseCount: 0,
  }));

  console.log('Game initialized:', gameState);
  startGameLoop();
}

/**
 * Handle currency click
 * @returns {number} Currency earned from this click
 */
function clickCurrency() {
  let earnedCurrency = 1;

  // Apply click multipliers from upgrades
  const clickMultipliers = gameState.upgrades
    .filter((u) => u.effect?.type === 'multiplier' && u.level > 0)
    .reduce((total, u) => total * (u.effect.value * u.level), 1);

  earnedCurrency *= clickMultipliers;

  // Check for critical hit
  const criticalUpgrade = gameState.upgrades.find(
    (u) => u.id === 'critical-click' && u.level > 0
  );
  if (
    criticalUpgrade &&
    Math.random() < criticalUpgrade.effect.criticalChance * criticalUpgrade.level
  ) {
    earnedCurrency *= criticalUpgrade.effect.damageMultiplier;
    console.log('CRITICAL HIT! +' + earnedCurrency + ' currency');
  }

  gameState.currency += earnedCurrency;
  gameState.totalClicks++;

  return earnedCurrency;
}

/**
 * Purchase an upgrade
 * @param {string} upgradeId - The ID of the upgrade to purchase
 * @returns {boolean} Success status of the purchase
 */
function purchaseUpgrade(upgradeId) {
  const upgrade = gameState.upgrades.find((u) => u.id === upgradeId);

  if (!upgrade) {
    console.warn(`Upgrade ${upgradeId} not found`);
    return false;
  }

  if (upgrade.level >= upgrade.maxLevel) {
    console.warn(`Upgrade ${upgradeId} is at maximum level`);
    return false;
  }

  // Calculate cost with exponential scaling
  const scaledCost = Math.floor(
    upgrade.cost * Math.pow(1.15, upgrade.level)
  );

  if (gameState.currency < scaledCost) {
    console.warn('Insufficient currency for upgrade purchase');
    return false;
  }

  // Deduct cost and upgrade
  gameState.currency -= scaledCost;
  upgrade.level++;
  upgrade.purchaseCount++;

  console.log(
    `Purchased upgrade: ${upgrade.name} (Level ${upgrade.level})`
  );

  // Add active effect if applicable
  if (upgrade.effect) {
    gameState.activeEffects.push({
      upgradeId,
      effect: upgrade.effect,
      level: upgrade.level,
      timestamp: Date.now(),
    });
  }

  return true;
}

/**
 * Main game loop - handles passive generation and auto effects
 */
let gameLoopInterval = null;

function gameLoop() {
  // Handle passive income
  const passiveUpgrades = gameState.upgrades.filter(
    (u) => u.effect?.type === 'passive' && u.level > 0
  );
  let passiveGeneration = 0;
  passiveUpgrades.forEach((u) => {
    passiveGeneration += u.effect.value * u.level;
  });

  if (passiveGeneration > 0) {
    gameState.currency += passiveGeneration / 10; // Per 100ms tick
  }

  // Handle auto-clicker
  const autoClickerUpgrade = gameState.upgrades.find(
    (u) => u.id === 'auto-clicker' && u.level > 0
  );
  if (autoClickerUpgrade) {
    const clicksPerSecond = autoClickerUpgrade.level * 0.5; // 0.5 clicks per second per level
    gameState.currency += clicksPerSecond / 10; // Per 100ms tick
  }

  // Periodically save game
  if (Date.now() - (gameState.lastSaveTime || 0) > 30000) {
    // Auto-save every 30 seconds
    saveGame();
  }
}

/**
 * Start the game loop
 */
function startGameLoop() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
  }
  gameLoopInterval = setInterval(gameLoop, 100); // Run every 100ms
}

/**
 * Stop the game loop
 */
function stopGameLoop() {
  if (gameLoopInterval) {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
  }
}

/**
 * Save game to localStorage
 * @returns {boolean} Success status
 */
function saveGame() {
  try {
    const saveData = {
      currency: gameState.currency,
      totalClicks: gameState.totalClicks,
      upgrades: gameState.upgrades.map((u) => ({
        id: u.id,
        level: u.level,
        purchaseCount: u.purchaseCount,
      })),
      lastSaveTime: Date.now(),
      gameStartTime: gameState.gameStartTime,
    };

    localStorage.setItem('tooManyUpgradesGameState', JSON.stringify(saveData));
    gameState.lastSaveTime = Date.now();

    console.log('Game saved at:', new Date(gameState.lastSaveTime).toISOString());
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

/**
 * Load game from localStorage
 * @returns {Object|null} Loaded game data or null if not found
 */
function loadGame() {
  try {
    const savedData = localStorage.getItem('tooManyUpgradesGameState');
    if (savedData) {
      const data = JSON.parse(savedData);
      console.log('Game loaded from save:', data);
      return data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

/**
 * Get game statistics
 * @returns {Object} Current game stats
 */
function getGameStats() {
  const uptime = Date.now() - gameState.gameStartTime;
  const totalUpgradesCost = gameState.upgrades.reduce(
    (total, u) => total + u.cost * u.level,
    0
  );

  return {
    currency: Math.floor(gameState.currency),
    totalClicks: gameState.totalClicks,
    totalUpgradesPurchased: gameState.upgrades.reduce(
      (total, u) => total + u.purchaseCount,
      0
    ),
    uptimeSeconds: Math.floor(uptime / 1000),
    lastSaveTime: gameState.lastSaveTime,
    activeUpgrades: gameState.upgrades.filter((u) => u.level > 0).length,
  };
}

/**
 * Reset game progress
 * @param {boolean} confirm - Confirmation flag
 * @returns {boolean} Success status
 */
function resetGame(confirm = false) {
  if (!confirm) {
    console.warn('Game reset requires confirmation');
    return false;
  }

  stopGameLoop();
  localStorage.removeItem('tooManyUpgradesGameState');
  gameState.currency = 0;
  gameState.totalClicks = 0;
  gameState.upgrades = upgradeDefinitions.map((upgrade) => ({
    ...upgrade,
    level: 0,
    purchaseCount: 0,
  }));
  gameState.activeEffects = [];
  gameState.gameStartTime = Date.now();
  gameState.lastSaveTime = null;

  console.log('Game reset complete');
  startGameLoop();
  return true;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    upgradeDefinitions,
    initializeGame,
    clickCurrency,
    purchaseUpgrade,
    gameLoop,
    startGameLoop,
    stopGameLoop,
    saveGame,
    loadGame,
    getGameStats,
    resetGame,
  };
}
