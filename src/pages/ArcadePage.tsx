import { Arcade } from '../components/Arcade';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

export function ArcadePage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-[#110f1c] flex flex-col pt-32 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[#07050e] opacity-50 pointer-events-none" />
      <div className="px-6 md:px-12 w-full max-w-5xl mx-auto relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[#8a63d2] hover:text-[#e2d5f8] transition-colors uppercase tracking-[0.2em] font-mono text-sm mb-4"
        >
          <ArrowLeft size={16} />
          <span>{t('arc.back')}</span>
        </Link>
      </div>
      <div className="flex-1 w-full flex flex-col h-full -mt-20 relative z-10">
        <Arcade />
      </div>
    </main>
  );
}
