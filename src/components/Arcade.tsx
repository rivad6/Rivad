import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Layers, Cpu, Paintbrush, DollarSign, MessageCircle, Target, Power, ArrowDown, Maximize, Minimize, Joystick, Trophy } from 'lucide-react';
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

  useEffect(() => {
    // Unlock first blood achievement when entering the arcade
    unlockAchievement('first_blood');
    
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
        t('arc.boot.os'),
        t('arc.boot.bios'),
        t('arc.boot.cpu'),
        t('arc.boot.mem'),
        t('arc.boot.sound'),
        t('arc.boot.cart'),
        t('arc.boot.none'),
        "",
        t('arc.boot.select')
      ];
      
      lines.forEach((line, index) => {
        setTimeout(() => {
          setBootLog(prev => [...prev, line]);
          if (index === lines.length - 1) {
            setPowerState('waiting');
          }
        }, index * 400 + 500);
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
    setActiveGame(null);
    setBootLog([t('arc.boot.loading'), t('arc.boot.verify'), t('arc.boot.rom'), t('arc.boot.start')]);
    
    setTimeout(() => {
      setActiveGame(id);
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

    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  };

  const stopHoldKey = (key: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { key }));
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
    <div className="w-full bg-[#110f1c] border-y border-[#3a2d59] py-20 pb-40 relative">
      <div className="w-full max-w-5xl mx-auto px-6 md:px-0">
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-12 md:mt-4">
          <div>
            <h2 className="text-sm font-mono tracking-[0.2em] text-brand-accent uppercase mb-4 border-b border-brand-accent/30 pb-2 inline-block">
              {t('arc.restricted')}
            </h2>
            <h3 className="text-6xl md:text-8xl font-display uppercase tracking-tighter text-brand-ink leading-none">
              Arcade <br className="hidden md:block" />
              <span className="font-display text-brand-ink lowercase font-medium tracking-normal ml-0 md:ml-12">{t('arc.sisyphus')}</span>
            </h3>
          </div>
          <p className="text-brand-ink/80 font-sans font-light max-w-sm text-sm md:text-base leading-relaxed border-l border-brand-accent/30 pl-4 py-2">
            {t('arc.desc')}
          </p>
        </div>

        <div ref={arcadeCabinetRef} className={`flex flex-col items-center relative ${isFullscreen ? 'h-screen w-screen bg-[#110f1c] overflow-y-auto overflow-x-hidden p-4 md:p-8' : ''}`}>
          {/* 60s Interruption Popup - Moved inside the machine container */}
          <AnimatePresence>
            {showPopup && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-xl" />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="bg-zinc-950 border border-brand-accent/30 p-8 rounded-3xl max-w-sm w-full shadow-[0_0_50px_rgba(138,99,210,0.4)] flex flex-col items-center text-center gap-6 relative z-10"
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
                    className="w-full bg-brand-accent text-white py-4 rounded-full font-black uppercase tracking-[0.3em] hover:bg-brand-accent/80 transition-all font-mono text-xs shadow-[0_4px_0_#6b21a8] active:translate-y-1 active:shadow-none"
                  >
                    {t('arc.popup.btn', 'CONTINUAR')}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {/* Physical Cartridges outside the machine */}
          {!isFullscreen && (
            <div className="mb-8 relative z-20 w-full">
              <p className="text-white/50 font-mono text-xs tracking-widest uppercase mb-4 flex items-center gap-2">
                <ArrowDown size={14} className="animate-bounce" /> {t('arc.select_cartridge')}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-4">
                {games.map((g) => (
                  <motion.button
                    key={g.id}
                    onClick={() => handleInsertCartridge(g.id)}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ y: 0, scale: 0.98 }}
                    disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                    className={`flex-shrink-0 relative w-24 h-32 md:w-32 md:h-36 rounded-t-lg rounded-b-sm border-2 border-zinc-700 bg-zinc-800 flex flex-col items-center justify-between p-1.5 md:p-2 shadow-[4px_4px_0_rgba(0,0,0,0.5)] transition-colors overflow-hidden ${activeGame === g.id ? 'border-brand-accent -translate-y-4 shadow-[0_10px_20px_rgba(var(--color-brand-accent-rgb),0.3)]' : 'hover:border-zinc-500'} ${(powerState === 'off' || powerState === 'booting') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {/* Cartridge Ridges */}
                    <div className="w-full flex justify-between px-2 opacity-30 mt-1">
                      <div className="w-1 h-3 bg-black"></div>
                      <div className="w-1 h-3 bg-black"></div>
                      <div className="w-1 h-3 bg-black"></div>
                      <div className="w-1 h-3 bg-black"></div>
                      <div className="w-1 h-3 bg-black"></div>
                    </div>
                    {/* Cartridge Label */}
                    <div className={`w-full flex-grow mx-1 my-1 md:my-2 border-2 border-zinc-900 ${g.color} relative overflow-hidden flex flex-col items-center justify-center p-1 rounded-sm`}>
                      <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                      <div className="bg-white/20 p-2 md:p-3 rounded-full mb-1 sm:mb-2 shadow-inner border border-white/30 backdrop-blur-sm z-10 scale-75 sm:scale-100">
                        <span className="text-white drop-shadow-md block transition-transform group-hover:scale-110">{g.icon}</span>
                      </div>
                      <span className="text-[7px] md:text-[9px] text-white font-mono font-black text-center z-10 leading-tight tracking-wider uppercase drop-shadow-md">{g.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Arcade Machine Component */}
          <div className={`relative bg-[#222222] p-4 md:p-8 border-x-[16px] border-y-[24px] border-[#18181b] mx-auto overflow-hidden shadow-[20px_20px_0px_0px_rgba(0,0,0,0.8)] rounded-xl w-full max-w-4xl ${isFullscreen ? 'flex flex-col flex-grow min-h-[500px] max-h-screen' : ''}`}>

          
          {/* Wood panel texture effect */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10 block">
            <h2 className="text-[#8a63d2] font-mono font-black tracking-[0.2em] md:tracking-[0.5em] text-xs md:text-xl drop-shadow-[0_0_10px_rgba(138,99,210,0.8)] uppercase">SISYPHUS_ENTERTAINMENT</h2>
            
            <div className="flex gap-2 md:gap-4 items-center">
              {isFullscreen && (
                <select 
                  value={activeGame || ''}
                  onChange={(e) => handleInsertCartridge(e.target.value)}
                  disabled={powerState === 'off' || powerState === 'booting' || powerState === 'inserting'}
                  className="bg-zinc-800 text-zinc-300 font-mono text-[10px] md:text-xs border-2 border-zinc-700 rounded-md p-1 md:p-2 uppercase outline-none focus:border-brand-accent transition-colors"
                >
                  <option value="" disabled>{t('arc.select_cartridge')}</option>
                  {games.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
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
          <div className={`bg-[#05040a] border-[8px] md:border-[12px] border-[#111] min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center relative shadow-[inset_0_0_80px_rgba(0,0,0,1)] rounded-3xl overflow-hidden p-0 md:p-4 ${isFullscreen ? 'flex-grow' : ''}`}>
            
            {/* CRT Screen Effect overlay */}
            <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-[0.35]">
              <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            </div>
            
            {/* Bezel vignette */}
            <div className="absolute inset-0 z-[15] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.8)_100%)]" />
            
            {/* Screen Content */}
            <div id="arcade-screen-container" className="relative z-10 w-full h-full flex-grow flex flex-col items-center justify-center [&_*:focus-visible]:outline-2 [&_*:focus-visible]:outline-brand-accent [&_*:focus]:outline-offset-2">
              {powerState === 'off' && (
                <div className="w-full h-full min-h-[400px] bg-black"></div>
              )}

              {(powerState === 'booting' || powerState === 'waiting' || powerState === 'inserting') && (
                <div className="w-full h-full min-h-[400px] bg-black flex justify-start items-start p-6 md:p-12 overflow-y-auto relative custom-scrollbar">
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
                          {activeGame === 'pong' ? '🏓' : activeGame === 'tictactoe' ? '👁' : activeGame === 'uno' ? '📢' : activeGame === 'rpg' ? '🎨' : activeGame === 'sellout' ? '⭐' : activeGame === 'invaders' ? '🚀' : '🏎️'}
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

                  <div className="text-green-500 font-mono text-xs md:text-sm leading-loose w-full mix-blend-screen drop-shadow-[0_0_5px_rgba(34,197,94,0.8)] z-0">
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
                    {powerState !== 'waiting' && powerState !== 'off' && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-5 bg-green-500 ml-1 translate-y-1"></motion.span>}
                    {powerState === 'waiting' && <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-5 bg-green-500 ml-1 translate-y-1"></motion.span>}
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
                    {activeGame === 'pong' && <DebatePong isPausedGlobal={showPopup} />}
                    {activeGame === 'tictactoe' && <IdeasTicTacToe isPausedGlobal={showPopup} />}
                    {activeGame === 'uno' && <PoliticalUno isPausedGlobal={showPopup} />}
                    {activeGame === 'rpg' && <ArtRPG isPausedGlobal={showPopup} />}
                    {activeGame === 'sellout' && <SellOutGame isPausedGlobal={showPopup} />}
                    {activeGame === 'invaders' && <CreativeInvaders isPausedGlobal={showPopup} />}
                    {activeGame === 'race' && <MeetingRace isPausedGlobal={showPopup} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Arcade Cabinet Control Area */}
          <div className="mt-8 flex justify-between items-center px-4 md:px-12 bg-zinc-900 py-6 rounded-xl border-t border-zinc-700 shadow-inner relative z-10">
             {/* Joysticks/Buttons decorative */}
             <div className="flex gap-4 md:gap-6 items-center">
                {/* D-Pad / Joystick Replacement for aesthetics and function */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 bg-zinc-800 rounded-full shadow-[inset_0_0_10px_rgba(0,0,0,0.8),0_0_5px_rgba(0,0,0,0.5)] border-2 border-zinc-900 flex items-center justify-center p-1">
                   <div className="absolute top-0 bottom-0 left-1/3 right-1/3 bg-zinc-900/50"></div>
                   <div className="absolute left-0 right-0 top-1/3 bottom-1/3 bg-zinc-900/50"></div>
                   
                   <button 
                     onMouseDown={() => startHoldKey('ArrowUp')} onMouseUp={() => stopHoldKey('ArrowUp')} onMouseLeave={() => stopHoldKey('ArrowUp')}
                     onTouchStart={() => startHoldKey('ArrowUp')} onTouchEnd={() => stopHoldKey('ArrowUp')}
                     className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 bg-zinc-700 hover:bg-zinc-600 rounded-t-md active:bg-zinc-500 transition-colors" />
                   <button 
                     onMouseDown={() => startHoldKey('ArrowDown')} onMouseUp={() => stopHoldKey('ArrowDown')} onMouseLeave={() => stopHoldKey('ArrowDown')}
                     onTouchStart={() => startHoldKey('ArrowDown')} onTouchEnd={() => stopHoldKey('ArrowDown')}
                     className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 md:w-8 md:h-8 bg-zinc-700 hover:bg-zinc-600 rounded-b-md active:bg-zinc-500 transition-colors" />
                   <button 
                     onMouseDown={() => startHoldKey('ArrowLeft')} onMouseUp={() => stopHoldKey('ArrowLeft')} onMouseLeave={() => stopHoldKey('ArrowLeft')}
                     onTouchStart={() => startHoldKey('ArrowLeft')} onTouchEnd={() => stopHoldKey('ArrowLeft')}
                     className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-zinc-700 hover:bg-zinc-600 rounded-l-md active:bg-zinc-500 transition-colors" />
                   <button 
                     onMouseDown={() => startHoldKey('ArrowRight')} onMouseUp={() => stopHoldKey('ArrowRight')} onMouseLeave={() => stopHoldKey('ArrowRight')}
                     onTouchStart={() => startHoldKey('ArrowRight')} onTouchEnd={() => stopHoldKey('ArrowRight')}
                     className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 bg-zinc-700 hover:bg-zinc-600 rounded-r-md active:bg-zinc-500 transition-colors" />
                   
                   <div className="w-6 h-6 md:w-8 md:h-8 bg-zinc-600 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)] pointer-events-none z-10" />
                </div>
                
                <div className="flex gap-2 md:gap-3 items-end h-full mt-4">
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onMouseDown={() => startHoldKey(' ')} onMouseUp={() => stopHoldKey(' ')} onMouseLeave={() => stopHoldKey(' ')}
                      onTouchStart={() => startHoldKey(' ')} onTouchEnd={() => stopHoldKey(' ')}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-600 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_4px_0_#1e3a8a] border border-blue-400 active:translate-y-1 active:shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_0px_0_#1e3a8a] transition-all"></button>
                     <span className="text-[8px] md:text-[10px] font-mono text-zinc-500 font-bold uppercase">{t('arc.btn.action')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 -mt-4 md:-mt-6">
                    <button 
                      onMouseDown={() => startHoldKey('Enter')} onMouseUp={() => stopHoldKey('Enter')} onMouseLeave={() => stopHoldKey('Enter')}
                      onTouchStart={() => startHoldKey('Enter')} onTouchEnd={() => stopHoldKey('Enter')}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_4px_0_#a16207] border border-yellow-300 active:translate-y-1 active:shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_0px_0_#a16207] transition-all"></button>
                    <span className="text-[8px] md:text-[10px] font-mono text-zinc-500 font-bold uppercase">{t('arc.btn.select')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button 
                      onMouseDown={() => { stopHoldKey('Escape'); startHoldKey('Escape'); }} onMouseUp={() => stopHoldKey('Escape')} onMouseLeave={() => stopHoldKey('Escape')}
                      onTouchStart={() => { stopHoldKey('Escape'); startHoldKey('Escape'); }} onTouchEnd={() => stopHoldKey('Escape')}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-600 shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_4px_0_#7f1d1d] border border-red-400 active:translate-y-1 active:shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.5),0_0px_0_#7f1d1d] transition-all"></button>
                    <span className="text-[8px] md:text-[10px] font-mono text-zinc-500 font-bold uppercase">{t('arc.btn.back')}</span>
                  </div>
                </div>
             </div>
             
             {/* Coin Slot */}
             <div className="flex flex-col items-center gap-2">
               <div className="w-10 h-14 md:w-12 md:h-16 bg-zinc-800 border-2 border-zinc-950 rounded-sm flex flex-col items-center justify-start py-2 shadow-inner">
                  <div className="w-2 h-6 md:h-8 bg-black rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]" />
                  <div className="w-5 h-2 md:w-6 md:h-3 bg-orange-500 mt-2 rounded-sm opacity-80 shadow-[0_0_5px_#f97316]"></div>
               </div>
               <span className="text-zinc-500 text-[8px] md:text-[10px] tracking-widest font-mono font-black uppercase">{t('game.insert', 'INSERT COIN')}</span>
             </div>
          </div>
        </div>
        {/* End of arcadeCabinetRef */}
        </div>
      </div>
    </div>
  );
}

