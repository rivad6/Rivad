import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';

type Player = 'X' | 'O' | null;

export function IdeasTicTacToe() {
  const { t, language } = useLanguage();
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [log, setLog] = useState<string>(t('game.ttt.log.start'));

  const philosophicalPhrasesX = language === 'en'
    ? [ "Reason illuminates the board.", "A structured argument.", "Status quo questioned.", "Dialectics advancing." ]
    : language === 'fr'
    ? [ "La raison illumine le tableau.", "Un argument structuré.", "Le statu quo est remis en question.", "La dialectique progresse." ]
    : [ "La razón ilumina el tablero.", "Un argumento estructurado.", "Se cuestiona el status quo.", "La dialéctica avanza." ];

  const philosophicalPhrasesO = language === 'en'
    ? [ "Dogma clings to the cell.", "Appeal to tradition.", "Authority fallacy dominates.", "Established norm imposed." ]
    : language === 'fr'
    ? [ "Le dogme s'accroche à la case.", "Appel à la tradition.", "La sophisme d'autorité domine.", "La norme établie s'impose." ]
    : [ "El dogma se aferra a la casilla.", "Apelación a la tradición.", "La falacia de autoridad domina.", "Se impone la norma establecida." ];

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

  const winner = calculateWinner(board);
  const isDraw = !winner && board.every((square) => square !== null);

  useEffect(() => {
    if (!xIsNext && !winner && !isDraw) {
      const timer = setTimeout(() => {
        const availableMoves = board.map((square, index) => square === null ? index : null).filter((val) => val !== null) as number[];
        
        // Simple Bot: Try to win, block, or take center/random
        let bestMove = -1;
        
        // Block player 'X'
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
        
        if (bestMove === -1) { // Take center if available
           if (board[4] === null) bestMove = 4;
           else bestMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
        
        const newBoard = [...board];
        newBoard[bestMove] = 'O';
        setBoard(newBoard);
        setLog(philosophicalPhrasesO[Math.floor(Math.random() * philosophicalPhrasesO.length)]);
        setXIsNext(true);

      }, 600);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, board, winner, isDraw]);

  const handleClick = (i: number) => {
    if (board[i] || winner || !xIsNext) return;
    const newBoard = [...board];
    newBoard[i] = 'X';
    setBoard(newBoard);
    
    setLog(philosophicalPhrasesX[Math.floor(Math.random() * philosophicalPhrasesX.length)]);
    setXIsNext(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setLog(t('game.ttt.log.reset'));
  };

  return (
    <div className="flex flex-col items-center font-[var(--font-pixel)] w-full max-w-[400px]">
      <div className="mb-2 text-center w-full">
         <p className="text-[#8a63d2] text-[10px] md:text-xs">{t('game.objective')}{t('game.ttt.goal')}</p>
      </div>
      <div className="mb-4 text-center text-[10px] md:text-sm leading-loose w-full h-16 flex flex-col justify-center">
        {winner ? (
          <p className="text-brand-accent animate-pulse">
            {t('game.ttt.win', { winner: winner === 'X' ? t('game.ttt.reason') : t('game.ttt.tradition') })}
          </p>
        ) : isDraw ? (
          <p className="text-gray-400">{t('game.ttt.draw')}</p>
        ) : (
          <>
            <p className="text-white mb-2">{t('game.ttt.turn')}{xIsNext ? <span className="text-brand-accent">{t('game.ttt.you')}</span> : <span className="text-blue-400">{t('game.ttt.bot')}</span>}</p>
            <p className="text-gray-500 text-[8px] md:text-[10px] uppercase">[{log}]</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[#090b11] p-2 rounded-lg crt relative border-4 border-[#222]">
        {board.map((square, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!!square || !!winner || !xIsNext}
            className={cn(
              "w-20 h-20 md:w-24 md:h-24 bg-[#0a0a0a] text-3xl flex items-center justify-center transition-colors hover:bg-gray-900 border-2 border-[#111]",
              !square && !winner && xIsNext && "hover:border-[#333] cursor-pointer",
              square === 'X' && "text-brand-accent",
              square === 'O' && "text-blue-400"
            )}
          >
            {square === 'X' ? '👁' : square === 'O' ? '🏛' : ''}
          </button>
        ))}
      </div>

      <button
        onClick={resetGame}
        className="mt-8 bg-brand-accent text-white px-6 py-3 uppercase text-[10px] tracking-widest hover:bg-white hover:text-black transition-colors"
      >
        {t('game.ttt.reset')}
      </button>
    </div>
  );
}
