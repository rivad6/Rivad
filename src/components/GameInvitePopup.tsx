import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Ghost, X } from 'lucide-react';

export function GameInvitePopup() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if it has already been shown in this session
    const hasShown = sessionStorage.getItem('game_popup_shown');
    
    if (!hasShown) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem('game_popup_shown', 'true');
      }, 90000); // 90 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          className="fixed bottom-6 right-6 z-[100] max-w-xs w-full"
        >
          <div className="relative group">
            {/* Retro Border / Shadow Effect */}
            <div className="absolute -inset-1 bg-brand-accent rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-[#0d0d0d] border-2 border-brand-accent/50 p-5 rounded-lg shadow-2xl overflow-hidden">
              {/* Retro scanline effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20"></div>

              <div className="flex flex-col gap-4 relative z-10 font-mono">
                <button 
                  onClick={() => setIsVisible(false)}
                  className="absolute -top-2 -right-2 p-1.5 text-gray-500 hover:text-white transition-colors"
                  aria-label="Close popup"
                >
                  <X size={16} aria-hidden="true" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-accent/10 rounded-sm flex items-center justify-center text-brand-accent animate-pulse">
                    <Ghost size={24} />
                  </div>
                  <h4 className="text-white text-sm font-bold leading-tight">
                    {t('popup.invite.text')}
                  </h4>
                </div>

                <button
                  onClick={() => {
                    navigate('/juegos');
                    setIsVisible(false);
                  }}
                  className="w-full py-2.5 bg-brand-accent text-black font-bold text-xs uppercase tracking-widest hover:bg-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(242,74,41,0.4)]"
                >
                  {t('popup.invite.btn')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
