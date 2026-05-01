import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Paintbrush } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { FullscreenButton } from '../ui/FullscreenButton';
import { cn } from '../../lib/utils';

type NodeId = string;

interface Choice {
  textKey: string;
  next: NodeId;
}

interface StoryNode {
  textKey: string;
  choices: Choice[];
  isEnding?: boolean;
}

const generatePathMapping = (p: string): Record<string, StoryNode> => {
  return {
    [`${p}.q2`]: {
      textKey: `game.rpg.${p}.q2`,
      choices: [
        { textKey: `game.rpg.${p}.q2.a`, next: `${p}.q3a` },
        { textKey: `game.rpg.${p}.q2.b`, next: `${p}.q3b` }
      ]
    },
    [`${p}.q3a`]: {
      textKey: `game.rpg.${p}.q3a`,
      choices: [
        { textKey: `game.rpg.${p}.q3a.1`, next: `${p}.q4a1` },
        { textKey: `game.rpg.${p}.q3a.2`, next: `${p}.q4a2` }
      ]
    },
    [`${p}.q3b`]: {
      textKey: `game.rpg.${p}.q3b`,
      choices: [
        { textKey: `game.rpg.${p}.q3b.1`, next: `${p}.q4b1` },
        { textKey: `game.rpg.${p}.q3b.2`, next: `${p}.q4b2` }
      ]
    },
    [`${p}.q4a1`]: {
      textKey: `game.rpg.${p}.q4a1`,
      choices: [
        { textKey: `game.rpg.${p}.q4a1.1`, next: `${p}.e1` },
        { textKey: `game.rpg.${p}.q4a1.2`, next: `${p}.e2` }
      ]
    },
    [`${p}.q4a2`]: {
      textKey: `game.rpg.${p}.q4a2`,
      choices: [
        { textKey: `game.rpg.${p}.q4a2.1`, next: `${p}.e3` },
        { textKey: `game.rpg.${p}.q4a2.2`, next: `${p}.e4` }
      ]
    },
    [`${p}.q4b1`]: {
      textKey: `game.rpg.${p}.q4b1`,
      choices: [
        { textKey: `game.rpg.${p}.q4b1.1`, next: `${p}.e5` },
        { textKey: `game.rpg.${p}.q4b1.2`, next: `${p}.e6` }
      ]
    },
    [`${p}.q4b2`]: {
      textKey: `game.rpg.${p}.q4b2`,
      choices: [
        { textKey: `game.rpg.${p}.q4b2.1`, next: `${p}.e7` },
        { textKey: `game.rpg.${p}.q4b2.2`, next: `${p}.e8` }
      ]
    },
    // Expanding to 8 distinct bizarre endings per path for maximal hilacion
    [`${p}.e1`]: { textKey: `game.rpg.${p}.e1`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.1` }] },
    [`${p}.e2`]: { textKey: `game.rpg.${p}.e2`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.2` }] },
    [`${p}.e3`]: { textKey: `game.rpg.${p}.e3`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.3` }] },
    [`${p}.e4`]: { textKey: `game.rpg.${p}.e4`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.4` }] },
    [`${p}.e5`]: { textKey: `game.rpg.${p}.e5`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.5` }] },
    [`${p}.e6`]: { textKey: `game.rpg.${p}.e6`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.6` }] },
    [`${p}.e7`]: { textKey: `game.rpg.${p}.e7`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.7` }] },
    [`${p}.e8`]: { textKey: `game.rpg.${p}.e8`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.8` }] },
    [`${p}.final.1`]: { textKey: `game.rpg.${p}.e1`, choices: [], isEnding: true },
    [`${p}.final.2`]: { textKey: `game.rpg.${p}.e2`, choices: [], isEnding: true },
    [`${p}.final.3`]: { textKey: `game.rpg.${p}.e3`, choices: [], isEnding: true },
    [`${p}.final.4`]: { textKey: `game.rpg.${p}.e4`, choices: [], isEnding: true },
    [`${p}.final.5`]: { textKey: `game.rpg.${p}.e5`, choices: [], isEnding: true },
    [`${p}.final.6`]: { textKey: `game.rpg.${p}.e6`, choices: [], isEnding: true },
    [`${p}.final.7`]: { textKey: `game.rpg.${p}.e7`, choices: [], isEnding: true },
    [`${p}.final.8`]: { textKey: `game.rpg.${p}.e8`, choices: [], isEnding: true },
  };
};

