import React, { useRef, useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { useAchievements } from "../../context/AchievementsContext";
import { Play, RefreshCw, Zap, Shield, Star } from "lucide-react";
import { useAudio } from "../../context/AudioContext";

type GameState = "start" | "playing" | "gameover" | "win" | "takeoff" | "asteroids" | "asteroids_win";

const CHARACTERS = [
  { id: 'classic', nameKey: 'game.invaders.char.classic', descKey: 'Basic Ship', price: 0, speed: 7, fireRateBase: 1, color: '#fbbf24', tailColor: '#f59e0b' },
  { id: 'rapid', nameKey: 'game.invaders.char.rapid', descKey: 'Rapid Fire', price: 200, speed: 8, fireRateBase: 1.5, color: '#6ee7b7', tailColor: '#10b981' },
  { id: 'tank', nameKey: 'game.invaders.char.tank', descKey: 'Starting Shield', price: 500, speed: 6, fireRateBase: 1, color: '#93c5fd', tailColor: '#3b82f6' },
  { id: 'laser', nameKey: 'game.invaders.char.laser', descKey: 'Fast lasers + Speed', price: 1000, speed: 10, fireRateBase: 2, color: '#c084fc', tailColor: '#a855f7' }
];

export function CreativeInvaders() {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  const { playSound } = useAudio();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [hudShield, setHudShield] = useState(0);
  const [hudPower, setHudPower] = useState(1);
  const [hudTurbo, setHudTurbo] = useState(0);

  const [festCoins, setFestCoins] = useState(() => Number(localStorage.getItem('fest_coins') || 0));
  const [unlockedChars, setUnlockedChars] = useState<string[]>(() => JSON.parse(localStorage.getItem('invaders_chars') || '["classic"]'));
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('invaders_selected_char') || 'classic');

  const selectedChar = CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0];

  useEffect(() => {
    localStorage.setItem('fest_coins', festCoins.toString());
    localStorage.setItem('invaders_chars', JSON.stringify(unlockedChars));
    localStorage.setItem('invaders_selected_char', selectedCharId);
  }, [festCoins, unlockedChars, selectedCharId]);

  const buyChar = (char: typeof CHARACTERS[0]) => {
    if (festCoins >= char.price) {
      setFestCoins(prev => prev - char.price);
      setUnlockedChars(prev => [...prev, char.id]);
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
    }[],
    drops: [] as { x: number; y: number; type: "power" | "shield" | "speed" }[],
    stars: Array.from({length: 100}).map(() => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      speed: Math.random() * 2 + 0.5,
      size: Math.random() * 2 + 1
    })),
    enemyDirection: 1,
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
    }[],
    level: 1,
    lastHitEdgeTime: 0,
  });

  const loadAsteroidsLevel = useCallback(() => {
    state.current.enemies = [];
    state.current.projectiles = [];
    state.current.drops = [];
    state.current.player.x = GAME_WIDTH / 2;
    state.current.player.y = GAME_HEIGHT / 2;
    
    // Create 5 large asteroids
    for(let i = 0; i < 5; i++) {
        state.current.enemies.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT * 0.5,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
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
    state.current.enemyDirection = 1;
    state.current.enemySpeedBase = 1.0 + level * 0.3;
    state.current.player.x = GAME_WIDTH / 2;
    state.current.projectiles = [];
    
    if (level === 4) {
      // Boss level
      state.current.enemies.push({
        x: GAME_WIDTH / 2 - 100,
        y: 50,
        width: 200,
        height: 150,
        type: "boss",
        hp: 100,
        maxHp: 100,
        offset: 0,
      });
      return;
    }

    const rows = 3 + level;
    const cols = 7 + level;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let type: "routine" | "block" | "distraction" | "boss" = "routine";
        let hp = 1;
        
        if (level === 1) {
           type = "routine";
        } else if (level === 2) {
           if (r === 0) { type = "block"; hp = 3; }
        } else if (level === 3) {
           if (r === 0) { type = "block"; hp = 4; }
           else if (r === 1 || r === 2) { type = "distraction"; hp = 1; }
        }

        state.current.enemies.push({
          x: c * (GAME_WIDTH / cols * 0.7) + 50,
          y: r * 45 + 50,
          width: 35,
          height: 35,
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
        speed: selectedChar.speed,
        isMovingLeft: false,
        isMovingRight: false,
        isMovingUp: false,
        isMovingDown: false,
        power: selectedChar.id === 'laser' ? 2 : 1,
        powerTimer: 0,
        shield: selectedChar.id === 'tank' ? 3 : 0,
        speedBoostTimer: selectedChar.id === 'rapid' ? 500 : 0,
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
      enemyDirection: 1,
      enemySpeedBase: 1.5,
      enemyMoveTimer: 0,
      time: 0,
      score: 0,
      lastFireTime: 0,
      particles: [],
      level: 1,
    };

    loadLevel(1);
    setScore(0);
    setGameState("playing");
  }, [loadLevel, selectedChar]);

  const fire = useCallback(() => {
    const s = state.current;
    const now = Date.now();
    // Use fireRateBase
    const baseFireDelay = 300 / selectedChar.fireRateBase;
    const fireDelay = s.player.speedBoostTimer > 0 ? baseFireDelay * 0.33 : (s.player.power > 1 ? baseFireDelay * 0.5 : baseFireDelay);

    if (now - s.lastFireTime > fireDelay) {
      playSound('fire');
      if (s.player.power === 1) {
        s.projectiles.push({
          x: s.player.x + s.player.width / 2 - 3,
          y: s.player.y,
          vx: 0,
          vy: -10,
          speed: 10,
          color: "#facc15",
        });
      } else if (s.player.power >= 2) {
        s.projectiles.push({
          x: s.player.x + 10,
          y: s.player.y,
          vx: -2,
          vy: -10,
          speed: 10,
          color: "#38bdf8",
        });
        s.projectiles.push({
          x: s.player.x + s.player.width - 10,
          y: s.player.y,
          vx: 2,
          vy: -10,
          speed: 10,
          color: "#38bdf8",
        });
        if (s.player.power >= 3) {
          s.projectiles.push({
            x: s.player.x + s.player.width / 2,
            y: s.player.y - 10,
            vx: 0,
            vy: -10,
            speed: 10,
            color: "#facc15",
          });
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
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (gameState === "playing" || gameState === "asteroids") &&
        (e.key === " " ||
          e.key === "ArrowUp" ||
          e.key === "w" ||
          e.key === "ArrowDown" ||
          e.key === "s" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight")
      ) {
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
  ) => {
    for (let i = 0; i < count; i++) {
      state.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: Math.random() * 25 + 10,
        color,
      });
    }
  };

  const update = useCallback(() => {
    const s = state.current;
    if (gameState !== "playing" && gameState !== "asteroids" && gameState !== "takeoff") return;

    if (gameState === "takeoff") {
        s.player.y -= 10;
        
        // Speed up stars for effect
        for (const star of s.stars) {
          star.y += star.speed * 8;
          if (star.y > GAME_HEIGHT) {
            star.y = 0;
            star.x = Math.random() * GAME_WIDTH;
          }
        }

        if (s.player.y < -s.player.height) {
            setGameState("asteroids");
            loadAsteroidsLevel();
        }
        
        // draw player taking off
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
        return; // Important: stay in takeoff sequence
    }

    // Update stars
    for (const star of s.stars) {
      star.y += star.speed + (s.player.speedBoostTimer > 0 ? 5 : 0);
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = Math.random() * GAME_WIDTH;
      }
    }

    s.time += 0.05;

    if (s.player.powerTimer > 0) {
      s.player.powerTimer--;
      if (s.player.powerTimer <= 0) s.player.power = 1;
    }
    if (s.player.speedBoostTimer > 0) {
      s.player.speedBoostTimer--;
    }

    const playerCurrentSpeed = s.player.speedBoostTimer > 0 ? s.player.speed * 1.5 : s.player.speed;
    if (s.player.isMovingLeft) s.player.x -= playerCurrentSpeed;
    if (s.player.isMovingRight) s.player.x += playerCurrentSpeed;
    if (s.player.isMovingUp) s.player.y -= playerCurrentSpeed;
    if (s.player.isMovingDown) s.player.y += playerCurrentSpeed;

    if (gameState === "asteroids") {
      if (s.player.x < -s.player.width) s.player.x = GAME_WIDTH;
      if (s.player.x > GAME_WIDTH) s.player.x = -s.player.width;
      if (s.player.y < -s.player.height) s.player.y = GAME_HEIGHT;
      if (s.player.y > GAME_HEIGHT) s.player.y = -s.player.height;
    } else {
      if (s.player.x < 0) s.player.x = 0;
      if (s.player.x > GAME_WIDTH - s.player.width) s.player.x = GAME_WIDTH - s.player.width;
      if (s.player.y < GAME_HEIGHT * 0.5) s.player.y = GAME_HEIGHT * 0.5;
      if (s.player.y > GAME_HEIGHT - s.player.height) s.player.y = GAME_HEIGHT - s.player.height;
    }

    for (let i = s.projectiles.length - 1; i >= 0; i--) {
      s.projectiles[i].x += s.projectiles[i].vx;
      s.projectiles[i].y += s.projectiles[i].vy;
      if (
        s.projectiles[i].y < 0 ||
        s.projectiles[i].y > GAME_HEIGHT ||
        s.projectiles[i].x < 0 ||
        s.projectiles[i].x > GAME_WIDTH
      ) {
        s.projectiles.splice(i, 1);
      }
    }

    const currentSpeed = s.enemySpeedBase + (1 - s.enemies.length / 45) * 3; // speed up as they die

    let minX = GAME_WIDTH;
    let maxX = 0;

    if (gameState === "playing") {
      for (const enemy of s.enemies) {
        if (enemy.type === "block") continue; // Blocks don't trigger edge hits

        let enemySpeedX = currentSpeed;
        if (enemy.type === "block") enemySpeedX *= 0.3;
        else if (enemy.type === "distraction") enemySpeedX *= 1.5;
        else if (enemy.type === "boss") enemySpeedX *= 1.2;

        let nextX = enemy.x + s.enemyDirection * enemySpeedX;
        if (enemy.type === "distraction") {
           nextX += Math.cos(enemy.offset) * 4; 
        }
        if (nextX < minX) minX = nextX;
        if (nextX + enemy.width > maxX) maxX = nextX + enemy.width;
      }
    }

    let hitEdge = false;
    const now_ts = Date.now();
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

    // Enemy firing logic
    if (gameState === "playing" && Math.random() < 0.02 + (s.level * 0.01)) {
      const shooters = s.enemies.filter(e => e.type !== 'block');
      if (shooters.length > 0) {
        const shooter = shooters[Math.floor(Math.random() * shooters.length)];
        const isBoss = shooter.type === "boss";
        const isFast = shooter.type === "distraction";
        
        s.projectiles.push({
           x: shooter.x + shooter.width/2,
           y: shooter.y + shooter.height,
           vx: isBoss ? (Math.random() - 0.5) * 4 : 0,
           vy: isFast ? 8 + s.level : 5 + s.level,
           speed: isFast ? 8 + s.level : 5 + s.level,
           color: isBoss ? "#ef4444" : isFast ? "#fbbf24" : "#ff00ff", // Magenta for fast bullets
           isEnemy: true
        });

        if (isBoss && Math.random() < 0.5) {
           // Boss fires spread
           for (let d = -1; d <= 1; d += 2) {
             s.projectiles.push({
                x: shooter.x + shooter.width/2,
                y: shooter.y + shooter.height,
                vx: d * 3,
                vy: 6 + s.level,
                speed: 6 + s.level,
                color: "#ef4444",
                isEnemy: true
             });
           }
        }
      }
    }

    for (const enemy of s.enemies) {
      enemy.offset += 0.05;
      
      if (gameState === "asteroids") {
         enemy.x += enemy.vx || 0;
         enemy.y += enemy.vy || 0;
         
         if (enemy.x < -enemy.width) enemy.x = GAME_WIDTH;
         if (enemy.x > GAME_WIDTH) enemy.x = -enemy.width;
         if (enemy.y < -enemy.height) enemy.y = GAME_HEIGHT;
         if (enemy.y > GAME_HEIGHT) enemy.y = -enemy.height;
         
         // Player collision for asteroids
         if (
           s.player.x < enemy.x + enemy.width - 5 &&
           s.player.x + s.player.width > enemy.x + 5 &&
           s.player.y < enemy.y + enemy.height - 5 &&
           s.player.y + s.player.height > enemy.y + 5
         ) {
           createExplosion(s.player.x + s.player.width/2, s.player.y + s.player.height/2, "#f87171", 20);
           setGameState("gameover");
         }
      } else {
        const moveX = s.enemyDirection * currentSpeed;

        if (hitEdge) {
          if (enemy.type !== "block") enemy.y += 20; // Reduced from 25
          if (enemy.y >= s.player.y - enemy.height) {
            setGameState("gameover");
          }
        } else {
          if (enemy.type === "block") {
             enemy.y += 0.1 + (s.level * 0.05);
             enemy.x += moveX * 0.3;
          } else if (enemy.type === "distraction") {
             enemy.x += moveX * 1.5;
             enemy.x += Math.cos(enemy.offset) * 4;
             enemy.y += Math.sin(enemy.offset * 2) * 2;
          } else if (enemy.type === "boss") {
             enemy.x += moveX * 1.2;
             enemy.y += Math.sin(enemy.offset) * 1.5;
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
                 hit = true;
             } else if (s.player.power > 1) {
                playSound('hit');
                s.player.power = 1; // lose power
                hit = true;
             } else {
                playSound('explosion');
                setGameState("gameover");
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
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ef4444", 50);
              playSound('powerup');
              // Maybe drop multiple powerups
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
            setScore(s.score);
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

    // update drops
    for (let i = s.drops.length - 1; i >= 0; i--) {
      s.drops[i].y += 3;
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
           s.player.powerTimer = 300; // 5 seconds approx
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
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      if (p.life >= p.maxLife) s.particles.splice(i, 1);
    }

    if (s.enemies.length === 0) {
       if (gameState === "playing") {
         if (s.level < 4) {
            s.level++;
            loadLevel(s.level);
         } else {
            setGameState("takeoff");
         }
       } else if (gameState === "asteroids") {
         setGameState("asteroids_win");
       }
    }

    // Sync HUD
    setHudShield(s.player.shield);
    setHudPower(s.player.power);
    setHudTurbo(s.player.speedBoostTimer);
  }, [gameState, loadLevel]);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#0a0a0B";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    const s = state.current;

    // Draw grid background for 'creative space' feel
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

    // Draw stars
    ctx.fillStyle = "#4b5563"; // Dim gray instead of white
    for (const star of s.stars) {
      ctx.globalAlpha = star.speed / 6;
      ctx.fillRect(star.x, star.y, star.size, star.size + (s.player.speedBoostTimer > 0 ? 15 : 0));
    }
    ctx.globalAlpha = 1;

    // Player
    const playerPalette = ['#1e293b', '#d4d4d4', '#475569', s.player.power > 1 ? '#a855f7' : selectedChar.color, '#9ca3af', selectedChar.tailColor];
    ctx.shadowBlur = s.player.power > 1 ? 20 : (s.player.speedBoostTimer > 0 ? 15 : 0);
    ctx.shadowColor = s.player.power > 1 ? "#a78bfa" : (s.player.speedBoostTimer > 0 ? "#fde047" : "transparent");
    drawSprite(ctx, sprites.player, s.player.x, s.player.y, s.player.width, s.player.height, playerPalette);
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
      if (enemy.type === "routine") {
        drawSprite(ctx, sprites.routine, enemy.x, enemy.y, enemy.width, enemy.height, ['#1e293b', '#9ca3af', '#4b5563']);
      } else if (enemy.type === "block") {
        const boxColor = enemy.hp === 1 ? '#f87171' : enemy.hp === 2 ? '#ef4444' : '#b91c1c';
        drawSprite(ctx, sprites.block, enemy.x, enemy.y, enemy.width, enemy.height, ['#1e293b', '#d4d4d4', boxColor]);
      } else if (enemy.type === "distraction") {
        drawSprite(ctx, sprites.distraction, enemy.x, enemy.y, enemy.width, enemy.height, ['#1e293b', '#3b82f6', '#ef4444', '#1e293b']);
      } else if (enemy.type === "boss") {
        const metalColor = enemy.hp > 50 ? '#d4d4d4' : '#fca5a5';
        drawSprite(ctx, sprites.boss, enemy.x, enemy.y, enemy.width, enemy.height, ['#1e293b', metalColor]);
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
      ctx.arc(
        p.x,
        p.y,
        Math.max(0.5, 3 * (1 - p.life / p.maxLife)),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }, []);

  const tick = useCallback(() => {
    update();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) draw(ctx);
    }
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [tick]);

  const isFullScreen = gameState === 'playing' || gameState === 'asteroids';

  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }
  }, [isFullScreen]);

  return (
    <div className={isFullScreen ? "fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-md overflow-hidden" : "w-full max-w-4xl mx-auto flex flex-col items-center gap-6"}>
      <div className={isFullScreen ? "w-full max-w-5xl mx-auto flex flex-col bg-zinc-950/50 p-6 rounded-2xl border border-white/10 shadow-2xl" : "w-full flex flex-col"}>
      <div className="w-full flex justify-between items-end border-b border-white/10 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-display uppercase tracking-tight text-brand-accent flex items-center gap-2 mb-1">
            <Zap className="w-6 h-6" />
            {t("game.invaders.title")}
          </h2>
          <p className="text-white/60 text-xs font-mono uppercase tracking-widest max-w-sm">
            {t("game.invaders.desc")}
          </p>
        </div>
        <div className="flex gap-8">
           <div className="flex items-center gap-4 mr-4">
              {hudShield > 0 && (
                <div className="flex flex-col items-center">
                  <Shield className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-[8px] text-blue-400 font-mono uppercase">Shield</span>
                </div>
              )}
              {hudTurbo > 0 && (
                <div className="flex flex-col items-center">
                  <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
                  <span className="text-[8px] text-yellow-400 font-mono uppercase">Turbo</span>
                </div>
              )}
              {hudPower > 1 && (
                <div className="flex flex-col items-center">
                  <Star className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-[8px] text-purple-400 font-mono uppercase">Pwr {hudPower}</span>
                </div>
              )}
           </div>
           <div className="text-right">
             <p className="text-white/50 text-xs font-mono tracking-widest uppercase mb-1">
               {t('game.invaders.level') || 'Level'}
             </p>
             <div className="bg-black/50 border border-white/20 px-4 py-2 rounded-md">
               <p className="text-3xl font-mono text-white tracking-widest">
                 {gameState === 'playing' ? state.current.level : gameState === 'asteroids' ? 'DEEP SPACE' : 1}
               </p>
             </div>
           </div>
           <div className="text-right">
             <p className="text-brand-accent text-xs font-mono tracking-widest uppercase mb-1">
               {t("game.invaders.score")}
             </p>
             <div className="bg-black/50 border border-brand-accent/30 px-4 py-2 rounded-md">
               <p className="text-3xl font-mono text-white tracking-widest">
                 {score.toString().padStart(5, "0")}
               </p>
             </div>
           </div>
        </div>
      </div>

      <div className="relative w-full aspect-[4/3] bg-[#0a0a0B] border-2 border-white/10 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center group">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="w-full h-full object-contain cursor-none mix-blend-screen"
          onMouseMove={(e) => {
            if ((gameState === "playing" || gameState === "asteroids") && canvasRef.current) {
              const rect = canvasRef.current.getBoundingClientRect();
              const scaleX = GAME_WIDTH / rect.width;
              const scaleY = GAME_HEIGHT / rect.height;
              let x = (e.clientX - rect.left) * scaleX;
              let y = (e.clientY - rect.top) * scaleY;
              state.current.player.x = x - state.current.player.width / 2;
              if (gameState === "asteroids") {
                  state.current.player.y = y - state.current.player.height / 2;
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
              const rect = canvasRef.current.getBoundingClientRect();
              const scaleX = GAME_WIDTH / rect.width;
              const scaleY = GAME_HEIGHT / rect.height;
              let x = (e.touches[0].clientX - rect.left) * scaleX;
              let y = (e.touches[0].clientY - rect.top) * scaleY;
              state.current.player.x = x - state.current.player.width / 2;
              if (gameState === "asteroids") {
                  state.current.player.y = y - state.current.player.height / 2;
              }
            }
          }}
        />

        {/* CRT Scanline effect Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgoJPHJlY3Qgd2lkdGg9IjQiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-50 mix-blend-overlay"></div>

        {/* Glow vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>

        {gameState === "start" && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 text-center ring-1 ring-white/10 z-50 pointer-events-auto">
            <div className="w-full max-w-2xl flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-left flex flex-col items-center md:items-start text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-brand-accent/20 flex items-center justify-center mb-4 border border-brand-accent/30 shadow-[0_0_30px_rgba(242,74,41,0.3)]">
                  <Zap className="w-8 h-8 text-brand-accent" />
                </div>
                <h3 className="text-3xl font-display text-white mb-2 uppercase tracking-tighter">
                  {t("game.invaders.subtitle")}
                </h3>
                <p className="text-white/60 text-xs font-mono max-w-xs mb-4 leading-relaxed">
                  {t("game.invaders.instructions")} Destroy{" "}
                  <span className="text-red-500 font-bold">BLOCKS</span>, shatter{" "}
                  <span className="text-yellow-500 font-bold">DISTRACTIONS</span>,
                  and break the{" "}
                  <span className="text-gray-400 font-bold">ROUTINE</span>.
                </p>
                <div className="text-yellow-500 font-mono text-sm tracking-widest flex items-center gap-2 mt-auto">
                   <Zap className="w-4 h-4" /> {festCoins} KARMAS
                </div>
              </div>
              
              <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-6 relative">
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
                       <Play size={18} /> [ START GAME ]
                     </button>
                   ) : (
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         buyChar(selectedChar);
                       }} 
                       className={`w-full font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex justify-center items-center transition-all cursor-pointer pointer-events-auto ${festCoins >= selectedChar.price ? 'bg-yellow-500 text-black hover:bg-yellow-400 hover:scale-105' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
                     >
                       UNLOCK - {selectedChar.price} KARMAS
                     </button>
                   )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center ring-1 ring-red-500/30">
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
              onClick={initGame}
              className="bg-red-600 text-white font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-3 hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <RefreshCw size={18} /> {t("game.invaders.tryagain")}
            </button>
          </div>
        )}

        {gameState === "takeoff" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
                <h3 className="text-4xl font-display text-brand-accent animate-pulse uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(242,74,41,0.6)]">
                    ENTERING DEEP SPACE
                </h3>
                <p className="text-white/50 font-mono mt-4 uppercase tracking-[0.4em] text-[10px] animate-bounce">
                    Stabilizing propulsion...
                </p>
            </div>
        )}

        {gameState === "asteroids_win" && (
          <div className="absolute inset-0 bg-brand-accent/20 backdrop-blur-md flex flex-col items-center justify-center ring-1 ring-brand-accent/30">
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
              onClick={initGame}
              className="bg-white text-brand-accent font-black font-mono text-sm uppercase tracking-widest px-8 py-4 rounded-full flex items-center gap-3 hover:bg-gray-100 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              <RefreshCw size={18} /> {t("game.invaders.next")}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
