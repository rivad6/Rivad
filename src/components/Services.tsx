import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

export function Services() {
  const { t } = useLanguage();

  const services = [
    {
      id: "01",
      title: t('serv.s1.title'),
      description: t('serv.s1.desc')
    },
    {
      id: "02",
      title: t('serv.s2.title'),
      description: t('serv.s2.desc')
    },
    {
      id: "03",
      title: t('serv.s3.title'),
      description: t('serv.s3.desc')
    },
    {
      id: "04",
      title: t('serv.s4.title'),
      description: t('serv.s4.desc')
    }
  ];

  return (
    <section id="servicios" className="py-32 px-6 md:px-12 bg-transparent text-gray-200 relative z-20 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-accent/5 mix-blend-screen opacity-30 transform skew-x-12 translate-x-32 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col items-center text-center gap-8"
        >
          <h2 className="text-sm font-mono tracking-widest text-brand-accent uppercase mb-2 border border-brand-accent/20 px-4 py-2 rounded-full">
            {t('serv.title')}
          </h2>
          <h3 className="text-5xl md:text-8xl lg:text-[10rem] font-display font-light uppercase tracking-tighter leading-none mb-6">
            {t('serv.tree')}<br /> <span className="text-brand-accent font-serif font-black italic lowercase transform inline-block -rotate-2 drop-shadow-[0_10px_20px_rgba(242,74,41,0.2)]">{t('serv.skills')}</span>
          </h3>
          <p className="text-gray-400 font-sans text-lg md:text-xl font-light max-w-2xl text-balance">
            {t('serv.desc')}
          </p>
        </motion.div>

        <div className="flex flex-col border-t border-white/10">
          {services.map((service, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={service.id}
            >
              <a 
                href="#contacto"
                onClick={() => {
                  const select = document.getElementById('topic') as HTMLSelectElement;
                  if (select) {
                    if (service.title.toLowerCase().includes('web')) select.value = 'Servicios Web';
                    else if (service.title.toLowerCase().includes('cultural')) select.value = 'Gestión Cultural y Conferencias';
                    else if (service.title.toLowerCase().includes('música') || service.title.toLowerCase().includes('audio')) select.value = 'Colaboración Musical';
                    else select.value = 'Otros asuntos';
                  }
                }}
                className="group flex flex-col lg:flex-row border-b border-white/10 py-12 lg:py-20 hover:bg-white/5 transition-all duration-300 relative overflow-hidden frosted-layer !border-x-0 !border-t-0"
              >
                
                <div className="w-full lg:w-48 mb-6 lg:mb-0 flex items-start px-4 lg:px-8 z-10">
                  <span className="font-display font-light text-4xl lg:text-6xl text-white/20 group-hover:text-brand-accent transition-colors leading-none tracking-tighter">
                    {service.id}
                  </span>
                  <span className="font-mono text-[10px] text-brand-accent ml-2 uppercase font-bold tracking-widest leading-none mt-2">
                    [ INT ]
                  </span>
                </div>
                
                <div className="flex-1 pr-8 px-4 lg:px-0 z-10">
                  <h4 className="text-3xl md:text-4xl font-display font-medium tracking-tight mb-6 text-gray-100 group-hover:text-white transition-colors leading-tight">
                    {service.title}
                  </h4>
                  <p className="text-gray-400 font-sans text-sm md:text-base max-w-3xl leading-relaxed text-balance">
                    {service.description}
                  </p>
                </div>

                <div className="hidden lg:flex items-center justify-center w-32 relative z-10">
                  <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:border-brand-accent group-hover:text-white transition-all duration-500 shadow-lg">
                    <ArrowRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                </div>

                {/* Hover large text background */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[15rem] font-display text-brand-accent opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none select-none uppercase truncate tracking-tighter mix-blend-screen">
                  {service.title.split(' ')[0]}
                </div>

              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
