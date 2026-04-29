import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAchievements } from "../../context/AchievementsContext";
import { Play, RefreshCw, Zap, Shield, Star, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Crosshair, Settings, Target } from "lucide-react";
import { useAudio } from "../../context/AudioContext";
import { motion, AnimatePresence } from 'motion/react';

type GameState = "start" | "playing" | "gameover" | "win" | "takeoff" | "asteroids" | "asteroids_win";

const CHARACTERS = [
  { id: 'classic', nameKey: 'game.invaders.char.classic', descKey: 'game.invaders.char.classic.desc', price: 0, speed: 7, fireRateBase: 1, color: '#fbbf24', tailColor: '#f59e0b' },
  { id: 'rapid', nameKey: 'game.invaders.char.rapid', descKey: 'game.invaders.char.rapid.desc', price: 200, speed: 8, fireRateBase: 1.5, color: '#6ee7b7', tailColor: '#10b981' },
  { id: 'tank', nameKey: 'game.invaders.char.tank', descKey: 'game.invaders.char.tank.desc', price: 500, speed: 6, fireRateBase: 1, color: '#93c5fd', tailColor: '#3b82f6' },
  { id: 'laser', nameKey: 'game.invaders.char.laser', descKey: 'game.invaders.char.laser.desc', price: 1000, speed: 10, fireRateBase: 2, color: '#c084fc', tailColor: '#a855f7' }
];

import { FullscreenButton } from '../ui/FullscreenButton';

type Difficulty = "easy" | "normal" | "hard";

