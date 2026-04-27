import { motion } from 'motion/react';
import { ExternalLink, BookOpen, Music, Terminal, Code2, Gamepad2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

interface ProjectCardProps {
  title: string;
  category: string;
  description: string;
  icon: ReactNode;
  colSpan?: 1 | 2;
  linkText?: string;
  href?: string;
  className?: string;
  index: string;
}

function ProjectCard({ title, category, description, icon, colSpan = 1, linkText = "Explorar", href = "#", className, index }: ProjectCardProps) {
  const isInternal = href.startsWith('/');
  
  const LinkContent = (
    <>
      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-all duration-700 pointer-events-none text-white mix-blend-overlay -translate-y-4 group-hover:translate-y-0">
        {icon}
      </div>
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-10 border-b border-blue-900/30 pb-5">
          <div className="font-mono text-[9px] tracking-[0.4em] text-blue-400 uppercase">
            {category}
          </div>
          <div className="font-mono text-3xl font-bold text-white/5 group-hover:text-blue-500/20 transition-all duration-500">
            {index}
          </div>
        </div>
        
        <div>
          <h3 className="text-3xl lg:text-5xl font-display font-light mb-6 text-white group-hover:text-blue-400 transition-all duration-500 leading-none">
            {title}
          </h3>
          <p className="text-blue-100/50 group-hover:text-blue-100/80 font-sans text-sm md:text-base mb-10 leading-relaxed max-w-sm transition-colors duration-500">
            {description}
          </p>
        </div>

        <div className="inline-flex items-center justify-between w-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] border-t border-blue-900/30 pt-5 opacity-40 group-hover:opacity-100 group-hover:text-blue-400 text-white transition-all duration-500">
          <span>{linkText}</span>
          <div className="w-8 h-8 rounded-full border border-blue-500/30 flex items-center justify-center group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all shadow-xl">
            <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </>
  );

  const containerClasses = cn(
    "group relative border-r border-b border-blue-900/20 bg-transparent p-8 md:p-12 hover:bg-blue-950/20 transition-all duration-700 flex flex-col h-full overflow-hidden frosted-layer",
    colSpan === 2 && "md:col-span-2",
    className
  );

  return isInternal ? (
    <Link to={href} className={containerClasses}>
      {LinkContent}
    </Link>
  ) : (
    <a href={href} target={href !== "#" ? "_blank" : undefined} rel={href !== "#" ? "noopener noreferrer" : undefined} className={containerClasses}>
      {LinkContent}
    </a>
  );
}

export function Ecosystem() {
  const { t } = useLanguage();

  return (
    <section id="proyectos" className="py-24 border-t border-blue-900/20 relative z-20 bg-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 md:px-0 relative z-10 w-full overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 md:pl-12"
        >
          <div>
            <h2 className="text-sm font-mono tracking-widest text-blue-400/60 uppercase mb-4">{t('eco.title')}</h2>
            <h3 className="text-5xl md:text-7xl lg:text-8xl font-display font-light uppercase tracking-tighter leading-[0.95] text-white">
              {t('eco.multiverse')} <br /> 
              <span className="block text-blue-400 font-serif font-black italic tracking-normal text-[0.8em] lowercase ml-8 md:ml-24 mt-2">
                {t('eco.creative')}
              </span>
            </h3>
          </div>
          <p className="text-blue-100/60 font-serif text-lg md:text-xl font-light max-w-sm hidden lg:block border-l border-blue-500/30 pl-4 py-2">
            {t('eco.desc')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:border-t lg:border-l border-blue-900/20 lg:mx-12 relative z-10">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}>
            <ProjectCard 
              index="01"
              category={t('eco.cat1')}
              title="6de6.com.mx"
              description={t('eco.proj1.desc')}
              icon={<BookOpen size={200} />}
              linkText={t('eco.proj1.link')}
              href="https://6de6.com.mx"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}>
            <ProjectCard 
              index="02"
              category={t('eco.cat2')}
              title="Tendedero de Palabras"
              description={t('eco.proj2.desc')}
              icon={<Terminal size={200} />}
              linkText={t('eco.proj2.link')}
              href="https://tendederodepalabras.wordpress.com"
            />
          </motion.div>
          
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.5 }}>
            <ProjectCard 
              index="03"
              category={t('eco.cat3')}
              title="Rivad"
              description={t('eco.proj3.desc')}
              icon={<Music size={200} />}
              linkText={t('eco.proj3.link')}
              href="https://open.spotify.com/artist/3pCE7J12cRSJoJeDBwge8Q?si=q3B-n2NJQ8SY6EX3qDkgyA"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4, duration: 0.5 }}>
            <ProjectCard 
              index="04"
              category={t('eco.cat4')}
              title={t('eco.proj4.title')}
              description={t('eco.proj4.desc')}
              icon={<Code2 size={200} />}
              linkText={t('eco.proj4.link')}
              href="/juegos"
            />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.5 }} className="md:col-span-2">
            <ProjectCard 
              index="05"
              category={t('eco.cat5')}
              title={t('eco.proj5.title')}
              description={t('eco.proj5.desc')}
              icon={<Gamepad2 size={200} />}
              linkText={t('eco.proj5.link')}
              href="/fest-jump"
              colSpan={2}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
