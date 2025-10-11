import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { PlayCircle, RotateCcw } from 'lucide-react';

const CANVAS_WIDTH = 3000;
const CANVAS_HEIGHT = 3000;
const INITIAL_LENGTH = 10;
const SEGMENT_RADIUS = 8;
const FOOD_COUNT = 200;
const BOT_COUNT = 15;
const BASE_SPEED = 3;
const BOOST_SPEED = 6;

class Cow {
  constructor(x, y, color, isPlayer = false, name = 'Cow') {
    this.segments = [];
    this.color = color;
    this.isPlayer = isPlayer;
    this.name = name;
    this.speed = BASE_SPEED;
    this.angle = Math.random() * Math.PI * 2;
    this.isBoosting = false;
    this.mass = INITIAL_LENGTH;
    
    // Initialize segments
    for (let i = 0; i < INITIAL_LENGTH; i++) {
      this.segments.push({
        x: x - i * SEGMENT_RADIUS,
        y: y
      });
    }
  }

  getHead() {
    return this.segments[0];
  }

  move(targetX, targetY) {
    const head = this.getHead();
    const dx = targetX - head.x;
    const dy = targetY - head.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      this.angle = Math.atan2(dy, dx);
    }
    
    const speed = this.isBoosting ? BOOST_SPEED : this.speed;
    const newX = head.x + Math.cos(this.angle) * speed;
    const newY = head.y + Math.sin(this.angle) * speed;
    
    // Add new head
    this.segments.unshift({ x: newX, y: newY });
    
    // Remove tail if not growing
    if (this.segments.length > this.mass) {
      this.segments.pop();
    }
  }

  grow(amount = 3) {
    this.mass += amount;
  }

  checkCollision(x, y, radius) {
    const head = this.getHead();
    const dx = head.x - x;
    const dy = head.y - y;
    return Math.sqrt(dx * dx + dy * dy) < radius + SEGMENT_RADIUS;
  }

  checkSelfCollision() {
    const head = this.getHead();
    for (let i = 4; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      if (Math.sqrt(dx * dx + dy * dy) < SEGMENT_RADIUS * 1.5) {
        return true;
      }
    }
    return false;
  }

  checkCollisionWithCow(otherCow) {
    if (otherCow === this) return false;
    
    const head = this.getHead();
    for (let i = (otherCow === this ? 4 : 0); i < otherCow.segments.length; i++) {
      const segment = otherCow.segments[i];
      const dx = head.x - segment.x;
      const dy = head.y - segment.y;
      if (Math.sqrt(dx * dx + dy * dy) < SEGMENT_RADIUS * 1.8) {
        return true;
      }
    }
    return false;
  }
}

class Food {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 6;
    this.color = `hsl(${Math.random() * 60 + 90}, 70%, 60%)`; // Green-yellow range
  }
}

