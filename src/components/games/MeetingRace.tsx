import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Car, Heart, TerminalSquare, Zap, Banknote, Coffee, FileText, Shield } from 'lucide-react';
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

export function MeetingRace({ 
  isPausedGlobal = false, 
  hideFullscreenButton = false,
  onFinish
}: { 
  isPausedGlobal?: boolean, 
  hideFullscreenButton?: boolean,
  onFinish?: () => void 
}) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState('taxi');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const cars: CarConfig[] = [
    { id: 'taxi', name: t('game.car.taxi.name'), desc: t('game.car.taxi.desc'), speed: 440, handling: 10, maxHp: 3, color: '#ec4899' },
    { id: 'sport', name: t('game.car.sport.name'), desc: t('game.car.sport.desc'), speed: 620, handling: 14, maxHp: 2, color: '#ef4444' },
    { id: 'truck', name: t('game.car.truck.name'), desc: t('game.car.truck.desc'), speed: 400, handling: 8, maxHp: 6, color: '#1e293b' },
    { id: 'moto', name: t('game.car.moto.name'), desc: t('game.car.moto.desc'), speed: 580, handling: 20, maxHp: 1, color: '#06b6d4' },
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
  const [isPaused, setIsPaused] = useState(false);
  const scoreRefDOM = useRef<HTMLSpanElement>(null);
  const keysGamepad = useRef({ left: false, right: false });
  const pausedRef = useRef({ local: false, global: false });

  useEffect(() => {
    pausedRef.current = { local: isPaused, global: isPausedGlobal };
  }, [isPaused, isPausedGlobal]);

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
    const GAS_DEPLETION_RATE = ((currentCar.speed / 200) + (currentCar.maxHp * 0.5)) / 2; // Gas drained per second based on stats
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
      const itemChance = 0.20 + (1 - progress) * 0.30; // 50% to 20%
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
        // Underglow
        ctx.shadowBlur = 15;
        ctx.shadowColor = currentCar.color;
        ctx.fillStyle = currentCar.color;
        ctx.fillRect(bx + w/2 - 2, by + 10, 4, h - 20);
        ctx.shadowBlur = 0;

        // Tires
        ctx.fillStyle = '#0f172a'; // Tires
        ctx.beginPath();
        ctx.roundRect(bx + w/2 - 4, by - 4, 8, 16, 2); // Front
        ctx.roundRect(bx + w/2 - 5, by + h - 16, 10, 18, 2); // Back
        ctx.fill();
        
        // Chassis / Engine block
        ctx.fillStyle = '#334155';
        ctx.fillRect(bx + w/2 - 6, by + 10, 12, h - 20);
        
        ctx.fillStyle = currentCar.color; // Main body cowling
        ctx.beginPath();
        ctx.moveTo(bx + w/2, by + 4);
        ctx.lineTo(bx + w - 2, by + h/2);
        ctx.lineTo(bx + w/2 + 2, by + h - 10);
        ctx.lineTo(bx + w/2 - 2, by + h - 10);
        ctx.lineTo(bx + 2, by + h/2);
        ctx.closePath();
        ctx.fill();

        // Neon Accents
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Rider seat & Rider
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(bx + w/2 - 5, by + h/2 - 4, 10, 14);
        
        // Handlebars
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 1, by + h/4 + 6);
        ctx.lineTo(bx + w/2, by + h/4 + 2);
        ctx.lineTo(bx + w - 1, by + h/4 + 6);
        ctx.stroke();

        // Windshield
        ctx.fillStyle = '#38bdf8';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx + w/2, by - 2);
        ctx.lineTo(bx + w/2 + 4, by + 8);
        ctx.lineTo(bx + w/2 - 4, by + 8);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        
      } else if (selectedCarId === 'truck') {
        // Armored Bus / Pesero
        ctx.fillStyle = '#1e293b'; // Tires
        ctx.beginPath(); ctx.roundRect(bx - 4, by + 5, 8, 20, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(bx + w - 4, by + 5, 8, 20, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(bx - 4, by + h - 25, 8, 24, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(bx + w - 4, by + h - 25, 8, 24, 2); ctx.fill();

        // Main Heavy Body (slate 800)
        ctx.fillStyle = '#1e293b';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#000';
        ctx.beginPath(); ctx.roundRect(bx, by - 6, w, h + 12, 4); ctx.fill();
        ctx.shadowBlur = 0;
        
        // Body details (painted side stripes)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx + 2, by + 10, w - 4, h - 16);
        ctx.strokeStyle = '#2dd4bf'; // Teal accents common on peseros
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + 4, by + 20); ctx.lineTo(bx + w - 4, by + 20);
        ctx.moveTo(bx + 4, by + h - 25); ctx.lineTo(bx + w - 4, by + h - 25);
        ctx.stroke();

        // Bull bar / Defensas gigantes
        ctx.fillStyle = '#64748b';
        ctx.fillRect(bx - 4, by - 10, w + 8, 8);
        ctx.fillRect(bx + 4, by - 12, w - 8, 4);
        
        // Roof
        ctx.fillStyle = '#cbd5e1'; // White/gray roof
        ctx.beginPath(); ctx.roundRect(bx + 4, by + 18, w - 8, h - 35, 2); ctx.fill();
        
        // Vents
        ctx.fillStyle = '#000';
        ctx.fillRect(bx + 8, by + 30, w - 16, 10);
        ctx.fillRect(bx + 8, by + 50, w - 16, 10);

        // Windows (tinted black)
        ctx.fillStyle = '#000';
        ctx.fillRect(bx + 5, by + 8, w - 10, 8); // windshield
        ctx.fillRect(bx + 5, by + h - 20, w - 10, 6); // back

        // Identity
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(bx + w/2, by + h/2 + 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('RUTA 66', 0, 0);
        ctx.restore();

        // Caution lights instead of police lights
        const isFlicker = Math.floor(Date.now() / 200) % 2 === 0;
        
        ctx.fillStyle = isFlicker ? '#f59e0b' : '#b45309';
        ctx.shadowBlur = isFlicker ? 15 : 2; ctx.shadowColor = '#f59e0b';
        ctx.fillRect(bx + 4, by - 8, w/4, 4);
        ctx.fillRect(bx + w - 4 - w/4, by - 8, w/4, 4);
        ctx.shadowBlur = 0;
      } else if (selectedCarId === 'sport') {
        // Velocity RS - Sleek Supercar
        // Wide racing tires
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(bx - 2, by + 8, 5, 16, 2);
        ctx.roundRect(bx + w - 3, by + 8, 5, 16, 2);
        ctx.roundRect(bx - 3, by + h - 26, 6, 18, 2);
        ctx.roundRect(bx + w - 3, by + h - 26, 6, 18, 2);
        ctx.fill();

        // Underglow neon
        ctx.shadowBlur = 10;
        ctx.shadowColor = currentCar.color;
        ctx.fillStyle = currentCar.color;
        ctx.fillRect(bx + 2, by + 10, w - 4, h - 20);
        ctx.shadowBlur = 0;

        // Aerodynamic wide body
        ctx.fillStyle = currentCar.color;
        ctx.beginPath();
        ctx.moveTo(bx + 6, by);
        ctx.lineTo(bx + w - 6, by);
        ctx.lineTo(bx + w - 2, by + h/3);
        ctx.lineTo(bx + w, by + h - 12);
        ctx.lineTo(bx + w - 4, by + h);
        ctx.lineTo(bx + 4, by + h);
        ctx.lineTo(bx, by + h - 12);
        ctx.lineTo(bx + 2, by + h/3);
        ctx.closePath();
        ctx.fill();

        // Racing stripes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(bx + w/2 - 4, by + 2, 3, h - 4);
        ctx.fillRect(bx + w/2 + 1, by + 2, 3, h - 4);

        // Carbon fiber hood vents
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(bx + w/2 - 8, by + 8);
        ctx.lineTo(bx + w/2 + 8, by + 8);
        ctx.lineTo(bx + w/2 + 14, by + 22);
        ctx.lineTo(bx + w/2 - 14, by + 22);
        ctx.closePath();
        ctx.fill();

        // Huge spoiler
        ctx.fillStyle = '#020617'; // Carbon fiber color
        ctx.beginPath(); ctx.roundRect(bx - 6, by + h - 10, w + 12, 6, 2); ctx.fill();
        ctx.fillStyle = currentCar.color; // Spoiler mounts
        ctx.fillRect(bx + w/4, by + h - 14, 2, 6);
        ctx.fillRect(bx + w*3/4 - 2, by + h - 14, 2, 6);

        // Cockpit (tinted aerodynamic glass)
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.moveTo(bx + w/2 - 10, by + 28);
        ctx.lineTo(bx + w/2 + 10, by + 28);
        ctx.lineTo(bx + w/2 + 12, by + 46);
        ctx.lineTo(bx + w/2 - 12, by + 46);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#fef08a';
        ctx.beginPath(); ctx.roundRect(bx + 6, by + 2, 6, 3, 1); ctx.fill();
        ctx.beginPath(); ctx.roundRect(bx + w - 12, by + 2, 6, 3, 1); ctx.fill();
        ctx.shadowBlur = 0;

      } else {
        // Taxi - Classic Cab
        // Tires
        ctx.fillStyle = '#111';
        ctx.fillRect(bx - 2, by + 8, 4, 14);
        ctx.fillRect(bx + w - 2, by + 8, 4, 14);
        ctx.fillRect(bx - 2, by + h - 22, 4, 14);
        ctx.fillRect(bx + w - 2, by + h - 22, 4, 14);

        // Main body paint (Yellow or Pink)
        ctx.fillStyle = currentCar.color; 
        ctx.beginPath(); ctx.roundRect(bx, by, w, h, 6); ctx.fill();
        
        // Checkered pattern on sides (Classic taxi element)
        ctx.fillStyle = '#000';
        for(let i=0; i<6; i++) {
          if (i%2===0) {
             ctx.fillRect(bx, by + 15 + i*6, 3, 6);
             ctx.fillRect(bx + w - 3, by + 15 + i*6, 3, 6);
          } else {
             ctx.fillStyle = '#fff';
             ctx.fillRect(bx, by + 15 + i*6, 3, 6);
             ctx.fillRect(bx + w - 3, by + 15 + i*6, 3, 6);
             ctx.fillStyle = '#000';
          }
        }

        // Roof light
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.roundRect(bx + w/2 - 12, by + h/2 - 12, 24, 10, 2); ctx.fill();
        
        ctx.fillStyle = '#facc15';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#facc15';
        ctx.beginPath(); ctx.roundRect(bx + w/2 - 10, by + h/2 - 10, 20, 6, 1); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAXI', bx + w/2, by + h/2 - 5);

        // Windows
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(bx + 4, by + 14, w - 8, 12, 2); ctx.fill(); // Front
        ctx.beginPath(); ctx.roundRect(bx + 4, by + 36, w - 8, 10, 2); ctx.fill(); // Back
        // Rear window lines
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bx+6, by+40); ctx.lineTo(bx+w-6, by+40); ctx.stroke();

        // Bumpers
        ctx.fillStyle = '#334155';
        ctx.beginPath(); ctx.roundRect(bx + 2, by - 2, w - 4, 4, 2); ctx.fill(); // Front Bumper
        ctx.beginPath(); ctx.roundRect(bx + 2, by + h - 2, w - 4, 4, 2); ctx.fill(); // Back Bumper
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
      // Iridescent Cyber-Oil Slick
      ctx.save();
      const grad = ctx.createRadialGradient(
        obs.x + obs.width/2, obs.y + obs.height/2, 2,
        obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2
      );
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(0.4, '#0f172a');
      grad.addColorStop(0.7, 'rgba(236, 72, 153, 0.4)'); // Pink sheen
      grad.addColorStop(0.9, 'rgba(56, 189, 248, 0.4)'); // Cyan sheen
      grad.addColorStop(1, 'transparent');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, obs.height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawCone = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      // High-Fidelity Traffic Cone
      ctx.save();
      const bx = obs.x + obs.width/2;
      const by = obs.y + obs.height;
      
      // Base
      ctx.fillStyle = '#431407'; 
      ctx.beginPath();
      ctx.ellipse(bx, by, obs.width/2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Body
      const coneGrad = ctx.createLinearGradient(obs.x, obs.y, obs.x + obs.width, obs.y);
      coneGrad.addColorStop(0, '#ea580c');
      coneGrad.addColorStop(0.5, '#fb923c');
      coneGrad.addColorStop(1, '#ea580c');
      ctx.fillStyle = coneGrad;
      ctx.beginPath();
      ctx.moveTo(bx - 4, obs.y);
      ctx.lineTo(bx + 4, obs.y);
      ctx.lineTo(bx + obs.width/2 - 2, by - 2);
      ctx.lineTo(bx - obs.width/2 + 2, by - 2);
      ctx.fill();
      
      // Reflective Band
      ctx.fillStyle = '#f8fafc';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#fff';
      ctx.beginPath();
      ctx.moveTo(bx - 8, obs.y + obs.height*0.4);
      ctx.lineTo(bx + 8, obs.y + obs.height*0.4);
      ctx.lineTo(bx + 12, obs.y + obs.height*0.6);
      ctx.lineTo(bx - 12, obs.y + obs.height*0.6);
      ctx.fill();
      ctx.restore();
    };

    const drawTree = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      // Aesthetic Jacaranda Tree
      ctx.save();
      const bx = obs.x + obs.width/2;
      const by = obs.y + obs.height;
      
      // Trunk
      ctx.fillStyle = '#2d150b';
      ctx.fillRect(bx - 4, obs.y + obs.height*0.5, 8, obs.height*0.5);
      
      // Lush Purple Canopy
      const t = Date.now() * 0.002;
      const sway = Math.sin(t + obs.id) * 3;
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
      
      ctx.fillStyle = '#a855f7';
      ctx.beginPath(); ctx.arc(bx + sway, obs.y + obs.height*0.3, obs.width/2, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(bx + sway - 10, obs.y + obs.height*0.2, obs.width/3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#d8b4fe';
      ctx.beginPath(); ctx.arc(bx + sway + 12, obs.y + obs.height*0.4, obs.width/3, 0, Math.PI*2); ctx.fill();
      
      // Petals
      ctx.fillStyle = '#f5f3ff';
      ctx.globalAlpha = 0.6;
      for(let i=0; i<3; i++) {
         const px = bx + Math.sin(t + i) * 20;
         const py = by + Math.cos(t + i) * 5;
         ctx.fillRect(px, py, 3, 3);
      }
      ctx.restore();
    };

    const drawBuilding = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      
      // Cyber-Urban Structure
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, 0, obs.width, obs.height);
      
      // Frame / Outline
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, obs.width, obs.height);
      
      const type = obs.id % 4;
      if (type === 0) {
         // Neon Advertising Billboard
         const blink = Date.now() % 1000 > 500;
         ctx.fillStyle = blink ? '#ec4899' : '#312e81';
         ctx.fillRect(4, 4, obs.width - 8, obs.height - 8);
         ctx.fillStyle = '#fff';
         ctx.font = '900 12px monospace';
         ctx.fillText('NEON_LIVE', 8, obs.height/2);
      } else if (type === 1) {
         // Data Center with Pulsing Lights
         for(let i=0; i<3; i++) {
            const alpha = 0.2 + Math.abs(Math.sin(Date.now()*0.002 + i))*0.8;
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.fillRect(obs.width*0.2, 10 + i*15, obs.width*0.6, 6);
         }
      } else {
         // Grid Apartment Look
         ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
         for(let ix=4; ix<obs.width-4; ix+=8) {
            for(let iy=4; iy<obs.height-4; iy+=8) {
               if (Math.random() > 0.7) ctx.fillRect(ix, iy, 4, 4);
            }
         }
      }
      ctx.restore();
    };

    const drawEnemy = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      ctx.save();
      const bx = obs.x; const by = obs.y; const w = Math.min(obs.width, 36); const h = Math.min(obs.height, 50);
      const offsetX = obs.x + (obs.width - w) / 2;
      const offsetY = obs.y + (obs.height - h) / 2;
      
      // Elite Vocho (Cyber-Security)
      ctx.shadowBlur = 15;
      ctx.shadowColor = 'rgba(22, 163, 74, 0.5)';
      
      // Chassis
      ctx.fillStyle = '#14532d'; // Dark forest green
      ctx.beginPath(); ctx.roundRect(offsetX, offsetY, w, h, 16); ctx.fill();
      ctx.fillStyle = '#16a34a'; // Vibrant green
      ctx.beginPath(); ctx.roundRect(offsetX + 2, offsetY + 2, w - 4, h - 4, 14); ctx.fill();
      
      // White Hood/Top
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath(); ctx.roundRect(offsetX + 6, offsetY + 12, w - 12, h - 24, 6); ctx.fill();
      
      // Pulsing Neon Headlights
      const beam = Math.abs(Math.sin(Date.now() * 0.01)) * 10;
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = beam;
      ctx.shadowColor = '#facc15';
      ctx.beginPath(); ctx.arc(offsetX + 8, offsetY + 6, 4, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(offsetX + w - 8, offsetY + 6, 4, 0, Math.PI*2); ctx.fill();
      
      ctx.restore();
    };

    const drawPowerup = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
       const bx = obs.x; const by = obs.y; const w = obs.width; const h = obs.height;
       ctx.save();
       ctx.translate(bx + w/2, by + h/2);
       
       const floatY = Math.sin(Date.now()/200) * 4;
       ctx.translate(0, floatY);
       
       if (obs.type === 'shield') {
          // Futuristic Shield Orb
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#818cf8';
          ctx.fillStyle = 'rgba(129, 140, 248, 0.4)'; // inner glass
          ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.fill();
          
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(0, 0, w/2, 0, Math.PI*2); ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(-4, -4, w/6, 0, Math.PI*2); ctx.fill(); // highlight
       } else if (obs.type === 'nitro') {
          // NOS Bottle
          ctx.rotate(Math.sin(Date.now()/500) * 0.2); // subtle sway
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#0ea5e9'; // bright cyan
          
          // Body
          ctx.fillStyle = '#0284c7'; // dark cyan
          ctx.beginPath(); ctx.roundRect(-w/2 + 4, -h/2 + 4, w - 8, h - 8, 4); ctx.fill();
          // Highlight
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-w/2 + 6, -h/2 + 4, w/2 - 4, h - 8);
          
          // Nozzle
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-4, -h/2, 8, 4);
          
          // Label
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-w/2 + 4, -h/4, w - 8, h/2);
          
          // Lightning bolt on label
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.moveTo(2, -h/8);
          ctx.lineTo(-4, h/8);
          ctx.lineTo(0, h/8);
          ctx.lineTo(-2, h/4);
          ctx.lineTo(4, 0);
          ctx.lineTo(0, 0);
          ctx.closePath();
          ctx.fill();
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
      
      // CDMX Microbus colors (green/grey top)
      ctx.fillStyle = '#d1d5db'; // Grey top
      ctx.beginPath(); ctx.roundRect(bx, by, w, 25, [4, 4, 0, 0]); ctx.fill();
      ctx.fillStyle = '#16a34a'; // Green bottom
      ctx.beginPath(); ctx.roundRect(bx, by + 25, w, h - 25, [0, 0, 4, 4]); ctx.fill();
      
      // Wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(bx - 3, by + 20, 3, 15);
      ctx.fillRect(bx + w, by + 20, 3, 15);
      ctx.fillRect(bx - 3, by + h - 25, 3, 15);
      ctx.fillRect(bx + w, by + h - 25, 3, 15);

      // Windows
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx + 3, by + 6, w - 6, 12); 
      // Passenger windows
      ctx.fillRect(bx + 3, by + 28, 12, 14);
      ctx.fillRect(bx + w - 15, by + 28, 12, 14);
      ctx.fillRect(bx + 3, by + 48, 12, 14);
      ctx.fillRect(bx + w - 15, by + 48, 12, 14);
      
      // Route Sign
      ctx.fillStyle = '#ef4444'; // Neon sign
      ctx.fillRect(bx + 4, by + Math.floor(h) - 4, w - 8, 4);
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
      // Classic CDMX Pothole
      ctx.fillStyle = '#1c1917'; // very dark
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, obs.height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Inner dirt
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(obs.x + obs.width/2 + 2, obs.y + obs.height/2 + 1, obs.width/2.5, obs.height/2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      // Asphalt cracks around
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.height/2); ctx.lineTo(obs.x - 10, obs.y + obs.height/2 + 5);
      ctx.moveTo(obs.x + obs.width, obs.y + obs.height/2); ctx.lineTo(obs.x + obs.width + 12, obs.y + obs.height/2 - 4);
      ctx.stroke();
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
      ctx.fillText(t('game.race.msg_boss', 'Boss:'), obs.x + 6, obs.y + 12);
      ctx.font = '8px monospace';
      ctx.fillText(t('game.race.msg_urgent', 'Urgent!!'), obs.x + 6, obs.y + 22);
    };

    const drawGas = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
      const bx = obs.x; const by = obs.y; const w = obs.width; const h = obs.height;
      ctx.save();
      ctx.translate(bx + w/2, by + h/2);
      ctx.scale(1 + Math.sin(Date.now()/200)*0.05, 1 + Math.sin(Date.now()/200)*0.05);
      
      const ww = w; const hh = h;
      
      // Floating glowing gas pump
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ef4444';
      
      // Base/Pump Body
      ctx.fillStyle = '#ef4444'; 
      ctx.beginPath(); ctx.roundRect(-ww/2, -hh/2 + 4, ww, hh - 4, 4); ctx.fill();
      
      // Screen/Meter
      ctx.fillStyle = '#111';
      ctx.fillRect(-ww/2 + 4, -hh/2 + 8, ww - 8, 10);
      
      // Top light
      ctx.fillStyle = '#facc15';
      ctx.beginPath(); ctx.arc(0, -hh/2, 4, 0, Math.PI*2); ctx.fill();

      // Hose
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ww/2, -hh/2 + 10);
      ctx.quadraticCurveTo(ww/2 + 10, 0, ww/2, hh/2 - 5);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('G', 0, -hh/2 + 16);
      
      ctx.restore();
    };

    let leftPressed = false;
    let rightPressed = false;

    const loop = (timestamp: number) => {
      if (isGameOver) return;
      const isPausedLocally = pausedRef.current.local;
      const isPausedGlobally = pausedRef.current.global;
      if (isPausedGlobally || isPausedLocally) {
        if (!isPausedGlobally && countdownTimer > 0) {
           countdownTimer -= (timestamp - lastTime) / 1000;
           if (countdownTimer <= 0) {
             setIsPaused(false);
           }
        }
        lastTime = timestamp;
        
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
              currentGas = Math.min(MAX_GAS, currentGas + 45);
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
                 unlockAchievement('race_crasher');
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
        unlockAchievement('race_winner');
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
      const asphaltColor = isNight ? '#0f172a' : '#1e293b'; // Cyberpunk asphalt
      
      ctx.fillStyle = asphaltColor; // Asphalt
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      
      // Dynamic grid pattern for the road
      ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.05)' : 'rgba(236, 72, 153, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i=0; i<GAME_W; i+=30) {
        ctx.moveTo(i, 0); ctx.lineTo(i, GAME_H);
      }
      for (let j=0; j<GAME_H; j+=30) {
        const lineY = (j + roadOffset * 2) % GAME_H;
        ctx.moveTo(0, lineY); ctx.lineTo(GAME_W, lineY);
      }
      ctx.stroke();

      // Speed lines on asphalt
      const speedLinesCount = nitroTimer > 0 ? 50 : 30;
      ctx.fillStyle = isNight ? 'rgba(56, 189, 248, 0.15)' : 'rgba(236, 72, 153, 0.15)';
      for (let i = 0; i < speedLinesCount; i++) {
         const slX = 0 + (i * 37) % (GAME_W - 0 * 2);
         const slY = ((currentDistance * 180) + i * 93) % GAME_H;
         ctx.fillRect(slX, slY, 2, 60 + Math.random()*30);
      }
      
      // Hyperloop Lane Left
      ctx.fillStyle = 'rgba(236, 72, 153, 0.15)'; // Hot pink glow
      ctx.fillRect(LANES[0] - LANE_WIDTH/2, 0, LANE_WIDTH, GAME_H);
      ctx.fillStyle = 'rgba(236, 72, 153, 0.8)'; // Core line
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ec4899';
      ctx.fillRect(LANES[0] + LANE_WIDTH/2 - 2, 0, 4, GAME_H);
      ctx.shadowBlur = 0;
      
      // Express Neon Lane Right
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)'; // Cyan glow
      ctx.fillRect(LANES[5] - LANE_WIDTH/2, 0, LANE_WIDTH, GAME_H);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.8)'; // Core line
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.fillRect(LANES[5] - LANE_WIDTH/2 - 2, 0, 4, GAME_H);
      ctx.shadowBlur = 0;

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
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.beginPath(); ctx.roundRect(10, 10, GAME_W - 20, 18, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, GAME_W - 20, 18);

      // Progress Bar Fill
      const progressWidth = ((GAME_W - 20) * (currentDistance / GOAL_DISTANCE));
      const progressGrad = ctx.createLinearGradient(10, 0, GAME_W - 10, 0);
      progressGrad.addColorStop(0, '#ec4899');
      progressGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = progressGrad;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.fillRect(10, 10, Math.max(0, progressWidth), 18);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(currentDistance)} / ${GOAL_DISTANCE}km`, GAME_W/2, 23);

      // Fuel Progress Bar
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      ctx.beginPath(); ctx.roundRect(10, 32, GAME_W - 20, 10, 2); ctx.fill();
      const gasWidth = ((GAME_W - 20) * (currentGas / MAX_GAS));
      ctx.fillStyle = currentGas < 20 ? (Math.floor(Date.now() / 200) % 2 === 0 ? '#ef4444' : '#fee2e2') : '#38bdf8';
      ctx.fillRect(10, 32, Math.max(0, gasWidth), 10);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${t('game.race.gas', 'FUEL')} ${Math.floor(currentGas)}%`, GAME_W/2, 40);

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

    const onBlur = () => { setIsPaused(true); };
    window.addEventListener('blur', onBlur);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('blur', onBlur);
    };
  }, [isPlaying, playSound]);

  return (
    <div ref={containerRef} className={cn(
      "flex flex-col items-center justify-center w-full h-full min-h-[350px] md:min-h-[400px] font-mono text-white p-2 relative bg-[#0a0a0a] rounded-xl flex-grow overflow-hidden font-bold border-2 border-zinc-800 transition-all duration-500",
      isFullscreen && "bg-black border-none rounded-none p-0"
    )}>
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-50 transition-opacity opacity-20 hover:opacity-100" />}
      
      {/* Universal/Manual Pause Overlay */}
      <AnimatePresence>
        {(isPlaying && (isPausedGlobal || isPaused)) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-4 md:gap-6 text-center p-4"
          >
            <div className="flex flex-col items-center gap-2">
               {isPausedGlobal ? (
                 <Zap className="w-10 h-10 md:w-12 md:h-12 text-brand-accent animate-pulse" />
               ) : (
                 <TerminalSquare className="w-10 h-10 md:w-16 md:h-16 animate-pulse text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.4)]" />
               )}
               <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-[0.3em]">
                 {isPausedGlobal ? t('game.paused.system', 'RACE SUSPENDED') : 'RACE PAUSED'}
               </h2>
            </div>
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-bold text-center px-4 md:px-16 leading-relaxed max-w-xs">
              {isPausedGlobal 
                ? t('game.paused.desc', 'Red flag on the track. The race will resume when clear.')
                : t('game.paused.manual', 'Pit stop in progress. Take a breath to resume.')}
            </p>
            {!isPausedGlobal && (
              <button
                aria-label="Resume"
                onClick={() => { setIsPaused(false); playSound('start'); }}
                className="bg-orange-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95"
              >
                RESUME
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex justify-between items-center w-full max-w-lg mb-2 px-6 py-3 text-[10px] md:text-xs text-brand-accent font-bold bg-[#0c0c0e]/95 rounded-t-2xl border-t-2 border-brand-accent/40 shadow-[0_-10px_30px_rgba(56,189,248,0.1)] shrink-0 z-20">
         <div className="flex items-center gap-6">
            <div className="flex flex-col gap-0.5">
               <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black">Control_Module</span>
               <button 
                 aria-label="Toggle Controls"
                 onClick={() => { playSound('hover'); setShowMobileControls(prev => !prev); }} 
                 className={`flex items-center gap-1.5 uppercase text-[9px] font-black border px-2 py-0.5 rounded transition-all ${showMobileControls ? 'bg-brand-accent/20 border-brand-accent text-brand-accent shadow-[0_0_10px_rgba(56,189,248,0.3)]' : 'text-zinc-600 border-zinc-800 hover:border-zinc-500'}`}
               >
                 <Zap className="w-2.5 h-2.5" /> {showMobileControls ? 'READY' : 'OFF'}
               </button>
            </div>
            
            <div className="flex flex-col gap-0.5">
               <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black italic">Earnings_Monitor</span>
               <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-green-500" />
                  <span className="font-mono text-base md:text-xl text-white tracking-tighter" ref={scoreRefDOM}>{score}</span>
               </div>
            </div>
         </div>

         <div className="flex flex-col items-end gap-1">
            <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-black">Integrity_Check</span>
            {hp > 0 && (
              <div className="flex gap-1">
                {Array.from({length: 5}).map((_, i) => (
                   <div key={i} className={`w-1.5 h-4 rounded-sm border ${i < hp ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-white/5 border-white/10'}`}></div>
                ))}
              </div>
            )}
         </div>
      </div>

      <div className={cn(
        "relative border-4 border-brand-accent/50 rounded-b-xl shadow-2xl bg-[#27272a] overflow-hidden w-full max-w-lg flex-grow h-full touch-none",
        isFullscreen ? "max-w-none border-none rounded-none" : "max-h-[800px]"
      )}>
        
        {/* STORY COMIC OVERLAY */}
        <AnimatePresence>
          {showStory && !isPlaying && !gameOver && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-[60] bg-black flex flex-col justify-center items-center p-4 md:p-6 border-4 border-white overflow-y-auto"
             >
               <h1 className="text-xl md:text-3xl font-black text-white text-center mb-4 md:mb-6 tracking-widest">{t('game.arc.race', 'PAY DAY RACE')}</h1>
               
               <div className="flex flex-col gap-2 md:gap-4 mb-6 md:mb-8 w-full">
                 <div className="bg-zinc-900 border-2 border-white p-3 md:p-4">
                   <p className="font-mono text-zinc-300 text-xs md:text-sm">{t('game.race.story.1', 'FRIDAY, 4:45 PM. RENT IS DUE.')}</p>
                 </div>
                 <div className="bg-zinc-900 border-2 border-red-500 p-3 md:p-4 transform rotate-1">
                   <p className="font-mono text-red-500 font-bold text-xs md:text-sm">{t('game.race.story.2', 'THE BANK CLOSES AT 5:00 PM.')}</p>
                 </div>
                 <div className="bg-zinc-900 border-2 border-orange-500 p-3 md:p-4 transform -rotate-1">
                   <p className="font-mono text-orange-400 font-bold max-w-[200px] mx-auto text-center leading-tight text-xs md:text-sm">{t('game.race.story.3', 'IF I DON\'T MAKE IT, I\'M SLEEPING ON THE STREET!')}</p>
                 </div>
               </div>
               
               <button 
                 aria-label={t('game.race.story.start', 'START ENGINE')}
                 onClick={() => setShowStory(false)}
                 className="bg-white text-black font-black px-6 md:px-8 py-2 md:py-3 uppercase text-sm md:text-lg hover:bg-orange-500 transition-colors shadow-[4px_4px_0_0_rgba(249,115,22,1)]"
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
            <div className="absolute bottom-6 md:bottom-10 left-2 md:left-4 z-20 pointer-events-none">
              <button 
                aria-label="Steer Left"
                onMouseDown={() => { keysGamepad.current.left = true; playSound('click'); }}
                onMouseUp={() => keysGamepad.current.left = false}
                onMouseLeave={() => keysGamepad.current.left = false}
                onTouchStart={(e) => { e.preventDefault(); keysGamepad.current.left = true; playSound('click'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysGamepad.current.left = false; }}
                className="w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center active:bg-white/20 active:border-white/40 transition-all pointer-events-auto"
              >
                <div className="w-0 h-0 border-t-[12px] md:border-t-[15px] border-t-transparent border-r-[20px] md:border-r-[25px] border-r-white/30 border-b-[12px] md:border-b-[15px] border-b-transparent mr-2" />
              </button>
            </div>
            <div className="absolute bottom-6 md:bottom-10 right-2 md:right-4 z-20 pointer-events-none">
              <button 
                aria-label="Steer Right"
                onMouseDown={() => { keysGamepad.current.right = true; playSound('click'); }}
                onMouseUp={() => keysGamepad.current.right = false}
                onMouseLeave={() => keysGamepad.current.right = false}
                onTouchStart={(e) => { e.preventDefault(); keysGamepad.current.right = true; playSound('click'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysGamepad.current.right = false; }}
                className="w-20 h-20 md:w-24 md:h-24 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center active:bg-white/20 active:border-white/40 transition-all pointer-events-auto"
              >
                <div className="w-0 h-0 border-t-[12px] md:border-t-[15px] border-t-transparent border-l-[20px] md:border-l-[25px] border-l-white/30 border-b-[12px] md:border-b-[15px] border-b-transparent ml-2" />
              </button>
            </div>
          </>
        )}

        <AnimatePresence>
        {!isPlaying && !gameOver && !showStory && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col bg-[#111]/90 backdrop-blur-md p-4 z-20 overflow-y-auto">
            <div className="flex flex-col items-center mb-4">
              <Car size={32} className="text-orange-500 mb-1" />
              <h3 className="text-xl font-bold text-brand-accent leading-none uppercase tracking-widest relative inline-block">
                 {t('game.arc.race')}
                 <span className="absolute -top-3 -right-6 rotate-6 text-[8px] bg-red-600 text-white font-bold px-1 py-0.5 border border-red-500 shadow-md">BY RIVAD</span>
              </h3>
            </div>

            <p className="text-[10px] text-zinc-500 mb-4 uppercase text-center max-w-[300px] mx-auto">
              {t('game.arc.race.desc')}
            </p>

            <h4 className="text-[10px] text-zinc-400 mb-2 uppercase font-bold text-center tracking-tighter">--- {t('game.race.select_car')} ---</h4>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {cars.map(car => (
                <button
                  key={car.id}
                  aria-label={`Select ${car.name}`}
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
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#10b981] rounded-sm mb-1" />RUTA</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#16a34a] rounded-sm mb-1" />VOCH</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#ef4444] rounded-sm mb-1" />{t('game.race.gas', 'GAS')}</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#818cf8] rounded-full mb-1 flex items-center justify-center"><Shield size={10} className="text-white"/></div>SHLD</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#0ea5e9] rounded-full mb-1 flex items-center justify-center"><Zap size={10} className="text-white"/></div>NITR</div>
            </div>

            <button 
              aria-label={t('game.insert', 'INSERT COIN')}
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
          </motion.div>
        )}
        </AnimatePresence>

        <canvas 
          ref={canvasRef} 
          width={400} 
          height={600} 
          className="w-full h-full object-contain cursor-none"
        />

        <AnimatePresence>
        {gameOver && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm backdrop-blur-md"
          >
             {outOfGas ? (
              <>
                <Coffee className="w-12 h-12 md:w-16 md:h-16 text-orange-500 mb-4" />
                <h2 className="text-2xl md:text-3xl text-orange-500 font-black mb-2 tracking-widest text-center uppercase">{t('game.race.out_of_gas', 'OUT OF GAS!')}</h2>
                <p className="text-[10px] md:text-sm text-zinc-300 mb-6 uppercase text-center max-w-xs">{t('game.race.out_of_gas_desc', 'You ran out of fuel.')}</p>
              </>
            ) : hp > 0 ? (
              <>
                <Zap className="w-12 h-12 md:w-16 md:h-16 text-yellow-400 mb-4 animate-bounce" />
                <h2 className="text-2xl md:text-3xl text-yellow-400 font-black mb-2 tracking-widest text-center uppercase">{t('game.race.win_title', 'ON TIME!')}</h2>
                <p className="text-[10px] md:text-sm text-zinc-300 mb-6 uppercase text-center max-w-xs">{t('game.race.win_desc', 'You dodged the bills and traffic just in time.')}</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mb-4" />
                <h2 className="text-2xl md:text-3xl text-red-500 font-black mb-2 tracking-widest text-center uppercase">{t('game.race.crash')}</h2>
                <p className="text-[10px] md:text-sm text-zinc-300 mb-6 uppercase">{t('game.race.collision_desc', 'Debt collectors caught up with you.')}</p>
              </>
            )}
            
            <div className="bg-zinc-900 border border-white/10 p-4 md:p-6 rounded-2xl mb-6 md:mb-8 w-48 md:w-64 text-center">
              <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase mb-1">{t('game.race.score')}</p>
              <p className="text-2xl md:text-4xl font-black text-white tracking-tight">{score.toLocaleString()}</p>
            </div>
            
            <div className="flex flex-col gap-3 w-full max-w-[200px]">
              <button
                 aria-label={t('game.retry', 'PLAY AGAIN')}
                 onClick={() => {
                   setScore(0);
                   setHp(currentCar.maxHp);
                   setGas(100);
                   setOutOfGas(false);
                   setGameOver(false);
                   setIsPlaying(true);
                   playSound('start');
                 }}
                 className="bg-orange-500 text-black w-full py-2 md:py-3 text-xs md:text-sm font-black hover:bg-orange-400 transition-all uppercase rounded-full glow-orange shadow-lg active:scale-95"
              >
                {t('game.retry', 'PLAY AGAIN')}
              </button>
              {onFinish && (
                <button
                  aria-label="MAIN MENU"
                  onClick={(e) => {
                    e.preventDefault();
                    onFinish();
                  }}
                  className="w-full text-zinc-500 text-[10px] py-1 font-black uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                  MAIN MENU
                </button>
              )}
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
