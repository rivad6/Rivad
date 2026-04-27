import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

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
  // Path 1: Catering
  'p1.q2': {
    textKey: 'game.rpg.p1.q2',
    choices: [
      { textKey: 'game.rpg.p1.q2.a', next: 'p1.q3a' },
      { textKey: 'game.rpg.p1.q2.b', next: 'p1.q3b' }
    ]
  },
  'p1.q3a': {
    textKey: 'game.rpg.p1.q3a',
    choices: [
      { textKey: 'game.rpg.p1.q3a.1', next: 'p1.e1' },
      { textKey: 'game.rpg.p1.q3a.2', next: 'p1.e4' }
    ]
  },
  'p1.q3b': {
    textKey: 'game.rpg.p1.q3b',
    choices: [
      { textKey: 'game.rpg.p1.q3b.1', next: 'p1.e2' },
      { textKey: 'game.rpg.p1.q3b.2', next: 'p1.e3' }
    ]
  },
  'p1.e1': { textKey: 'game.rpg.p1.e1', choices: [], isEnding: true },
  'p1.e2': { textKey: 'game.rpg.p1.e2', choices: [], isEnding: true },
  'p1.e3': { textKey: 'game.rpg.p1.e3', choices: [], isEnding: true },
  'p1.e4': { textKey: 'game.rpg.p1.e4', choices: [], isEnding: true },
  
  // Path 2: Artist
  'p2.q2': {
    textKey: 'game.rpg.p2.q2',
    choices: [
      { textKey: 'game.rpg.p2.q2.a', next: 'p2.q3a' },
      { textKey: 'game.rpg.p2.q2.b', next: 'p2.q3b' }
    ]
  },
  'p2.q3a': {
    textKey: 'game.rpg.p2.q3a',
    choices: [
      { textKey: 'game.rpg.p2.q3a.1', next: 'p2.e1' },
      { textKey: 'game.rpg.p2.q3a.2', next: 'p2.e2' }
    ]
  },
  'p2.q3b': {
    textKey: 'game.rpg.p2.q3b',
    choices: [
      { textKey: 'game.rpg.p2.q3b.1', next: 'p2.e3' },
      { textKey: 'game.rpg.p2.q3b.2', next: 'p2.e4' }
    ]
  },
  'p2.e1': { textKey: 'game.rpg.p2.e1', choices: [], isEnding: true },
  'p2.e2': { textKey: 'game.rpg.p2.e2', choices: [], isEnding: true },
  'p2.e3': { textKey: 'game.rpg.p2.e3', choices: [], isEnding: true },
  'p2.e4': { textKey: 'game.rpg.p2.e4', choices: [], isEnding: true },

  // Path 3: AI
  'p3.q2': {
    textKey: 'game.rpg.p3.q2',
    choices: [
      { textKey: 'game.rpg.p3.q2.a', next: 'p3.q3a' },
      { textKey: 'game.rpg.p3.q2.b', next: 'p3.q3b' }
    ]
  },
  'p3.q3a': {
    textKey: 'game.rpg.p3.q3a',
    choices: [
      { textKey: 'game.rpg.p3.q3a.1', next: 'p3.e1' },
      { textKey: 'game.rpg.p3.q3a.2', next: 'p3.e3' }
    ]
  },
  'p3.q3b': {
    textKey: 'game.rpg.p3.q3b',
    choices: [
      { textKey: 'game.rpg.p3.q3b.1', next: 'p3.e2' },
      { textKey: 'game.rpg.p3.q3b.2', next: 'p3.e4' }
    ]
  },
  'p3.e1': { textKey: 'game.rpg.p3.e1', choices: [], isEnding: true },
  'p3.e2': { textKey: 'game.rpg.p3.e2', choices: [], isEnding: true },
  'p3.e3': { textKey: 'game.rpg.p3.e3', choices: [], isEnding: true },
  'p3.e4': { textKey: 'game.rpg.p3.e4', choices: [], isEnding: true },

  // Path 4: Politics
  'p4.q2': {
    textKey: 'game.rpg.p4.q2',
    choices: [
      { textKey: 'game.rpg.p4.q2.a', next: 'p4.q3a' },
      { textKey: 'game.rpg.p4.q2.b', next: 'p4.q3b' }
    ]
  },
  'p4.q3a': {
    textKey: 'game.rpg.p4.q3a',
    choices: [
      { textKey: 'game.rpg.p4.q3a.1', next: 'p4.e1' },
      { textKey: 'game.rpg.p4.q3a.2', next: 'p4.e3' }
    ]
  },
  'p4.q3b': {
    textKey: 'game.rpg.p4.q3b',
    choices: [
      { textKey: 'game.rpg.p4.q3b.1', next: 'p4.e2' },
      { textKey: 'game.rpg.p4.q3b.2', next: 'p4.e4' }
    ]
  },
  'p4.e1': { textKey: 'game.rpg.p4.e1', choices: [], isEnding: true },
  'p4.e2': { textKey: 'game.rpg.p4.e2', choices: [], isEnding: true },
  'p4.e3': { textKey: 'game.rpg.p4.e3', choices: [], isEnding: true },
  'p4.e4': { textKey: 'game.rpg.p4.e4', choices: [], isEnding: true },

  // Path 5: Flood
  'p5.q2': {
    textKey: 'game.rpg.p5.q2',
    choices: [
      { textKey: 'game.rpg.p5.q2.a', next: 'p5.q3a' },
      { textKey: 'game.rpg.p5.q2.b', next: 'p5.q3b' }
    ]
  },
  'p5.q3a': {
    textKey: 'game.rpg.p5.q3a',
    choices: [
      { textKey: 'game.rpg.p5.q3a.1', next: 'p5.e1' },
      { textKey: 'game.rpg.p5.q3a.2', next: 'p5.e3' }
    ]
  },
  'p5.q3b': {
    textKey: 'game.rpg.p5.q3b',
    choices: [
      { textKey: 'game.rpg.p5.q3b.1', next: 'p5.e4' },
      { textKey: 'game.rpg.p5.q3b.2', next: 'p5.e2' }
    ]
  },
  'p5.e1': { textKey: 'game.rpg.p5.e1', choices: [], isEnding: true },
  'p5.e2': { textKey: 'game.rpg.p5.e2', choices: [], isEnding: true },
  'p5.e3': { textKey: 'game.rpg.p5.e3', choices: [], isEnding: true },
  'p5.e4': { textKey: 'game.rpg.p5.e4', choices: [], isEnding: true },

  // Path 6: Influencer
  'p6.q2': {
    textKey: 'game.rpg.p6.q2',
    choices: [
      { textKey: 'game.rpg.p6.q2.a', next: 'p6.q3a' },
      { textKey: 'game.rpg.p6.q2.b', next: 'p6.q3b' }
    ]
  },
  'p6.q3a': {
    textKey: 'game.rpg.p6.q3a',
    choices: [
      { textKey: 'game.rpg.p6.q3a.1', next: 'p6.e1' },
      { textKey: 'game.rpg.p6.q3a.2', next: 'p6.e3' }
    ]
  },
  'p6.q3b': {
    textKey: 'game.rpg.p6.q3b',
    choices: [
      { textKey: 'game.rpg.p6.q3b.1', next: 'p6.e2' },
      { textKey: 'game.rpg.p6.q3b.2', next: 'p6.e4' }
    ]
  },
  'p6.e1': { textKey: 'game.rpg.p6.e1', choices: [], isEnding: true },
  'p6.e2': { textKey: 'game.rpg.p6.e2', choices: [], isEnding: true },
  'p6.e3': { textKey: 'game.rpg.p6.e3', choices: [], isEnding: true },
  'p6.e4': { textKey: 'game.rpg.p6.e4', choices: [], isEnding: true },

  // Path 7: Paranormal
  'p7.q2': {
    textKey: 'game.rpg.p7.q2',
    choices: [
      { textKey: 'game.rpg.p7.q2.a', next: 'p7.q3a' },
      { textKey: 'game.rpg.p7.q2.b', next: 'p7.q3b' }
    ]
  },
  'p7.q3a': {
    textKey: 'game.rpg.p7.q3a',
    choices: [
      { textKey: 'game.rpg.p7.q3a.1', next: 'p7.e4' },
      { textKey: 'game.rpg.p7.q3a.2', next: 'p7.e1' }
    ]
  },
  'p7.q3b': {
    textKey: 'game.rpg.p7.q3b',
    choices: [
      { textKey: 'game.rpg.p7.q3b.1', next: 'p7.e3' },
      { textKey: 'game.rpg.p7.q3b.2', next: 'p7.e2' }
    ]
  },
  'p7.e1': { textKey: 'game.rpg.p7.e1', choices: [], isEnding: true },
  'p7.e2': { textKey: 'game.rpg.p7.e2', choices: [], isEnding: true },
  'p7.e3': { textKey: 'game.rpg.p7.e3', choices: [], isEnding: true },
  'p7.e4': { textKey: 'game.rpg.p7.e4', choices: [], isEnding: true }
};