export function CreativeInvaders({ isPausedGlobal = false, hideFullscreenButton = false }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean }) {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  const { playSound, playMusic } = useAudio();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>(() => (localStorage.getItem('invaders_difficulty') as Difficulty) || 'normal');

  useEffect(() => {
    if (gameState === "playing" || gameState === "asteroids" || gameState === "takeoff") {
      playMusic('invaders');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [gameState, playMusic]);

  const [score, setScore] = useState(0);
  const [hudShield, setHudShield] = useState(0);
  const [hudPower, setHudPower] = useState(1);
  const [hudTurbo, setHudTurbo] = useState(0);

  const scoreRefDOM = useRef<HTMLDivElement>(null);

  const [festCoins, setFestCoins] = useState(() => Number(localStorage.getItem('fest_coins') || 0));
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('invaders_highscore') || 0));
  const [unlockedChars, setUnlockedChars] = useState<string[]>(() => JSON.parse(localStorage.getItem('invaders_chars') || '["classic"]'));
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('invaders_selected_char') || 'classic');
  const [storeTab, setStoreTab] = useState<"chars" | "upgrades">("chars");
  const [showMobileControls, setShowMobileControls] = useState(() => localStorage.getItem('invaders_mobile_controls') === 'true');
  const pendingCoinsRef = useRef(0);
  const pausedRef = useRef(false);

  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('invaders_upgrades');
    return saved ? JSON.parse(saved) : { shield: 0, power: 0, speed: 0, rear_turret: 0 };
  });

  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  useEffect(() => {
    localStorage.setItem('invaders_mobile_controls', showMobileControls.toString());
  }, [showMobileControls]);

  useEffect(() => {
    localStorage.setItem('invaders_difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('fest_coins', festCoins.toString());
    localStorage.setItem('invaders_chars', JSON.stringify(unlockedChars));
    localStorage.setItem('invaders_selected_char', selectedCharId);
    localStorage.setItem('invaders_upgrades', JSON.stringify(upgrades));
    localStorage.setItem('invaders_highscore', highScore.toString());
  }, [festCoins, unlockedChars, selectedCharId, upgrades, highScore]);

  const buyChar = (char: typeof CHARACTERS[0]) => {
    if (festCoins >= char.price) {
      setFestCoins(prev => prev - char.price);
      setUnlockedChars(prev => {
        const next = [...prev, char.id];
        if (next.length === CHARACTERS.length) {
          unlockAchievement('invaders_all_ships');
        }
        return next;
      });
      playSound('purchase');
    } else {
      playSound('alert');
    }
  };

  // Game configuration
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;

  const sprites = {
    player: [
      [0,0,0,1,1,0,0,0],
      [0,0,1,2,2,1,0,0],
      [0,1,3,3,3,3,1,0],
      [1,3,4,4,4,4,3,1],
      [1,3,4,4,4,4,3,1],
      [1,3,4,4,4,4,3,1],
      [1,5,5,5,5,5,5,1],
      [1,6,6,6,6,6,6,1],
    ],
    routine: [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [1,2,1,2,2,1,2,1],
      [1,2,2,2,2,2,2,1],
      [1,2,3,3,3,3,2,1],
      [1,2,3,2,2,3,2,1],
      [0,1,2,2,2,2,1,0],
      [0,0,1,1,1,1,0,0],
    ],
    block: [
      [0,0,1,1,1,1,0,0],
      [0,1,2,2,2,2,1,0],
      [0,1,2,1,1,2,1,0],
      [1,1,1,1,1,1,1,1],
      [1,3,3,3,3,3,3,1],
      [1,3,1,1,1,1,3,1],
      [1,3,3,1,1,3,3,1],
      [1,1,1,1,1,1,1,1],
    ],
    distraction: [
      [0,1,1,1,1,1,0,3],
      [1,2,2,2,2,1,3,3],
      [1,2,2,2,2,1,3,3],
      [1,2,2,2,2,1,0,0],
      [1,2,2,2,2,1,0,0],
      [1,2,4,4,2,1,0,0],
      [1,2,4,4,2,1,0,0],
      [0,1,1,1,1,1,0,0],
    ],
    boss: [
      [1,1,0,0,0,0,1,1],
      [1,2,1,0,0,1,2,1],
      [1,1,1,0,0,1,1,1],
      [0,0,1,1,1,1,0,0],
      [0,0,0,1,1,0,0,0],
      [0,0,0,1,1,0,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,2,1,1,2,1,0],
      [1,2,2,2,2,2,2,1],
      [1,2,2,1,1,2,2,1],
      [1,1,1,0,0,1,1,1],
    ],
    drop: [
      [0,0,0,1,0,0,0],
      [0,0,1,2,1,0,0],
      [0,1,2,2,2,1,0],
      [1,2,2,2,2,2,1],
      [1,2,2,3,2,2,1],
      [0,1,2,2,2,1,0],
      [0,0,1,1,1,0,0],
    ],
    asteroid: [
      [0,1,1,1,1,1,0,0],
      [1,2,2,2,3,2,1,0],
      [1,2,3,2,2,2,2,1],
      [1,2,2,2,3,2,2,1],
      [1,3,2,2,2,2,3,1],
      [1,2,2,3,2,2,2,1],
      [0,1,2,2,2,2,1,0],
      [0,0,1,1,1,1,0,0],
    ]
  };

  const drawSprite = (ctx: CanvasRenderingContext2D, sprite: number[][], x: number, y: number, width: number, height: number, palette: string[]) => {
    const rows = sprite.length;
    const cols = sprite[0].length;
    const pxW = width / cols;
    const pxH = height / rows;
    for(let r=0; r<rows; r++) {
       for(let c=0; c<cols; c++) {
          const val = sprite[r][c];
          if(val > 0 && palette[val - 1]) {
             ctx.fillStyle = palette[val - 1];
             ctx.fillRect(x + c*pxW - 0.5, y + r*pxH - 0.5, pxW + 1.0, pxH + 1.0);
          }
       }
    }
  };

  const state = useRef({
    player: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 60,
      width: 40,
      height: 40,
      speed: 7,
      angle: 0,
      isMovingLeft: false,
      isMovingRight: false,
      isMovingUp: false,
      isMovingDown: false,
      power: 1,
      powerTimer: 0,
      shield: 0,
      speedBoostTimer: 0,
    },
    projectiles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      speed: number;
      color: string;
      isEnemy?: boolean;
    }[],
    enemies: [] as {
      x: number;
      y: number;
      vx?: number;
      vy?: number;
      width: number;
      height: number;
      type: "routine" | "block" | "distraction" | "boss" | "asteroid_l" | "asteroid_m" | "asteroid_s";
      hp: number;
      maxHp: number;
      offset: number;
      hitFlash?: number;
    }[],
    drops: [] as { x: number; y: number; type: "power" | "shield" | "speed" }[],
    stars: Array.from({length: 100}).map(() => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 1
    })),
    enemyDirection: 1,
    difficultyMultiplier: 1.0,
    enemySpeedBase: 1.5,
    enemyMoveTimer: 0,
    time: 0,
    score: 0,
    lastFireTime: 0,
    particles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
      color: string;
      isCoin?: boolean;
    }[],
    level: 1,
    wave: 1,
    lastHitEdgeTime: 0,
    bgType: "grid" as "grid" | "deep",
    planets: [] as { x: number; y: number; size: number; color: string; speed: number }[],
    shake: 0,
    playerFlash: 0,
    isTransitioning: false,
    levelUpTimer: 0,
  });

  const loadAsteroidsLevel = useCallback(() => {
    state.current.enemies = [];
    state.current.projectiles = [];
    state.current.drops = [];
    state.current.isTransitioning = false;
    state.current.player.x = GAME_WIDTH / 2;
    state.current.player.y = GAME_HEIGHT / 2;
    state.current.bgType = "deep";
    
    // Add distant planets/moons
    state.current.planets = Array.from({length: 3}).map(() => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 30 + Math.random() * 70,
        color: ['#1e3a8a', '#3730a3', '#1e1b4b', '#111827'][Math.floor(Math.random() * 4)],
        speed: 0.1 + Math.random() * 0.3
    }));
    
    // Create 5 large asteroids
    const asteroidSpeedMulti = difficulty === 'easy' ? 0.6 : difficulty === 'hard' ? 1.5 : 1.0;
    for(let i = 0; i < 5; i++) {
        state.current.enemies.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT * 0.5,
            vx: (Math.random() - 0.5) * 4 * asteroidSpeedMulti,
            vy: (Math.random() - 0.5) * 4 * asteroidSpeedMulti,
            width: 80,
            height: 80,
            type: "asteroid_l",
            hp: 2,
            maxHp: 2,
            offset: Math.random() * Math.PI * 2
        });
    }
  }, []);

  const loadLevel = useCallback((level: number) => {
    state.current.enemies = [];
    state.current.drops = [];
    state.current.isTransitioning = false;
    state.current.enemyDirection = 1;
    
    // Difficulty scaling
    const diffMulti = difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.3 : 1.0;
    state.current.difficultyMultiplier = diffMulti;
    
    state.current.enemySpeedBase = (1.0 + (level * 0.2) + (state.current.wave * 0.5)) * diffMulti;
    state.current.player.x = GAME_WIDTH / 2;
    state.current.projectiles = [];
    state.current.bgType = "grid";
    
    // Normalize level for map selection
    const currentMapLevel = ((level - 1) % 4) + 1;

    if (currentMapLevel === 4) {
      // Boss level
      const bossHp = (100 + (level * 20)) * state.current.difficultyMultiplier;
      state.current.enemies.push({
        x: GAME_WIDTH / 2 - 100,
        y: 50,
        width: 200,
        height: 150,
        type: "boss",
        hp: bossHp,
        maxHp: bossHp,
        offset: 0,
        variant: Math.floor(Math.random() * 3)
      });
      return;
    }

    const rows = 3 + (currentMapLevel > 3 ? 3 : currentMapLevel);
    const cols = 7 + (currentMapLevel > 3 ? 3 : currentMapLevel);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: "routine" | "block" | "distraction" | "boss" = "routine";
        let hp = 1;
        
        if (currentMapLevel === 1) {
           type = "routine";
        } else if (currentMapLevel === 2) {
           if (r === 0) { type = "block"; hp = 2 + Math.floor(level/2); }
           else { type = "routine"; hp = 1; }
        } else if (currentMapLevel === 3) {
           if (r === 0) { type = "block"; hp = 3 + Math.floor(level/2); }
           else if (r === 1) { type = "distraction"; hp = 1; }
           else { type = "routine"; hp = 1; }
        }

        state.current.enemies.push({
          x: c * (GAME_WIDTH / cols * 0.8) + 40,
          y: r * 45 + 60,
          width: 32,
          height: 32,
          type,
          hp,
          maxHp: hp,
          offset: Math.random() * Math.PI * 2,
        });
      }
    }
  }, []);

  const initGame = useCallback(() => {
    state.current = {
      player: {
        x: GAME_WIDTH / 2,
        y: GAME_HEIGHT - 60,
        width: 40,
        height: 40,
        speed: selectedChar.speed + (upgrades.speed * 0.5),
        isMovingLeft: false,
        isMovingRight: false,
        isMovingUp: false,
        isMovingDown: false,
        power: (selectedChar.id === 'laser' ? 2 : 1) + upgrades.power,
        powerTimer: 0,
        shield: (selectedChar.id === 'tank' ? 3 : 0) + upgrades.shield,
        speedBoostTimer: selectedChar.id === 'rapid' ? 500 : 0,
        angle: 0,
      },
      projectiles: [],
      enemies: [],
      drops: [],
      stars: Array.from({length: 100}).map(() => ({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 1
      })),
      planets: [],
      enemyDirection: 1,
      enemySpeedBase: 1.5,
      difficultyMultiplier: difficulty === 'easy' ? 0.7 : difficulty === 'hard' ? 1.3 : 1.0,
      enemyMoveTimer: 0,
      time: 0,
      score: 0,
      lastFireTime: 0,
      particles: [],
      level: 1,
      wave: 1,
      bgType: "grid",
      shake: 0,
      playerFlash: 0,
      lastHitEdgeTime: 0,
      isTransitioning: false,
      levelUpTimer: 0,
      pendingCoins: 0
    };

    loadLevel(1);
    setScore(0);
    setGameState("playing");
  }, [loadLevel, selectedChar, GAME_WIDTH, GAME_HEIGHT, upgrades, difficulty]);

  const fire = useCallback(() => {
    const s = state.current;
    if (gameState !== 'playing' && gameState !== 'asteroids') return;
    if (s.isTransitioning) return;
    
    const now = Date.now();
    // Use fireRateBase
    const baseFireDelay = 300 / selectedChar.fireRateBase;
    const diffFireMulti = difficulty === 'easy' ? 1.3 : difficulty === 'hard' ? 0.8 : 1.0;
    const fireDelay = s.player.speedBoostTimer > 0 
      ? baseFireDelay * 0.33 
      : (s.player.power > 1 ? baseFireDelay * 0.5 : baseFireDelay) / diffFireMulti;

    if (now - s.lastFireTime > fireDelay) {
      playSound('fire');
      
      const fireBullet = (angleOffset: number, color: string, vxOffset: number = 0, vyOffset: number = -10) => {
        const angle = gameState === 'asteroids' ? s.player.angle + angleOffset : angleOffset;
        const speed = 10;
        const vx = gameState === 'asteroids' ? Math.cos(angle) * speed : vxOffset;
        const vy = gameState === 'asteroids' ? Math.sin(angle) * speed : vyOffset;
        
        s.projectiles.push({
          x: s.player.x + s.player.width / 2,
          y: s.player.y + s.player.height / 2,
          vx: vx,
          vy: vy,
          speed: speed,
          color: color,
        });
      };

      if (s.player.power === 1) {
        fireBullet(gameState === 'asteroids' ? 0 : 0, "#facc15", 0, -10);
      } else if (s.player.power >= 2) {
        fireBullet(gameState === 'asteroids' ? -0.2 : 0, "#38bdf8", -2, -10);
        fireBullet(gameState === 'asteroids' ? 0.2 : 0, "#38bdf8", 2, -10);
        if (s.player.power >= 3) {
          fireBullet(gameState === 'asteroids' ? 0 : 0, "#facc15", 0, -10);
        }
      }

      // Rear turret firing
      if (gameState === 'asteroids' && upgrades.rear_turret > 0) {
        const spread = upgrades.rear_turret > 1 ? 0.3 : 0;
        fireBullet(Math.PI - spread, "#ef4444");
        if (upgrades.rear_turret > 1) {
          fireBullet(Math.PI + spread, "#ef4444");
        }
        if (upgrades.rear_turret > 2) {
            fireBullet(Math.PI, "#facc15");
        }
      }

      s.lastFireTime = now;

      // Muzzle flash particle
      for (let i = 0; i < 5; i++) {
        s.particles.push({
          x: s.player.x + s.player.width / 2,
          y: s.player.y,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * -4,
          life: 1,
          maxLife: 10 + Math.random() * 10,
          color: "#fef08a",
        });
      }
    }
  }, [selectedChar, gameState, upgrades, playSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keysToPrevent = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "s", "a", "d"];
      if (keysToPrevent.includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" || e.key === "a") state.current.player.isMovingLeft = true;
      else if (e.key === "ArrowRight" || e.key === "d") state.current.player.isMovingRight = true;
      else if (e.key === "ArrowUp" || e.key === "w") state.current.player.isMovingUp = true;
      else if (e.key === "ArrowDown" || e.key === "s") state.current.player.isMovingDown = true;
      else if (e.key === " ")
        if (gameState === "playing" || gameState === "asteroids") fire();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") state.current.player.isMovingLeft = false;
      else if (e.key === "ArrowRight" || e.key === "d") state.current.player.isMovingRight = false;
      else if (e.key === "ArrowUp" || e.key === "w") state.current.player.isMovingUp = false;
      else if (e.key === "ArrowDown" || e.key === "s") state.current.player.isMovingDown = false;
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [fire, gameState]);

  const createExplosion = (
    x: number,
    y: number,
    color: string,
    count: number = 15,
    isCoin: boolean = false
  ) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * (isCoin ? 5 : 10),
        vy: (Math.random() - 0.5) * (isCoin ? 5 : 10) - (isCoin ? 5 : 0),
        life: 1,
        maxLife: Math.random() * 25 + 10,
        color,
        isCoin
      });
    }
  };

  const triggerGameOver = useCallback(() => {
    const s = state.current;
    playSound('explosion');
    setGameState("gameover");
    setScore(s.score);
    if (s.score > highScore) setHighScore(s.score);
    if (s.pendingCoins > 0) {
      setFestCoins(prev => prev + s.pendingCoins);
      s.pendingCoins = 0;
    }
  }, [highScore, playSound]);

  const update = useCallback((dt: number) => {
    const s = state.current;
    if (gameState !== "playing" && gameState !== "asteroids" && gameState !== "takeoff") return;
    if (isPausedGlobal || pausedRef.current) return;
    
    const normalDt = dt / 16.666; // Normalize to 60fps

    if (s.shake > 0) s.shake *= Math.pow(0.9, normalDt);
    if (s.playerFlash > 0) s.playerFlash -= normalDt;
    if (s.levelUpTimer > 0) s.levelUpTimer -= normalDt;

    if (gameState === "takeoff") {
        const takeoffSpeed = 10 * s.difficultyMultiplier * normalDt;
        s.player.y -= takeoffSpeed;
        s.player.angle = Math.sin(s.time) * 0.1;

        for (const star of s.stars) {
          star.y += star.speed * 8 * normalDt;
          if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
          }
        }

        if (s.player.y < -s.player.height) {
            setGameState("asteroids");
            loadAsteroidsLevel();
            createExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, "#38bdf8", 100);
            playSound('win');
        }
        
        for (let i = 0; i < 3; i++) {
            s.particles.push({
              x: s.player.x + s.player.width / 2 + (Math.random() - 0.5) * 10,
              y: s.player.y + s.player.height,
              vx: (Math.random() - 0.5) * 2,
              vy: Math.random() * 5 + 5,
              life: 1,
              maxLife: 15,
              color: "#fbbf24",
            });
        }
        return; 
    }

    // Update stars
    for (const star of s.stars) {
      star.y += (star.speed + (s.player.speedBoostTimer > 0 ? 5 : 0)) * normalDt;
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * GAME_WIDTH;
      }
    }

    s.time += 0.05 * normalDt;

    if (s.player.powerTimer > 0) {
      s.player.powerTimer -= normalDt;
      if (s.player.powerTimer <= 0) s.player.power = 1;
    }
    if (s.player.speedBoostTimer > 0) {
      s.player.speedBoostTimer -= normalDt;
    }

    const playerCurrentSpeed = (s.player.speedBoostTimer > 0 ? s.player.speed * 1.5 : s.player.speed) * normalDt;
    if (s.player.isMovingLeft) s.player.x -= playerCurrentSpeed;
    if (s.player.isMovingRight) s.player.x += playerCurrentSpeed;
    if (s.player.isMovingUp) s.player.y -= playerCurrentSpeed;
    if (s.player.isMovingDown) s.player.y += playerCurrentSpeed;

    if (gameState === "asteroids") {
      if (s.player.x < -s.player.width) s.player.x = GAME_WIDTH;
      if (s.player.x > GAME_WIDTH) s.player.x = -s.player.width;
      if (s.player.y < -s.player.height) s.player.y = GAME_HEIGHT;
      if (s.player.y > GAME_HEIGHT) s.player.y = -s.player.height;

      for (const planet of s.planets) {
          planet.y += planet.speed * normalDt;
          if (planet.y > GAME_HEIGHT + 100) {
              planet.y = -100;
              planet.x = Math.random() * GAME_WIDTH;
          }
      }
    } else {
      if (s.player.x < 0) s.player.x = 0;
      if (s.player.x > GAME_WIDTH - s.player.width) s.player.x = GAME_WIDTH - s.player.width;
      if (s.player.y < GAME_HEIGHT * 0.5) s.player.y = GAME_HEIGHT * 0.5;
      if (s.player.y > GAME_HEIGHT - s.player.height) s.player.y = GAME_HEIGHT - s.player.height;
    }

    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      if (s.isTransitioning) break;
      s.projectiles[i].x += s.projectiles[i].vx * normalDt;
      s.projectiles[i].y += s.projectiles[i].vy * normalDt;
      if (
        s.projectiles[i].y < 0 ||
        s.projectiles[i].y > GAME_HEIGHT ||
        s.projectiles[i].x < 0 ||
        s.projectiles[i].x > GAME_WIDTH
      ) {
        s.projectiles.splice(i, 1);
      }
    }

    const currentSpeed = (s.enemySpeedBase + (1 - s.enemies.length / 45) * 3) * normalDt;

    let minX = GAME_WIDTH;
    let maxX = 0;

    if (gameState === "playing") {
      for (const enemy of s.enemies) {
        let enemySpeedX = currentSpeed;
        if (enemy.type === "block") enemySpeedX *= 0.3;
        else if (enemy.type === "distraction") enemySpeedX *= 1.5;
        else if (enemy.type === "boss") enemySpeedX *= 1.2;

        let nextX = enemy.x + s.enemyDirection * enemySpeedX;
        if (enemy.type === "distraction") {
           nextX += Math.cos(enemy.offset) * 4 * normalDt; 
        }
        if (nextX < minX) minX = nextX;
        if (nextX + enemy.width > maxX) maxX = nextX + enemy.width;
      }
    }

    let hitEdge = false;
    if (gameState === "playing") {
      if (minX <= 5 && s.enemyDirection < 0) {
        hitEdge = true;
        s.enemyDirection = 1;
        playSound('click');
      } else if (maxX >= GAME_WIDTH - 5 && s.enemyDirection > 0) {
        hitEdge = true;
        s.enemyDirection = -1;
        playSound('click');
      }
    }

    if (gameState === "playing" && Math.random() < (0.02 + (s.level * 0.01)) * s.difficultyMultiplier * normalDt) {
      const shooters = s.enemies.filter(e => e.type !== 'block');
      if (shooters.length > 0) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        const isBoss = shooter.type === "boss";
        const isFast = shooter.type === "distraction";
        const variant = shooter.variant || 0;
        
        let bulletColor = "#ff00ff";
        if (isBoss) {
          bulletColor = variant === 0 ? "#ef4444" : variant === 1 ? "#38bdf8" : "#8b5cf6";
        } else if (isFast) {
          bulletColor = "#fbbf24";
        }

        const projSpeed = (isFast ? 8 + s.level : 5 + s.level) * s.difficultyMultiplier;
        s.projectiles.push({
           x: shooter.x + shooter.width/2,
           y: shooter.y + shooter.height,
           vx: isBoss && variant === 2 ? (s.player.x - shooter.x) * 0.01 : (isBoss ? (Math.random() - 0.5) * 4 : 0),
           vy: projSpeed,
           speed: projSpeed,
           color: bulletColor,
           isEnemy: true
        });

        if (isBoss) {
          if (variant === 0 && Math.random() < 0.5) {
             for (let d = -1; d <= 1; d += 2) {
               s.projectiles.push({
                  x: shooter.x + shooter.width/2,
                  y: shooter.y + shooter.height,
                  vx: d * 3,
                  vy: projSpeed * 1.2,
                  speed: projSpeed * 1.2,
                  color: bulletColor,
                  isEnemy: true
               });
             }
          } else if (variant === 1 && Math.random() < 0.3) {
             for (let i = 0; i < 3; i++) {
               s.projectiles.push({
                  x: shooter.x + shooter.width/2 + (Math.random() - 0.5) * 20,
                  y: shooter.y + shooter.height,
                  vx: 0,
                  vy: (10 + s.level) * s.difficultyMultiplier,
                  speed: (10 + s.level) * s.difficultyMultiplier,
                  color: bulletColor,
                  isEnemy: true
               });
             }
          }
        }
      }
    }

    for (const enemy of s.enemies) {
      enemy.offset += 0.05 * normalDt;
      
      if (gameState === "asteroids") {
         enemy.x += (enemy.vx || 0) * normalDt;
         enemy.y += (enemy.vy || 0) * normalDt;
         
         if (enemy.x < -enemy.width) enemy.x = GAME_WIDTH;
         if (enemy.x > GAME_WIDTH) enemy.x = -enemy.width;
         if (enemy.y < -enemy.height) enemy.y = GAME_HEIGHT;
         if (enemy.y > GAME_HEIGHT) enemy.y = -enemy.height;
         
         if (
           s.player.x < enemy.x + enemy.width - 5 &&
           s.player.x + s.player.width > enemy.x + 5 &&
           s.player.y < enemy.y + enemy.height - 5 &&
           s.player.y + s.player.height > enemy.y + 5
         ) {
           createExplosion(s.player.x + s.player.width/2, s.player.y + s.player.height/2, "#f87171", 20);
           triggerGameOver();
         }
      } else {
        const moveX = s.enemyDirection * currentSpeed;

        if (hitEdge) {
          if (enemy.type !== "block") enemy.y += 12 * normalDt; 
          if (enemy.y >= s.player.y - enemy.height) {
            triggerGameOver();
          }
        } else {
          if (enemy.type === "block") {
             enemy.y += (0.1 + (s.level * 0.05)) * normalDt;
             enemy.x += moveX * 0.3;
          } else if (enemy.type === "distraction") {
             enemy.x += moveX * 1.5;
             enemy.x += Math.cos(enemy.offset) * 4 * normalDt;
             enemy.y += Math.sin(enemy.offset * 2) * 2 * normalDt;
          } else if (enemy.type === "boss") {
             enemy.x += moveX * 1.2;
             enemy.y += Math.sin(enemy.offset) * 1.5 * normalDt;
          } else {
             enemy.x += moveX;
          }
        }
      }
    }

    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      const proj = s.projectiles[i];
      let hit = false;
      
      if (proj.isEnemy) {
         if (proj.x >= s.player.x && proj.x <= s.player.x + s.player.width &&
             proj.y >= s.player.y && proj.y <= s.player.y + s.player.height) {
             createExplosion(s.player.x + s.player.width/2, s.player.y + s.player.height/2, "#f87171", 20);
             if (s.player.shield > 0) {
                 playSound('shield');
                 s.player.shield--;
                 s.shake = 10;
                 s.playerFlash = 10;
                 hit = true;
             } else if (s.player.power > 1) {
                playSound('hit');
                s.player.power = 1; 
                s.shake = 15;
                s.playerFlash = 15;
                hit = true;
             } else {
                triggerGameOver();
             }
         }
      } else {
        for (let j = s.enemies.length - 1; j >= 0; j--) {
          const enemy = s.enemies[j];
          if (
            proj.x >= enemy.x &&
            proj.x <= enemy.x + enemy.width &&
            proj.y >= enemy.y &&
            proj.y <= enemy.y + enemy.height
          ) {
          hit = true;
          enemy.hp -= 1;
          enemy.hitFlash = 5;

          if (enemy.hp <= 0) {
            playSound('explosion');
            const color =
              enemy.type === "block"
                ? "#ef4444"
                : enemy.type === "distraction"
                  ? "#f59e0b"
                  : enemy.type.startsWith("asteroid")
                    ? "#d4d4d4"
                    : "#6b7280";
            createExplosion(
              enemy.x + enemy.width / 2,
              enemy.y + enemy.height / 2,
              color,
              20,
            );

            if (enemy.type === "boss") {
              unlockAchievement('invaders_boss_kill');
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ef4444", 50);
              playSound('powerup');
              for (let k = 0; k < 3; k++) {
                const types = ["power", "shield", "speed"] as const;
                s.drops.push({
                  x: enemy.x + Math.random() * enemy.width,
                  y: enemy.y + Math.random() * enemy.height,
                  type: types[k],
                });
              }
            } else if (enemy.type === "asteroid_l" || enemy.type === "asteroid_m") {
               const newType = enemy.type === "asteroid_l" ? "asteroid_m" : "asteroid_s";
               const newSize = enemy.type === "asteroid_l" ? 50 : 30;
               for (let k = 0; k < 2; k++) {
                 s.enemies.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (enemy.vx || 0) + (Math.random() - 0.5) * 4,
                    vy: (enemy.vy || 0) + (Math.random() - 0.5) * 4,
                    width: newSize,
                    height: newSize,
                    type: newType,
                    hp: 1,
                    maxHp: 1,
                    offset: Math.random() * Math.PI * 2
                 });
               }
            }

            if (Math.random() < 0.15 && !enemy.type.startsWith("asteroid")) {
              const types = ["power", "shield", "speed"] as const;
              s.drops.push({
                x: enemy.x + enemy.width / 2,
                y: enemy.y + enemy.height / 2,
                type: types[Math.floor(Math.random() * types.length)],
              });
            }

            s.enemies.splice(j, 1);
            s.score += enemy.maxHp * 10;
            
            const earnedKarmas = Math.ceil(enemy.maxHp / 2) + (s.level);
            s.pendingCoins = (s.pendingCoins || 0) + earnedKarmas;
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#facc15", earnedKarmas, true);
          } else {
            playSound('hit');
            createExplosion(proj.x, proj.y, "#ffffff", 5);
          }
          break;
        }
      }
      }
      if (hit) s.projectiles.splice(i, 1);
    }

    for (let i = s.drops.length - 1; i >= 0; i--) {
      s.drops[i].y += 3 * normalDt;
      const drop = s.drops[i];

      if (
        drop.x > s.player.x &&
        drop.x < s.player.x + s.player.width &&
        drop.y > s.player.y &&
        drop.y < s.player.y + s.player.height
      ) {
        playSound('powerup');
        if (drop.type === "power") {
           s.player.power = Math.min(3, s.player.power + 1);
           s.player.powerTimer = 300; 
        } else if (drop.type === "shield") {
           s.player.shield = Math.min(3, s.player.shield + 1);
        } else if (drop.type === "speed") {
           s.player.speedBoostTimer = 300;
        }

        s.drops.splice(i, 1);
        const color = drop.type === "shield" ? "#3b82f6" : drop.type === "speed" ? "#facc15" : "#8b5cf6";
        createExplosion(
          s.player.x + s.player.width / 2,
          s.player.y,
          color,
          30,
        );
        continue;
      }
      if (drop.y > GAME_HEIGHT) {
        s.drops.splice(i, 1);
      }
    }

    for (let i = s.particles.length - 1; i >= 0; i--) {
      const p = s.particles[i];
      p.x += p.vx * normalDt;
      p.y += p.vy * normalDt;
      p.life += normalDt;
      if (p.life >= p.maxLife) s.particles.splice(i, 1);
    }

    if (s.enemies.length === 0 && s.levelUpTimer <= 0 && !s.isTransitioning) {
      if (gameState === "playing") {
        s.isTransitioning = true;
        s.projectiles = []; 
        state.current.level++;
        if (state.current.level === 5) unlockAchievement('invaders_level_5');
        s.levelUpTimer = 100;
        if (state.current.level % 5 === 0) {
          setGameState("takeoff");
        } else {
          loadLevel(state.current.level);
        }
      } else if (gameState === "asteroids") {
        s.isTransitioning = true;
        s.projectiles = [];
        state.current.wave++;
        saveScore();
        if (state.current.level > 10) {
           setGameState("win");
        } else {
           loadLevel(state.current.level);
           setGameState("playing");
        }
        playSound("win");
      }
    }

    if (hudShield !== s.player.shield) setHudShield(s.player.shield);
    if (hudPower !== s.player.power) setHudPower(s.player.power);
    const turboActive = s.player.speedBoostTimer > 0 ? 1 : 0;
    if (hudTurbo !== turboActive) setHudTurbo(turboActive);
  }, [gameState, loadLevel, playSound, upgrades, t, unlockAchievement, loadAsteroidsLevel, hudShield, hudPower, hudTurbo, setHudShield, setHudPower, setHudTurbo, setGameState, setScore, highScore, setHighScore, setFestCoins]);

  const saveScore = () => {
    const s = state.current;
    if (s.score > highScore) setHighScore(s.score);
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#0a0a0B";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const s = state.current;
    
    ctx.save();
    if (s.shake > 1) {
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
    }

    // Draw grid background for 'creative space' feel
    if (s.bgType === "grid") {
      ctx.strokeStyle = "#ffffff05";
      ctx.lineWidth = 1;
      for (let i = 0; i < GAME_WIDTH; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, GAME_HEIGHT);
        ctx.stroke();
      }
      for (let i = 0; i < GAME_HEIGHT; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(GAME_WIDTH, i);
        ctx.stroke();
      }
    } else {
      // Nebula effect in deep space
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.arc(GAME_WIDTH * 0.2, GAME_HEIGHT * 0.3, 400, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#312e81";
      ctx.beginPath();
      ctx.arc(GAME_WIDTH * 0.8, GAME_HEIGHT * 0.7, 300, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw Atmosphere/Earth in takeoff
    if (gameState === "takeoff") {
      const gradient = ctx.createLinearGradient(0, GAME_HEIGHT, 0, GAME_HEIGHT - 400);
      gradient.addColorStop(0, "#38bdf840");
      gradient.addColorStop(0.5, "#38bdf810");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      
      // Clouds
      ctx.fillStyle = "#ffffff15";
      for (let i = 0; i < 8; i++) {
        const off = (s.time * 2 + i * 100) % (GAME_HEIGHT + 200);
        ctx.beginPath();
        ctx.ellipse((Math.sin(i) * 0.5 + 0.5) * GAME_WIDTH, GAME_HEIGHT - off + 200, 150, 40, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.ellipse(GAME_WIDTH / 2, GAME_HEIGHT + 800, 1200, 900, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Earth details (continents silouette)
      ctx.fillStyle = "#16653430";
      ctx.beginPath();
      ctx.ellipse(GAME_WIDTH / 2 + 100, GAME_HEIGHT + 850, 400, 200, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw planets in deep space
    if (gameState === "asteroids") {
        for (const planet of s.planets) {
            ctx.fillStyle = planet.color;
            ctx.globalAlpha = planet.speed * 2;
            ctx.beginPath();
            ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a small detail
            ctx.fillStyle = "#ffffff10";
            ctx.beginPath();
            ctx.arc(planet.x - planet.size*0.3, planet.y - planet.size*0.3, planet.size*0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    // Draw stars
    ctx.fillStyle = "#4b5563"; // Dim gray instead of white
    for (const star of s.stars) {
      ctx.globalAlpha = star.speed / 6;
      ctx.fillRect(star.x, star.y, star.size, star.size + (s.player.speedBoostTimer > 0 ? 15 : 0));
    }
    ctx.globalAlpha = 1;

    // Player
    const playerBaseColor = s.playerFlash > 0 ? "#ffffff" : (s.player.power > 1 ? '#a855f7' : selectedChar.color);
    const playerPalette = ['#1e293b', '#d4d4d4', '#475569', playerBaseColor, '#9ca3af', selectedChar.tailColor];
    ctx.shadowBlur = s.player.power > 1 ? 20 : (s.player.speedBoostTimer > 0 ? 15 : 10);
    ctx.shadowColor = s.player.power > 1 ? "#a78bfa" : (s.player.speedBoostTimer > 0 ? "#fde047" : (s.playerFlash > 0 ? "#ffffff" : selectedChar.color + "50"));
    
    // Support rotation
    if (gameState === "asteroids" || gameState === "takeoff") {
      ctx.save();
      ctx.translate(s.player.x + s.player.width / 2, s.player.y + s.player.height / 2);
      ctx.rotate(s.player.angle + Math.PI / 2); // Sprite faces up normally, so adjust
      drawSprite(ctx, sprites.player, -s.player.width / 2, -s.player.height / 2, s.player.width, s.player.height, playerPalette);
      
      // Draw rear turret if upgraded
      if (upgrades.rear_turret > 0) {
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-5, s.player.height / 2 - 5, 10, 10);
        if (upgrades.rear_turret > 1) {
            ctx.fillRect(-12, s.player.height / 2 - 2, 6, 6);
            ctx.fillRect(6, s.player.height / 2 - 2, 6, 6);
        }
      }
      ctx.restore();
    } else {
      drawSprite(ctx, sprites.player, s.player.x, s.player.y, s.player.width, s.player.height, playerPalette);
    }
    
    ctx.shadowBlur = 0;

    if (s.player.shield > 0) {
       ctx.strokeStyle = "#60a5fa";
       ctx.lineWidth = 2 + (Math.sin(s.time * 10) * 1);
       ctx.beginPath();
       ctx.arc(s.player.x + s.player.width / 2, s.player.y + s.player.height / 2, s.player.width / 2 + 5, 0, Math.PI * 2);
       ctx.stroke();
    }

    // Enemies
    for (const enemy of s.enemies) {
      if (enemy.hitFlash && enemy.hitFlash > 0) enemy.hitFlash--;
      const isHit = (enemy.hitFlash || 0) > 0;
      
      if (enemy.type === "routine") {
        const palette = isHit ? ['#ffffff', '#ffffff', '#ffffff'] : ['#1e293b', '#9ca3af', '#4b5563'];
        drawSprite(ctx, sprites.routine, enemy.x, enemy.y, enemy.width, enemy.height, palette);
      } else if (enemy.type === "block") {
        const boxColor = enemy.hp === 1 ? '#f87171' : enemy.hp === 2 ? '#ef4444' : '#b91c1c';
        const palette = isHit ? ['#ffffff', '#ffffff', '#ffffff'] : ['#1e293b', '#d4d4d4', boxColor];
        drawSprite(ctx, sprites.block, enemy.x, enemy.y, enemy.width, enemy.height, palette);
      } else if (enemy.type === "distraction") {
        const palette = isHit ? ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] : ['#1e293b', '#3b82f6', '#ef4444', '#1e293b'];
        drawSprite(ctx, sprites.distraction, enemy.x, enemy.y, enemy.width, enemy.height, palette);
      } else if (enemy.type === "boss") {
        const variant = enemy.variant || 0;
        const bossColor = variant === 0 ? "#ef4444" : variant === 1 ? "#38bdf8" : "#8b5cf6";
        const metalColor = enemy.hp / enemy.maxHp > 0.5 ? '#d4d4d4' : '#fca5a5';
        const palette = isHit ? ['#ffffff', '#ffffff'] : [bossColor, metalColor];
        drawSprite(ctx, sprites.boss, enemy.x, enemy.y, enemy.width, enemy.height, palette);
        // Health bar
        ctx.fillStyle = "#333";
        ctx.fillRect(enemy.x, enemy.y - 15, enemy.width, 10);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(enemy.x, enemy.y - 15, enemy.width * (enemy.hp / enemy.maxHp), 10);
      } else if (enemy.type.startsWith("asteroid")) {
        drawSprite(ctx, sprites.asteroid, enemy.x, enemy.y, enemy.width, enemy.height, ['#1e293b', '#9ca3af', '#d4d4d4']);
      }
    }

    // Drops
    for (const drop of s.drops) {
      ctx.shadowBlur = 10;
      const glowColor = drop.type === "shield" ? "#3b82f6" : drop.type === "speed" ? "#facc15" : "#06b6d4";
      const palette = ['#1e293b', drop.type === "shield" ? '#60a5fa' : drop.type === "speed" ? '#fde047' : '#d946ef', '#ffffff'];
      ctx.shadowColor = glowColor;
      drawSprite(ctx, sprites.drop, drop.x - 10, drop.y - 10, 20, 20, palette);
      ctx.shadowBlur = 0;
    }

    // Projectiles
    ctx.lineCap = "round";
    for (const proj of s.projectiles) {
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = proj.isEnemy ? 4 : 3;
      ctx.shadowBlur = proj.isEnemy ? 15 : 10;
      ctx.shadowColor = proj.color;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.x - (proj.vx * 2), proj.y - (proj.vy * 2));
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Particles
    for (const p of s.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 1 - p.life / p.maxLife;
      ctx.beginPath();
      if (p.isCoin) {
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#eab308";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.arc(
          p.x,
          p.y,
          Math.max(0.5, 3 * (1 - p.life / p.maxLife)),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
    }

    if (state.current.levelUpTimer > 0) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px sans-serif";
      ctx.textAlign = "center";
      ctx.globalAlpha = Math.min(1, state.current.levelUpTimer / 50);
      ctx.fillText(`${t('game.invaders.level_up')} ${state.current.level}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
      ctx.globalAlpha = 1.0;
    }
    
    ctx.restore();
  }, [t]);

  const lastTimeRef = useRef<number>(performance.now());
  const TIME_STEP = 1000 / 60; // 60 FPS target

  const tick = useCallback((time: number) => {
    const dt = time - lastTimeRef.current;
    lastTimeRef.current = time;
    
    // Smooth update with variable dt (clamped to avoid giant leaps)
    const effectiveDt = Math.min(dt, 50);
    update(effectiveDt);

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) draw(ctx);
    }
    if (scoreRefDOM.current) {
      scoreRefDOM.current.innerText = state.current.score.toString().padStart(5, "0");
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
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-mono text-white p-2 md:p-4 relative bg-[#050505] rounded-xl flex-grow overflow-y-auto custom-scrollbar border-2 border-zinc-900 shadow-2xl [&.is-fullscreen]:bg-black [&.is-fullscreen]:rounded-none [&.is-fullscreen]:border-none">
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-[70] transition-opacity opacity-20 hover:opacity-100" />}
      
      {/* Universal/Manual Pause Overlay */}
      <AnimatePresence>
        {((gameState === 'playing' || gameState === 'asteroids' || gameState === 'takeoff') && (isPausedGlobal || pausedRef.current)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-4 text-center p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Target className="w-12 h-12 md:w-16 md:h-16 text-brand-accent animate-pulse" />
              <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-[0.3em]">
                {isPausedGlobal ? t('game.paused.system', 'SYSTEM HALTED') : 'MISSION PAUSED'}
              </h2>
            </div>
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-bold text-center px-4 md:px-16 leading-relaxed max-w-xs">
              {isPausedGlobal 
                ? t('game.paused.desc', 'The creative flow has been temporarily suspended.')
                : t('game.paused.manual', 'Prepare your creativity. The void waits for no one.')}
            </p>
            {!isPausedGlobal && (
              <button
                onClick={() => { pausedRef.current = false; playSound('start'); }}
                className="bg-brand-accent text-white px-12 py-4 rounded-full font-black uppercase text-sm tracking-[0.3em] hover:bg-brand-accent/80 transition-all shadow-[0_0_30px_rgba(242,74,41,0.4)] active:scale-95"
              >
                RESUME MISSION
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Top HUD */}
      <div className="flex justify-between items-center w-full max-w-4xl mb-2 px-2 md:px-6 py-1 md:py-2 text-[8px] md:text-[10px] font-bold bg-zinc-900/50 rounded-t-xl border-x-2 border-t-2 border-zinc-800 backdrop-blur-sm shadow-lg shrink-0">
         <div className="flex items-center gap-3 md:gap-6">
            <button 
              onClick={() => { playSound('hover'); setShowMobileControls(prev => !prev); }} 
              className={`flex items-center gap-1 uppercase text-[7px] md:text-[8px] font-bold border px-1 md:px-1.5 py-0.5 md:py-1 transition-all ${showMobileControls ? 'bg-brand-accent/10 border-brand-accent text-brand-accent shadow-[0_0_10px_rgba(242,74,41,0.2)]' : 'text-zinc-600 border-zinc-800 hover:border-zinc-500'}`}
            >
              <Settings className="w-2.5 h-2.5 md:w-3 md:h-3" /> {showMobileControls ? t('game.common.controls_on') : t('game.common.controls_off')}
            </button>
            <div className="flex items-center gap-1 md:gap-2">
               <span className="text-zinc-500 tracking-tighter uppercase">{t('game.invaders.score')}</span>
               <div ref={scoreRefDOM} className="text-brand-accent text-xs md:text-sm italic">{score}</div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 bg-black/40 px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white/5">
                <div className="flex items-center gap-1">
                   <Shield className="w-2.5 h-2.5 md:w-3 md:h-3 text-blue-400" />
                   <span className="text-blue-400 text-[8px] md:text-xs">{hudShield}</span>
                </div>
                <div className="flex items-center gap-1">
                   <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400" />
                   <span className="text-yellow-400 text-[8px] md:text-xs">LV.{hudPower}</span>
                </div>
            </div>
         </div>
         <div className="flex items-center gap-2 text-zinc-500">
            <Star className="w-3 h-3 text-yellow-500" /> {highScore}
         </div>
      </div>

      <div className="relative border-x-2 border-b-2 border-zinc-800 rounded-b-xl bg-black overflow-hidden w-full max-w-4xl flex-grow h-full max-h-[800px] touch-none shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full object-contain cursor-none touch-none"
          onMouseMove={(e) => {
            if ((gameState === "playing" || gameState === "asteroids") && canvasRef.current) {
              const canvas = canvasRef.current;
              const rect = canvas.getBoundingClientRect();
              
              const scaleX = canvas.width / canvas.height;
              const scaleY = rect.width / rect.height;
              
              let displayedWidth = rect.width;
              let displayedHeight = rect.height;
              
              if (scaleX > scaleY) {
                  displayedHeight = rect.width / scaleX;
              } else {
                  displayedWidth = rect.height * scaleX;
              }
              
              const offsetX = (rect.width - displayedWidth) / 2;
              const offsetY = (rect.height - displayedHeight) / 2;
              
              let x = ((e.clientX - rect.left - offsetX) / displayedWidth) * canvas.width;
              let y = ((e.clientY - rect.top - offsetY) / displayedHeight) * canvas.height;
              
              if (gameState === "asteroids") {
                  const dx = x - (state.current.player.x + state.current.player.width / 2);
                  const dy = y - (state.current.player.y + state.current.player.height / 2);
                  
                  if (Math.sqrt(dx*dx + dy*dy) > 10) {
                      state.current.player.angle = Math.atan2(dy, dx);
                  }
                  
                  state.current.player.x = x - state.current.player.width / 2;
                  state.current.player.y = y - state.current.player.height / 2;
              } else {
                  state.current.player.x = x - state.current.player.width / 2;
              }
            }
          }}
          onClick={() => {
            if (gameState === "playing" || gameState === "asteroids") fire();
          }}
          onTouchStart={(e) => {
            if (gameState === "playing" || gameState === "asteroids") {
              fire();
            }
          }}
          onTouchMove={(e) => {
            if ((gameState === "playing" || gameState === "asteroids") && canvasRef.current) {
              e.preventDefault();
              const canvas = canvasRef.current;
              const rect = canvas.getBoundingClientRect();
              
              const scaleX = canvas.width / canvas.height;
              const scaleY = rect.width / rect.height;
              
              let displayedWidth = rect.width;
              let displayedHeight = rect.height;
              
              if (scaleX > scaleY) {
                  displayedHeight = rect.width / scaleX;
              } else {
                  displayedWidth = rect.height * scaleX;
              }
              
              const offsetX = (rect.width - displayedWidth) / 2;
              const offsetY = (rect.height - displayedHeight) / 2;
              
              let x = ((e.touches[0].clientX - rect.left - offsetX) / displayedWidth) * canvas.width;
              let y = ((e.touches[0].clientY - rect.top - offsetY) / displayedHeight) * canvas.height;
              
              if (gameState === "asteroids") {
                  const dx = x - (state.current.player.x + state.current.player.width / 2);
                  const dy = y - (state.current.player.y + state.current.player.height / 2);
                  
                  if (Math.sqrt(dx*dx + dy*dy) > 10) {
                      state.current.player.angle = Math.atan2(dy, dx);
                  }
                  
                  state.current.player.x = x - state.current.player.width / 2;
                  state.current.player.y = y - state.current.player.height / 2;
              } else {
                  state.current.player.x = x - state.current.player.width / 2;
              }
            }
          }}
        />

        {/* CRT Scanline effect Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-50 mix-blend-overlay"></div>

        {/* Glow vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>

        {gameState === "start" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 pointer-events-auto overflow-y-auto">
            <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-8">
              <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="flex-1 text-left flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-brand-accent/20 flex items-center justify-center mb-4 border border-brand-accent/30 shadow-[0_0_30px_rgba(242,74,41,0.3)]">
                  <Zap className="w-8 h-8 text-brand-accent" />
                </div>
                <h3 className="text-3xl font-display text-white mb-2 uppercase tracking-tighter">
                  {t("game.invaders.subtitle")}
                </h3>
                <p className="text-white/60 text-xs font-mono max-w-xs mb-4 leading-relaxed">
                  {t("game.invaders.instruction.desc", {
                    blocks: t('game.invaders.instruction.blocks'),
                    distractions: t('game.invaders.instruction.distractions'),
                    routine: t('game.invaders.instruction.routine')
                  }).split(/(\{\{.*?\}\})/).map((part, i) => {
                    if (part === "{{blocks}}") return <span key={i} className="text-red-500 font-bold">{t('game.invaders.instruction.blocks')}</span>;
                    if (part === "{{distractions}}") return <span key={i} className="text-yellow-500 font-bold">{t('game.invaders.instruction.distractions')}</span>;
                    if (part === "{{routine}}") return <span key={i} className="text-gray-400 font-bold">{t('game.invaders.instruction.routine')}</span>;
                    return part;
                  })}
                </p>
                <div className="text-yellow-500 font-mono text-sm tracking-widest flex items-center gap-2 mt-auto">
                   <Zap className="w-4 h-4" /> {festCoins} {t('game.invaders.karmas')}
                </div>
                <div className="text-brand-accent font-mono text-[10px] tracking-widest flex items-center gap-2 mt-2">
                   {t('game.invaders.highscore')} {highScore}
                </div>
                <div className="mt-2 text-brand-accent font-mono text-[10px] tracking-widest flex items-center gap-2 cursor-pointer hover:underline" onClick={() => setShowMobileControls(prev => !prev)}>
                   <Settings className="w-3 h-3" /> {showMobileControls ? t('game.common.controls_on') : t('game.common.controls_off')}
                </div>
                
                <div className="mt-6 flex flex-col gap-2 w-full max-w-[200px]">
                  <p className="text-[8px] font-mono text-white/40 uppercase tracking-[0.2em]">{t('game.invaders.difficulty', 'DIFFICULTY')}</p>
                  <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                    {(['easy', 'normal', 'hard'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDifficulty(d);
                          playSound('hover');
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-md font-mono text-[9px] uppercase tracking-tighter transition-all ${
                          difficulty === d 
                            ? 'bg-brand-accent text-white shadow-[0_0_15px_rgba(242,74,41,0.3)]' 
                            : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                        }`}
                      >
                        {t(`game.difficulty.${d}`, d)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMobileControls(prev => !prev);
                      playSound('click');
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-widest transition-all ${showMobileControls ? 'bg-brand-accent/20 border-brand-accent text-brand-accent' : 'bg-white/5 border-white/10 text-white/40'}`}
                  >
                    <Settings className="w-3 h-3" />
                    {showMobileControls ? t('game.common.controls_on') : t('game.common.controls_off')}
                  </button>
                </div>
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => setStoreTab("chars")}
                    className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all border-b-2 ${storeTab === "chars" ? "border-brand-accent text-brand-accent bg-brand-accent/10" : "border-transparent text-white/40"}`}
                  >
                    {t('game.invaders.naves')}
                  </button>
                  <button 
                    onClick={() => setStoreTab("upgrades")}
                    className={`px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-all border-b-2 ${storeTab === "upgrades" ? "border-brand-accent text-brand-accent bg-brand-accent/10" : "border-transparent text-white/40"}`}
                  >
                    {t('game.invaders.mejoras')}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-6 relative">
                 {storeTab === "chars" ? (
                   <>
                     <div className="flex justify-between items-center w-full mb-6">
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           playSound('hover');
                           const currentIndex = CHARACTERS.findIndex(c => c.id === selectedCharId);
                           const prevIndex = (currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
                           setSelectedCharId(CHARACTERS[prevIndex].id);
                         }}
                         className="w-10 h-10 flex items-center justify-center text-white bg-black/50 rounded-full hover:bg-brand-accent transition-colors z-10 cursor-pointer pointer-events-auto"
                       >
                         &lt;
                       </button>
                       
                       <div className="flex-1 flex flex-col items-center justify-center pointer-events-none px-4">
                         <div className="w-24 h-24 mb-4 flex items-center justify-center relative bg-black/40 border-2 rounded-lg" style={{ borderColor: `${selectedChar.color}50`, backgroundColor: `${selectedChar.color}15` }}>
                            <div className="w-12 h-12 relative z-10" style={{ backgroundColor: selectedChar.color }}></div>
                         </div>
                         <p className="text-sm font-mono text-white uppercase tracking-widest">{t(selectedChar.nameKey)}</p>
                         <p className="text-[10px] font-mono text-zinc-400 mt-2 h-10 text-center">{t(selectedChar.descKey)}</p>
                       </div>

                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           playSound('hover');
                           const currentIndex = CHARACTERS.findIndex(c => c.id === selectedCharId);
                           const nextIndex = (currentIndex + 1) % CHARACTERS.length;
                           setSelectedCharId(CHARACTERS[nextIndex].id);
                         }}
                         className="w-10 h-10 flex items-center justify-center text-white bg-black/50 rounded-full hover:bg-brand-accent transition-colors z-10 cursor-pointer pointer-events-auto"
                       >
                         &gt;
                       </button>
                     </div>

                     <div className="w-full flex justify-center">
                       {unlockedChars.includes(selectedCharId) ? (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             initGame();
                           }} 
                           className="w-full bg-brand-accent text-white font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex justify-center items-center gap-3 hover:bg-brand-accent/80 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(242,74,41,0.4)] cursor-pointer pointer-events-auto"
                         >
                           <Play size={18} /> {t('game.invaders.start_game')}
                         </button>
                       ) : (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             buyChar(selectedChar);
                           }} 
                           className={`w-full font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex justify-center items-center transition-all cursor-pointer pointer-events-auto ${festCoins >= selectedChar.price ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-105' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                         >
                           {t('game.invaders.unlock')} - {selectedChar.price} {t('game.invaders.karmas')}
                         </button>
                       )}
                     </div>
                   </>
                 ) : (
                   <div className="flex flex-col gap-4 text-left">
                     {[
                       { id: 'shield', icon: Shield, name: t('game.invaders.upgrade.shield'), price: 1000 * (upgrades.shield + 1) },
                       { id: 'power', icon: Zap, name: t('game.invaders.upgrade.power'), price: 2000 * (upgrades.power + 1) },
                       { id: 'speed', icon: Star, name: t('game.invaders.upgrade.speed'), price: 1500 * (upgrades.speed + 1) },
                      { id: 'rear_turret', icon: RefreshCw, name: t('game.invaders.upgrade.rear_turret'), price: 3000 * (upgrades.rear_turret + 1) }
                     ].map(upg => (
                       <div key={upg.id} className="flex items-center justify-between bg-black/30 p-3 border border-white/5 rounded-lg">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                             <upg.icon className="w-4 h-4 text-brand-accent" />
                           </div>
                           <div>
                             <p className="text-[10px] text-white font-bold uppercase tracking-widest">{upg.name}</p>
                             <p className="text-[8px] text-zinc-400">{t('game.invaders.level')} {upgrades[upg.id as keyof typeof upgrades]}</p>
                           </div>
                         </div>
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             if (festCoins >= upg.price && upgrades[upg.id as keyof typeof upgrades] < 5) {
                               setFestCoins(prev => prev - upg.price);
                               setUpgrades(prev => ({ ...prev, [upg.id]: prev[upg.id as keyof typeof upgrades] + 1 }));
                               playSound('purchase');
                             } else {
                               playSound('alert');
                             }
                           }}
                           className={`px-3 py-1.5 text-[8px] font-bold rounded flex items-center gap-1 transition-all pointer-events-auto cursor-pointer ${festCoins >= upg.price && upgrades[upg.id as keyof typeof upgrades] < 5 ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-zinc-800 text-zinc-500'}`}
                         >
                           <Zap className="w-3 h-3" /> {upg.price}
                         </button>
                       </div>
                     ))}
                     <p className="text-[7px] text-zinc-500 text-center mt-2 italic uppercase">{t('game.invaders.upgrade.desc')}</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center ring-1 ring-red-500/30 pointer-events-auto z-50">
            <h3 className="text-5xl font-display text-red-500 mb-2 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              {t("game.invaders.gameover")}
            </h3>
            <p className="text-red-300/70 font-mono mb-8 uppercase tracking-widest text-sm">
              {t("game.invaders.drained")}
            </p>
            <p className="text-white/80 font-mono mb-8">
              {t("game.invaders.finalscore")}{" "}
              <span className="text-brand-accent text-2xl ml-2">{score}</span>
            </p>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
              className="bg-red-600 text-white font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-3 hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)] relative z-50 cursor-pointer pointer-events-auto"
            >
              <RefreshCw size={18} /> {t("game.invaders.tryagain")}
            </button>
          </div>
        )}

        {gameState === "takeoff" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
                <h3 className="text-4xl font-display text-brand-accent animate-pulse uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(242,74,41,0.6)]">
                    {t('game.invaders.entering_deep_space')}
                </h3>
                <p className="text-white/50 font-mono mt-4 uppercase tracking-[0.4em] text-[10px] animate-bounce">
                    {t('game.invaders.stabilizing')}
                </p>
            </div>
        )}

        {gameState === "win" && (
          <div className="absolute inset-0 bg-brand-accent/20 backdrop-blur-md flex flex-col items-center justify-center ring-1 ring-brand-accent/30 pointer-events-auto z-50">
            <h3 className="text-5xl font-display text-white mb-2 uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(242,74,41,0.5)]">
              {t("game.invaders.win")}
            </h3>
            <p className="text-brand-accent/80 font-mono mb-8 uppercase tracking-widest text-sm">
              {t("game.invaders.flow")}
            </p>
            <p className="text-white/80 font-mono mb-8">
              {t("game.invaders.finalscore")}{" "}
              <span className="text-white text-2xl font-bold ml-2">
                {score}
              </span>
            </p>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
              onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
              className="bg-white text-brand-accent font-black font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-3 hover:bg-gray-100 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.4)] relative z-50 cursor-pointer pointer-events-auto"
            >
              <RefreshCw size={18} /> {t("game.invaders.next")}
            </button>
          </div>
        )}

        {showMobileControls && (gameState === "playing" || gameState === "asteroids" || gameState === "takeoff") && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Movement Controls (Left) - Compact Joystick Area */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <div className="flex gap-1 justify-center">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); state.current.player.isMovingUp = true; }}
                  onMouseUp={() => state.current.player.isMovingUp = false}
                  onMouseLeave={() => state.current.player.isMovingUp = false}
                  onTouchStart={(e) => { e.preventDefault(); state.current.player.isMovingUp = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); state.current.player.isMovingUp = false; }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center active:bg-white/30 transition-all pointer-events-auto"
                >
                  <ChevronUp className="text-white w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-1">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); state.current.player.isMovingLeft = true; }}
                  onMouseUp={() => state.current.player.isMovingLeft = false}
                  onMouseLeave={() => state.current.player.isMovingLeft = false}
                  onTouchStart={(e) => { e.preventDefault(); state.current.player.isMovingLeft = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); state.current.player.isMovingLeft = false; }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center active:bg-white/30 transition-all pointer-events-auto"
                >
                  <ChevronLeft className="text-white w-5 h-5" />
                </button>
                <div className="w-12 h-12" /> {/* Center hole */}
                <button 
                  onMouseDown={(e) => { e.preventDefault(); state.current.player.isMovingRight = true; }}
                  onMouseUp={() => state.current.player.isMovingRight = false}
                  onMouseLeave={() => state.current.player.isMovingRight = false}
                  onTouchStart={(e) => { e.preventDefault(); state.current.player.isMovingRight = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); state.current.player.isMovingRight = false; }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center active:bg-white/30 transition-all pointer-events-auto"
                >
                  <ChevronRight className="text-white w-5 h-5" />
                </button>
              </div>
              <div className="flex gap-1 justify-center">
                <button 
                  onMouseDown={(e) => { e.preventDefault(); state.current.player.isMovingDown = true; }}
                  onMouseUp={() => state.current.player.isMovingDown = false}
                  onMouseLeave={() => state.current.player.isMovingDown = false}
                  onTouchStart={(e) => { e.preventDefault(); state.current.player.isMovingDown = true; }}
                  onTouchEnd={(e) => { e.preventDefault(); state.current.player.isMovingDown = false; }}
                  className="w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center active:bg-white/30 transition-all pointer-events-auto"
                >
                  <ChevronDown className="text-white w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Fire Button (Right) - More Minimal */}
            <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
              <button 
                onMouseDown={(e) => { e.preventDefault(); fire(); }}
                onTouchStart={(e) => { e.preventDefault(); fire(); }}
                className="w-20 h-20 bg-brand-accent/20 backdrop-blur-sm border-2 border-brand-accent/40 rounded-full flex items-center justify-center active:bg-brand-accent/50 transition-all pointer-events-auto"
              >
                <Zap className="w-8 h-8 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
