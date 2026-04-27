import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dices, ArrowRight, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getGeneratorData } from '../data/generatorData';

export function GeneratorPage() {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [eventName, setEventName] = useState("");
  const [selections, setSelections] = useState({ type: "", location: "", audience: "", budget: "" });
  const [isSpinning, setIsSpinning] = useState(false);
  const [randomEnding, setRandomEnding] = useState("");

  const generatorData = useMemo(() => getGeneratorData(language), [language]);

  const handleSpin = () => {
    if (!eventName.trim()) return;
    setStep(2);
    setIsSpinning(true);
    let spins = 0;
    
    // Choose a random ending in advance
    setRandomEnding(generatorData.endings[Math.floor(Math.random() * generatorData.endings.length)]);
    
    const interval = setInterval(() => {
      setSelections({
        type: generatorData.TYPES[Math.floor(Math.random() * generatorData.TYPES.length)],
        location: generatorData.LOCATIONS[Math.floor(Math.random() * generatorData.LOCATIONS.length)],
        audience: generatorData.AUDIENCES[Math.floor(Math.random() * generatorData.AUDIENCES.length)],
        budget: generatorData.BUDGETS[Math.floor(Math.random() * generatorData.BUDGETS.length)],
      });
      spins++;
      
      if (spins > 20) {
        clearInterval(interval);
        setIsSpinning(false);
        setStep(3);
      }
    }, 80);
  };

  const response = step === 3 
    ? generatorData.generateResponse(eventName, selections.budget, selections.audience, selections.location, selections.type, randomEnding)
    : "";

  return (
    <main className="min-h-screen bg-[#050308] text-white flex flex-col pt-12 relative overflow-hidden">
      {/* Immersive geometric background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-900/20 via-[#050308]/80 to-[#050308] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <div className="px-6 md:px-12 w-full max-w-7xl mx-auto relative z-10">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-pink-500/70 hover:text-pink-400 transition-colors uppercase tracking-[0.2em] font-mono text-sm mb-12"
        >
          <ArrowLeft size={16} />
          <span>{t('orc.back')}</span>
        </Link>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto px-6 md:px-0 relative z-10 pb-24">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-mono tracking-[0.2em] text-pink-500 uppercase mb-4 inline-flex items-center gap-2 border border-pink-500/30 px-6 py-2 rounded-full bg-pink-500/5 shadow-[0_0_15px_rgba(236,72,153,0.3)]"
          >
            <Dices size={16} /> {t('orc.badge')}
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-[6rem] font-display uppercase tracking-[-0.04em] leading-none mb-6 text-pink-50"
          >
            {t('orc.title1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">{t('orc.title2')}</span>
          </motion.h3>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-sans font-light text-lg text-pink-200/60 max-w-2xl mx-auto"
          >
            {t('orc.desc')}
          </motion.p>
        </div>

        <div className="bg-[#0f0a14]/80 backdrop-blur-xl border border-pink-900/30 p-8 md:p-16 shadow-[0_0_50px_rgba(236,72,153,0.05)] rounded-3xl relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent blur-[2px]" />
          
          <AnimatePresence mode="wait">
            
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center text-center space-y-12"
              >
                <div className="w-full max-w-xl">
                  <label className="block font-mono text-xs text-pink-500/70 uppercase tracking-widest mb-6">{t('orc.input.label')}</label>
                  <input 
                    type="text" 
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t('orc.input.placeholder')}
                    className="w-full bg-black/50 border border-[#333] rounded-2xl text-2xl md:text-4xl text-center py-6 px-6 focus:outline-none focus:border-pink-500 focus:bg-black/80 focus:shadow-[0_0_30px_rgba(236,72,153,0.2)] transition-all font-serif italic text-white placeholder:text-[#444]"
                  />
                </div>
                
                <button 
                  onClick={handleSpin}
                  disabled={!eventName.trim()}
                  className="bg-white text-black px-12 py-5 rounded-full font-mono uppercase tracking-[0.2em] text-sm font-bold hover:bg-pink-500 hover:text-white hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] transition-all duration-300 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black disabled:hover:shadow-none disabled:cursor-not-allowed flex items-center gap-4 group"
                >
                  {t('orc.btn.spin')}
                  <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </motion.div>
            )}

            {(step === 2 || step === 3) && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col space-y-10"
              >
                <div className="text-center pb-10 border-b border-pink-900/30">
                  <h4 className="text-3xl md:text-5xl font-serif text-white mb-3 tracking-wide">"{eventName || 'Proyectazo'}"</h4>
                  <p className="font-mono text-xs text-pink-500 uppercase tracking-[0.2em]">{t('orc.diag')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs md:text-sm uppercase tracking-widest">
                  {[
                    { label: t('orc.lbl1'), value: selections.type, delay: 0 },
                    { label: t('orc.lbl2'), value: selections.location, delay: 0.1 },
                    { label: t('orc.lbl3'), value: selections.audience, delay: 0.2 },
                    { label: t('orc.lbl4'), value: selections.budget, delay: 0.3, isPink: true }
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: step === 3 ? item.delay : 0 }}
                      className={`border ${item.isPink ? 'border-pink-500/50 bg-pink-500/5 shadow-[inset_0_0_20px_rgba(236,72,153,0.1)]' : 'border-[#222] bg-[#0a0a0a]'} p-6 rounded-xl flex flex-col gap-2 relative overflow-hidden`}
                    >
                      <span className="text-[#666] block text-[10px] tracking-[0.2em]">{item.label}:</span>
                      <span className={`text-base ${item.isPink ? 'text-pink-400 font-bold' : 'text-gray-200'} ${isSpinning ? 'blur-[4px] opacity-70' : 'blur-0 opacity-100'} transition-all duration-100`}>
                        {item.value || '...'}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {step === 3 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="mt-4 bg-gradient-to-br from-pink-950/40 to-purple-950/40 border border-pink-500/30 p-8 md:p-10 rounded-2xl relative shadow-[0_10px_40px_rgba(236,72,153,0.1)]"
                  >
                    <div className="absolute -top-4 -left-4 bg-pink-500 text-white p-3 rounded-full shadow-[0_0_20px_rgba(236,72,153,0.5)]">
                      <MessageSquare size={20} />
                    </div>
                    <p className="font-serif italic text-xl md:text-3xl text-pink-50 leading-relaxed text-balance indent-8">
                      "{response}"
                    </p>
                    
                    <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center justify-between border-t border-pink-900/30 pt-8">
                      <a href="/#contacto" className="bg-pink-500 text-white px-8 py-4 rounded-full font-mono font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-all duration-300 w-full sm:w-auto text-center flex items-center justify-center gap-3">
                        {t('orc.btn.action')} <Send size={14} />
                      </a>
                      <button onClick={() => {
                        setStep(1);
                        setEventName("");
                      }} className="text-pink-300/50 hover:text-pink-300 font-mono uppercase text-xs tracking-widest transition-colors flex items-center gap-2">
                        <span>{t('orc.btn.reset')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
