import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

type GameState = 'selection' | 'reveal' | 'final' | 'result';
type Door = 'car' | 'goat';

const App = () => {
  const [doors, setDoors] = useState<Door[]>([]);
  const [selectedDoor, setSelectedDoor] = useState<number | null>(null);
  const [revealedDoor, setRevealedDoor] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState>('selection');
  const [won, setWon] = useState<boolean>(false);
  const [switched, setSwitched] = useState<boolean>(false);
  
  // Stats
  const [stayWins, setStayWins] = useState<number>(0);
  const [stayLosses, setStayLosses] = useState<number>(0);
  const [switchWins, setSwitchWins] = useState<number>(0);
  const [switchLosses, setSwitchLosses] = useState<number>(0);
  const [isAutoRunning, setIsAutoRunning] = useState<boolean>(false);
  const [autoRunCount, setAutoRunCount] = useState<number>(1000);
  const [autoRunProgress, setAutoRunProgress] = useState<number>(0);
  const [winRateHistory, setWinRateHistory] = useState<Array<{trials: number, stayWinRate: number, switchWinRate: number}>>([]);
  const [chartsCollapsed, setChartsCollapsed] = useState<boolean>(true);

  // Setup the game
  const setupGame = () => {
    // Randomly place the car behind one of the doors
    const newDoors: Door[] = ['goat', 'goat', 'goat'];
    const carPosition = Math.floor(Math.random() * 3);
    newDoors[carPosition] = 'car';
    
    setDoors(newDoors);
    setSelectedDoor(null);
    setRevealedDoor(null);
    setGameState('selection');
    setWon(false);
    setSwitched(false);
  };

  // Initial setup
  useEffect(() => {
    setupGame();
  }, []);

  // Handle door selection
  const handleDoorSelect = (doorIndex: number) => {
    if (gameState !== 'selection') return;
    
    setSelectedDoor(doorIndex);
    
    // Host reveals a goat door (not the selected one and not the car)
    const availableDoors = [0, 1, 2].filter(
      i => i !== doorIndex && doors[i] !== 'car'
    );
    
    // If multiple goat doors are available, randomly select one
    const doorToReveal = availableDoors[Math.floor(Math.random() * availableDoors.length)];
    setRevealedDoor(doorToReveal);
    setGameState('reveal');
  };

  // Handle door selection after reveal (for final choice)
  const handleFinalDoorSelect = (doorIndex: number) => {
    if (gameState !== 'reveal') return;
    
    // Determine if this is switching or staying
    const isSwitch = doorIndex !== selectedDoor;
    setSwitched(isSwitch);
    
    // Only allow selecting the original door or the one remaining door
    if (doorIndex === revealedDoor) return;
    
    // Update selected door
    setSelectedDoor(doorIndex);
    setGameState('final');

    // Check if won
    const hasWon = doors[doorIndex] === 'car';
    setWon(hasWon);
    
    // Update stats
    if (isSwitch) {
      if (hasWon) setSwitchWins(prev => prev + 1);
      else setSwitchLosses(prev => prev + 1);
    } else {
      if (hasWon) setStayWins(prev => prev + 1);
      else setStayLosses(prev => prev + 1);
    }
    
    setGameState('result');
  };

  // Auto-run simulation
  const runSimulation = async (count: number) => {
    if (isAutoRunning) return;
    
    // Reset stats before starting new simulation
    resetStats();
    
    setIsAutoRunning(true);
    setAutoRunProgress(0);
    
    // Results counters
    let stayWinsCount = 0;
    let stayLossesCount = 0;
    let switchWinsCount = 0;
    let switchLossesCount = 0;
    
    // Adjust batch size based on total count to control speed
    // Smaller batch size = slower simulation = better visualization
    const BATCH_SIZE = Math.max(1, Math.min(50, Math.floor(count / 20)));
    
    // Calculate number of history points to record (about 20 points max)
    const historyInterval = Math.max(1, Math.floor(count / 20));
    
    try {
      // Process in small batches for smoother UI updates
      for (let i = 0; i < count; i += BATCH_SIZE) {
        // Handle last partial batch
        const currentBatchSize = Math.min(BATCH_SIZE, count - i);
        
        // Run this batch of simulations
        for (let j = 0; j < currentBatchSize; j++) {
          // Place car behind a random door (0, 1, or 2)
          const carPosition = Math.floor(Math.random() * 3);
          
          // Player randomly picks a door
          const playerPick = Math.floor(Math.random() * 3);
          
          // If player picks car door
          if (playerPick === carPosition) {
            stayWinsCount++;     // Staying wins
            switchLossesCount++; // Switching loses
          } else {
            stayLossesCount++;   // Staying loses
            switchWinsCount++;   // Switching wins
          }
        }
        
        // Calculate current progress and update UI
        const completedTrials = Math.min(count, i + currentBatchSize);
        
        // Update all state variables
        setStayWins(stayWinsCount);
        setStayLosses(stayLossesCount);
        setSwitchWins(switchWinsCount);
        setSwitchLosses(switchLossesCount);
        setAutoRunProgress(completedTrials);
        
        // Record history at regular intervals or at the end
        if (i % historyInterval === 0 || completedTrials === count) {
          const totalStay = stayWinsCount + stayLossesCount;
          const totalSwitch = switchWinsCount + switchLossesCount;
          
          const entry = {
            trials: completedTrials,
            stayWinRate: totalStay > 0 ? Math.round((stayWinsCount / totalStay) * 1000) / 10 : 0,
            switchWinRate: totalSwitch > 0 ? Math.round((switchWinsCount / totalSwitch) * 1000) / 10 : 0
          };
          
          setWinRateHistory(prev => [...prev, entry]);
        }
        
        // Slow down simulation for better visual feedback
        // Adjust pause time based on total count - longer pauses for smaller simulations
        const pauseTime = count < 100 ? 100 : count < 500 ? 50 : count < 1000 ? 30 : 10;
        await new Promise(resolve => setTimeout(resolve, pauseTime));
      }
      
      // Final update with exact count to ensure progress bar completes
      console.log("Simulation complete: setting final progress to", count);
      setAutoRunProgress(count);
      
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      // Always mark as complete
      setIsAutoRunning(false);
    }
  };

  // Reset all stats
  const resetStats = () => {
    setStayWins(0);
    setStayLosses(0);
    setSwitchWins(0);
    setSwitchLosses(0);
    setWinRateHistory([]);
  };

  return (
    <div className="app">
      <h1>Monty Hall Problem</h1>
      
      <div className="game-container">
        <div className="doors-container">
          {[0, 1, 2].map(doorIndex => (
            <div 
              key={doorIndex}
              className={`door ${selectedDoor === doorIndex ? 'selected' : ''} 
                          ${revealedDoor === doorIndex || gameState === 'result' ? 'revealed' : ''}`}
              onClick={() => 
                gameState === 'selection' 
                  ? handleDoorSelect(doorIndex) 
                  : gameState === 'reveal' 
                    ? handleFinalDoorSelect(doorIndex)
                    : undefined
              }
            >
              <div className="door-front">
                <span>{doorIndex + 1}</span>
              </div>
              <div className="door-back">
                {gameState === 'result' || revealedDoor === doorIndex ? (
                  doors[doorIndex] === 'car' ? '🚗' : '🐐'
                ) : '?'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="game-controls">
          {gameState === 'selection' && (
            <p>Select a door to begin</p>
          )}
          
          {gameState === 'reveal' && (
            <div>
              <p>Door {(revealedDoor as number) + 1} has a goat! Click on a door to make your final choice.</p>
              <div className="door-options">
                <div className="door-option">
                  <span className="option-label">STAY</span>
                  <span className="option-door">Door {(selectedDoor as number) + 1}</span>
                </div>
                <div className="door-option">
                  <span className="option-label">SWITCH</span>
                  <span className="option-door">
                    Door {([0, 1, 2].find(i => i !== selectedDoor && i !== revealedDoor) as number) + 1}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {gameState === 'result' && (
            <div>
              <p className={won ? 'win-message' : 'lose-message'}>
                You {won ? 'won' : 'lost'}! {won ? '🎉' : '😢'} 
                You {switched ? 'switched' : 'stayed'} with your initial choice.
              </p>
              <button onClick={setupGame}>Play Again</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="stats-container">
        <h2>Statistics</h2>
        <div className="stats-grid">
          <div className="stat-box">
            <h3>Staying</h3>
            <p>Wins: {stayWins} ({stayWins + stayLosses > 0 
              ? Math.round((stayWins / (stayWins + stayLosses)) * 100) 
              : 0}%)</p>
            <p>Losses: {stayLosses}</p>
          </div>
          
          <div className="stat-box">
            <h3>Switching</h3>
            <p>Wins: {switchWins} ({switchWins + switchLosses > 0 
              ? Math.round((switchWins / (switchWins + switchLosses)) * 100) 
              : 0}%)</p>
            <p>Losses: {switchLosses}</p>
          </div>
        </div>
        
        <div className="simulation-controls">
          <h3>Auto Simulation</h3>
          <div className="input-group">
            <label htmlFor="sim-count">Number of trials:</label>
            <input 
              id="sim-count"
              type="number" 
              min="1"
              max="10000"
              value={autoRunCount}
              onChange={(e) => setAutoRunCount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isAutoRunning}
            />
          </div>
          
          {/* Progress bar that shows during simulation */}
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${Math.min(100, Math.max(0, (autoRunProgress / autoRunCount) * 100))}%`,
                  transition: 'width 0.3s ease-in-out'
                }}
              ></div>
              <span>{autoRunProgress} / {autoRunCount}</span>
            </div>
            
            {isAutoRunning && (
              <div className="progress-message">
                Running simulation... ({Math.floor((autoRunProgress / autoRunCount) * 100)}% complete)
              </div>
            )}
          </div>
          
          <div className="button-group">
            <button 
              onClick={() => runSimulation(autoRunCount)}
              disabled={isAutoRunning}
            >
              Run Simulation
            </button>
            <button 
              onClick={resetStats}
              disabled={isAutoRunning}
            >
              Reset Stats
            </button>
          </div>
          
          {winRateHistory.length > 1 && (
            <div className="chart-wrapper sim-history-chart">
              <h4>Win Rate Convergence</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={winRateHistory}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="trials" 
                    label={{ value: 'Number of Trials', position: 'insideBottomRight', offset: -10 }} 
                  />
                  <YAxis 
                    domain={[0, 100]}
                    label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="stayWinRate" 
                    name="Stay Win Rate" 
                    stroke="#e74c3c" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="switchWinRate" 
                    name="Switch Win Rate" 
                    stroke="#2ecc71" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  
                  {/* Theoretical lines */}
                  <Line 
                    dataKey={() => 33.33}
                    name="Theoretical Stay (33.33%)"
                    stroke="#e74c3c"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                  <Line 
                    dataKey={() => 66.67}
                    name="Theoretical Switch (66.67%)"
                    stroke="#2ecc71"
                    strokeDasharray="5 5"
                    strokeWidth={1}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        <div className="charts-container">
          <div className="charts-header" onClick={() => setChartsCollapsed(!chartsCollapsed)}>
            <h3>Detailed Visualizations</h3>
            <button className="toggle-btn">
              {chartsCollapsed ? 'Show Charts' : 'Hide Charts'}
            </button>
          </div>
          
          {/* These charts can be collapsed */}
          <div className={`collapsible-charts ${chartsCollapsed ? 'collapsed' : ''}`}>
            <div className="chart-wrapper">
              <h4>Win Rate Comparison</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { 
                      name: 'Stay', 
                      winRate: stayWins + stayLosses > 0 
                        ? Math.round((stayWins / (stayWins + stayLosses)) * 100) 
                        : 0,
                      totalGames: stayWins + stayLosses
                    },
                    { 
                      name: 'Switch', 
                      winRate: switchWins + switchLosses > 0 
                        ? Math.round((switchWins / (switchWins + switchLosses)) * 100) 
                        : 0,
                      totalGames: switchWins + switchLosses
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, 'Win Rate']}
                    labelFormatter={() => ''}
                  />
                  <Legend />
                  <Bar dataKey="winRate" name="Win Rate (%)" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="charts-row">
              <div className="chart-wrapper">
                <h4>Stay Results</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wins', value: stayWins },
                        { name: 'Losses', value: stayLosses }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#2ecc71" />
                      <Cell fill="#e74c3c" />
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Games']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-wrapper">
                <h4>Switch Results</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wins', value: switchWins },
                        { name: 'Losses', value: switchLosses }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill="#2ecc71" />
                      <Cell fill="#e74c3c" />
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Games']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="explanation">
        <h2>What is the Monty Hall Problem?</h2>
        <p>
          The Monty Hall problem is a probability puzzle named after the host of the TV game show "Let's Make a Deal."
          In the problem, you're presented with three doors. Behind one door is a car, and behind the other two are goats.
        </p>
        <p>
          You pick a door, say Door 1. The host, who knows what's behind each door, opens another door, say Door 3, 
          revealing a goat. The host then asks if you want to switch your choice to the remaining door (Door 2).
        </p>
        <p>
          <strong>The key insight:</strong> Switching doors gives you a 2/3 chance of winning, 
          while staying with your original choice gives you a 1/3 chance.
        </p>
        
        <h3>Why is switching better?</h3>
        <p>
          Initially, your chance of picking the car is 1/3, and the chance of picking a goat is 2/3.
        </p>
        <p>
          When the host reveals a goat, they're using their knowledge of the doors to always show you a goat. 
          This doesn't change your initial 1/3 probability of having picked the car.
        </p>
        <p>
          Therefore, the probability that the car is behind one of the other doors remains 2/3. 
          Since one of those doors has now been opened to reveal a goat, the entire 2/3 probability 
          shifts to the remaining unopened door. So switching gives you a 2/3 chance of winning.
        </p>
        <p>
          Run the auto-simulation with a large number of trials to see this mathematical advantage in action!
        </p>
      </div>
    </div>
  );
};

export default App;