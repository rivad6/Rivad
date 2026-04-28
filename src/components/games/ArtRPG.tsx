import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { FullscreenButton } from '../ui/FullscreenButton';

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
    // The previous e1 through e4 were duplicated over the a/b branches. Let's redirect them to the bizarre layer.
    [`${p}.e1`]: { textKey: `game.rpg.${p}.e1`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.1` }] },
    [`${p}.e2`]: { textKey: `game.rpg.${p}.e2`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.2` }] },
    [`${p}.e3`]: { textKey: `game.rpg.${p}.e3`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.3` }] },
    [`${p}.e4`]: { textKey: `game.rpg.${p}.e4`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.4` }] },
    [`${p}.e5`]: { textKey: `game.rpg.${p}.e1`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.1` }] }, // reusing e1-e4 translations for simplicity
    [`${p}.e6`]: { textKey: `game.rpg.${p}.e2`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.2` }] },
    [`${p}.e7`]: { textKey: `game.rpg.${p}.e3`, choices: [{ textKey: 'game.rpg.continue1', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.3` }] },
    [`${p}.e8`]: { textKey: `game.rpg.${p}.e4`, choices: [{ textKey: 'game.rpg.continue2', next: 'boss.q1' }, { textKey: 'game.rpg.acceptfate', next: `${p}.final.4` }] },
    [`${p}.final.1`]: { textKey: `game.rpg.${p}.e1`, choices: [], isEnding: true },
    [`${p}.final.2`]: { textKey: `game.rpg.${p}.e2`, choices: [], isEnding: true },
    [`${p}.final.3`]: { textKey: `game.rpg.${p}.e3`, choices: [], isEnding: true },
    [`${p}.final.4`]: { textKey: `game.rpg.${p}.e4`, choices: [], isEnding: true },
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
      { textKey: 'game.rpg.q1.7', next: 'p7.q2' }
    ]
  },
  ...generatePathMapping('p1'),
  ...generatePathMapping('p2'),
  ...generatePathMapping('p3'),
  ...generatePathMapping('p4'),
  ...generatePathMapping('p5'),
  ...generatePathMapping('p6'),
  ...generatePathMapping('p7'),
  
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

export function ArtRPG() {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const { unlockAchievement } = useAchievements();
  const [currentNode, setCurrentNode] = useState<NodeId>('start');
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Stats system to make decisions feel coherent and impactful
  const [stats, setStats] = useState({ budget: 50, sanity: 50, reputation: 50 });
  const [lastStatDelta, setLastStatDelta] = useState<{b: number, s: number, r: number} | null>(null);

  useEffect(() => {
    const isPlaying = currentNode !== 'start' && !STORY_GRAPH[currentNode]?.isEnding;
    if (isPlaying) {
      playMusic('rpg');
    } else {
      playMusic('none');
    }
    return () => playMusic('none');
  }, [currentNode, playMusic]);

  const node = storyMap[currentNode];

  useEffect(() => {
    if (node.isEnding) {
      playSound('win');
      unlockAchievement('red_pill');
    }
    setSelectedIndex(0);
  }, [currentNode, node.isEnding, playSound, unlockAchievement]);

  const handleChoice = (next: NodeId, choiceIndex?: number) => {
    if (next === 'start') {
      playSound('hover');
      setStats({ budget: 50, sanity: 50, reputation: 50 });
      setLastStatDelta(null);
    } else {
      playSound('click');
      
      // Calculate coherent stat impacts based on choice index (0 = usually artistic/crazy, 1 = practical/destructive)
      if (choiceIndex !== undefined) {
        let bDelta = 0;
        let sDelta = 0;
        let rDelta = 0;
        
        if (choiceIndex === 0) {
          bDelta = Math.floor(Math.random() * -10) - 5; // Artistic choices cost money
          sDelta = Math.floor(Math.random() * -15) - 5; // and sanity
          rDelta = Math.floor(Math.random() * 20) + 10; // but gain reputation
        } else if (choiceIndex === 1) {
          bDelta = Math.floor(Math.random() * 15) + 5; // Practical/Destructive might save money or get attention
          sDelta = Math.floor(Math.random() * -20) - 10; // but lose more sanity
          rDelta = Math.floor(Math.random() * -15) - 5; // and lose reputation
        } else {
          // If there are more than 2 choices (e.g. at the beginning)
          bDelta = Math.floor(Math.random() * 20) - 10;
          sDelta = Math.floor(Math.random() * 20) - 10;
          rDelta = Math.floor(Math.random() * 20) - 10;
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

  if (currentNode === 'start') {
    return (
      <div ref={containerRef} className="w-full h-full max-w-2xl mx-auto min-h-[400px] flex flex-col justify-center items-center text-center p-8 bg-[#0a0812] border-2 border-[#3a2d59] relative shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] shadow-[8px_8px_0_0_rgba(58,45,89,0.4)] [&.is-fullscreen]:shadow-none [&.is-fullscreen]:border-none">
        <FullscreenButton targetRef={containerRef} className="top-2 right-2" />
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(138,99,210,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,99,210,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none [&.is-fullscreen]:hidden" />
        
        <div className="relative z-10 w-full mb-8 flex justify-between items-end border-b border-[#3a2d59] pb-2">
          <span className="text-[#8a63d2] font-mono text-[10px] tracking-widest uppercase">8-Bit Simulator v2.0</span>
          <span className="text-[#888] font-mono text-[10px] uppercase">{t('game.objective')}{t('game.rpg.goal')}</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-display uppercase tracking-widest text-white mb-8">
          {t('game.rpg.title')}
        </h3>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice('q1'); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleChoice('q1'); }}
          className="px-6 py-3 bg-[#8a63d2] text-white font-mono text-xs md:text-sm uppercase tracking-widest hover:bg-[#6b47ab] focus:outline-none focus:ring-2 focus:ring-[#8a63d2]/50 transition-all shadow-[0_0_15px_rgba(138,99,210,0.5)] cursor-pointer z-50 relative pointer-events-auto"
        >
          {t('game.rpg.start')}
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full max-w-3xl mx-auto min-h-[450px] flex flex-col justify-between p-4 sm:p-8 bg-[#020202] border border-white/10 relative overflow-hidden font-mono rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] [&.is-fullscreen]:shadow-none [&.is-fullscreen]:rounded-none [&.is-fullscreen]:border-none">
      <FullscreenButton targetRef={containerRef} className="top-2 right-2" />
      {/* Decorative Scanlines & Grain */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat [&.is-fullscreen]:hidden" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:100%_4px] [&.is-fullscreen]:hidden" />
      
      {/* Header Info */}
      <div className="flex flex-col gap-4 border-b border-white/5 pb-4 mb-4 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
             <span className="text-[10px] uppercase font-black tracking-[0.3em] text-zinc-500">{t('game.rpg.label.terminal')}</span>
          </div>
          <div className="text-[9px] uppercase font-bold text-zinc-700 bg-white/5 px-3 py-1 rounded-full">
            {t('game.rpg.label.status')}: {node.isEnding ? t('game.rpg.label.finished') : t('game.rpg.label.processing')}
          </div>
        </div>
        {!node.isEnding && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Otoño Capitalista', value: stats.budget, color: 'bg-green-500', icon: '💰' },
              { label: 'Cordura', value: stats.sanity, color: 'bg-blue-500', icon: '🧠' },
              { label: 'Ego Curatorial', value: stats.reputation, color: 'bg-brand-accent', icon: '✨' }
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 p-2 rounded-lg flex flex-col gap-1">
                <div className="flex justify-between items-center text-[8px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  <span>{stat.icon} {stat.label}</span>
                  <span>{stat.value}%</span>
                </div>
                <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                  <motion.div 
                    initial={false} 
                    animate={{ width: `${stat.value}%` }} 
                    className={`h-full ${stat.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Area */}
      <div className="flex-1 mt-2 mb-6 overflow-y-auto pr-4 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex flex-col gap-6"
          >
            {node.isEnding ? (
              <div className="space-y-6">
                <motion.div 
                   initial={{ scale: 0.9 }}
                   animate={{ scale: 1 }}
                   className="p-6 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl italic"
                >
                  {renderEndingText(t(node.textKey))}
                </motion.div>
                <div className="flex items-center gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                   <div className="h-[1px] flex-1 bg-zinc-900" />
                   {t('game.rpg.label.end_sim')}
                   <div className="h-[1px] flex-1 bg-zinc-900" />
                </div>
              </div>
            ) : (
              <div className="relative">
                <span className="absolute -left-4 text-brand-accent animate-pulse">{'>'}</span>
                <p className="text-zinc-300 text-sm md:text-lg leading-relaxed font-medium">
                  {t(node.textKey)}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Choices Area */}
      <div className="flex flex-col gap-3 shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode + '-choices'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {node.isEnding ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e:any) => { e.preventDefault(); e.stopPropagation(); handleChoice('start'); }}
                onTouchEnd={(e:any) => { e.preventDefault(); e.stopPropagation(); handleChoice('start'); }}
                className="w-full px-6 py-4 bg-white text-black text-xs font-black uppercase tracking-[0.4em] hover:bg-brand-accent hover:text-white transition-all rounded-2xl text-center shadow-xl shadow-brand-accent/10 relative z-50 cursor-pointer pointer-events-auto"
              >
                {t('game.rpg.restart')}
              </motion.button>
            ) : (
              node.choices.map((choice, idx) => (
                <motion.button
                  key={choice.textKey}
                  whileHover={{ x: 10, backgroundColor: 'rgba(138,99,210,0.1)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoice(choice.next, idx)}
                  className={`w-full px-5 py-4 border border-white/5 bg-zinc-950/40 text-[11px] md:text-sm transition-all text-left flex gap-4 items-center rounded-2xl group ${idx === selectedIndex ? 'text-white border-brand-accent/50 bg-brand-accent/10 translate-x-3' : 'text-zinc-400 hover:text-white'}`}
                >
                  <span className={`text-brand-accent font-black transition-opacity font-mono ${idx === selectedIndex ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                    0{idx + 1}
                  </span>
                  <span className="font-bold tracking-tight">{t(choice.textKey)}</span>
                </motion.button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Decoration */}
      <div className="mt-8 flex justify-between items-center text-[8px] font-black text-zinc-800 uppercase tracking-widest pt-4 border-t border-white/5">
         <span>{t('game.rpg.label.sector')}</span>
         <span>{t('game.rpg.label.layer')}: {currentNode.startsWith('boss') ? t('game.rpg.label.layer_boss') : t('game.rpg.label.layer_std')}</span>
         <span>Hash: {Math.random().toString(16).substring(2, 10)}</span>
      </div>

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
  );
}
