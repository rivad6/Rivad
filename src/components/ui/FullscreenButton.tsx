import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface FullscreenButtonProps {
  targetRef: React.RefObject<HTMLElement | null>;
  className?: string;
}

export function FullscreenButton({ targetRef, className = "" }: FullscreenButtonProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (targetRef.current) {
        if (isFs) {
          targetRef.current.classList.add('is-fullscreen');
        } else {
          targetRef.current.classList.remove('is-fullscreen');
          setIsFakeFullscreen(false);
          targetRef.current.classList.remove('!fixed', '!inset-0', '!z-[9999]', '!w-[100dvw]', '!h-[100dvh]', '!max-w-none', '!rounded-none', '!border-none', '!shadow-none');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [targetRef]);

  const toggleFullscreen = async () => {
    if (!targetRef.current) return;

    if (!document.fullscreenElement && !isFakeFullscreen) {
      if (document.documentElement.requestFullscreen) {
        try {
          await targetRef.current.requestFullscreen();
          return; // Native success
        } catch (err) {
          console.warn("Native fullscreen failed, using CSS fallback", err);
        }
      }
      setIsFakeFullscreen(true);
      targetRef.current.classList.add('is-fullscreen', '!fixed', '!inset-0', '!z-[9999]', '!w-[100dvw]', '!h-[100dvh]', '!max-w-none', '!rounded-none', '!border-none', '!shadow-none');
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        setIsFakeFullscreen(false);
        targetRef.current.classList.remove('is-fullscreen', '!fixed', '!inset-0', '!z-[9999]', '!w-[100dvw]', '!h-[100dvh]', '!max-w-none', '!rounded-none', '!border-none', '!shadow-none');
      }
    }
  };

  const active = isFullscreen || isFakeFullscreen;

  useEffect(() => {
    if (isFakeFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isFakeFullscreen]);

  return (
    <button
      onClick={toggleFullscreen}
      className={`absolute z-50 p-2 rounded-lg bg-black/40 hover:bg-black/80 text-white/70 hover:text-white backdrop-blur-md transition-all focus:outline-none shadow-lg border border-white/10 ${className}`}
      title={active ? "Exit Fullscreen" : "Fullscreen"}
    >
      {active ? <Minimize size={20} /> : <Maximize size={20} />}
    </button>
  );
}
