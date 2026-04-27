import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Code, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PricingText } from './PricingText';

export function PricingPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Check if the user has already seen the popup in this session
    const hasSeenPopup = sessionStorage.getItem('rivad_pricing_popup_shown');
    
    if (hasSeenPopup) return;

    // Set timer for 5 minutes (300000 ms)
    const timer = setTimeout(() => {
      setIsOpen(true);
      sessionStorage.setItem('rivad_pricing_popup_shown', 'true');
    }, 5 * 60 * 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative max-w-md w-full bg-zinc-950 border border-brand-accent/30 p-8 rounded-xl shadow-2xl shadow-brand-accent/10"
        >
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-red-950/40 rounded-full flex items-center justify-center border border-brand-accent/20">
              <Code className="w-6 h-6 text-brand-accent animate-pulse" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-center text-white font-display tracking-tight mb-2">
            {t('popup.pricing.title') || 'Construye tu propio ecosistema'}
          </h3>
          
          <p className="text-sm text-gray-400 text-center mb-8">
            {t('popup.pricing.desc') || '¿Te gustó esta experiencia? Un currículum tradicional ya no es suficiente. Destaca con un ecosistema interactivo a medida.'}
          </p>

          <div className="bg-red-950/10 border border-brand-accent/10 p-4 rounded-lg text-[11px] font-mono leading-relaxed text-gray-300 text-center uppercase tracking-widest mb-8">
            <PricingText />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-3 border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-mono tracking-widest transition-colors rounded uppercase"
            >
              {t('popup.pricing.close') || 'Ignorar por ahora'}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="flex-1 px-4 py-3 bg-brand-accent/10 hover:bg-brand-accent/20 border border-brand-accent/50 text-white text-xs font-mono tracking-widest transition-colors rounded uppercase flex items-center justify-center gap-2"
            >
              Contactar
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
