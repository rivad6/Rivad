import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Layers, Cpu, Paintbrush, DollarSign, MessageCircle, Target, Power, ArrowDown, Maximize, Minimize, Trophy, Zap } from 'lucide-react';
import { DebatePong } from './games/DebatePong';
import { IdeasTicTacToe } from './games/IdeasTicTacToe';
import { PoliticalUno } from './games/PoliticalUno';
import { ArtRPG } from './games/ArtRPG';
import { SellOutGame } from './games/SellOutGame';
import { CreativeInvaders } from './games/CreativeInvaders';
import { MeetingRace } from './games/MeetingRace';
import { useAchievements } from '../context/AchievementsContext';
import { useAudio } from '../context/AudioContext';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { AchievementsViewer } from './AchievementsViewer';

export function Arcade() {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  const { playSound, playMusic } = useAudio();
  const [showPopup, setShowPopup] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [powerState, setPowerState] = useState<'off' | 'booting' | 'waiting' | 'inserting' | 'playing'>('off');
  const [bootLog, setBootLog] = useState<string[]>([]);

  const arcadeCabinetRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const games = [
    { id: 'pong', title: t('arc.game1'), icon: <Gamepad2 size={24} />, color: 'bg-brand-accent', label: t('arc.game1.lbl') },
    { id: 'uno', title: t('arc.game2'), icon: <Layers size={24} />, color: 'bg-brand-accent', label: t('arc.game2.lbl') },
    { id: 'tictactoe', title: t('arc.game3'), icon: <Cpu size={24} />, color: 'bg-brand-accent', label: t('arc.game3.lbl') },
    { id: 'rpg', title: t('arc.game4'), icon: <Paintbrush size={24} />, color: 'bg-brand-accent', label: t('arc.game4.lbl') },
    { id: 'sellout', title: t('arc.game5'), icon: <DollarSign size={24} />, color: 'bg-brand-accent', label: t('arc.game5.lbl') },
    { id: 'invaders', title: t('arc.game6'), icon: <Target size={24} />, color: 'bg-brand-accent', label: t('arc.game6.lbl') },
    { id: 'race', title: t('arc.game7'), icon: <Trophy size={24} />, color: 'bg-brand-accent', label: t('arc.game7.lbl') },
  ] as const;

  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [pendingGame, setPendingGame] = useState<string | null>(null);

  useEffect(() => {
    // Unlock first blood achievement when entering the arcade
    unlockAchievement('first_blood');
    
    // Auto-power on
    handlePower();
    
    // 60 seconds popup
    const popupInterval = setInterval(() => {
      if (!document.fullscreenElement && !showPopup && powerState === 'playing') {
        setShowPopup(true);
      }
    }, 60000);
    
    return () => {
      clearInterval(popupInterval);
      playMusic('none');
    };
  }, [unlockAchievement, playMusic]);

  const handlePower = () => {
    if (powerState === 'off') {
      playSound('score');
      playMusic('arcade');
      setPowerState('booting');
      setBootLog([]);
      
      const lines = [
        t('arc.boot.bios.line'),
        t('arc.boot.cpu.line'),
        t('arc.boot.mem.line'),
        t('arc.boot.video.line'),
        t('arc.boot.loading.line'),
        t('arc.boot.drivers.line'),
        t('arc.boot.sound.line'),
        t('arc.boot.network.line'),
        ""
      ];
      
      lines.forEach((line, index) => {
        setTimeout(() => {
          setBootLog(prev => [...prev, line]);
          if (index === lines.length - 1) {
            setPowerState('waiting');
          }
        }, index * 300 + 400);
      });

    } else {
      playSound('hit');
      playMusic('none');
      setPowerState('off');
      setActiveGame(null);
      setBootLog([]);
    }
  };

  const handleReboot = () => {
    playSound('hit');
    playMusic('none');
    setPowerState('off');
    setActiveGame(null);
    setBootLog([]);
    
    // Auto-power on after a brief delay
    setTimeout(() => {
      handlePower();
    }, 800);
  };

  const handleExitToMenu = () => {
    playSound('hit');
    playMusic('arcade');
    setPowerState('waiting');
    setActiveGame(null);
  };

  const handleInsertCartridge = (id: string) => {
    if (powerState !== 'waiting' && powerState !== 'playing') return;
    playSound('powerup');
    setPowerState('inserting');
    setPendingGame(id);
    setActiveGame(null);
    setBootLog([t('arc.boot.read.line'), t('arc.boot.locate.line'), t('arc.boot.ram.line'), t('arc.boot.exec.line')]);
    
    setTimeout(() => {
      setActiveGame(id);
      setPendingGame(null);
      setPowerState('playing');
    }, 2000);
  };

  const startHoldKey = (key: string) => {
    // For clickable games or the main menu, simulate TAB/Shift+TAB for Arrows
    if (activeGame === 'uno' || activeGame === 'tictactoe' || activeGame === 'sellout' || powerState === 'waiting') {
       const arcadeScreen = document.getElementById('arcade-screen-container');
       if (arcadeScreen && (key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowUp')) {
         const focusable = Array.from(arcadeScreen.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) as HTMLElement[];
         const filtered = focusable.filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
         });
         const currentIndex = filtered.findIndex(el => el === document.activeElement);
         let nextIndex = 0;

         if (key === 'ArrowRight' || key === 'ArrowDown') {
            nextIndex = (currentIndex + 1) % filtered.length;
         } else {
            nextIndex = currentIndex <= 0 ? filtered.length - 1 : currentIndex - 1;
         }
         filtered[nextIndex]?.focus();
       } else if (key === 'Enter' || key === ' ') {
         if (document.activeElement instanceof HTMLElement && arcadeScreen?.contains(document.activeElement)) {
             document.activeElement.click();
         }
       }
    }

    const code = key === ' ' ? 'Space' : key;
    window.dispatchEvent(new KeyboardEvent('keydown', { key, code, bubbles: true }));
  };

  const stopHoldKey = (key: string) => {
    const code = key === ' ' ? 'Space' : key;
    window.dispatchEvent(new KeyboardEvent('keyup', { key, code, bubbles: true }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (arcadeCabinetRef.current?.requestFullscreen) {
        arcadeCabinetRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="w-full bg-transparent border-y border-brand-accent/20 py-24 pb-48 relative overflow-hidden">
      <div className="w-full max-w-5xl mx-auto px-6 md:px-0">
        {/* Background glow around the arcade */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/20 rounded-full blur-[150px] opacity-30 pointer-events-none" />
        
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-12 md:mt-4 relative z-10">
          <div>
            <h2 className="text-sm font-mono tracking-[0.2em] text-brand-accent uppercase mb-4 border-b border-brand-accent/30 pb-2 inline-block">
              {t('arc.restricted')}
            </h2>
            <h3 className="text-6xl md:text-8xl font-display uppercase tracking-tighter text-gray-100 leading-none">
              Arcade <br className="hidden md:block" />
              <span className="font-display text-gray-100 lowercase font-medium tracking-normal ml-0 md:ml-12">{t('arc.sisyphus')}</span>
            </h3>
          </div>
          <p className="text-gray-400 font-sans font-light max-w-sm text-sm md:text-base leading-relaxed border-l border-brand-accent/30 pl-4 py-2">
            {t('arc.desc')}
          </p>
        </div>

        <div ref={arcadeCabinetRef} className={`flex flex-col items-center relative ${isFullscreen ? 'fixed inset-0 z-[999] h-screen w-screen bg-[#050505] overflow-hidden' : ''}`}>
          {/* 60s Interruption Popup - Moved inside the machine container */}
          <AnimatePresence>
            {showPopup && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-xl" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-zinc-950 border border-brand-accent/30 p-8 rounded-3xl max-w-sm w-full shadow-[0_0_50px_rgba(242,74,41,0.4)] flex flex-col items-center text-center gap-6 relative z-10"
                >
                  <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent border border-brand-accent/20">
                    <MessageCircle size={32} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-brand-accent text-[10px] font-black tracking-[0.3em] uppercase">
                      {t('arc.popup.title')}
                    </h4>
                    <div className="h-px w-12 bg-brand-accent/30 mx-auto" />
                  </div>
                  <p className="text-white font-mono text-xs md:text-sm leading-relaxed uppercase tracking-wider italic px-4">
                    "{t('arc.popup.text')}"
                  </p>
                  <button
                    aria-label={t('arc.popup.btn', 'CONTINUAR')}
                    onClick={() => {
                      setShowPopup(false);
                      playSound('powerup');
                    }}
                    className="w-full bg-brand-accent text-white py-4 rounded-full font-black uppercase tracking-[0.3em] hover:bg-brand-accent/80 transition-all font-mono text-xs shadow-[0_4px_0_#9a2b16] active:translate-y-1 active:shadow-none"
                  >
                    {t('arc.popup.btn', 'CONTINUAR')}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {/* Arcade Machine Component */}
          <div className={cn(
            "relative bg-[#0F0F12] p-3 md:p-6 border-x-8 md:border-x-[20px] border-y-[10px] mb-8 md:border-t-[40px] md:border-b-[30px] border-[#0a0a0c] mx-auto overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05),inset_0_0_40px_rgba(0,0,0,0.8)] rounded-[24px] md:rounded-[32px] w-full transition-all duration-500",
            isFullscreen ? "flex flex-col flex-grow min-h-0 h-full max-w-none border-none rounded-none shadow-none p-2 md:p-4 mb-0" : "max-w-[1100px] ring-1 ring-white/10 relative"
          )}>

          {/* Faux Marquee (Top of cabinet) */}
          {!isFullscreen && (
            <div className="absolute top-0 inset-x-0 h-16 md:h-28 bg-[#111] flex flex-col items-center justify-center overflow-hidden border-b-8 border-black/90 shadow-[0_20px_30px_rgba(0,0,0,0.8)] z-30 perspective-[1000px]">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-color-dodge"></div>
              {/* Backlight / glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,100,50,0.3)_0%,transparent_80%)] mix-blend-screen"></div>
              {/* Top trim */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-zinc-700 via-zinc-400 to-zinc-700 border-b border-black"></div>
              
              {/* Marquee Graphic */}
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/60 border-y-2 border-white/10 mt-2 transform -rotateX-[5deg] shadow-inner">
                 <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mix-blend-screen shadow-[0_0_15px_#ef4444]"></div>
                 <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent mix-blend-screen shadow-[0_0_15px_#3b82f6]"></div>
                 
                 <h1 className="text-transparent bg-clip-text bg-gradient-to-tr from-yellow-300 via-yellow-500 to-red-600 font-display font-black text-2xl md:text-5xl uppercase tracking-[0.2em] drop-shadow-[0_0_20px_rgba(239,68,68,0.7)] italic transform -skew-x-12 mt-1">
                   SISYPHUS
                 </h1>
                 <span className="text-[6px] md:text-[9px] text-zinc-400 tracking-[0.4em] uppercase font-bold mt-1 shadow-black drop-shadow-md">Arcade System // v3.1</span>
              </div>
            </div>
          )}

          {/* Cabinet texture effect */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] mix-blend-color-dodge"></div>
          <div className="absolute inset-x-0 top-28 h-64 opacity-20 pointer-events-none bg-gradient-to-b from-black/80 to-transparent mix-blend-multiply" ></div>
          <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_20px_60px_rgba(0,0,0,0.9)]"></div>

          {/* Hardware Vents - now positioned below the marquee */}
          {!isFullscreen && (
             <div className="absolute top-[8rem] left-1/2 -translate-x-1/2 flex gap-3 md:gap-5 opacity-80 pointer-events-none z-10">
                {Array(6).fill(0).map((_, i) => (
                   <div key={i} className="w-2 md:w-3 h-5 md:h-10 bg-[#020202] rounded-full shadow-[inset_3px_5px_8px_rgba(0,0,0,1),1px_1px_0_rgba(255,255,255,0.05)] border border-[#050505]"></div>
                ))}
             </div>
          )}

          {/* Console Screws */}
          {!isFullscreen && (
            <>
              <div className="absolute top-36 left-6 md:top-40 md:left-12 w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#1a1a1a] shadow-[inset_1px_1px_2px_rgba(0,0,0,1)] border border-[#222] flex items-center justify-center z-10"><div className="w-2 h-0.5 bg-[#0a0a0a] transform rotate-45"></div></div>
              <div className="absolute top-36 right-6 md:top-40 md:right-12 w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#1a1a1a] shadow-[inset_1px_1px_2px_rgba(0,0,0,1)] border border-[#222] flex items-center justify-center z-10"><div className="w-2 h-0.5 bg-[#0a0a0a] transform rotate-12"></div></div>
            </>
          )}
          
          <div className={cn("w-full transition-all duration-500 relative z-20 flex flex-col", isFullscreen ? "h-full" : "mt-24 md:mt-28")}>
             {/* Integrated Hardware Buttons Array */}
             <div className={cn("flex justify-center items-center z-50 mb-6", isFullscreen ? "absolute top-4 right-4 items-center gap-4 bg-black/50 p-2 py-1 rounded-xl backdrop-blur-md border border-white/10" : "w-full px-4")}>
               {!isFullscreen && (
                 <div className="flex flex-row justify-between items-center w-full max-w-2xl bg-[#111] border-y border-zinc-900/80 px-6 py-2 shadow-[inset_0_2px_10px_rgba(0,0,0,1)] rounded-sm relative">
                   <div className="absolute top-1 left-2 w-1.5 h-1.5 rounded-full bg-black/60 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05)]"></div>
                   <div className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-black/60 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05)]"></div>
                   <div className="absolute bottom-1 left-2 w-1.5 h-1.5 rounded-full bg-black/60 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05)]"></div>
                   <div className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-black/60 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05)]"></div>
                   
                   <div className="flex flex-col gap-1.5 opacity-80">
                     <div className="flex gap-2">
                       <div className="w-4 h-1 bg-red-600 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_0_5px_rgba(239,68,68,0.3)]" />
                       <div className="w-4 h-1 bg-blue-600 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_0_5px_rgba(59,130,246,0.3)]" />
                       <div className="w-4 h-1 bg-yellow-500 rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8),0_0_5px_rgba(250,204,21,0.3)]" />
                     </div>
                     <span className="text-[8px] font-mono text-zinc-500 tracking-[0.2em]">SYS.CTL</span>
                   </div>

                   <div className="flex gap-6 md:gap-10 items-center">
                     {/* Hardware buttons */}
                     <button onClick={() => setShowAchievements(true)} className="group flex flex-col items-center gap-1.5" title="Achievements">
                       <div className="w-10 h-6 md:w-12 md:h-8 bg-zinc-800 border-b-4 border-[#0a0a0a] rounded-sm flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] active:border-b-0 active:translate-y-1 transition-all">
                         <Trophy size={14} className="text-yellow-600 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                       </div>
                       <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-black">{t('arc.label.awards')}</span>
                     </button>

                     <button onClick={toggleFullscreen} className="group flex flex-col items-center gap-1.5" title="Fullscreen">
                       <div className="w-10 h-6 md:w-12 md:h-8 bg-zinc-800 border-b-4 border-[#0a0a0a] rounded-sm flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] active:border-b-0 active:translate-y-1 transition-all">
                         {isFullscreen ? (
                            <Minimize size={14} className="text-blue-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                         ) : (
                            <Maximize size={14} className="text-blue-500 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
                         )}
                       </div>
                       <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-black">{t('arc.label.screen')}</span>
                     </button>
                     
                     <button onClick={handlePower} className="group flex flex-col items-center gap-1.5" title="Power">
                       <div className={cn("w-10 h-6 md:w-12 md:h-8 border-b-4 rounded-sm flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.05)] active:border-b-0 active:translate-y-1 transition-all", powerState !== 'off' ? 'bg-red-900 border-[#3a0a0a]' : 'bg-zinc-800 border-[#0a0a0a]')}>
                         <Power size={14} className={cn("transition-all duration-300 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]", powerState !== 'off' ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : 'text-zinc-600')} />
                       </div>
                       <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest font-black">{t('arc.label.power')}</span>
                     </button>
                   </div>
                 </div>
               )}
               {isFullscreen && (
                 <div className="flex gap-4 items-center">
                    <div className="relative group">
                      <button aria-label={activeGame ? games.find(g => g.id === activeGame)?.title : t('arc.select_cartridge', 'SELECT CARTRIDGE')} className="bg-brand-accent/10 text-brand-accent border border-brand-accent/40 font-mono text-[10px] md:text-xs rounded px-3 py-1 uppercase hover:bg-brand-accent/20 transition-all flex items-center gap-2">
                        <Zap size={12} className="animate-pulse" />
                        <span className="hidden sm:inline">{activeGame ? games.find(g => g.id === activeGame)?.title : t('arc.select_cartridge')}</span>
                      </button>
                      <div className="absolute top-full right-0 mt-2 w-48 bg-[#050505] border border-brand-accent/30 rounded p-1 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                         {games.map(g => (
                           <button
                             key={g.id}
                             onClick={(e) => { e.currentTarget.blur(); handleInsertCartridge(g.id); }}
                             disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                             className="w-full text-left flex items-center gap-2 px-2 py-1.5 hover:bg-brand-accent/10 rounded text-white font-mono text-[10px] uppercase disabled:opacity-50"
                           >
                             <span className="text-brand-accent scale-75">{g.icon}</span>
                             {g.label}
                           </button>
                         ))}
                      </div>
                    </div>
                    <button onClick={handlePower} className="group flex flex-col items-center gap-1.5" title="Power">
                       <div className={cn("w-10 h-6 border-b-4 rounded-sm flex items-center justify-center active:border-b-0 active:translate-y-1 transition-all", powerState !== 'off' ? 'bg-red-900 border-[#3a0a0a]' : 'bg-zinc-800 border-[#0a0a0a]')}>
                         <Power size={14} className={cn("transition-all duration-300", powerState !== 'off' ? 'text-red-400' : 'text-zinc-600')} />
                       </div>
                    </button>
                    <button onClick={toggleFullscreen} className="group flex flex-col items-center gap-1.5" title="Fullscreen">
                       <div className="w-10 h-6 bg-zinc-800 border-b-4 border-[#0a0a0a] rounded-sm flex items-center justify-center active:border-b-0 active:translate-y-1 transition-all">
                         <Minimize size={14} className="text-blue-500 opacity-80 group-hover:opacity-100" />
                       </div>
                    </button>
                 </div>
               )}
             </div>

          {/* CRT Screen Frame */}
          <div className={cn(
            "bg-[#050505] flex flex-col items-center justify-center relative transition-all duration-500 group/screen w-full",
            isFullscreen ? "flex-grow min-h-0 border-none rounded-none p-0" : "border-8 border-b-[24px] md:border-[16px] md:border-b-[40px] border-[#0c0c0c] shadow-[inset_0_0_60px_rgba(0,0,0,1),0_10px_20px_rgba(0,0,0,0.8)] rounded-[20px] md:rounded-[32px] overflow-hidden p-0 aspect-auto md:aspect-square lg:aspect-[4/3] h-[55vh] min-h-[480px] max-h-[700px] md:max-h-[800px]"
          )}>
            
            {/* Glass reflection */}
            <div className="absolute top-0 right-0 w-full h-[150%] bg-gradient-to-bl from-white/5 via-white/5 to-transparent -rotate-12 translate-x-1/2 -translate-y-1/4 pointer-events-none z-[60] mix-blend-overlay transition-opacity group-hover/screen:opacity-50"></div>
            
            {/* CRT Screen Effect overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 crt crt-flicker"></div>
            
            {/* Bezel vignette */}
            <div className="absolute inset-0 z-[15] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
            
            {/* Screen Content */}
            
            <div className="absolute bottom-2 right-4 z-50 pointer-events-none opacity-40 mix-blend-screen text-brand-accent font-mono text-[8px] tracking-[0.3em] font-black drop-shadow-[0_0_4px_#22c55e]">
               {t('game.invaders.by_you', 'by Rivad')}
            </div>
            <div id="arcade-screen-container" className="relative z-10 w-full h-full flex-grow flex flex-col items-center justify-center [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-brand-accent [&_*:focus]:outline-offset-2">
              {powerState === 'off' && (
                <div className="w-full h-full min-h-[400px] bg-black"></div>
              )}

              {(powerState === 'booting' || powerState === 'waiting' || powerState === 'inserting') && (
                <div className="w-full h-full min-h-[400px] bg-black flex justify-start items-start p-6 md:p-12 overflow-y-auto relative custom-scrollbar">
                  {powerState === 'booting' && bootLog.length <= 1 && (
                    <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 bg-white z-50 pointer-events-none" />
                  )}
                  {/* Scanline overlay specifically for terminal text */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] z-10" />
                  
                  {powerState === 'inserting' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20 bg-black/40 backdrop-blur-sm">
                      <div className="relative">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 border-4 border-brand-accent/20 border-t-brand-accent rounded-full"
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 flex items-center justify-center text-brand-accent font-black text-xl"
                        >
                          {pendingGame === 'pong' ? '🏓' : pendingGame === 'tictactoe' ? '👁' : pendingGame === 'uno' ? '📢' : pendingGame === 'rpg' ? '🎨' : pendingGame === 'sellout' ? '⭐' : pendingGame === 'invaders' ? '🚀' : '🏎️'}
                        </motion.div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <motion.p 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-brand-accent font-mono text-[10px] uppercase tracking-[0.4em] font-black"
                        >
                          {t('arc.boot.loading', 'INITIALIZING DATA...')}
                        </motion.p>
                        <p className="text-zinc-500 font-mono text-[8px] uppercase tracking-widest">{t('arc.boot.please_wait', 'PLEASE REMAIN SEATED')}</p>
                      </div>
                    </div>
                  )}

                  <div className="text-brand-accent font-[var(--font-pixel)] text-[10px] md:text-xs leading-loose w-full mix-blend-screen drop-shadow-[0_0_5px_rgba(242,74,41,0.8)] z-0">
                    {bootLog.map((line, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        key={i} 
                        className={`mb-1 ${line === t('arc.boot.select') || line === t('arc.boot.start') ? "animate-pulse font-bold mt-4" : ""}`}
                      >
                        {line}
                      </motion.div>
                    ))}
                    {powerState !== 'waiting' && powerState !== 'off' && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-5 bg-brand-accent ml-1 translate-y-1"></motion.span>}
                  </div>

                  {powerState === 'waiting' && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-2 pb-24 relative z-0">
                      {games.map(g => (
                        <button
                          key={g.id}
                          aria-label={g.label}
                          onClick={() => handleInsertCartridge(g.id)}
                          className="border-2 border-brand-accent/50 bg-brand-accent/5 p-3 md:p-4 font-mono text-left hover:bg-brand-accent hover:text-black focus:bg-brand-accent focus:text-black focus:outline-none transition-colors group flex items-center gap-4"
                        >
                          <div className="text-brand-accent group-hover:text-black group-focus:text-black text-xl md:text-2xl">{g.icon}</div>
                          <div className="flex flex-col gap-0.5">
                            <div className="font-bold text-xs md:text-sm leading-tight text-brand-accent group-hover:text-black group-focus:text-black">{g.label}</div>
                            <div className="text-[8px] md:text-[10px] opacity-75 leading-tight">{g.title}</div>
                          </div>
                        </button>
                      ))}
                      <div className="col-span-1 md:col-span-2 text-center mt-8 pb-12">
                        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-5 bg-brand-accent translate-y-1 mr-2"></motion.span>
                        <span className="text-[10px] uppercase tracking-widest break-all text-brand-accent/80">{t('arc.boot.wait.line')}</span>
                      </div>
                    </div>
                  )}
                  {/* Fade-out mask at the bottom to prevent harsh cut */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />
                </div>
              )}

              <AnimatePresence mode="wait">
                {powerState === 'playing' && (
                  <motion.div
                    key={activeGame}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex justify-center p-0 md:p-4 bg-black"
                  >
                    {activeGame === 'pong' && <DebatePong isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                    {activeGame === 'tictactoe' && <IdeasTicTacToe isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                    {activeGame === 'uno' && <PoliticalUno isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                    {activeGame === 'rpg' && <ArtRPG isPausedGlobal={showPopup} hideFullscreenButton={true} onFinish={handleExitToMenu} />}
                    {activeGame === 'sellout' && <SellOutGame isPausedGlobal={showPopup} hideFullscreenButton={true} isFullscreen={isFullscreen} />}
                    {activeGame === 'invaders' && <CreativeInvaders isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                    {activeGame === 'race' && <MeetingRace isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>
          
          {/* Removing Physical Control Deck based on user request */}
</div>
        {/* End of arcadeCabinetRef */}
        </div>
        
        <AchievementsViewer 
          isOpen={showAchievements} 
          onClose={() => setShowAchievements(false)} 
        />
      </div>
    </div>
  );
}

