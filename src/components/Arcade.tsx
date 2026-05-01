import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Layers, Cpu, Paintbrush, DollarSign, MessageCircle, Target, Power, ArrowDown, Maximize, Minimize, Joystick, Trophy, Zap } from 'lucide-react';
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

export function Arcade() {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  const { playSound, playMusic } = useAudio();
  const [showPopup, setShowPopup] = useState(false);
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
        "BIOS DATE 04/23/88 15:23:44 VER 2.11 RIVAD-ENTERTAINMENT",
        "CPU: RIVAD Custom Silicon @ 8.2 MHz",
        "Memory Test: 4096K OK",
        "Initializing Video Subsystem...",
        "Loading Sisyphus OS v3.1...",
        "Device Drivers Loaded. Vector unit online.",
        "Sound Subsystem: SYNC-OK. Output: STEREO 8-BIT.",
        "Network: NO CARRIER.",
        "",
        "A:\\> WAIT FOR INPUT..."
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

  const handleInsertCartridge = (id: string) => {
    if (powerState !== 'waiting' && powerState !== 'playing') return;
    playSound('powerup');
    setPowerState('inserting');
    setPendingGame(id);
    setActiveGame(null);
    setBootLog(["A:\\> READ DRIVE A...", "LOCATING EXECUTABLE...", "LOADING TO RAM...", "EXECUTING..."]);
    
    setTimeout(() => {
      setActiveGame(id);
      setPendingGame(null);
      setPowerState('playing');
    }, 2000);
  };

  const startHoldKey = (key: string) => {
    // For clickable games, simulate TAB/Shift+TAB for Arrows if needed, but it's risky
    if (activeGame === 'uno' || activeGame === 'tictactoe' || activeGame === 'sellout') {
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

    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  };

  const stopHoldKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
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
          {/* Physical Cartridges outside the machine */}
          {!isFullscreen && (
            <div className="mb-12 relative z-20 w-full max-w-[1000px] mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px bg-zinc-800 flex-1"></div>
                <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
                  <ArrowDown size={12} className="animate-bounce text-brand-accent/50" /> {t('arc.select_cartridge', 'SELECT CARTRIDGE')}
                </p>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-3 md:grid-cols-7 gap-3 sm:gap-4 md:gap-6 preserve-3d perspective-1000">
                {games.map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => handleInsertCartridge(g.id)}
                    whileHover={{ y: -8, scale: 1.05, rotateX: 5 }}
                    whileTap={{ y: 0, scale: 0.95 }}
                    disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                    className={`flex-shrink-0 relative w-full aspect-[3/4] rounded-t-sm rounded-b flex flex-col items-center justify-start p-1.5 md:p-2 transition-all transition-colors duration-300 transform-style-3d overflow-hidden ${
                      activeGame === g.id 
                      ? 'bg-zinc-800 border-2 border-brand-accent -translate-y-4 shadow-[0_20px_40px_rgba(242,74,41,0.4),0_0_15px_rgba(242,74,41,0.6)] z-10' 
                      : 'bg-zinc-900 border-2 border-zinc-700 hover:border-zinc-500 shadow-[0_8px_15px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.05)] hover:shadow-[0_15px_25px_rgba(0,0,0,0.9)]'
                    } ${(powerState === 'off' || powerState === 'booting') ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                  >
                    {/* Metal Slider / Cartridge top */}
                    <div className="absolute top-0 inset-x-0 h-4 md:h-6 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-t-sm flex justify-center py-0.5 md:py-1 shadow-inner border-b border-zinc-900">
                       <div className="w-8 md:w-12 h-1.5 md:h-2 bg-black rounded-full shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)]"></div>
                    </div>
                    {/* Cartridge Ridges */}
                    <div className="absolute bottom-2 inset-x-2 h-4 md:h-6 flex justify-between gap-1 opacity-50">
                       <div className="w-1 md:w-1.5 h-full bg-black rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
                       <div className="w-1 md:w-1.5 h-full bg-black rounded shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"></div>
                    </div>
                    
                    {/* Label Area */}
                    <div className={`w-full mt-5 md:mt-8 flex-1 mb-6 border border-zinc-950 ${g.color} relative overflow-hidden flex flex-col items-center justify-center p-1 md:p-2 rounded-sm shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]`}>
                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent"></div>
                      <span className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] scale-75 md:scale-110 mb-1 z-10">{g.icon}</span>
                      <span className="text-[6px] md:text-[8px] text-white font-mono font-black text-center z-10 leading-[1.1] tracking-widest uppercase mt-auto drop-shadow-[0_1px_1px_rgba(0,0,0,1)] line-clamp-2">{g.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Arcade Machine Component */}
          <div className={cn(
            "relative bg-[#0a0a0a] p-4 md:p-8 md:px-12 border-x-[16px] md:border-x-[30px] border-y-[20px] mb-8 md:border-t-[40px] md:border-b-[60px] border-[#111] mx-auto overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] rounded-3xl w-full transition-all duration-500",
            isFullscreen ? "flex flex-col flex-grow min-h-0 h-full max-w-none border-none rounded-none shadow-none p-2 md:p-4 mb-0" : "max-w-[1000px] ring-1 ring-white/5"
          )}>

          {/* Cabinet texture effect */}
          <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(var(--color-brand-accent)_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="absolute inset-x-0 top-0 h-40 opacity-10 pointer-events-none bg-gradient-to-b from-brand-accent to-transparent mix-blend-screen" ></div>
          <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_20px_50px_rgba(0,0,0,0.1)]"></div>

          {/* Hardware Vents */}
          {!isFullscreen && (
             <div className="absolute top-3 md:top-6 left-1/2 -translate-x-1/2 flex gap-3 md:gap-5 opacity-60 pointer-events-none z-10">
                {Array(8).fill(0).map((_, i) => (
                   <div key={i} className="w-1.5 md:w-3 h-6 md:h-12 bg-[#050505] rounded-full shadow-[inset_1px_1px_4px_rgba(0,0,0,1),1px_1px_0_rgba(255,255,255,0.1)] border border-[#111]"></div>
                ))}
             </div>
          )}

          {/* Console Screws */}
          {!isFullscreen && (
            <>
              <div className="absolute top-4 left-4 md:top-8 md:left-8 w-4 h-4 rounded-full bg-[#111] shadow-[inset_1px_1px_3px_rgba(0,0,0,1),1px_1px_0_rgba(255,255,255,0.3)] border border-[#333] flex items-center justify-center opacity-80 z-10"><div className="w-2.5 h-0.5 bg-[#000] transform rotate-45"></div></div>
              <div className="absolute top-4 right-4 md:top-8 md:right-8 w-4 h-4 rounded-full bg-[#111] shadow-[inset_1px_1px_3px_rgba(0,0,0,1),1px_1px_0_rgba(255,255,255,0.3)] border border-[#333] flex items-center justify-center opacity-80 z-10"><div className="w-2.5 h-0.5 bg-[#000] transform rotate-12"></div></div>
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 w-4 h-4 rounded-full bg-[#111] shadow-[inset_1px_1px_3px_rgba(0,0,0,1),1px_1px_0_rgba(255,255,255,0.3)] border border-[#333] flex items-center justify-center opacity-80 z-10"><div className="w-2.5 h-0.5 bg-[#000] transform rotate-90"></div></div>
              <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 w-4 h-4 rounded-full bg-[#111] shadow-[inset_1px_1px_3px_rgba(0,0,0,1),1px_1px_0_rgba(255,255,255,0.3)] border border-[#333] flex items-center justify-center opacity-80 z-10"><div className="w-2.5 h-0.5 bg-[#000] transform -rotate-45"></div></div>
            </>
          )}
          
          <div className="flex justify-between items-center mb-6 relative z-50">
            
            <div className="flex flex-col bg-[#020205] p-3 md:p-4 rounded-xl border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
              <h2 className="text-zinc-500 font-mono font-black tracking-[0.2em] md:tracking-[0.5em] text-[8px] md:text-[10px] uppercase mb-1 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                 RIVAD CORP ENTERTAINMENT SYSTEM
              </h2>
              <h2 className="text-brand-accent font-mono font-black tracking-[0.2em] md:tracking-[0.4em] text-xs md:text-xl drop-shadow-[0_0_8px_rgba(242,74,41,0.6)] uppercase">SISYPHUS_OS_v3.1</h2>
            </div>
            
            <div className="flex gap-2 md:gap-4 items-center">
              
              {isFullscreen && (
                <div className="relative group">
                  <button className="bg-brand-accent/10 text-brand-accent border-2 border-brand-accent/40 font-mono text-[10px] md:text-xs rounded-md px-4 py-2 uppercase tracking-widest hover:bg-brand-accent/20 shadow-[0_0_15px_rgba(242,74,41,0.4)] transition-all flex items-center gap-2">
                    <Zap size={14} className="text-brand-accent animate-pulse" />
                    {activeGame ? games.find(g => g.id === activeGame)?.title : t('arc.select_cartridge')}
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#050505] border border-brand-accent/30 rounded-lg p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all z-50">
                     <p className="text-brand-accent text-[8px] uppercase tracking-[0.3em] font-bold mb-2 border-b border-brand-accent/30 pb-1 px-2">{t('arc.select_cartridge')}</p>
                     {games.map(g => (
                       <button
                         key={g.id}
                         onClick={(e) => {
                           e.currentTarget.blur();
                           handleInsertCartridge(g.id);
                         }}
                         disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                         className="w-full text-left flex items-center gap-3 px-2 py-2 hover:bg-brand-accent/10 rounded text-white font-mono text-xs uppercase disabled:opacity-50"
                       >
                         <span className="text-brand-accent">{g.icon}</span>
                         {g.label}
                       </button>
                     ))}
                  </div>
                </div>
              )}


              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center transition-all bg-zinc-800 border-zinc-700 shadow-inner hover:bg-zinc-700 text-zinc-400 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
              
              {/* Power Button */}
              <button 
                onClick={handlePower}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-4 flex items-center justify-center transition-all ${powerState !== 'off' ? 'bg-red-500 border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.6)]' : 'bg-red-950 border-red-900 shadow-inner'}`}
              >
                <Power className={powerState !== 'off' ? 'text-white' : 'text-red-800'} size={20} />
              </button>
            </div>
          </div>

          {/* CRT Screen Frame */}
          <div className={cn(
            "bg-[#050505] border-[16px] md:border-[24px] border-[#0a0a0a] flex flex-col items-center justify-center relative shadow-[inset_0_0_100px_rgba(0,0,0,1),0_10px_20px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden p-0 md:p-4 transition-all duration-500 group/screen",
            isFullscreen ? "flex-grow min-h-0 border-none rounded-none p-0 w-full" : "w-full aspect-[4/3] max-h-[600px] md:max-h-[700px] min-h-[400px]"
          )}>
            
            {/* Glass reflection */}
            <div className="absolute top-0 right-0 w-full h-[150%] bg-gradient-to-bl from-white/5 via-white/5 to-transparent -rotate-12 translate-x-1/2 -translate-y-1/4 pointer-events-none z-[60] mix-blend-overlay transition-opacity group-hover/screen:opacity-50"></div>
            
            {/* CRT Screen Effect overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 crt crt-flicker"></div>
            
            {/* Bezel vignette */}
            <div className="absolute inset-0 z-[15] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
            
            {/* Screen Content */}
            
            <div className="absolute bottom-2 right-4 z-50 pointer-events-none opacity-40 mix-blend-screen text-brand-accent font-mono text-[8px] tracking-[0.3em] font-black drop-shadow-[0_0_4px_#22c55e]">
               by Rivad
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
                    {powerState === 'waiting' && (
   <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
      {games.map(g => (
         <button
            key={g.id}
            onClick={() => handleInsertCartridge(g.id)}
            className="border-2 border-brand-accent/50 bg-brand-accent/5 p-4 font-mono text-left hover:bg-brand-accent hover:text-black transition-colors group flex items-center gap-4"
         >
            <div className="text-brand-accent group-hover:text-black">{g.icon}</div>
            <div>
               <div className="font-bold text-sm">{g.label}</div>
               <div className="text-[10px] opacity-75">{g.title}</div>
            </div>
         </button>
      ))}
      <div className="col-span-1 md:col-span-2 text-center mt-4">
         <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-5 bg-brand-accent translate-y-1 mr-2"></motion.span>
         <span className="text-[10px] uppercase tracking-widest break-all">A:\&gt; AWAITING SELECTION...</span>
      </div>
   </div>
)}
                  </div>
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
                    {activeGame === 'rpg' && <ArtRPG isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                    {activeGame === 'sellout' && <SellOutGame isPausedGlobal={showPopup} hideFullscreenButton={true} isFullscreen={isFullscreen} />}
                    {activeGame === 'invaders' && <CreativeInvaders isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                    {activeGame === 'race' && <MeetingRace isPausedGlobal={showPopup} hideFullscreenButton={true} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Vintage PC Keyboard & Drive Area */}
          {!isFullscreen && (
          <div className={cn(
            "flex flex-col md:flex-row justify-between items-center px-4 md:px-12 bg-[#080808] rounded-2xl border-t border-white/10 border-[#000] shadow-[0_20px_40px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.05)] relative z-10 gap-6 md:gap-8 flex-shrink-0 transition-all",
            "mt-8 py-8 border-b-[12px]"
          )}>
             {/* Decorative Floppy Drive */}
             <div className="flex flex-col gap-2 bg-[#1a1a24] p-3 rounded-lg border border-[#2a2a36] shadow-inner w-full md:w-64">
                <div className="bg-[#111] h-3 w-full rounded-sm relative">
                   <div className="absolute top-1/2 -translate-y-1/2 right-2 w-4 h-1 bg-[#111] rounded shadow-inner"></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                   <div className={`w-2 h-2 rounded-full shadow-inner ${powerState === 'inserting' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-900'}`}></div>
                   <button onClick={() => playSound('hit')} className="w-6 h-3 bg-[#d8dad3] border border-[#a0a29c] rounded-sm hover:translate-y-px transition-transform"></button>
                </div>
             </div>
             
             {/* Vintage Keyboard Layout chunk */}
             <div className="flex gap-6 items-center">
                {/* Arrow Keys */}
                <div className="flex flex-col items-center gap-1">
                   <button onMouseDown={() => startHoldKey('ArrowUp')} onMouseUp={() => stopHoldKey('ArrowUp')} className="w-10 h-10 md:w-12 md:h-12 bg-[#1e1e28] border-b-4 border-[#111118] text-brand-accent shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-bold hover:text-white">↑</button>
                   <div className="flex gap-1">
                     <button onMouseDown={() => startHoldKey('ArrowLeft')} onMouseUp={() => stopHoldKey('ArrowLeft')} className="w-10 h-10 md:w-12 md:h-12 bg-[#1e1e28] border-b-4 border-[#111118] text-brand-accent shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-bold hover:text-white">←</button>
                     <button onMouseDown={() => startHoldKey('ArrowDown')} onMouseUp={() => stopHoldKey('ArrowDown')} className="w-10 h-10 md:w-12 md:h-12 bg-[#1e1e28] border-b-4 border-[#111118] text-brand-accent shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-bold hover:text-white">↓</button>
                     <button onMouseDown={() => startHoldKey('ArrowRight')} onMouseUp={() => stopHoldKey('ArrowRight')} className="w-10 h-10 md:w-12 md:h-12 bg-[#1e1e28] border-b-4 border-[#111118] text-brand-accent shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-bold hover:text-white">→</button>
                   </div>
                </div>
                
                {/* Action Keys */}
                <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                     <button onMouseDown={() => startHoldKey(' ')} onMouseUp={() => stopHoldKey(' ')} className="w-32 h-10 md:h-12 bg-[#1e1e28] border-b-4 border-[#111118] text-brand-accent shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-mono text-xs font-bold hover:text-white uppercase tracking-widest flex items-center justify-center">SPACE</button>
                   </div>
                   <div className="flex gap-2">
                     <button onMouseDown={() => startHoldKey('Enter')} onMouseUp={() => stopHoldKey('Enter')} className="flex-1 h-10 md:h-12 bg-[#1e1e28] border-b-4 border-[#111118] text-brand-accent shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-mono text-xs font-bold hover:text-white uppercase flex items-center justify-center">ENTER</button>
                     <button onMouseDown={() => { stopHoldKey('Escape'); startHoldKey('Escape'); }} onMouseUp={() => stopHoldKey('Escape')} className="w-16 h-10 md:h-12 bg-red-950/30 border-b-4 border-red-900 text-red-500 shadow-[inset_0_1px_2px_rgba(239,68,68,0.2)] rounded hover:translate-y-1 hover:border-b-0 transition-all font-mono text-xs font-bold hover:text-white uppercase flex items-center justify-center">ESC</button>
                   </div>
                </div>
             </div>
          </div>
          )}
</div>
        {/* End of arcadeCabinetRef */}
        </div>
      </div>
    </div>
  );
}

