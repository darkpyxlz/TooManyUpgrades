// TooManyUpgrades - Complete Game System
// Updated: 2025-12-15 07:30:00 UTC

class GameState {
  constructor() {
    this.resources = {
      wood: 0,
      stone: 0,
      iron: 0,
      gold: 0,
      copper: 0,
      crystal: 0
    };

    this.production = {
      wood: 0,
      stone: 0,
      iron: 0,
      gold: 0,
      copper: 0,
      crystal: 0
    };

    this.machines = {
      woodCutter: { count: 0, baseCost: 10, costMultiplier: 1.15 },
      stoneMiner: { count: 0, baseCost: 15, costMultiplier: 1.15 },
      ironMiner: { count: 0, baseCost: 100, costMultiplier: 1.15 },
      goldMiner: { count: 0, baseCost: 500, costMultiplier: 1.15 },
      copperExtractor: { count: 0, baseCost: 300, costMultiplier: 1.15 },
      crystalHarvester: { count: 0, baseCost: 1000, costMultiplier: 1.15 }
    };

    this.upgrades = {
      woodEfficiency: { level: 0, baseCost: 50, costMultiplier: 1.2, multiplier: 1.1 },
      stoneEfficiency: { level: 0, baseCost: 75, costMultiplier: 1.2, multiplier: 1.1 },
      ironEfficiency: { level: 0, baseCost: 200, costMultiplier: 1.2, multiplier: 1.1 },
      goldEfficiency: { level: 0, baseCost: 800, costMultiplier: 1.2, multiplier: 1.1 },
      copperEfficiency: { level: 0, baseCost: 500, costMultiplier: 1.2, multiplier: 1.1 },
      crystalEfficiency: { level: 0, baseCost: 2000, costMultiplier: 1.2, multiplier: 1.1 },
      productionMultiplier: { level: 0, baseCost: 100, costMultiplier: 1.3, multiplier: 1.15 }
    };

    this.research = {
      ironMining: { unlocked: false, cost: 50, description: 'Unlock iron mining' },
      goldMining: { unlocked: false, cost: 200, description: 'Unlock gold mining' },
      copperExtraction: { unlocked: false, cost: 150, description: 'Unlock copper extraction' },
      crystalHarvesting: { unlocked: false, cost: 500, description: 'Unlock crystal harvesting' },
      advancedMachines: { unlocked: false, cost: 300, description: 'Unlock advanced machine automation' },
      massProduction: { unlocked: false, cost: 1000, description: 'Unlock mass production system' }
    };

    this.researchCompleted = {
      ironMining: false,
      goldMining: false,
      copperExtraction: false,
      crystalHarvesting: false,
      advancedMachines: false,
      massProduction: false
    };

    this.gameSettings = {
      autoSaveInterval: 5000, // 5 seconds
      tickRate: 100 // 100ms
    };

    this.stats = {
      totalClicks: 0,
      totalProductionTime: 0,
      lastSaveTime: Date.now()
    };

    this.multipliers = {
      production: 1.0,
      efficiency: {}
    };

    this.initializeEfficiencyMultipliers();
  }

  initializeEfficiencyMultipliers() {
    Object.keys(this.resources).forEach(resource => {
      this.multipliers.efficiency[resource] = 1.0;
    });
  }

  getEffectiveProduction(resource) {
    const baseProduction = this.production[resource] || 0;
    const efficiency = this.multipliers.efficiency[resource] || 1.0;
    const globalMultiplier = this.multipliers.production;
    return baseProduction * efficiency * globalMultiplier;
  }

  getResourceUnlocked(resource) {
    switch (resource) {
      case 'iron':
        return this.researchCompleted.ironMining;
      case 'gold':
        return this.researchCompleted.goldMining;
      case 'copper':
        return this.researchCompleted.copperExtraction;
      case 'crystal':
        return this.researchCompleted.crystalHarvesting;
      default:
        return true;
    }
  }
}

class GameEngine {
  constructor() {
    this.gameState = new GameState();
    this.uiUpdateCallbacks = [];
    this.gameLoopId = null;
    this.autoSaveId = null;
    this.lastProductionUpdate = Date.now();
  }

  // ===== RESOURCE GATHERING =====
  clickGather(resourceType, amount = 1) {
    if (this.gameState.resources.hasOwnProperty(resourceType)) {
      this.gameState.resources[resourceType] += amount;
      this.gameState.stats.totalClicks += 1;
      this.notifyUIUpdate();
      return true;
    }
    return false;
  }

  // ===== MACHINE SYSTEM =====
  getMachineCost(machineType) {
    const machine = this.gameState.machines[machineType];
    if (!machine) return 0;
    return Math.ceil(machine.baseCost * Math.pow(machine.costMultiplier, machine.count));
  }

