import { useEffect, useState } from 'react';
import { Arcade } from '../components/Arcade';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useLanguage } from '../context/LanguageContext';

export function ArcadePage() {
  const { t } = useLanguage();
  const [dustParticles, setDustParticles] = useState<Array<{id: number, x: number, y: number, size: number, duration: number, delay: number}>>([]);

  useEffect(() => {
    // Generate static dust particles
    const particles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setDustParticles(particles);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col pt-32 text-white overflow-hidden relative selection:bg-brand-accent selection:text-black">
      {/* Immersive ambient arcade backgrounds */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-accent/15 via-black/0 to-transparent opacity-80 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent blur-[100px] pointer-events-none" />
      
      {/* Scanline pattern for the room */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]" />
      
      {/* Floating Dust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {dustParticles.map(p => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-white/20 blur-[1px]"
            style={{ 
              width: p.size, 
              height: p.size,
              left: p.x + '%',
              top: p.y + '%'
            }}
            animate={{
              y: ['0vh', '-20vh'],
              x: ['0vw', (Math.random() * 10 - 5) + 'vw'],
              opacity: [0, Math.random() * 0.5 + 0.2, 0]
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

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