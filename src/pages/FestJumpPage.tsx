import { FestJump } from '../components/games/FestJump';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

export function FestJumpPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative font-mono selection:bg-brand-accent selection:text-white pb-20 pt-10 px-4">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-brand-accent/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#312e81]/10 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] mb-8 relative z-10 flex flex-col"
      >
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-brand-accent transition-colors self-start mb-6 uppercase tracking-widest"
        >
          <ArrowLeft size={14} /> {t('game.fest.back')}
        </Link>
        <div className="border border-gray-800 bg-gray-900/50 p-6 rounded-2xl">
          <h1 className="text-2xl font-serif text-white mb-2">Fest Jump (MVP)</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t('game.fest.desc')}
          </p>
        </div>
      </motion.div>

      {/* Game Wrapper */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="bg-[#0a0a0a] p-2 rounded-2xl border border-gray-800 shadow-[0_0_40px_rgba(244,63,94,0.15)] relative">
          <FestJump />
        </div>
      </motion.div>
    </div>
  );
}
