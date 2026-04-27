import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

export function DebatePong() {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
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

    const showHitText = () => {
      hitText = debateTerms[Math.floor(Math.random() * debateTerms.length)];
      shakeAmount = 5;
      clearTimeout(hitTextTimeout);
      hitTextTimeout = setTimeout(() => { hitText = "" }, 800);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      player.y = e.clientY - rect.top - paddleHeight / 2;
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      player.y = e.touches[0].clientY - rect.top - paddleHeight / 2;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const draw = () => {
      if (player.score >= 5 || cpu.score >= 5) {
        setIsPlaying(false);
        return;
      }

      // Physics
      ball.x += ball.dx;
      ball.y += ball.dy;

      // CPU AI
      const cpuSpeed = 3.5 + (player.score * 0.5); // Gets harder as player scores
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
        ball.x > player.x &&
        ball.y + ballSize > player.y &&
        ball.y < player.y + paddleHeight
      ) {
        ball.dx *= -1;
        ball.dx = Math.abs(ball.dx) + 0.3; // increase speed 
        // vary dy based on hit position
        const hitOffset = (ball.y + ballSize / 2) - (player.y + paddleHeight / 2);
        ball.dy = hitOffset * 0.2;
        showHitText();
      }

      if (
        ball.x + ballSize > cpu.x &&
        ball.x + ballSize < cpu.x + paddleWidth &&
        ball.y + ballSize > cpu.y &&
        ball.y < cpu.y + paddleHeight
      ) {
        ball.dx *= -1;
        ball.dx = -(Math.abs(ball.dx) + 0.3); // increase speed 
        const hitOffset = (ball.y + ballSize / 2) - (cpu.y + paddleHeight / 2);
        ball.dy = hitOffset * 0.2;
        showHitText();
      }

      // Scoring
      if (ball.x < 0) {
        cpu.score++;
        setCpuScore(cpu.score);
        resetBall();
        shakeAmount = 10;
      } else if (ball.x > canvas.width) {
        player.score++;
        setPlayerScore(player.score);
        resetBall();
        shakeAmount = 10;
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

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Net
      ctx.fillStyle = '#333';
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.fillRect(canvas.width / 2 - 1, i, 2, 10);
      }

      // Draw
      ctx.fillStyle = '#f24a29'; // Player paddle
      ctx.fillRect(player.x, player.y, paddleWidth, paddleHeight);
      
      ctx.fillStyle = '#fff'; // CPU
      ctx.fillRect(cpu.x, cpu.y, paddleWidth, paddleHeight);
      
      ctx.fillStyle = '#fff'; // Ball
      ctx.fillRect(ball.x, ball.y, ballSize, ballSize);

      if (hitText) {
        ctx.fillStyle = '#f24a29';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(hitText, canvas.width / 2, canvas.height / 4);
      }
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
    };
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center max-w-full overflow-hidden font-[var(--font-pixel)]">
      <div className="flex justify-between w-[400px] max-w-full px-4 mb-4 text-[#fcfcfc] text-[10px] md:text-xs">
        <div className="text-center">
          <p className="text-brand-accent">{t('game.pong.thesis')}</p>
          <p className="text-2xl mt-2">{playerScore}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-400">{t('game.pong.antithesis')}</p>
          <p className="text-2xl mt-2">{cpuScore}</p>
        </div>
      </div>
      
      <div className="relative border-4 border-gray-800 bg-[#0a0a0a] crt rounded-lg overflow-hidden touch-none w-[400px] max-w-full aspect-[4/3]">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/80">
            <h3 className="text-white text-lg mb-2 text-center leading-loose">
              {playerScore >= 5 ? t('game.pong.win') : cpuScore >= 5 ? t('game.pong.lose') : t('game.pong.title')}
            </h3>
            <p className="text-[8px] text-gray-400 mb-6 uppercase tracking-widest">{t('game.objective')}{t('game.pong.goal')}</p>
            <button 
              onClick={() => {
                setPlayerScore(0);
                setCpuScore(0);
                setIsPlaying(true);
              }}
              className="bg-brand-accent text-white px-6 py-3 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors"
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
  );
}
