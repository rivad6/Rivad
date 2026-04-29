import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { motion, AnimatePresence } from 'motion/react';

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
  const [personality, setPersonality] = useState<'rationalist' | 'traditionalist' | 'postmodernist'>('rationalist');
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
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
    <div ref={containerRef} className="flex flex-col items-center justify-center font-[var(--font-pixel)] w-full h-full max-w-[400px] mx-auto relative bg-[#0a0a0a] min-h-[350px] rounded-xl border-4 border-gray-800 p-2 sm:p-4 shadow-xl overflow-y-auto custom-scrollbar [&.is-fullscreen]:bg-black [&.is-fullscreen]:border-none [&.is-fullscreen]:rounded-none [&.is-fullscreen]:max-w-none">
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
      </AnimatePresence>
      <div className="mb-1 text-center w-full">
         <p className="text-[#8a63d2] text-[8px] md:text-[10px] uppercase">{t('game.objective')}{t('game.ttt.goal')}</p>
      </div>
      <div className="mb-2 text-center text-[10px] md:text-xs leading-tight w-full flex flex-col justify-center gap-1">
        {!winner && !isDraw && (
          <div className="flex gap-1 justify-center scale-75 opacity-60 hover:opacity-100 transition-opacity">
            {(['rationalist', 'traditionalist', 'postmodernist'] as const).map(p => (
              <button 
                key={p} 
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
              <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}>👁</motion.span>
            ) : square === 'O' ? (
              <motion.span initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }}>🏛</motion.span>
            ) : (
              <span className="opacity-0 group-hover:opacity-10 transition-opacity text-white/50">?</span>
            )}
            
            {/* Cell visual flair */}
            <div className="absolute inset-0 rounded-xl border border-white/5 pointer-events-none" />
          </button>
        ))}
      </div>

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
        onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
        className="mt-4 bg-brand-accent text-white px-4 py-2 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors relative z-50 cursor-pointer pointer-events-auto rounded"
      >
        {t('game.ttt.reset')}
      </button>
    </div>
  );
}
