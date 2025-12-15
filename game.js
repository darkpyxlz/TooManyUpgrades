import React, { useState, useEffect, useRef } from 'react';

const TooManyUpgrades = () => {
  const [gameState, setGameState] = useState({
    resources: { wood: 0, stone: 0, iron: 0, steel: 0, silicon: 0, chips: 0, uranium: 0, quantumChip: 0, plutonium: 0 },
    production: { wood: 0, stone: 0, iron: 0, steel: 0, silicon: 0, chips: 0, uranium: 0, quantumChip: 0, plutonium: 0 },
    machines: {
      woodCutter: { count: 0, baseCost: { wood: 10 }, costMult: 1.15, production: 0.5 },
      stoneMiner: { count: 0, baseCost: { stone: 15 }, costMult: 1.15, production: 0.4 },
      ironMiner: { count: 0, baseCost: { iron: 20, stone: 30 }, costMult: 1.15, production: 0.3 },
      steelForge: { count: 0, baseCost: { iron: 50, wood: 50 }, costMult: 1.15, production: 0.2 },
      siliconExtractor: { count: 0, baseCost: { stone: 100, iron: 50 }, costMult: 1.15, production: 0.15 },
      chipFactory: { count: 0, baseCost: { silicon: 30, steel: 40 }, costMult: 1.15, production: 0.1 },
      uraniumMine: { count: 0, baseCost: { iron: 200, steel: 100 }, costMult: 1.15, production: 0.08 },
      quantumLab: { count: 0, baseCost: { chips: 50, uranium: 20 }, costMult: 1.15, production: 0.05 },
      plutoniumReactor: { count: 0, baseCost: { uranium: 100, quantumChip: 10 }, costMult: 1.15, production: 0.03 }
    },
    technologies: {
      efficientLogging: { unlocked: false, cost: { wood: 50, stone: 50 }, desc: 'Wood production +50%', effect: 'woodProd' },
      advancedMining: { unlocked: false, cost: { stone: 100, iron: 50 }, desc: 'Stone & Iron production +50%', effect: 'stoneProd' },
      industrialAge: { unlocked: false, cost: { iron: 200, steel: 100 }, desc: 'Unlock Tier 2 materials', effect: 'unlockT2' },
      digitalAge: { unlocked: false, cost: { steel: 300, silicon: 150 }, desc: 'Unlock Tier 3 materials', effect: 'unlockT3' },
      quantumAge: { unlocked: false, cost: { chips: 200, uranium: 100 }, desc: 'Unlock Tier 4 materials', effect: 'unlockT4' },
      automation: { unlocked: false, cost: { chips: 100, steel: 200 }, desc: 'All production +100%', effect: 'globalProd' }
    },
    stats: { totalClicks: 0, playTime: 0 },
    multipliers: { wood: 1, stone: 1, iron: 1, steel: 1, silicon: 1, chips: 1, uranium: 1, quantumChip: 1, plutonium: 1, global: 1 },
    unlockedTiers: [1]
  });

  const [activeTab, setActiveTab] = useState('resources');
  const [darkMode, setDarkMode] = useState(true);
  const lastTickRef = useRef(Date.now());
  const startTimeRef = useRef(Date.now());

  const resourceTiers = {
    1: ['wood', 'stone', 'iron'],
    2: ['steel', 'silicon'],
    3: ['chips', 'uranium'],
    4: ['quantumChip', 'plutonium']
  };

  const resourceNames = {
    wood: 'Wood', stone: 'Stone', iron: 'Iron',
    steel: 'Steel', silicon: 'Silicon',
    chips: 'Chips', uranium: 'Uranium',
    quantumChip: 'Quantum Chip', plutonium: 'Plutonium'
  };

  const machineToResource = {
    woodCutter: 'wood', stoneMiner: 'stone', ironMiner: 'iron',
    steelForge: 'steel', siliconExtractor: 'silicon', chipFactory: 'chips',
    uraniumMine: 'uranium', quantumLab: 'quantumChip', plutoniumReactor: 'plutonium'
  };

  const machineNames = {
    woodCutter: 'Wood Cutter', stoneMiner: 'Stone Miner', ironMiner: 'Iron Miner',
    steelForge: 'Steel Forge', siliconExtractor: 'Silicon Extractor', chipFactory: 'Chip Factory',
    uraniumMine: 'Uranium Mine', quantumLab: 'Quantum Lab', plutoniumReactor: 'Plutonium Reactor'
  };

  // Calculate machine cost
  const getMachineCost = (machineType) => {
    const machine = gameState.machines[machineType];
    const costs = {};
    Object.entries(machine.baseCost).forEach(([resource, baseCost]) => {
      costs[resource] = Math.ceil(baseCost * Math.pow(machine.costMult, machine.count));
    });
    return costs;
  };

  // Check if can afford
  const canAfford = (costs) => {
    return Object.entries(costs).every(([resource, cost]) => gameState.resources[resource] >= cost);
  };

  // Buy machine
  const buyMachine = (machineType) => {
    const costs = getMachineCost(machineType);
    if (!canAfford(costs)) return;

    setGameState(prev => {
      const newState = { ...prev };
      Object.entries(costs).forEach(([resource, cost]) => {
        newState.resources[resource] -= cost;
      });
      newState.machines[machineType].count += 1;
      return newState;
    });
  };

  // Research technology
  const researchTech = (techName) => {
    const tech = gameState.technologies[techName];
    if (tech.unlocked || !canAfford(tech.cost)) return;

    setGameState(prev => {
      const newState = { ...prev };
      Object.entries(tech.cost).forEach(([resource, cost]) => {
        newState.resources[resource] -= cost;
      });
      newState.technologies[techName].unlocked = true;

      // Apply effects
      if (tech.effect === 'woodProd') newState.multipliers.wood *= 1.5;
      if (tech.effect === 'stoneProd') {
        newState.multipliers.stone *= 1.5;
        newState.multipliers.iron *= 1.5;
      }
      if (tech.effect === 'unlockT2') newState.unlockedTiers.push(2);
      if (tech.effect === 'unlockT3') newState.unlockedTiers.push(3);
      if (tech.effect === 'unlockT4') newState.unlockedTiers.push(4);
      if (tech.effect === 'globalProd') newState.multipliers.global *= 2;

      return newState;
    });
  };

  // Manual gathering
  const gatherResource = (resource) => {
    setGameState(prev => ({
      ...prev,
      resources: { ...prev.resources, [resource]: prev.resources[resource] + 1 },
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 }
    }));
  };

  // Game tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newState = { ...prev };
        
        // Update production
        Object.entries(machineToResource).forEach(([machine, resource]) => {
          const count = newState.machines[machine].count;
          const baseProd = newState.machines[machine].production;
          const mult = newState.multipliers[resource] * newState.multipliers.global;
          newState.production[resource] = count * baseProd * mult;
          newState.resources[resource] += newState.production[resource] * delta;
        });

        // Update playtime
        newState.stats.playTime = Math.floor((now - startTimeRef.current) / 1000);

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Save/Load (using in-memory storage for demo)
  const saveGame = async () => {
    try {
      await window.storage.set('tooManyUpgrades_save', JSON.stringify(gameState));
      alert('Game saved!');
    } catch (e) {
      alert('Save failed - storage not available');
    }
  };

  const loadGame = async () => {
    try {
      const saved = await window.storage.get('tooManyUpgrades_save');
      if (saved && saved.value) {
        setGameState(JSON.parse(saved.value));
        startTimeRef.current = Date.now() - gameState.stats.playTime * 1000;
        alert('Game loaded!');
      } else {
        alert('No save found');
      }
    } catch (e) {
      alert('Load failed - storage not available');
    }
  };

  const resetGame = () => {
    if (confirm('Are you sure? This will delete all progress!')) {
      window.location.reload();
    }
  };

  const formatNum = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return Math.floor(num).toString();
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`min-h-screen ${bgColor} ${textColor} p-4`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-1">Too Many Upgrades</h1>
        <p className="text-sm opacity-60">v1.0.0</p>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className={`${cardBg} rounded-lg border ${borderColor} overflow-hidden`}>
          <div className="flex">
            {['resources', 'technology', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 font-semibold transition-colors ${
                  activeTab === tab
                    ? darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto">
        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="grid grid-cols-4 gap-4">
            {/* Sidebar */}
            <div className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
              <h3 className="text-lg font-bold mb-4">Materials</h3>
              {[1, 2, 3, 4].map(tier => (
                gameState.unlockedTiers.includes(tier) && (
                  <div key={tier} className="mb-4">
                    <h4 className="text-sm font-semibold opacity-70 mb-2">Tier {tier}</h4>
                    {resourceTiers[tier].map(resource => (
                      <div key={resource} className="mb-2 p-2 rounded hover:bg-opacity-50 hover:bg-gray-700 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{resourceNames[resource]}</span>
                          <span className="text-xs font-mono">{formatNum(gameState.resources[resource])}</span>
                        </div>
                        <div className="text-xs opacity-60 mt-1">
                          +{formatNum(gameState.production[resource])}/s
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>

            {/* Main Content - Machines */}
            <div className="col-span-3 grid grid-cols-3 gap-4">
              {Object.entries(machineToResource).map(([machine, resource]) => {
                const costs = getMachineCost(machine);
                const affordable = canAfford(costs);
                const tier = Object.entries(resourceTiers).find(([t, resources]) => resources.includes(resource))?.[0];
                if (!gameState.unlockedTiers.includes(parseInt(tier))) return null;

                return (
                  <div key={machine} className={`${cardBg} border ${borderColor} rounded-lg p-4 hover:shadow-lg transition-shadow`}>
                    <h3 className="font-bold text-lg mb-2">{machineNames[machine]}</h3>
                    <p className="text-sm opacity-70 mb-3">Produces {resourceNames[resource]}</p>
                    <div className="text-xs mb-3">
                      <div>Owned: {gameState.machines[machine].count}</div>
                      <div className="opacity-70">
                        Rate: {(gameState.machines[machine].production * gameState.multipliers[resource] * gameState.multipliers.global).toFixed(2)}/s
                      </div>
                    </div>
                    <div className="mb-3 text-xs">
                      <div className="font-semibold mb-1">Cost:</div>
                      {Object.entries(costs).map(([res, cost]) => (
                        <div key={res} className={gameState.resources[res] >= cost ? 'text-green-400' : 'text-red-400'}>
                          {resourceNames[res]}: {formatNum(cost)}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => buyMachine(machine)}
                      disabled={!affordable}
                      className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                        affordable
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Buy
                    </button>
                  </div>
                );
              })}

              {/* Manual Gathering Cards */}
              {['wood', 'stone', 'iron'].map(resource => (
                <div key={`click-${resource}`} className={`${cardBg} border ${borderColor} rounded-lg p-4`}>
                  <h3 className="font-bold text-lg mb-2">Gather {resourceNames[resource]}</h3>
                  <p className="text-sm opacity-70 mb-4">Click to gather manually</p>
                  <button
                    onClick={() => gatherResource(resource)}
                    className="w-full py-3 px-4 rounded font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    +1 {resourceNames[resource]}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technology Tab */}
        {activeTab === 'technology' && (
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(gameState.technologies).map(([techName, tech]) => {
              const affordable = canAfford(tech.cost);
              return (
                <div
                  key={techName}
                  className={`${cardBg} border ${borderColor} rounded-lg p-6 ${
                    tech.unlocked ? 'opacity-50' : 'hover:shadow-lg'
                  } transition-shadow`}
                >
                  <h3 className="font-bold text-xl mb-3">
                    {techName.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())}
                  </h3>
                  <p className="text-sm mb-4">{tech.desc}</p>
                  <div className="mb-4 text-sm">
                    <div className="font-semibold mb-2">Cost:</div>
                    {Object.entries(tech.cost).map(([resource, cost]) => (
                      <div key={resource} className={gameState.resources[resource] >= cost ? 'text-green-400' : 'text-red-400'}>
                        {resourceNames[resource]}: {formatNum(cost)}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => researchTech(techName)}
                    disabled={!affordable || tech.unlocked}
                    className={`w-full py-2 px-4 rounded font-semibold transition-colors ${
                      tech.unlocked
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : affordable
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {tech.unlocked ? 'Researched' : 'Research'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={`${cardBg} border ${borderColor} rounded-lg p-6 max-w-2xl mx-auto`}>
            <h2 className="text-2xl font-bold mb-6">Settings</h2>
            
            <div className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-4 border ${borderColor} rounded">
                <div>
                  <h3 className="font-semibold">Theme</h3>
                  <p className="text-sm opacity-70">Switch between light and dark mode</p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`px-4 py-2 rounded font-semibold transition-colors ${
                    darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700 hover:bg-gray-800 text-white'
                  }`}
                >
                  {darkMode ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>

              {/* Stats */}
              <div className="p-4 border ${borderColor} rounded">
                <h3 className="font-semibold mb-3">Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Clicks:</span>
                    <span className="font-mono">{gameState.stats.totalClicks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Play Time:</span>
                    <span className="font-mono">{formatTime(gameState.stats.playTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Global Multiplier:</span>
                    <span className="font-mono">x{gameState.multipliers.global.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Save/Load */}
              <div className="p-4 border ${borderColor} rounded">
                <h3 className="font-semibold mb-3">Save Management</h3>
                <div className="flex gap-3">
                  <button
                    onClick={saveGame}
                    className="flex-1 px-4 py-2 rounded font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    💾 Save Game
                  </button>
                  <button
                    onClick={loadGame}
                    className="flex-1 px-4 py-2 rounded font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
                  >
                    📂 Load Game
                  </button>
                </div>
              </div>

              {/* Reset */}
              <div className="p-4 border border-red-500 rounded">
                <h3 className="font-semibold text-red-400 mb-3">Danger Zone</h3>
                <button
                  onClick={resetGame}
                  className="w-full px-4 py-2 rounded font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  🔄 Reset Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TooManyUpgrades;

