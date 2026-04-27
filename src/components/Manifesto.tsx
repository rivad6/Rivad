import { useLanguage } from '../context/LanguageContext';

export function Manifesto() {
  const { t } = useLanguage();

  return (
    <section className="py-32 px-6 md:px-12 relative overflow-hidden bg-transparent text-[#E0E0E0] border-t border-white/5">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(242,74,41,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(242,74,41,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10 px-4 md:px-0">
        
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-32 items-start">
          
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <h2 className="text-[10px] font-mono tracking-[0.4em] text-brand-accent/60 uppercase mb-10 border-b border-brand-accent/20 pb-5 inline-block w-full md:w-auto">
              {t('mani.title')}
            </h2>
            <h3 className="text-5xl md:text-7xl lg:text-8xl font-display font-light uppercase tracking-tighter mb-10 leading-[0.95] text-[#F5F5F5]">
              {t('mani.h3')} <br/>
              <span className="block text-brand-accent font-serif font-black italic lowercase tracking-normal drop-shadow-[0_0_30px_rgba(242,74,41,0.2)] pt-2 md:pt-4 text-left">{t('mani.h3.sub')}</span>
            </h3>
            <div className="relative group overflow-hidden">
              <div className="absolute inset-0 bg-brand-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <p className="font-mono text-[11px] text-brand-accent/80 uppercase tracking-[0.25em] leading-loose border-l border-brand-accent/40 pl-6 mt-12 py-6">
                {t('mani.quote')}
              </p>
            </div>
          </div>

          <div className="lg:col-span-8 font-sans text-xl md:text-2xl leading-relaxed font-light text-gray-400">
            <div className="space-y-16">
              <p className="hover:text-white transition-colors duration-700 text-balance first-letter:text-5xl first-letter:font-display first-letter:font-bold first-letter:mr-4 first-letter:float-left first-letter:text-brand-accent">
                {t('mani.p1')}
              </p>
              <div className="h-px w-24 bg-brand-accent/20"></div>
              <p className="hover:text-white transition-colors duration-700 text-balance">
                {t('mani.p2_1')}
                <span className="text-brand-accent font-medium">{t('mani.p2_2')}</span>
                {t('mani.p2_3')}
                <span className="text-brand-accent font-medium">{t('mani.p2_4')}</span>
                {t('mani.p2_5')}
                <span className="text-brand-accent font-medium">{t('mani.p2_6')}</span>
                {t('mani.p2_7')}
              </p>
              <p className="hover:text-white transition-colors duration-700 text-balance border-l border-white/5 pl-8 italic text-gray-500">
                {t('mani.p3')}
              </p>
            </div>
          </div>

        </div>

        <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <div className="p-10 border border-white/5 rounded-2xl frosted-layer group">
            <div className="text-[9px] font-mono text-gray-500 group-hover:text-brand-accent uppercase tracking-[0.4em] mb-6 font-bold transition-colors">{t('mani.box1.title')}</div>
            <div className="font-serif font-light text-2xl text-gray-300 group-hover:text-white transition-colors leading-snug">{t('mani.box1.desc')}</div>
          </div>
          <div className="p-10 border border-white/5 rounded-2xl frosted-layer group">
            <div className="text-[9px] font-mono text-gray-500 group-hover:text-brand-accent uppercase tracking-[0.4em] mb-6 font-bold transition-colors">{t('mani.box2.title')}</div>
            <div className="font-serif font-light text-2xl text-gray-300 group-hover:text-white transition-colors leading-snug">{t('mani.box2.desc')}</div>
          </div>
          <div className="p-10 border border-brand-accent/20 rounded-2xl frosted-layer group relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-accent/5 group-hover:bg-brand-accent/10 transition-colors" />
            <div className="relative z-10 text-[9px] font-mono text-brand-accent uppercase tracking-[0.4em] mb-6 font-bold">{t('mani.box3.title')}</div>
            <div className="relative z-10 font-serif font-light text-2xl text-white leading-snug">{t('mani.box3.desc')}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
