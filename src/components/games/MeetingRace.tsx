import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Car, Heart, TerminalSquare, Zap } from 'lucide-react';
import { FullscreenButton } from '../ui/FullscreenButton';

type ObstacleType = 'microbus' | 'taco' | 'msg' | 'bache' | 'enemy' | 'shield' | 'nitro' | 'oil' | 'cone' | 'tree' | 'building';

interface CarConfig {
  id: string;
  name: string;
  desc: string;
  speed: number;
  handling: number; // how fast it moves laterally
  maxHp: number;
  color: string;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  type: ObstacleType;
  color: string;
  markedForDeletion: boolean;
  vx?: number; // for enemy lateral movement
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export function MeetingRace({ isPausedGlobal = false }: { isPausedGlobal?: boolean }) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState('taxi');

  const cars: CarConfig[] = [
    { id: 'taxi', name: t('game.car.taxi.name'), desc: t('game.car.taxi.desc'), speed: 410, handling: 5, maxHp: 3, color: '#ec4899' },
    { id: 'sport', name: t('game.car.sport.name'), desc: t('game.car.sport.desc'), speed: 560, handling: 7, maxHp: 2, color: '#ef4444' },
    { id: 'truck', name: t('game.car.truck.name'), desc: t('game.car.truck.desc'), speed: 310, handling: 4, maxHp: 6, color: '#3b82f6' },
    { id: 'moto', name: t('game.car.moto.name'), desc: t('game.car.moto.desc'), speed: 500, handling: 9, maxHp: 1, color: '#06b6d4' },
  ];

  const currentCar = cars.find(c => c.id === selectedCarId) || cars[0];

  useEffect(() => {
    if (isPlaying) {
      playMusic('race');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [isPlaying, playMusic]);

  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(currentCar.maxHp);
  const [gameOver, setGameOver] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(() => localStorage.getItem('race_mobile_controls') === 'true');
  const scoreRefDOM = useRef<HTMLSpanElement>(null);
  const keysGamepad = useRef({ left: false, right: false });
  const pausedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem('race_mobile_controls', showMobileControls.toString());
  }, [showMobileControls]);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let lastTime = performance.now();
    let isGameOver = false;
    let countdownTimer = 0;

    // Physics constants
    const GAME_W = 400;
    const GAME_H = 600;
    const MAX_HP = currentCar.maxHp;
    
    let currentScore = 0;
    let currentHp = MAX_HP;
    let speedMultiplier = 1;
    let baseRoadSpeed = currentCar.speed; // pixels per second
    let roadOffset = 0;
    
    let lastRenderedScore = -1;
    let lastRenderedHp = -1;
    
    let nextObstacleId = 0;

    let shakeTime = 0;
    let shakeMag = 0;
    
    let slowMoTimer = 0;
    let damageTimer = 0;
    let shieldTimer = 0;
    let nitroTimer = 0;

    // Environment
    let dayNightCycle = 0; // 0 to 1
    let isRaining = Math.random() > 0.7;
    let rainDrops: {x: number, y: number, l: number, s: number}[] = [];
    if (isRaining) {
      for(let i=0; i<100; i++) rainDrops.push({x: Math.random()*GAME_W, y: Math.random()*GAME_H, l: Math.random()*20+10, s: Math.random()*15+15});
    }

    let timeSinceLastSpawn = 0;

    const player = { 
      x: GAME_W / 2 - (selectedCarId === 'moto' ? 10 : 18), 
      y: GAME_H - 120, 
      width: selectedCarId === 'moto' ? 20 : 36, 
      height: selectedCarId === 'moto' ? 45 : 60, 
      targetX: GAME_W / 2 - (selectedCarId === 'moto' ? 10 : 18), 
      tilt: 0,
      speed: 400
    };
    
    const obstacles: Obstacle[] = [];
    const particles: Particle[] = [];
    
