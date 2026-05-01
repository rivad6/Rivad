import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Landmark, HelpCircle } from 'lucide-react';

import { FullscreenButton } from '../ui/FullscreenButton';

type Player = 'X' | 'O' | null;

const calculateWinner = (squares: Player[]) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6] // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

export function IdeasTicTacToe({ isPausedGlobal = false, hideFullscreenButton = false }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean }) {
  const { t, language } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const [personality, setPersonality] = useState<'rationalist' | 'traditionalist' | 'postmodernist'>('rationalist');
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [log, setLog] = useState<string>(t('game.ttt.log.start'));
  const [focusedCell, setFocusedCell] = useState(4); // Center by default

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  // Cabinet Button Support
  useEffect(() => {
    if (isPausedGlobal || winner || isDraw || !xIsNext) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') setFocusedCell(prev => (prev - 3 + 9) % 9);
      if (e.key === 'ArrowDown') setFocusedCell(prev => (prev + 3) % 9);
      if (e.key === 'ArrowLeft') setFocusedCell(prev => (prev % 3 === 0 ? prev + 2 : prev - 1));
      if (e.key === 'ArrowRight') setFocusedCell(prev => (prev % 3 === 2 ? prev - 2 : prev + 1));
      if (e.key === ' ' || e.key === 'Enter') {
          handleClick(focusedCell);
      }
      if (e.key.startsWith('Arrow')) playSound('hover');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCell, board, winner, isDraw, xIsNext, isPausedGlobal]);

  useEffect(() => {
    if (winner === 'X') {
      unlockAchievement('ttt_winner');
    } else if (isDraw) {
      unlockAchievement('ttt_draw');
    }
  }, [winner, isDraw, unlockAchievement]);

  useEffect(() => {
    if (!winner && !isDraw) {
      playMusic('rpg'); 
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [winner, isDraw, playMusic]);

  const getPhrases = (p: 'X' | 'O', currentBotPersonality?: string) => {
    if (p === 'X') {
      return language === 'en'
        ? [ "Reason illuminates the board.", "A structured argument.", "Status quo questioned.", "Dialectics advancing." ]
        : language === 'fr'
        ? [ "La raison illumine le tableau.", "Un argument structuré.", "Le statu quo est remis en question.", "La dialectique progresse." ]
        : [ "La razón ilumina el tablero.", "Un argumento estructurado.", "Se cuestiona el status quo.", "La dialéctica avanza." ];
    }
    
    // Bot phrases based on personality
    if (currentBotPersonality === 'postmodernist') {
      return language === 'en' 
        ? ["Meaning is a social construct.", "I play because I exist, or do I?", "Deconstructing your corner.", "The board is a text."]
        : ["Le sens est une construction sociale.", "Je joue parce que j'existe, ou bien ?", "Déconstruction de votre coin.", "La grille est un texte."];
    }
    if (currentBotPersonality === 'traditionalist') {
       return language === 'en'
        ? [ "Dogma clings to the cell.", "Appeal to tradition.", "Authority fallacy dominates.", "Established norm imposed." ]
        : [ "El dogma se aferra a la casilla.", "Apelación a la tradición.", "La falacia de autoridad domina.", "Se impone la norma establecida." ];
    }
    
    return language === 'en'
      ? ["Optimizing logical path.", "Syllogism complete.", "Empirical advantage.", "Pure thought placed."]
      : ["Optimizando ruta lógica.", "Silogismo completado.", "Ventaja empírica.", "Pensamiento puro colocado."];
  };

  useEffect(() => {
    if (!xIsNext && !winner && !isDraw && !isPausedGlobal) {
      const timer = setTimeout(() => {
        const availableMoves = board.map((square, index) => square === null ? index : null).filter((val) => val !== null) as number[];
        
        let bestMove = -1;
        
        // Block player 'X' (Universal logic for all but postmodernist)
        if (personality !== 'postmodernist') {
          for (let i = 0; i < availableMoves.length; i++) {
            const move = availableMoves[i];
            const testBoard = [...board];
            testBoard[move] = 'O';
            if (calculateWinner(testBoard) === 'O') {
              bestMove = move;
              break;
            }
            testBoard[move] = 'X';
            if (calculateWinner(testBoard) === 'X') {
              bestMove = move;
            }
          }
        }
        
        if (bestMove === -1) {
           if (personality === 'rationalist') {
             if (board[4] === null) bestMove = 4;
             else bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
           } else if (personality === 'traditionalist') {
             const corners = [0, 2, 6, 8].filter(i => board[i] === null);
             if (corners.length > 0) bestMove = corners[Math.floor(Math.random() * corners.length)];
             else bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
           } else {
             // Postmodernist: just random
             bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
           }
        }
        
        const newBoard = [...board];
        newBoard[bestMove] = 'O';
        setBoard(newBoard);
        
        const botPhrases = getPhrases('O', personality);
        setLog(botPhrases[Math.floor(Math.random() * botPhrases.length)]);
        setXIsNext(true);
        playSound('click');

      }, 800);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, board, winner, isDraw, personality, playSound, language]);

  const handleClick = (i: number) => {
    if (board[i] || winner || !xIsNext || isPausedGlobal) return;
    playSound('click');
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    
    const xPhrases = getPhrases('X');
    setLog(xPhrases[Math.floor(Math.random() * xPhrases.length)]);
    setXIsNext(false);
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setLog(t('game.ttt.log.reset'));
  };

  return (
    <div ref={containerRef} className={cn(
      "flex flex-col items-center justify-center font-[var(--font-pixel)] w-full h-full max-w-[400px] mx-auto relative bg-[#0a0a0a] min-h-[350px] rounded-xl border-4 border-gray-800 p-2 sm:p-4 shadow-xl overflow-y-auto custom-scrollbar transition-all duration-500",
      isFullscreen && "bg-black border-none rounded-none max-w-none"
    )}>
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2" />}
      
      {/* Universal Pause Overlay */}
      <AnimatePresence>
        {isPausedGlobal && !winner && !isDraw && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-brand-accent animate-pulse" />
              <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                {t('game.paused.system', 'THOUGHT PAUSED')}
              </h2>
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
              {t('game.paused.desc', 'Logical cycles are currently reconfiguring.')}
            </p>
          </motion.div>
        )}
        
        {(winner || isDraw) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center pointer-events-auto"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 10 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-[#111] border-2 border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col items-center shadow-2xl mx-4 relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-brand-accent/5 blur-[50px] rounded-full pointer-events-none" />
               <div className="relative z-10 flex flex-col items-center">
                 {winner === 'X' ? (
                   <div className="text-brand-accent text-5xl sm:text-6xl mb-4 font-black">X</div>
                 ) : winner === 'O' ? (
                   <div className="text-blue-400 text-5xl sm:text-6xl mb-4 font-black">O</div>
                 ) : (
                   <div className="text-zinc-500 text-5xl sm:text-6xl mb-4 font-black">-</div>
                 )}
                 <h2 className="text-xl sm:text-3xl font-black text-white uppercase tracking-widest mb-2 text-center">
                   {winner === 'X' ? t('game.ttt.win.user', 'YOU WIN') 
                    : winner === 'O' ? t('game.ttt.win.bot', 'BOT WINS') 
                    : t('game.ttt.draw', 'DRAW')}
                 </h2>
                 <p className="text-zinc-400 text-xs sm:text-sm uppercase tracking-widest mb-8 text-center max-w-xs">
                   {winner === 'X' ? 'Reason illuminates the board. Logic prevails.' 
                    : winner === 'O' ? `The ${personality} perspective has dominated the grid.`
                    : 'A stalemate of ideas. Status quo remains.'}
                 </p>
                 <button
                    aria-label={t('game.ttt.reset', 'REMATCH')}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
                    onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
                    className="w-full bg-brand-accent text-white px-8 py-4 font-black uppercase text-xs sm:text-sm tracking-widest hover:bg-white hover:text-black transition-colors rounded-xl shadow-[0_0_20px_rgba(138,99,210,0.3)] active:scale-95"
                 >
                    {t('game.ttt.reset', 'REMATCH')}
                 </button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-1 text-center w-full relative group">
         <p className="text-[#8a63d2] text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{t('game.objective')}{t('game.ttt.goal')}</p>
         <span className="absolute -top-4 right-0 rotate-12 text-[8px] bg-red-600 text-white font-bold px-2 py-0.5 shadow-md border border-red-400 opacity-80 group-hover:opacity-100 transition-opacity">BY RIVAD</span>
      </div>
      <div className="mb-2 text-center text-[10px] md:text-xs leading-tight w-full flex flex-col justify-center gap-1">
        {!winner && !isDraw && (
          <div className="flex gap-1 justify-center scale-75 opacity-60 hover:opacity-100 transition-opacity">
            {(['rationalist', 'traditionalist', 'postmodernist'] as const).map(p => (
              <button 
                key={p} 
                aria-label={t(`game.ttt.personality.${p}`)}
                onClick={() => setPersonality(p)}
                className={cn(
                  "px-2 py-0.5 rounded border border-white/10 grow text-[8px]",
                  personality === p ? "bg-brand-accent text-white border-brand-accent" : "hover:bg-white/5"
                )}
              >
                {t(`game.ttt.personality.${p}`)}
              </button>
            ))}
          </div>
        )}
        <div className="h-4 flex items-center justify-center">
          {winner ? (
            <p className="text-brand-accent animate-pulse font-bold">
              {t('game.ttt.win', { winner: winner === 'X' ? t('game.ttt.reason') : t('game.ttt.tradition') })}
            </p>
          ) : isDraw ? (
            <p className="text-gray-400">{t('game.ttt.draw')}</p>
          ) : (
            <p className="text-white">{t('game.ttt.turn')}{xIsNext ? <span className="text-brand-accent">{t('game.ttt.you')}</span> : <span className="text-blue-400">{t(`game.ttt.personality.${personality}`)}</span>}</p>
          )}
        </div>
        {!winner && !isDraw && <p className="text-gray-500 text-[8px] uppercase truncate px-2 italic">[{log}]</p>}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-2 rounded-2xl backdrop-blur-xl relative border border-white/5 shadow-2xl scale-95 sm:scale-100">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        {board.map((square, i) => (
          <button
            key={i}
            aria-label={`Square ${i}`}
            onClick={() => handleClick(i)}
            disabled={!!square || !!winner || !xIsNext}
            className={cn(
              "w-16 h-16 sm:w-20 sm:h-20 bg-zinc-950/80 backdrop-blur-sm text-2xl sm:text-3xl flex items-center justify-center transition-all hover:bg-zinc-900 border-2 border-white/5 rounded-xl relative group",
              !square && !winner && xIsNext && "hover:border-brand-accent/50 cursor-pointer active:scale-95",
              i === focusedCell && !winner && !isDraw && xIsNext && "border-brand-accent ring-2 ring-brand-accent/20 scale-105",
              square === 'X' && "text-brand-accent",
              square === 'O' && "text-blue-400"
            )}
          >
            {square === 'X' ? (
              <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}><Eye className="w-8 h-8 sm:w-10 sm:h-10 text-brand-accent mt-1 drop-shadow-[0_0_10px_rgba(242,74,41,0.5)]" /></motion.span>
            ) : square === 'O' ? (
              <motion.span initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }}><Landmark className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 mt-1 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" /></motion.span>
            ) : (
              <span className="opacity-0 group-hover:opacity-10 transition-opacity text-white/50"><HelpCircle className="w-6 h-6" /></span>
            )}
            
            {/* Cell visual flair */}
            <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none" />
          </button>
        ))}
      </div>

      <button
        aria-label={t('game.ttt.reset')}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
        className="mt-4 bg-brand-accent text-white px-4 py-2 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors relative z-50 cursor-pointer pointer-events-auto rounded"
      >
        {t('game.ttt.reset')}
      </button>
    </div>
  );
}
