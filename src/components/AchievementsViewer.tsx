import React from 'react';
import { useAchievements } from '../context/AchievementsContext';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementsViewer({ isOpen, onClose }: Props) {
  const { achievements, getTranslated } = useAchievements();
  const { t } = useLanguage();

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;
  const totalCount = achievements.length;
  const percentage = Math.round((unlockedCount / totalCount) * 100) || 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-3xl max-h-[85vh] bg-[#0F0F12] border-2 border-[#1E1E24] shadow-2xl rounded-2xl flex flex-col relative z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#1E1E24] bg-[#0A0A0C]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white font-display tracking-wide">
                    {t('achievements.title', 'Player Achievements')}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      {unlockedCount} / {totalCount} ({percentage}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors border border-zinc-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((ach) => {
                  const isUnlocked = !!ach.unlockedAt;
                  return (
                    <motion.div 
                      key={ach.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "relative flex gap-4 p-4 rounded-xl border transition-all duration-300",
                        isUnlocked 
                          ? "bg-zinc-900 border-yellow-500/30 hover:border-yellow-500/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                          : "bg-zinc-950/50 border-zinc-800/50 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                      )}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-lg flex items-center justify-center text-3xl shrink-0 shadow-inner",
                        isUnlocked ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-black border border-zinc-800"
                      )}>
                        {isUnlocked ? ach.icon : <Lock size={24} className="text-zinc-600" />}
                      </div>
                      <div className="flex flex-col justify-center flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className={cn(
                            "font-bold text-sm truncate",
                            isUnlocked ? "text-white" : "text-zinc-400"
                          )}>
                            {getTranslated(ach).title}
                          </h4>
                          {isUnlocked && (
                            <span className="text-[9px] font-mono whitespace-nowrap text-yellow-500/80 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                              {t('ach.unlocked', 'Unlocked')}
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "text-xs leading-snug line-clamp-2",
                          isUnlocked ? "text-zinc-400" : "text-zinc-600"
                        )}>
                          {getTranslated(ach).description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
