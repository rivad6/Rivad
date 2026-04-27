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
      
      {/* Banner de acceso directo al Oráculo */}
      <section className="bg-[#050308] border-y border-pink-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-sm font-mono tracking-[0.2em] text-pink-500 uppercase mb-2 inline-flex items-center gap-2">
              <Dices size={16} /> {t('home.testerTitle')}
            </h2>
            <h3 className="text-3xl md:text-4xl font-display uppercase tracking-tight text-white mb-2">
              {t('home.oracleTitle1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{t('home.oracleTitle2')}</span>
            </h3>
            <p className="font-sans text-pink-200/60 max-w-lg">
              {t('home.oracleDesc')}
            </p>
          </div>
          
          <Link 
            to="/oraculo"
            className="shrink-0 bg-white text-black px-8 py-4 rounded-full font-mono font-bold uppercase tracking-widest text-xs hover:bg-pink-500 hover:text-white hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] transition-all duration-300 flex items-center gap-3 group"
          >
            {t('home.rollDice')} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      <Ecosystem />
      <Services />
      <Manifesto />
    </main>
  );
}

