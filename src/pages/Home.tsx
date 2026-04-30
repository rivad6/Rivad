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
      <section className="bg-transparent border-y border-brand-accent/10 relative overflow-hidden backdrop-blur-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-accent/10 via-brand-bg to-brand-bg pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-20 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="text-[10px] font-mono tracking-[0.3em] text-brand-accent/80 uppercase mb-3 inline-flex items-center gap-3">
              <Dices size={14} className="animate-spin-slow text-brand-accent" /> {t('home.testerTitle')}
            </h2>
            <h3 className="text-4xl md:text-5xl font-display font-light uppercase tracking-tighter text-white mb-4">
              {t('home.oracleTitle1')} <span className="font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-white">{t('home.oracleTitle2')}</span>
            </h3>
            <p className="font-serif text-xl text-gray-300/50 max-w-xl font-light">
              {t('home.oracleDesc')}
            </p>
          </div>
          
          <Link 
            to="/oraculo"
            className="shrink-0 frosted-layer border-brand-accent/30 hover:border-brand-accent px-10 py-5 rounded-full font-mono font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-brand-accent text-white transition-all duration-500 flex items-center gap-4 group shadow-xl hover:shadow-[0_0_30px_rgba(242,74,41,0.3)]"
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

