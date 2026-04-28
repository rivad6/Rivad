import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { motion } from 'motion/react';
import { AlertCircle, Car, Coffee, TerminalSquare } from 'lucide-react';
import { FullscreenButton } from '../ui/FullscreenButton';

export function MeetingRace() {
  const { t } = useLanguage();
  const { playSound } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
    const obstacles: { x: number, y: number, width: number, height: number, speed: number, type: 'microbus' | 'taco' | 'msg' | 'bache', color: string }[] = [];
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
      let type: 'microbus' | 'taco' | 'msg' | 'bache' = 'microbus';
      let width = 40;
      let height = 70;
      let color = '#10b981'; // Green microbus
      
      if (typeRand > 0.85) {
        type = 'msg';
        width = 60; height = 25;
        color = '#25D366'; // WhatsApp green
      } else if (typeRand > 0.7) {
        type = 'taco';
        width = 24; height = 14;
        color = '#fde047'; // Taco yellow
      } else if (typeRand > 0.5) {
        type = 'bache';
        width = 30 + Math.random() * 20; height = 20 + Math.random() * 10;
        color = '#1c1917'; // Pothole dark
      }

      const x = Math.random() * (canvas.width - width);
      obstacles.push({
        x, y: -height, width, height,
        speed: (Math.random() * 2 + 3) * speedMultiplier,
        type, color
      });
    };

    const drawTaxi = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      // CDMX Pink Taxi
      ctx.fillStyle = '#ec4899'; // pink top
      ctx.fillRect(x, y + 5, w, h - 10);
      ctx.fillStyle = '#ffffff'; // white bottom
      ctx.fillRect(x, y + h/2, w, h/2 - 5);
      
      // Wheels
      ctx.fillStyle = '#111';
      ctx.fillRect(x - 2, y + 15, 3, 10);
      ctx.fillRect(x + w - 1, y + 15, 3, 10);
      ctx.fillRect(x - 2, y + h - 25, 3, 10);
      ctx.fillRect(x + w - 1, y + h - 25, 3, 10);
      
      // Windows
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(x + 4, y + 12, w - 8, 12); // Windshield
      ctx.fillRect(x + 4, y + 30, w - 8, 10); // Rear
      
      // Taxi sign
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x + w/2 - 4, y + 2, 8, 4);
    };

    const drawMicrobus = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      // CDMX Green/Gray Microbus
      ctx.fillStyle = '#9ca3af'; // gray roof
      ctx.fillRect(x, y, w, 15);
      ctx.fillStyle = '#10b981'; // green body
      ctx.fillRect(x, y + 15, w, h - 15);
      
      // Wheels
      ctx.fillStyle = '#000';
      ctx.fillRect(x - 3, y + 20, 3, 15);
      ctx.fillRect(x + w, y + 20, 3, 15);
      ctx.fillRect(x - 3, y + h - 25, 3, 15);
      ctx.fillRect(x + w, y + h - 25, 3, 15);

      // Windows
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 2, y + 5, w - 4, 15); // Windshield
      ctx.fillRect(x + 2, y + 25, 8, 12);
      ctx.fillRect(x + w - 10, y + 25, 8, 12);
      ctx.fillRect(x + 2, y + 40, 8, 12);
      ctx.fillRect(x + w - 10, y + 40, 8, 12);
    };

    const drawTaco = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#fef08a'; // tortilla
      ctx.beginPath();
      ctx.arc(x + w/2, y + h, w/2, Math.PI, 0);
      ctx.fill();
      
      // meat (pastor)
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(x + 4, y + h - 6, w - 8, 4);
      // cilantro/onion
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + 6, y + h - 8, 4, 2);
      ctx.fillRect(x + w - 10, y + h - 8, 4, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + 10, y + h - 9, 3, 2);
    };

    const drawBache = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.ellipse(x + w/2 - 2, y + h/2 + 1, w/2 - 4, h/2 - 2, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMsg = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      ctx.fillStyle = '#25D366'; // Whatsapp color
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 4);
      ctx.fill();
      // Triangle tail
      ctx.beginPath();
      ctx.moveTo(x + w - 5, y + h);
      ctx.lineTo(x + w + 5, y + h + 5);
      ctx.lineTo(x + w, y + h - 5);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '8px Arial';
      ctx.fillText('Jefe:', x + 4, y + 10);
      ctx.font = '6px Arial';
      ctx.fillText('Urgent!!', x + 4, y + 18);
    };

    const loop = () => {
      if (isGameOver) return;
      ctx.fillStyle = '#3f3f46'; // Asphalt gray
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Road lines
      ctx.fillStyle = '#fbbf24'; // Yellow lines
      for (let i = 0; i < 5; i++) {
        const lineY = ((frameCount * 6 * speedMultiplier) + (i * 100)) % canvas.height;
        ctx.fillRect(canvas.width / 2 - 5, lineY, 10, 40);
      }
      
      // Side lines
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(10, 0, 4, canvas.height);
      ctx.fillRect(canvas.width - 14, 0, 4, canvas.height);

      // Player Movement
      if (keys.ArrowLeft || keys.a) player.x -= player.speed;
      if (keys.ArrowRight || keys.d) player.x += player.speed;
      
      // Boundaries
      player.x = Math.max(14, Math.min(canvas.width - player.width - 14, player.x));

      // Draw Player Taxi
      drawTaxi(ctx, player.x, player.y, player.width, player.height);

      // Update and draw obstacles
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.y += obs.speed;

        if (obs.type === 'microbus') {
           drawMicrobus(ctx, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'msg') {
           drawMsg(ctx, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'taco') {
           drawTaco(ctx, obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'bache') {
           drawBache(ctx, obs.x, obs.y, obs.width, obs.height);
        }

        // Collision logic
        // Baches have smaller hitboxes
        const hitboxPadding = obs.type === 'bache' ? 10 : 2;
        
        if (
          player.x < obs.x + obs.width - hitboxPadding &&
          player.x + player.width > obs.x + hitboxPadding &&
          player.y < obs.y + obs.height - hitboxPadding &&
          player.y + player.height > obs.y + hitboxPadding
        ) {
           if (obs.type === 'taco') {
              playSound('powerup');
              currentScore += 300;
              speedMultiplier = Math.max(0.8, speedMultiplier - 0.2); // Slow down time!
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
    <div ref={containerRef} className="flex flex-col items-center justify-center w-full h-full min-h-[400px] font-mono text-white p-2 relative bg-[#0a0a0a] rounded-xl flex-grow overflow-hidden border-2 border-zinc-800">
      <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-50" />
      <div className="flex justify-between w-full max-w-lg mb-2 px-4 py-2 text-xs text-orange-400 font-bold bg-[#111] rounded-t-xl border-x-4 border-t-4 border-zinc-800 shadow-lg">
         <span>{t('game.race.score')}{score}</span>
         <span className="flex items-center gap-1"><TerminalSquare size={14} /> {t('arc.game7')}</span>
      </div>

      <div className="relative border-4 border-zinc-800 rounded-b-xl shadow-2xl bg-black overflow-hidden w-full max-w-lg h-[400px] md:h-[500px]">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#222] p-4 text-center z-10">
            <Car size={32} className="text-orange-500 mb-2" />
            <h3 className="text-xl font-bold text-orange-400 mb-2 leading-none uppercase tracking-widest">{t('game.arc.race')}</h3>
            <p className="text-[10px] text-zinc-400 mb-4 max-w-[200px] uppercase">
              {t('game.arc.race.desc')}
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
              {t('game.insert')}
            </button>
          </div>
        ) : (
          <canvas 
            ref={canvasRef} 
            width={400} 
            height={600} 
            className="w-full h-full object-cover"
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
            <p className="text-xs text-zinc-300 mb-4 uppercase">Score: {score}</p>
            <button
               onClick={() => {
                 setScore(0);
                 setGameOver(false);
                 setIsPlaying(false);
               }}
               className="border-2 border-zinc-500 text-white px-4 py-2 text-xs font-bold hover:bg-zinc-800 transition-colors uppercase"
            >
              {t('game.retry')}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
