import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';

export interface Achievement {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  unlockedAt?: number;
}

const ACHIEVEMENTS_DATA: Omit<Achievement, 'titleKey' | 'descriptionKey'>[] = [
  { id: 'first_blood', icon: '🎮' },
  { id: 'pong_master', icon: '🏓' },
  { id: 'pong_loser', icon: '🔇' },
  { id: 'pong_rally', icon: '🔥' },
  { id: 'ttt_winner', icon: '⭕' },
  { id: 'ttt_draw', icon: '🤝' },
  { id: 'dictator', icon: '👑' },
  { id: 'uno_action', icon: '🃏' },
  { id: 'red_pill', icon: '💊' },
  { id: 'rpg_bankruptcy', icon: '💸' },
  { id: 'rpg_insane', icon: '🌀' },
  { id: 'sellout', icon: '⚡' },
  { id: 'brokeback', icon: '📉' },
  { id: 'invaders_level_5', icon: '🚀' },
  { id: 'invaders_boss_kill', icon: '👾' },
  { id: 'invaders_all_ships', icon: '🛸' },
  { id: 'race_winner', icon: '🏁' },
  { id: 'race_crasher', icon: '💥' },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = ACHIEVEMENTS_DATA.map(a => ({
  ...a,
  titleKey: `ach.title.${a.id}`,
  descriptionKey: `ach.desc.${a.id}`,
}));

interface AchievementsContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  recentUnlock: Achievement | null;
  clearRecentUnlock: () => void;
  getTranslated: (achievement: Achievement) => { title: string; description: string };
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const stored = localStorage.getItem('art-capital-achievements');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAchievements(prev => prev.map(a => ({
          ...a,
          unlockedAt: parsed[a.id] || a.unlockedAt
        })));
      } catch (e) {
        console.error('Failed to parse achievements', e);
      }
    }
  }, []);

  const getTranslated = (achievement: Achievement) => ({
    title: t(achievement.titleKey as any),
    description: t(achievement.descriptionKey as any)
  });

  const unlockAchievement = (id: string) => {
    setAchievements(prev => {
      const alreadyUnlocked = prev.find(a => a.id === id)?.unlockedAt;
      if (alreadyUnlocked) return prev;

      const now = Date.now();
      const updated = prev.map(a => a.id === id ? { ...a, unlockedAt: now } : a);
      
      const toSave = updated.reduce((acc, a) => {
        if (a.unlockedAt) acc[a.id] = a.unlockedAt;
        return acc;
      }, {} as Record<string, number>);
      
      localStorage.setItem('art-capital-achievements', JSON.stringify(toSave));
      
      const unlockedAch = updated.find(a => a.id === id);
      if (unlockedAch) {
        setRecentUnlock(unlockedAch);
      }
      
      return updated;
    });
  };

  const clearRecentUnlock = () => setRecentUnlock(null);

  return (
    <AchievementsContext.Provider value={{ achievements, unlockAchievement, recentUnlock, clearRecentUnlock, getTranslated }}>
      {children}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};
