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
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        setIsFakeFullscreen(false);
        if (targetRef.current) {
          targetRef.current.classList.remove('!fixed', '!inset-0', '!z-[9999]', '!w-screen', '!h-screen', '!max-w-none', '!rounded-none', '!border-none');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [targetRef]);

  const toggleFullscreen = async () => {
    if (!targetRef.current) return;

    if (!document.fullscreenElement && !isFakeFullscreen) {
      try {
        if (targetRef.current.requestFullscreen) {
          await targetRef.current.requestFullscreen();
        } else {
          throw new Error("requestFullscreen not supported");
        }
      } catch (err) {
        console.error("Native fullscreen failed, using CSS fallback:", err);
        // Fallback to CSS fullscreen
        setIsFakeFullscreen(true);
        targetRef.current.classList.add('!fixed', '!inset-0', '!z-[9999]', '!w-screen', '!h-screen', '!max-w-none', '!rounded-none', '!border-none');
      }
    } else {
      if (document.fullscreenElement) {
        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          }
        } catch (err) {
          console.error("Exit native fullscreen failed:", err);
        }
      } else if (isFakeFullscreen) {
        setIsFakeFullscreen(false);
        targetRef.current.classList.remove('!fixed', '!inset-0', '!z-[9999]', '!w-screen', '!h-screen', '!max-w-none', '!rounded-none', '!border-none');
      }
    }
  };

  const active = isFullscreen || isFakeFullscreen;

  return (
    <button
      onClick={toggleFullscreen}
      className={`absolute z-50 p-2 rounded-lg bg-black/20 hover:bg-black/60 text-white/50 hover:text-white/90 backdrop-blur-sm transition-all focus:outline-none ${className}`}
      title={active ? "Exit Fullscreen" : "Fullscreen"}
    >
      {active ? <Minimize size={18} /> : <Maximize size={18} />}
    </button>
  );
}
