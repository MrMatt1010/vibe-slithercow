# 🐮 Cow.io - Slither.io Clone

## Game Overview
A hilarious twist on the classic slither.io game where instead of snakes, you control a **stretched-out cow**!

## Features Implemented ✅

### Core Gameplay
- **Player Control**: Move your cow by moving your mouse cursor
- **Boost Feature**: Hold Space or Click to boost speed (uses mass)
- **Growth System**: Collect food pellets to grow longer
- **15 AI Bot Cows**: Named cows (Bessie, Daisy, Buttercup, etc.) that compete with you
- **Collision Detection**: Hit another cow's body and you die, they drop food pellets
- **Real-time Leaderboard**: Shows top 10 cows by mass

### Visual Design
- **Cow Appearance**: Each cow has a 🐄 emoji head and spotted body segments
- **Colorful Cows**: Player cow is pink, bots have various colors
- **Food Pellets**: Green/yellow dots representing grass/hay
- **Dark Grid Background**: Classic slither.io style arena
- **Smooth Animations**: 60 FPS game loop with smooth movement

### UI/UX
- **Main Menu**: Clean start screen with high score tracking
- **HUD Elements**:
  - Score counter (top-left)
  - Live leaderboard (top-right)
  - Controls guide (bottom-left)
- **Game Over Screen**: Shows final score with restart option
- **Border Warning**: Red border when near map edges

## Technical Implementation

### Frontend Only (No Backend Required)
- Built with React and HTML5 Canvas
- Pure JavaScript game engine
- All game logic runs in browser
- No multiplayer (single-player with AI bots)

### Game Mechanics
- **Map Size**: 3000x3000 pixels
- **200 Food Pellets**: Constantly respawning
- **Camera Follow**: Smooth camera tracking player cow
- **Physics**: Realistic snake-like movement with segment following

## How to Play

1. **Start**: Click "Start Game" on menu
2. **Move**: Move your mouse to control your cow
3. **Boost**: Hold Space or Click to go faster
4. **Grow**: Eat green/yellow food pellets
5. **Survive**: Avoid hitting other cows' bodies
6. **Win**: Kill other cows and eat their remains to grow massive!

## Controls
- 🖱️ **Mouse Movement**: Control cow direction
- ⚡ **Space / Click**: Boost speed

## Fun Facts
- Each cow has a unique name
- Cows have white spots that appear on body segments
- The player cow has a white outline to stand out
- When you die, your cow becomes food for others!

---

**This is a frontend-only implementation with mock AI bots. All game logic runs in the browser!**
