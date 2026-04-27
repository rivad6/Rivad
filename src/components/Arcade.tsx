import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Layers, Cpu, Paintbrush, DollarSign, MessageCircle, Target } from 'lucide-react';
import { DebatePong } from './games/DebatePong';
import { IdeasTicTacToe } from './games/IdeasTicTacToe';
import { PoliticalUno } from './games/PoliticalUno';
import { ArtRPG } from './games/ArtRPG';
import { SellOutGame } from './games/SellOutGame';
import { CreativeInvaders } from './games/CreativeInvaders';
import { useAchievements } from '../context/AchievementsContext';

import { useLanguage } from '../context/LanguageContext';

export function Arcade() {
  const { t } = useLanguage();
  const { unlockAchievement } = useAchievements();
  const [showPopup, setShowPopup] = useState(false);
  const games = [
    { id: 'pong', title: t('arc.game1'), icon: <Gamepad2 size={16} /> },
    { id: 'uno', title: t('arc.game2'), icon: <Layers size={16} /> },
    { id: 'tictactoe', title: t('arc.game3'), icon: <Cpu size={16} /> },
    { id: 'rpg', title: t('arc.game4'), icon: <Paintbrush size={16} /> },
    { id: 'sellout', title: t('arc.game5'), icon: <DollarSign size={16} /> },
    { id: 'invaders', title: t('arc.game6'), icon: <Target size={16} /> },
  ] as const;

  const [activeGame, setActiveGame] = useState<'pong' | 'tictactoe' | 'uno' | 'rpg' | 'sellout' | 'invaders'>('rpg');

  useEffect(() => {
    // Unlock first blood achievement when entering the arcade
    unlockAchievement('first_blood');
    
    const interval = setInterval(() => {
      setShowPopup(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [unlockAchievement]);

  return (
    <div className="w-full bg-[#110f1c] border-y border-[#3a2d59] py-20 pb-40 relative">
      {/* 60s Interruption Popup */}
      <AnimatePresence>
        {showPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-brand-accent/30 p-8 rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(138,99,210,0.2)] flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent">
                <MessageCircle size={32} />
              </div>
              <h4 className="text-brand-accent text-[10px] font-black tracking-[0.3em] uppercase">
                {t('arc.popup.title')}
              </h4>
              <p className="text-white font-mono text-sm leading-relaxed uppercase tracking-wider italic">
                "{t('arc.popup.text')}"
              </p>
              <button
                onClick={() => setShowPopup(false)}
                className="w-full bg-brand-accent text-white py-4 rounded-full font-black uppercase tracking-[0.3em] hover:bg-brand-accent/80 transition-all font-mono text-xs"
              >
                {t('arc.popup.btn')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div className="w-full max-w-5xl mx-auto px-6 md:px-0">
        <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mt-12 md:mt-4">
          <div>
            <h2 className="text-sm font-mono tracking-[0.2em] text-[#8a63d2] uppercase mb-4 border-b border-[#3a2d59] pb-2 inline-block">
              {t('arc.restricted')}
            </h2>
            <h3 className="text-6xl md:text-8xl font-display uppercase tracking-tighter text-[#e2d5f8] leading-none">
              Arcade <br className="hidden md:block" />
              <span className="font-display text-[#b58df8] lowercase font-medium tracking-normal ml-0 md:ml-12">{t('arc.sisyphus')}</span>
            </h3>
          </div>
          <p className="text-[#a591c8] font-sans font-light max-w-sm text-sm md:text-base leading-relaxed border-l border-[#8a63d2]/30 pl-4 py-2">
            {t('arc.desc')}
          </p>
        </div>

        {/* Game Selector */}
        <div className="flex flex-wrap justify-start gap-2 mb-12 relative z-20">
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGame(g.id)}
              className={`flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-all ${
                activeGame === g.id 
                  ? 'bg-[#8a63d2] text-white border border-[#8a63d2] rounded-none shadow-[0_0_15px_rgba(138,99,210,0.5)]' 
                  : 'bg-transparent border border-[#3a2d59] text-[#8a63d2] hover:text-white hover:border-[#8a63d2] rounded-none'
              }`}
            >
              {g.icon}
              {g.title}
            </button>
          ))}
        </div>

        {/* Game Screen / Arcade Cabinet */}
        <div className="relative bg-transparent p-1 md:p-2 border border-[#3a2d59] mx-auto overflow-hidden shadow-[8px_8px_0_0_rgba(58,45,89,0.5)] bg-[#1e1633]/50">
          {/* CRT Screen Frame */}
          <div className="bg-[#05040a] border border-[#1e1633] min-h-[500px] flex items-center justify-center relative shadow-[inset_0_0_50px_rgba(0,0,0,1)]">
            
            {/* CRT Screen Effect overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 mix-blend-overlay opacity-30">
              <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeGame}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-center p-4"
              >
                {activeGame === 'pong' && <DebatePong />}
                {activeGame === 'tictactoe' && <IdeasTicTacToe />}
                {activeGame === 'uno' && <PoliticalUno />}
                {activeGame === 'rpg' && <ArtRPG />}
                {activeGame === 'sellout' && <SellOutGame />}
                {activeGame === 'invaders' && <CreativeInvaders />}
              </motion.div>
            </AnimatePresence>

          </div>
          
        </div>
      </div>
    </div>
  );
}
