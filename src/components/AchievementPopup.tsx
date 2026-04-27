import React, { useEffect } from 'react';
import { useAchievements } from '../context/AchievementsContext';
import { useLanguage } from '../context/LanguageContext';
import { useAudio } from '../context/AudioContext';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy } from 'lucide-react';

export function AchievementPopup() {
  const { recentUnlock, clearRecentUnlock } = useAchievements();
  const { playSound } = useAudio();
  const { t } = useLanguage();

  useEffect(() => {
    if (recentUnlock) {
      playSound('score');
      const timer = setTimeout(() => {
        clearRecentUnlock();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [recentUnlock, playSound, clearRecentUnlock]);

  return (
    <AnimatePresence>
      {recentUnlock && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-[#111] border border-brand-accent/50 p-4 rounded-xl shadow-[0_0_30px_rgba(242,74,41,0.3)] flex items-center gap-4 relative overflow-hidden min-w-[300px]">
             {/* Shine effect */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
             
             <div className="w-12 h-12 bg-brand-accent/20 rounded-full flex items-center justify-center text-2xl border border-brand-accent/30 shrink-0">
               {recentUnlock.icon}
             </div>
             
             <div className="flex-1">
               <div className="flex items-center gap-1.5 text-brand-accent text-[10px] font-black tracking-widest uppercase mb-1">
                 <Trophy size={10} />
                 {t('popup.achievement.title') || 'LOGRO DESBLOQUEADO'}
               </div>
               <h4 className="text-white font-bold text-sm leading-tight mb-1">
                 {recentUnlock.title}
               </h4>
               <p className="text-zinc-400 text-xs leading-snug">
                 {recentUnlock.description}
               </p>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
