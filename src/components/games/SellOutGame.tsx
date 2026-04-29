import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Camera, 
  UserPlus, 
  Cpu, 
  CloudLightning, 
  DollarSign,
  RefreshCw,
  Flame,
  Star
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { cn } from '../../lib/utils';
import { FullscreenButton } from '../ui/FullscreenButton';

interface Upgrade {
  id: string;
  nameKey: string;
  baseCost: number;
  hypeBoost: number; // passive hype per second
  icon: React.ReactNode;
  unlockedAt: number; // relevance needed
}

const UPGRADES: Upgrade[] = [
  { id: 'selfie', nameKey: 'game.sell.action.post', baseCost: 10, hypeBoost: 0.5, icon: <Camera />, unlockedAt: 0 },
  { id: 'scandal', nameKey: 'game.sell.action.scandal', baseCost: 100, hypeBoost: 5, icon: <AlertTriangle />, unlockedAt: 10 },
  { id: 'bots', nameKey: 'game.sell.action.bots', baseCost: 500, hypeBoost: 20, icon: <UserPlus />, unlockedAt: 30 },
  { id: 'ai', nameKey: 'game.sell.action.ai', baseCost: 2000, hypeBoost: 100, icon: <Cpu />, unlockedAt: 50 },
  { id: 'nft', nameKey: 'game.sell.action.nft', baseCost: 10000, hypeBoost: 500, icon: <DollarSign />, unlockedAt: 80 },
];

