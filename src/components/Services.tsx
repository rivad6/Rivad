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
    <section id="servicios" className="py-32 px-6 md:px-12 bg-[#F5F2ED] text-[#1A1A1A] relative z-20 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#E5E0D8] mix-blend-multiply opacity-50 transform skew-x-12 translate-x-32" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col items-center text-center gap-8"
        >
          <h2 className="text-sm font-mono tracking-widest text-[#4A25E1] uppercase mb-2 border border-[#4A25E1] px-4 py-2 rounded-full">
            {t('serv.title')}
          </h2>
          <h3 className="text-6xl md:text-8xl lg:text-[10rem] font-display font-bold uppercase tracking-tighter leading-none mb-6">
            {t('serv.tree')}<br /> <span className="text-[#4A25E1] transform inline-block -rotate-2">{t('serv.skills')}</span>
          </h3>
          <p className="text-gray-600 font-sans text-lg md:text-xl font-light max-w-2xl text-balance">
            {t('serv.desc')}
          </p>
        </motion.div>

        <div className="flex flex-col border-t border-[#1A1A1A]/20">
          {services.map((service, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              key={service.id}
              className="group flex flex-col lg:flex-row border-b border-[#1A1A1A]/20 py-12 lg:py-20 hover:bg-[#EAE5DF] transition-all duration-300 relative overflow-hidden"
            >
              
              <div className="w-full lg:w-48 mb-6 lg:mb-0 flex items-start px-4 lg:px-8 z-10">
                <span className="font-display font-bold text-4xl lg:text-6xl text-[#1A1A1A]/30 group-hover:text-[#4A25E1] transition-colors leading-none tracking-tighter">
                  {service.id}
                </span>
                <span className="font-mono text-[10px] text-[#4A25E1] ml-2 uppercase font-bold tracking-widest leading-none mt-2">
                  [ INT ]
                </span>
              </div>
              
              <div className="flex-1 pr-8 px-4 lg:px-0 z-10">
                <h4 className="text-3xl md:text-5xl font-serif font-normal italic mb-6 text-[#1A1A1A] leading-tight">
                  {service.title}
                </h4>
                <p className="text-gray-700 font-sans text-sm md:text-base max-w-3xl leading-relaxed text-balance">
                  {service.description}
                </p>
              </div>

              <div className="hidden lg:flex items-center justify-center w-32 relative z-10">
                <div className="w-16 h-16 rounded-full border border-[#1A1A1A] flex items-center justify-center group-hover:bg-[#4A25E1] group-hover:border-[#4A25E1] group-hover:text-white transition-all duration-500">
                  <ArrowRight className="w-6 h-6 -rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                </div>
              </div>

              {/* Hover large text background */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[15rem] font-display text-[#4A25E1] opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none select-none uppercase truncate tracking-tighter mix-blend-multiply">
                {service.title.split(' ')[0]}
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
