import { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const THEMES = [
  { name: 'Original', color: '#f24a29', ink: '#f0f0f0' },
  { name: 'Cyan', color: '#06b6d4', ink: '#cffafe' },
  { name: 'Purple', color: '#a855f7', ink: '#f3e8ff' },
  { name: 'Green', color: '#22c55e', ink: '#dcfce7' },
  { name: 'Pink', color: '#ec4899', ink: '#fce7f3' },
  { name: 'Yellow', color: '#eab308', ink: '#fef08a' },
];

export function ThemeSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(THEMES[0].color);

  useEffect(() => {
    const savedAccent = localStorage.getItem('brand-accent');
    const savedInk = localStorage.getItem('brand-ink');
    if (savedAccent && savedInk) {
      setActiveColor(savedAccent);
      document.documentElement.style.setProperty('--color-brand-accent', savedAccent);
      document.documentElement.style.setProperty('--color-brand-ink', savedInk);
    }
  }, []);

  const handleSelect = (theme: typeof THEMES[0]) => {
    setActiveColor(theme.color);
    document.documentElement.style.setProperty('--color-brand-accent', theme.color);
    document.documentElement.style.setProperty('--color-brand-ink', theme.ink);
    localStorage.setItem('brand-accent', theme.color);
    localStorage.setItem('brand-ink', theme.ink);
    setIsOpen(false);
  };

  return (
    <div className="relative pointer-events-auto">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition-colors p-2.5 frosted-layer rounded-full flex items-center justify-center"
        style={{ color: activeColor }}
      >
        <Palette size={15} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-3 p-2 frosted-layer rounded-2xl flex flex-col gap-2 z-[100]"
          >
            {THEMES.map((theme) => (
              <button
                key={theme.color}
                onClick={() => handleSelect(theme)}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${activeColor === theme.color ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: theme.color }}
                title={theme.name}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
