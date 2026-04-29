import { FestJump } from '../components/games/FestJump';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Rocket, Star, Ticket, Zap, ChevronRight, Music, Mail, ExternalLink, Trophy, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useState } from 'react';

export function FestJumpPage() {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const handleModalClose = () => setActiveModal(null);

  const PLAYERS = [
    { name: 'XÆA-12', score: '8,240', rank: 1, char: 'ghost' },
    { name: 'NEON_SAMURAI', score: '7,900', rank: 2, char: 'cyber' },
    { name: 'GHOST_IN_SHELL', score: '6,850', rank: 3, char: 'punk' },
    { name: 'RIVAD_AI', score: '5,500', rank: 4, char: 'default' },
    { name: 'JUMPER_99', score: '4,200', rank: 5, char: 'default' },
  ];

  return (
    <div className="min-h-screen bg-[#020202] flex flex-col relative font-mono selection:bg-pink-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" style={{ transform: 'perspective(1000px) rotateX(60deg) translateY(-200px) scale(3)' }} />
        <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[200px] bg-gradient-to-r from-transparent via-purple-500/5 to-transparent blur-[50px] rotate-45" />
      </div>

      {/* Persistent Navigation */}
      <div className="relative z-50 w-full p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xs md:text-sm text-gray-400 hover:text-white transition-colors uppercase tracking-[0.2em] relative group"
          >
            <div className="absolute -inset-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            <ArrowLeft size={16} /> <span className="relative z-10">{t('game.fest.back')}</span>
          </Link>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          <span className="hidden md:inline-block text-[10px] text-pink-500 font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">
            {t('game.fest.page.subtitle')}
          </span>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(236,72,153,0.2)]">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              <span className="text-[10px] text-pink-400 tracking-widest font-bold">SERVER STATUS: LIVE</span>
           </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="relative z-10 flex-grow w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 p-0 lg:p-8">
        
        {/* Left Sidebar - Festival Info & Ads */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-8 py-8 pl-4">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-200 to-pink-600 tracking-tighter leading-none italic uppercase drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]">
              {t('game.fest.page.event_name')}
            </h1>
            <p className="text-blue-400 tracking-[0.3em] text-[10px] font-bold uppercase flex items-center gap-2 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
              <Music size={12} /> {t('game.fest.page.event_date')}
            </p>
          </motion.div>

          {/* Interactive Promo Ad 1 */}
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} 
            onClick={() => setActiveModal('sponsor_contact')}
            className="text-left bg-gradient-to-br from-pink-500/10 to-transparent p-6 rounded-2xl border border-pink-500/20 backdrop-blur-md relative overflow-hidden group hover:border-pink-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_25px_rgba(236,72,153,0.2)] hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/5 transition-colors duration-500" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-pink-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Star className="text-pink-400 group-hover:animate-spin-slow" size={20} />
                <span className="text-[9px] bg-pink-500/20 text-pink-300 px-2 py-1 rounded tracking-widest font-bold shadow-[inset_0_0_5px_rgba(236,72,153,0.2)]">AD_SPACE_01</span>
              </div>
              <h3 className="text-white font-black tracking-widest text-lg mb-2 uppercase drop-shadow-md">{t('game.fest.page.promo1')}</h3>
              <p className="text-sm text-gray-400 mb-6 group-hover:text-gray-300 transition-colors leading-relaxed">{t('game.fest.page.promo1.desc')}</p>
              <div className="text-[10px] uppercase tracking-[0.2em] text-pink-400 font-bold flex items-center gap-2 group-hover:text-pink-300 transition-colors">
                <Mail size={12} /> {t('game.fest.page.contact')} <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Interactive Promo Ad 2 */}
          <motion.button 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} 
            onClick={() => setActiveModal('sponsor_deck')}
            className="text-left bg-gradient-to-br from-blue-500/10 to-transparent p-6 rounded-2xl border border-blue-500/20 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_25px_rgba(59,130,246,0.2)] hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Zap className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded tracking-widest font-bold shadow-[inset_0_0_5px_rgba(59,130,246,0.2)]">AD_SPACE_02</span>
              </div>
              <h3 className="text-white font-black tracking-widest text-lg mb-2 uppercase drop-shadow-md">{t('game.fest.page.promo2')}</h3>
              <p className="text-sm text-gray-400 mb-6 group-hover:text-gray-300 transition-colors leading-relaxed">{t('game.fest.page.promo2.desc')}</p>
              <div className="text-[10px] uppercase tracking-[0.2em] text-blue-400 font-bold flex items-center gap-2 group-hover:text-blue-300 transition-colors">
                <ExternalLink size={12} /> {t('game.fest.page.deck')} <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

        </div>

        {/* Center - Game Container */}
        <div className="col-span-1 lg:col-span-6 flex flex-col h-[100dvh] lg:h-auto w-full max-w-[600px] mx-auto justify-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full h-full lg:h-[800px] bg-[#050510] lg:rounded-3xl lg:border border-white/5 lg:shadow-[0_0_50px_rgba(236,72,153,0.1),inset_0_0_30px_rgba(0,0,0,0.8)] overflow-hidden relative flex flex-col ring-1 ring-white/5 group"
          >
            {/* Hologram aesthetic lines */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-500/50 to-transparent opacity-50 z-20 pointer-events-none group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-transparent via-blue-500/30 to-transparent z-20 pointer-events-none group-hover:via-blue-500/60 transition-colors"></div>
            <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-transparent via-pink-500/30 to-transparent z-20 pointer-events-none group-hover:via-pink-500/60 transition-colors"></div>
            
            {/* The Game itself */}
            <div className="w-full h-full relative z-10">
               <FestJump isFullscreen={true} hideFullscreenButton={true} />
            </div>
          </motion.div>
          
          <div className="hidden lg:flex justify-center mt-6 items-center gap-2 text-[10px] text-gray-600 tracking-widest uppercase font-bold drop-shadow-sm">
             <Rocket size={12} className="text-pink-600" /> Powered by Jumper.OS Engine v2.0
          </div>
        </div>

        {/* Right Sidebar - Info */}
        <div className="hidden lg:flex lg:col-span-3 flex-col gap-6 py-8 pr-4">
           
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-transparent border border-white/10 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full" />
              <div className="flex items-center gap-3 mb-4 relative z-10">
                 <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                    <Ticket className="text-pink-400" size={20} />
                 </div>
                 <h3 className="text-white font-black tracking-widest uppercase">{t('game.fest.page.why_play')}</h3>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed relative z-10">
                {t('game.fest.page.why_play.desc')}
              </p>
           </motion.div>

           {/* Interactive Leaderboard */}
           <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-2 px-2">
                 <Trophy size={16} className="text-yellow-500" />
                 <h4 className="text-[12px] text-white tracking-[0.2em] uppercase font-black">{t('game.fest.page.top_jumps')}</h4>
              </div>
              
              <div className="space-y-2">
                 {PLAYERS.map((player, i) => (
                   <motion.div 
                     key={player.name} 
                     whileHover={{ scale: 1.02, x: 5 }}
                     className="flex items-center p-3 rounded-xl bg-black/40 border border-white/5 hover:border-pink-500/30 hover:bg-black/60 transition-all cursor-pointer group relative overflow-hidden"
                     onClick={() => setActiveModal(`player_${player.name}`)}
                   >
                     {i === 0 && <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-transparent pointer-events-none" />}
                     <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-black text-sm border shadow-sm ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50' : i === 1 ? 'bg-gray-300/20 text-gray-300 border-gray-300/50' : i === 2 ? 'bg-orange-500/20 text-orange-500 border-orange-500/50' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                        {player.rank}
                     </div>
                     <div className="flex-1 min-w-0 px-4">
                        <span className="block text-white font-bold tracking-wider truncate text-xs group-hover:text-pink-300 transition-colors">{player.name}</span>
                        <span className="block text-[9px] text-gray-500 tracking-widest uppercase mt-0.5">Model: {player.char}</span>
                     </div>
                     <span className={`text-sm tabular-nums font-black tracking-widest ${i === 0 ? 'text-yellow-500' : 'text-pink-400'}`}>
                        {player.score}<span className="text-[10px] text-gray-500 font-normal ml-1">KARMAS</span>
                     </span>
                   </motion.div>
                 ))}
              </div>
              
              <button 
                 onClick={() => setActiveModal('full_rankings')}
                 className="p-3 rounded-xl border border-white/10 bg-white/5 text-center text-[10px] text-gray-400 tracking-widest uppercase font-bold hover:text-white hover:bg-white/10 hover:border-white/20 transition-all mt-2"
              >
                {t('game.fest.page.rankings')}
              </button>
           </motion.div>

        </div>

      </div>

      {/* Global Modals overlay */}
      <AnimatePresence>
         {activeModal && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
               onClick={handleModalClose}
            >
               <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-[#0f0c29] border-2 border-pink-500/30 rounded-2xl max-w-lg w-full p-8 shadow-[0_0_50px_rgba(236,72,153,0.15)] relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(236,72,153,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none" />
                  
                  <button onClick={handleModalClose} className="absolute top-4 right-4 text-gray-500 hover:text-white bg-black/50 p-2 rounded-full border border-white/10 transition-colors z-10">
                     <X size={16} />
                  </button>

                  <div className="relative z-10 font-mono text-center">
                     {activeModal === 'sponsor_contact' && (
                        <>
                           <div className="w-16 h-16 rounded-full bg-pink-500/20 border border-pink-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                              <Mail size={32} className="text-pink-400" />
                           </div>
                           <h2 className="text-2xl font-black text-white italic uppercase tracking-widest mb-4">Partner With Us</h2>
                           <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                              Join the Cyber Fest ecosystem. Place your brand's billboards directly inside the hyper-jump experience and reach millions of cyber-runners.
                           </p>
                           <button onClick={handleModalClose} className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold tracking-[0.2em] uppercase rounded border border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all active:scale-95">
                              Request Media Packet
                           </button>
                        </>
                     )}
                     
                     {activeModal === 'sponsor_deck' && (
                        <>
                           <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                              <ExternalLink size={32} className="text-blue-400" />
                           </div>
                           <h2 className="text-2xl font-black text-white italic uppercase tracking-widest mb-4">Sponsorship Deck</h2>
                           <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                              Curious about our metrics? The Jumper.OS Engine delivers unparalleled engagement. View our interactive PDF to explore tiers, pricing, and custom integrations.
                           </p>
                           <button onClick={handleModalClose} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-[0.2em] uppercase rounded border border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all active:scale-95">
                              Download Deck .PDF
                           </button>
                        </>
                     )}

                     {activeModal === 'full_rankings' && (
                        <>
                           <div className="w-16 h-16 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                              <Trophy size={32} className="text-yellow-400" />
                           </div>
                           <h2 className="text-2xl font-black text-white italic uppercase tracking-widest mb-4">Global Network</h2>
                           <p className="text-gray-400 text-sm leading-relaxed mb-8">
                              The global leaderboard is currently compiling data from the outer rim sectors. Please check back next cycle.
                           </p>
                           <button onClick={handleModalClose} className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold tracking-[0.2em] uppercase rounded border border-zinc-600 transition-colors">
                              Close Dashboard
                           </button>
                        </>
                     )}

                     {activeModal.startsWith('player_') && (
                        <>
                           <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-500/20 to-blue-500/20 border border-white/20 flex items-center justify-center mx-auto mb-6 shadow-xl overflow-hidden relative">
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:10px_10px] bg-repeat pointer-events-none" />
                              <User size={40} className="text-white/50" />
                           </div>
                           <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">{activeModal.replace('player_', '')}</h2>
                           <div className="flex items-center justify-center gap-4 mb-8 text-xs font-bold uppercase tracking-widest">
                              <span className="text-pink-400 p-2 bg-pink-500/10 rounded border border-pink-500/20">Lv.99</span>
                              <span className="text-blue-400 p-2 bg-blue-500/10 rounded border border-blue-500/20">Elite Rank</span>
                           </div>
                           
                           <button onClick={handleModalClose} className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold tracking-[0.2em] uppercase rounded border border-white/20 transition-colors">
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