const storyMap: Record<string, StoryNode> = {
  start: {
    textKey: 'game.rpg.start',
    choices: [{ textKey: 'game.rpg.start', next: 'q1' }]
  },
  q1: {
    textKey: 'game.rpg.q1',
    choices: [
      { textKey: 'game.rpg.q1.1', next: 'p1.q2' },
      { textKey: 'game.rpg.q1.2', next: 'p2.q2' },
      { textKey: 'game.rpg.q1.3', next: 'p3.q2' },
      { textKey: 'game.rpg.q1.4', next: 'p4.q2' },
      { textKey: 'game.rpg.q1.5', next: 'p5.q2' },
      { textKey: 'game.rpg.q1.6', next: 'p6.q2' },
      { textKey: 'game.rpg.q1.7', next: 'p7.q2' },
      { textKey: 'game.rpg.q1.8', next: 'p8.q2' }
    ]
  },
  ...generatePathMapping('p1'),
  ...generatePathMapping('p2'),
  ...generatePathMapping('p3'),
  ...generatePathMapping('p4'),
  ...generatePathMapping('p5'),
  ...generatePathMapping('p6'),
  ...generatePathMapping('p7'),
  ...generatePathMapping('p8'),
  
  
  'fail_budget': { textKey: 'game.rpg.fail_budget', choices: [], isEnding: true },
  'fail_sanity': { textKey: 'game.rpg.fail_sanity', choices: [], isEnding: true },
  'fail_reputation': { textKey: 'game.rpg.fail_reputation', choices: [], isEnding: true },


  // THE NEW BIZARRE EXTENSION
  'boss.q1': {
    textKey: 'game.rpg.boss.q1',
    choices: [
      { textKey: 'game.rpg.boss.q1.a', next: 'boss.q2a' },
      { textKey: 'game.rpg.boss.q1.b', next: 'boss.q2b' }
    ]
  },
  'boss.q2a': {
    textKey: 'game.rpg.boss.q2a',
    choices: [
      { textKey: 'game.rpg.boss.q2a.1', next: 'boss.e1' },
      { textKey: 'game.rpg.boss.q2a.2', next: 'boss.e2' }
    ]
  },
  'boss.q2b': {
    textKey: 'game.rpg.boss.q2b',
    choices: [
      { textKey: 'game.rpg.boss.q2b.1', next: 'boss.e3' },
      { textKey: 'game.rpg.boss.q2b.2', next: 'boss.e4' }
    ]
  },
  'boss.e1': { textKey: 'game.rpg.boss.e1', choices: [], isEnding: true },
  'boss.e2': { textKey: 'game.rpg.boss.e2', choices: [], isEnding: true },
  'boss.e3': { textKey: 'game.rpg.boss.e3', choices: [], isEnding: true },
  'boss.e4': { textKey: 'game.rpg.boss.e4', choices: [], isEnding: true },
};

const getMoodColors = (nodeId: string) => {
  if (nodeId.startsWith('p1')) return { bg: 'bg-[#1a1103]', border: 'border-amber-500/50', accent: 'text-amber-400' }; // Warm/Catering
  if (nodeId.startsWith('p2')) return { bg: 'bg-[#12031a]', border: 'border-purple-500/50', accent: 'text-purple-400' }; // Mysterious/Artist
  if (nodeId.startsWith('p3')) return { bg: 'bg-[#031a1a]', border: 'border-cyan-500/50', accent: 'text-cyan-400' }; // Technical/AI
  if (nodeId.startsWith('p4')) return { bg: 'bg-[#1a0303]', border: 'border-red-500/50', accent: 'text-red-400' }; // Politics/Aggressive
  if (nodeId.startsWith('p5')) return { bg: 'bg-[#03031a]', border: 'border-blue-500/50', accent: 'text-blue-400' }; // Aquatic/Flood
  if (nodeId.startsWith('p6')) return { bg: 'bg-[#1a030c]', border: 'border-pink-500/50', accent: 'text-pink-400' }; // Influencer/Pop
  return { bg: 'bg-[#0a0a0B]', border: 'border-white/10', accent: 'text-brand-accent' }; // Default
}

