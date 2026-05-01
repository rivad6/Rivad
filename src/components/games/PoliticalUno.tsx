import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Handshake, 
  Coins, 
  ArrowLeftRight, 
  UserRound, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Megaphone,
  Fingerprint,
  Star,
  Paintbrush,
  HelpCircle,
  BookOpen,
  PlusCircle,
  ShieldAlert,
  RefreshCw,
  Users
} from 'lucide-react';
import { FullscreenButton } from '../ui/FullscreenButton';

type Color = 'rojo' | 'azul' | 'guinda' | 'naranja' | 'black';
type SpecialAction = 'moche' | 'fuero' | 'alianza' | 'dedazo' | 'fake_news' | 'consulta' | 'guerra_sucia' | 'voto_por_voto' | 'normal';
type Card = { 
  color: Color; 
  value: number | string; 
  id: string; 
  action: SpecialAction;
  partyNameKey?: string;
};

export function PoliticalUno({ isPausedGlobal = false, hideFullscreenButton = false }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean }) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hands, setHands] = useState<Card[][]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [playerCount, setPlayerCount] = useState(4);
  const [turn, setTurn] = useState(0); // Index of the current player (0 is the human)
  const [message, setMessage] = useState(t('game.uno.msg.start'));
  const [winner, setWinner] = useState<number | null>(null);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const [isChoosingColor, setIsChoosingColor] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const cardGuide = [
    {
      action: 'moche',
      icon: PlusCircle,
      es: 'Moche: +2 al siguiente.',
      en: 'Bribe: +2 to next.',
      pt: 'Suborno: +2 ao próximo.'
    },
    {
      action: 'fuero',
      icon: ShieldAlert,
      es: 'Fuero: Salta turno.',
      en: 'Immunity: Skip turn.',
      pt: 'Imunidade: Pula o turno.'
    },
    {
      action: 'alianza',
      icon: RefreshCw,
      es: 'Alianza: Cambia dirección.',
      en: 'Alliance: Reverse dir.',
      pt: 'Aliança: Inverte direção.'
    },
    {
      action: 'fake_news',
      icon: AlertTriangle,
      es: 'Fake News: +4 y color.',
      en: 'Fake News: +4 & color.',
      pt: 'Fake News: +4 e cor.'
    },
    {
      action: 'consulta',
      icon: Users,
      es: 'Consulta: Todos +1 carta.',
      en: 'Referendum: All +1 card.',
      pt: 'Consulta: Todos +1 carta.'
    },
    {
      action: 'dedazo',
      icon: CheckCircle2,
      es: 'Dedazo: Cambia el color.',
      en: 'Handpick: Change color.',
      pt: 'Indicação: Muda a cor.'
    },
    {
      action: 'guerra_sucia',
      icon: ArrowLeftRight,
      es: 'Guerra Sucia: Cambia manos.',
      en: 'Dirty War: Swap hands.',
      pt: 'Guerra Suja: Troca mãos.'
    },
    {
      action: 'voto_por_voto',
      icon: Megaphone,
      es: 'Voto x Voto: Reinicia a 7.',
      en: 'Vote x Vote: Reset to 7.',
      pt: 'Voto x Voto: Reinicia a 7.'
    }
  ];

  const playerNames = useMemo(() => [
    t('game.uno.label.power'), // Player 0
    t('game.uno.label.opposition') + ' A', 
    t('game.uno.label.opposition') + ' B', 
    t('game.uno.label.opposition') + ' C'
  ], [t]);

  // Cabinet Button Support
  useEffect(() => {
    if (isPausedGlobal || winner !== null || isChoosingColor || turn !== 0 || !isGameStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const cardCount = hands[0]?.length || 0;
      if (cardCount === 0) return;

      if (e.key === 'ArrowLeft') {
        setFocusedCardIndex(prev => (prev - 1 + cardCount) % cardCount);
        playSound('hover');
      } else if (e.key === 'ArrowRight') {
        setFocusedCardIndex(prev => (prev + 1) % cardCount);
        playSound('hover');
      } else if (e.key === ' ' || e.key === 'Enter') {
        playCard(focusedCardIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCardIndex, hands, winner, isChoosingColor, turn, isPausedGlobal, isGameStarted]);

  useEffect(() => {
    if (!winner) {
      playMusic('uno');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [winner, playMusic]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 2500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const [direction, setDirection] = useState(1); // 1 for clockwise, -1 for reverse

  const colors: Color[] = ['rojo', 'azul', 'guinda', 'naranja'];
  
  const colorStyles: Record<Color, string> = {
    rojo: 'from-red-500 to-red-800 border-red-400',
    azul: 'from-blue-500 to-blue-800 border-blue-400',
    guinda: 'from-[#732021] to-[#4a1415] border-[#a12d2f]',
    naranja: 'from-orange-400 to-orange-700 border-orange-300',
    black: 'from-zinc-800 to-black border-zinc-600'
  };

  const getPartyKey = (color: Color) => {
    switch(color) {
      case 'rojo': return 'game.uno.party.red';
      case 'azul': return 'game.uno.party.blue';
      case 'guinda': return 'game.uno.party.guinda';
      case 'naranja': return 'game.uno.party.orange';
      default: return '';
    }
  };

  const generateCard = useCallback((forceColor?: Color): Card => {
    const isSpecial = Math.random() > 0.7;
    const color = forceColor || colors[Math.floor(Math.random() * colors.length)];
    
    if (isSpecial) {
      const actions: SpecialAction[] = ['moche', 'fuero', 'alianza', 'fake_news', 'consulta', 'dedazo', 'guerra_sucia', 'voto_por_voto'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      // Dedazo, Fake News, Guerra Sucia, Voto por Voto are wild (black)
      const isWild = ['dedazo', 'fake_news', 'guerra_sucia', 'voto_por_voto'].includes(action);
      const finalColor = isWild ? 'black' : color;
      
      return {
        color: finalColor,
        value: action === 'moche' ? '+2' : action === 'fake_news' ? '+4' : '★',
        id: crypto.randomUUID(),
        action,
        partyNameKey: isWild ? undefined : getPartyKey(finalColor)
      };
    }

    return {
      color,
      value: Math.floor(Math.random() * 9) + 1,
      id: crypto.randomUUID(),
      action: 'normal',
      partyNameKey: getPartyKey(color)
    };
  }, []);

  const initGame = (count: number = 4) => {
    setPlayerCount(count);
    const initialHands = Array.from({ length: count }, () => 
      Array(7).fill(null).map(() => generateCard())
    );
    setHands(initialHands);
    
    let initialTop = generateCard();
    while (initialTop.action !== 'normal') {
      initialTop = generateCard();
    }
    setTopCard(initialTop);
    setTurn(0);
    setWinner(null);
    setDirection(1);
    setIsChoosingColor(false);
    setIsGameStarted(true);
    setMessage(t('game.uno.msg.turn'));
  };

  useEffect(() => {
    // Game will start via start screen
  }, []);

  const isValidPlay = (card: Card) => {
    if (!topCard) return true;
    
    // Wild cards (black) can always be played
    if (card.color === 'black') return true;
    
    // If top card is black, any card can be played (usually selection happens first, but as a safety)
    if (topCard.color === 'black') return true;

    // Match by color
    if (card.color === topCard.color) return true;
    
    // Match by special action (symbol/figure) - only if not normal cards
    if (card.action !== 'normal' && card.action === topCard.action) return true;
    
    // Match by value (for normal cards)
    if (card.action === 'normal' && topCard.action === 'normal' && card.value === topCard.value) return true;

    return false;
  };

  const [activePopup, setActivePopup] = useState<SpecialAction | null>(null);

  useEffect(() => {
    if (activePopup) {
      playSound('score');
      const timer = setTimeout(() => setActivePopup(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [activePopup, playSound]);

  const [isSwapping, setIsSwapping] = useState(false);
  
  const getNextTurn = (current: number, skip: number = 1) => {
    return (current + (direction * skip) + playerCount) % playerCount;
  };

  const processAction = (card: Card, currentPlayerIndex: number) => {
    if (card.action !== 'normal') {
      setActivePopup(card.action);
    }
    
    let nextIndex = getNextTurn(currentPlayerIndex);
    const setHand = (idx: number, updater: (h: Card[]) => Card[]) => {
      setHands(prev => {
        const next = [...prev];
        next[idx] = updater(next[idx]);
        return next;
      });
    };

    switch (card.action) {
      case 'moche':
        setMessage(t('game.uno.msg.moche.win'));
        setHand(nextIndex, prev => [...prev, generateCard(), generateCard()]);
        return getNextTurn(nextIndex); // Skip next player
      case 'fuero':
        setMessage(t('game.uno.msg.fuero.win'));
        return getNextTurn(nextIndex); // Skip next player
      case 'alianza':
        setMessage(t('game.uno.msg.alliance'));
        setDirection(prev => prev * -1);
        // In 4p, reverse just changes direction, doesn't skip immediately
        return (currentPlayerIndex + (-direction) + playerCount) % playerCount; 
      case 'fake_news':
        setMessage(t('game.uno.msg.fake_news'));
        setHand(nextIndex, prev => [...prev, generateCard(), generateCard(), generateCard(), generateCard()]);
        if (currentPlayerIndex === 0) {
          setIsChoosingColor(true);
        } else {
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setTopCard(prev => prev ? { ...prev, color: randomColor } : null);
        }
        return getNextTurn(nextIndex); // Skip next player
      case 'consulta':
        setMessage(t('game.uno.msg.consulta'));
        for (let i = 0; i < playerCount; i++) {
          if (i !== currentPlayerIndex) {
            setHand(i, prev => [...prev, generateCard()]);
          }
        }
        return nextIndex;
      case 'dedazo':
        setMessage(t('game.uno.msg.dedazo'));
        if (currentPlayerIndex === 0) {
          setIsChoosingColor(true);
        } else {
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setTopCard(prev => prev ? { ...prev, color: randomColor } : null);
        }
        return nextIndex;
      case 'guerra_sucia':
        setMessage(t('game.uno.msg.guerra_sucia'));
        setIsSwapping(true);
        setTimeout(() => {
          setHands(prevHands => {
            const nextHands = [...prevHands];
            // Find player with least cards (excluding self)
            let targetIdx = -1;
            let minCards = 999;
            for (let i = 0; i < playerCount; i++) {
              if (i !== currentPlayerIndex && nextHands[i].length < minCards) {
                minCards = nextHands[i].length;
                targetIdx = i;
              }
            }
            if (targetIdx !== -1) {
              const temp = [...nextHands[currentPlayerIndex]];
              nextHands[currentPlayerIndex] = [...nextHands[targetIdx]];
              nextHands[targetIdx] = temp;
            }
            return nextHands;
          });
          setIsSwapping(false);
          if (currentPlayerIndex === 0) setIsChoosingColor(true);
          else {
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            setTopCard(prev => prev ? { ...prev, color: randomColor } : null);
            setTurn(getNextTurn(currentPlayerIndex));
          }
        }, 1000);
        return currentPlayerIndex; // Human turn state waits for color choice; CPU waits for timeout
      case 'voto_por_voto':
        setMessage(t('game.uno.msg.voto_por_voto'));
        setHands(prev => prev.map(() => Array(7).fill(null).map(() => generateCard())));
        if (currentPlayerIndex === 0) {
          setIsChoosingColor(true);
          return currentPlayerIndex;
        } else {
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setTopCard(prev => prev ? { ...prev, color: randomColor } : null);
          return getNextTurn(nextIndex); // Skip next player
        }
      default:
        return nextIndex;
    }
  };

  const playCard = (index: number) => {
    if (!isGameStarted || turn !== 0 || winner !== null || isChoosingColor || isPausedGlobal) return;
    const card = hands[0][index];
    
    if (isValidPlay(card)) {
      playSound('click');
      setTopCard(card);
      const newHand = [...hands[0]];
      newHand.splice(index, 1);
      setHands(prev => {
        const next = [...prev];
        next[0] = newHand;
        return next;
      });
      
      if (newHand.length === 0) {
        setWinner(0);
        playSound('win');
        unlockAchievement('dictator');
        setMessage(t('game.uno.msg.win'));
        return;
      }
      
      const nextTurn = processAction(card, 0);
      const isBlack = ['dedazo', 'fake_news', 'guerra_sucia', 'voto_por_voto'].includes(card.action);
      if (!isBlack) {
        setTurn(nextTurn);
      }
    } else {
      playSound('alert');
      setMessage(t('game.uno.msg.error'));
    }
  };

  const handleColorChoice = (color: Color) => {
    playSound('click');
    if (!topCard) return;
    setTopCard({ ...topCard, color });
    setIsChoosingColor(false);
    
    // Most wild cards skip the next turn or lead to a specific turn state
    const nextIdx = getNextTurn(0);
    if (topCard.action === 'fake_news' || topCard.action === 'voto_por_voto') {
      setTurn(getNextTurn(nextIdx)); // Skip next player
    } else {
      setTurn(nextIdx);
    }
  };

  const drawCard = () => {
    playSound('hover');
    if (!isGameStarted || turn !== 0 || winner !== null || isChoosingColor || isPausedGlobal) return;
    const newCard = generateCard();
    setHands(prev => {
      const next = [...prev];
      next[0] = [...next[0], newCard];
      return next;
    });
    setMessage(t('game.uno.msg.draw'));
    setTurn(getNextTurn(0));
  };

  useEffect(() => {
    if (turn !== 0 && winner === null && !isPausedGlobal && isGameStarted && !isChoosingColor) {
      const cpuTurnTimer = setTimeout(() => {
        const currentCpuHand = hands[turn];
        if (!currentCpuHand) return;

        let validIndices = currentCpuHand.map((c, i) => isValidPlay(c) ? i : -1).filter(i => i !== -1);
        
        if (validIndices.length > 0) {
          // Priority: Specials if player 0 is low on cards, or if current bot is low
          let targetIndex = validIndices[0];
          const humanHandSize = hands[0].length;
          
          if (humanHandSize <= 3) {
            const aggro = validIndices.find(i => hands[turn][i].action === 'moche' || hands[turn][i].action === 'fake_news');
            if (aggro !== undefined) targetIndex = aggro;
          } else {
            const normal = validIndices.find(i => hands[turn][i].action === 'normal');
            if (normal !== undefined) targetIndex = normal;
          }

          const cardToPlay = hands[turn][targetIndex];
          setTopCard(cardToPlay);
          
          setHands(prev => {
            const next = [...prev];
            const nextHand = [...next[turn]];
            nextHand.splice(targetIndex, 1);
            next[turn] = nextHand;
            return next;
          });
          
          if (hands[turn].length === 1) { // checking length before splice technically, but state updates later
             // They win!
          }

          const nextHandLength = hands[turn].length - 1;
          if (nextHandLength === 0) {
            setWinner(turn);
            playSound('lose');
            setMessage(t('game.uno.msg.lose'));
          } else {
            playSound('click');
            const nextTurn = processAction(cardToPlay, turn);
            setTurn(nextTurn);
          }
        } else {
          playSound('hover');
          setHands(prev => {
            const next = [...prev];
            next[turn] = [...next[turn], generateCard()];
            return next;
          });
          setMessage(playerNames[turn] + " " + t('game.uno.msg.draw'));
          setTurn(getNextTurn(turn));
        }
      }, 1500);
      return () => clearTimeout(cpuTurnTimer);
    }
  }, [turn, hands, winner, topCard, isPausedGlobal, isGameStarted]);

  const CardIcon = ({ action }: { action: SpecialAction }) => {
    const iconClass = isFullscreen ? "w-6 h-6 md:w-8 md:h-8" : "w-4 h-4";
    switch (action) {
      case 'moche': return <Coins className={iconClass} />;
      case 'fuero': return <Shield className={iconClass} />;
      case 'alianza': return <Handshake className={iconClass} />;
      case 'dedazo': return <Fingerprint className={iconClass} />;
      case 'fake_news': return <Megaphone className={iconClass} />;
      case 'consulta': return <AlertTriangle className={iconClass} />;
      case 'guerra_sucia': return <ArrowLeftRight className={cn(iconClass, "text-red-500")} />;
      case 'voto_por_voto': return <Star className={cn(iconClass, "text-yellow-500 animate-[spin_3s_linear_infinite]")} />;
      default: return null;
    }
  };

  const CardView = ({ card, onClick, hidden = false, isSelected = false }: { key?: string | number, card: Card, onClick?: () => void, hidden?: boolean, isSelected?: boolean }) => (
    <motion.div 
      layout
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      whileHover={!hidden ? { scale: 1.05, y: -10, zIndex: 50 } : {}}
      onClick={onClick}
      className={cn(
        "rounded-xl border-t-2 border-l-2 flex flex-col items-center justify-between p-2 text-white font-bold cursor-pointer transition-all relative overflow-hidden shrink-0 shadow-xl",
        isFullscreen ? "w-16 h-24 md:w-24 md:h-36 md:p-3" : "w-12 h-16 sm:w-14 sm:h-20 text-[8px]",
        hidden ? "bg-zinc-900 border-zinc-700" : `bg-gradient-to-br ${colorStyles[card.color]}`,
        isSelected && "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
      )}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {!hidden ? (
        <>
          <div className="w-full flex justify-between items-start">
            <span className={cn("text-[10px]", isFullscreen && "md:text-sm")}>{card.value}</span>
            {card.action !== 'normal' && <span className="opacity-50"><AlertTriangle className="w-3 h-3" /></span>}
          </div>
          
          <div className="flex flex-col items-center gap-1 opacity-90">
             {card.action === 'normal' ? (
                <span className={cn("font-display font-medium", isFullscreen ? "text-2xl md:text-5xl" : "text-xl")}>{card.value}</span>
             ) : (
                <CardIcon action={card.action} />
             )}
             {card.partyNameKey && (
               <span className={cn("uppercase tracking-tighter opacity-70 text-center", isFullscreen ? "text-[6px] md:text-[8px]" : "text-[5px]")}>
                 {t(card.partyNameKey)}
               </span>
             )}
          </div>

          <div className="w-full flex justify-end items-end rotate-180">
            <span className={cn("text-[10px]", isFullscreen && "md:text-sm")}>{card.value}</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full border-2 border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-800/10">
          <UserRound className="w-8 h-8 md:w-12 md:h-12 text-zinc-700 opacity-30" />
        </div>
      )}
    </motion.div>
  );

  return (
    <div ref={containerRef} className={cn(
      "flex flex-col items-center h-full min-h-[450px] md:min-h-[600px] w-full max-w-7xl mx-auto font-[var(--font-mono)] text-[10px] md:text-xs text-white pt-2 pb-8 relative overflow-y-auto custom-scrollbar bg-[#0a0a0A]",
      isFullscreen && "bg-black pb-4 text-xs md:text-sm overflow-hidden"
    )}>
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2 z-50" />}

      {/* Start Screen */}
      <AnimatePresence>
        {!isGameStarted && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
            className="absolute inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm backdrop-blur-3xl p-6"
          >
            <div className="mb-8 text-center relative group">
              <Megaphone className="w-16 h-16 text-brand-accent mx-auto mb-4 group-hover:scale-110 transition-transform" />
              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[4px_4px_0_#991b1b]">POLITICAL UNO</h1>
              <p className="text-zinc-500 text-xs md:text-sm tracking-widest uppercase mt-2">Selecciona el número de legisladores</p>
              <div className="absolute top-0 right-0 -mr-4 -mt-2 rotate-12 bg-red-600 text-white text-[8px] px-2 py-1 font-bold shadow-lg border border-red-400">BY RIVAD</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {[2, 3, 4].map(count => (
                <button
                  key={count}
                  aria-label={`${count} Players`}
                  onClick={() => initGame(count)}
                  className="bg-zinc-900 hover:bg-brand-accent transition-all p-4 rounded-xl border border-white/5 flex flex-col items-center gap-2 group"
                >
                  <Users className="w-6 h-6 text-zinc-500 group-hover:text-white" />
                  <span className="text-xl font-black">{count}</span>
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600 group-hover:text-white/50">Players</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Pause Overlay */}
      <AnimatePresence>
        {isPausedGlobal && !winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-4 text-center p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Megaphone className="w-10 h-10 md:w-12 md:h-12 text-brand-accent animate-bounce" />
              <h2 className="text-white font-black text-xl md:text-2xl uppercase tracking-[0.3em]">
                {t('game.paused.system', 'SESSION SUSPENDED')}
              </h2>
            </div>
            <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-bold text-center px-4 md:px-16 leading-relaxed max-w-xs">
              {t('game.paused.desc', 'The legislative chamber is closed for maintenance.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] overflow-hidden [&.is-fullscreen]:hidden">
        <Fingerprint className="absolute -top-10 -left-10 w-48 h-48 md:w-96 md:h-96 rotate-12" />
        <Megaphone className="absolute -bottom-10 -right-10 w-40 h-40 md:w-80 md:h-80 -rotate-12" />
      </div>

      {/* HUD Header */}
      <div className="mb-2 md:mb-4 flex flex-col items-center gap-1 w-full max-w-2xl px-4 relative z-10 shrink-0">
          <h2 className="text-xl md:text-3xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2 group">
            <Megaphone className="text-brand-accent h-5 w-5 md:h-8 md:w-8 group-hover:rotate-12 transition-transform" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">Legislative UNO</span>
          </h2>
      </div>

      {/* Card Guide Toggle Button */}
      <div className="absolute top-4 right-4 z-[70]">
        <button
          aria-label="Toggle Card Guide"
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="bg-zinc-900/80 p-2 rounded-full border border-white/10 hover:border-brand-accent transition-colors shadow-xl"
          title="Card Guide / Guía de Cartas"
        >
          <HelpCircle className={cn("w-5 h-5", isGuideOpen ? "text-brand-accent" : "text-zinc-500")} />
        </button>
      </div>

      {/* Trilingual Card Guide Side-over */}
      <AnimatePresence>
        {isGuideOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="fixed right-4 top-16 bottom-20 w-64 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-2xl z-[65] shadow-2xl p-4 overflow-y-auto scrollbar-hide"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <BookOpen className="w-4 h-4 text-brand-accent" />
              <h3 className="text-xs font-black uppercase tracking-tighter text-white">Manual Legislativo</h3>
            </div>
            <div className="space-y-4">
              {cardGuide.map((item) => (
                <div key={item.action} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3 h-3 text-brand-accent" />
                    <span className="text-[10px] font-bold text-brand-accent uppercase">{item.action.replace('_', ' ')}</span>
                  </div>
                  <div className="pl-5 flex flex-col gap-0.5">
                    <p className="text-[9px] text-white/90 leading-tight">{item.es}</p>
                    <p className="text-[8px] text-zinc-400 italic leading-tight">{item.en}</p>
                    <p className="text-[8px] text-zinc-500 leading-tight">{item.pt}</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              aria-label="Close Guide"
              onClick={() => setIsGuideOpen(false)}
              className="mt-6 w-full py-2 bg-zinc-900 rounded-lg text-[9px] font-black uppercase text-zinc-500 hover:text-white transition-colors border border-white/5"
            >
              Cerrar / Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Table Arena */}
      {isGameStarted && (
        <div className="flex flex-col items-center w-full relative z-10 flex-grow py-2 px-4 justify-between md:justify-center min-h-[450px]">
          
          {/* TOP Player */}
          <div className="w-full flex justify-center mt-6 md:mb-4">
             {playerCount >= 2 && hands[playerCount === 2 ? 1 : 2] && (
               <div className={cn(
                 "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                 turn === (playerCount === 2 ? 1 : 2) ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-500/10" : "border-white/5 opacity-60"
               )}>
                  <span className="text-[8px] uppercase font-bold text-zinc-400">{playerNames[playerCount === 2 ? 1 : 2]}</span>
                  <div className="flex -space-x-4">
                     {hands[playerCount === 2 ? 1 : 2].slice(0, 5).map(c => <div key={c.id} className="w-6 h-9 bg-zinc-900 border border-white/10 rounded shadow-md" />)}
                     {hands[playerCount === 2 ? 1 : 2].length > 5 && <div className="w-6 h-9 flex items-center justify-center text-[8px] font-black">+ {hands[playerCount === 2 ? 1 : 2].length - 5}</div>}
                  </div>
               </div>
             )}
          </div>

          <div className="flex items-center justify-between w-full max-w-5xl gap-2 md:gap-4">
            {/* LEFT Player */}
            <div className="w-12 sm:w-16 md:w-24">
              {playerCount >= 3 && hands[1] && (
                <div className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  turn === 1 ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-500/10" : "border-white/5 opacity-60"
                )}>
                    <span className="text-[8px] uppercase font-bold text-zinc-400 rotate-90 mb-4">{playerNames[1]}</span>
                    <div className="flex flex-col -space-y-4 md:-space-y-6">
                      {hands[1].slice(0, 4).map(c => <div key={c.id} className="w-6 h-8 md:w-8 md:h-12 bg-zinc-900 border border-white/10 rounded shadow-md" />)}
                      {hands[1].length > 4 && <div className="text-[8px] font-black text-center">+ {hands[1].length - 4}</div>}
                    </div>
                </div>
              )}
            </div>

            {/* Central Arena */}
            <div className={cn("relative flex flex-row items-center justify-center gap-1 sm:gap-2 md:gap-8 w-full max-w-full", isFullscreen ? "min-h-[140px] md:min-h-[200px]" : "min-h-[100px] sm:min-h-[120px]")}>
               {/* Direction Indicator */}
               <motion.div 
                 animate={{ rotate: direction === 1 ? 360 : -360 }}
                 transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
               >
                 <ArrowLeftRight className="w-20 h-20 md:w-32 md:h-32" />
               </motion.div>

               {/* Deck */}
               <button 
                 aria-label={t('game.uno.label.draw')}
                 onClick={drawCard}
                 disabled={turn !== 0 || winner !== null || isChoosingColor}
                 className={cn(
                   "bg-zinc-900 border shadow-2xl rounded-lg flex flex-col items-center justify-center transition-all",
                   isFullscreen ? "w-16 h-24 md:w-20 md:h-32" : "w-12 h-16 sm:w-14 sm:h-20",
                   turn === 0 ? "border-brand-accent/50 cursor-pointer hover:-translate-y-1" : "border-zinc-800 opacity-50"
                 )}
               >
                 <Coins className={cn("w-6 h-6", turn === 0 && "text-brand-accent")} />
                 <span className="text-[7px] font-black uppercase text-zinc-500 mt-2">{t('game.uno.label.draw')}</span>
               </button>

               {/* Discard Pile */}
               <div className="relative">
                  <AnimatePresence mode="wait">
                    {topCard && (
                      <motion.div
                        key={topCard.id}
                        initial={{ scale: 0.5, rotate: direction === 1 ? -15 : 15, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        className="relative z-10"
                      >
                        <CardView card={topCard} />
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Special Action Overlay */}
               <AnimatePresence>
                 {isSwapping && (
                   <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="absolute inset-0 z-[60] flex items-center justify-center bg-red-950/40 backdrop-blur-sm pointer-events-none"
                   >
                     <motion.div 
                       animate={{ rotate: 360 }}
                       transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                     >
                       <ArrowLeftRight className="w-16 h-16 md:w-32 md:h-32 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]" />
                     </motion.div>
                   </motion.div>
                 )}
                 {activePopup && (
                   <motion.div
                     initial={{ opacity: 0, scale: 0.5, y: 50 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                     transition={{ type: "spring", damping: 12, stiffness: 200 }}
                     className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none p-4"
                   >
                     <div className="bg-[#0a0a0A]/90 backdrop-blur-md px-6 md:px-12 py-4 md:py-8 rounded-3xl md:rounded-full border border-brand-accent shadow-[0_0_100px_rgba(138,99,210,0.8)] flex flex-col items-center gap-2 md:gap-4 text-center">
                       <div className="text-brand-accent">
                         <CardIcon action={activePopup} />
                       </div>
                       <h1 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-brand-accent !not-italic">
                         {activePopup.replace('_', ' ')}
                       </h1>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Active Action Message Overlay */}
               <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 pointer-events-none z-50 w-full flex justify-center">
                    <AnimatePresence mode="wait">
                      {message ? (
                        <motion.div 
                          key={message}
                          initial={{ opacity: 0, scale: 1.2, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className={cn(
                            "bg-black/90 backdrop-blur-sm backdrop-blur-xl px-4 md:px-6 py-2 md:py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-2 md:gap-3 min-w-[150px] md:min-w-[200px] justify-center transition-colors shadow-[0_0_30px_rgba(0,0,0,0.8)]",
                            turn === 0 ? "text-brand-accent ring-1 ring-brand-accent/30" : "text-red-400 ring-1 ring-red-500/30"
                          )}
                        >
                          {turn === 0 ? <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" /> : <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />}
                          <span className="text-[8px] md:text-xs uppercase font-black tracking-widest text-center">{message}</span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
               </div>
            </div>

            {/* RIGHT Player */}
            <div className="w-12 sm:w-16 md:w-24">
              {playerCount >= 4 && hands[3] && (
                <div className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all",
                  turn === 3 ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-500/10" : "border-white/5 opacity-60"
                )}>
                    <span className="text-[8px] uppercase font-bold text-zinc-400 -rotate-90 mb-4">{playerNames[3]}</span>
                    <div className="flex flex-col -space-y-4 md:-space-y-6">
                      {hands[3].slice(0, 4).map(c => <div key={c.id} className="w-6 h-8 md:w-8 md:h-12 bg-zinc-900 border border-white/10 rounded shadow-md" />)}
                      {hands[3].length > 4 && <div className="text-[8px] font-black text-center">+ {hands[3].length - 4}</div>}
                    </div>
                </div>
              )}
            </div>
        </div>

        {/* Player Hand (Bottom) */}
        <div className={cn(
          "flex flex-col items-center gap-1 bg-white/[0.03] p-2 md:p-4 rounded-2xl md:rounded-3xl border transition-all w-full max-w-5xl mx-auto mt-auto mb-2 shrink-0 h-fit",
          turn === 0 && !isChoosingColor ? "border-brand-accent/30 shadow-[0_0_30px_rgba(138,99,210,0.1)] mb-4" : "border-white/5 opacity-80"
        )}>
          <div className="flex items-center justify-between w-full px-4 mb-1">
             <span className="text-[10px] font-black uppercase text-brand-accent flex items-center gap-2">
               <UserRound size={12} />
               {playerNames[0]}
             </span>
             <span className="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded text-[8px] font-bold">
               {hands[0]?.length || 0} {t('game.uno.label.cards')}
             </span>
          </div>
          <div className="flex -space-x-8 sm:-space-x-10 md:-space-x-12 hover:-space-x-2 sm:hover:-space-x-4 transition-all duration-300 w-full overflow-x-auto scrollbar-hide py-2 px-2 min-h-[90px] md:min-h-[140px] items-center justify-center">
            <AnimatePresence>
              {hands[0]?.map((card, i) => (
                <CardView 
                  key={card.id}
                  card={card} 
                  onClick={() => playCard(i)} 
                  isSelected={turn === 0 && focusedCardIndex === i}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    )}

      {/* Wild Card Color Choice Overlay */}
      <AnimatePresence>
        {isChoosingColor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <div className="flex flex-col items-center gap-4 md:gap-8 p-6 md:p-12 bg-zinc-950 border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl max-w-lg w-full">
              <div className="text-center">
                <h3 className="text-lg md:text-2xl font-black italic text-white uppercase mb-1 md:mb-2">{t('game.uno.label.wild_title')}</h3>
                <p className="text-zinc-500 text-[10px] md:text-xs tracking-widest uppercase">{t('game.uno.label.wild_desc')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
                {colors.map(color => (
                  <motion.button
                    aria-label={`Select color ${color}`}
                    key={color}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColorChoice(color)}
                    className={cn(
                      "group relative h-16 md:h-20 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 md:gap-2 transition-all overflow-hidden border-2 border-white/5",
                      `bg-gradient-to-br ${colorStyles[color]}`
                    )}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest drop-shadow-md text-center px-2">{t(getPartyKey(color))}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win/Loss Overlay */}
      <AnimatePresence>
        {winner !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100, rotate: -10 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              className="flex flex-col items-center gap-4 md:gap-10 p-4 md:p-12 text-center relative"
            >
              {/* Retro background flair */}
              <div className="absolute inset-0 bg-brand-accent/5 blur-[80px] md:blur-[120px] rounded-full animate-pulse" />
              
              {winner === 0 ? (
                <>
                  <div className="relative">
                    <CheckCircle2 className="w-24 h-24 md:w-40 md:h-40 text-brand-accent animate-[bounce_2s_infinite]" />
                    <Star className="absolute -top-2 -right-2 md:-top-4 md:-right-4 w-8 h-8 md:w-12 md:h-12 text-white animate-spin" />
                  </div>
                  <div className="space-y-2 md:space-y-4 relative">
                    <h3 className="text-3xl md:text-8xl font-black italic text-white uppercase tracking-tighter leading-none">
                      {t('game.uno.label.win_title')}
                    </h3>
                    <p className="text-zinc-400 max-w-xs md:max-w-md mx-auto uppercase tracking-[0.2em] md:tracking-[0.3em] font-black italic text-[8px] md:text-xs leading-relaxed">
                      {t('game.uno.msg.win')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <XCircle className="w-24 h-24 md:w-40 md:h-40 text-red-500/30 animate-pulse" />
                    <AlertTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 text-red-500" />
                  </div>
                  <div className="space-y-2 md:space-y-4 relative">
                    <h1 className="text-[12px] font-black text-brand-accent mb-2">{playerNames[winner]} WON!</h1>
                    <h3 className="text-3xl md:text-8xl font-black italic text-zinc-800 uppercase tracking-tighter leading-none">
                      {t('game.uno.label.lose_title')}
                    </h3>
                    <p className="text-red-500/50 max-w-xs md:max-w-md mx-auto uppercase tracking-[0.2em] md:tracking-[0.3em] font-black italic text-[8px] md:text-xs leading-relaxed">
                      {t('game.uno.msg.lose')}
                    </p>
                  </div>
                </>
              )}
              
              <motion.button
                aria-label={t('game.uno.label.reset_btn')}
                whileHover={{ scale: 1.1, backgroundColor: '#fff', color: '#000' }}
                whileTap={{ scale: 0.9 }}
                onClick={(e:any) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
                onTouchEnd={(e:any) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
                className="mt-4 md:mt-8 bg-zinc-900 text-white px-8 md:px-16 py-3 md:py-5 font-black uppercase text-[10px] md:text-base tracking-[0.2em] md:tracking-[0.4em] transition-all rounded-full border border-white/10 flex items-center gap-2 md:gap-3 shadow-2xl relative z-50 cursor-pointer pointer-events-auto"
              >
                <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5" />
                {t('game.uno.label.reset_btn')}
              </motion.button>
              
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-screen overflow-hidden opacity-5 pointer-events-none text-[150px] font-black whitespace-nowrap italic uppercase">
                 CORRUPCIÓN • PODER • DINERO • INFLUENCIA • DEDAZO
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