  canAffordMachine(machineType, resourceType) {
    const cost = this.getMachineCost(machineType);
    return this.gameState.resources[resourceType] >= cost;
  }

  buyMachine(machineType, resourceType) {
    if (!this.gameState.machines[machineType]) return false;

    const cost = this.getMachineCost(machineType);

    if (!this.canAffordMachine(machineType, resourceType)) return false;

    // Deduct cost
    this.gameState.resources[resourceType] -= cost;
    this.gameState.machines[machineType].count += 1;

    // Update production
    this.updateProduction();
    this.notifyUIUpdate();
    return true;
  }

  getMachineProduction(machineType) {
    const productionValues = {
      woodCutter: 0.5,
      stoneMiner: 0.4,
      ironMiner: 0.6,
      goldMiner: 0.3,
      copperExtractor: 0.5,
      crystalHarvester: 0.2
    };
    return productionValues[machineType] || 0;
  }

  updateProduction() {
    // Reset production
    Object.keys(this.gameState.production).forEach(resource => {
      this.gameState.production[resource] = 0;
    });

    // Calculate production from machines
    const machineToResource = {
      woodCutter: 'wood',
      stoneMiner: 'stone',
      ironMiner: 'iron',
      goldMiner: 'gold',
      copperExtractor: 'copper',
      crystalHarvester: 'crystal'
    };

    Object.entries(machineToResource).forEach(([machine, resource]) => {
      const machineCount = this.gameState.machines[machine].count;
      const baseProduction = this.getMachineProduction(machine);
      const resourceMultiplier = this.gameState.upgrades[resource + 'Efficiency'].level;
      const productionMultiplier = Math.pow(this.gameState.upgrades.productionMultiplier.multiplier, this.gameState.upgrades.productionMultiplier.level);
      
      this.gameState.production[resource] = machineCount * baseProduction * productionMultiplier;
      this.gameState.multipliers.efficiency[resource] = Math.pow(this.gameState.upgrades[resource + 'Efficiency'].multiplier, resourceMultiplier);
    });
  }

  // ===== RESEARCH SYSTEM =====
  canResearch(researchType) {
    const research = this.gameState.research[researchType];
    if (!research || this.gameState.researchCompleted[researchType]) return false;

    // Check resource requirements (wood and stone for basic research)
    return this.gameState.resources.wood >= research.cost * 0.5 && 
           this.gameState.resources.stone >= research.cost * 0.5;
  }

  instantResearch(researchType) {
    if (!this.canResearch(researchType)) return false;

    const research = this.gameState.research[researchType];
    
    // Deduct resources
    this.gameState.resources.wood -= Math.ceil(research.cost * 0.5);
    this.gameState.resources.stone -= Math.ceil(research.cost * 0.5);

    // Complete research instantly
    this.gameState.researchCompleted[researchType] = true;

    // Handle research effects
    this.applyResearchEffects(researchType);

    this.notifyUIUpdate();
    return true;
  }

  applyResearchEffects(researchType) {
    switch (researchType) {
      case 'ironMining':
        // Iron mining is now available
        break;
      case 'goldMining':
        // Gold mining is now available
        break;
      case 'copperExtraction':
        // Copper extraction is now available
        break;
      case 'crystalHarvesting':
        // Crystal harvesting is now available
        break;
      case 'advancedMachines':
        // Reduce machine costs by 10%
        Object.keys(this.gameState.machines).forEach(machine => {
          this.gameState.machines[machine].costMultiplier *= 0.95;
        });
        break;
      case 'massProduction':
        // Increase production by 25%
        this.gameState.multipliers.production *= 1.25;
        break;
    }
    this.updateProduction();
  }

