import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { motion } from 'motion/react';
import { AlertCircle, Car, Coffee, TerminalSquare } from 'lucide-react';

export function MeetingRace() {
  const { t } = useLanguage();
  const { playSound } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let isGameOver = false;

    // Game state
    const player = { x: canvas.width / 2, y: canvas.height - 60, width: 30, height: 50, speed: 5 };
    const obstacles: { x: number, y: number, width: number, height: number, speed: number, type: 'car' | 'coffee' | 'msg', color: string }[] = [];
    const particles: {x: number, y: number, vx: number, vy: number, life: number, type: string}[] = [];
    
    let frameCount = 0;
    let currentScore = 0;
    let speedMultiplier = 1;

    let keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (keys.hasOwnProperty(e.key)) keys[e.key as keyof typeof keys] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (keys.hasOwnProperty(e.key)) keys[e.key as keyof typeof keys] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mobile touch
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const scaleX = canvas.width / rect.width;
        player.x = (touchX * scaleX) - player.width / 2;
      }
    };
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const spawnObstacle = () => {
      const typeRand = Math.random();
      let type: 'car' | 'coffee' | 'msg' = 'car';
      let width = 30;
      let height = 50;
      let color = '#ef4444'; // Red car
      
      if (typeRand > 0.8) {
        type = 'msg';
        width = 40; height = 30;
        color = '#3b82f6'; // Blue msg
      } else if (typeRand > 0.7) {
        type = 'coffee';
        width = 20; height = 20;
        color = '#f59e0b'; // Coffee
      }

      const x = Math.random() * (canvas.width - width);
      obstacles.push({
        x, y: -height, width, height,
        speed: (Math.random() * 2 + 2) * speedMultiplier,
        type, color
      });
    };

    const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isPlayer: boolean, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y + 10, w, h - 20); // body
      ctx.fillStyle = '#111'; // wheels
      ctx.fillRect(x - 2, y + 15, 3, 10);
      ctx.fillRect(x + w - 1, y + 15, 3, 10);
      ctx.fillRect(x - 2, y + h - 25, 3, 10);
      ctx.fillRect(x + w - 1, y + h - 25, 3, 10);
      
      ctx.fillStyle = isPlayer ? '#8a63d2' : '#333'; // glass
      ctx.fillRect(x + 5, y + 15, w - 10, h - 30);
    };

    const loop = () => {
      if (isGameOver) return;
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road lines
      ctx.fillStyle = '#444';
      for (let i = 0; i < 5; i++) {
        const lineY = ((frameCount * 5 * speedMultiplier) + (i * 100)) % canvas.height;
        ctx.fillRect(canvas.width / 2 - 5, lineY, 10, 50);
      }

      // Player Movement
      if (keys.ArrowLeft || keys.a) player.x -= player.speed;
      if (keys.ArrowRight || keys.d) player.x += player.speed;
      
      // Boundaries
      player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

      // Draw Player
      drawCar(ctx, player.x, player.y, player.width, player.height, true, '#ffffff');

      // Update and draw obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obs.speed;

        if (obs.type === 'car') {
           drawCar(ctx, obs.x, obs.y, obs.width, obs.height, false, obs.color);
        } else if (obs.type === 'msg') {
           ctx.fillStyle = obs.color;
           ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
           ctx.fillStyle = '#fff';
           ctx.font = '10px monospace';
           ctx.fillText('URGENT', obs.x + 2, obs.y + 15);
        } else if (obs.type === 'coffee') {
           ctx.fillStyle = obs.color;
           ctx.beginPath();
           ctx.arc(obs.x + obs.width/2, obs.y + obs.height/2, obs.width/2, 0, Math.PI * 2);
           ctx.fill();
        }

        // Collision
        if (
          player.x < obs.x + obs.width &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
           if (obs.type === 'coffee') {
              playSound('powerup');
              currentScore += 200;
              speedMultiplier = Math.max(1, speedMultiplier - 0.2); // Slow down time!
              obstacles.splice(i, 1);
           } else {
              playSound('lose');
              isGameOver = true;
              setGameOver(true);
           }
        } else if (obs.y > canvas.height) {
          obstacles.splice(i, 1);
        }
      }

      // Spawn
      if (frameCount % Math.max(20, Math.floor(60 / speedMultiplier)) === 0) {
        spawnObstacle();
      }

      if (!isGameOver) {
        currentScore++;
        if (currentScore % 500 === 0) speedMultiplier += 0.2;
        setScore(currentScore);
        frameCount++;
        animFrame = requestAnimationFrame(loop);
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPlaying, playSound]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full font-mono text-white p-2">
      <div className="flex justify-between w-full max-w-[300px] mb-2 px-2 text-xs text-orange-400 font-bold bg-[#111] p-2 rounded-t-xl border-x-4 border-t-4 border-zinc-800">
         <span>{t('game.race.score', 'DIS: ')}{score}</span>
         <span className="flex items-center gap-1"><TerminalSquare w={12} /> RACE</span>
      </div>

      <div className="relative border-4 border-zinc-800 rounded-b-xl shadow-2xl bg-black overflow-hidden w-full max-w-[300px] aspect-[3/4]">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#222] p-4 text-center z-10">
            <Car size={32} className="text-orange-500 mb-2" />
            <h3 className="text-xl font-bold text-orange-400 mb-2 leading-none uppercase tracking-widest">{t('game.arc.race', 'LATE FOR MEETING')}</h3>
            <p className="text-[10px] text-zinc-400 mb-4 max-w-[200px] uppercase">
              {t('game.arc.race.desc', 'DODGE TRAFFIC AND URGENT MESSAGES. GRAB COFFEE TO SLOW TIME.')}
            </p>
            <button 
              onClick={() => {
                setScore(0);
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
            width={300} 
            height={400} 
            className="w-full h-full"
          />
        )}

        {gameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <h2 className="text-2xl text-red-500 font-black mb-2 tracking-widest">CRASHED</h2>
            <p className="text-xs text-zinc-300 mb-4 uppercase">Score: {score}</p>
            <button
               onClick={() => {
                 setScore(0);
                 setGameOver(false);
                 setIsPlaying(false);
               }}
               className="border-2 border-zinc-500 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-800 transition-colors uppercase"
            >
              {t('game.retry', 'RETRY')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