const Game = () => {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const gameRef = useRef({
    player: null,
    bots: [],
    food: [],
    mouseX: 0,
    mouseY: 0,
    camera: { x: 0, y: 0 },
    keys: {}
  });

  const initGame = () => {
    const game = gameRef.current;
    
    // Create player cow
    const playerX = CANVAS_WIDTH / 2;
    const playerY = CANVAS_HEIGHT / 2;
    game.player = new Cow(playerX, playerY, '#E91E63', true, 'You');
    
    // Create bot cows
    game.bots = [];
    const cowNames = ['Bessie', 'Daisy', 'Buttercup', 'Clover', 'Rosie', 'Bella', 'Luna', 'Maggie', 'Molly', 'Penny', 'Ruby', 'Sadie', 'Sophie', 'Stella', 'Willow'];
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4', '#FFEB3B', '#F44336', '#3F51B5', '#8BC34A', '#FF5722', '#673AB7', '#009688', '#FFC107', '#795548', '#607D8B'];
    
    for (let i = 0; i < BOT_COUNT; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      game.bots.push(new Cow(x, y, colors[i % colors.length], false, cowNames[i]));
    }
    
    // Create food
    game.food = [];
    for (let i = 0; i < FOOD_COUNT; i++) {
      game.food.push(new Food(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT
      ));
    }
    
    setScore(0);
    setGameState('playing');
  };

  const spawnFood = (x, y, count) => {
    const game = gameRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 100;
      game.food.push(new Food(
        x + Math.cos(angle) * distance,
        y + Math.sin(angle) * distance
      ));
    }
  };

  const updateBots = () => {
    const game = gameRef.current;
    
    game.bots.forEach(bot => {
      // Simple AI: move towards nearest food or away from danger
      const head = bot.getHead();
      let targetX = head.x;
      let targetY = head.y;
      
      // Find nearest food
      let nearestFood = null;
      let minDist = Infinity;
      
      game.food.forEach(food => {
        const dx = food.x - head.x;
        const dy = food.y - head.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist < 300) {
          minDist = dist;
          nearestFood = food;
        }
      });
      
      if (nearestFood) {
        targetX = nearestFood.x;
        targetY = nearestFood.y;
      } else {
        // Random movement
        if (Math.random() < 0.02) {
          bot.angle += (Math.random() - 0.5) * 0.5;
        }
        targetX = head.x + Math.cos(bot.angle) * 100;
        targetY = head.y + Math.sin(bot.angle) * 100;
      }
      
      // Keep bots in bounds
      if (head.x < 100) targetX = head.x + 100;
      if (head.x > CANVAS_WIDTH - 100) targetX = head.x - 100;
      if (head.y < 100) targetY = head.y + 100;
      if (head.y > CANVAS_HEIGHT - 100) targetY = head.y - 100;
      
      bot.move(targetX, targetY);
    });
  };

  const gameLoop = () => {
    if (gameState !== 'playing') return;
    
    const game = gameRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const player = game.player;
    
    // Update player
    const viewWidth = canvas.width;
    const viewHeight = canvas.height;
    const worldMouseX = game.mouseX + game.camera.x - viewWidth / 2;
    const worldMouseY = game.mouseY + game.camera.y - viewHeight / 2;
    
    player.isBoosting = game.keys[' '] || game.keys['click'];
    player.move(worldMouseX, worldMouseY);
    
    // Update camera
    const head = player.getHead();
    game.camera.x = head.x;
    game.camera.y = head.y;
    
    // Check food collision
    game.food = game.food.filter(food => {
      if (player.checkCollision(food.x, food.y, food.radius)) {
        player.grow(1);
        setScore(prev => prev + 1);
        return false;
      }
      return true;
    });
    
    // Spawn new food if needed
    while (game.food.length < FOOD_COUNT) {
      game.food.push(new Food(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT
      ));
    }
    
    // Update bots
    updateBots();
    
    // Check bot food collision
    game.bots.forEach(bot => {
      game.food = game.food.filter(food => {
        if (bot.checkCollision(food.x, food.y, food.radius)) {
          bot.grow(1);
          return false;
        }
        return true;
      });
    });
    
    // Check collisions with other cows
    let playerDied = false;
    
    // Player collision with bots
    game.bots.forEach(bot => {
      if (player.checkCollisionWithCow(bot)) {
        playerDied = true;
      }
    });
    
    // Bot collisions
    game.bots = game.bots.filter(bot => {
      if (bot.checkCollisionWithCow(player)) {
        spawnFood(bot.getHead().x, bot.getHead().y, bot.mass);
        player.grow(Math.floor(bot.mass / 2));
        return false;
      }
      
      for (let otherBot of game.bots) {
        if (bot !== otherBot && bot.checkCollisionWithCow(otherBot)) {
          spawnFood(bot.getHead().x, bot.getHead().y, bot.mass);
          return false;
        }
      }
      
      return true;
    });
    
    if (playerDied) {
      if (score > highScore) {
        setHighScore(score);
      }
      setGameState('gameover');
      return;
    }
    
    // Update leaderboard
    const leaders = [{ name: player.name, score: player.mass, isPlayer: true }];
    game.bots.forEach(bot => {
      leaders.push({ name: bot.name, score: bot.mass, isPlayer: false });
    });
    leaders.sort((a, b) => b.score - a.score);
    setLeaderboard(leaders.slice(0, 10));
    
    // Render
    render(ctx, canvas.width, canvas.height);
    
    requestAnimationFrame(gameLoop);
  };

  const render = (ctx, width, height) => {
    const game = gameRef.current;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#16213e';
    ctx.lineWidth = 1;
    const gridSize = 50;
    const offsetX = game.camera.x % gridSize;
    const offsetY = game.camera.y % gridSize;
    
    for (let x = -offsetX; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = -offsetY; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Transform to world coordinates
    ctx.save();
    ctx.translate(width / 2 - game.camera.x, height / 2 - game.camera.y);
    
    // Draw food
    game.food.forEach(food => {
      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw all cows
    const drawCow = (cow) => {
      // Draw body segments
      for (let i = cow.segments.length - 1; i >= 0; i--) {
        const segment = cow.segments[i];
        const radius = i === 0 ? SEGMENT_RADIUS * 1.5 : SEGMENT_RADIUS;
        
        // Outline
        ctx.fillStyle = cow.isPlayer ? '#ffffff' : '#000000';
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius + 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = cow.color;
        ctx.beginPath();
        ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Cow spots (every few segments)
        if (i % 3 === 0) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.arc(segment.x - 3, segment.y - 2, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(segment.x + 2, segment.y + 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw cow head (emoji style)
      const head = cow.getHead();
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐮', head.x, head.y);
      
      // Draw name
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(cow.name, head.x, head.y - 25);
      ctx.fillText(cow.name, head.x, head.y - 25);
    };
    
    game.bots.forEach(drawCow);
    drawCow(game.player);
    
    ctx.restore();
    
    // Draw border warning
    const head = game.player.getHead();
    if (head.x < 200 || head.x > CANVAS_WIDTH - 200 || head.y < 200 || head.y > CANVAS_HEIGHT - 200) {
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 5;
      ctx.strokeRect(10, 10, width - 20, height - 20);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      gameRef.current.mouseX = e.clientX - rect.left;
      gameRef.current.mouseY = e.clientY - rect.top;
    };
    
    const handleMouseDown = () => {
      gameRef.current.keys['click'] = true;
    };
    
    const handleMouseUp = () => {
      gameRef.current.keys['click'] = false;
    };
    
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key] = true;
    };
    
    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key] = false;
    };
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoop();
    }
  }, [gameState]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#1a1a2e]">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* HUD */}
      {gameState === 'playing' && (
        <>
          {/* Score */}
          <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg">
            <div className="text-white font-bold text-2xl">{score}</div>
            <div className="text-gray-400 text-xs">Score</div>
          </div>
          
          {/* Controls info */}
          <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
            <div className="text-white text-sm">🖱️ Move with mouse</div>
            <div className="text-white text-sm">⚡ Space/Click to boost</div>
          </div>
          
          {/* Leaderboard */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-4 py-3 rounded-lg min-w-[200px]">
            <div className="text-white font-bold mb-2">🏆 Leaderboard</div>
            {leaderboard.map((leader, idx) => (
              <div key={idx} className={`text-sm py-1 ${leader.isPlayer ? 'text-pink-400 font-bold' : 'text-gray-300'}`}>
                {idx + 1}. {leader.name} - {leader.score}
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Menu */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-2">🐮 Cow.io</h1>
            <p className="text-xl text-gray-300 mb-8">The Moo-st Epic Slither Game</p>
            <Button 
              onClick={initGame}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xl px-8 py-6"
            >
              <PlayCircle className="mr-2" size={24} />
              Start Game
            </Button>
            {highScore > 0 && (
              <div className="mt-6 text-white">
                <div className="text-sm text-gray-400">High Score</div>
                <div className="text-3xl font-bold">{highScore}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Game Over */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">Game Over!</h1>
            <div className="text-3xl text-pink-400 font-bold mb-2">{score}</div>
            <div className="text-gray-400 mb-6">Final Score</div>
            {score === highScore && score > 0 && (
              <div className="text-yellow-400 font-bold mb-4 text-xl">🎉 New High Score! 🎉</div>
            )}
            <Button 
              onClick={initGame}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xl px-8 py-6"
            >
              <RotateCcw className="mr-2" size={24} />
              Play Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;