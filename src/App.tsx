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
import { AudioProvider } from './context/AudioContext';
import { AchievementsProvider } from './context/AchievementsContext';
import { AnimatePresence, motion } from 'motion/react';
import { PricingPopup } from './components/PricingPopup';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AchievementPopup } from './components/AchievementPopup';

import { Volume2, VolumeX, Home as HomeIcon, Gamepad2 } from 'lucide-react';
import { useAudio } from './context/AudioContext';

const HomeRoute = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const ArcadePage = React.lazy(() => import('./pages/ArcadePage').then(m => ({ default: m.ArcadePage })));
const FestJumpPage = React.lazy(() => import('./pages/FestJumpPage').then(m => ({ default: m.FestJumpPage })));
const SellOutPage = React.lazy(() => import('./pages/SellOutPage').then(m => ({ default: m.SellOutPage })));
const GeneratorPage = React.lazy(() => import('./pages/GeneratorPage').then(m => ({ default: m.GeneratorPage })));

import { ThemeSwitcher } from './components/ThemeSwitcher';

function Nav() {
  const { language, setLanguage, t } = useLanguage();
  const { isMuted, toggleMute } = useAudio();
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 py-6 pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link to="/" className="pointer-events-auto font-display font-medium text-lg sm:text-xl uppercase tracking-widest text-white hover:text-brand-accent transition-colors flex items-center gap-2 sm:gap-3">
          <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/20 flex items-center justify-center p-1 frosted-layer overflow-hidden focus:outline-none">
            <HomeIcon size={12} className="text-white" />
          </span>
          Rivad
        </Link>
        <Link to="/juegos" className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 group px-1.5 sm:px-3 py-1.5 rounded-full border border-white/10 hover:border-brand-accent/50 bg-black/20 hover:bg-brand-accent/10 transition-all">
          <Gamepad2 size={14} className="text-brand-accent group-hover:scale-110 transition-transform w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline text-[9px] sm:text-xs font-mono text-white/70 group-hover:text-white transition-colors uppercase tracking-widest whitespace-nowrap">{t('nav.minigames')}</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeSwitcher />
        <button 
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute sound" : "Mute sound"}
          className="text-gray-400 hover:text-white transition-colors pointer-events-auto p-2 frosted-layer rounded-full"
        >
          {isMuted ? <VolumeX size={13} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
        </button>
        <div className="flex items-center gap-0.5 font-mono text-[8px] sm:text-[9px] uppercase tracking-widest frosted-layer p-1 rounded-full pointer-events-auto">
          <button aria-label="Idioma Español" onClick={() => setLanguage('es')} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-500 ${language === 'es' ? 'text-white bg-brand-accent shadow-[0_0_20px_rgba(242,74,41,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>ES</button>
          <button aria-label="English Language" onClick={() => setLanguage('en')} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-500 ${language === 'en' ? 'text-white bg-brand-accent shadow-[0_0_20px_rgba(242,74,41,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>EN</button>
          <button aria-label="Langue Française" onClick={() => setLanguage('fr')} className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-500 ${language === 'fr' ? 'text-white bg-brand-accent shadow-[0_0_20px_rgba(242,74,41,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/10'}`}>FR</button>
        </div>
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
                <HomeRoute />
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

function AppContent() {
  const location = useLocation();
  const isGamePage = ['/fest-jump', '/juegos', '/sell-out', '/oraculo'].includes(location.pathname);

  return (
    <div className={`bg-brand-bg min-h-screen text-brand-ink selection:bg-brand-accent selection:text-[#000] flex flex-col relative ${isGamePage ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
      <div className="noise-bg"></div>
      <ScrollToTop />
      <div className="relative z-[10000]">
        <Nav />
      </div>
      <MusicPlayer />
      <FloatingBackButton />
      <GameInvitePopup />
      <PricingPopup />
      <AchievementPopup />
      <SpeedInsights />
      <Analytics />
      <main className="flex-1 relative z-10 w-full">
        <AnimatedRoutes />
      </main>
      {!isGamePage && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AudioProvider>
          <AchievementsProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AchievementsProvider>
        </AudioProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
