import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAchievements } from '../../context/AchievementsContext';
import { Play, RefreshCw, Crosshair } from 'lucide-react';

type GameState = 'start' | 'playing' | 'gameover' | 'win';

export function CreativeInvaders() {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);

  // Game configuration
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;
  
  // Game logic variables inside a ref to avoid recreating the animation loop
  const state = useRef({
    player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, width: 40, height: 20, speed: 5, isMovingLeft: false, isMovingRight: false },
    projectiles: [] as {x: number, y: number, speed: number}[],
    enemies: [] as {x: number, y: number, width: number, height: number, type: 'routine' | 'block'}[],
    enemyDirection: 1, // 1 for right, -1 for left
    enemySpeed: 1,
    enemyStepCount: 0,
    enemyMoveTimer: 0,
    score: 0,
    lastFireTime: 0,
    particles: [] as {x: number, y: number, vx: number, vy: number, life: number, maxLife: number}[],
  });

  const initGame = useCallback(() => {
    state.current = {
      player: { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 50, width: 40, height: 20, speed: 5, isMovingLeft: false, isMovingRight: false },
      projectiles: [],
      enemies: [],
      enemyDirection: 1,
      enemySpeed: 2,
      enemyStepCount: 0,
      enemyMoveTimer: 0,
      score: 0,
      lastFireTime: 0,
      particles: [],
    };
    
    // Spawn enemies
    const rows = 4;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        state.current.enemies.push({
          x: c * 60 + 50,
          y: r * 40 + 50,
          width: 30,
          height: 30,
          type: r % 2 === 0 ? 'routine' : 'block'
        });
      }
    }
    
    setScore(0);
    setGameState('playing');
  }, []);

  const fire = useCallback(() => {
    const now = Date.now();
    if (now - state.current.lastFireTime > 300) {
      state.current.projectiles.push({
        x: state.current.player.x + state.current.player.width / 2 - 2,
        y: state.current.player.y,
        speed: -7
      });
      state.current.lastFireTime = now;
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for arrows and space if we're in 'playing' state
      if (gameState === 'playing' && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
      }
      
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        state.current.player.isMovingLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        state.current.player.isMovingRight = true;
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        if (gameState === 'playing') fire();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        state.current.player.isMovingLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        state.current.player.isMovingRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [fire, gameState]);

  const createExplosion = (x: number, y: number) => {
    for (let i = 0; i < 15; i++) {
      state.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        maxLife: Math.random() * 20 + 10
      });
    }
  };

  const update = useCallback(() => {
    if (gameState !== 'playing') return;

    const s = state.current;
    
    // Player movement
    if (s.player.isMovingLeft) s.player.x -= s.player.speed;
    if (s.player.isMovingRight) s.player.x += s.player.speed;
    
    // Boundary check for player
    if (s.player.x < 0) s.player.x = 0;
    if (s.player.x > GAME_WIDTH - s.player.width) s.player.x = GAME_WIDTH - s.player.width;
    
    // Projectiles
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      s.projectiles[i].y += s.projectiles[i].speed;
      if (s.projectiles[i].y < 0 || s.projectiles[i].y > GAME_HEIGHT) {
        s.projectiles.splice(i, 1);
      }
    }
    
    // Enemy movement
    s.enemyMoveTimer++;
    if (s.enemyMoveTimer > 30) {
      s.enemyMoveTimer = 0;
      let hitEdge = false;
      
      for (const enemy of s.enemies) {
        enemy.x += s.enemyDirection * 15;
        if (enemy.x <= 10 || enemy.x >= GAME_WIDTH - enemy.width - 10) {
          hitEdge = true;
        }
      }
      
      if (hitEdge) {
        s.enemyDirection *= -1;
        for (const enemy of s.enemies) {
          enemy.y += 20;
          if (enemy.y >= s.player.y - enemy.height) {
            setGameState('gameover');
          }
        }
        s.enemySpeed += 0.5; // increase speed slightly
      }
    }
    
    // Collision detection
    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const proj = s.projectiles[i];
      let hit = false;
      
      for (let j = s.enemies.length - 1; j >= 0; j--) {
        const enemy = s.enemies[j];
        if (
          proj.x >= enemy.x &&
          proj.x <= enemy.x + enemy.width &&
          proj.y >= enemy.y &&
          proj.y <= enemy.y + enemy.height
        ) {
          hit = true;
          createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
          s.enemies.splice(j, 1);
          s.score += 10;
          setScore(s.score);
          break;
        }
      }
      
      if (hit) {
        s.projectiles.splice(i, 1);
      }
    }
    
    // Update particles
    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) {
        s.particles.splice(i, 1);
      }
    }
    
    // Win condition
    if (s.enemies.length === 0) {
      setGameState('win');
      if (s.score >= 320) {
        //  unlockAchievement('productive'); // Could create this
      }
    }
  }, [gameState, unlockAchievement]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Clear background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    const s = state.current;
    
    // Draw player
    ctx.fillStyle = '#8a63d2'; // brand-accent roughly
    ctx.beginPath();
    ctx.moveTo(s.player.x + s.player.width / 2, s.player.y);
    ctx.lineTo(s.player.x + s.player.width, s.player.y + s.player.height);
    ctx.lineTo(s.player.x, s.player.y + s.player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw enemies
    for (const enemy of s.enemies) {
      if (enemy.type === 'routine') {
        ctx.fillStyle = '#6b7280'; // gray-500
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
      } else {
        ctx.fillStyle = '#b91c1c'; // red-700
        ctx.beginPath();
        ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw projectiles
    ctx.fillStyle = '#eab308'; // yellow-500
    for (const proj of s.projectiles) {
      ctx.fillRect(proj.x, proj.y, 4, 15);
    }
    
    // Draw particles
    for (const p of s.particles) {
      ctx.fillStyle = `rgba(138, 99, 210, ${1 - p.life / p.maxLife})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  const tick = useCallback(() => {
    update();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        draw(ctx);
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-display uppercase tracking-tight text-white mb-1">
            {t('game.invaders.title')}
          </h2>
          <p className="text-white/50 text-xs font-mono uppercase tracking-widest">
            {t('game.invaders.desc')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-brand-accent text-xs font-mono tracking-widest uppercase">
            {t('game.invaders.score')}
          </p>
          <p className="text-2xl font-mono text-white">
            {score.toString().padStart(4, '0')}
          </p>
        </div>
      </div>
      
      <div className="relative w-full aspect-[4/3] bg-black border border-white/10 rounded-lg overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full object-contain cursor-none"
          onMouseMove={(e) => {
             // Optional: allow mouse control inside canvas
             if (gameState === 'playing' && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const scaleX = GAME_WIDTH / rect.width;
                let x = (e.clientX - rect.left) * scaleX;
                state.current.player.x = x - state.current.player.width / 2;
             }
          }}
          onClick={(e) => {
             if (gameState === 'playing') fire();
          }}
        />
        
        {/* Overlays */}
        {gameState === 'start' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <button 
               onClick={initGame}
               className="bg-brand-accent text-white font-mono text-sm uppercase tracking-widest px-8 py-4 flex items-center gap-3 hover:bg-brand-accent/80 transition-colors"
            >
              <Play size={18} /> {t('game.invaders.start')}
            </button>
            <p className="mt-6 text-white/50 text-xs font-mono">Use MOUSE to move and click to shoot, or ARROWS and SPACE.</p>
          </div>
        )}
        
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <h3 className="text-4xl font-display text-white mb-6 uppercase text-red-500">
              {t('game.invaders.gameover')}
            </h3>
            <button 
               onClick={initGame}
               className="bg-red-600 text-white font-mono text-sm uppercase tracking-widest px-8 py-4 flex items-center gap-3 hover:bg-red-500 transition-colors"
            >
              <RefreshCw size={18} /> {t('game.invaders.start')}
            </button>
          </div>
        )}
        
        {gameState === 'win' && (
          <div className="absolute inset-0 bg-brand-accent/20 backdrop-blur-sm flex flex-col items-center justify-center">
            <h3 className="text-4xl font-display text-white mb-6 uppercase text-brand-accent">
              {t('game.invaders.win')}
            </h3>
            <button 
               onClick={initGame}
               className="bg-brand-accent text-white font-mono text-sm uppercase tracking-widest px-8 py-4 flex items-center gap-3 hover:bg-brand-accent/80 transition-colors"
            >
              <RefreshCw size={18} /> {t('game.invaders.start')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
