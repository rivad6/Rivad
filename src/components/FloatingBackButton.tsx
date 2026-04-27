import { motion, AnimatePresence } from 'motion/react';
import { Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export function FloatingBackButton() {
  const { t } = useLanguage();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <AnimatePresence>
      {!isHome && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed bottom-6 left-6 z-50 pointer-events-auto"
        >
          <Link
            to="/"
            className="flex items-center gap-2 bg-[#090b11]/80 backdrop-blur-md border border-[#222] px-4 py-3 text-gray-500 hover:text-white hover:border-[#8a63d2] hover:bg-[#8a63d2]/10 transition-all font-mono text-[10px] uppercase tracking-widest group shadow-lg"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" />
            <span>{t('nav.back_to_home')}</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
