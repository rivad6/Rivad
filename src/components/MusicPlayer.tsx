import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, Pause, X, Disc2, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function MusicPlayer() {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // === CONFIGURACIÓN DE TU MP3 ===
  // 1. Sube tu archivo .mp3 a la carpeta "public" en el panel izquierdo
  // 2. Cambia el nombre aquí si es necesario (ej: "/mi-cancion.mp3")
  const audioSrc = "/manual_para_la_soledad.mp3"; 
  const songTitle = "Manual Para la Soledad"; 
  const artistName = "Rivad"; 

  const spotifyLink = "https://open.spotify.com/artist/3pCE7J12cRSJoJeDBwge8Q?si=q3B-n2NJQ8SY6EX3qDkgyA";

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.volume = 0.7; // Volumen inicial decente
      console.log("Audio native element source:", audioRef.current.src);
    }
  }, []);

  const handleProgress = () => {
    if (audioRef.current && audioRef.current.buffered.length > 0) {
      const bufferedEnd = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
      const duration = audioRef.current.duration;
      if (duration > 0) {
        const progress = (bufferedEnd / duration) * 100;
        setBufferProgress(progress);
        if (progress >= 99) {
          setIsReady(true);
        }
      }
    }
  };

  const handleCanPlayThrough = () => {
    // If browser thinks it can play through, we mark as ready even if buffer math isn't exactly 100% yet
    setIsReady(true);
    setBufferProgress(100);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        // Intenta reproducir, si falla por políticas del navegador lo maneja
        audioRef.current.play().catch(e => console.error("Error al reproducir:", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 font-mono">
      {/* Audio Nativo HTML5 */}
      <audio 
        ref={audioRef} 
        src={audioSrc} 
        preload="auto" 
        crossOrigin="anonymous"
        onProgress={handleProgress}
        onCanPlayThrough={handleCanPlayThrough}
        onError={(e) => console.error("Audio error:", e)}
        onCanPlay={() => console.log("Audio can play")}
        onLoadStart={() => console.log("Audio load start")}
        onStalled={() => console.warn("Audio stalled")}
        onWaiting={() => console.warn("Audio waiting")}
      />

      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="bg-[#090b11] border border-[#222] p-4 shadow-2xl flex items-center gap-4 max-w-[300px]"
          >
            <div className="w-10 h-10 bg-[#8a63d2]/10 flex items-center justify-center text-[#8a63d2] shrink-0 text-xl">
              💿
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-medium mb-1">{t('music.label')}</p>
              <p className="text-gray-500 text-[10px] leading-tight mb-2" dangerouslySetInnerHTML={{ __html: t('music.desc', { title: songTitle, artist: artistName }) }} />
              <a href={spotifyLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#8a63d2] hover:underline">
                {t('music.spotify')} <ExternalLink size={10} />
              </a>
            </div>
            <button 
              onClick={() => setIsDismissed(true)}
              className="absolute -top-2 -right-2 bg-[#222] border border-[#444] p-1 text-gray-400 hover:text-white hover:bg-black transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {isPlaying && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-3 bg-[#090b11]/90 text-gray-300 border border-[#222] shadow-[0_0_20px_rgba(0,0,0,0.8)] backdrop-blur-md"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }}>
                <Disc2 size={16} className="text-[#8a63d2]" />
              </motion.div>
              <div className="flex flex-col text-left mr-2">
                <span className="text-[10px] leading-none text-[#8a63d2] mb-1 uppercase tracking-widest">{artistName}</span>
                <span className="text-xs leading-none text-white font-medium">{songTitle}</span>
              </div>
              <a
                href={spotifyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-white transition-colors"
                title={t('music.spotify.title')}
              >
                <ExternalLink size={14} />
              </a>
            </motion.div>
          </AnimatePresence>
        )}
        
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className={`relative group flex items-center gap-2 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-all shadow-lg backdrop-blur-md border overflow-hidden ${
            isPlaying 
              ? 'bg-[#8a63d2] text-white border-[#8a63d2]/50 shadow-[#8a63d2]/20' 
              : isReady 
                ? 'bg-[#090b11]/80 text-[#888] border-[#222] hover:border-[#8a63d2] hover:text-white'
                : 'bg-[#090b11]/40 text-[#444] border-white/5 cursor-wait'
          }`}
        >
          {/* Buffer Progress Bar */}
          {!isReady && (
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5 bg-[#8a63d2] opacity-50"
              initial={{ width: 0 }}
              animate={{ width: `${bufferProgress}%` }}
            />
          )}

          {isPlaying ? (
            <>
              <Pause size={16} />
              <span>{t('music.pause')}</span>
            </>
          ) : isReady ? (
            <>
              <Play size={16} className="text-[#8a63d2]" />
              <span>{t('music.play')}</span>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              >
                <Disc2 size={16} className="text-[#444]" />
              </motion.div>
              <span>STREAMING BUFFER {Math.round(bufferProgress)}%</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
