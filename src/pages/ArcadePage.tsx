import { Arcade } from '../components/Arcade';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

export function ArcadePage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-[#050505] flex flex-col pt-32 text-white overflow-hidden relative selection:bg-brand-accent selection:text-black">
      {/* Immersive ambient arcade backgrounds */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-accent/10 via-transparent to-transparent opacity-60 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent blur-[120px] pointer-events-none" />
      
      {/* Scanline pattern for the room */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />

      <div className="px-6 md:px-12 w-full max-w-5xl mx-auto relative z-20">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-brand-accent/70 hover:text-brand-accent transition-all uppercase tracking-[0.3em] font-mono text-[10px] sm:text-xs md:text-sm mb-4 font-bold drop-shadow-[0_0_8px_rgba(242,74,41,0)] hover:drop-shadow-[0_0_8px_rgba(242,74,41,0.6)]"
        >
          <ArrowLeft size={16} />
          <span>{t('arc.back')}</span>
        </Link>
      </div>
      <div className="flex-1 w-full flex flex-col h-full -mt-20 relative z-10 perspective-1000">
        <Arcade />
      </div>
    </main>
  );
}
