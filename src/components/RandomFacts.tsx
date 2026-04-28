import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Dna, FileQuestion, Quote, RefreshCw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function RandomFacts() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(1);

  const TOTAL_FACTS = 75;

  const handleOpen = () => {
    setCurrentIndex(Math.floor(Math.random() * TOTAL_FACTS) + 1);
    setIsOpen(true);
  };

  const handleNext = () => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * TOTAL_FACTS) + 1;
    } while (nextIndex === currentIndex);
    setCurrentIndex(nextIndex);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="group relative inline-flex w-full max-w-[320px] sm:max-w-md items-center gap-2 px-6 py-4 bg-brand-accent/10 border border-brand-accent/30 hover:bg-brand-accent hover:border-brand-accent transition-all duration-300 backdrop-blur-sm justify-center shadow-[4px_4px_0_rgba(242,74,41,0.3)] hover:shadow-[0_0_0_rgba(242,74,41,0)] hover:translate-x-[4px] hover:translate-y-[4px]"
      >
        <FileQuestion size={16} className="text-brand-accent group-hover:text-black transition-colors" />
        <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-brand-accent group-hover:text-black font-bold transition-colors">
          {t('hero.random_facts')}
        </span>
      </button>

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-none"
            >
              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-xl bg-[#0F0D15] border-2 border-brand-accent overflow-hidden flex flex-col shadow-[12px_12px_0_0_rgba(242,74,41,1)]"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-brand-accent/20 bg-brand-accent/10">
                  <div className="flex items-center gap-3">
                    <Dna size={20} className="text-brand-accent animate-pulse" />
                    <h3 className="font-mono text-sm md:text-base uppercase tracking-widest text-[#f0f0f0] font-bold">
                      {t('rf.title')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-brand-accent/20 transition-colors rounded-sm"
                  >
                    <X size={20} className="text-gray-400 hover:text-white transition-colors" />
                  </button>
                </div>

                {/* Content body */}
                <div className="flex flex-col items-start p-8 md:p-12 bg-[#0F0D15] min-h-[350px] w-full">
                  {/* ID Tag */}
                  <div className="w-full flex justify-between items-center font-mono text-brand-accent text-xs mb-8 border-b border-brand-accent/20 pb-4">
                    <span className="tracking-widest">{"// ARCHIVO_"} {currentIndex.toString().padStart(3, '0')}</span>
                    <span className="text-gray-500 tracking-widest">{"[ CLASSIFIED ]"}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentIndex}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full flex flex-col gap-8 flex-1 justify-center"
                    >
                      <p className="font-display text-xl md:text-3xl text-gray-100 leading-snug font-medium text-balance">
                        "{t(`rf.fact${currentIndex}` as any)}"
                      </p>

                      <div className="relative pl-6 border-l-4 border-brand-accent/80">
                        <Quote size={20} className="absolute -left-3 -top-2 text-brand-accent bg-[#0F0D15] px-1" />
                        <p className="font-mono text-sm md:text-base text-gray-400 italic leading-relaxed text-balance">
                          {t(`rf.quote${currentIndex}` as any)}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-brand-accent/20 bg-brand-accent/5 flex justify-between items-center gap-4 flex-col sm:flex-row">
                  <button
                    onClick={handleNext}
                    className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] px-6 py-4 bg-[#1a1726] border border-white/10 text-white font-bold hover:bg-brand-accent hover:border-brand-accent hover:text-black transition-all flex items-center gap-3 w-full sm:w-auto justify-center group"
                  >
                    <RefreshCw size={14} className="group-hover:-rotate-180 transition-transform duration-500 ease-in-out" />
                    {t('rf.btn_next')}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] px-6 py-4 bg-brand-accent border border-brand-accent text-[#0F0D15] font-bold hover:bg-white hover:border-white transition-colors w-full sm:w-auto text-center shadow-[4px_4px_0_rgba(255,255,255,0.2)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
                  >
                    {t('rf.btn_close')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