export function ArtRPG({ isPausedGlobal = false, hideFullscreenButton = false, onFinish }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean, onFinish?: () => void }) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const [currentNode, setCurrentNode] = useState<NodeId>('start');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Stats system to make decisions feel coherent and impactful
  const [stats, setStats] = useState({ budget: 50, sanity: 50, reputation: 50 });
  const [inventory, setInventory] = useState<string[]>([]);
  const [lastStatDelta, setLastStatDelta] = useState<{b: number, s: number, r: number} | null>(null);

  useEffect(() => {
    const isPlaying = currentNode !== 'start' && !storyMap[currentNode]?.isEnding;
    if (isPlaying && !isPausedGlobal) {
      playMusic('rpg');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [currentNode, playMusic, isPausedGlobal]);

  // Handle Joystick and Button navigation for Arcade Cabinet
  useEffect(() => {
    if (isPausedGlobal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const node = storyMap[currentNode] || { textKey: 'game.rpg.fail.fallback', choices: [], isEnding: true };
      if (!node || node.isEnding) return;
      
      const choiceCount = node.choices.length;
      if (choiceCount === 0) return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        setSelectedIndex(prev => (prev - 1 + choiceCount) % choiceCount);
        playSound('hover');
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        setSelectedIndex(prev => (prev + 1) % choiceCount);
        playSound('hover');
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (node.choices[selectedIndex]) {
          handleChoice(node.choices[selectedIndex].next, selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNode, selectedIndex, isPausedGlobal, playSound]);

  useEffect(() => {
    if (isPausedGlobal) return;
    if (stats.budget <= 0 && currentNode !== 'fail_budget') {
      setCurrentNode('fail_budget');
    } else if (stats.sanity <= 0 && currentNode !== 'fail_sanity') {
      setCurrentNode('fail_sanity');
    } else if (stats.reputation <= 0 && currentNode !== 'fail_reputation') {
      setCurrentNode('fail_reputation');
    }
  }, [stats, currentNode, isPausedGlobal]);

  const node = storyMap[currentNode];

  const [activeEvent, setActiveEvent] = useState<{text: string} | null>(null);

  useEffect(() => {
    if (node.isEnding) {
      playSound('win');
      unlockAchievement('red_pill');
    }
    setSelectedIndex(0);

    // Random life events
    if (currentNode !== 'start' && !node.isEnding && Math.random() < 0.2) {
      const events = [
        { b: -10, s: -5, r: 0, text: '¡Un café caro te ha dejado sin presupuesto!' },
        { b: 5, s: -10, r: 10, text: '¡Has sido mencionado en una revista de arte!' },
        { b: 0, s: 10, r: -5, text: '¡Meditar te ha ayudado a recuperar la cordura!' }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      setLastStatDelta({ b: event.b, s: event.s, r: event.r });
      setStats(prev => ({
        budget: Math.min(100, Math.max(0, prev.budget + event.b)),
        sanity: Math.min(100, Math.max(0, prev.sanity + event.s)),
        reputation: Math.min(100, Math.max(0, prev.reputation + event.r))
      }));
      setActiveEvent({ text: event.text });
      setTimeout(() => setActiveEvent(null), 3000);
    }
  }, [currentNode, node.isEnding, playSound, unlockAchievement]);

  const handleChoice = (next: NodeId, choiceIndex?: number) => {
    if (isPausedGlobal) return;
    if (next === 'start') {
      playSound('hover');
      setStats({ budget: 50, sanity: 50, reputation: 50 });
      setInventory([]);
      setLastStatDelta(null);
    } else {
      playSound('click');
      
      // Calculate coherent stat impacts based on choice index (0 = usually artistic/crazy, 1 = practical/destructive)
      let bDelta = 0;
      let sDelta = 0;
      let rDelta = 0;
        
      if (choiceIndex !== undefined) {
        if (choiceIndex === 0) {
          bDelta = Math.floor(Math.random() * -10) - 5;
          sDelta = Math.floor(Math.random() * -15) - 5;
          rDelta = Math.floor(Math.random() * 20) + 10;
        } else if (choiceIndex === 1) {
          bDelta = Math.floor(Math.random() * 15) + 5;
          sDelta = Math.floor(Math.random() * -20) - 10;
          rDelta = Math.floor(Math.random() * -15) - 5;
        }
        
        setLastStatDelta({ b: bDelta, s: sDelta, r: rDelta });
        setStats(prev => ({
          budget: Math.min(100, Math.max(0, prev.budget + bDelta)),
          sanity: Math.min(100, Math.max(0, prev.sanity + sDelta)),
          reputation: Math.min(100, Math.max(0, prev.reputation + rDelta))
        }));
      }
    }
    setCurrentNode(next);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPausedGlobal) return;
      if (node.isEnding) {
        if (e.key === 'Enter' || e.key === ' ') {
          handleChoice('start');
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w') {
        setSelectedIndex(prev => Math.max(0, prev - 1));
        playSound('hover');
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        setSelectedIndex(prev => Math.min(node.choices.length - 1, prev + 1));
        playSound('hover');
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (node.choices[selectedIndex]) {
          handleChoice(node.choices[selectedIndex].next, selectedIndex);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [node, selectedIndex, playSound]);

  const renderEndingText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-[#8a63d2] font-bold text-lg md:text-xl">{lines[0]}</h4>
        <p className="text-[#e2d5f8] text-sm md:text-base leading-relaxed whitespace-pre-line">{lines.slice(1).join('\n')}</p>
      </div>
    );
  };

  const containerRef = useRef<HTMLDivElement>(null);

  const mood = getMoodColors(currentNode);

  if (currentNode === 'start') {
    return (
      <div ref={containerRef} className={cn("w-full h-full flex items-center justify-center p-4 transition-all duration-1000 overflow-y-auto custom-scrollbar", mood.bg)}>
        {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2" />}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className={cn("w-full max-w-2xl flex flex-col justify-center items-center text-center p-6 sm:p-12 rounded-3xl border-2 transition-all duration-1000 relative shadow-2xl overflow-hidden [&.is-fullscreen]:shadow-none [&.is-fullscreen]:border-none shadow-brand-accent/20", mood.border, mood.bg)}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(138,99,210,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,99,210,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-20" />
          
          <div className="relative z-10 w-full mb-8 flex justify-between items-end border-b pb-2 transition-colors duration-1000 border-white/10">
            <span className="text-white/40 font-mono text-[10px] tracking-widest uppercase italic">Curator Simulator v2.5</span>
            <span className="text-white/40 font-mono text-[10px] uppercase">{t('game.objective')}{t('game.rpg.goal')}</span>
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10"
          >
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2 italic relative inline-block">
              {t('game.rpg.title')}
              <span className="absolute -top-6 -right-6 rotate-12 text-[10px] bg-brand-accent text-white font-bold px-2 py-0.5 border border-white drop-shadow-md shadow-[0_0_10px_rgba(138,99,210,0.8)]">BY RIVAD</span>
            </h3>
            <div className="h-1 w-24 bg-brand-accent mx-auto mb-12 rounded-full shadow-[0_0_15px_rgba(138,99,210,0.8)]" />
          </motion.div>

          <button
            aria-label={t('game.rpg.start')}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice('q1'); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice('q1'); }}
            className="px-12 py-5 bg-white text-black font-black text-xs md:text-sm uppercase tracking-[0.4em] hover:bg-brand-accent hover:text-white transition-all shadow-xl shadow-brand-accent/30 cursor-pointer z-50 relative rounded-2xl active:scale-95"
          >
            {t('game.rpg.start')}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("w-full h-full flex flex-col p-4 sm:p-10 transition-colors duration-1000 relative overflow-y-auto custom-scrollbar font-mono [&.is-fullscreen]:shadow-none [&.is-fullscreen]:rounded-none [&.is-fullscreen]:border-none", mood.bg)}>
      {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2" />}
      
      {activeEvent && (
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -20 }}
           className="absolute top-20 right-4 z-50 bg-brand-accent/90 text-white p-4 rounded-xl border border-white/20 shadow-2xl"
         >
           {activeEvent.text}
         </motion.div>
       )}
      
      {/* Universal Pause Overlay */}
      <AnimatePresence>
        {isPausedGlobal && currentNode !== 'start' && !node.isEnding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2">
              <Paintbrush className="w-12 h-12 text-brand-accent animate-pulse" />
              <h2 className="text-white font-black text-2xl uppercase tracking-[0.3em]">
                {t('game.paused.system', 'ART SUSPENDED')}
              </h2>
            </div>
            <p className="text-zinc-500 text-[10px] uppercase font-bold text-center px-16 leading-relaxed max-w-xs">
              {t('game.paused.desc', 'The creative timeline is temporarily frozen. Please wait.')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Background Glow */}
      <div className={cn("absolute -top-40 -right-40 w-96 h-96 blur-[150px] opacity-20 rounded-full transition-colors duration-1000", mood.accent.replace('text-', 'bg-'))} />
      <div className={cn("absolute -bottom-40 -left-40 w-96 h-96 blur-[150px] opacity-10 rounded-full transition-colors duration-1000", mood.accent.replace('text-', 'bg-'))} />
      
      {/* Header Info */}
      <div className={cn("flex flex-col gap-6 border-b pb-6 mb-4 shrink-0 transition-colors duration-1000", mood.border)}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className={cn("w-3 h-3 rounded-full animate-pulse", mood.accent.replace('text-', 'bg-'))} />
             <span className="text-[10px] uppercase font-black tracking-[0.5em] text-white/40 italic">ART_TERM_LOG // SYSTEM_READY</span>
          </div>
          <div className={cn("text-[9px] uppercase font-black px-4 py-1.5 rounded-full border transition-colors duration-1000", mood.border, "text-white/60 bg-white/5")}>
             {node.isEnding ? 'ARCHIVE_SYNC' : 'REALTIME_SIM'}
          </div>
        </div>
        
        {!node.isEnding && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'BUDGET', value: stats.budget, color: 'bg-amber-400', icon: '💰' },
              { label: 'SANITY', value: stats.sanity, color: 'bg-blue-400', icon: '🧠' },
              { label: 'REP', value: stats.reputation, color: mood.accent.replace('text-', 'bg-'), icon: '✨' }
            ].map(stat => (
              <div key={stat.label} className="bg-black/20 backdrop-blur-sm p-3 rounded-2xl border border-white/5 flex flex-col gap-2 transition-all hover:border-white/10">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] text-white/30">
                  <span className="flex items-center gap-2">{stat.icon} {stat.label}</span>
                  <span className={cn(stat.value < 25 ? "text-red-500 animate-pulse" : "text-white/60")}>{stat.value}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={false} 
                    animate={{ width: `${stat.value}%` }} 
                    className={cn("h-full transition-colors duration-1000", stat.color)} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 md:gap-12 py-4 md:py-8">
        {/* Left icon col */}
        <div className="hidden md:flex flex-col items-center justify-center w-48 shrink-0">
           <motion.div
             key={currentNode + '_art'}
             initial={{ scale: 0.8, opacity: 0, y: 10 }}
             animate={{ scale: 1, opacity: 1, y: 0 }}
             className={cn("text-8xl filter drop-shadow-2xl grayscale transition-all duration-1000 hover:grayscale-0", mood.accent.includes('brand') ? '' : 'brightness-125')}
           >
             {currentNode === 'start' ? '🎟️' : node.isEnding ? '🏁' : currentNode.startsWith('p1') ? '🥂' : currentNode.startsWith('p2') ? '🎨' : currentNode.startsWith('p3') ? '💾' : currentNode.startsWith('p4') ? '🏛️' : currentNode.startsWith('p5') ? '🌊' : currentNode.startsWith('p6') ? '🎥' : '💎'}
           </motion.div>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col justify-center gap-6 md:gap-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="flex items-center gap-3">
                 <div className={cn("w-1 h-4 md:h-6 rounded-full transition-colors duration-1000", mood.accent.replace('text-', 'bg-'))} />
                 <span className={cn("text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em]", mood.accent)}>{node.isEnding ? 'FINAL_STATEMENT' : 'LOG_ENTRY_' + currentNode.toUpperCase()}</span>
              </div>
              
              <div className="relative pl-4 md:pl-6">
                <span className={cn("absolute left-0 top-0 font-black animate-pulse", mood.accent)}>{'>'}</span>
                <p className="text-lg sm:text-2xl md:text-3xl text-white font-medium leading-[1.1] tracking-tight">
                  {t(node.textKey)}
                </p>
              </div>

              {lastStatDelta && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-wrap gap-2 md:gap-3"
                >
                  {lastStatDelta.b !== 0 && <span className={cn("px-2 py-1 rounded text-[7px] md:text-[8px] font-black uppercase", lastStatDelta.b > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-500")}>BUGRET: {lastStatDelta.b > 0 ? '+' : ''}{lastStatDelta.b}</span>}
                  {lastStatDelta.s !== 0 && <span className={cn("px-2 py-1 rounded text-[7px] md:text-[8px] font-black uppercase", lastStatDelta.s > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-500")}>SANITY: {lastStatDelta.s > 0 ? '+' : ''}{lastStatDelta.s}</span>}
                  {lastStatDelta.r !== 0 && <span className={cn("px-2 py-1 rounded text-[7px] md:text-[8px] font-black uppercase", lastStatDelta.r > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-500")}>REPUTATION: {lastStatDelta.r > 0 ? '+' : ''}{lastStatDelta.r}</span>}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Prompt / Actions */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentNode + '-choices'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-2 md:gap-3"
              >
                {node.isEnding ? (
                  <div className="flex flex-col gap-3">
                    <motion.button
                      aria-label={t('game.rpg.restart')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice('start')}
                      className={cn("w-full py-4 md:py-5 text-black bg-white rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.5em] transition-all shadow-2xl active:scale-95 shadow-white/10")}
                    >
                      {t('game.rpg.restart', 'REINTENTAR / NUEVA HISTORIA')}
                    </motion.button>
                    {onFinish && (
                      <motion.button
                        aria-label="EXIT TO MENU"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onFinish}
                        className="w-full py-3 md:py-4 border-2 border-brand-accent/50 text-brand-accent rounded-2xl text-[8px] md:text-[9px] font-black uppercase tracking-[0.5em] hover:bg-brand-accent/10 transition-all opacity-80"
                      >
                        {t('game.rpg.exit', 'SALIR AL MENÚ PRINCIPAL')}
                      </motion.button>
                    )}
                  </div>
                ) : (
                  node.choices.map((choice, idx) => (
                    <motion.button
                      aria-label={t(choice.textKey)}
                      key={choice.textKey}
                      whileHover={{ x: 10, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice(choice.next, idx)}
                      className={cn(
                        "w-full px-4 md:px-6 py-3 md:py-4 text-left flex items-center justify-between rounded-xl md:rounded-2xl border-2 transition-all group active:scale-95",
                        idx === selectedIndex ? "bg-white text-black border-white" : cn("bg-white/5 text-white/60 hover:text-white hover:bg-white/10", mood.border)
                      )}
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <span className={cn("text-[8px] md:text-[9px] font-black transition-colors px-1.5 md:px-2 py-0.5 md:py-1 rounded", idx === selectedIndex ? "bg-black text-white" : "bg-white/10 text-white/30 group-hover:text-white/60")}>0{idx + 1}</span>
                        <span className="text-[10px] md:text-xs uppercase font-black tracking-widest">{t(choice.textKey)}</span>
                      </div>
                      <span className={cn("transition-all", idx === selectedIndex ? "translate-x-0 opacity-100" : "translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 font-black")}>→</span>
                    </motion.button>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Aesthetic Footer */}
      <div className="flex justify-between items-center text-[7px] font-black text-white/10 uppercase tracking-[0.4em] pt-8 border-t border-white/5">
         <span>SIM_SECTOR_V6 // PROTOCOL_BYPASS_ACTIVE</span>
         <span className="text-brand-accent/40">{t('game.rpg.label.layer')}: {currentNode.startsWith('boss') ? 'BIZARRE_OVERLAY' : 'STANDARD_REALITY'}</span>
         <span>TIMESTAMP: {new Date().toISOString()}</span>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #110f1c; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #3a2d59; 
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #8a63d2; 
          }
        `}</style>
      </div>
    </div>
  );
}
