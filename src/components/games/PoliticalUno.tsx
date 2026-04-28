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
  Star
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

export function PoliticalUno({ isPausedGlobal = false }: { isPausedGlobal?: boolean }) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [cpuHand, setCpuHand] = useState<Card[]>([]);
  const [topCard, setTopCard] = useState<Card | null>(null);
  const [turn, setTurn] = useState<'player' | 'cpu'>('player');
  const [message, setMessage] = useState(t('game.uno.msg.start'));
  const [winner, setWinner] = useState<'player' | 'cpu' | null>(null);

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

  const [isChoosingColor, setIsChoosingColor] = useState(false);
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

  const initGame = () => {
    setPlayerHand(Array(7).fill(null).map(() => generateCard()));
    setCpuHand(Array(7).fill(null).map(() => generateCard()));
    let initialTop = generateCard();
    while (initialTop.action !== 'normal') {
      initialTop = generateCard();
    }
    setTopCard(initialTop);
    setTurn('player');
    setWinner(null);
    setDirection(1);
    setIsChoosingColor(false);
    setMessage(t('game.uno.msg.turn'));
  };

  useEffect(() => {
    initGame();
  }, []);

  const isValidPlay = (card: Card) => {
    if (!topCard) return true;
    if (card.action === 'dedazo' || card.action === 'fake_news') return true;
    return card.color === topCard.color || card.value === topCard.value;
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
  
  const processAction = (card: Card, currentPlayer: 'player' | 'cpu') => {
    const otherPlayer = currentPlayer === 'player' ? 'cpu' : 'player';
    
    if (card.action !== 'normal') {
      setActivePopup(card.action);
    }
    
    switch (card.action) {
      case 'moche':
        setMessage(currentPlayer === 'player' ? t('game.uno.msg.moche.win') : t('game.uno.msg.moche.lose'));
        if (currentPlayer === 'player') setCpuHand(prev => [...prev, generateCard(), generateCard()]);
        else setPlayerHand(prev => [...prev, generateCard(), generateCard()]);
        return currentPlayer; // +2 skips the opponent
      case 'fuero':
        setMessage(currentPlayer === 'player' ? t('game.uno.msg.fuero.win') : t('game.uno.msg.fuero.lose'));
        return currentPlayer; // Skip skips opponent
      case 'alianza':
        setMessage(t('game.uno.msg.alliance'));
        setDirection(prev => prev * -1);
        return currentPlayer; // In a 2-player game, reverse acts as a skip
      case 'fake_news':
        setMessage(t('game.uno.msg.fake_news'));
        if (currentPlayer === 'player') setCpuHand(prev => [...prev, generateCard(), generateCard(), generateCard(), generateCard()]);
        else setPlayerHand(prev => [...prev, generateCard(), generateCard(), generateCard(), generateCard()]);
        
        if (currentPlayer === 'player') {
          setIsChoosingColor(true);
          return 'player'; // Wait for color choice
        } else {
          // CPU chooses random color
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setTopCard(prev => prev ? { ...prev, color: randomColor } : null);
          return currentPlayer; // Play again since +4 skips player
        }
      case 'consulta':
        setMessage(t('game.uno.msg.consulta'));
        setPlayerHand(prev => [...prev, generateCard()]);
        setCpuHand(prev => [...prev, generateCard()]);
        return otherPlayer;
      case 'dedazo':
        setMessage(t('game.uno.msg.dedazo'));
        if (currentPlayer === 'player') {
          setIsChoosingColor(true);
          return 'player'; // Wait for color choice
        } else {
          // CPU chooses random color
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setTopCard(prev => prev ? { ...prev, color: randomColor } : null);
          return 'player';
        }
      case 'guerra_sucia':
        setMessage(t('game.uno.msg.guerra_sucia'));
        setIsSwapping(true);
        setTimeout(() => {
          setPlayerHand(prevPlayer => {
            const currentCpu = [...cpuHand];
            setCpuHand([...prevPlayer]);
            return currentCpu;
          });
          setIsSwapping(false);
          setTurn(otherPlayer); // Change turn AFTER swap
        }, 1000);
        return currentPlayer; // Keep current turn state until finished
      case 'voto_por_voto':
        setMessage(t('game.uno.msg.voto_por_voto'));
        setPlayerHand(Array(7).fill(null).map(() => generateCard()));
        setCpuHand(Array(7).fill(null).map(() => generateCard()));
        return otherPlayer;
      default:
        return otherPlayer;
    }
  };

  const playCard = (index: number) => {
    if (turn !== 'player' || winner || isChoosingColor || isPausedGlobal) return;
    const card = playerHand[index];
    
    if (isValidPlay(card)) {
      playSound('click');
      setTopCard(card);
      const newHand = [...playerHand];
      newHand.splice(index, 1);
      setPlayerHand(newHand);
      
      if (newHand.length === 0) {
        setWinner('player');
        playSound('win');
        unlockAchievement('dictator');
        setMessage(t('game.uno.msg.win'));
        return;
      }
      
      const nextTurn = processAction(card, 'player');
      if (card.action !== 'dedazo' && card.action !== 'fake_news') {
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
    // Dedazo gives turn to CPU. Fake News (+4) skips CPU, so player goes again!
    if (topCard.action === 'fake_news') {
      setTurn('player');
    } else {
      setTurn('cpu');
    }
  };

  const drawCard = () => {
    playSound('hover');
    if (turn !== 'player' || winner || isChoosingColor || isPausedGlobal) return;
    const newCard = generateCard();
    setPlayerHand([...playerHand, newCard]);
    setMessage(t('game.uno.msg.draw'));
    setTurn('cpu');
  };

  useEffect(() => {
    if (turn === 'cpu' && !winner && !isPausedGlobal) {
      const cpuTurn = setTimeout(() => {
        // Advanced CPU Logic: 
        // 1. If player has few cards (<=3), prioritize aggressive cards (moche, fake_news)
        // 2. Otherwise play normal cards to save specials
        
        let validIndices = cpuHand.map((c, i) => isValidPlay(c) ? i : -1).filter(i => i !== -1);
        
        if (validIndices.length > 0) {
          let targetIndex = validIndices[0];
          
          if (playerHand.length <= 3) {
            // Aggressive mode
            const aggro = validIndices.find(i => cpuHand[i].action === 'moche' || cpuHand[i].action === 'fake_news');
            if (aggro !== undefined) targetIndex = aggro;
          } else {
            // Conservative mode: save specials
            const normal = validIndices.find(i => cpuHand[i].action === 'normal');
            if (normal !== undefined) targetIndex = normal;
          }

          const cardToPlay = cpuHand[targetIndex];
          setTopCard(cardToPlay);
          const newHand = [...cpuHand];
          newHand.splice(targetIndex, 1);
          setCpuHand(newHand);
          
          if (newHand.length === 0) {
            setWinner('cpu');
            playSound('lose');
            setMessage(t('game.uno.msg.lose'));
          } else {
            playSound('click');
            const nextTurn = processAction(cardToPlay, 'cpu');
            setTurn(nextTurn);
          }
        } else {
          playSound('hover');
          setCpuHand([...cpuHand, generateCard()]);
          setMessage(t('game.uno.msg.cpu_draw'));
          setTurn('player');
        }
      }, 1500);
      return () => clearTimeout(cpuTurn);
    }
  }, [turn, cpuHand, winner, topCard, playerHand.length]);

  const CardIcon = ({ action }: { action: SpecialAction }) => {
    switch (action) {
      case 'moche': return <Coins className="w-6 h-6 md:w-8 md:h-8" />;
      case 'fuero': return <Shield className="w-6 h-6 md:w-8 md:h-8" />;
      case 'alianza': return <Handshake className="w-6 h-6 md:w-8 md:h-8" />;
      case 'dedazo': return <Fingerprint className="w-6 h-6 md:w-8 md:h-8" />;
      case 'fake_news': return <Megaphone className="w-6 h-6 md:w-8 md:h-8" />;
      case 'consulta': return <AlertTriangle className="w-6 h-6 md:w-8 md:h-8" />;
      case 'guerra_sucia': return <ArrowLeftRight className="w-6 h-6 md:w-8 md:h-8 text-red-500" />;
      case 'voto_por_voto': return <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 animate-[spin_3s_linear_infinite]" />;
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
        "w-16 h-24 md:w-24 md:h-36 rounded-xl border-t-2 border-l-2 flex flex-col items-center justify-between p-2 md:p-3 text-white font-bold cursor-pointer transition-all relative overflow-hidden shrink-0 shadow-xl",
        hidden ? "bg-zinc-900 border-zinc-700" : `bg-gradient-to-br ${colorStyles[card.color]}`,
        isSelected && "ring-2 ring-white ring-offset-2 ring-offset-black scale-110"
      )}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {!hidden ? (
        <>
          <div className="w-full flex justify-between items-start">
            <span className="text-[10px] md:text-sm">{card.value}</span>
            {card.action !== 'normal' && <span className="opacity-50"><AlertTriangle className="w-3 h-3" /></span>}
          </div>
          
          <div className="flex flex-col items-center gap-1 opacity-90">
             {card.action === 'normal' ? (
                <span className="text-2xl md:text-5xl font-display font-medium">{card.value}</span>
             ) : (
                <CardIcon action={card.action} />
             )}
             {card.partyNameKey && (
               <span className="text-[6px] md:text-[8px] uppercase tracking-tighter opacity-70 text-center">
                 {t(card.partyNameKey)}
               </span>
             )}
          </div>

          <div className="w-full flex justify-end items-end rotate-180">
            <span className="text-[10px] md:text-sm">{card.value}</span>
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
    <div ref={containerRef} className="flex flex-col items-center h-full min-h-[400px] w-full max-w-7xl mx-auto font-[var(--font-mono)] text-[10px] md:text-xs text-white pt-2 pb-16 relative overflow-hidden bg-[#0a0a0A] [&.is-fullscreen]:bg-black">
      <FullscreenButton targetRef={containerRef} className="top-2 right-2" />

      {/* Universal Pause Overlay */}
      <AnimatePresence>
        {isPausedGlobal && !winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6 text-center"
          >
            <div className="flex flex-col items-center gap-2">
              <Megaphone className="w-12 h-12 text-brand-accent animate-bounce" />
              <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                {t('game.paused.system', 'SESSION SUSPENDED')}
              </h2>
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
              {t('game.paused.desc', 'The legislative chamber is closed for maintenance.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden [&.is-fullscreen]:hidden">
        <Fingerprint className="absolute -top-20 -left-20 w-96 h-96 rotate-12" />
        <Megaphone className="absolute -bottom-20 -right-20 w-80 h-80 -rotate-12" />
      </div>

      {/* HUD Header */}
      <div className="mb-4 md:mb-8 flex flex-col items-center gap-1 w-full max-w-2xl px-4 relative z-10">
         <div className="flex items-center gap-2 mb-1">
           <div className={cn("w-2 h-2 rounded-full", turn === 'player' ? "bg-brand-accent shadow-[0_0_10px_rgba(138,99,210,0.8)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]")} />
           <span className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-500">
             {turn === 'player' ? t('game.uno.label.session_open') : t('game.uno.label.session_closed')}
           </span>
         </div>
         <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white uppercase flex items-center gap-2 group">
           <Megaphone className="text-brand-accent h-6 w-6 md:h-10 md:w-10 group-hover:rotate-12 transition-transform" />
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">Political UNO</span>
           <span className="text-zinc-700 text-sm md:text-xl font-mono not-italic mt-1">2.0</span>
         </h2>
      </div>

      {/* The Table Arena */}
      <div className="flex flex-col gap-6 md:gap-12 items-center w-full relative z-10">
        
        {/* Opponent Area (Top) */}
        <div className={cn(
          "flex flex-col items-center gap-3 bg-zinc-950/40 p-4 md:p-6 rounded-[2rem] border transition-all duration-500 w-full max-w-4xl mx-auto [&.is-fullscreen]:shadow-none [&.is-fullscreen]:rounded-none",
          turn === 'cpu' ? "border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]" : "border-white/5"
        )}>
          <div className="flex items-center gap-4 mb-1">
            <h3 className="text-[10px] md:text-sm uppercase tracking-widest text-zinc-500 font-bold">{t('game.uno.label.opposition')}</h3>
            <div className="flex items-center gap-1 bg-zinc-900 px-3 py-1 rounded-full border border-white/5">
              <UserRound className="w-3 h-3 text-red-500" />
              <span className="text-xs font-black">{cpuHand.length}</span>
            </div>
          </div>
          <div className="flex -space-x-12 md:-space-x-16 hover:-space-x-8 transition-all duration-500 pb-2">
            {cpuHand.map((c) => (
               <CardView key={c.id} card={c} hidden={true} />
            ))}
          </div>
        </div>

        {/* Central Arena */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 w-full py-4 min-h-[300px]">
           
           {/* Direction Indicator */}
           <motion.div 
             animate={{ rotate: direction === 1 ? 360 : -360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="absolute md:inset-0 flex items-center justify-center pointer-events-none opacity-10"
           >
             <div className="w-64 h-64 md:w-96 md:h-96 rounded-full border-2 border-dashed border-white flex items-center justify-center">
               <ArrowLeftRight className="w-20 h-20" />
             </div>
           </motion.div>

           {/* Deck (Erario) */}
           <div className="flex flex-col items-center gap-3 group relative">
             <div className="absolute -inset-4 bg-brand-accent/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
             <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{t('game.uno.label.deck')}</p>
             <button 
               onClick={drawCard}
               disabled={turn !== 'player' || !!winner || isChoosingColor}
               className={cn(
                 "w-20 h-28 md:w-32 md:h-48 bg-zinc-900 border-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:translate-y-[-5px]",
                 turn === 'player' ? "border-brand-accent/50 cursor-pointer" : "border-zinc-800 opacity-50 grayscale"
               )}
             >
               <div className="absolute inset-0 bg-gradient-to-tr from-black via-transparent to-white/10" />
               <Coins className={cn("w-10 h-10 transition-transform duration-300", turn === 'player' && "group-hover:scale-110 text-brand-accent")} />
               <span className="text-[10px] font-black uppercase text-zinc-500">{t('game.uno.label.draw')}</span>
               <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent/20" />
             </button>
           </div>

           {/* Discard Pile (Tribuna) */}
           <div className="flex flex-col items-center gap-3 relative">
             <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">{t('game.uno.label.pile')}</p>
             <div className="relative">
                <AnimatePresence mode="wait">
                  {topCard && (
                    <motion.div
                      key={topCard.id}
                      initial={{ scale: 0.8, rotate: direction === 1 ? -15 : 15, opacity: 0 }}
                      animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <CardView card={topCard} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Visual shadow for "pile" depth */}
                <div className="absolute -bottom-2 -right-2 w-full h-full bg-black/40 rounded-xl -z-10 blur-sm" />
             </div>
             <p className="text-zinc-400 font-black uppercase tracking-tighter text-[10px]">{t('game.uno.label.actual')}</p>
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
                   <ArrowLeftRight className="w-32 h-32 text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]" />
                 </motion.div>
               </motion.div>
             )}
             {activePopup && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.5, y: 50 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                 transition={{ type: "spring", damping: 12, stiffness: 200 }}
                 className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
               >
                 <div className="bg-[#0a0a0A]/90 backdrop-blur-md px-12 py-8 rounded-full border border-brand-accent shadow-[0_0_100px_rgba(138,99,210,0.8)] flex flex-col items-center gap-4 text-center">
                   <div className="text-brand-accent">
                     <CardIcon action={activePopup} />
                   </div>
                   <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-brand-accent !not-italic">
                     {activePopup.replace('_', ' ')}
                   </h1>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Active Action Message Overlay */}
           <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 pointer-events-none z-50">
             <AnimatePresence mode="wait">
               {message ? (
                 <motion.div 
                   key={message}
                   initial={{ opacity: 0, scale: 1.2, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                   className={cn(
                     "bg-black/90 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-3 min-w-[200px] justify-center transition-colors shadow-[0_0_30px_rgba(0,0,0,0.8)]",
                     turn === 'player' ? "text-brand-accent ring-1 ring-brand-accent/30" : "text-red-400 ring-1 ring-red-500/30"
                   )}
                 >
                   {turn === 'player' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4 animate-pulse" />}
                   <span className="text-[10px] md:text-xs uppercase font-black tracking-widest">{message}</span>
                 </motion.div>
               ) : null}
             </AnimatePresence>
           </div>
        </div>

        {/* Player Area (Bottom) */}
        <div className={cn(
          "flex flex-col items-center gap-4 bg-white/[0.03] backdrop-blur-xl p-6 md:p-10 rounded-[3rem] border transition-all duration-700 w-full max-w-6xl mx-auto shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative [&.is-fullscreen]:shadow-none [&.is-fullscreen]:rounded-none [&.is-fullscreen]:backdrop-blur-none",
          turn === 'player' && !isChoosingColor ? "border-brand-accent/30 shadow-[0_0_50px_rgba(138,99,210,0.15)] ring-1 ring-brand-accent/20" : "border-white/5"
        )}>
          {/* Active Hand Indicator Glow */}
          {turn === 'player' && !isChoosingColor && (
            <div className="absolute inset-0 bg-brand-accent/5 rounded-[3rem] animate-pulse pointer-events-none" />
          )}

          <div className="flex items-center gap-6 mb-2 w-full justify-between items-end px-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-[0.5em] text-zinc-500 font-bold">{t('game.uno.label.bench')}</span>
              <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase">{t('game.uno.label.power')}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('game.uno.label.influences')}</span>
              <span className="bg-brand-accent text-white px-4 py-1 rounded-full text-sm font-black shadow-lg shadow-brand-accent/20">
                {playerHand.length}
              </span>
            </div>
          </div>

          <div className="flex -space-x-10 md:-space-x-12 hover:-space-x-4 transition-all duration-500 pb-4 w-full overflow-x-auto overflow-y-visible px-10 min-h-[220px] md:min-h-[280px] scrollbar-hide snap-x">
            <AnimatePresence>
              {playerHand.map((card, i) => (
                <div key={card.id} className="snap-center">
                  <CardView 
                    card={card} 
                    onClick={() => playCard(i)} 
                  />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Wild Card Color Choice Overlay */}
      <AnimatePresence>
        {isChoosingColor && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-8 p-12 bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl max-w-lg w-full">
              <div className="text-center">
                <h3 className="text-2xl font-black italic text-white uppercase mb-2">{t('game.uno.label.wild_title')}</h3>
                <p className="text-zinc-500 text-xs tracking-widest uppercase">{t('game.uno.label.wild_desc')}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 w-full">
                {colors.map(color => (
                  <motion.button
                    key={color}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleColorChoice(color)}
                    className={cn(
                      "group relative h-20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all overflow-hidden border-2 border-white/5",
                      `bg-gradient-to-br ${colorStyles[color]}`
                    )}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    <span className="text-[10px] font-black uppercase tracking-widest drop-shadow-md">{t(getPartyKey(color))}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win/Loss Overlay */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.5, y: 100, rotate: -10 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              className="flex flex-col items-center gap-10 p-12 text-center relative"
            >
              {/* Retro background flair */}
              <div className="absolute inset-0 bg-brand-accent/5 blur-[120px] rounded-full animate-pulse" />
              
              {winner === 'player' ? (
                <>
                  <div className="relative">
                    <CheckCircle2 className="w-40 h-40 text-brand-accent animate-[bounce_2s_infinite]" />
                    <Star className="absolute -top-4 -right-4 w-12 h-12 text-white animate-spin" />
                  </div>
                  <div className="space-y-4 relative">
                    <h3 className="text-5xl md:text-8xl font-black italic text-white uppercase tracking-tighter leading-none">
                      {t('game.uno.label.win_title')}
                    </h3>
                    <p className="text-zinc-400 max-w-md mx-auto uppercase tracking-[0.3em] font-black italic text-xs leading-relaxed">
                      {t('game.uno.msg.win')}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <XCircle className="w-40 h-40 text-red-500/30 animate-pulse" />
                    <AlertTriangle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-red-500" />
                  </div>
                  <div className="space-y-4 relative">
                    <h3 className="text-5xl md:text-8xl font-black italic text-zinc-800 uppercase tracking-tighter leading-none">
                      {t('game.uno.label.lose_title')}
                    </h3>
                    <p className="text-red-500/50 max-w-md mx-auto uppercase tracking-[0.3em] font-black italic text-xs leading-relaxed">
                      {t('game.uno.msg.lose')}
                    </p>
                  </div>
                </>
              )}
              
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: '#fff', color: '#000' }}
                whileTap={{ scale: 0.9 }}
                onClick={(e:any) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
                onTouchEnd={(e:any) => { e.preventDefault(); e.stopPropagation(); initGame(); }}
                className="mt-8 bg-zinc-900 text-white px-16 py-5 font-black uppercase tracking-[0.4em] transition-all rounded-full border border-white/10 flex items-center gap-3 shadow-2xl relative z-50 cursor-pointer pointer-events-auto"
              >
                <ArrowLeftRight className="w-5 h-5" />
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
