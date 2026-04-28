import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

type SoundType = 'click' | 'hover' | 'win' | 'lose' | 'hit' | 'score' | 'purchase' | 'alert' | 'fire' | 'explosion' | 'powerup' | 'shield';

interface AudioContextType {
  playSound: (type: SoundType) => void;
  playMusic: (track: 'arcade' | 'jump' | 'none') => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicIntervalRef = useRef<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<'arcade' | 'jump' | 'none'>('none');

  useEffect(() => {
    // Load mute preference from storage
    const stored = localStorage.getItem('art-capital-muted');
    if (stored === 'true') setIsMuted(true);
  }, []);

  const initContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playSound = useCallback((type: SoundType) => {
    if (isMuted) return;
    const ctx = initContext();

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'hover':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      case 'hit':
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'score':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1); // C#
        osc.frequency.setValueAtTime(659, now + 0.2); // E
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      case 'win':
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        osc.frequency.setValueAtTime(1200, now + 0.3);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
        break;
      case 'lose':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
      case 'purchase':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'alert':
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(0, now + 0.05);
        osc.frequency.setValueAtTime(800, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      case 'fire':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'explosion':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'powerup':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(1200, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      case 'shield':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(600, now + 0.5);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
    }
  }, [isMuted]);

  const playMusic = useCallback((track: 'arcade' | 'jump' | 'none') => {
    if (musicIntervalRef.current) {
      window.clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    
    setCurrentTrack(track);

    if (track === 'none' || isMuted) {
      return;
    }

    const ctx = initContext();
    let step = 0;

    const playBeat = () => {
      if (isMuted) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (track === 'arcade') {
         // Synthwave / retro arcade simple arpeggio
         const notes = [220, 261.63, 329.63, 440, 329.63, 261.63]; // A minor arpeggio
         osc.type = 'square';
         osc.frequency.setValueAtTime(notes[step % notes.length], now);
         gainNode.gain.setValueAtTime(0.01, now);
         gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
         osc.start(now);
         osc.stop(now + 0.15);
      } else if (track === 'jump') {
         // Upbeat jump track bassline / hihat
         const isKick = step % 4 === 0;
         const isHat = step % 2 !== 0;

         if (isKick) {
             const kick = ctx.createOscillator();
             const kickGain = ctx.createGain();
             kick.connect(kickGain);
             kickGain.connect(ctx.destination);
             kick.type = 'sine';
             kick.frequency.setValueAtTime(120, now);
             kick.frequency.exponentialRampToValueAtTime(20, now + 0.2);
             kickGain.gain.setValueAtTime(0.2, now);
             kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
             kick.start(now);
             kick.stop(now + 0.3);
         }
         if (isHat) {
             osc.type = 'sawtooth';
             osc.frequency.setValueAtTime(8000, now);
             gainNode.gain.setValueAtTime(0.02, now);
             gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
             osc.start(now);
             osc.stop(now + 0.05);
         }
      }
      step++;
    };

    const intervalRate = track === 'arcade' ? 180 : 150; 
    musicIntervalRef.current = window.setInterval(playBeat, intervalRate);

  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (musicIntervalRef.current) {
        window.clearInterval(musicIntervalRef.current);
      }
    };
  }, []);

  // Re-evaluate music when mute toggles
  useEffect(() => {
    if (currentTrack !== 'none') {
      playMusic(currentTrack);
    }
  }, [isMuted, currentTrack, playMusic]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('art-capital-muted', String(next));
      return next;
    });
  }, []);

  return (
    <AudioContext.Provider value={{ playSound, playMusic, isMuted, toggleMute }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
