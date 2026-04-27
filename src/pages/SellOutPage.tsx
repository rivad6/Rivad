import React from 'react';
import { SellOutGame } from '../components/games/SellOutGame';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { motion } from 'motion/react';

export const SellOutPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 relative">
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/juegos" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] uppercase font-black tracking-widest">{t('game.fest.back')}</span>
          </Link>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                   title: document.title,
                   url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                // Notification via console or we could add a toast, for now localized print
                console.log(t('game.sell.copied'));
              }
            }}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* Game Title & Header */}
        <div className="mb-12 text-center relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
             <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter text-white mb-2 italic">
               {t('game.sell.title')}
             </h1>
             <p className="text-brand-accent font-mono text-[10px] uppercase tracking-[0.4em] font-black">
               {t('game.sell.goal')}
             </p>
          </motion.div>
          
          <div className="absolute -top-10 -left-10 text-[100px] font-black text-white/5 pointer-events-none select-none italic">
             $$$
          </div>
        </div>

        {/* Game Component */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-hidden relative"
        >
          {/* Grain texture for the card */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" />
          
          <div className="relative z-10">
            <SellOutGame />
          </div>
        </motion.div>

        {/* Parody Footer Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] uppercase tracking-widest font-bold">
           <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-zinc-500 italic">
              "{t('game.sell.quote1')}"
           </div>
           <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-zinc-500 italic text-center">
              "{t('game.sell.quote2')}"
           </div>
           <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-zinc-500 italic text-right">
              "{t('game.sell.quote3')}"
           </div>
        </div>

      </div>
    </div>
  );
};
