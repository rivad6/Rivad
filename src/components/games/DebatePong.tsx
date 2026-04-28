import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { FullscreenButton } from '../ui/FullscreenButton';

export function DebatePong({ isPausedGlobal = false }: { isPausedGlobal?: boolean }) {
  const { t, language } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [cpuScore, setCpuScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      playMusic('pong');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [isPlaying, playMusic]);

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
    const ball = { x: canvas.width / 2, y: canvas.height / 2, dx: 4, dy: 4, trail: [] as {x: number, y: number}[] };
    let rally = 0;
    let intensity = 1;
    let cpuEmotion = "";
    let cpuEmotionTimeout: ReturnType<typeof setTimeout>;

    const debateTerms = language === 'en' 
      ? ["Ad Hominem", "Straw Man", "Syllogism", "Appeal to Authority", "Sophism", "False Dichotomy", "Axiom"]
      : language === 'fr'
      ? ["Ad Hominem", "Homme de Paille", "Syllogisme", "Appel à l'Autorité", "Sophisme", "Fausse Dichotomie", "Axiome"]
      : ["Ad Hominem", "Hombre de Paja", "Silogismo", "Apelación a la Autoridad", "Sofisma", "Falsa Dicotomía", "Axioma"];

    const showCPUEmotion = (emotion: string) => {
      cpuEmotion = emotion;
      clearTimeout(cpuEmotionTimeout);
      cpuEmotionTimeout = setTimeout(() => { cpuEmotion = "" }, 1500);
    };

    const showHitText = (x: number, y: number, isPower: boolean = false) => {
      const term = isPower ? (language === 'en' ? "POWER SHOT!" : "¡GOLPE DE PODER!") : debateTerms[Math.floor(Math.random() * debateTerms.length)];
      hitText = term;
      shakeAmount = isPower ? 15 : 8;
      
      // Add particles
      const particleCount = isPower ? 15 : 5;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * (isPower ? 10 : 4),
          vy: (Math.random() - 0.5) * (isPower ? 10 : 4),
          text: isPower ? "★" : term.split(' ')[0], 
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
      if (isPausedGlobal) return;
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

      // Ball trail logic
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();

      // Physics
      const currentSpeedMult = 1 + (rally * 0.05);
      ball.x += ball.dx * currentSpeedMult;
      ball.y += ball.dy * currentSpeedMult;

      // CPU AI
      const isPower = rally >= 10;
      const cpuSpeed = (3.2 + (player.score * 0.4)) * (isPower ? 1.5 : 1); 
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
          rally++;
          playSound('hit');
          showHitText(ball.x, ball.y, isPower);
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
          rally++;
          playSound('hit');
          showHitText(ball.x, ball.y, isPower);
          
          if (rally > 10) showCPUEmotion("😤");
          else if (Math.abs(ball.dy) > 4) showCPUEmotion("😲");
        }
      }

      // Scoring
      if (ball.x < 0) {
        cpu.score++;
        setCpuScore(cpu.score);
        showCPUEmotion("😌");
        resetBall();
        shakeAmount = 15;
      } else if (ball.x > canvas.width) {
        player.score++;
        setPlayerScore(player.score);
        showCPUEmotion("😠");
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

      // Draw Ball Trail
      ball.trail.forEach((p, i) => {
        const alpha = (i + 1) / ball.trail.length * 0.3;
        ctx.fillStyle = isPower ? `rgba(242, 74, 41, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
        ctx.fillRect(p.x, p.y, ballSize, ballSize);
      });

      // Draw Paddles with bloom-ish effect
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f24a29';
      ctx.fillStyle = '#f24a29'; 
      ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
      
      ctx.shadowColor = isPower ? '#f24a29' : '#fff';
      ctx.fillStyle = '#fff'; // CPU
      ctx.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);

      // CPU Emotion Bubble
      if (cpuEmotion) {
        ctx.font = '12px serif';
        ctx.fillText(cpuEmotion, cpu.x - 20, cpu.y);
      }
      
      // Ball
      ctx.shadowBlur = isPower ? 20 : 10;
      ctx.shadowColor = isPower ? '#f24a29' : '#fff';
      ctx.fillStyle = isPower ? '#f24a29' : '#fff'; 
      ctx.fillRect(ball.x, ball.y, ballSize, ballSize);

      if (hitText) {
        ctx.shadowBlur = 5;
        ctx.fillStyle = isPower ? '#f24a29' : '#fff';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(hitText, canvas.width / 2, 40);
      }

      // UI Text (Rally)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'left';
      ctx.fillText(t('game.pong.rally', { val: rally.toString() }), 10, canvas.height - 10);

      // Draw particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.fillStyle = p.text === '★' ? `rgba(242, 74, 41, ${p.life})` : `rgba(255, 255, 255, ${p.life})`;
        ctx.font = '6px "Press Start 2P"';
        ctx.fillText(p.text, p.x, p.y);
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
      });

      ctx.restore();
    };

    let lastTime = performance.now();
    const TIME_STEP = 1000 / 60;

    const gameLoop = (time: number) => {
      const dt = time - lastTime;
      if (dt >= TIME_STEP) {
        lastTime = time - (dt % TIME_STEP);
        draw();
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const resetBall = () => {
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
      ball.dx = (Math.random() > 0.5 ? 4 : -4);
      ball.dy = (Math.random() > 0.5 ? 4 : -4);
      ball.trail = [];
      rally = 0;
    };

    animationFrameId = requestAnimationFrame(gameLoop);

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
      
      <div ref={containerRef} className="relative border-4 border-gray-800 bg-[#0a0a0a] crt rounded-lg overflow-hidden touch-none w-full h-full min-h-[400px] flex justify-center items-center mx-auto shadow-2xl flex-grow [&.is-fullscreen]:bg-black [&.is-fullscreen]:border-none [&.is-fullscreen]:rounded-none">
        <FullscreenButton targetRef={containerRef} className="top-2 right-2" />
        
        {/* Universal Pause Overlay */}
        <AnimatePresence>
          {isPausedGlobal && isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6"
            >
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-12 h-12 text-brand-accent animate-pulse" />
                <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                  {t('game.paused.system', 'DEBATE SUSPENDED')}
                </h2>
              </div>
              <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
                {t('game.paused.desc', 'The moderator has called for a temporary recess.')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
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
          className="w-full h-full object-contain cursor-none touch-none"
        />
      </div>
      </div>
    </div>
  );
}