    const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.hasOwnProperty(e.key)) keys[e.key as keyof typeof keys] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keys.hasOwnProperty(e.key)) keys[e.key as keyof typeof keys] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault(); // Prevent scrolling
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const scaleX = GAME_W / rect.width;
        player.targetX = (touchX * scaleX) - player.width / 2;
      }
    };
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    const explosionColors = ['#f59e0b', '#ef4444', '#facc15', '#ffffff'];
    const spawnParticles = (x: number, y: number, amount: number, colors: string[]) => {
      for(let i=0; i<amount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 200 + 50;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 0.2 + Math.random() * 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 4 + 2
        });
      }
    };

    const spawnObstacle = () => {
      const typeRand = Math.random();
      let type: ObstacleType = 'microbus';
      let width = 44;
      let height = 80;
      let color = '#10b981';
      let speedVar = 50;
      let vx = 0;
      
      if (typeRand > 0.96) {
        type = 'nitro';
        width = 24; height = 24;
        color = '#3b82f6';
      } else if (typeRand > 0.92) {
        type = 'shield';
        width = 30; height = 30;
        color = '#818cf8';
      } else if (typeRand > 0.85) {
        type = 'enemy';
        width = 40; height = 70;
        color = '#450a0a';
        speedVar = 80;
        vx = (Math.random() - 0.5) * 50;
      } else if (typeRand > 0.75) {
        type = 'msg';
        width = 65; height = 30;
        color = '#25D366';
      } else if (typeRand > 0.65) {
        type = 'oil';
        width = 50; height = 30;
        color = '#000';
        speedVar = 0;
      } else if (typeRand > 0.5) {
        type = 'cone';
        width = 18; height = 24;
        color = '#f97316';
        speedVar = 0;
      } else if (typeRand > 0.4) {
        type = 'taco';
        width = 32; height = 20;
        color = '#fde047';
      } else if (typeRand > 0.25) {
        type = 'bache';
        width = 40 + Math.random() * 20; height = 25 + Math.random() * 10;
        color = '#1c1917';
        speedVar = 0;
      } else {
        type = 'microbus';
        width = 44; height = 80;
        color = '#10b981';
        speedVar = -20;
      }

      // Lane-aware spawning to prevent blockages
      const lanes = [20, 110, 200, 290, 360];
      const laneIndex = Math.floor(Math.random() * lanes.length);
      const laneX = lanes[laneIndex];
      const x = Math.max(15, Math.min(GAME_W - width - 15, laneX + (Math.random() - 0.5) * 40));
      
      // Safety check: don't spawn if another obstacle is too close vertically in the same horizontal vicinity
      const tooClose = obstacles.some(o => 
        o.y < 150 && 
        Math.abs(o.x - x) < 60 &&
        o.type !== 'tree' && o.type !== 'building'
      );
      
      if (tooClose && type !== 'nitro' && type !== 'shield') return;

      obstacles.push({
        id: nextObstacleId++,
        x, y: -height, width, height,
        speed: speedVar, 
        type, color, markedForDeletion: false,
        vx
      });
    };

    const drawPlayer = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number, isBlinking: boolean) => {
      if (isBlinking && Math.floor(performance.now() / 100) % 2 === 0) return;
      
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(tilt);
      const bx = -w/2;
      const by = -h/2;
      
      // Shadow
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowOffsetY = 10;

      if (selectedCarId === 'moto') {
        // High-vis Moto
        ctx.fillStyle = '#111'; // Tires
        ctx.fillRect(bx + w/2 - 4, by, 8, 12);
        ctx.fillRect(bx + w/2 - 4, by + h - 12, 8, 12);
        
        ctx.fillStyle = currentCar.color; // Body
        ctx.beginPath();
        ctx.roundRect(bx + w/2 - 5, by + 10, 10, h - 20, 5);
        ctx.fill();

        // Details
        ctx.fillStyle = '#ff7b00'; // Accents
        ctx.fillRect(bx + w/2 - 3, by + 15, 6, 4);
        
        // Handlebars
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx, by + 20);
        ctx.lineTo(bx + w, by + 20);
        ctx.stroke();
      } else if (selectedCarId === 'truck') {
        ctx.fillStyle = '#1e293b'; // Tires
        ctx.fillRect(bx - 3, by + 10, 4, 15);
        ctx.fillRect(bx + w - 1, by + 10, 4, 15);
        ctx.fillRect(bx - 3, by + h - 25, 4, 15);
        ctx.fillRect(bx + w - 1, by + h - 25, 4, 15);

        ctx.fillStyle = currentCar.color;
        ctx.beginPath(); ctx.roundRect(bx, by, w, h, 4); ctx.fill();
        
        // Cargo bed details
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(bx + 4, by + h/2 - 5, w - 8, h/2);
        
        // Cabin
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 2, by + 5, w - 4, 18);
        ctx.fillStyle = '#334155'; // Window
        ctx.fillRect(bx + 6, by + 8, w - 12, 8);
      } else {
        // Car style (Taxi or Sport)
        ctx.fillStyle = selectedCarId === 'taxi' ? '#fbbf24' : currentCar.color; 
        ctx.beginPath(); ctx.roundRect(bx, by, w, h, 8); ctx.fill();
        
        if (selectedCarId === 'taxi') {
          // Checkered patterns
          ctx.fillStyle = '#000';
          for(let i=0; i<w; i+=8) {
            ctx.fillRect(bx + i, by + h/2 - 4, 4, 4);
            ctx.fillRect(bx + i + 4, by + h/2, 4, 4);
          }
          // TAXI sign
          ctx.fillStyle = '#000';
          ctx.fillRect(bx + w/2 - 8, by + h/2 - 12, 16, 6);
          ctx.fillStyle = '#fff'; ctx.font = 'bold 4px monospace'; ctx.fillText('TAXI', bx + w/2 - 6, by + h/2 - 8);
        } else if (selectedCarId === 'sport') {
          // Racing stripe
          ctx.fillStyle = 'white';
          ctx.fillRect(bx + w/2 - 3, by, 6, h);
          // Spoiler
          ctx.fillStyle = '#444';
          ctx.fillRect(bx - 2, by + h - 6, w + 4, 4);
        }

        // Windshield and windows
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + 4, by + 8, w - 8, 12); // Front
        ctx.fillRect(bx + 2, by + 25, 3, 15); // Side L
        ctx.fillRect(bx + w - 5, by + 25, 3, 15); // Side R
      }

      // Shield effect
      if (shieldTimer > 0) {
        ctx.strokeStyle = `rgba(129, 140, 248, ${0.5 + Math.sin(Date.now()/100)*0.2})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(w, h)/2 + 5, 0, Math.PI*2);
        ctx.stroke();
      }

      // Nitro flames
      if (nitroTimer > 0) {
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(bx + 5, by + h, 10, 20 * Math.random());
        ctx.fillRect(bx + w - 15, by + h, 10, 20 * Math.random());
      }
      
      ctx.restore();
    };

    const drawOil = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, obs.height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/3, obs.y + obs.height/3, obs.width/6, obs.height/6, 0.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawCone = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width/2, obs.y);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
      ctx.lineTo(obs.x, obs.y + obs.height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'white';
      ctx.fillRect(obs.x + obs.width/4, obs.y + obs.height/2, obs.width/2, obs.height/4);
    };

    const drawTree = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#422006';
      ctx.fillRect(obs.x + obs.width/2 - 4, obs.y + obs.height/2, 8, obs.height/2);
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(obs.x + obs.width/2, obs.y + obs.height/4, obs.width/2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBuilding = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#334155';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      ctx.fillStyle = '#f8fafc';
      for(let iy=0; iy<obs.height; iy+=20) {
        for(let ix=0; ix<obs.width; ix+=15) {
          if (Math.random() > 0.3) ctx.fillRect(obs.x + ix + 4, obs.y + iy + 4, 6, 8);
        }
      }
    };

    const drawEnemy = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      const bx = obs.x; const by = obs.y; const w = obs.width; const h = obs.height;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx + 4, by + 4, w, h);
      ctx.fillStyle = '#450a0a'; ctx.beginPath(); ctx.roundRect(bx, by, w, h, 6); ctx.fill();
      // Police or bad car details
      ctx.fillStyle = '#fef08a'; ctx.fillRect(bx+2, by+2, 8, 4); ctx.fillRect(bx+w-10, by+2, 8, 4);
      // Siren
      ctx.fillStyle = Math.floor(Date.now()/100) % 2 === 0 ? '#ef4444' : '#3b82f6';
      ctx.fillRect(bx + w/2 - 6, by + h/2 - 4, 12, 8);
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
       const bx = obs.x; const by = obs.y; const w = obs.width; const h = obs.height;
       ctx.save();
       ctx.translate(bx + w/2, by + h/2);
       ctx.scale(1 + Math.sin(Date.now()/200)*0.1, 1 + Math.sin(Date.now()/200)*0.1);
       ctx.rotate(Date.now()/1000);
       
       ctx.fillStyle = obs.type === 'shield' ? '#818cf8' : '#3b82f6';
       if (obs.type === 'shield') {
          ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill();
          ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
       } else {
          ctx.beginPath(); ctx.moveTo(0, -h/2); ctx.lineTo(w/2, h/2); ctx.lineTo(-w/2, h/2); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.stroke();
       }
       ctx.restore();
    };

    const drawMicrobus = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      const bx = obs.x;
      const by = obs.y;
      const w = obs.width;
      const h = obs.height;
      
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(bx + 4, by + 4, w, h);
      
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath(); ctx.roundRect(bx, by, w, 20, [4, 4, 0, 0]); ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.roundRect(bx, by + 20, w, h - 20, [0, 0, 4, 4]); ctx.fill();
      
      // Wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(bx - 3, by + 20, 3, 15);
      ctx.fillRect(bx + w, by + 20, 3, 15);
      ctx.fillRect(bx - 3, by + h - 25, 3, 15);
      ctx.fillRect(bx + w, by + h - 25, 3, 15);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx + 3, by + 6, w - 6, 12); 
      ctx.fillRect(bx + 3, by + 25, 10, 14);
      ctx.fillRect(bx + w - 13, by + 25, 10, 14);
      ctx.fillRect(bx + 3, by + 45, 10, 14);
      ctx.fillRect(bx + w - 13, by + 45, 10, 14);
    };

    const drawTaco = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      const bx = obs.x;
      const by = obs.y;
      const w = obs.width;
      const h = obs.height;
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(bx + w/2, by + h, w/2, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(bx + 4, by + h - 6, w - 8, 4);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(bx + 6, by + h - 8, 4, 2);
      ctx.fillRect(bx + w - 10, by + h - 8, 4, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 10, by + h - 9, 3, 2);
    };

    const drawBache = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, obs.height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/2 - 2, obs.y + obs.height/2 + 1, obs.width/2 - 4, obs.height/2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMsg = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.fillStyle = '#25D366';
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width - 8, obs.y + obs.height);
      ctx.lineTo(obs.x + obs.width + 6, obs.y + obs.height + 6);
      ctx.lineTo(obs.x + obs.width - 2, obs.y + obs.height - 8);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('Jefe:', obs.x + 6, obs.y + 12);
      ctx.font = '8px monospace';
      ctx.fillText('Urgent!!', obs.x + 6, obs.y + 22);
    };

    const loop = (timestamp: number) => {
      if (isGameOver) return;
      if (isPausedGlobal || pausedRef.current) {
        if (!isPausedGlobal && countdownTimer > 0) {
           countdownTimer -= (timestamp - lastTime) / 1000;
           if (countdownTimer <= 0) {
             pausedRef.current = false;
           }
        }
        lastTime = timestamp;
        
        // Draw Pause Screen partial
        ctx.fillStyle = 'rgba(0,0,0,0.02)';
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        
        animFrame = requestAnimationFrame(loop);
        return;
      }
      
      const dt = Math.min((timestamp - lastTime) / 1000, 0.05); 
      lastTime = timestamp;
      const normalDt = dt * 60; // normalized delta

      // Logic Updates
      dayNightCycle = (dayNightCycle + dt * 0.01) % 1;

      if (slowMoTimer > 0) {
        slowMoTimer -= dt;
        speedMultiplier = 0.5;
      } else if (nitroTimer > 0) {
        nitroTimer -= dt;
        speedMultiplier = 2.2;
        currentScore += dt * 800;
      } else {
        speedMultiplier = 1 + Math.floor(currentScore / 1000) * 0.12;
      }

      if (shieldTimer > 0) shieldTimer -= dt;

      const currentRoadSpeed = baseRoadSpeed * speedMultiplier;
      roadOffset = (roadOffset + currentRoadSpeed * dt) % 100;

      if (damageTimer > 0) damageTimer -= dt;

      const handling = currentCar.handling * (nitroTimer > 0 ? 0.6 : 1);
      const moveSpeed = player.speed * (slowMoTimer > 0 ? 0.7 : 1);
      
      if (keys.ArrowLeft || keys.a || keysGamepad.current.left) player.targetX -= moveSpeed * handling * dt;
      if (keys.ArrowRight || keys.d || keysGamepad.current.right) player.targetX += moveSpeed * handling * dt;
      
      player.targetX = Math.max(14, Math.min(GAME_W - player.width - 14, player.targetX));

      // Improved Lerp for smoother lateral movement
      const diff = player.targetX - player.x;
      const followFactor = 10; 
      const lerpStep = diff * (1 - Math.pow(1 - 0.25, normalDt));
      player.x += lerpStep;
      
      // Dynamic tilt
      player.tilt = (lerpStep / (normalDt * 4)) * 0.5;
      player.tilt = Math.max(-0.2, Math.min(0.2, player.tilt));

      if (isRaining) {
        rainDrops.forEach(drop => {
          drop.y += drop.s * (speedMultiplier * 2.5) * normalDt;
          if (drop.y > GAME_H) {
            drop.y = -drop.l;
            drop.x = Math.random() * GAME_W;
          }
        });
      }

      // Spawning
      timeSinceLastSpawn += dt;
      const spawnInterval = Math.max(0.3, 1.8 / speedMultiplier);
      if (timeSinceLastSpawn > spawnInterval) {
        spawnObstacle();
        
        // Spawn side decorations
        if (Math.random() > 0.5) {
           const type: ObstacleType = Math.random() > 0.5 ? 'tree' : 'building';
           const side = Math.random() > 0.5 ? -40 : GAME_W + 10;
           obstacles.push({
             id: nextObstacleId++,
             x: side, y: -100,
             width: 40 + Math.random() * 60,
             height: 60 + Math.random() * 100,
             speed: 0,
             type, color: '#000',
             markedForDeletion: false
           });
        }
        timeSinceLastSpawn = 0;
      }

      currentScore += dt * 100 * (slowMoTimer > 0 ? 2 : 1); // 2x points in slomo

      // Obstacles update & collide
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += (currentRoadSpeed + (obs.speed * speedMultiplier)) * dt;
        
        if (obs.type === 'enemy') {
           // Aggressive AI: move towards player
           const targetVX = player.x < obs.x ? -100 : 100;
           obs.vx = (obs.vx || 0) * 0.95 + targetVX * 0.05; 
           obs.x += (obs.vx || 0) * dt;
           if (obs.x < 15 || obs.x > GAME_W - obs.width - 15) obs.vx *= -1;
        }

        if (obs.y > GAME_H) {
          obs.markedForDeletion = true;
        }

        // Collision
        const hitPad = obs.type === 'bache' ? 10 : 4;
        if (!obs.markedForDeletion && damageTimer <= 0 &&
            player.x < obs.x + obs.width - hitPad &&
            player.x + player.width > obs.x + hitPad &&
            player.y < obs.y + obs.height - hitPad &&
            player.y + player.height > obs.y + hitPad) {
           
           if (obs.type === 'taco') {
              playSound('powerup');
              currentScore += 500;
              slowMoTimer = 3.0; // 3 seconds slomo
              if (currentHp < currentCar.maxHp) currentHp++;
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 10, ['#fde047', '#22c55e', '#ffffff']);
              obs.markedForDeletion = true;
           } else if (obs.type === 'shield') {
              playSound('powerup');
              shieldTimer = 5.0;
              obs.markedForDeletion = true;
           } else if (obs.type === 'nitro') {
              playSound('start');
              nitroTimer = 2.0;
              shakeTime = 0.5;
              shakeMag = 5;
              obs.markedForDeletion = true;
           } else if (shieldTimer > 0) {
              // Absorbed by shield
              shieldTimer = 0;
              shakeTime = 0.2;
              shakeMag = 5;
              obs.markedForDeletion = true;
              playSound('click');
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 10, ['#818cf8', '#ffffff']);
           } else if (obs.type === 'oil') {
              // Slippery! Temporary handling reduction
              playSound('hover');
              const prevHandling = currentCar.handling;
              // Reduce handling significantly for 1s
              currentCar.handling *= 0.3;
              setTimeout(() => { if (currentCar) currentCar.handling = prevHandling; }, 1000);
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 5, ['#000']);
              obs.markedForDeletion = true;
           } else if (nitroTimer > 0 && (obs.type !== 'bache' && obs.type !== 'tree' && obs.type !== 'building')) {
              // Destroy obstacle while in nitro
              obs.markedForDeletion = true;
              currentScore += 1000;
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 20, explosionColors);
              playSound('score');
           } else {
              if (obs.type === 'tree' || obs.type === 'building') return; // Side decos don't collide normally like this
              // Hit obstacle
              shakeTime = 0.3;
              shakeMag = (obs.type === 'bache' || obs.type === 'cone') ? 5 : 15;
              damageTimer = 1.0; // 1s invuln
              currentHp -= (obs.type === 'bache' || obs.type === 'cone' ? 1 : 2);
              
              if (obs.type !== 'bache') obs.markedForDeletion = true;
              
              spawnParticles(player.x + player.width/2, player.y, 15, explosionColors);
              playSound(currentHp <= 0 ? 'lose' : 'alert');

              if (currentHp <= 0) {
                 isGameOver = true;
              }
           }
        }
      }

      // Cleanup
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].markedForDeletion) obstacles.splice(i, 1);
      }

      // Particles update
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life += dt;
        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      // Sync state sparingly
      const newScore = Math.floor(currentScore);
      if (newScore !== lastRenderedScore) {
         lastRenderedScore = newScore;
         if (scoreRefDOM.current) scoreRefDOM.current.innerText = newScore.toString();
      }
      if (currentHp !== lastRenderedHp) {
         lastRenderedHp = currentHp;
         setHp(currentHp);
      }

      if (isGameOver) {
         setScore(newScore); // Only sync react state exactly when game ends
         setGameOver(true);
         setIsPlaying(false);
         return; // STOP!
      }

      // DRAW PHASE
      ctx.save();
      
      // Sky/Env color
      const skyAngle = (dayNightCycle * Math.PI * 2);
      const isNight = Math.sin(skyAngle) < 0;
      const asphaltColor = isNight ? '#18181b' : '#3f3f46';
      
      ctx.fillStyle = asphaltColor; // Asphalt
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Screenshake
      if (shakeTime > 0) {
        shakeTime -= dt;
        const sx = (Math.random() - 0.5) * shakeMag;
        const sy = (Math.random() - 0.5) * shakeMag;
        ctx.translate(sx, sy);
      }

      // Road lines
      ctx.fillStyle = isNight ? '#a16207' : '#f59e0b';
      for (let i = 0; i < 7; i++) {
        const lineY = ((roadOffset + (i * 100)) % GAME_H) - 100;
        ctx.fillRect(GAME_W / 2 - 4, lineY, 8, 50);
      }
      
      ctx.fillStyle = isNight ? '#71717a' : '#cbd5e1';
      ctx.fillRect(8, 0, 6, GAME_H);
      ctx.fillRect(GAME_W - 14, 0, 6, GAME_H);

      // Draw obstacles
      for (const obs of obstacles) {
        if (obs.type === 'microbus') drawMicrobus(ctx, obs);
        else if (obs.type === 'msg') drawMsg(ctx, obs);
        else if (obs.type === 'taco') drawTaco(ctx, obs);
        else if (obs.type === 'bache') drawBache(ctx, obs);
        else if (obs.type === 'enemy') drawEnemy(ctx, obs);
        else if (obs.type === 'oil') drawOil(ctx, obs);
        else if (obs.type === 'cone') drawCone(ctx, obs);
        else if (obs.type === 'tree') drawTree(ctx, obs);
        else if (obs.type === 'building') drawBuilding(ctx, obs);
        else if (obs.type === 'shield' || obs.type === 'nitro') drawPowerup(ctx, obs);
      }

      // Draw Player
      drawPlayer(ctx, player.x, player.y, player.width, player.height, player.tilt, damageTimer > 0);

      // Draw Particles
      for (const p of particles) {
        const alpha = 1 - (p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Rain
      if (isRaining) {
        ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        rainDrops.forEach(drop => {
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + 2, drop.y + drop.l);
        });
        ctx.stroke();
      }

      // Darkness overlay
      const nightAlpha = isNight ? Math.abs(Math.sin(skyAngle)) * 0.5 : 0;
      if (nightAlpha > 0) {
        ctx.fillStyle = `rgba(0, 0, 20, ${nightAlpha})`;
        ctx.fillRect(0, 0, GAME_W, GAME_H);
        
        // Headlights glow
        ctx.save();
        ctx.translate(player.x + player.width/2, player.y);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, -20, 150);
        grad.addColorStop(0, 'rgba(254, 240, 138, 0.4)');
        grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(60, -180);
        ctx.lineTo(-60, -180);
        ctx.fill();
        ctx.restore();
      }

      // Slomo/Nitro overlay
      if (slowMoTimer > 0) {
         ctx.fillStyle = 'rgba(253, 224, 71, 0.1)';
         ctx.fillRect(0, 0, GAME_W, GAME_H);
      }
      if (nitroTimer > 0) {
         ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
         ctx.fillRect(0, 0, GAME_W, GAME_H);
      }

      // Env Indicator
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(GAME_W - 80, 10, 70, 20);
      ctx.fillStyle = 'white';
      ctx.font = '8px monospace';
      ctx.fillText(isNight ? t('game.env.night') : 'DAY', GAME_W - 75, 23);
      if (isRaining) ctx.fillText('🌧️', GAME_W - 30, 23);

      ctx.restore();

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);

    const onBlur = () => { pausedRef.current = true; };
    window.addEventListener('blur', onBlur);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('blur', onBlur);
    };
  }, [isPlaying, playSound, isPausedGlobal]);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-mono text-white p-2 relative bg-[#0a0a0a] rounded-xl flex-grow overflow-hidden border-2 border-zinc-800 [&.is-fullscreen]:bg-black [&.is-fullscreen]:border-none [&.is-fullscreen]:rounded-none">
      <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-50 transition-opacity opacity-20 hover:opacity-100" />
      
      <div className="flex justify-between items-center w-full max-w-lg mb-2 px-4 py-2 text-xs text-orange-400 font-bold bg-[#111] rounded-t-xl border-x-4 border-t-4 border-zinc-800 shadow-lg shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => { playSound('hover'); setShowMobileControls(prev => !prev); }} 
              className={`flex items-center gap-1 uppercase text-[8px] font-bold border px-1.5 py-1 transition-all ${showMobileControls ? 'bg-orange-500/10 border-orange-500 text-orange-400' : 'text-zinc-600 border-zinc-800 hover:border-zinc-500'}`}
            >
              <Zap className="w-3 h-3" /> {showMobileControls ? 'CONTROLS ON' : 'OFF'}
            </button>
            <span className="flex items-center gap-2">
               <button 
                 onClick={() => { pausedRef.current = !pausedRef.current; playSound('click'); }}
                 className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
               >
                 <TerminalSquare size={16} />
               </button>
               <span>{t('game.race.score')}<span ref={scoreRefDOM}>{score}</span></span>
               {hp > 0 && Array.from({length: hp}).map((_, i) => <Heart key={i} size={12} className="text-red-500 fill-red-500" />)}
            </span>
         </div>
         <span className="flex items-center gap-1 opacity-50"><TerminalSquare size={14} /> {t('arc.game7')}</span>
      </div>

      <div className="relative border-4 border-zinc-800 rounded-b-xl shadow-2xl bg-[#27272a] overflow-hidden w-full max-w-lg flex-grow h-full max-h-[800px] touch-none">
        
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

        <AnimatePresence>
          {(isPlaying && (isPausedGlobal || pausedRef.current)) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center flex-col gap-6"
            >
              <div className="text-white font-black text-4xl uppercase tracking-tighter flex items-center gap-4">
                <TerminalSquare className="w-10 h-10 animate-pulse text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
                {isPausedGlobal ? 'SYSTEM PAUSE' : 'GAME PAUSED'}
              </div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
                {isPausedGlobal ? t('game.paused.system', 'The game is paused due to a system interruption.') : t('game.paused.manual', 'Press the button or take a breath to resume.')}
              </p>
              {!isPausedGlobal && (
                <button
                  onClick={() => { pausedRef.current = false; playSound('start'); }}
                  className="bg-orange-500 text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95"
                >
                  RESUME
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isPlaying && showMobileControls && (
          <>
            <div className="absolute bottom-10 left-4 z-20 pointer-events-none">
              <button 
                onMouseDown={() => { keysGamepad.current.left = true; playSound('click'); }}
                onMouseUp={() => keysGamepad.current.left = false}
                onMouseLeave={() => keysGamepad.current.left = false}
                onTouchStart={(e) => { e.preventDefault(); keysGamepad.current.left = true; playSound('click'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysGamepad.current.left = false; }}
                className="w-24 h-24 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center active:bg-white/20 active:border-white/40 transition-all pointer-events-auto"
              >
                <div className="w-0 h-0 border-t-[15px] border-t-transparent border-r-[25px] border-r-white/30 border-b-[15px] border-b-transparent mr-2" />
              </button>
            </div>
            <div className="absolute bottom-10 right-4 z-20 pointer-events-none">
              <button 
                onMouseDown={() => { keysGamepad.current.right = true; playSound('click'); }}
                onMouseUp={() => keysGamepad.current.right = false}
                onMouseLeave={() => keysGamepad.current.right = false}
                onTouchStart={(e) => { e.preventDefault(); keysGamepad.current.right = true; playSound('click'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysGamepad.current.right = false; }}
                className="w-24 h-24 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center active:bg-white/20 active:border-white/40 transition-all pointer-events-auto"
              >
                <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-white/30 border-b-[15px] border-b-transparent ml-2" />
              </button>
            </div>
          </>
        )}

        {!isPlaying && !gameOver ? (
          <div className="absolute inset-0 flex flex-col bg-[#111]/90 backdrop-blur-md p-4 z-20 overflow-y-auto">
            <div className="flex flex-col items-center mb-4">
              <Car size={32} className="text-orange-500 mb-1" />
              <h3 className="text-xl font-bold text-orange-400 leading-none uppercase tracking-widest">{t('game.arc.race')}</h3>
            </div>

            <p className="text-[10px] text-zinc-500 mb-4 uppercase text-center max-w-[300px] mx-auto">
              {t('game.arc.race.desc')}
            </p>

            <h4 className="text-[10px] text-zinc-400 mb-2 uppercase font-bold text-center tracking-tighter">--- {t('game.race.select_car')} ---</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {cars.map(car => (
                <button
                  key={car.id}
                  onClick={() => setSelectedCarId(car.id)}
                  className={`flex flex-col items-start p-2 border-2 transition-all rounded-lg ${selectedCarId === car.id ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
                >
                  <div className="flex justify-between w-full items-center mb-1">
                    <span className="text-[10px] font-bold uppercase" style={{ color: car.color }}>{car.name}</span>
                    <Car size={14} style={{ color: car.color }} />
                  </div>
                  <p className="text-[8px] text-zinc-500 text-left leading-tight h-6 overflow-hidden">{car.desc}</p>
                  <div className="flex flex-col w-full gap-1 mt-2">
                    <div className="flex items-center gap-1">
                       <span className="text-[6px] text-zinc-600 uppercase w-10">SPEED</span>
                       <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-400" style={{ width: `${(car.speed / 600) * 100}%` }} />
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-[6px] text-zinc-600 uppercase w-10">HANDLING</span>
                       <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400" style={{ width: `${(car.handling / 20) * 100}%` }} />
                       </div>
                    </div>
                    <div className="flex gap-1 mt-1 justify-end">
                      {Array.from({length: car.maxHp}).map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-red-500 rounded-full" />)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center gap-4 mb-6 text-[8px] text-zinc-500 uppercase font-mono bg-black/40 p-2 rounded">
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#10b981] rounded-sm mb-1" />BUS</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#450a0a] rounded-sm mb-1" />POLI</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#818cf8] rounded-full mb-1" />🛡️</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#3b82f6] rounded-full mb-1" />🔥</div>
            </div>

            <button 
              onClick={() => {
                setScore(0);
                setHp(currentCar.maxHp);
                setGameOver(false);
                setIsPlaying(true);
                playSound('start');
              }}
              className="bg-orange-500 text-black w-full py-3 font-black uppercase text-sm hover:bg-orange-400 transition-colors animate-pulse shadow-[0_0_20px_rgba(249,115,22,0.3)] rounded"
            >
              {t('game.insert', 'INSERT COIN')}
            </button>
          </div>
        ) : (
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={600} 
            className="w-full h-full object-contain cursor-none"
          />
        )}

        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <h2 className="text-2xl text-red-500 font-black mb-2 tracking-widest text-center">{t('game.race.crash')}</h2>
            <p className="text-xs text-zinc-300 mb-4 uppercase">{t('game.race.score')}{score}</p>
            <button
               onClick={() => {
                 setScore(0);
                 setHp(currentCar.maxHp);
                 setGameOver(false);
                 setIsPlaying(true);
                 playSound('start');
               }}
               className="bg-zinc-100 text-black px-6 py-2 text-xs font-bold hover:bg-white transition-colors uppercase"
            >
              {t('game.retry', 'RETRY')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
