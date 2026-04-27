import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';

type Color = 'rojo' | 'azul' | 'guinda' | 'naranja';
type SpecialAction = 'moche' | 'fuero' | 'alianza' | 'normal';
type Card = { color: Color; value: number | string; id: string; action: SpecialAction };

export function PoliticalUno() {
  const { t } = useLanguage();
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [cpuHand, setCpuHand] = useState<Card[]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [turn, setTurn] = useState<'player' | 'cpu'>('player');
  const [message, setMessage] = useState(t('game.uno.msg.start'));
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null);

  const colors: Color[] = ['rojo', 'azul', 'guinda', 'naranja'];
  const colorStyles: Record<Color, string> = {
    rojo: 'bg-red-600',
    azul: 'bg-blue-600',
    guinda: 'bg-[#732021]', // Morena style
    naranja: 'bg-orange-500'
  };

  const initGame = () => {
    setPlayerHand(Array(5).fill(null).map(generateCard));
    setCpuHand(Array(5).fill(null).map(generateCard));
    setTopCard(generateCard());
    setTurn('player');
    setWinner(null);
    setMessage(t('game.uno.msg.turn'));
  };

  const getActionName = (action: SpecialAction) => {
    switch (action) {
      case 'moche': return '+2';
      case 'fuero': return '∅';
      case 'alianza': return '⇄';
      default: return '';
    }
  }

  const generateCard = (): Card => {
    const isSpecial = Math.random() > 0.75;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (isSpecial) {
      const actions: SpecialAction[] = ['moche', 'fuero', 'alianza'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      return {
        color,
        value: getActionName(action),
        id: Math.random().toString(36).substr(2, 9),
        action
      };
    }

    return {
      color,
      value: Math.floor(Math.random() * 9) + 1,
      id: Math.random().toString(36).substr(2, 9),
      action: 'normal'
    };
  };

  useEffect(() => {
    initGame();
  }, []);

  const isValidPlay = (card: Card) => {
    if (!topCard) return true;
    return card.color === topCard.color || card.value === topCard.value || card.action === topCard.action;
  };

  const processAction = (card: Card, currentPlayer: 'player' | 'cpu') => {
    const nextPlayer = currentPlayer === 'player' ? 'cpu' : 'player';
    
    if (card.action === 'moche') {
       setMessage(currentPlayer === 'player' ? t('game.uno.msg.moche.win') : t('game.uno.msg.moche.lose'));
       if (currentPlayer === 'player') setCpuHand(prev => [...prev, generateCard(), generateCard()]);
       else setPlayerHand(prev => [...prev, generateCard(), generateCard()]);
       return nextPlayer;
    } else if (card.action === 'fuero') {
       setMessage(currentPlayer === 'player' ? t('game.uno.msg.fuero.win') : t('game.uno.msg.fuero.lose'));
       return currentPlayer;
    } else if (card.action === 'alianza') {
       setMessage(t('game.uno.msg.alliance'));
       return currentPlayer;
    }
    
    return nextPlayer;
  };

  const playCard = (index: number) => {
    if (turn !== 'player' || winner) return;
    const card = playerHand[index];
    
    if (isValidPlay(card)) {
      setTopCard(card);
      const newHand = [...playerHand];
      newHand.splice(index, 1);
      setPlayerHand(newHand);
      
      if (newHand.length === 0) {
        setWinner('player');
        setMessage(t('game.uno.msg.win'));
        return;
      }
      
      const nextTurn = processAction(card, 'player');
      setTurn(nextTurn);
      
      if (nextTurn === 'cpu' && card.action === 'normal') {
        setMessage(t('game.uno.msg.opposition'));
      }
    } else {
      setMessage(t('game.uno.msg.error'));
    }
  };

  const drawCard = () => {
    if (turn !== 'player' || winner) return;
    setPlayerHand([...playerHand, generateCard()]);
    setTurn('cpu');
    setMessage(t('game.uno.msg.draw'));
  };

  useEffect(() => {
    if (turn === 'cpu' && !winner) {
      const cpuTurn = setTimeout(() => {
        const validIndex = cpuHand.findIndex(isValidPlay);
        if (validIndex !== -1) {
          const cardToPlay = cpuHand[validIndex];
          setTopCard(cardToPlay);
          const newHand = [...cpuHand];
          newHand.splice(validIndex, 1);
          setCpuHand(newHand);
          
          if (newHand.length === 0) {
            setWinner('cpu');
            setMessage(t('game.uno.msg.lose'));
          } else {
            const nextTurn = processAction(cardToPlay, 'cpu');
            setTurn(nextTurn);
            if (nextTurn === 'player' && cardToPlay.action === 'normal') {
               setMessage(t('game.uno.msg.cpu_play'));
            }
          }
        } else {
          setCpuHand([...cpuHand, generateCard()]);
          setMessage(t('game.uno.msg.cpu_draw'));
          setTurn('player');
        }
      }, 2000);
      return () => clearTimeout(cpuTurn);
    }
  }, [turn, cpuHand, winner]);

  const CardView = ({ card, onClick, hidden = false }: { key?: string | number, card: Card, onClick?: () => void, hidden?: boolean }) => (
    <div 
      onClick={onClick}
      className={cn(
        "w-16 h-24 md:w-20 md:h-32 rounded-lg border-2 border-white flex flex-col items-center justify-center p-2 text-white font-bold cursor-pointer transition-transform hover:-translate-y-2 relative overflow-hidden shrink-0",
        hidden ? "bg-gray-800 border-gray-500" : colorStyles[card.color]
      )}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
      {!hidden && (
        <>
          <span className="absolute top-1 left-2 text-[8px] md:text-xs">
            {card.action === 'moche' ? t('game.uno.action.moche') : card.action === 'fuero' ? t('game.uno.action.fuero') : card.action === 'alianza' ? t('game.uno.action.alliance') : ''}
          </span>
          <span className="text-xl md:text-3xl filter drop-shadow-md z-10">{card.value}</span>
        </>
      )}
      {hidden && <span className="text-xl">?</span>}
    </div>
  );

  return (
    <div className="flex flex-col items-center max-w-full font-[var(--font-pixel)] text-[10px] md:text-xs text-white">
      <div className="mb-2 text-center w-full">
         <p className="text-[#8a63d2]">{t('game.objective')}{t('game.uno.goal')}</p>
      </div>
      <p className="mb-4 h-8 text-center text-brand-accent max-w-xs">{message}</p>
      
      {/* CPU Hand */}
      <div className="flex gap-[-20px] mb-8 justify-center crt bg-[#090b11] p-4 rounded-xl border border-[#222] max-w-full overflow-x-auto w-[90vw] md:w-full">
        <div className="flex -space-x-8 md:-space-x-4">
          {cpuHand.map((c) => (
             <CardView key={c.id} card={c} hidden={true} />
          ))}
        </div>
      </div>

      {/* Play Area */}
      <div className="flex items-center justify-center gap-8 mb-8 my-4 w-full">
        <div className="flex flex-col items-center gap-2">
           <p className="text-gray-500">{t('game.uno.label.deck')}</p>
           <button 
             onClick={drawCard}
             disabled={turn !== 'player' || !!winner}
             className="w-16 h-24 md:w-20 md:h-32 bg-[#0a0a0a] border-2 border-[#333] rounded-lg flex items-center justify-center hover:bg-[#111] hover:border-[#444] transition-colors disabled:opacity-50 text-[8px] md:text-[10px]"
           >
             {t('game.uno.label.draw')}
           </button>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-500">{t('game.uno.label.pile')}</p>
          {topCard && <CardView card={topCard} />}
        </div>
      </div>

      {/* Player Hand */}
      <div className="flex flex-col items-center w-full mt-4 max-w-full">
        <p className="text-gray-500 mb-2">{t('game.uno.label.hand')}</p>
        <div className="flex space-x-2 md:space-x-4 max-w-full overflow-x-auto p-4 bg-[#090b11] rounded-xl border border-[#222] w-[90vw] md:w-full">
          {playerHand.map((card, i) => (
            <CardView 
              key={card.id} 
              card={card} 
              onClick={() => playCard(i)} 
            />
          ))}
        </div>
      </div>

      {winner && (
        <button
          onClick={initGame}
          className="mt-8 bg-brand-accent text-white px-6 py-3 uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
        >
          {t('game.uno.label.reset')}
        </button>
      )}
    </div>
  );
}
