import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { User, Zap } from 'lucide-react';

import { FullscreenButton } from '../ui/FullscreenButton';

export function DebatePong() {
  const { t, language } = useLanguage();
  const { playSound } = useAudio();
  const { unlockAchievement } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let hitText = "";
    let hitTextTimeout: ReturnType<typeof setTimeout>;
    let shakeAmount = 0;
    let particles: {x: number, y: number, vx: number, vy: number, text: string, life: number}[] = [];
    
    const paddleWidth = 10;
    const paddleHeight = 60;
    const ballSize = 10;
    
    const player = { x: 20, y: canvas.height / 2 - paddleHeight / 2, dy: 0, score: 0 };
    const cpu = { x: canvas.width - 30, y: canvas.height / 2 - paddleHeight / 2, dy: 3.5, score: 0 };
    const ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4 };

    const debateTerms = language === 'en' 
      ? ["Ad Hominem", "Straw Man", "Syllogism", "Appeal to Authority", "Sophism", "False Dichotomy", "Axiom"]
      : language === 'fr'
      ? ["Ad Hominem", "Homme de Paille", "Syllogisme", "Appel à l'Autorité", "Sophisme", "Fausse Dichotomie", "Axiome"]
      : ["Ad Hominem", "Hombre de Paja", "Silogismo", "Apelación a la Autoridad", "Sofisma", "Falsa Dicotomía", "Axioma"];

    const showHitText = (x: number, y: number) => {
      const term = debateTerms[Math.floor(Math.random() * debateTerms.length)];
      hitText = term;
      shakeAmount = 8;
      
      // Add particles
      for (let i = 0; i < 5; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          text: term.split(' ')[0], // First word of term
          life: 1.0
        });
      }

      clearTimeout(hitTextTimeout);
      hitTextTimeout = setTimeout(() => { hitText = "" }, 800);
    };

    const getScaledY = (clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvas.height;
      const scaleY = rect.width / rect.height;
      
      let displayedHeight = rect.height;
      if (scaleX > scaleY) {
          displayedHeight = rect.width / scaleX;
      }
      
      const offsetY = (rect.height - displayedHeight) / 2;
      return ((clientY - rect.top - offsetY) / displayedHeight) * canvas.height;
    };

    const handleMouseMove = (e: MouseEvent) => {
      player.y = getScaledY(e.clientY) - paddleHeight / 2;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        player.y = getScaledY(e.touches[0].clientY) - paddleHeight / 2;
      }
    };

    let keys = { ArrowUp: false, ArrowDown: false };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') keys.ArrowUp = true;
      if (e.key === 'ArrowDown') keys.ArrowDown = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') keys.ArrowUp = false;
      if (e.key === 'ArrowDown') keys.ArrowDown = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const draw = () => {
      if (player.score >= 5 || cpu.score >= 5) {
        setIsPlaying(false);
        if (player.score >= 5) {
          playSound('win');
          unlockAchievement('pong_master');
        } else {
          playSound('lose');
          unlockAchievement('pong_loser');
        }
        return;
      }

      const playerSpeed = 6;
      if (keys.ArrowUp) {
        player.y -= playerSpeed;
      }
      if (keys.ArrowDown) {
        player.y += playerSpeed;
      }

      // Physics
      ball.x += ball.dx;
      ball.y += ball.dy;

      // CPU AI
      const cpuSpeed = 3.2 + (player.score * 0.4); 
      const targetPos = ball.y - paddleHeight / 2;
      if (cpu.y < targetPos) {
        cpu.y += cpuSpeed;
      } else {
        cpu.y -= cpuSpeed;
      }

      // Walls
      if (ball.y < 0 || ball.y + ballSize > canvas.height) {
        ball.dy *= -1;
        shakeAmount = 2;
      }

      // Paddles
      if (
        ball.x < player.x + paddleWidth &&
        ball.x + ballSize > player.x &&
        ball.y + ballSize > player.y &&
        ball.y < player.y + paddleHeight
      ) {
        if (ball.dx < 0) {
          ball.dx *= -1;
          ball.dx = Math.min(10, Math.abs(ball.dx) + 0.4); 
          const hitOffset = (ball.y + ballSize / 2) - (player.y + paddleHeight / 2);
          ball.dy = hitOffset * 0.25;
          playSound('hit');
          showHitText(ball.x, ball.y);
        }
      }

      if (
        ball.x + ballSize > cpu.x &&
        ball.x < cpu.x + paddleWidth &&
        ball.y + ballSize > cpu.y &&
        ball.y < cpu.y + paddleHeight
      ) {
        if (ball.dx > 0) {
          ball.dx *= -1;
          ball.dx = -Math.min(10, Math.abs(ball.dx) + 0.4); 
          const hitOffset = (ball.y + ballSize / 2) - (cpu.y + paddleHeight / 2);
          ball.dy = hitOffset * 0.25;
          playSound('hit');
          showHitText(ball.x, ball.y);
        }
      }

      // Scoring
      if (ball.x < 0) {
        cpu.score++;
        setCpuScore(cpu.score);
        resetBall();
        shakeAmount = 15;
      } else if (ball.x > canvas.width) {
        player.score++;
        setPlayerScore(player.score);
        resetBall();
        shakeAmount = 15;
      }

      // Constrain paddles
      player.y = Math.max(0, Math.min(canvas.height - paddleHeight, player.y));
      cpu.y = Math.max(0, Math.min(canvas.height - paddleHeight, cpu.y));

      // Clear & Shake
      ctx.save();
      if (shakeAmount > 0) {
        ctx.translate((Math.random() - 0.5) * shakeAmount, (Math.random() - 0.5) * shakeAmount);
        shakeAmount *= 0.9;
        if (shakeAmount < 0.1) shakeAmount = 0;
      }

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scanlines effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < canvas.height; i += 2) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      // Draw Net
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
      }

      // Draw Paddles with bloom-ish effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f24a29';
      ctx.fillStyle = '#f24a29'; 
      ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
      
      ctx.shadowColor = '#fff';
      ctx.fillStyle = '#fff'; // CPU
      ctx.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);
      
      // Ball
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fff'; 
      ctx.fillRect(ball.x, ball.y, ballSize, ballSize);

      if (hitText) {
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#fff';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(hitText, canvas.width / 2, 40);
      }

      // Draw particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(p.text, p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = (Math.random() > 0.5 ? 4 : -4);
      ball.dy = (Math.random() > 0.5 ? 4 : -4);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }
  }, [isPlaying]);

  return (
    <div className={isPlaying ? "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden" : "flex flex-col items-center max-w-full overflow-hidden font-[var(--font-pixel)]"}>
      <div className={isPlaying ? "w-full max-w-[600px] flex flex-col" : "flex flex-col items-center w-full"}>
      <div className="flex justify-between w-full max-w-[420px] mx-auto px-6 py-4 mb-4 text-[#fcfcfc] bg-zinc-900/50 rounded-xl border border-white/5 shadow-xl shrink-0 pt-4">
        <div className="flex flex-col items-center">
          <p className="text-brand-accent text-[8px] uppercase tracking-widest mb-1">{t('game.pong.thesis')}</p>
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-brand-accent opacity-50" />
            <p className="text-4xl font-black italic">{playerScore}</p>
          </div>
        </div>
        <div className="h-10 w-px bg-white/10 self-center"></div>
        <div className="flex flex-col items-center">
          <p className="text-zinc-500 text-[8px] uppercase tracking-widest mb-1">{t('game.pong.antithesis')}</p>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-black italic text-zinc-300">{cpuScore}</p>
            <Zap className="w-4 h-4 text-zinc-500 opacity-50" />
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="relative border-4 border-gray-800 bg-[#0a0a0a] crt rounded-lg overflow-hidden touch-none w-[400px] max-w-full h-[60vh] md:h-auto md:aspect-[4/3] flex justify-center items-center mx-auto shadow-2xl">
        <FullscreenButton targetRef={containerRef} className="top-2 right-2" />
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
            <h3 className="text-white text-lg mb-2 text-center leading-loose">
              {playerScore >= 5 ? t('game.pong.win') : cpuScore >= 5 ? t('game.pong.lose') : t('game.pong.title')}
            </h3>
            <p className="text-[8px] text-gray-400 mb-6 uppercase tracking-widest">{t('game.objective')}{t('game.pong.goal')}</p>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPlayerScore(0);
                setCpuScore(0);
                setIsPlaying(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPlayerScore(0);
                setCpuScore(0);
                setIsPlaying(true);
              }}
              className="bg-brand-accent text-white px-6 py-3 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors relative z-50 cursor-pointer pointer-events-auto"
            >
              {playerScore >= 5 || cpuScore >= 5 ? t('game.retry') : t('game.insert')}
            </button>
            <p className="text-[8px] text-gray-500 mt-6 mt-4">{t('game.pong.controls')}</p>
          </div>
        ) : null}
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={300} 
          className="block max-w-full h-auto cursor-none touch-none"
        />
      </div>
      </div>
    </div>
  );
}
