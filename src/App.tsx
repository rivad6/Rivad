/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { ArcadePage } from './pages/ArcadePage';
import { FestJumpPage } from './pages/FestJumpPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { Footer } from './components/Footer';
import { MusicPlayer } from './components/MusicPlayer';
import { FloatingBackButton } from './components/FloatingBackButton';
import { GameInvitePopup } from './components/GameInvitePopup';
import { ScrollToTop } from './components/ScrollToTop';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AnimatePresence, motion } from 'motion/react';

function Nav() {
  const { language, setLanguage } = useLanguage();
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 pointer-events-none">
      <Link to="/" className="pointer-events-auto font-display font-bold text-xl uppercase tracking-tighter text-white hover:text-brand-accent transition-colors flex items-center gap-2">
        <span className="w-6 h-6 bg-brand-accent rounded-sm"></span>
        Rivad
      </Link>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md bg-black/40 p-1.5 border border-white/5 rounded-full pointer-events-auto shadow-xl">
        <button onClick={() => setLanguage('es')} className={`px-3 py-1.5 rounded-full transition-all duration-300 ${language === 'es' ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(242,74,41,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>ES</button>
        <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-full transition-all duration-300 ${language === 'en' ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(242,74,41,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>EN</button>
        <button onClick={() => setLanguage('fr')} className={`px-3 py-1.5 rounded-full transition-all duration-300 ${language === 'fr' ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(242,74,41,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>FR</button>
      </div>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <Home />
          </motion.div>
        } />
        <Route path="/juegos" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <ArcadePage />
          </motion.div>
        } />
        <Route path="/fest-jump" element={
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5 }}>
            <FestJumpPage />
          </motion.div>
        } />
        <Route path="/oraculo" element={
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <GeneratorPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="bg-brand-bg min-h-screen text-brand-ink selection:bg-brand-accent selection:text-[#000] flex flex-col relative overflow-x-hidden">
          <div className="noise-bg"></div>
          <ScrollToTop />
          <Nav />
          <MusicPlayer />
          <FloatingBackButton />
          <GameInvitePopup />
          <SpeedInsights />
          <Analytics />
          <div className="flex-1 relative z-10 w-full">
            <AnimatedRoutes />
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
