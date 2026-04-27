import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function FestJump() {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: {x: number, y: number, life: number}[] = [];

    const ELEPHANT_SIZE = 24;
    const PLATFORM_WIDTH = 60;
    const PLATFORM_HEIGHT = 12;
    const GRAVITY = 0.5;
    const JUMP_FORCE = -12;

    let player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      width: ELEPHANT_SIZE,
      height: ELEPHANT_SIZE
    };

    let platforms = [
      { x: canvas.width / 2 - PLATFORM_WIDTH / 2, y: canvas.height - 20 },
      { x: Math.random() * (canvas.width - PLATFORM_WIDTH), y: canvas.height - 110 },
      { x: Math.random() * (canvas.width - PLATFORM_WIDTH), y: canvas.height - 200 },
      { x: Math.random() * (canvas.width - PLATFORM_WIDTH), y: canvas.height - 290 },
      { x: Math.random() * (canvas.width - PLATFORM_WIDTH), y: canvas.height - 380 },
      { x: Math.random() * (canvas.width - PLATFORM_WIDTH), y: canvas.height - 470 },
      { x: Math.random() * (canvas.width - PLATFORM_WIDTH), y: canvas.height - 560 },
    ];

    let cameraY = 0;
    let maxScore = 0;

    const keys = { left: false, right: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'ArrowRight') keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      player.x = mouseX - player.width / 2;
      player.vx = 0;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const touchX = (e.touches[0].clientX - rect.left) * scaleX;
      player.x = touchX - player.width / 2;
      player.vx = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const createParticles = (x: number, y: number) => {
      for(let i=0; i<5; i++) {
        particles.push({x: x + Math.random()*20, y: y + Math.random()*5, life: 1.0});
      }
    };

    const drawElephant = (x: number, y: number) => {
      // Body
      ctx.fillStyle = '#6EE7B7'; // neon green/teal
      ctx.fillRect(x, y, player.width, player.height);
      // Glasses (Neon sunglasses)
      ctx.fillStyle = '#f43f5e'; // neon pink
      ctx.fillRect(x + 2, y + 6, player.width - 4, 6);
      // Trunk
      ctx.fillStyle = '#34d399';
      ctx.fillRect(x + player.width/2 - 2, y + player.height, 4, 8);
    };

    const update = () => {
      // Movement
      if (keys.left) player.vx -= 1;
      else if (keys.right) player.vx += 1;
      else player.vx *= 0.8; // default friction

      // Limit max speed
      player.vx = Math.max(-8, Math.min(8, player.vx));

      player.x += player.vx;
      player.vy += GRAVITY;
      player.y += player.vy;

      // Screen wrap
      if (player.x < -player.width) player.x = canvas.width;
      if (player.x > canvas.width) player.x = -player.width;

      // Camera follow
      if (player.y < canvas.height / 2) {
        let diff = canvas.height / 2 - player.y;
        cameraY += diff;
        player.y = canvas.height / 2;
        maxScore = Math.floor(cameraY);
        setScore(maxScore);

        // Check milestones
        if (maxScore > 500) {
           setUnlockedCodes(prev => prev.includes(t('game.fest.discount5')) ? prev : [...prev, t('game.fest.discount5')]);
        }
        if (maxScore > 2000) {
           setUnlockedCodes(prev => prev.includes(t('game.fest.discount10')) ? prev : [...prev, t('game.fest.discount10')]);
        }
        if (maxScore > 5000) {
           setUnlockedCodes(prev => prev.includes(t('game.fest.discountVIP')) ? prev : [...prev, t('game.fest.discountVIP')]);
        }

        platforms.forEach(p => {
          p.y += diff;
          if (p.y > canvas.height) {
            let minY = Math.min(...platforms.map(p2 => p2.y));
            p.y = minY - (Math.random() * 40 + 60); // Distance between 60 to 100
            p.x = Math.random() * (canvas.width - PLATFORM_WIDTH);
          }
        });
      }

      // Collisions
      if (player.vy > 0) {
        platforms.forEach(p => {
          if (
            player.x + 8 < p.x + PLATFORM_WIDTH &&
            player.x + player.width - 8 > p.x &&
            player.y + player.height >= p.y &&
            player.y + player.height <= p.y + PLATFORM_HEIGHT + player.vy
          ) {
            player.vy = JUMP_FORCE;
            createParticles(player.x, player.y + player.height);
          }
        });
      }

      // Game Over
      if (player.y > canvas.height) {
        setIsPlaying(false);
      }
    };

    const draw = () => {
      // Dynamic Background based on height
      if (cameraY < 1000) {
        ctx.fillStyle = '#111827'; // Dark street level
      } else if (cameraY < 3000) {
        ctx.fillStyle = '#064e3b'; // Jungle green
      } else {
        ctx.fillStyle = '#312e81'; // High altitude neon
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Parallax effect or simple stars/lights
      ctx.fillStyle = '#ffffff20';
      for(let i=0; i<20; i++) {
        let sy = (cameraY * 0.1 + i * 50) % canvas.height;
        ctx.fillRect(10 + (i*47)%canvas.width, sy, 2, 2);
      }

      // Platforms (Lotus/Neon)
      platforms.forEach(p => {
        ctx.fillStyle = cameraY > 3000 ? '#e879f9' : '#a7f3d0'; // Neon pink / Lotus green
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x, p.y, PLATFORM_WIDTH, PLATFORM_HEIGHT);
        ctx.shadowBlur = 0;
      });

      // Particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.fillRect(p.x, p.y, 4, 4);
        p.life -= 0.05;
        p.y += 1;
      });

      // Player
      drawElephant(player.x, player.y);

      update();

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center max-w-full overflow-hidden font-[var(--font-pixel)]">
      <div className="flex justify-between items-end w-[400px] max-w-full px-4 mb-4 text-[#fcfcfc] text-[10px] md:text-sm h-16">
        <div>
          <p className="text-brand-accent">{t('game.fest.title')}</p>
          <p className="text-2xl mt-1">{score}m</p>
        </div>
        <div className="text-right flex flex-col items-end justify-end h-full">
          <p className="text-gray-400 mb-1">{t('game.fest.codes')}</p>
          <div className="text-[8px] text-pink-400 flex flex-col items-end gap-1 min-h-[30px]">
            {unlockedCodes.length === 0 ? t('game.fest.hint') : unlockedCodes.map(c => <span key={c}>{c}</span>)}
          </div>
        </div>
      </div>
      
      <div className="relative border-4 border-gray-800 bg-[#0a0a0a] crt rounded-lg overflow-hidden touch-none w-[400px] max-w-full aspect-[3/4]">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80 p-6 text-center">
            <h3 className="text-pink-500 text-xl mb-2 leading-loose">FEST JUMP</h3>
            <p className="text-[8px] text-gray-400 mb-6 max-w-[200px] leading-relaxed">
              {t('game.fest.objective')}
            </p>
            <button 
              onClick={() => {
                setScore(0);
                setIsPlaying(true);
              }}
              className="bg-brand-accent text-white px-6 py-3 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              {t('game.insert')}
            </button>
            {score > 0 && <p className="text-red-500 mt-4 text-[10px]">{t('game.fest.over', { score: score.toString() })}</p>}
          </div>
        ) : null}
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={500} 
          className="block w-full h-full cursor-none touch-none"
        />
      </div>
    </div>
  );
}
