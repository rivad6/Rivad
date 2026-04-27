import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, X, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function MusicPlayer() {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);

  const songTitle = "Manual Para la Soledad"; 
  const artistName = "Rivad"; 
  const spotifyLink = "https://open.spotify.com/artist/3pCE7J12cRSJoJeDBwge8Q?si=q3B-n2NJQ8SY6EX3qDkgyA";

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 font-mono">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="bg-[#090b11]/90 backdrop-blur-xl border border-[#222] p-4 shadow-2xl flex items-center gap-4 max-w-[300px] relative"
        >
          <div className="w-10 h-10 bg-[#8a63d2]/10 flex items-center justify-center text-[#8a63d2] shrink-0 text-xl rounded-lg">
            <Music size={20} />
          </div>
          <div className="flex-1">
            <p className="text-white text-xs font-medium mb-1">{t('music.label')}</p>
            <p className="text-gray-500 text-[10px] leading-tight mb-2" dangerouslySetInnerHTML={{ __html: t('music.desc', { title: songTitle, artist: artistName }) }} />
            <div className="flex items-center gap-2 mt-2">
              <a 
                href={spotifyLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1DB954] hover:bg-[#1ed760] text-black rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors"
              >
                Listen on Spotify <ExternalLink size={10} />
              </a>
            </div>
          </div>
          <button 
            onClick={() => setIsDismissed(true)}
            className="absolute -top-2 -right-2 bg-[#222] border border-[#444] p-1 text-gray-400 hover:text-white hover:bg-black transition-colors rounded-full"
          >
            <X size={12} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
