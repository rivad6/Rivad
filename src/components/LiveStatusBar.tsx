import { motion } from 'motion/react';

export function LiveStatusBar() {
  return (
    <div className="fixed top-24 left-0 w-full z-40 pointer-events-none flex justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto bg-[#090b11]/60 backdrop-blur-md border border-white/5 px-4 py-1.5 rounded-full flex items-center gap-3 shadow-2xl"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </div>
        
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400">
          <span className="text-white/60">CARGO ACTUAL:</span>
          <span className="text-brand-accent font-bold">JUD DEL FARO BICENTENARIO MH CDMX</span>
        </div>
        
        <div className="h-3 w-[1px] bg-white/10 hidden sm:block"></div>
        
        <div className="hidden sm:flex items-center gap-1 font-mono text-[8px] text-green-500 opacity-60">
          <span className="uppercase tracking-widest">System Online</span>
        </div>
      </motion.div>
    </div>
  );
}
