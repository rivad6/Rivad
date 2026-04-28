import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Car, Heart, TerminalSquare, Zap } from 'lucide-react';
import { FullscreenButton } from '../ui/FullscreenButton';

type ObstacleType = 'microbus' | 'taco' | 'msg' | 'bache';

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

export function MeetingRace() {
  const { t } = useLanguage();
  const { playSound } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const scoreRefDOM = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let lastTime = performance.now();
    let isGameOver = false;

    // Physics constants
    const GAME_W = 400;
    const GAME_H = 600;
    const MAX_HP = 3;
    
    let currentScore = 0;
    let currentHp = 3;
    let speedMultiplier = 1;
    let baseRoadSpeed = 350; // pixels per second
    let roadOffset = 0;
    
    let lastRenderedScore = -1;
    let lastRenderedHp = -1;
    
    let nextObstacleId = 0;

    let shakeTime = 0;
    let shakeMag = 0;
    
    let slowMoTimer = 0;
    let damageTimer = 0;

    const player = { 
      x: GAME_W / 2 - 18, 
      y: GAME_H - 120, 
      width: 36, 
      height: 60, 
      targetX: GAME_W / 2 - 18, 
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

    let timeSinceLastSpawn = 0;
    
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
      
      if (typeRand > 0.85) {
        type = 'msg';
        width = 65; height = 30;
        color = '#25D366';
      } else if (typeRand > 0.7) {
        type = 'taco';
        width = 28; height = 18;
        color = '#fde047';
      } else if (typeRand > 0.45) {
        type = 'bache';
        width = 35 + Math.random() * 25; height = 20 + Math.random() * 15;
        color = '#1c1917';
      }

      const x = Math.max(15, Math.min(GAME_W - width - 15, Math.random() * GAME_W));
      const speedVar = type === 'taco' || type === 'bache' ? 0 : 50; 
      
      obstacles.push({
        id: nextObstacleId++,
        x, y: -height, width, height,
        speed: speedVar, 
        type, color, markedForDeletion: false
      });
    };

    const drawTaxi = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tilt: number, isBlinking: boolean) => {
      if (isBlinking && Math.floor(performance.now() / 100) % 2 === 0) return;
      
      ctx.save();
      ctx.translate(x + w/2, y + h/2);
      ctx.rotate(tilt);
      const bx = -w/2;
      const by = -h/2;
      
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(bx + 4, by + 4, w, h);

      ctx.fillStyle = '#ffffff'; 
      ctx.beginPath();
      ctx.roundRect(bx, by, w, h, 6);
      ctx.fill();
      
      // Pink top half
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.roundRect(bx, by, w, h/2 + 5, [6, 6, 0, 0]);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#111';
      ctx.roundRect(bx - 4, by + h*0.15, 4, h*0.25, 2); ctx.fill();
      ctx.roundRect(bx + w, by + h*0.15, 4, h*0.25, 2); ctx.fill();
      ctx.roundRect(bx - 4, by + h*0.65, 4, h*0.25, 2); ctx.fill();
      ctx.roundRect(bx + w, by + h*0.65, 4, h*0.25, 2); ctx.fill();
      
      // Windshield
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.roundRect(bx + 4, by + 8, w - 8, h*0.2, 2); ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(bx + 6, by + 10, w*0.4, 3);
      
      // Rear window
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(bx + 4, by + h - 16, w - 8, 10);
      
      // Copete
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bx + w/2 - 6, by + h/2 - 10, 12, 8);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(bx + w/2 - 6, by + h/2 - 4, 12, 2);
      
      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.roundRect(bx + 2, by - 2, 8, 5, 2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(bx + w - 10, by - 2, 8, 5, 2); ctx.fill();

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(bx + 2, by + h - 3, 8, 4);
      ctx.fillRect(bx + w - 10, by + h - 3, 8, 4);
      
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
      const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // max 100ms
      lastTime = timestamp;

      // Logic Updates
      if (slowMoTimer > 0) {
        slowMoTimer -= dt;
        speedMultiplier = 0.5; // Slow down time
      } else {
        speedMultiplier = 1 + Math.floor(currentScore / 1000) * 0.15; // Speed up over time
      }

      const currentRoadSpeed = baseRoadSpeed * speedMultiplier;
      roadOffset = (roadOffset + currentRoadSpeed * dt) % 100;

      if (damageTimer > 0) damageTimer -= dt;

      // Handle input -> player targetX
      if (keys.ArrowLeft || keys.a) player.targetX -= player.speed * dt;
      if (keys.ArrowRight || keys.d) player.targetX += player.speed * dt;
      
      player.targetX = Math.max(14, Math.min(GAME_W - player.width - 14, player.targetX));

      // Smooth follow targetX for tilt effect
      const diff = player.targetX - player.x;
      player.x += diff * 10 * dt; // Lerp
      
      player.tilt = (diff / 20) * (Math.PI / 8); 
      player.tilt = Math.max(-0.2, Math.min(0.2, player.tilt));

      // Spawning
      timeSinceLastSpawn += dt;
      const spawnInterval = Math.max(0.6, 2.0 / speedMultiplier);
      if (timeSinceLastSpawn > spawnInterval) {
        spawnObstacle();
        timeSinceLastSpawn = 0;
      }

      currentScore += dt * 100 * (slowMoTimer > 0 ? 2 : 1); // 2x points in slomo

      // Obstacles update & collide
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += (currentRoadSpeed + (obs.speed * speedMultiplier)) * dt;

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
              if (currentHp < 3) currentHp++;
              spawnParticles(obs.x + obs.width/2, obs.y + obs.height/2, 10, ['#fde047', '#22c55e', '#ffffff']);
              obs.markedForDeletion = true;
           } else {
              // Hit obstacle
              shakeTime = 0.3;
              shakeMag = obs.type === 'bache' ? 5 : 15;
              damageTimer = 1.0; // 1s invuln
              currentHp -= (obs.type === 'bache' ? 1 : 2);
              
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

      // Particles
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
      ctx.fillStyle = '#27272a'; // Asphalt
      ctx.fillRect(0, 0, GAME_W, GAME_H);

      // Screenshake
      if (shakeTime > 0) {
        shakeTime -= dt;
        const sx = (Math.random() - 0.5) * shakeMag;
        const sy = (Math.random() - 0.5) * shakeMag;
        ctx.translate(sx, sy);
      }

      // Road lines
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < 7; i++) {
        const lineY = ((roadOffset + (i * 100)) % GAME_H) - 100;
        ctx.fillRect(GAME_W / 2 - 4, lineY, 8, 50);
      }
      
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(8, 0, 6, GAME_H);
      ctx.fillRect(GAME_W - 14, 0, 6, GAME_H);

      // Draw obstacles
      for (const obs of obstacles) {
        if (obs.type === 'microbus') drawMicrobus(ctx, obs);
        else if (obs.type === 'msg') drawMsg(ctx, obs);
        else if (obs.type === 'taco') drawTaco(ctx, obs);
        else if (obs.type === 'bache') drawBache(ctx, obs);
      }

      // Draw Player
      drawTaxi(ctx, player.x, player.y, player.width, player.height, player.tilt, damageTimer > 0);

      // Draw Particles
      for (const p of particles) {
        const alpha = 1 - (p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      
      // Slomo overlay
      if (slowMoTimer > 0) {
         ctx.fillStyle = 'rgba(253, 224, 71, 0.1)';
         ctx.fillRect(0, 0, GAME_W, GAME_H);
      }

      ctx.restore();

      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPlaying, playSound]);

  return (
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-mono text-white p-2 relative bg-[#0a0a0a] rounded-xl flex-grow overflow-hidden border-2 border-zinc-800">
      <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-50" />
      <div className="flex justify-between items-center w-full max-w-lg mb-2 px-4 py-2 text-xs text-orange-400 font-bold bg-[#111] rounded-t-xl border-x-4 border-t-4 border-zinc-800 shadow-lg">
         <span className="flex items-center gap-2">
            <span>{t('game.race.score')}<span ref={scoreRefDOM}>{score}</span></span>
            {hp > 0 && Array.from({length: hp}).map((_, i) => <Heart key={i} size={12} className="text-red-500 fill-red-500" />)}
         </span>
         <span className="flex items-center gap-1"><TerminalSquare size={14} /> {t('arc.game7')}</span>
      </div>

      <div className="relative border-4 border-zinc-800 rounded-b-xl shadow-2xl bg-[#27272a] overflow-hidden w-full max-w-lg flex-grow h-full max-h-[800px] touch-none">
        
        {/* CRT Scanline Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

        {!isPlaying && !gameOver ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#222]/90 backdrop-blur-sm p-4 text-center z-20">
            <Car size={32} className="text-orange-500 mb-2" />
            <h3 className="text-xl font-bold text-orange-400 mb-2 leading-none uppercase tracking-widest">{t('game.arc.race')}</h3>
            <p className="text-[10px] text-zinc-400 mb-6 max-w-[200px] uppercase">
              {t('game.arc.race.desc')}
            </p>
            <div className="flex gap-4 mb-6 text-[8px] text-zinc-500 uppercase font-mono">
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#10b981] rounded-sm mb-1" />-2 HP</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#25D366] rounded-sm mb-1" />-2 HP</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#1c1917] rounded-full mb-1" />-1 HP</div>
               <div className="flex flex-col items-center"><div className="w-4 h-4 bg-[#fde047] rounded-full mb-1" />+1 HP</div>
            </div>
            <button 
              onClick={() => {
                setScore(0);
                setHp(3);
                setGameOver(false);
                setIsPlaying(true);
                playSound('start');
              }}
              className="bg-orange-500 text-black px-6 py-2 font-black uppercase text-xs hover:bg-orange-400 transition-colors animate-pulse"
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
                 setHp(3);
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
