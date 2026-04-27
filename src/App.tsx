/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { ArcadePage } from './pages/ArcadePage';
import { FestJumpPage } from './pages/FestJumpPage';
import { GeneratorPage } from './pages/GeneratorPage';
import { Footer } from './components/Footer';
import { MusicPlayer } from './components/MusicPlayer';
import { FloatingBackButton } from './components/FloatingBackButton';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function Nav() {
  const { language, setLanguage } = useLanguage();
  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 pointer-events-none">
      <Link to="/" className="pointer-events-auto font-display font-bold text-xl uppercase tracking-tighter text-white hover:text-brand-accent transition-colors flex items-center gap-2">
        <span className="w-6 h-6 bg-brand-accent rounded-sm"></span>
        Rivad
      </Link>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur-md bg-black/40 p-1.5 border border-white/5 rounded-full pointer-events-auto">
        <button onClick={() => setLanguage('es')} className={`px-3 py-1.5 rounded-full transition-all ${language === 'es' ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(242,74,41,0.3)]' : 'text-gray-500 hover:text-white'}`}>ES</button>
        <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-full transition-all ${language === 'en' ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(242,74,41,0.3)]' : 'text-gray-500 hover:text-white'}`}>EN</button>
        <button onClick={() => setLanguage('fr')} className={`px-3 py-1.5 rounded-full transition-all ${language === 'fr' ? 'text-white bg-brand-accent shadow-[0_0_15px_rgba(242,74,41,0.3)]' : 'text-gray-500 hover:text-white'}`}>FR</button>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="bg-brand-bg min-h-screen text-brand-ink selection:bg-brand-accent selection:text-[#000] flex flex-col relative overflow-x-hidden">
          <div className="noise-bg"></div>
          <Nav />
          <MusicPlayer />
          <FloatingBackButton />
          <div className="flex-1 relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/juegos" element={<ArcadePage />} />
              <Route path="/fest-jump" element={<FestJumpPage />} />
              <Route path="/oraculo" element={<GeneratorPage />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}
