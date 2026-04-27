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
