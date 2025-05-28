# Monty Hall Problem Simulation

An interactive simulation of the famous Monty Hall probability puzzle, built with React and TypeScript.

## Overview

The Monty Hall problem is a counter-intuitive statistics puzzle:

1. There are 3 doors, behind one is a car, and behind the other two are goats.
2. You pick a door, say door 1.
3. The host, who knows what's behind each door, opens another door, say door 3, to reveal a goat.
4. The host then asks if you want to switch your choice to the remaining door (door 2) or stick with your original choice.

**The key insight**: Switching doors gives you a 2/3 chance of winning, while staying with your original choice gives you only a 1/3 chance.

## Features

- Interactive door selection
- Visualization of the host revealing a goat
- Option to stay with your original choice or switch to the other door
- Statistics tracking for both strategies
- Auto-simulation feature to run thousands of trials
- Data visualization with charts showing the results
- Convergence chart showing how win rates approach theoretical values

## Running the Project

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm start
   ```
4. Open your browser to http://localhost:5173

## Why Switching Works

Initially, your chance of picking the car is 1/3, and the chance of picking a goat is 2/3.

When the host reveals a goat, they're using their knowledge of the doors to always show you a goat. This doesn't change your initial 1/3 probability of having picked the car.

Therefore, the probability that the car is behind one of the other doors remains 2/3. Since one of those doors has now been opened to reveal a goat, the entire 2/3 probability shifts to the remaining unopened door. So switching gives you a 2/3 chance of winning.

## Built With

- React
- TypeScript
- Recharts for data visualization
- Vite for the build system and development server

## Development

This project uses Vite instead of webpack for a faster development experience. The development server automatically reloads when you make changes and provides helpful error messages.

## License

MIT