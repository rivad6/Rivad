/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Footer } from './components/Footer';
import { MusicPlayer } from './components/MusicPlayer';
import { FloatingBackButton } from './components/FloatingBackButton';
import { GameInvitePopup } from './components/GameInvitePopup';
import { ScrollToTop } from './components/ScrollToTop';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AnimatePresence, motion } from 'motion/react';
import { PricingPopup } from './components/PricingPopup';
import { ErrorBoundary } from './components/ErrorBoundary';

const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const ArcadePage = React.lazy(() => import('./pages/ArcadePage').then(m => ({ default: m.ArcadePage })));
const FestJumpPage = React.lazy(() => import('./pages/FestJumpPage').then(m => ({ default: m.FestJumpPage })));
const SellOutPage = React.lazy(() => import('./pages/SellOutPage').then(m => ({ default: m.SellOutPage })));
const GeneratorPage = React.lazy(() => import('./pages/GeneratorPage').then(m => ({ default: m.GeneratorPage })));

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
      <div key={location.pathname} className="w-full h-full relative">
        <Routes location={location}>
          <Route path="/" element={
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-mono text-sm uppercase tracking-widest animate-pulse">Loading...</div>}>
                <Home />
              </Suspense>
            </motion.div>
          } />
          <Route path="/juegos" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-mono text-sm uppercase tracking-widest animate-pulse">Loading...</div>}>
                <ArcadePage />
              </Suspense>
            </motion.div>
          } />
          <Route path="/fest-jump" element={
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.5 }}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-mono text-sm uppercase tracking-widest animate-pulse">Loading...</div>}>
                <FestJumpPage />
              </Suspense>
            </motion.div>
          } />
          <Route path="/sell-out" element={
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5 }}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-mono text-sm uppercase tracking-widest animate-pulse">Loading...</div>}>
                <SellOutPage />
              </Suspense>
            </motion.div>
          } />
          <Route path="/oraculo" element={
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-mono text-sm uppercase tracking-widest animate-pulse">Loading...</div>}>
                <GeneratorPage />
              </Suspense>
            </motion.div>
          } />
        </Routes>
      </div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <BrowserRouter>
          <div className="bg-brand-bg min-h-screen text-brand-ink selection:bg-brand-accent selection:text-[#000] flex flex-col relative overflow-x-hidden">
            <div className="noise-bg"></div>
            <ScrollToTop />
            <Nav />
            <MusicPlayer />
            <FloatingBackButton />
            <GameInvitePopup />
            <PricingPopup />
            <SpeedInsights />
            <Analytics />
            <div className="flex-1 relative z-10 w-full">
              <AnimatedRoutes />
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