  // ===== UPGRADE SYSTEM =====
  getUpgradeCost(upgradeType) {
    const upgrade = this.gameState.upgrades[upgradeType];
    if (!upgrade) return 0;
    return Math.ceil(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
  }

  canAffordUpgrade(upgradeType) {
    const cost = this.getUpgradeCost(upgradeType);
    return this.gameState.resources.stone >= cost;
  }

  buyUpgrade(upgradeType) {
    if (!this.gameState.upgrades[upgradeType]) return false;

    const cost = this.getUpgradeCost(upgradeType);

    if (!this.canAffordUpgrade(upgradeType)) return false;

    // Deduct cost
    this.gameState.resources.stone -= cost;
    this.gameState.upgrades[upgradeType].level += 1;

    // Update production
    this.updateProduction();
    this.notifyUIUpdate();
    return true;
  }

  // ===== PRODUCTION TICK =====
  tick() {
    const now = Date.now();
    const deltaTime = (now - this.lastProductionUpdate) / 1000; // Convert to seconds
    this.lastProductionUpdate = now;

    Object.keys(this.gameState.resources).forEach(resource => {
      if (this.gameState.getResourceUnlocked(resource)) {
        const effectiveProduction = this.gameState.getEffectiveProduction(resource);
        const amountProduced = (effectiveProduction * deltaTime) / 10; // Adjust rate
        this.gameState.resources[resource] += amountProduced;
      }
    });

    this.gameState.stats.totalProductionTime += deltaTime;
  }

  startGameLoop() {
    if (this.gameLoopId) clearInterval(this.gameLoopId);

    this.gameLoopId = setInterval(() => {
      this.tick();
      this.notifyUIUpdate();
    }, this.gameState.gameSettings.tickRate);
  }

  stopGameLoop() {
    if (this.gameLoopId) {
      clearInterval(this.gameLoopId);
      this.gameLoopId = null;
    }
  }

  // ===== SAVE/LOAD SYSTEM =====
  save() {
    const saveData = {
      gameState: this.gameState,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('TooManyUpgrades_SaveData', JSON.stringify(saveData));
    this.gameState.stats.lastSaveTime = Date.now();
    console.log('Game saved at', new Date().toLocaleString());
    this.notifyUIUpdate();
  }

  load() {
    const saveData = localStorage.getItem('TooManyUpgrades_SaveData');
    if (saveData) {
      try {
        const parsed = JSON.parse(saveData);
        this.gameState = Object.assign(new GameState(), parsed.gameState);
        this.gameState.initializeEfficiencyMultipliers();
        this.updateProduction();
        this.lastProductionUpdate = Date.now();
        console.log('Game loaded from', parsed.timestamp);
        this.notifyUIUpdate();
        return true;
      } catch (e) {
        console.error('Failed to load game:', e);
        return false;
      }
    }
    return false;
  }

  startAutoSave() {
    if (this.autoSaveId) clearInterval(this.autoSaveId);

    this.autoSaveId = setInterval(() => {
      this.save();
    }, this.gameState.gameSettings.autoSaveInterval);
  }

  stopAutoSave() {
    if (this.autoSaveId) {
      clearInterval(this.autoSaveId);
      this.autoSaveId = null;
    }
  }

  // ===== UI UPDATES =====
  registerUIUpdateCallback(callback) {
    this.uiUpdateCallbacks.push(callback);
  }

  notifyUIUpdate() {
    this.uiUpdateCallbacks.forEach(callback => callback(this.gameState));
  }

  // ===== UTILITY FUNCTIONS =====
  getGameStatus() {
    return {
      resources: this.gameState.resources,
      production: this.gameState.production,
      machines: this.gameState.machines,
      upgrades: this.gameState.upgrades,
      research: this.gameState.research,
      researchCompleted: this.gameState.researchCompleted,
      multipliers: this.gameState.multipliers,
      stats: this.gameState.stats
    };
  }

  reset() {
    this.stopGameLoop();
    this.stopAutoSave();
    this.gameState = new GameState();
    localStorage.removeItem('TooManyUpgrades_SaveData');
    console.log('Game reset');
    this.notifyUIUpdate();
  }

  exportSave() {
    const saveData = localStorage.getItem('TooManyUpgrades_SaveData');
    if (saveData) {
      return saveData;
    }
    return null;
  }

  importSave(saveDataString) {
    try {
      const parsed = JSON.parse(saveDataString);
      localStorage.setItem('TooManyUpgrades_SaveData', saveDataString);
      return this.load();
    } catch (e) {
      console.error('Failed to import save:', e);
      return false;
    }
  }

  getFormattedTime() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  }
}

// ===== GLOBAL GAME INSTANCE =====
const game = new GameEngine();

// Initialize game
function initGame() {
  // Load existing save or start new game
  if (!game.load()) {
    console.log('Starting new game');
  }

  // Start game loops
  game.startGameLoop();
  game.startAutoSave();

  console.log('Game initialized at', game.getFormattedTime());
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  game.save();
  game.stopGameLoop();
  game.stopAutoSave();
});

// Public API for HTML integration
window.GameAPI = {
  clickWood: (amount = 1) => game.clickGather('wood', amount),
  clickStone: (amount = 1) => game.clickGather('stone', amount),
  buyMachine: (machineType, resourceType) => game.buyMachine(machineType, resourceType),
  research: (researchType) => game.instantResearch(researchType),
  buyUpgrade: (upgradeType) => game.buyUpgrade(upgradeType),
  save: () => game.save(),
  load: () => game.load(),
  reset: () => game.reset(),
  getStatus: () => game.getGameStatus(),
  formatNumber: (num) => game.formatNumber(num),
  getFormattedTime: () => game.getFormattedTime(),
  exportSave: () => game.exportSave(),
  importSave: (data) => game.importSave(data),
  registerUICallback: (callback) => game.registerUIUpdateCallback(callback)
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

