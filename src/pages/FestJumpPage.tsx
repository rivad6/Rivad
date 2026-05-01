import { FestJump } from '../components/games/FestJump';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Rocket, Star, Ticket, Zap, ChevronRight, Music, Mail, ExternalLink, Trophy, X, User, Disc, Radio, MonitorSpeaker, Cpu, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';

export function FestJumpPage() {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleModalClose = () => setActiveModal(null);

  const PLAYERS = [
    { name: 'XÆA-12', score: '8,240', rank: 1, char: 'ghost' },
    { name: 'NEON_SAMURAI', score: '7,900', rank: 2, char: 'cyber' },
    { name: 'GHOST_IN_SHELL', score: '6,850', rank: 3, char: 'punk' },
    { name: 'RIVAD_AI', score: '5,500', rank: 4, char: 'default' },
    { name: 'JUMPER_99', score: '4,200', rank: 5, char: 'default' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative font-sans selection:bg-fuchsia-500 selection:text-white overflow-x-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540039155732-d688fa53b4ad?q=80&w=2669&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-screen" />
        <div className="absolute inset-x-0 bottom-0 h-[80vh] bg-gradient-to-t from-[#020617] via-[#0f172a]/80 to-transparent" />
        
        {/* Animated Light Beams */}
        <motion.div 
          animate={{ rotate: [0, 5, -5, 0], opacity: [0.3, 0.6, 0.3] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] left-[20%] w-[150px] h-[150%] bg-fuchsia-600/10 blur-[100px] origin-top mix-blend-screen" 
        />
        <motion.div 
          animate={{ rotate: [0, -8, 8, 0], opacity: [0.2, 0.5, 0.2] }} 
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -top-[10%] right-[15%] w-[200px] h-[150%] bg-cyan-500/10 blur-[120px] origin-top mix-blend-screen" 
        />
      </div>

      {/* Global Navigation Header */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-3 text-sm font-medium text-gray-400 hover:text-white transition-colors group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white/10 group-hover:scale-110 transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="uppercase tracking-[0.2em]">{t('game.fest.back', 'BACK TO ARCADE')}</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                <span className="text-xs text-gray-300 font-mono tracking-widest uppercase">Nodes Online</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <a href="#sponsor" className="text-xs text-gray-400 hover:text-fuchsia-400 font-mono tracking-widest uppercase transition-colors">Sponsors</a>
             <a href="#leaderboard" className="text-xs text-gray-400 hover:text-cyan-400 font-mono tracking-widest uppercase transition-colors">Rankings</a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-12 md:pt-48 md:pb-24 px-6">
         <div className="max-w-[1200px] mx-auto text-center flex flex-col items-center">
            
            <motion.div 
               initial={{ opacity: 0, y: 30 }} 
               animate={{ opacity: 1, y: 0 }} 
               transition={{ duration: 1, ease: 'easeOut' }}
               className="mb-8"
            >
               <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter uppercase leading-[0.8] mb-4">
                  {t('game.fest.page.event_name', 'JUMPFEST')}
               </h1>
               <div className="flex items-center justify-center gap-4 text-xs md:text-sm font-mono text-gray-400 tracking-[0.3em] uppercase">
                  <Music size={14} className="text-fuchsia-500" />
                  <span>The Ultimate Virtual Rave</span>
                  <Radio size={14} className="text-cyan-500" />
               </div>
            </motion.div>

            <motion.p 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               transition={{ duration: 1, delay: 0.5 }}
               className="max-w-2xl text-gray-400 text-sm md:text-base leading-relaxed mb-12"
            >
               {t('game.fest.page.why_play.desc', 'Step into the neon arena. Timing is everything. Gather multiplier shards, avoid the void sentinels, and cement your legacy on the global mainstage.')}
            </motion.p>
            
            <motion.a 
               href="#gameboard"
               initial={{ opacity: 0, scale: 0.8 }} 
               animate={{ opacity: 1, scale: 1 }} 
               transition={{ type: "spring", delay: 0.8 }}
               className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-fuchsia-400 transition-colors animate-bounce shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            >
               <Rocket size={18} /> Enter the Arena
            </motion.a>
         </div>
      </section>

      {/* Main Content Grid */}
      <main className="relative z-10 max-w-[1800px] mx-auto w-full px-4 md:px-8 pb-32" id="gameboard">
         
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Festival Identity */}
            <div className="lg:col-span-3 flex flex-col gap-8 order-2 lg:order-1">
               <div className="border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/20 blur-[50px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
                  <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center border border-fuchsia-500/20 mb-6 text-fuchsia-400">
                     <Disc size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-4 uppercase tracking-wider">Lineup Announced</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                     Compete against algorithmic DJs and synthetic crowd surges. The higher you climb, the harder the bass drops.
                  </p>
                  <ul className="space-y-3 font-mono text-xs text-gray-500">
                     <li className="flex justify-between border-b mx-0 border-white/5 pb-2"><span>[STAGE 1]</span> <span className="text-cyan-400">Mainstage</span></li>
                     <li className="flex justify-between border-b mx-0 border-white/5 pb-2"><span>[STAGE 2]</span> <span className="text-emerald-400">Trance Arena</span></li>
                     <li className="flex justify-between border-b mx-0 border-white/5 pb-2"><span>[STAGE 3]</span> <span className="text-orange-400">Warehouse</span></li>
                  </ul>
               </div>

               <div className="border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8" id="sponsor">
                   <h3 className="text-xs font-mono tracking-widest text-gray-500 uppercase mb-6 flex items-center gap-2">
                     <MonitorSpeaker size={14} /> Global Sponsors
                   </h3>
                   <div className="space-y-4">
                      {/* Sponsor Block */}
                      <button aria-label="Sponsor Neon Cola" onClick={() => setActiveModal('sponsor_contact')} className="w-full text-left bg-gradient-to-r from-gray-900 to-black border border-white/5 p-4 rounded-xl hover:border-fuchsia-500/50 transition-colors group">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white uppercase tracking-wider">Neon Cola</span>
                           <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-400 px-2 py-1 rounded font-mono">PARTNER</span>
                         </div>
                         <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Official energy provider of the simulation.</p>
                      </button>
                      <button aria-label="Sponsor Cybernetics Inc" onClick={() => setActiveModal('sponsor_deck')} className="w-full text-left bg-gradient-to-r from-gray-900 to-black border border-white/5 p-4 rounded-xl hover:border-cyan-500/50 transition-colors group">
                         <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-white uppercase tracking-wider">Cybernetics Inc</span>
                           <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded font-mono">PLATINUM</span>
                         </div>
                         <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">Upgrading raver bodies since 2024.</p>
                      </button>
                   </div>
               </div>
            </div>

            {/* Center Column: THE GAME HOST */}
            <div className="lg:col-span-6 order-1 lg:order-2">
               <div className="w-full relative aspect-[9/16] md:aspect-square lg:aspect-[4/5] bg-black rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
                  
                  {/* Decorative Frame */}
                  <div className="absolute top-0 inset-x-0 h-10 bg-zinc-900/80 backdrop-blur border-b border-white/10 z-20 flex items-center justify-between px-4">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/50 border border-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500" />
                     </div>
                     <div className="font-mono text-[10px] text-gray-500 tracking-widest">FEST_JUMP.EXE</div>
                     <div className="w-16" />
                  </div>

                  <div className="absolute inset-0 pt-10">
                     <FestJump isFullscreen={true} />
                  </div>
               </div>
               
               <div className="mt-8 flex items-center justify-center gap-4 text-xs font-mono text-gray-500">
                  <Cpu size={14} /> Server Load: 42% <span className="text-white/20">|</span> Latency: 12ms <span className="text-white/20">|</span> Uptime: 99.9%
               </div>
            </div>

            {/* Right Column: Community & Leaderboards */}
            <div className="lg:col-span-3 flex flex-col gap-8 order-3" id="leaderboard">
               <div className="border border-white/10 bg-white/[0.02] backdrop-blur-md rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                     <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-3">
                        <Trophy className="text-yellow-500" size={20} /> Hall of Fame
                     </h3>
                  </div>

                  <div className="space-y-3">
                     {PLAYERS.map((player, i) => (
                        <div 
                           key={`player_${player.name}`}
                           onClick={() => setActiveModal(`player_${player.name}`)}
                           className="group flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all"
                        >
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm
                              ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                                i === 1 ? 'bg-gray-300/20 text-gray-300 border border-gray-400/50' : 
                                i === 2 ? 'bg-orange-600/20 text-orange-500 border border-orange-500/50' : 
                                'bg-white/5 text-gray-500'}`}
                           >
                              {player.rank}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm tracking-widest truncate group-hover:text-fuchsia-400 transition-colors">{player.name}</h4>
                              <p className="text-[10px] font-mono text-gray-500 uppercase mt-1">Class: {player.char}</p>
                           </div>
                           <div className="text-right">
                              <span className="block font-mono font-bold text-white tracking-widest">{player.score}</span>
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Karmas</span>
                           </div>
                        </div>
                     ))}
                  </div>

                  <button 
                     aria-label="View Global Ranks"
                     onClick={() => setActiveModal('full_rankings')}
                     className="w-full mt-6 py-3 border border-white/10 text-xs font-mono text-gray-400 hover:text-white hover:bg-white/5 rounded-xl uppercase tracking-widest transition-all"
                  >
                     View Global Ranks
                  </button>
               </div>
            </div>
         </div>
      </main>

      {/* Global Modals */}
      <AnimatePresence>
         {activeModal && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
               onClick={handleModalClose}
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-lg w-full p-8 md:p-12 shadow-2xl relative overflow-hidden font-sans"
               >
                  <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent pointer-events-none" />
                  
                  <button aria-label="Close Modal" onClick={handleModalClose} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-black/50 p-2 rounded-full border border-white/10 transition-colors z-10">
                     <X size={16} />
                  </button>

                  <div className="relative z-10 flex flex-col items-center text-center">
                     {activeModal === 'sponsor_contact' && (
                        <>
                           <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(217,70,239,0.3)] text-fuchsia-400">
                              <Mail size={24} />
                           </div>
                           <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Partner With Us</h2>
                           <p className="text-gray-400 leading-relaxed mb-8">
                              Place your brand directly inside the Jumpfest simulation. We offer virtual billboards, custom playable characters, and thematic power-ups.
                           </p>
                           <button aria-label="Request Media Kit" onClick={handleModalClose} className="w-full py-4 bg-white hover:bg-gray-200 text-black font-bold uppercase tracking-widest rounded-xl transition-all">
                              Request Media Kit
                           </button>
                        </>
                     )}
                     
                     {activeModal === 'sponsor_deck' && (
                        <>
                           <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)] text-cyan-400">
                              <ExternalLink size={24} />
                           </div>
                           <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Sponsorship Deck</h2>
                           <p className="text-gray-400 leading-relaxed mb-8">
                              Dive into our realtime metrics. The Engine delivers unparalleled engagement. View our interactive brief to explore tiers and integrations.
                           </p>
                           <button aria-label="Download Brief PDF" onClick={handleModalClose} className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest rounded-xl transition-all">
                              Download Brief PDF
                           </button>
                        </>
                     )}

                     {activeModal === 'full_rankings' && (
                        <>
                           <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] text-yellow-400">
                              <Trophy size={24} />
                           </div>
                           <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Global Network</h2>
                           <p className="text-gray-400 leading-relaxed mb-8">
                              We are currently fetching the planetary leaderboard data from outer rim nodes. Please check back next cycle.
                           </p>
                           <button aria-label="Close Dashboard" onClick={handleModalClose} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase tracking-widest rounded-xl border border-zinc-700 transition-colors">
                              Close Dashboard
                           </button>
                        </>
                     )}

                     {activeModal.startsWith('player_') && (
                        <>
                           <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-500 p-1 mb-6">
                              <div className="w-full h-full bg-zinc-900 rounded-full flex items-center justify-center border-4 border-black">
                                 <User size={32} className="text-white/50" />
                              </div>
                           </div>
                           <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{activeModal.replace('player_', '')}</h2>
                           
                           <div className="flex gap-4 mb-8 font-mono text-xs uppercase tracking-widest">
                              <span className="px-3 py-1 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded-md">Level 99</span>
                              <span className="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">Vanguard</span>
                           </div>
                           
                           <button aria-label="Close Profile" onClick={handleModalClose} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest rounded-xl border border-white/10 transition-colors">
                              Close Profile
                           </button>
                        </>
                     )}
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}

