import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

const ACHIEVEMENTS_DATA: Achievement[] = [
  { id: 'first_blood', title: 'Primera Sangre', description: 'Abrir un minijuego por primera vez.', icon: '🎮' },
  { id: 'pong_master', title: 'Maestro del Debate', description: 'Gana una partida de Debate Pong a la IA.', icon: '🏓' },
  { id: 'pong_loser', title: 'Silenciado', description: 'Pierde una partida de Debate Pong ante la IA.', icon: '🔇' },
  { id: 'dictator', title: 'El Gran Elector', description: 'Gana una partida de Political Uno.', icon: '👑' },
  { id: 'sellout', title: 'Vendido', description: 'Alcanza el máximo de Hype en Sell Out Game.', icon: '💸' },
  { id: 'brokeback', title: 'Caída de Fama', description: 'Pierde toda tu relevancia en Sell Out Game.', icon: '📉' },
  { id: 'red_pill', title: 'Basado', description: 'Termina la simulación RPG.', icon: '💊' },
];

interface AchievementsContextType {
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  recentUnlock: Achievement | null;
  clearRecentUnlock: () => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS_DATA);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('art-capital-achievements');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAchievements(ACHIEVEMENTS_DATA.map(a => ({
          ...a,
          unlockedAt: parsed[a.id] || a.unlockedAt
        })));
      } catch (e) {
        console.error('Failed to parse achievements', e);
      }
    }
  }, []);

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
    <AchievementsContext.Provider value={{ achievements, unlockAchievement, recentUnlock, clearRecentUnlock }}>
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
