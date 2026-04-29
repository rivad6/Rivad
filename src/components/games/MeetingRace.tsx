import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Car, Heart, TerminalSquare, Zap, Banknote, Coffee, FileText } from 'lucide-react';
import { FullscreenButton } from '../ui/FullscreenButton';

type ObstacleType = 'microbus' | 'taco' | 'msg' | 'bache' | 'enemy' | 'shield' | 'nitro' | 'oil' | 'cone' | 'tree' | 'building' | 'gas';

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
  const lastKeyTime = useRef(0);

  const cars: CarConfig[] = [
    { id: 'taxi', name: t('game.car.taxi.name'), desc: t('game.car.taxi.desc'), speed: 440, handling: 10, maxHp: 3, color: '#facc15' },
    { id: 'sport', name: t('game.car.sport.name', 'Velocity RS'), desc: t('game.car.sport.desc'), speed: 620, handling: 14, maxHp: 2, color: '#ef4444' },
    { id: 'patrol', name: t('game.car.truck.name', 'Sentinel X'), desc: t('game.car.truck.desc'), speed: 400, handling: 8, maxHp: 6, color: '#1e293b' },
    { id: 'moto', name: t('game.car.moto.name', 'Neon Reaper'), desc: t('game.car.moto.desc'), speed: 580, handling: 20, maxHp: 1, color: '#06b6d4' },
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
  const [gas, setGas] = useState(100);
  const [outOfGas, setOutOfGas] = useState(false);
  const [showStory, setShowStory] = useState(true);
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
    const LANE_COUNT = 6;
    const LANE_WIDTH = GAME_W / LANE_COUNT;
    const LANES = [
      LANE_WIDTH * 0.5,
      LANE_WIDTH * 1.5,
      LANE_WIDTH * 2.5,
      LANE_WIDTH * 3.5,
      LANE_WIDTH * 4.5,
      LANE_WIDTH * 5.5
    ];
    let currentHp = MAX_HP;
    let currentScore = 0;
    let currentDistance = 0;
    const GOAL_DISTANCE = 5000;
    let currentGas = 100;
    const MAX_GAS = 100;
    const GAS_DEPLETION_RATE = (currentCar.speed / 200) + (currentCar.maxHp * 0.5); // Gas drained per second based on stats
    let speedMultiplier = 1;
    let baseRoadSpeed = currentCar.speed; // pixels per second
    let roadOffset = 0;
    
    let lastRenderedScore = -1;
    let lastRenderedHp = -1;
    let lastRenderedDistance = -1;
    let lastRenderedGas = -1;
    
    let nextObstacleId = 0;

    let shakeTime = 0;
    let shakeMag = 0;
    
    let slowMoTimer = 0;
    let damageTimer = 0;
    let shieldTimer = 0;
    let nitroTimer = 0;
    let oilTimer = 0;

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
      laneIndex: 2, // Start middle-ish
      tilt: 0,
      speed: 400,
      vx: 0
    };
    
    const obstacles: Obstacle[] = [];
    const particles: Particle[] = [];
    
    const snapToLane = (lane: number) => {
      const newIndex = Math.max(0, Math.min(LANE_COUNT - 1, lane));
      player.laneIndex = newIndex;
      player.targetX = LANES[newIndex] - player.width / 2;
    };

    const keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
    const KEY_REPEAT_DELAY = 150; // ms between lane shifts if held

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const key = e.key as keyof typeof keys;
      if (keys.hasOwnProperty(key)) {
        if (!keys[key] || currentTime - lastKeyTime.current > KEY_REPEAT_DELAY) {
          if (key === 'ArrowLeft' || key === 'a') {
            snapToLane(player.laneIndex - 1);
            playSound('hover');
          }
          if (key === 'ArrowRight' || key === 'd') {
            snapToLane(player.laneIndex + 1);
            playSound('hover');
          }
          lastKeyTime.current = currentTime;
        }
        keys[key] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key as keyof typeof keys;
      if (keys.hasOwnProperty(key)) {
        keys[key] = false;
        lastKeyTime.current = 0; // Reset repeat timer
      }
    };
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      if (clickX < rect.width / 2) {
         snapToLane(player.laneIndex - 1);
      } else {
         snapToLane(player.laneIndex + 1);
      }
      playSound('hover');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleClick);

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
      const progress = Math.min(1, currentDistance / GOAL_DISTANCE);
      
      let type: ObstacleType = 'microbus';
      let width = 44;
      let height = 80;
      let color = '#10b981';
      let speedVar = 50;
      let vx = 0;
      
      // Progression-based probabilities
      // Items become rarer, enemies and hazards become more frequent over time
      const itemChance = 0.10 + (1 - progress) * 0.20; // 30% to 10%
      const enemyChance = 0.1 + progress * 0.4; // 10% to 50%
      
      if (typeRand < itemChance) {
        // Items: Gas, Nitro, Shield
        const itemRand = Math.random();
        if (itemRand > 0.4) {
          type = 'gas'; width = 24; height = 26; color = '#ef4444';
        } else if (itemRand > 0.2) {
          type = 'nitro'; width = 30; height = 30; color = '#facc15';
        } else {
          type = 'shield'; width = 30; height = 30; color = '#818cf8';
        }
      } else if (typeRand < itemChance + enemyChance) {
        // Enemies
        type = 'enemy'; width = 45; height = 75; color = '#ef4444';
        speedVar = 80 + progress * 100;
        vx = (Math.random() - 0.5) * (100 + progress * 200);
      } else {
        // Hazards
        const hazardRand = Math.random();
        if (hazardRand > 0.8) {
           type = 'microbus'; width = 44; height = 80; color = '#334155'; speedVar = -30;
        } else if (hazardRand > 0.6) {
           type = 'msg'; width = 50; height = 40; color = '#f97316';
        } else if (hazardRand > 0.4) {
           type = 'oil'; width = 50; height = 30; color = '#451a03'; speedVar = 0;
        } else if (hazardRand > 0.2) {
           type = 'cone'; width = 18; height = 24; color = '#f97316'; speedVar = 0;
        } else {
           type = 'bache'; width = 40 + Math.random() * 20; height = 25 + Math.random() * 10; color = '#1c1917'; speedVar = 0;
        }
      }

      // 1. Identify which lanes are currently occupied at the top of the screen
      const spawnCheckDist = 120;
      const occupiedLanes = new Set();
      obstacles.forEach(o => {
        if (o.y < spawnCheckDist) {
          // Find which lane this obstacle occupies
          LANES.forEach((lx, idx) => {
            if (Math.abs(o.x + o.width/2 - lx) < LANE_WIDTH * 0.8) {
              occupiedLanes.add(idx);
            }
          });
        }
      });

      // 2. Select a lane that isn't fully blocked
      const availableLanes = LANES.map((_, i) => i).filter(i => !occupiedLanes.has(i));
      
      // If too many lanes are blocked, don't spawn a hazard, maybe spawn a powerup or nothing
      if (availableLanes.length < 2 && !['shield', 'nitro', 'gas'].includes(type)) {
        return; 
      }

      const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
      if (laneIndex === undefined) return;

      const laneX = LANES[laneIndex];
      const x = Math.max(15, Math.min(GAME_W - width - 15, laneX - width/2));
      
      // Final safety check: proximity
      const tooClose = obstacles.some(o => 
        o.y < 180 && 
        Math.abs(o.x - x) < 50
      );
      
      if (tooClose && type !== 'nitro' && type !== 'shield' && type !== 'gas') return;

      obstacles.push({
        id: nextObstacleId++,
        x, y: -height - 50, width, height,
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
        // Cyberpunk Hyper-Bike
        ctx.fillStyle = '#111'; // Tires
        ctx.fillRect(bx + w/2 - 5, by, 10, 15);
        ctx.fillRect(bx + w/2 - 5, by + h - 15, 10, 15);
        
        ctx.fillStyle = currentCar.color; // Main body
        ctx.beginPath();
        ctx.moveTo(bx + w/2, by + 5);
        ctx.lineTo(bx + w - 4, by + h/2 + 5);
        ctx.lineTo(bx + w/2, by + h - 5);
        ctx.lineTo(bx + 4, by + h/2 + 5);
        ctx.closePath();
        ctx.fill();

        // Neon Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentCar.color;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Rider seat
        ctx.fillStyle = '#222';
        ctx.fillRect(bx + w/2 - 4, by + h/2 - 5, 8, 12);
        
        // Handlebars
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 2, by + h/4 + 10);
        ctx.lineTo(bx + w - 2, by + h/4 + 10);
        ctx.stroke();
      } else if (selectedCarId === 'patrol') {
        // Armored Interceptor
        ctx.fillStyle = '#000'; // Huge tires
        ctx.fillRect(bx - 4, by + 5, 8, 18);
        ctx.fillRect(bx + w - 4, by + 5, 8, 18);
        ctx.fillRect(bx - 4, by + h - 23, 8, 18);
        ctx.fillRect(bx + w - 4, by + h - 23, 8, 18);

        // Body
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(bx, by, w, h, 2); ctx.fill();
        
        // Bull bar
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx - 2, by - 4, w + 4, 6);
        
        // Reinforced roof
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + 3, by + 20, w - 6, h - 40);
        
        // Identity
        ctx.fillStyle = '#fff';
        ctx.font = 'black 10px Arial';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(bx + w/2, by + h/2 + 5);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('X-UNIT', 0, 0);
        ctx.restore();

        // High-intensity light bar
        const isFlicker = Math.floor(Date.now() / 60) % 2 === 0;
        const leftColor = isFlicker ? '#ef4444' : '#000';
        const rightColor = !isFlicker ? '#3b82f6' : '#000';
        
        ctx.fillStyle = leftColor;
        ctx.shadowBlur = isFlicker ? 30 : 0; ctx.shadowColor = '#ef4444';
        ctx.fillRect(bx + 5, by + h/2 - 3, w/2 - 6, 6);
        
        ctx.fillStyle = rightColor;
        ctx.shadowBlur = !isFlicker ? 30 : 0; ctx.shadowColor = '#3b82f6';
        ctx.fillRect(bx + w/2 + 1, by + h/2 - 3, w/2 - 6, 6);
        ctx.shadowBlur = 0;
      } else if (selectedCarId === 'sport') {
        // Velocity RS - Sleek Supercar
        ctx.fillStyle = '#000';
        ctx.fillRect(bx - 2, by + 10, 4, 15);
        ctx.fillRect(bx + w - 2, by + 10, 4, 15);
        ctx.fillRect(bx - 2, by + h - 25, 4, 15);
        ctx.fillRect(bx + w - 2, by + h - 25, 4, 15);

        // Low body
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(bx + 4, by);
        ctx.lineTo(bx + w - 4, by);
        ctx.lineTo(bx + w, by + h - 10);
        ctx.lineTo(bx + w - 5, by + h);
        ctx.lineTo(bx + 5, by + h);
        ctx.lineTo(bx, by + h - 10);
        ctx.closePath();
        ctx.fill();

        // Carbon fiber hood
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(bx + w/2 - 8, by + 5);
        ctx.lineTo(bx + w/2 + 8, by + 5);
        ctx.lineTo(bx + w/2 + 12, by + 25);
        ctx.lineTo(bx + w/2 - 12, by + 25);
        ctx.closePath();
        ctx.fill();

        // Huge spoiler
        ctx.fillStyle = '#111';
        ctx.fillRect(bx - 6, by + h - 8, w + 12, 5);
        ctx.fillStyle = '#333';
        ctx.fillRect(bx - 6, by + h - 10, 2, 8);
        ctx.fillRect(bx + w + 4, by + h - 10, 2, 8);

        // Cockpit
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(bx + 6, by + 28, w - 12, 18, 10);
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Taxi - Urban Shuttle
        ctx.fillStyle = '#fbbf24'; 
        ctx.beginPath(); ctx.roundRect(bx, by, w, h, 6); ctx.fill();
        
        // Checker stripes
        ctx.fillStyle = '#000';
        for(let i=0; i<w; i+=10) {
          ctx.fillRect(bx + i, by + 2, 5, 5);
          ctx.fillRect(bx + i + 5, by + 7, 5, 5);
          ctx.fillRect(bx + i, by + h - 12, 5, 5);
          ctx.fillRect(bx + i + 5, by + h - 7, 5, 5);
        }

        // TAXI roof sign with light
        ctx.fillStyle = '#111';
        ctx.fillRect(bx + w/2 - 12, by + h/2 - 10, 24, 8);
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 6px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('URBAN', bx + w/2, by + h/2 - 4);

        // Windows
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + 4, by + 12, w - 8, 14); // Front
        ctx.fillRect(bx + 3, by + 35, w - 6, 12); // Back
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
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(bx + 6, by + 6, w, h);
      
      // Car Body
      ctx.fillStyle = '#7f1d1d'; // Dark red
      ctx.beginPath(); ctx.roundRect(bx, by, w, h, 8); ctx.fill();
      
      // Windshield
      ctx.fillStyle = '#111827';
      ctx.fillRect(bx + 6, by + 10, w - 12, 15);
      
      // Headlights (Flickering)
      if(Math.floor(Date.now()/100) % 3 === 0) {
        ctx.fillStyle = '#fef08a';
        ctx.shadowBlur = 10; ctx.shadowColor = '#fef08a';
        ctx.fillRect(bx + 5, by + 2, 8, 6);
        ctx.fillRect(bx + w - 13, by + 2, 8, 6);
        ctx.shadowBlur = 0;
      }
      
      // Siren
      ctx.fillStyle = Math.floor(Date.now()/150) % 2 === 0 ? '#ef4444' : '#3b82f6';
      ctx.beginPath(); ctx.arc(bx + w/2, by + h/2, 4, 0, Math.PI*2); ctx.fill();
      
      // Wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(bx - 4, by + 10, 6, 15);
      ctx.fillRect(bx + w - 2, by + 10, 6, 15);
      ctx.fillRect(bx - 4, by + h - 25, 6, 15);
      ctx.fillRect(bx + w - 2, by + h - 25, 6, 15);
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

    const drawGas = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      const bx = obs.x; const by = obs.y; const w = obs.width; const h = obs.height;
      ctx.fillStyle = '#ef4444'; // Red Jerrycan
      ctx.beginPath(); ctx.roundRect(bx, by + 4, w, h - 4, 2); ctx.fill();
      ctx.fillStyle = '#333'; // handle
      ctx.fillRect(bx + w/2 - 4, by, 8, 4);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('G', bx + w/2, by + h/2 + 4);
    };

    let leftPressed = false;
    let rightPressed = false;

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

      // Speed & Handling balance
      const progressScale = Math.min(1, currentScore / 5000);
      speedMultiplier = 1 + progressScale * 0.8;

      if (slowMoTimer > 0) {
        slowMoTimer -= dt;
        speedMultiplier *= 0.5;
      } else if (nitroTimer > 0) {
        nitroTimer -= dt;
        speedMultiplier *= 2.2;
        currentScore += dt * 1200;
      }

      if (oilTimer > 0) {
        oilTimer -= dt;
      }

      if (shieldTimer > 0) shieldTimer -= dt;

      const currentRoadSpeed = baseRoadSpeed * speedMultiplier;
      roadOffset = (roadOffset + currentRoadSpeed * dt) % 100;
      currentDistance += (currentRoadSpeed * dt) / 50; // Distance units

      // Gas Depletion
      currentGas -= GAS_DEPLETION_RATE * dt * (speedMultiplier / 1.5);
      if (currentGas <= 0) {
        setScore(Math.floor(currentScore));
        setOutOfGas(true);
        setGameOver(true);
        setIsPlaying(false);
        playSound('lose');
        return;
      }

      if (damageTimer > 0) damageTimer -= dt;

      // Handling based on 6 Lanes - Snap-based movement
      const currentHandling = oilTimer > 0 ? currentCar.handling * 0.3 : currentCar.handling;
      
      // Removed continuous shift in loop
      
      // Snap laneIndex to nearest for consistency (though handled by event listeners now)
      player.laneIndex = LANES.reduce((prev, curr, idx) => {
        return Math.abs(curr - (player.targetX + player.width/2)) < Math.abs(LANES[prev] - (player.targetX + player.width/2)) ? idx : prev;
      }, 0);
      
      const diff = player.targetX - player.x;
      player.vx = diff * 12 * (oilTimer > 0 ? 0.5 : 1.0); 
      player.x = Math.max(0, Math.min(GAME_W - player.width, player.x + (player.vx * dt)));
      
      // Visual Tilt for "Steering Wheel" effect
      player.tilt = (player.vx / 500) * 0.4;
      player.tilt = Math.max(-0.25, Math.min(0.25, player.tilt));

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
           } else if (obs.type === 'gas') {
              playSound('powerup');
              currentGas = Math.min(MAX_GAS, currentGas + 25);
              currentScore += 100;
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 10, ['#ef4444', '#f87171', '#ffffff']);
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
              playSound('hover');
              oilTimer = 1.5;
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 5, ['#000']);
              obs.markedForDeletion = true;
           } else if (nitroTimer > 0 && (obs.type !== 'bache' && obs.type !== 'tree' && obs.type !== 'building')) {
              // Destroy obstacle while in nitro
              obs.markedForDeletion = true;
              currentScore += 1000;
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 20, explosionColors);
              playSound('score');
           } else {
              // Hit obstacle (Buildings/Trees included, destroyed to clear way)
              shakeTime = 0.3;
              shakeMag = (obs.type === 'bache' || obs.type === 'cone') ? 5 : 15;
              damageTimer = 1.0; 
              
              if (obs.type === 'tree' || obs.type === 'building') {
                currentHp -= 1;
                player.vx *= -0.8; // Bounce side
                obs.markedForDeletion = true; // Clear the obstacle so player isn't stuck
              } else {
                currentHp -= (obs.type === 'bache' || obs.type === 'cone' ? 1 : 2);
              }
              
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
      if (Math.floor(currentGas) !== lastRenderedGas) {
         lastRenderedGas = Math.floor(currentGas);
         setGas(Math.floor(currentGas));
      }
      
      const distPct = Math.min(100, (currentDistance / GOAL_DISTANCE) * 100);
      if (Math.floor(distPct) !== lastRenderedDistance) {
        lastRenderedDistance = Math.floor(distPct);
        // We can use a ref for distance UI if needed, but let's just use the loop logic to check win
      }

      if (currentDistance >= GOAL_DISTANCE) {
        setScore(newScore + currentHp * 1000); // Bonus for HP left
        setGameOver(true);
        setIsPlaying(false);
        playSound('score');
        return;
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

      // Road lines (Lanes)
      ctx.lineWidth = 1;
      for (let l = 1; l < LANE_COUNT; l++) {
        const lx = l * LANE_WIDTH;
        ctx.setLineDash([20, 30]);
        ctx.lineDashOffset = -roadOffset * 2;
        ctx.strokeStyle = l === 3 ? (isNight ? '#facc15' : '#fbbf24') : 'rgba(255,255,255,0.1)';
        if (l === 3) ctx.lineWidth = 4; else ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(lx, 0);
        ctx.lineTo(lx, GAME_H);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      
      // Side markers for speed perception
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      for (let i = -1; i < 12; i++) {
        const markerY = ((roadOffset * 2 + (i * 60)) % (GAME_H + 60)) - 60;
        ctx.fillRect(15, markerY, 5, 2);
        ctx.fillRect(GAME_W - 20, markerY, 5, 2);
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
        else if (obs.type === 'gas') drawGas(ctx, obs);
        else if (obs.type === 'shield' || obs.type === 'nitro') drawPowerup(ctx, obs);
      }

      // Draw Player
      drawPlayer(ctx, player.x, player.y, player.width, player.height, player.tilt, damageTimer > 0);

      // Nitro speed lines
      if (nitroTimer > 0) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 10; i++) {
          const rx = Math.random() * GAME_W;
          const ry = Math.random() * GAME_H;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + 40); ctx.stroke();
        }
      }

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

      // Progress Bar Background
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, 10, GAME_W - 20, 15);
      // Progress Bar Fill
      const progressWidth = ((GAME_W - 20) * (currentDistance / GOAL_DISTANCE));
      const progressGrad = ctx.createLinearGradient(10, 0, GAME_W - 10, 0);
      progressGrad.addColorStop(0, '#f97316');
      progressGrad.addColorStop(1, '#facc15');
      ctx.fillStyle = progressGrad;
      ctx.fillRect(10, 10, progressWidth, 15);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(currentDistance)} / ${GOAL_DISTANCE}m`, GAME_W/2, 21);

      // Fuel Progress Bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(10, 30, GAME_W - 20, 8);
      const gasWidth = ((GAME_W - 20) * (currentGas / MAX_GAS));
      ctx.fillStyle = currentGas < 20 ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#ef4444' : '#fee2e2') : '#3b82f6';
      ctx.fillRect(10, 30, Math.max(0, gasWidth), 8);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${t('game.race.gas', 'FUEL')} ${Math.floor(currentGas)}%`, GAME_W/2, 37);

      // Env Indicator
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(GAME_W - 80, 40, 70, 20);
      ctx.fillStyle = 'white';
      ctx.font = '8px monospace';
      ctx.fillText(isNight ? t('game.env.night') : 'DAY', GAME_W - 75, 53);
      if (isRaining) ctx.fillText('🌧️', GAME_W - 30, 53);

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
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('blur', onBlur);
    };
  }, [isPlaying, playSound, isPausedGlobal]);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-mono text-white p-2 relative bg-[#0a0a0a] rounded-xl flex-grow overflow-hidden border-2 border-zinc-800 [&.is-fullscreen]:bg-black [&.is-fullscreen]:border-none [&.is-fullscreen]:rounded-none">
      <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-50 transition-opacity opacity-20 hover:opacity-100" />
      
      {/* Universal/Manual Pause Overlay */}
      <AnimatePresence>
        {(isPlaying && (isPausedGlobal || pausedRef.current)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2">
               {isPausedGlobal ? (
                 <Zap size={48} className="text-brand-accent animate-pulse" />
               ) : (
                 <TerminalSquare className="w-16 h-16 animate-pulse text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
               )}
               <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                 {isPausedGlobal ? t('game.paused.system', 'RACE SUSPENDED') : 'RACE PAUSED'}
               </h2>
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
              {isPausedGlobal 
                ? t('game.paused.desc', 'Red flag on the track. The race will resume when clear.')
                : t('game.paused.manual', 'Pit stop in progress. Take a breath to resume.')}
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
      
      <div className="flex justify-between items-center w-full max-w-lg mb-2 px-4 py-2 text-xs text-brand-accent font-bold bg-[#111] rounded-t-xl border-x-4 border-t-4 border-brand-accent/50 shadow-lg shrink-0">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => { playSound('hover'); setShowMobileControls(prev => !prev); }} 
              className={`flex items-center gap-1 uppercase text-[8px] font-bold border px-1.5 py-1 transition-all ${showMobileControls ? 'bg-brand-accent/10 border-brand-accent text-brand-accent' : 'text-zinc-600 border-zinc-800 hover:border-zinc-500'}`}
            >
              <Zap className="w-3 h-3" /> {showMobileControls ? 'CONTROLS ON' : 'OFF'}
            </button>
            <span className="flex items-center gap-2">
               <button 
                 onClick={() => { pausedRef.current = !pausedRef.current; playSound('click'); }}
                 className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
               >
                 <Banknote size={16} className="text-green-500 animate-pulse" />
               </button>
               <span className="font-mono text-lg">{t('game.race.score')}<span ref={scoreRefDOM}>{score}</span></span>
               {hp > 0 && Array.from({length: hp}).map((_, i) => <Heart key={i} size={12} className="text-red-500 fill-red-500 animate-pulse" />)}
            </span>
         </div>
         <span className="flex items-center gap-1 opacity-50"><TerminalSquare size={14} /> {t('arc.game7')}</span>
      </div>

      <div className="relative border-4 border-brand-accent/50 rounded-b-xl shadow-2xl bg-[#27272a] overflow-hidden w-full max-w-lg flex-grow h-full max-h-[800px] touch-none">
        
        {/* STORY COMIC OVERLAY */}
        <AnimatePresence>
          {showStory && !isPlaying && !gameOver && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-[60] bg-black flex flex-col justify-center items-center p-6 border-4 border-white"
             >
               <h1 className="text-3xl font-black text-white text-center mb-6 tracking-widest">{t('game.arc.race', 'PAY DAY RACE')}</h1>
               
               <div className="flex flex-col gap-4 mb-8 w-full">
                 <div className="bg-zinc-900 border-2 border-white p-4">
                   <p className="font-mono text-zinc-300 text-sm">{t('game.race.story.1', 'FRIDAY, 4:45 PM. RENT IS DUE.')}</p>
                 </div>
                 <div className="bg-zinc-900 border-2 border-red-500 p-4 transform rotate-1">
                   <p className="font-mono text-red-500 font-bold text-sm">{t('game.race.story.2', 'THE BANK CLOSES AT 5:00 PM.')}</p>
                 </div>
                 <div className="bg-zinc-900 border-2 border-orange-500 p-4 transform -rotate-1">
                   <p className="font-mono text-orange-400 font-bold max-w-[200px] mx-auto text-center leading-tight">{t('game.race.story.3', 'IF I DON\'T MAKE IT, I\'M SLEEPING ON THE STREET!')}</p>
                 </div>
               </div>
               
               <button 
                 onClick={() => setShowStory(false)}
                 className="bg-white text-black font-black px-8 py-3 uppercase text-lg hover:bg-orange-500 transition-colors shadow-[4px_4px_0_0_rgba(249,115,22,1)]"
               >
                 {t('game.race.story.start', 'START ENGINE')}
               </button>
             </motion.div>
          )}
        </AnimatePresence>

        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

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

        {!isPlaying && !gameOver && !showStory ? (
          <div className="absolute inset-0 flex flex-col bg-[#111]/90 backdrop-blur-md p-4 z-20 overflow-y-auto">
            <div className="flex flex-col items-center mb-4">
              <Car size={32} className="text-orange-500 mb-1" />
              <h3 className="text-xl font-bold text-brand-accent leading-none uppercase tracking-widest">{t('game.arc.race')}</h3>
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
                  className={`flex flex-col items-start p-2 border-2 transition-all rounded-lg ${selectedCarId === car.id ? 'border-brand-accent bg-brand-accent/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}
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
                          <div className="h-full bg-orange-400" style={{ width: `${(car.speed / 700) * 100}%` }} />
                       </div>
                    </div>
                    <div className="flex items-center gap-1">
                       <span className="text-[6px] text-zinc-600 uppercase w-10">HANDLING</span>
                       <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400" style={{ width: `${(car.handling / 25) * 100}%` }} />
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
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#ef4444] rounded-sm mb-1" />{t('game.race.gas', 'GAS')}</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#818cf8] rounded-full mb-1" />🛡️</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#3b82f6] rounded-full mb-1" />🔥</div>
            </div>

            <button 
              onClick={() => {
                setScore(0);
                setHp(currentCar.maxHp);
                setGas(100);
                setOutOfGas(false);
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
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md"
          >
             {outOfGas ? (
              <>
                <Coffee size={48} className="text-orange-500 mb-4" />
                <h2 className="text-3xl text-orange-500 font-black mb-2 tracking-widest text-center uppercase">{t('game.race.out_of_gas', 'OUT OF GAS!')}</h2>
                <p className="text-sm text-zinc-300 mb-6 uppercase text-center max-w-xs">{t('game.race.out_of_gas_desc', 'You ran out of fuel.')}</p>
              </>
            ) : hp > 0 ? (
              <>
                <Zap size={48} className="text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-3xl text-yellow-400 font-black mb-2 tracking-widest text-center uppercase">{t('game.race.win_title', 'ON TIME!')}</h2>
                <p className="text-sm text-zinc-300 mb-6 uppercase text-center max-w-xs">{t('game.race.win_desc', 'You dodged the bills and traffic just in time.')}</p>
              </>
            ) : (
              <>
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-3xl text-red-500 font-black mb-2 tracking-widest text-center uppercase">{t('game.race.crash')}</h2>
                <p className="text-sm text-zinc-300 mb-6 uppercase">{t('game.race.collision_desc', 'Debt collectors caught up with you.')}</p>
              </>
            )}
            
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl mb-8 w-64 text-center">
              <p className="text-[10px] text-zinc-500 uppercase mb-1">{t('game.race.score')}</p>
              <p className="text-4xl font-black text-white tracking-tight">{score.toLocaleString()}</p>
            </div>

            <div className="flex gap-4">
              <button
                 onClick={() => {
                   setScore(0);
                   setHp(currentCar.maxHp);
                   setGas(100);
                   setOutOfGas(false);
                   setGameOver(false);
                   setIsPlaying(true);
                   playSound('start');
                 }}
                 className="bg-orange-500 text-black px-8 py-3 text-sm font-black hover:bg-orange-400 transition-all uppercase rounded-full glow-orange shadow-lg active:scale-95"
              >
                {t('game.retry', 'PLAY AGAIN')}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