export const SellOutGame: React.FC<{ isPausedGlobal?: boolean, hideFullscreenButton?: boolean, isFullscreen?: boolean }> = ({ isPausedGlobal = false, hideFullscreenButton = false, isFullscreen = false }) => {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  
  useEffect(() => {
    // SellOutGame is an idle clicker, so it's always playing essentially.
    playMusic('sellout');
    return () => playMusic('none');
  }, [playMusic]);

  const [hype, setHype] = useState(0);
  const [audience, setAudience] = useState(10);
  const [relevance, setRelevance] = useState(100);
  const [prestige, setPrestige] = useState(1);
  const [viralTimer, setViralTimer] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'win' | 'lose'>('start');
  const [message, setMessage] = useState(t('game.sell.msg.start'));
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number, val: number }[]>([]);
  const [fans, setFans] = useState<{ id: number, x: number, y: number }[]>([]);
  const hypeRef = React.useRef(hype);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    hypeRef.current = hype;
  }, [hype]);

  const hypePerClick = (1 + (audience * 0.1)) * prestige * (viralTimer > 0 ? 3 : 1);
  const passiveHype = UPGRADES.reduce((acc, up) => acc + (inventory[up.id] || 0) * up.hypeBoost, 0);
  const relevanceMultiplier = Math.max(0.1, relevance / 100);
  const totalHypePerClick = hypePerClick * relevanceMultiplier;
  const totalPassiveHype = passiveHype * relevanceMultiplier * prestige * (viralTimer > 0 ? 3 : 1);
  const winProgress = Math.min(100, (hype / 1000000) * 100);

  const resetGame = () => {
    setHype(0);
    setAudience(10);
    setRelevance(100);
    setGameState('playing');
    setMessage(t('game.sell.msg.start'));
    setInventory({});
  };

  // Cabinet Button Support
  useEffect(() => {
    if (isPausedGlobal || gameState !== 'playing') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        // Simulate a click at a random central position
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = rect.width / 2 + (Math.random() - 0.5) * 100;
          const y = rect.height / 3 + (Math.random() - 0.5) * 100;
          
          playSound('hover');
          setHype(prev => prev + totalHypePerClick);
          setAudience(prev => prev + 1);
          setRelevance(prev => Math.min(100, prev + (viralTimer > 0 ? 2 : 1.2)));

          const clickId = Date.now() + Math.random();
          setClicks(prev => [...prev, { id: clickId, x, y, val: totalHypePerClick }]);
          
          if (Math.random() > 0.5) {
             const fanId = Math.random();
             setFans(prev => [...prev, { id: fanId, x, y }]);
             setTimeout(() => setFans(prev => prev.filter(f => f.id !== fanId)), 1000);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalHypePerClick, viralTimer, gameState, isPausedGlobal, playSound]);

  useEffect(() => {
    if (gameState !== 'playing' || isPausedGlobal) return;

    const timer = setInterval(() => {
      const currentHype = hypeRef.current;
      setHype(prev => prev + totalPassiveHype / 10);
      
      setViralTimer(prev => Math.max(0, prev - 1));
      
      // Random viral event
      if (Math.random() < 0.002 && viralTimer === 0) {
        setViralTimer(300); // 30 seconds
        setMessage(t('game.sell.viral'));
        playSound('powerup');
      }

      setRelevance(prev => {
        const next = prev - (0.25 + (currentHype * 0.000003)); 
        if (next <= 0) {
          setGameState('lose');
          playSound('lose');
          unlockAchievement('brokeback');
          setMessage(t('game.sell.msg.lose'));
          return 0;
        }
        return next;
      });

      if (currentHype >= 1000000) {
        setGameState('win');
        playSound('win');
        unlockAchievement('sellout');
        setMessage(t('game.sell.msg.win'));
      }
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, totalPassiveHype, t, isPausedGlobal]);

  const handlePrestige = () => {
    if (hype < 1000000) return;
    setPrestige(prev => prev + 1);
    resetGame();
    setMessage(t('game.sell.msg.prestige'));
    playSound('win');
  };

  const handleMainClick = (e: React.MouseEvent) => {
    if (gameState !== 'playing' || isPausedGlobal) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    playSound('hover');
    setHype(prev => prev + totalHypePerClick);
    setAudience(prev => prev + 1);
    setRelevance(prev => Math.min(100, prev + (viralTimer > 0 ? 2 : 1.2)));

    const id = Date.now() + Math.random();
    setClicks(prev => [...prev, { id, x, y, val: totalHypePerClick }]);
    
    // Fan particle
    if (Math.random() > 0.5) {
       const fanId = Math.random();
       setFans(prev => [...prev, { id: fanId, x, y }]);
       setTimeout(() => setFans(prev => prev.filter(f => f.id !== fanId)), 1000);
    }

    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== id));
    }, 800);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    const cost = Math.floor(upgrade.baseCost * Math.pow(1.2, inventory[upgrade.id] || 0));
    if (hype >= cost) {
      playSound('purchase');
      setHype(prev => prev - cost);
      setInventory(prev => ({ ...prev, [upgrade.id]: (prev[upgrade.id] || 0) + 1 }));
      setAudience(prev => prev * 1.1);
    } else {
      playSound('alert');
    }
  };

  return (
    <div ref={containerRef} className={cn("flex flex-col items-center w-full h-full p-4 md:p-8 font-[var(--font-mono)] select-none relative bg-[#050505] min-h-[350px] overflow-y-auto custom-scrollbar [&.is-fullscreen]:bg-black", !isFullscreen && "max-w-5xl mx-auto")}>
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2" />}


      
      {/* Universal Pause Overlay */}
      <AnimatePresence>
        {isPausedGlobal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-12 h-12 text-brand-accent animate-spin-slow" />
              <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                {t('game.paused.system', 'MARKET SUSPENDED')}
              </h2>
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
              {t('game.paused.desc', 'The algorithm is currently refreshing. Please stand by.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full flex flex-col">
      
      {/* Top Banner: Progress to 1M */}
      <div className="w-full mb-8 space-y-2">
        <div className="flex justify-between items-end">
          <span className="text-[10px] uppercase font-black text-brand-accent tracking-[0.2em]">{t('game.sell.label.progress')}</span>
          <span className="text-sm font-black text-white italic">{Math.floor(winProgress)}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-900 rounded-full border border-white/5 overflow-hidden shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-brand-accent to-white shadow-[0_0_15px_rgba(138,99,210,0.5)]"
            animate={{ width: `${winProgress}%` }}
            transition={{ type: "spring", damping: 20 }}
          />
        </div>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent/20 to-transparent blur opacity-25 group-hover:opacity-50 transition" />
            <div className="relative bg-zinc-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center">
              <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <Flame className={cn("w-4 h-4", viralTimer > 0 ? "text-brand-accent animate-pulse" : "text-orange-500")} />
                <span className="text-[10px] uppercase font-black tracking-widest">{t('game.sell.hype')}</span>
              </div>
              <span className={cn("text-3xl md:text-4xl font-black tabular-nums transition-all", viralTimer > 0 ? "text-brand-accent scale-110" : "text-white")}>
                {Math.floor(hype).toLocaleString()}
              </span>
              {prestige > 1 && <span className="text-[9px] text-zinc-600 mt-1 uppercase font-bold">x{prestige} Mult</span>}
            </div>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] uppercase font-black tracking-widest">{t('game.sell.audience')}</span>
          </div>
          <span className="text-3xl md:text-4xl font-black text-zinc-300 tabular-nums">
            {Math.floor(audience).toLocaleString()}
          </span>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex flex-col items-center overflow-hidden">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-accent" />
            <span className="text-[10px] uppercase font-black tracking-widest">{t('game.sell.relevance')}</span>
          </div>
          <div className="w-full bg-zinc-800/50 h-3 rounded-full mt-2 overflow-hidden border border-white/5">
            <motion.div 
              className={cn(
                "h-full transition-colors duration-500", 
                relevance > 60 ? "bg-emerald-400" : relevance > 30 ? "bg-amber-400" : "bg-red-500 animate-pulse"
              )} 
              animate={{ width: `${relevance}%` }}
            />
          </div>
          <span className={cn("text-[11px] mt-2 font-black", relevance < 30 ? "text-red-500" : "text-zinc-500")}>
            {Math.floor(relevance)}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-12 w-full items-start">
        
        {/* Main Interaction Area */}
        <div className="flex flex-col items-center gap-4 md:gap-8">
          <div 
            onClick={handleMainClick}
            className={cn(
              "relative w-56 h-56 sm:w-72 sm:h-72 md:w-96 md:h-96 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90 group",
              gameState === 'playing' ? "hover:scale-105" : "grayscale opacity-50"
            )}
          >
            {/* Pulsing Outer Rings */}
            <div className="absolute inset-0 rounded-full border-2 border-brand-accent/20 animate-[ping_3s_infinite]" />
            <div className="absolute inset-4 rounded-full border-2 border-white/5 animate-[ping_4s_infinite_1s]" />
            
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-accent/30 via-transparent to-white/10 border-4 border-white/10 flex items-center justify-center overflow-hidden">
               <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-full bg-[#050505] flex flex-col items-center justify-center border-4 border-zinc-900 group-hover:border-brand-accent transition-all duration-500 shadow-[0_0_100px_rgba(138,99,210,0.2)]">
                 {gameState === 'playing' ? (
                   <>
                    <Star className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-brand-accent drop-shadow-[0_0_20px_rgba(138,99,210,0.6)]" />
                    <span className="mt-2 md:mt-4 text-[8px] md:text-[10px] uppercase font-black text-zinc-500 tracking-[0.5em] group-hover:text-white transition-colors">{t('game.sell.label.sell')}</span>
                   </>
                 ) : (
                   <RefreshCw className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-zinc-800 rotate-180" />
                 )}
               </div>
               
               {/* Shine effect */}
               <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] group-hover:left-[100%] transition-all duration-1000" />
            </div>

            {/* Fans visual feedback */}
            <AnimatePresence>
              {fans.map(fan => (
                <motion.div
                  key={fan.id}
                  initial={{ x: fan.x - 20, y: fan.y - 20, opacity: 1, scale: 0.5 }}
                  animate={{ x: 300, y: -200, opacity: 0, scale: 1 }} // Move towards top stats
                  exit={{ opacity: 0 }}
                  className="absolute pointer-events-none text-blue-400 z-[60]"
                >
                  <Users className="w-6 h-6" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Click effects */}
            <AnimatePresence>
              {clicks.map(click => (
                <motion.div
                  key={click.id}
                  initial={{ opacity: 1, scale: 0.5, y: -20, rotate: (Math.random() - 0.5) * 30 }}
                  animate={{ opacity: 0, scale: 2.5, y: -200, rotate: (Math.random() - 0.5) * 60 }}
                  exit={{ opacity: 0 }}
                  style={{ left: click.x, top: click.y }}
                  className="absolute pointer-events-none text-brand-accent font-black text-3xl z-50 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] italic"
                >
                  +{Math.floor(click.val).toLocaleString()}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-accent" />
            
            {hype >= 1000000 && (
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={handlePrestige}
                className="mb-4 w-full bg-white text-black py-4 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('game.sell.label.prestige')}
              </motion.button>
            )}

            <p className="text-zinc-300 font-bold uppercase tracking-widest text-xs md:text-sm mb-4 leading-relaxed italic">"{message}"</p>
            
            {gameState !== 'playing' && (
              <motion.button 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e:any) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
                onTouchEnd={(e:any) => { e.preventDefault(); e.stopPropagation(); resetGame(); }}
                className="bg-brand-accent text-white px-10 py-4 rounded-full font-black uppercase tracking-[0.3em] hover:bg-brand-accent/80 transition-all shadow-[0_10px_30px_rgba(138,99,210,0.3)] shadow-brand-accent/20 relative z-50 cursor-pointer pointer-events-auto"
              >
                {t('game.sell.label.reset')}
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-8 w-full text-[11px] text-zinc-500 uppercase font-black tracking-widest px-4">
             <div className="flex flex-col gap-1">
               <span className="text-[9px] text-zinc-700">{t('game.sell.label.click_effect')}</span>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-brand-accent rounded-full shadow-[0_0_8px_rgba(138,99,210,0.8)]" />
                 <span className="text-white">{t('game.sell.stats.hype_per_click', { val: Math.floor(totalHypePerClick).toLocaleString() })}</span>
               </div>
             </div>
             <div className="flex flex-col gap-1 items-end">
               <span className="text-[9px] text-zinc-700">{t('game.sell.label.passive_flow')}</span>
               <div className="flex items-center gap-2">
                 <span className="text-zinc-300">{t('game.sell.stats.passive_hype', { val: Math.floor(totalPassiveHype).toLocaleString() })}</span>
                 <div className="w-2 h-2 bg-white/40 rounded-full" />
               </div>
             </div>
          </div>
        </div>

        {/* Upgrades Area */}
        <div className="flex flex-col gap-4 w-full bg-zinc-950/40 p-6 rounded-[2.5rem] border border-white/5 relative h-[600px] overflow-hidden">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-transparent z-10">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em]">
               {t('game.sell.label.investments')}
            </h3>
            <CloudLightning className="w-4 h-4 text-brand-accent animate-pulse" />
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide flex-1">
            {UPGRADES.map(upgrade => {
              const level = inventory[upgrade.id] || 0;
              const cost = Math.floor(upgrade.baseCost * Math.pow(1.2, level));
              const canAfford = hype >= cost;
              const isVisible = relevance >= upgrade.unlockedAt;

              if (!isVisible) return (
                <div key={upgrade.id} className="p-5 border-2 border-dashed border-zinc-900 bg-zinc-950/10 rounded-3xl flex flex-col items-center justify-center gap-2 opacity-30 grayscale saturate-0">
                  <span className="text-[10px] uppercase font-black text-zinc-600 tracking-widest leading-tight text-center">
                    {t('game.sell.label.locked')}<br/>
                    <span className="text-brand-accent">{t('game.sell.label.requires', { val: upgrade.unlockedAt })}</span>
                  </span>
                </div>
              );

              return (
                <motion.button
                  key={upgrade.id}
                  whileHover={canAfford ? { x: 5 } : {}}
                  whileTap={canAfford ? { scale: 0.98 } : {}}
                  onClick={() => buyUpgrade(upgrade)}
                  disabled={!canAfford || gameState !== 'playing'}
                  className={cn(
                    "p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between group relative overflow-hidden",
                    canAfford 
                      ? "bg-zinc-900/60 border-zinc-800 hover:border-brand-accent/50 cursor-pointer shadow-lg" 
                      : "bg-black/40 border-zinc-900 opacity-60 cursor-not-allowed"
                  )}
                >
                  {/* Subtle progress indicator for ability to buy */}
                  {canAfford && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-brand-accent shadow-[0_0_10px_rgba(138,99,210,0.5)]" />
                  )}

                  <div className="flex items-center gap-5">
                     <div className={cn(
                       "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                       canAfford 
                        ? "bg-brand-accent/15 text-brand-accent group-hover:scale-110 group-hover:rotate-12 shadow-[0_0_20px_rgba(138,99,210,0.1)]" 
                        : "bg-zinc-900 text-zinc-700"
                     )}>
                       {React.cloneElement(upgrade.icon as React.ReactElement, { size: 28 })}
                     </div>
                     <div className="text-left">
                       <p className="text-[11px] font-black text-white uppercase tracking-wider mb-0.5">{t(upgrade.nameKey)}</p>
                       <div className="flex items-center gap-3">
                         <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tighter">{t('game.sell.label.level', { val: level })}</span>
                         <span className="text-[9px] text-brand-accent font-black">+{upgrade.hypeBoost}/s</span>
                       </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                     <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-full border border-white/5">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                       <span className={cn("text-[11px] font-black tabular-nums", canAfford ? "text-white" : "text-zinc-600")}>
                         {cost.toLocaleString()}
                       </span>
                     </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
        </div>

      </div>

      {/* Decorative Branding */}
      <div className="mt-16 opacity-10 text-[8px] uppercase tracking-[1em] font-black text-zinc-500 text-center w-full">
        {t('game.sell.footer')}
      </div>
      </div>
    </div>
  );
};
