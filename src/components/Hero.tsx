import { useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowDownRight, Fingerprint } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { RandomFacts } from './RandomFacts';

export function Hero() {
  const { t } = useLanguage();

  const age = useMemo(() => {
    const birthDate = new Date(1994, 5, 6);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto w-full relative z-10 flex flex-col justify-between h-full pt-10 md:pt-0">
        
        {/* Top Meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 md:mb-24"
        >
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500/80">
            <Fingerprint size={14} className="text-brand-accent animate-pulse" />
            <span className="bg-gradient-to-r from-gray-400 to-gray-600 bg-clip-text text-transparent tracking-[0.4em]">ID: Rivad</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-400 frosted-layer px-5 py-2.5 rounded-full self-start flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-pulse shadow-[0_0_10px_#f24a29]"></span>
            {t('hero.est')}
          </div>
        </motion.div>

        {/* Main Title - Magazine Style */}
        <div className="relative mb-20 md:mb-28">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-0"
          >
            <h1 className="text-[16vw] md:text-[12vw] leading-tight font-display font-light uppercase tracking-tighter text-white flex flex-col items-center pointer-events-none select-none mb-0">
              <span className="drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] leading-[0.9]">{t('hero.title1')}</span>
              <span className="font-serif font-black italic text-brand-accent mix-blend-screen drop-shadow-[0_0_60px_rgba(242,74,41,0.5)] transform -translate-y-1 md:-translate-y-2">{t('hero.title2')}</span>
            </h1>
          </motion.div>

          {/* Subheader - Personality Identity */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-4 md:mt-0 font-mono text-[9px] md:text-sm tracking-[0.4em] uppercase text-gray-500 flex flex-col md:flex-row md:items-center justify-center gap-3 md:gap-8 ml-4 md:ml-2"
          >
            <div className="flex items-center justify-center gap-3 w-full md:w-auto">
              <span className="text-white/60 tracking-normal font-sans font-bold text-center not-italic text-[19px]">OSCAR CÉSAR RIVADENEYRA PRINA</span>
            </div>
            <span className="hidden md:block w-16 h-px bg-white/10"></span>
            <div className="flex items-center gap-2 font-light">
              <span className="text-brand-accent font-bold">{age}</span>
              <span className="text-gray-600">{t('hero.years')}</span>
            </div>

            <span className="hidden md:block w-px h-3 bg-white/10"></span>

            <div className="flex items-center gap-3 frosted-layer px-4 py-1.5 rounded-full cursor-default">
              <div className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[8px] md:text-[10px] uppercase tracking-[0.15em]">
                <span className="text-white/90 font-bold">JUD DEL FARO BICENTENARIO MH CDMX</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Split layout */}
        <div className="grid md:grid-cols-12 gap-12 md:gap-6 items-end mt-auto pb-6 border-t border-white/5 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-12 lg:col-span-7"
          >
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-400 font-serif font-light leading-snug md:leading-relaxed text-balance">
              <span className="text-white font-bold border-b border-brand-accent/30 pb-1" style={{ fontFamily: 'Verdana, sans-serif' }}>{t('hero.job')}</span>
              <br className="hidden md:block"/><br className="hidden md:block"/>
              <span className="opacity-80 font-mono text-[18px] font-bold">{t('hero.desc')}</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.6 }}
            className="md:col-span-12 lg:col-span-5 flex flex-col items-center justify-center gap-4 w-full mx-auto"
          >
            <a 
              href="#proyectos"
              className="group relative overflow-hidden flex-nowrap w-full max-w-[320px] sm:max-w-md inline-flex items-center justify-between px-6 py-5 md:py-6 frosted-layer hover:border-brand-accent transition-all duration-500 rounded-2xl"
            >
              <div className="absolute inset-0 bg-brand-accent opacity-0 group-hover:opacity-10 transition-opacity duration-700" />
              <span className="relative z-10 font-mono text-[9px] tracking-[0.4em] uppercase text-white/70 group-hover:text-white transition-colors">
                {t('hero.inventory')}
              </span>
              <span className="relative z-10 w-8 h-8 md:w-10 md:h-10 border border-white/20 rounded-full flex items-center justify-center group-hover:bg-brand-accent group-hover:border-brand-accent transition-all duration-500 text-white shadow-lg">
                <ArrowDownRight size={16} className="group-hover:rotate-[-45deg] transition-transform duration-500" />
              </span>
            </a>
            
            <a 
              href="#servicios"
              className="group flex-nowrap w-full max-w-[320px] sm:max-w-md inline-flex items-center justify-center px-6 py-4 md:py-5 bg-[#1d3146] border border-[#e6d5d5] text-[#ffffff] transition-all duration-500 rounded-2xl backdrop-blur-sm"
            >
              <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#e8e8e8] transition-colors">
                {t('hero.services')}
              </span>
            </a>

            <div className="w-full max-w-[320px] sm:max-w-md flex justify-center mt-2">
              <RandomFacts />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, delay: 2 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
      >
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.6em] text-white/70 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          {t('hero.scroll', 'Scroll')}
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-brand-accent to-transparent"></div>
      </motion.div>

      {/* Decorative atmospheric background elements */}
      <div className="absolute top-1/4 right-0 -translate-y-1/2 translate-x-1/4 w-[1000px] h-[1000px] bg-brand-accent/5 rounded-full blur-[160px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[800px] h-[800px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none" />
    </section>
  );
}
