import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

type NodeId = 'start' | 'q1' | 'q2a' | 'q2b' | 'q2c' | 'q3a' | 'q3b' | 'q3c' | 'q3d' | 'q3e' | 'q3f' | 'q4a' | 'q4b' | 'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8' | 'e9' | 'e10' | 'e11' | 'e12' | 'e13' | 'e14' | 'e15' | 'e16';

interface Choice {
  textKey: string;
  next: NodeId;
}

interface StoryNode {
  textKey: string;
  choices: Choice[];
  isEnding?: boolean;
}

const storyMap: Record<NodeId, StoryNode> = {
  start: {
    textKey: 'game.rpg.start',
    choices: [{ textKey: 'game.rpg.start', next: 'q1' }]
  },
  q1: {
    textKey: 'game.rpg.q1',
    choices: [
      { textKey: 'game.rpg.q1.a', next: 'q2a' },
      { textKey: 'game.rpg.q1.b', next: 'q2b' },
      { textKey: 'game.rpg.q1.c', next: 'q2c' }
    ]
  },
  q2a: {
    textKey: 'game.rpg.q2a',
    choices: [
      { textKey: 'game.rpg.q2a.a', next: 'q3a' },
      { textKey: 'game.rpg.q2a.b', next: 'q3b' }
    ]
  },
  q2b: {
    textKey: 'game.rpg.q2b',
    choices: [
      { textKey: 'game.rpg.q2b.a', next: 'q3c' },
      { textKey: 'game.rpg.q2b.b', next: 'q3d' }
    ]
  },
  q2c: {
    textKey: 'game.rpg.q2c',
    choices: [
      { textKey: 'game.rpg.q2c.a', next: 'q3e' },
      { textKey: 'game.rpg.q2c.b', next: 'q3f' }
    ]
  },
  q3a: {
    textKey: 'game.rpg.q3a',
    choices: [
      { textKey: 'game.rpg.q3a.a', next: 'e1' },
      { textKey: 'game.rpg.q3a.b', next: 'e2' }
    ]
  },
  q3b: {
    textKey: 'game.rpg.q3b',
    choices: [
      { textKey: 'game.rpg.q3b.a', next: 'e3' },
      { textKey: 'game.rpg.q3b.b', next: 'q4a' }
    ]
  },
  q3c: {
    textKey: 'game.rpg.q3c',
    choices: [
      { textKey: 'game.rpg.q3c.a', next: 'e5' },
      { textKey: 'game.rpg.q3c.b', next: 'e6' }
    ]
  },
  q3d: {
    textKey: 'game.rpg.q3d',
    choices: [
      { textKey: 'game.rpg.q3d.a', next: 'e7' },
      { textKey: 'game.rpg.q3d.b', next: 'q4b' }
    ]
  },
  q3e: {
    textKey: 'game.rpg.q3e',
    choices: [
      { textKey: 'game.rpg.q3e.a', next: 'e13' },
      { textKey: 'game.rpg.q3e.b', next: 'e14' }
    ]
  },
  q3f: {
    textKey: 'game.rpg.q3f',
    choices: [
      { textKey: 'game.rpg.q3f.a', next: 'e15' },
      { textKey: 'game.rpg.q3f.b', next: 'e16' }
    ]
  },
  q4a: {
    textKey: 'game.rpg.q4a',
    choices: [
      { textKey: 'game.rpg.q4a.a', next: 'e9' },
      { textKey: 'game.rpg.q4a.b', next: 'e10' }
    ]
  },
  q4b: {
    textKey: 'game.rpg.q4b',
    choices: [
      { textKey: 'game.rpg.q4b.a', next: 'e11' },
      { textKey: 'game.rpg.q4b.b', next: 'e12' }
    ]
  },
  e1: { textKey: 'game.rpg.e1', choices: [], isEnding: true },
  e2: { textKey: 'game.rpg.e2', choices: [], isEnding: true },
  e3: { textKey: 'game.rpg.e3', choices: [], isEnding: true },
  e4: { textKey: 'game.rpg.e4', choices: [], isEnding: true },
  e5: { textKey: 'game.rpg.e5', choices: [], isEnding: true },
  e6: { textKey: 'game.rpg.e6', choices: [], isEnding: true },
  e7: { textKey: 'game.rpg.e7', choices: [], isEnding: true },
  e8: { textKey: 'game.rpg.e8', choices: [], isEnding: true },
  e9: { textKey: 'game.rpg.e9', choices: [], isEnding: true },
  e10: { textKey: 'game.rpg.e10', choices: [], isEnding: true },
  e11: { textKey: 'game.rpg.e11', choices: [], isEnding: true },
  e12: { textKey: 'game.rpg.e12', choices: [], isEnding: true },
  e13: { textKey: 'game.rpg.e13', choices: [], isEnding: true },
  e14: { textKey: 'game.rpg.e14', choices: [], isEnding: true },
  e15: { textKey: 'game.rpg.e15', choices: [], isEnding: true },
  e16: { textKey: 'game.rpg.e16', choices: [], isEnding: true }
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
        <p className="text-[#e2d5f8] text-sm md:text-base leading-relaxed">{lines.slice(1).join('\n')}</p>
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

        <h3 className="text-2xl md:text-4xl font-display uppercase tracking-widest text-white mb-8">
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
    <div className="w-full max-w-2xl mx-auto h-[400px] flex flex-col justify-between p-6 bg-[#0a0812] border-2 border-[#3a2d59] relative overflow-hidden font-mono shadow-[inset_0_0_80px_rgba(0,0,0,0.8)] shadow-[8px_8px_0_0_rgba(58,45,89,0.4)]">
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
            className="flex flex-col gap-6"
          >
            {node.isEnding ? (
              renderEndingText(t(node.textKey))
            ) : (
              <p className="text-[#e2d5f8] text-sm md:text-base leading-relaxed typing-effect">
                {t(node.textKey)}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Choices Area */}
      <div className="flex flex-col gap-3 shrink-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode + '-choices'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-3"
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
                  className="w-full px-4 py-3 border border-[#3a2d59] bg-[#110f1c] text-[#a591c8] text-xs md:text-sm hover:bg-[#8a63d2] hover:text-white transition-colors text-left flex gap-3 items-start group cursor-none"
                >
                  <span className="text-[#8a63d2] group-hover:text-white shrink-0 mt-0.5">
                    {idx === 0 ? 'A)' : idx === 1 ? 'B)' : 'C)'}
                  </span>
                  <span className="leading-snug">{t(choice.textKey)}</span>
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