export function ArtRPG() {
  const { t } = useLanguage();
  const [currentNode, setCurrentNode] = useState<NodeId>('start');

  const node = storyMap[currentNode];

  const handleChoice = (next: NodeId) => {
    setCurrentNode(next);
  };

  const renderEndingText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="flex flex-col gap-4">
        <h4 className="text-[#8a63d2] font-bold text-lg md:text-xl">{lines[0]}</h4>
        <p className="text-[#e2d5f8] text-sm md:text-base leading-relaxed whitespace-pre-line">{lines.slice(1).join('\n')}</p>
      </div>
    );
  };

  if (currentNode === 'start') {
    return (
      <div className="w-full max-w-2xl mx-auto h-[400px] flex flex-col justify-center items-center text-center p-8 bg-[#0a0812] border-2 border-[#3a2d59] relative shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] shadow-[8px_8px_0_0_rgba(58,45,89,0.4)]">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(138,99,210,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,99,210,0.05)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <div className="relative z-10 w-full mb-8 flex justify-between items-end border-b border-[#3a2d59] pb-2">
          <span className="text-[#8a63d2] font-mono text-[10px] tracking-widest uppercase">8-Bit Simulator v2.0</span>
          <span className="text-[#888] font-mono text-[10px] uppercase">{t('game.objective')}{t('game.rpg.goal')}</span>
        </div>

        <h3 className="text-2xl md:text-3xl font-display uppercase tracking-widest text-white mb-8">
          {t('game.rpg.title')}
        </h3>
        <button
          onClick={() => handleChoice('q1')}
          className="px-6 py-3 bg-[#8a63d2] text-white font-mono text-xs md:text-sm uppercase tracking-widest hover:bg-[#6b47ab] focus:outline-none focus:ring-2 focus:ring-[#8a63d2]/50 transition-all shadow-[0_0_15px_rgba(138,99,210,0.5)] cursor-none z-10"
        >
          {t('game.rpg.start')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto h-[450px] flex flex-col justify-between p-6 bg-[#0a0812] border-2 border-[#3a2d59] relative overflow-hidden font-mono shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] shadow-[8px_8px_0_0_rgba(58,45,89,0.4)]">
      {/* Decorative lines */}
      <div className="absolute top-0 left-0 w-full h-1 bg-[#8a63d2]/20" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#8a63d2]/20" />
      
      {/* Prompt Area */}
      <div className="flex-1 mt-4 mb-4 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-4"
          >
            {node.isEnding ? (
              renderEndingText(t(node.textKey))
            ) : (
              <p className="text-[#e2d5f8] text-sm md:text-base leading-relaxed">
                {t(node.textKey)}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Choices Area */}
      <div className="flex flex-col gap-2 shrink-0 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode + '-choices'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2"
          >
            {node.isEnding ? (
              <button
                onClick={() => handleChoice('start')}
                className="w-full px-4 py-3 border border-[#8a63d2] bg-[#8a63d2]/10 text-[#e2d5f8] text-xs uppercase tracking-widest hover:bg-[#8a63d2] hover:text-white transition-colors text-left flex justify-between items-center group cursor-none"
              >
                <span>{t('game.rpg.restart')}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">{'>>'}</span>
              </button>
            ) : (
              node.choices.map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChoice(choice.next)}
                  className="w-full px-3 py-2 border border-[#3a2d59] bg-[#110f1c] text-[#a591c8] text-[11px] md:text-sm hover:bg-[#8a63d2] hover:text-white transition-all text-left flex gap-3 items-start group cursor-none leading-tight"
                >
                  <span className="text-[#8a63d2] group-hover:text-white shrink-0 font-bold">
                    {idx + 1})
                  </span>
                  <span className="">{t(choice.textKey)}</span>
                </button>
              ))
            )}
          </motion.div>
        </AnimatePresence>
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
