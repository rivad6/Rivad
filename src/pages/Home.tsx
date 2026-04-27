import { Hero } from '../components/Hero';
import { Ecosystem } from '../components/Ecosystem';
import { Services } from '../components/Services';
import { Manifesto } from '../components/Manifesto';
import { Link } from 'react-router-dom';
import { Dices, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Home() {
  const { t } = useLanguage();
  
  return (
    <main>
      <Hero />
      
      {/* Oracle Banner */}
      <section className="bg-transparent border-y border-pink-500/10 relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-900/10 via-brand-bg to-brand-bg pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="text-[10px] font-mono tracking-[0.3em] text-pink-500/80 uppercase mb-3 inline-flex items-center gap-3">
              <Dices size={14} className="animate-spin-slow text-pink-400" /> {t('home.testerTitle')}
            </h2>
            <h3 className="text-4xl md:text-5xl font-display font-light uppercase tracking-tighter text-white mb-4">
              {t('home.oracleTitle1')} <span className="font-serif italic font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{t('home.oracleTitle2')}</span>
            </h3>
            <p className="font-serif text-xl text-pink-100/50 max-w-xl font-light">
              {t('home.oracleDesc')}
            </p>
          </div>
          
          <Link 
            to="/oraculo"
            className="shrink-0 frosted-layer border-pink-900/30 hover:border-pink-500 px-10 py-5 rounded-full font-mono font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-pink-500 text-white transition-all duration-500 flex items-center gap-4 group shadow-xl hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]"
          >
            {t('home.rollDice')} <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
          </Link>
        </div>
      </section>

      <Ecosystem />
      <Services />
      <Manifesto />
    </main>
  );
}

