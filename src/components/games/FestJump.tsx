import { useEffect, useRef, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Key, Shield, Zap, Rocket, AlertCircle, ChevronLeft, ChevronRight, Settings, Music, Target, Pause } from 'lucide-react';
import { FullscreenButton } from '../ui/FullscreenButton';

interface Character {
  id: string;
  nameKey: string;
  descKey: string;
  price: number;
  jumpForce: number;
  speed: number;
  color: string;
  accent: string;
  doubleJump?: boolean;
}

const CHARACTERS: Character[] = [
  { id: 'default', nameKey: 'RAVER', descKey: 'Standard attendee', price: 0, jumpForce: -16, speed: 25, color: '#10b981', accent: '#ec4899' },
  { id: 'punk', nameKey: 'BASSHEAD', descKey: 'Fast horizontal speed', price: 200, jumpForce: -17, speed: 35, color: '#f43f5e', accent: '#fbbf24' },
  { id: 'ghost', nameKey: 'SHUFFLER', descKey: 'Heavy but high jumps', price: 500, jumpForce: -22, speed: 20, color: '#f8fafc', accent: '#8b5cf6' },
  { id: 'cyber', nameKey: 'MAIN-DJ', descKey: 'Double jump active', price: 1000, jumpForce: -16, speed: 22, color: '#0ea5e9', accent: '#10b981', doubleJump: true },
];

export function FestJump({ isPausedGlobal = false, hideFullscreenButton = false, isFullscreen = false }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean, isFullscreen?: boolean }) {
  const { t } = useLanguage();
  const { playSound, playMusic } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [score, setScore] = useState(0);
  const scoreRefDOM = useRef<HTMLParagraphElement>(null);
  const coinsRefDOM = useRef<HTMLSpanElement>(null);
  const [hudShield, setHudShield] = useState(0);
  const [hudJetpack, setHudJetpack] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [festCoins, setFestCoins] = useState(() => Number(localStorage.getItem('fest_coins') || 0));
  const [unlockedChars, setUnlockedChars] = useState<string[]>(() => JSON.parse(localStorage.getItem('fest_chars') || '["default"]'));
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('fest_selected_char') || 'default');
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('fest_highscore') || 0));
  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('fest_upgrades');
    return saved ? JSON.parse(saved) : { magnet: 0, jump: 0, shield: 0, luck: 0 };
  });
  const [showMobileControls, setShowMobileControls] = useState(() => localStorage.getItem('fest_mobile_controls') === 'true');
  const [controlMode, setControlMode] = useState<'keyboard' | 'mouse' | null>(() => (localStorage.getItem('fest_control_mode') as any) || null);
  const [gameResult, setGameResult] = useState<{score: number, coinsEarned: number} | null>(null);
  const [gameStats, setGameStats] = useState<{earned: number, total: number, enemies: number, items: number} | null>(null);
  const keysRef = useRef({ left: false, right: false, up: false });
  const pausedRef = useRef(false);
  const isPausedRef = useRef(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    pausedRef.current = isPausedGlobal || isPaused;
    isPausedRef.current = isPausedGlobal || isPaused;
  }, [isPausedGlobal, isPaused]);

  const selectedChar = useMemo(() => CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0], [selectedCharId]);

  useEffect(() => {
    if (isPlaying) {
      playMusic('jump');
    } else {
      playMusic('none');
    }
    return () => {
      playMusic('none');
    };
  }, [isPlaying, playMusic]);

  useEffect(() => {
    localStorage.setItem('fest_coins', festCoins.toString());
    localStorage.setItem('fest_chars', JSON.stringify(unlockedChars));
    localStorage.setItem('fest_selected_char', selectedCharId);
    localStorage.setItem('fest_highscore', highScore.toString());
    localStorage.setItem('fest_mobile_controls', showMobileControls.toString());
    localStorage.setItem('fest_control_mode', controlMode || '');
    localStorage.setItem('fest_upgrades', JSON.stringify(upgrades));
  }, [festCoins, unlockedChars, selectedCharId, highScore, showMobileControls, upgrades]);

  const showMsg = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleApplyCode = () => {
    const code = codeInput.toUpperCase().trim();
    if (code === 'GODMODE') {
      showMsg('SECRET UNLOCKED: GHOST CHARACTER', 'success');
      playSound('win');
      if (!unlockedChars.includes('ghost')) setUnlockedChars(prev => [...prev, 'ghost']);
    } else {
      showMsg(t('game.fest.error'), 'error');
      playSound('alert');
    }
    setCodeInput('');
    setShowCodeInput(false);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const THEMES = [
      { score: 0, bgSolid: '#07070a', bgTop: 'rgba(236, 72, 153, 0.25)', bgBottom: 'rgba(30, 64, 175, 0.05)', gridColor: 'rgba(236, 72, 153, 0.15)', platNorm: '#ec4899', platNormDk: '#831843', platMov: '#3b82f6', platMovDk: '#1e3a8a', star: 'rgba(255,255,255,0.6)', name: 'Mainstage House', nebula: '#3b82f633', fever: '#ec4899' },
      { score: 2000, bgSolid: '#050a05', bgTop: 'rgba(34, 197, 94, 0.2)', bgBottom: 'rgba(5, 150, 105, 0.05)', gridColor: 'rgba(34, 197, 94, 0.2)', platNorm: '#22c55e', platNormDk: '#14532d', platMov: '#f97316', platMovDk: '#7c2d12', star: 'rgba(134, 239, 172, 0.6)', name: 'Forest of Trance', nebula: '#22c55e33', fever: '#22c55e' },
      { score: 5000, bgSolid: '#0d0505', bgTop: 'rgba(220, 38, 38, 0.25)', bgBottom: 'rgba(153, 27, 27, 0.05)', gridColor: 'rgba(220, 38, 38, 0.25)', platNorm: '#dc2626', platNormDk: '#7f1d1d', platMov: '#ef4444', platMovDk: '#991b1b', star: 'rgba(248, 113, 113, 0.6)', name: 'Industrial Bass', nebula: '#dc262633', fever: '#dc2626' },
      { score: 10000, bgSolid: '#08050d', bgTop: 'rgba(168, 85, 247, 0.35)', bgBottom: 'rgba(0, 0, 0, 0.05)', gridColor: 'rgba(168, 85, 247, 0.35)', platNorm: '#a855f7', platNormDk: '#581c87', platMov: '#eab308', platMovDk: '#854d0e', star: 'rgba(216, 180, 254, 0.8)', name: 'Psy-Void Peak', nebula: '#a855f733', fever: '#a855f7' }
    ];

    const getTheme = (score: number) => {
      let t = THEMES[0];
      for(const theme of THEMES) if (score >= theme.score) t = theme;
      return t;
    };

    
        let bgLasers = Array.from({ length: 8 }, () => ({
      x: Math.random() * 360,
      angle: (Math.random() - 0.5) * Math.PI / 4,
      sweepSpeed: (Math.random() * 0.02 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
      hue: Math.floor(Math.random() * 360),
      alpha: 0,
      targetAlpha: Math.random() * 0.3 + 0.1
    }));
    let bgParticles = Array.from({ length: 40 }, () => ({
      x: Math.random() * 360,
      y: Math.random() * 640,
      s: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      wobble: Math.random() * Math.PI * 2
    }));
    let lastZone = 'Neon City';
    let zoneBannerTimer = 0;

    let animationFrameId: number;
    let particles: {x: number, y: number, vx: number, vy: number, life: number, color: string, size: number}[] = [];
    let trails: {x: number, y: number, life: number, color: string}[] = [];
    let powerups: {x: number, y: number, type: 'vip' | 'merch' | 'glowstick' | 'beer' | 'magnet'}[] = [];
    let enemies: {x: number, y: number, speed: number, width: number, height: number, isBouncer?: boolean, minX?: number, maxX?: number}[] = [];
    let sessionCoins = 0;
    let floatingTexts: {x: number, y: number, text: string, alpha: number, color: string, color2: string}[] = [];
    let bullets: {x: number, y: number, vy: number}[] = [];
    
    let comboMultiplier = 1;
    let comboTimer = 0;
    let adBreakTimer = 0;
    let cameraShake = 0;
    let screenFlash = 0;

    const PLATFORM_WIDTH = 70;
    const PLATFORM_HEIGHT = 12;
    const GRAVITY = 0.38;
    
    let player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: 0,
      vy: 0,
      width: 24,
      height: 24,
      shield: upgrades.shield > 0 ? 1 : 0,
      jetpack: 0,
      magnet: 0,
      lastShot: 0,
      jumps: 0,
      tilt: 0,
    };

    const JUMP_BOOST = upgrades.jump * 0.5;
    const MAGNET_RANGE = 150 + upgrades.magnet * 50;

    let platforms = Array.from({ length: 12 }, (_, i) => {
      const height = canvas.height - (i * 90 + 20);
      return {
        x: Math.random() * (canvas.width - PLATFORM_WIDTH - 20) + 10,
        y: height,
        hasSpring: false,
        type: 'normal',
        vx: 0,
        width: PLATFORM_WIDTH,
        broken: false,
        isStepped: false,
        crackValue: 0,
        opacity: 1,
      };
    });
    platforms[0] = { x: 0, y: canvas.height - 20, hasSpring: false, type: 'normal', vx: 0, broken: false, width: canvas.width, isStepped: false, crackValue: 0, opacity: 1 };


    let cameraY = 0;
    let touchTargetX: number | null = null;
    let maxScore = 0;
    let bonusScore = 0;

          const keys = keysRef.current;
      let isShooting = false;
      let shootTimer = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (controlMode !== 'keyboard') return;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      
      if (e.key === 'ArrowUp' || e.key === ' ') {
         // Manual Jump / Double Jump logic
         if (player.jumps > 0 && player.jumps < (selectedChar.doubleJump ? 2 : 1)) {
            player.vy = (selectedChar.jumpForce - upgrades.jump * 0.6) * 0.85;
            player.jumps++;
            playSound('jump');
            createParticles(player.x + player.width/2, player.y + player.height, '#fff');
         }
         keys.up = true;
         isShooting = true;
      }
      if (e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'ArrowRight') keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (controlMode !== 'keyboard') return;
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp') {
         keys.up = false;
         isShooting = false;
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (controlMode !== 'mouse' || !e.gamma) return;
      // Gamma is left-to-right tilt in degrees [-90, 90]
      const tilt = e.gamma; 
      const deadzone = 3;
      if (Math.abs(tilt) > deadzone) {
         player.vx += tilt * 0.15;
      }
    };

    const handlePointerMove = (e: any) => {
      if (controlMode !== 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      touchTargetX = ((clientX - rect.left) / rect.width) * canvas.width;
    };

    const handlePointerDown = (e: any) => {
      if (controlMode !== 'mouse') return;
      isShooting = true;
      if (e) handlePointerMove(e);
    };
    const handlePointerUp = () => { 
      if (controlMode !== 'mouse') return;
      isShooting = false; 
      touchTargetX = null; 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('deviceorientation', handleOrientation);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    canvas.addEventListener('touchend', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);

    const createParticles = (x: number, y: number, color = '#ffffff') => {
      const pCount = color === '#ffffff' ? 12 : 8;
      for(let i=0; i<pCount; i++) {
        particles.push({
          x: x + (Math.random() - 0.5)*30, 
          y: y + (Math.random() - 0.5)*15, 
          vx: (Math.random() - 0.5)*4,
          vy: (Math.random() - 0.5)*4 - 2,
          life: 1.0 + Math.random()*0.5, 
          color,
          size: 2 + Math.random()*3
        });
      }
    };

    const addFloatingText = (x: number, y: number, text: string, color = 'white', color2 = 'black') => {
      floatingTexts.push({ x, y, text, alpha: 1, color, color2 });
    };

    const spawnEntity = (platform: any) => {
       const isAdBreak = adBreakTimer > 0;
       
       if (isAdBreak && Math.random() > 0.5) {
          powerups.push({ x: platform.x + platform.width/2 - 10, y: platform.y - 20, type: 'glowstick' });
          return;
       }

       if (maxScore > 6000 && Math.random() > 0.85) {
          // Void Core Enemy (Fast and unpredictable)
          enemies.push({
             x: platform.x, y: platform.y - 32, speed: 2.5 * (Math.random() > 0.5 ? 1 : -1), width: 28, height: 28, isBouncer: false
          });
       } else if (maxScore > 3000 && Math.random() > 0.9) {
          // Crimson Zone Enemy (Bouncer)
          enemies.push({
             x: platform.x, y: platform.y - 32, speed: 1.5 * (Math.random() > 0.5 ? 1 : -1), width: 32, height: 32, isBouncer: true, minX: platform.x, maxX: platform.x + platform.width - 32
          });
       } else if (maxScore > 1000 && Math.random() > 0.93) {
          // Cyber Slums Enemy (Basic)
          enemies.push({
             x: platform.x, y: platform.y - 32, speed: 1.0 * (Math.random() > 0.5 ? 1 : -1), width: 32, height: 32, isBouncer: false
          });
       } else {
          const rand = Math.random();
          if (rand > 0.98) powerups.push({ x: platform.x + 10, y: platform.y - 20, type: 'vip' });
          else if (rand > 0.95) powerups.push({ x: platform.x + 10, y: platform.y - 20, type: 'merch' });
          else if (rand > 0.92) powerups.push({ x: platform.x + 10, y: platform.y - 20, type: 'magnet' });
          else if (rand > 0.90) powerups.push({ x: platform.x + 10, y: platform.y - 20, type: 'beer' });
          else if (rand > 0.70) powerups.push({ x: platform.x + platform.width/2 - 5, y: platform.y - 15, type: 'glowstick' });
       }
    };

    let gameState: 'ready' | 'playing' | 'gameover' = 'ready';
    let readyTimer = 120; // 2 seconds at 60fps

        const drawPlayer = (x, y) => {
      ctx.save();
      if (cameraShake > 0) ctx.translate(Math.random()*cameraShake - cameraShake/2, Math.random()*cameraShake - cameraShake/2);
      
      const charX = x;
      const charY = y;
      const pWidth = player.width;
      const pHeight = player.height;

      // Professional Squash and Stretch (Subtle & Centered)
      const stretch = Math.max(-0.15, Math.min(0.15, player.vy * 0.006));
      const scaleX = 1 - stretch;
      const scaleY = 1 + stretch;
      
      // Minimal tilt logic to prevent visual jitter
      const targetTilt = 0; // Completely disable tilt for maximum stability perception
      const tiltLerp = 0.1;
      player.tilt = (player.tilt || 0) + (targetTilt - (player.tilt || 0)) * tiltLerp;

      ctx.translate(charX + pWidth/2, charY + pHeight/2);
      ctx.rotate(player.tilt);
      ctx.scale(scaleX, scaleY);
      ctx.translate(-(charX + pWidth/2), -(charY + pHeight/2));

      // 1. Shadow / Glow Base
      ctx.shadowBlur = 15;
      ctx.shadowColor = selectedChar.accent;
      
      // 2. Character Render
      if (selectedChar.id === 'ghost') {
         // --- SHUFFLER (Ghostly Neon) ---
         // Body with a glass/ghostly feel
         const bodyGrad = ctx.createLinearGradient(charX, charY, charX, charY + pHeight);
         bodyGrad.addColorStop(0, '#f8fafc');
         bodyGrad.addColorStop(1, '#94a3b8');
         ctx.fillStyle = bodyGrad;
         ctx.beginPath();
         ctx.roundRect(charX, charY, pWidth, pHeight, [16, 16, 4, 4]); 
         ctx.fill();
         
         // Glowing Core
         ctx.fillStyle = selectedChar.accent;
         ctx.shadowBlur = 20;
         ctx.beginPath();
         ctx.arc(charX + pWidth/2, charY + pHeight/2 + 2, 6, 0, Math.PI*2);
         ctx.fill();
         
         // Digital Eyes
         ctx.shadowBlur = 0;
         ctx.fillStyle = '#0f172a';
         ctx.fillRect(charX + 6, charY + 10, 4, 4);
         ctx.fillRect(charX + pWidth - 10, charY + 10, 4, 4);

         // Animated Plasma Trail
         ctx.globalAlpha = 0.4;
         ctx.fillStyle = selectedChar.color;
         for(let i=0; i<4; i++) {
            const off = Math.sin(Date.now()*0.01 + i) * 8;
            ctx.beginPath();
            ctx.arc(charX + pWidth/2 + off, charY + pHeight + 2 + i*10, 8 - i*2, 0, Math.PI*2);
            ctx.fill();
         }
         ctx.globalAlpha = 1.0;
         
      } else if (selectedChar.id === 'punk') {
         // --- BASSHEAD (Industrial Cyber) ---
         ctx.fillStyle = '#0f172a';
         ctx.beginPath();
         ctx.roundRect(charX, charY, pWidth, pHeight, 4);
         ctx.fill();
         
         // Metal Plates
         ctx.strokeStyle = '#334155';
         ctx.lineWidth = 1;
         ctx.strokeRect(charX + 2, charY + 2, pWidth - 4, pHeight - 4);

         // Subwoofer pulse
         const pulse = 2 + Math.sin(Date.now() * 0.02) * 3;
         ctx.fillStyle = '#000';
         ctx.beginPath();
         ctx.arc(charX + pWidth/2, charY + pHeight/2 + 5, 8, 0, Math.PI*2);
         ctx.fill();
         
         ctx.strokeStyle = selectedChar.accent;
         ctx.shadowBlur = 10;
         ctx.shadowColor = selectedChar.accent;
         ctx.lineWidth = 2;
         ctx.beginPath();
         ctx.arc(charX + pWidth/2, charY + pHeight/2 + 5, 6 + pulse, 0, Math.PI*2);
         ctx.stroke();
         ctx.shadowBlur = 0;
         
         // Technical Mohawk
         ctx.fillStyle = selectedChar.accent;
         for (let i=0; i<4; i++) {
            const h = 10 + Math.sin(Date.now()*0.02 + i)*4;
            ctx.fillRect(charX + 4 + i*6, charY - h, 3, h);
         }
         
      } else if (selectedChar.id === 'cyber') {
         // --- MAIN-DJ (Holo-Deck) ---
         // Clear Acrylic Body
         ctx.strokeStyle = 'rgba(255,255,255,0.5)';
         ctx.lineWidth = 1;
         ctx.strokeRect(charX, charY, pWidth, pHeight);
         
         ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
         ctx.fillRect(charX + 1, charY + 1, pWidth - 2, pHeight - 2);
         
         // Internal Circuits
         ctx.strokeStyle = selectedChar.color;
         ctx.globalAlpha = 0.3;
         ctx.beginPath();
         ctx.moveTo(charX + 5, charY + 5); ctx.lineTo(charX + 15, charY + 15);
         ctx.moveTo(charX + pWidth - 5, charY + 5); ctx.lineTo(charX + pWidth - 15, charY + 15);
         ctx.stroke();
         ctx.globalAlpha = 1.0;

         // DJ Controller (Premium Detail)
         ctx.fillStyle = '#1e293b';
         ctx.beginPath();
         ctx.roundRect(charX - 10, charY + pHeight + 2, pWidth + 20, 10, 4);
         ctx.fill();
         ctx.strokeStyle = selectedChar.color;
         ctx.stroke();
         
         const spin = Date.now() * 0.01;
         ctx.fillStyle = '#000';
         ctx.beginPath(); ctx.arc(charX - 3, charY + pHeight + 7, 3, 0, Math.PI*2); ctx.fill();
         ctx.beginPath(); ctx.arc(charX + pWidth + 3, charY + pHeight + 7, 3, 0, Math.PI*2); ctx.fill();
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 1;
         ctx.beginPath(); ctx.arc(charX - 3, charY + pHeight + 7, 3, spin, spin + 1); ctx.stroke();
         ctx.beginPath(); ctx.arc(charX + pWidth + 3, charY + pHeight + 7, 3, -spin, -spin + 1); ctx.stroke();

         // Equalizer bars (Animated)
         const t = Date.now() * 0.015;
         const eqCols = ['#f43f5e', '#a855f7', '#0ea5e9', '#10b981'];
         for (let i = 0; i < 4; i++) {
           ctx.fillStyle = eqCols[i];
           const h = 6 + Math.abs(Math.sin(t + i*0.8)*12);
           ctx.fillRect(charX + 4 + (i*6), charY + pHeight - 4 - h, 4, h);
         }

         // Floating Headset
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.arc(charX + pWidth/2, charY - 2, 18, Math.PI, 0);
         ctx.stroke();
         ctx.fillStyle = selectedChar.color;
         ctx.shadowBlur = 10;
         ctx.shadowColor = selectedChar.color;
         ctx.fillRect(charX - 6, charY - 8, 4, 8);
         ctx.fillRect(charX + pWidth + 2, charY - 8, 4, 8);
         ctx.shadowBlur = 0;

      } else {
         // --- RAVER (Elite Cyberpunk) ---
         const rGrad = ctx.createLinearGradient(charX, charY, charX + pWidth, charY + pHeight);
         rGrad.addColorStop(0, '#1e293b');
         rGrad.addColorStop(1, '#0f172a');
         ctx.fillStyle = rGrad;
         ctx.beginPath();
         ctx.roundRect(charX, charY, pWidth, pHeight, 8);
         ctx.fill();
         
         // Glowing Jacket Lines
         ctx.strokeStyle = selectedChar.color;
         ctx.lineWidth = 1;
         ctx.beginPath();
         ctx.moveTo(charX + 4, charY + pHeight*0.4); ctx.lineTo(charX + 4, charY + pHeight - 4);
         ctx.moveTo(charX + pWidth - 4, charY + pHeight*0.4); ctx.lineTo(charX + pWidth - 4, charY + pHeight - 4);
         ctx.stroke();

         // High-End Visor
         ctx.fillStyle = '#000';
         ctx.fillRect(charX + 2, charY + 6, pWidth - 4, 10);
         
         const visorGrad = ctx.createLinearGradient(charX + 4, 0, charX + pWidth - 4, 0);
         visorGrad.addColorStop(0, selectedChar.color);
         visorGrad.addColorStop(0.5, '#fff');
         visorGrad.addColorStop(1, selectedChar.accent);
         ctx.fillStyle = visorGrad;
         ctx.shadowBlur = 15;
         ctx.shadowColor = selectedChar.accent;
         ctx.fillRect(charX + 4, charY + 10, pWidth - 8, 2);
         ctx.shadowBlur = 0;

         // Neon glowsticks
         if (player.vy < 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = selectedChar.color;
            ctx.strokeStyle = selectedChar.color;
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(charX - 2, charY + 15); ctx.lineTo(charX - 10, charY + 2); ctx.stroke();
            
            ctx.shadowColor = selectedChar.accent;
            ctx.strokeStyle = selectedChar.accent;
            ctx.beginPath(); ctx.moveTo(charX + pWidth + 2, charY + 15); ctx.lineTo(charX + pWidth + 10, charY + 2); ctx.stroke();
            ctx.shadowBlur = 0;
         }
      }

      if (player.shield > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2 + Math.sin(Date.now()*0.01);
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        ctx.arc(x + player.width/2, y + player.height/2, 28 + Math.sin(Date.now()*0.01)*2, 0, Math.PI*2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (player.jetpack > 0) {
        createParticles(x + player.width/2, y + player.height, '#f59e0b');
        ctx.fillStyle = '#f59e0b';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#f59e0b';
        ctx.fillRect(charX - 4, charY + pHeight/2 + 4, 6, pHeight/2);
        ctx.fillRect(charX + pWidth - 2, charY + pHeight/2 + 4, 6, pHeight/2);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    const update = (dt: number) => {
      if (isPausedGlobal || pausedRef.current || isPausedRef.current) return;
      const normalDt = dt / 16.666;
      
      if (shootTimer > 0) shootTimer -= normalDt;
      if (isShooting && shootTimer <= 0) {
         bullets.push({ x: player.x + player.width/2, y: player.y, vy: 15 });
         shootTimer = 10;
      }
      if (gameState === 'ready') {
        readyTimer -= normalDt;
        if (readyTimer <= 0) gameState = 'playing';
        return;
      }
      
      if (cameraShake > 0) cameraShake *= Math.pow(0.9, normalDt);

      const currentTheme = getTheme(maxScore);
      if (currentTheme.name !== lastZone) {
         lastZone = currentTheme.name;
         zoneBannerTimer = 200; // frames
         playSound('win');
      }
      if (zoneBannerTimer > 0) zoneBannerTimer -= normalDt;

      
      // -= NEW UPDATE LOGIC =-
      if (adBreakTimer > 0) {
         adBreakTimer -= normalDt;
         if (Math.random() < 0.05) {
            sessionCoins += 1; if (coinsRefDOM.current) coinsRefDOM.current.innerText = (festCoins + sessionCoins) + ' KARMAS';
            bonusScore += 50;
            addFloatingText(player.x + (Math.random()-0.5)*200, player.y - Math.random()*200, t('game.fest.text.sponsor_reward'), '#10b981');
         }
      }

      // Physics
      const prevY = player.y;
      player.vy += GRAVITY * normalDt;
      
      // Variable Jump Height: Damping if button released early
      if (player.vy < 0 && !keys.up && !isShooting && player.jetpack <= 0) {
         player.vy += GRAVITY * 1.5 * normalDt;
      }

      player.x += player.vx * normalDt;
      player.y += player.vy * normalDt;
      
      // Screen Wrap
      if (player.x < -player.width) player.x = canvas.width;
      if (player.x > canvas.width) player.x = -player.width;
      
            // Jetpack & Controls
      if (player.jetpack > 0) {
         player.jetpack -= normalDt;
         player.vy = -18 - upgrades.jump * 1.5;
         createParticles(player.x + player.width/2, player.y + player.height, '#f43f5e');
         setHudJetpack(Math.floor(player.jetpack));
      } else {
         const maxSpeed = selectedChar.speed + upgrades.luck * 0.2; 
         
         // Only use mouse tracking if in mouse mode AND we have a target
         if (controlMode === 'mouse' && touchTargetX !== null) {
            let diff = touchTargetX - (player.x + player.width/2);
            
            // Shortest path around screen wrap
            if (diff > canvas.width / 2) diff -= canvas.width;
            if (diff < -canvas.width / 2) diff += canvas.width;
 
            // Stabilized Mouse/Touch movement
            const deadzone = 10; 
            if (Math.abs(diff) > deadzone) {
               const speedScale = Math.min(1, Math.abs(diff) / 50);
               const targetVx = Math.sign(diff) * maxSpeed * speedScale;
               const responsiveness = 0.35; 
               player.vx += (targetVx - player.vx) * responsiveness * normalDt;
            } else {
               player.vx *= Math.pow(0.15, normalDt); 
            }
         } else if (controlMode === 'keyboard') {
            // Smoother keyboard movement
            let targetVx = 0;
            if (keys.left) targetVx = -maxSpeed;
            if (keys.right) targetVx = maxSpeed;
            
            const accel = targetVx !== 0 ? 0.35 : 0.12;
            player.vx += (targetVx - player.vx) * accel * normalDt;
         } else {
            // Natural deceleration if no input/wrong mode
            player.vx *= Math.pow(0.85, normalDt);
         }
         
         // Global momentum friction to prevent jitter
         player.vx *= Math.pow(0.99, normalDt);

         // Hard cap speed
         const hardCap = maxSpeed * 1.4;
         if (player.vx > hardCap) player.vx = hardCap;
         if (player.vx < -hardCap) player.vx = -hardCap;
      }
      
      // Camera Follow
      if (player.y < canvas.height / 2) {
         const diff = (canvas.height / 2) - player.y;
         cameraY += diff;
         player.y = canvas.height / 2;
         maxScore += diff * 0.1;
         
         
         platforms.forEach(p => p.y += diff);
         enemies.forEach(e => e.y += diff);
         powerups.forEach(pw => pw.y += diff);
         floatingTexts.forEach(ft => ft.y += diff);
         bullets.forEach(b => b.y += diff);
                  bgParticles.forEach(p => {
            p.y += diff * p.speed;
            if (p.y > canvas.height) { p.y -= canvas.height; p.x = Math.random() * canvas.width; }
         });
         bgLasers.forEach(l => {
            if (Math.random() < 0.01) l.targetAlpha = Math.random() * 0.4;
            l.alpha += (l.targetAlpha - l.alpha) * 0.05;
            l.angle += l.sweepSpeed;
            if (l.angle > Math.PI/3 || l.angle < -Math.PI/3) l.sweepSpeed *= -1;
         });

      }
      
      // Platform Generation
      let highestPlatY = platforms.reduce((min, p) => p.y < min ? p.y : min, canvas.height);
      
      while (highestPlatY > -50) {
          const jumpBonus = upgrades.jump * 0.8;
          const jumpF = Math.abs(selectedChar.jumpForce - jumpBonus);
          const maxHeight = (jumpF * jumpF) / (2 * GRAVITY);
          const safeDistY = Math.min(maxHeight * 0.55, 150); 
          
          const gapY = 40 + Math.random() * (safeDistY - 45);
          highestPlatY -= gapY;
          
          const lastPlat = platforms[platforms.length - 1];
          let newX = Math.random() * (canvas.width - PLATFORM_WIDTH);
          
          // Ensure horizontal reachability
          if (lastPlat) {
             const maxHorizontal = 160;
             const minX = Math.max(10, lastPlat.x - maxHorizontal);
             const maxX = Math.min(canvas.width - PLATFORM_WIDTH - 10, lastPlat.x + maxHorizontal);
             newX = minX + Math.random() * (maxX - minX);
          }

          const newP = {
              x: newX,
              y: highestPlatY,
              width: PLATFORM_WIDTH,
              hasSpring: Math.random() > 0.92,
              type: Math.random() > 0.88 ? 'moving' : (Math.random() > 0.92 ? 'breaking' : 'normal'),
              vx: Math.random() > 0.5 ? 2 + Math.random()*2 : -2 - Math.random()*2,
              broken: false,
              isStepped: false,
              crackValue: 0,
              opacity: 1
          };
          
          if (adBreakTimer > 0) {
              newP.type = 'normal';
              newP.width = PLATFORM_WIDTH * 1.8;
          } else if (Math.random() > 0.96 && maxScore > 1000) {
              newP.type = 'billboard';
              newP.width = 110;
          } else if (Math.random() > 0.97) {
              newP.type = 'boost';
          }
          
          platforms.push(newP);
          if (newP.type !== 'breaking' && newP.type !== 'billboard') spawnEntity(newP);
      }
      
      // Manage Platforms
      for (let i = platforms.length - 1; i >= 0; i--) {
         const p = platforms[i];
         if (p.broken) {
            p.opacity -= 0.1 * normalDt;
            if (p.opacity <= 0) { platforms.splice(i, 1); continue; }
            continue;
         }
         
         if (p.type === 'moving') {
            p.x += p.vx * normalDt;
            if (p.x < 0 || p.x + p.width > canvas.width) p.vx *= -1;
         }
         
         // ULTRA-ROBUST COLLISION CHECK
         const collisionOffsets = [0, -canvas.width, canvas.width];
         let collided = false;

         if (player.vy > 0) {
            const playerBottom = player.y + player.height;
            const prevBottom = prevY + player.height;
            
            // Allow checking if the player crossed the platform bound or is resting on it.
            if (prevBottom <= p.y + 20 && playerBottom >= p.y - 5 && playerBottom <= p.y + Math.max(PLATFORM_HEIGHT, player.vy * normalDt + 15)) {
               for (const offset of collisionOffsets) {
                  const px = player.x + offset;
                  // The player's rect must overlap the platform's rect horizontally. 
                  // Being exactly on the corner (0 pixels) might slip, so we allow 2-4px edge tolerance.
                  const horizontalMatch = px + player.width > p.x - 4 && px < p.x + p.width + 4;
                  
                  if (horizontalMatch) {
                      collided = true;
                      break;
                  }
               }
            }
         }
         
         if (collided) {
            if (p.type === 'breaking') {
                p.broken = true;
                playSound('hit');
                createParticles(p.x + p.width/2, p.y, '#9ca3af');
                // Do NOT snap or bounce. Just let player fall through.
            } else {
                // Snap player precisely to top of platform
                player.y = p.y - player.height;
                if (p.type === 'boost') {
                    player.vy = selectedChar.jumpForce * 1.5 - upgrades.jump;
                    player.jumps = 1;
                    playSound('bounce');
                    createParticles(p.x + p.width/2, p.y, '#eab308');
                    cameraShake = 15;
                } else {
                    player.vy = selectedChar.jumpForce - upgrades.jump * 0.5;
                    player.jumps = 1;
                    if (p.hasSpring) {
                       player.vy *= 1.5;
                       playSound('bounce');
                       createParticles(p.x + p.width/2, p.y, '#f43f5e');
                    } else {
                       playSound('jump');
                    }
                }
                
                if (!p.isStepped) {
                   p.isStepped = true;
                   if (p.type === 'billboard' && comboTimer <= 0) {
                      comboTimer = 180;
                      comboMultiplier = 2;
                      sessionCoins += 5; if (coinsRefDOM.current) coinsRefDOM.current.innerText = (festCoins + sessionCoins) + ' KARMAS';
                      addFloatingText(p.x, p.y - 20, 'SPONSOR HIT!', '#3b82f6');
                   } else {
                      bonusScore += 10 * comboMultiplier;
                   }
                }
            }
         }
         
         if (p.y > canvas.height + 150) platforms.splice(i, 1);
      }
      
      // Enemies
      for (let i = enemies.length - 1; i >= 0; i--) {
         const en = enemies[i];
         en.x += en.speed * normalDt;
         if (en.isBouncer) {
            if (en.x < (en.minX || 0) || en.x > (en.maxX || canvas.width)) en.speed *= -1;
         } else {
            if (en.x < -en.width) en.x = canvas.width;
            if (en.x > canvas.width) en.x = -en.width;
         }
         
         if (en.y > canvas.height + 150) { enemies.splice(i, 1); continue; }
         
         // Touch enemy with Wrap Support
         let hit = false;
         for (const offset of [0, -canvas.width, canvas.width]) {
            const px = player.x + offset;
            if (px < en.x + en.width && px + player.width > en.x && player.y < en.y + 20 && player.y + player.height > en.y) {
               hit = true;
               break;
            }
         }

         if (hit) {
            if (player.vy > 0 && player.y + player.height < en.y + 15) {
                enemies.splice(i, 1);
                player.vy = selectedChar.jumpForce;
                bonusScore += 200;
                sessionCoins += 2; if (coinsRefDOM.current) coinsRefDOM.current.innerText = (festCoins + sessionCoins) + ' KARMAS';
                playSound('score');
                createParticles(en.x + en.width/2, en.y, '#10b981');
                addFloatingText(en.x, en.y, '+200', '#10b981');
            } else if (!player.jetpack) {
                if (player.shield > 0) {
                    player.shield = 0;
                    setHudShield(0);
                    enemies.splice(i, 1);
                    playSound('alert');
                    screenFlash = 1;
                    cameraShake = 20;
                } else {
                    playSound('lose');
                    const finalScore = Math.floor(maxScore) + bonusScore;
                    setScore(finalScore);
                    const earnedCoins = sessionCoins + Math.floor(finalScore / 50);
                    setFestCoins(prev => prev + earnedCoins);
                    if (finalScore > highScore) setHighScore(finalScore);
                    setGameResult({ score: finalScore, coinsEarned: earnedCoins });
                    setIsPlaying(false);
                    return; // Exit loop since game ended
                }
            }
         }
      }
      
      // Powerups
      for (let i = powerups.length - 1; i >= 0; i--) {
         const pw = powerups[i];
         if (pw.y > canvas.height + 150) { powerups.splice(i, 1); continue; }
         
         if (pw.type === 'magnet' || upgrades.magnet > 0) {
            const dist = Math.hypot(player.x - pw.x, player.y - pw.y);
            if (dist < MAGNET_RANGE) {
               pw.x += (player.x - pw.x) / dist * 10 * normalDt;
               pw.y += (player.y - pw.y) / dist * 10 * normalDt;
            }
         }
         
         // Collect with Wrap Support
         let collected = false;
         for (const offset of [0, -canvas.width, canvas.width]) {
            const px = player.x + offset;
            if (px < pw.x + 25 && px + player.width > pw.x - 5 && player.y < pw.y + 25 && player.y + player.height > pw.y - 5) {
               collected = true;
               break;
            }
         }

         if (collected) {
            powerups.splice(i, 1);
            if (pw.type === 'vip') {
               sessionCoins += 50; if (coinsRefDOM.current) coinsRefDOM.current.innerText = (festCoins + sessionCoins) + ' KARMAS';
               bonusScore += 500;
               playSound('win');
               adBreakTimer = 400; 
               cameraShake = 20;
               screenFlash = 0.5;
            } else if (pw.type === 'merch') {
               player.shield = 1;
               setHudShield(1);
               playSound('powerup');
               addFloatingText(pw.x, pw.y, 'SHIELD', '#3b82f6');
            } else if (pw.type === 'glowstick') {
               sessionCoins += 5; if (coinsRefDOM.current) coinsRefDOM.current.innerText = (festCoins + sessionCoins) + ' KARMAS';
               playSound('score');
            } else if (pw.type === 'beer') {
               player.jetpack = 200;
               playSound('start');
               cameraShake = 10;
            } else if (pw.type === 'magnet') {
               player.magnet = 300;
               playSound('powerup');
            }
         }
      }
      
      // Combo & HUD Updates
      if (comboTimer > 0) {
         comboTimer -= normalDt;
         if (comboTimer <= 0) comboMultiplier = 1;
      }
      
      if (player.y > canvas.height) {
         playSound('lose');
         const finalScore = Math.floor(maxScore) + bonusScore;
         setScore(finalScore);
         const earnedCoins = sessionCoins + Math.floor(finalScore / 50);
         setFestCoins(prev => prev + earnedCoins);
         if (finalScore > highScore) setHighScore(finalScore);
         setGameResult({ score: finalScore, coinsEarned: earnedCoins });
         setIsPlaying(false);
      }
      
            // --- UPDATE PARTICLES, TRAILS AND BULLETS ---
      for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx * normalDt;
          p.y += p.vy * normalDt;
          p.vy += 0.1 * normalDt;
          p.life -= 0.02 * normalDt;
          if (p.life <= 0) particles.splice(i, 1);
      }
      for (let i = trails.length - 1; i >= 0; i--) {
          const tr = trails[i];
          tr.life -= 0.05 * normalDt;
          if (tr.life <= 0) trails.splice(i, 1);
      }
      for (let i = bullets.length - 1; i >= 0; i--) {
         const b = bullets[i];
         b.y -= b.vy * normalDt;
         if (b.y < -50) { bullets.splice(i, 1); continue; }
         for (let ei = enemies.length - 1; ei >= 0; ei--) {
             const en = enemies[ei];
             if (b.x > en.x && b.x < en.x + en.width && b.y > en.y && b.y < en.y + en.width) {
                 enemies.splice(ei, 1);
                 bullets.splice(i, 1);
                 bonusScore += 100;
                 createParticles(en.x + en.width/2, en.y, '#f59e0b');
                 playSound('hit');
                 break;
             }
         }
      }
      // ------------------------------------------
      
      if (scoreRefDOM.current) scoreRefDOM.current.innerText = Math.floor(Math.floor(maxScore) + bonusScore).toString();
    };

        const draw = (dt) => {
      const normalDt = dt / 16.666;
      const theme = getTheme(maxScore);

      // --- NEW BACKGROUND LOGIC ---
      ctx.fillStyle = theme.bgSolid;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 1. Core Background
      const bgLayer = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgLayer.addColorStop(0, theme.bgSolid);
      bgLayer.addColorStop(1, '#020617');
      ctx.fillStyle = bgLayer;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Nebula / Pulse Effect
      const time = Date.now() * 0.001;
      const nebulaGrad = ctx.createRadialGradient(
        canvas.width/2 + Math.sin(time*0.5) * 50, canvas.height/2 + Math.cos(time*0.5) * 50, 0,
        canvas.width/2, canvas.height/2, canvas.height
      );
      nebulaGrad.addColorStop(0, (theme as any).nebula || 'rgba(59, 130, 246, 0.1)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';

      // 3. High-Tech Background Grid
      const gridY = cameraY % 60;
      ctx.strokeStyle = theme.gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < canvas.width; i += 60) {
         ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height);
      }
      for (let j = 0; j < canvas.height + 60; j += 60) {
         ctx.moveTo(0, j + gridY); ctx.lineTo(canvas.width, j + gridY);
      }
      ctx.stroke();

      // 4. Background Stars (Parallax & Depth)

      // 3. Depth Fog / Aurora
      const auroraGrad = ctx.createRadialGradient(
        canvas.width/2, canvas.height, 10,
        canvas.width/2, canvas.height, canvas.height
      );
      auroraGrad.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 4. Background Stars (Parallax)
      bgParticles.forEach(p => {
         p.wobble += 0.02;
         ctx.fillStyle = theme.star;
         ctx.beginPath();
         // Deep Parallax with scale based on speed
         const sizeMult = p.s * (1 + Math.abs(player.vy) * 0.05);
         ctx.arc(p.x + Math.sin(p.wobble)*5, p.y, p.s, 0, Math.PI*2);
         ctx.fill();
         
         // Motion streak for faster particles
         if (Math.abs(player.vy) > 10) {
            ctx.strokeStyle = theme.star;
            ctx.lineWidth = p.s;
            ctx.beginPath();
            ctx.moveTo(p.x + Math.sin(p.wobble)*5, p.y);
            ctx.lineTo(p.x + Math.sin(p.wobble)*5, p.y + player.vy * 0.5);
            ctx.stroke();
         }
      });

      // Render Crowd at the bottom of the screen always
      ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
      ctx.beginPath();
      const timeOffset = Date.now() * 0.005;
      for (let ix = 0; ix <= canvas.width + 10; ix += 10) {
         const crowdBounce = Math.sin(timeOffset + ix * 0.1) * 8 * Math.min(1.5, comboMultiplier / 2);
         const crowdHeight = 40 + Math.sin(ix * 0.5) * 10 + crowdBounce;
         if (ix === 0) ctx.moveTo(0, canvas.height);
         ctx.lineTo(ix, canvas.height - crowdHeight);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();

      // Occasional glow sticks in crowd
      for (let ix = 20; ix < canvas.width; ix += 40) {
         if (Math.sin(timeOffset * 0.5 + ix) > 0.4) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = theme.platMov;
            ctx.strokeStyle = theme.platMov;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const glowY = canvas.height - 35 + Math.sin(timeOffset * 2 + ix) * 10;
            const glowX = ix + Math.cos(timeOffset * 2 + ix) * 5;
            ctx.moveTo(ix, canvas.height - 15);
            ctx.lineTo(glowX, glowY);
            ctx.stroke();
            ctx.shadowBlur = 0;
         }
      }

      // Background Lasers
      ctx.globalCompositeOperation = 'screen';
      bgLasers.forEach(l => {
         if (l.alpha < 0.01) return;
         ctx.save();
         ctx.translate(l.x, canvas.height); // Lasers shoot up from bottom
         ctx.rotate(l.angle);
         
         const grd = ctx.createLinearGradient(0, 0, 0, -canvas.height * 1.5);
         grd.addColorStop(0, 'hsla(' + l.hue + ', 100%, 60%, ' + l.alpha + ')');
         grd.addColorStop(1, 'hsla(' + l.hue + ', 100%, 60%, 0)');
         
         ctx.fillStyle = grd;
         ctx.beginPath();
         // Laser beam shape, wide at bottom narrow at top
         ctx.moveTo(-15, 0);
         ctx.lineTo(15, 0);
         ctx.lineTo(3, -canvas.height * 1.5);
         ctx.lineTo(-3, -canvas.height * 1.5);
         ctx.fill();
         
         ctx.restore();
      });
      ctx.globalCompositeOperation = 'source-over';

      if (adBreakTimer > 0) {
         ctx.fillStyle = `rgba(16, 185, 129, ${(adBreakTimer / 400) * 0.1})`;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.save();
         ctx.fillStyle = 'rgba(0,0,0,0.5)';
         ctx.fillRect(0, 20, canvas.width, 30);
         ctx.fillStyle = `rgba(16, 185, 129, ${(adBreakTimer / 400)})`;
         ctx.font = 'bold 16px monospace';
         ctx.textAlign = 'center';
         const flash = Math.floor(Date.now() / 150) % 2 === 0;
         if (flash) ctx.fillText('⚡ EVENT TAKEOVER ⚡', canvas.width/2, 40);
         const tOffset = Date.now() * 0.003;
         for(let k=0; k<12; k++) {
            const bx = (canvas.width / 2) + Math.sin(tOffset + k * 1.5) * canvas.width*0.4 * Math.cos(k);
            const by = (cameraY % canvas.height) + Math.cos(tOffset * 0.5 + k * 2) * canvas.height*2;
            const actualY = ((by % canvas.height) + canvas.height) % canvas.height;
            ctx.fillStyle = k%2==0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.2)';
            ctx.fillRect(bx, actualY, 4, 12);
         }
         ctx.restore();
      }
      // -----------------------------

      platforms.forEach(p => {
        if (p.broken) return;

        // Player Shadow Projection
        if (player.x + player.width > p.x && player.x < p.x + p.width && player.y < p.y) {
           const dist = p.y - (player.y + player.height);
           const intensity = Math.max(0, 1 - dist / 200);
           if (intensity > 0) {
              ctx.fillStyle = `rgba(0,0,0,${intensity * 0.5})`;
              ctx.beginPath();
              ctx.ellipse(player.x + player.width/2, p.y + 1, (player.width / 2) * intensity, 2, 0, 0, Math.PI * 2);
              ctx.fill();
           }
        }
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.type === 'breaking' ? '#ef4444' : p.type === 'boost' ? '#eab308' : (p.type === 'moving' ? theme.platMov : theme.platNorm);

        if (p.type === 'billboard') {
             ctx.fillStyle = '#0f172a'; 
             ctx.beginPath();
             ctx.roundRect(p.x, p.y - 40, p.width, 40 + PLATFORM_HEIGHT, 4);
             ctx.fill();
             ctx.strokeStyle = '#ec4899';
             ctx.lineWidth = 2;
             ctx.stroke();
             ctx.shadowBlur = 0;
             ctx.fillStyle = '#ec4899';
             ctx.font = 'bold 12px monospace';
             const brands = ['CYBER-COLA', 'SNEAKER CORP', 'SISYPHUS TECH', 'NEON GEAR', 'BY RIVAD'];
             const idx = Math.floor(Math.abs(p.y) % brands.length);
             ctx.fillText(brands[idx], p.x + 10, p.y - 15);
             
             ctx.fillStyle = '#334155';
             ctx.fillRect(p.x + 10, p.y, 4, PLATFORM_HEIGHT);
             ctx.fillRect(p.x + p.width - 14, p.y, 4, PLATFORM_HEIGHT);
             
             ctx.fillStyle = '#1e293b';
             ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT);
        } else {
            const pColor = p.type === 'moving' ? theme.platMov : (p.type === 'breaking' ? '#f43f5e' : (p.type === 'boost' ? '#facc15' : theme.platNorm));

            // High-Tech Cyber-Glass Platform
            ctx.save();
            ctx.globalAlpha = p.opacity || 1;
            
            // Outer Frame
            ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = pColor;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, PLATFORM_HEIGHT, 4);
            ctx.fill();
            
            // Inner Core / Glow
            const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + PLATFORM_HEIGHT);
            pGrad.addColorStop(0, pColor);
            pGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = pGrad;
            ctx.shadowBlur = 0;
            ctx.fillRect(p.x + 2, p.y + 2, p.width - 4, 3);

            // Technical Grid Details
            ctx.strokeStyle = pColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = (p.opacity || 1) * 0.3;
            for(let i=0; i<p.width; i+=12) {
               ctx.beginPath(); ctx.moveTo(p.x + i, p.y + 4); ctx.lineTo(p.x + i + 4, p.y + PLATFORM_HEIGHT); ctx.stroke();
            }
            ctx.globalAlpha = p.opacity || 1;

            if (p.type === 'boost') {
                const pulse = Math.abs(Math.sin(Date.now() * 0.01)) * 4;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#fff';
                ctx.strokeRect(p.x - pulse, p.y - pulse, p.width + pulse*2, PLATFORM_HEIGHT + pulse*2);
            }

            if (p.hasSpring) {
               ctx.fillStyle = '#475569';
               ctx.fillRect(p.x + p.width/2 - 8, p.y - 12, 16, 12);
               ctx.fillStyle = '#10b981';
               ctx.shadowBlur = 15;
               ctx.shadowColor = '#10b981';
               ctx.fillRect(p.x + p.width/2 - 12, p.y - 16, 24, 6);
            }

            if (p.type === 'breaking' && p.crackValue > 0) {
               ctx.strokeStyle = '#fff';
               ctx.lineWidth = 2;
               ctx.beginPath();
               ctx.moveTo(p.x + p.width/2, p.y);
               ctx.lineTo(p.x + p.width/2 + 6, p.y + 8);
               ctx.lineTo(p.x + p.width/2 - 4, p.y + 12);
               ctx.stroke();
            }
            ctx.restore();
        }
      });

            powerups.forEach(pw => {
        const timeOffset = Date.now() * 0.005;
        const bob = Math.sin(timeOffset + pw.x) * 3;
        
        ctx.save();
        ctx.translate(pw.x + 10, pw.y + 10 + bob);
        
        // Circular Holographic Shield
        ctx.shadowBlur = 20;
        const pwColor = pw.type === 'vip' ? '#8b5cf6' : (pw.type === 'merch' ? '#f43f5e' : (pw.type === 'beer' ? '#f59e0b' : '#38bdf8'));
        ctx.shadowColor = pwColor;
        
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI*2);
        ctx.strokeStyle = pwColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        if (pw.type === 'glowstick') {
            ctx.fillStyle = '#10b981';
            ctx.beginPath(); ctx.roundRect(-2, -8, 4, 16, 2); ctx.fill();
        } else if (pw.type === 'vip') {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 4);
        } else if (pw.type === 'merch') {
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(-6, 6); ctx.lineTo(6, 6); ctx.fill();
        } else if (pw.type === 'beer') {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath(); ctx.arc(0, 2, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, -2, 4, 0, Math.PI*2); ctx.fill();
        } else if (pw.type === 'magnet') {
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, -2, 6, Math.PI, 0); ctx.stroke();
        }
        
        ctx.restore();
      });

                  enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x + e.width/2, e.y + e.height/2);
        
        // Cyber-Security Drone Appearance
        const droneColor = e.isBouncer ? '#ef4444' : '#a855f7';
        ctx.shadowBlur = 20;
        ctx.shadowColor = droneColor;
        
        // Main Body
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        if (e.isBouncer) {
            ctx.roundRect(-e.width/2, -e.height/2, e.width, e.height, 4);
        } else {
            ctx.arc(0, 0, e.width/2, 0, Math.PI*2);
        }
        ctx.fill();
        
        // Inner Glow / Eye
        ctx.shadowBlur = 0;
        ctx.fillStyle = droneColor;
        ctx.beginPath();
        if (e.isBouncer) {
            ctx.fillRect(-e.width/2 + 4, 0, e.width - 8, 2);
        } else {
            const beat = Math.sin(Date.now()*0.01) * 4;
            ctx.arc(0, 0, 6 + beat, 0, Math.PI*2);
        }
        ctx.fill();

        // Technical details
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-e.width/2 + 2, -e.height/2 + 2, e.width - 4, e.height - 4);
        
        ctx.restore();
      });

      trails.forEach(t => {
         ctx.globalAlpha = Math.max(0, t.life);
         ctx.fillStyle = t.color;
         ctx.fillRect(t.x + 2, t.y + 2, player.width - 4, player.height - 4);
      });
      ctx.globalAlpha = 1;

      drawPlayer(player.x, player.y);

      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;

      bullets.forEach(b => {
          ctx.beginPath();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#facc15';
          ctx.fillStyle = '#fef08a';
          ctx.roundRect(b.x - 2, b.y - 6, 4, 12, 4);
          ctx.fill();
          ctx.shadowBlur = 0;
      });

      floatingTexts.forEach(ft => {
         ctx.globalAlpha = ft.alpha;
         ctx.fillStyle = ft.color2;
         ctx.font = '900 14px monospace';
         ctx.textAlign = 'center';
         ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
         ctx.fillStyle = ft.color;
         ctx.shadowBlur = 5;
         ctx.shadowColor = ft.color;
         ctx.fillText(ft.text, ft.x, ft.y);
         ctx.shadowBlur = 0;
         ctx.textAlign = 'left';
      });
      ctx.globalAlpha = 1;

      // Post-Processing Overlay (Scanlines & CRT feel)
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = 'rgba(18, 16, 16, 0.1)';
      ctx.beginPath();
      for (let i = 0; i < canvas.height; i += 4) {
          ctx.rect(0, i, canvas.width, 1);
      }
      ctx.fill();
      ctx.restore();

      // Vignette
      const vignette = ctx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/3, canvas.width/2, canvas.height/2, canvas.height);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (zoneBannerTimer > 0) {
         ctx.save();
         const yOffset = -50 + Math.min(100, zoneBannerTimer)*0.5;
         ctx.fillStyle = 'rgba(0,0,0,0.7)';
         ctx.fillRect(0, canvas.height/2 + yOffset - 30, canvas.width, 60);
         ctx.fillStyle = theme.platMov;
         ctx.font = 'bold 24px monospace';
         ctx.textAlign = 'center';
         ctx.shadowBlur = 10;
         ctx.shadowColor = theme.platMov;
         ctx.fillText('ENTERING:', canvas.width/2, canvas.height/2 + yOffset - 5);
         ctx.font = '900 32px monospace';
         ctx.fillStyle = '#ffffff';
         ctx.fillText(lastZone.toUpperCase(), canvas.width/2, canvas.height/2 + yOffset + 25);
         ctx.restore();
      }

      if (comboMultiplier >= 5) {
         ctx.save();
         const feverPulse = Math.sin(Date.now() * 0.01) * 0.05;
         ctx.globalAlpha = 0.1 + feverPulse;
         ctx.fillStyle = (theme as any).fever || '#fff';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.restore();
         
         ctx.fillStyle = '#fff';
         ctx.font = '900 24px monospace';
         ctx.textAlign = 'center';
         ctx.shadowBlur = 15;
         ctx.shadowColor = (theme as any).fever || '#fff';
         ctx.fillText(t('game.fest.fever_mode'), canvas.width/2, 100);
         ctx.shadowBlur = 0;
      }

      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      
      if (shootTimer > 0) shootTimer -= normalDt;
      if (isShooting && shootTimer <= 0) {
         bullets.push({ x: player.x + player.width/2, y: player.y, vy: 15 });
         shootTimer = 10;
      }
      if (gameState === 'ready') {
         ctx.save();
         ctx.fillStyle = 'rgba(0,0,0,0.6)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.fillStyle = '#f43f5e';
         ctx.font = '900 64px monospace';
         ctx.textAlign = 'center';
         ctx.shadowBlur = 20;
         ctx.shadowColor = '#f43f5e';
         const text = Math.ceil(readyTimer / 60).toString();
         ctx.fillText(readyTimer > 10 ? text : 'JUMP!', canvas.width/2, canvas.height/2);
         ctx.restore();
      }


      update(dt);
    };

    let lastTime = performance.now();
    const gameLoop = (time: number) => {
      if (pausedRef.current) {
         lastTime = time;
         ctx.fillStyle = 'rgba(0,0,0,0.02)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         if (isPlaying) animationFrameId = requestAnimationFrame(gameLoop);
         return;
      }
      const dt = time - lastTime;
      lastTime = time;
      draw(Math.min(dt, 50));
      if (isPlaying) animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('deviceorientation', handleOrientation);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchend', handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, selectedChar, upgrades]);

  

  const [shopTab, setShopTab] = useState<'chars' | 'upgrades' | 'rewards'>('chars');
  const [ownedRewards, setOwnedRewards] = useState<string[]>(() => JSON.parse(localStorage.getItem('fest_rewards') || '[]'));
  useEffect(() => localStorage.setItem('fest_rewards', JSON.stringify(ownedRewards)), [ownedRewards]);

    const MARKETING_REWARDS = [
    { id: 'discount20', nameKey: 'game.fest.reward.discount.name', descKey: 'game.fest.reward.discount.desc', cost: 1000, type: 'discount', code: 'RAVER20' },
    { id: 'freedrink', nameKey: 'game.fest.reward.drink.name', descKey: 'game.fest.reward.drink.desc', cost: 2500, type: 'coupon', code: 'STAYHYDRATED' },
    { id: 'vippass', nameKey: 'game.fest.reward.vip.name', descKey: 'game.fest.reward.vip.desc', cost: 10000, type: 'ticket', code: 'MAIN-STAGE-DJ' }
  ];

  return (
    <div className={isPlaying ? "fixed inset-0 z-[100] flex flex-col items-center justify-center p-0 overflow-hidden bg-[#050510]" : "flex flex-col items-center w-full h-full max-w-full overflow-hidden font-mono select-none p-4"}>
      <div className={isPlaying ? "w-full max-w-2xl h-full max-h-screen mx-auto flex flex-col" : "w-full h-full max-w-2xl mx-auto flex flex-col"}>
      
      {/* Top HUD */}
      <div className="flex justify-between items-center w-full px-6 py-4 mb-2 bg-black/60 backdrop-blur-xl rounded-t-3xl border-b-4 border-pink-500 shrink-0 z-10 shadow-[0_15px_30px_rgba(236,72,153,0.15)]">
        <div className="flex flex-col gap-1">
           <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => setShowShop(true)}>
                 <div className="absolute -inset-2 bg-yellow-400/20 blur-xl group-hover:bg-yellow-400/40 transition-all"></div>
                 <div className="relative flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-white/10">
                    <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span ref={coinsRefDOM} className="text-sm font-black text-white">{festCoins}</span>
                 </div>
              </div>
              
              {isPlaying && (
                <button 
                  onClick={() => setIsPaused(true)}
                  className="bg-zinc-900/80 text-white p-2.5 rounded-lg border border-white/10 hover:bg-zinc-800 hover:border-pink-500/50 transition-all shadow-lg active:scale-95 flex items-center justify-center"
                >
                  <Pause size={18} className="text-pink-500" />
                </button>
              )}
           </div>
           
           {/* Active Powerup Gauges */}
           <div className="flex gap-2 mt-2">
              {hudShield > 0 && <div className="h-1.5 w-12 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
              {hudJetpack > 0 && (
                 <div className="h-1.5 bg-yellow-500 rounded-full shadow-[0_0_8px_#eab308] transition-all" style={{ width: `${Math.min(48, hudJetpack / 4)}px` }}></div>
              )}
           </div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className="relative">
              <div className="absolute -top-4 -right-2 text-[8px] font-black text-pink-500 tracking-[0.3em] uppercase">Current_Earning</div>
              <p ref={scoreRefDOM} className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{score}</p>
           </div>
        </div>
      </div>
      
      <div ref={containerRef} className="relative bg-[#020205] rounded-xl overflow-hidden w-full h-full min-h-[400px] flex justify-center items-center flex-col mx-auto flex-grow [&.is-fullscreen]:border-none [&.is-fullscreen]:rounded-none">
        
        {/* Holographic overlay */}
        <div className="absolute inset-0 pointer-events-none z-20 mix-blend-screen opacity-10">
           <div className="w-full h-full bg-[linear-gradient(rgba(59,130,246,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(236,72,153,0.1)_1px,transparent_1px)] bg-[length:4px_4px]" />
        </div>
        
        {!hideFullscreenButton && <FullscreenButton targetRef={containerRef} className="top-2 right-2 text-white/50 hover:text-pink-400" />}
        
        <AnimatePresence>
          {message && (
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 20, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="absolute text-center top-0 inset-x-0 z-[60] flex justify-center pointer-events-none">
              <div className={`px-6 py-2 border border-blue-500/50 backdrop-blur-md rounded text-[10px] uppercase tracking-widest font-bold shadow-[0_0_20px_rgba(0,0,0,0.5)] ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{message.text}</div>
            </motion.div>
          )}

          {gameResult && !isPlaying && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#050510]/95 backdrop-blur-xl p-8 text-center pointer-events-auto"
            >
               <h2 className="text-4xl md:text-5xl font-black text-pink-500 mb-2 tracking-widest uppercase">GAME OVER</h2>
               <p className="text-white/50 text-xs mb-8 uppercase tracking-[0.3em]">YOU FELL OUT OF THE FESTIVAL</p>
               
               <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full max-w-sm mb-8 space-y-4">
                  <div className="flex justify-between items-center text-lg">
                     <span className="text-white/70 uppercase">Distance Score</span>
                     <span className="font-black text-white">{gameResult.score}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg border-t border-white/10 pt-4">
                     <span className="text-white/70 uppercase flex items-center gap-2"><Zap size={16} className="text-yellow-400" /> Karmas Earned</span>
                     <span className="font-black text-yellow-400">+{gameResult.coinsEarned}</span>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4 w-full max-w-sm">
                  <button 
                    onClick={() => { setGameResult(null); setIsPlaying(true); playSound('start'); }}
                    className="w-full py-5 bg-white text-black font-black uppercase text-xl hover:bg-pink-500 hover:text-white transition-colors"
                  >
                     PLAY AGAIN
                  </button>
                  <button 
                    onClick={() => setGameResult(null)}
                    className="w-full py-4 text-white/40 font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                  >
                     MAIN MENU
                  </button>
               </div>
            </motion.div>
          )}

          {!isPlaying && !gameResult && !showCodeInput && !showShop && (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#050510]/95 backdrop-blur-xl p-8 text-center pointer-events-auto"
            >
              <div className="w-full max-w-sm space-y-12">
                 <div className="relative">
                    <motion.h3 
                      animate={{ scale: [1, 1.02, 1], rotate: [-0.5, 0.5, -0.5] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="text-8xl font-black italic text-white tracking-tighter drop-shadow-[0_0_40px_rgba(236,72,153,0.5)]"
                    >
                       FEST<br/>JUMP
                    </motion.h3>
                    <div className="absolute -top-6 -right-6 bg-pink-500 text-black text-[10px] font-black px-3 py-1 rotate-12 uppercase border-2 border-white/50 shadow-lg">V.2.0.4</div>
                 </div>

                 {controlMode === null ? (
                    <div className="flex flex-col gap-4">
                       <h4 className="text-white/60 text-xs font-bold uppercase tracking-[0.3em] mb-4">Select Controls</h4>
                       <button 
                         onClick={() => { setControlMode('keyboard'); playSound('click'); }}
                         className="flex items-center justify-between p-5 bg-zinc-900 border border-white/10 text-white rounded-xl hover:border-pink-500 group transition-all"
                       >
                          <div className="flex items-center gap-4">
                             <div className="bg-zinc-800 p-2 rounded-lg group-hover:bg-pink-500/20 transition-colors">
                                <Rocket className="text-pink-500" />
                             </div>
                             <div className="text-left">
                                <p className="font-black uppercase text-sm">Keyboard</p>
                                <p className="text-[10px] text-white/40 uppercase">Classic ARROWS + SPACE</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-white/20 group-hover:text-pink-500 transition-colors" />
                       </button>

                       <button 
                         onClick={() => { setControlMode('mouse'); playSound('click'); }}
                         className="flex items-center justify-between p-5 bg-zinc-900 border border-white/10 text-white rounded-xl hover:border-blue-500 group transition-all"
                       >
                          <div className="flex items-center gap-4">
                             <div className="bg-zinc-800 p-2 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                <Target className="text-blue-500" />
                             </div>
                             <div className="text-left">
                                <p className="font-black uppercase text-sm">Mouse / Touch</p>
                                <p className="text-[10px] text-white/40 uppercase">Precision tracking</p>
                             </div>
                          </div>
                          <ChevronRight size={20} className="text-white/20 group-hover:text-blue-500 transition-colors" />
                       </button>
                    </div>
                 ) : (
                    <div className="flex flex-col gap-4">
                       <button 
                         onClick={() => { setIsPlaying(true); playSound('start'); }}
                         className="group relative w-full py-7 bg-white text-black font-black text-2xl uppercase skew-x-[-10deg] overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_rgba(255,255,255,0.2)]"
                       >
                          <div className="absolute inset-0 bg-pink-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300"></div>
                          <span className="relative z-10">{t('game.fest.start')}</span>
                       </button>
                       
                       <div className="flex gap-2">
                          <button 
                            onClick={() => setShowShop(true)}
                            className="flex-1 py-5 bg-zinc-900 border border-white/10 text-white font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-800 transition-colors"
                          >
                             <ShoppingCart size={20} /> {t('game.fest.customize')}
                          </button>
                          
                          <button 
                            onClick={() => setControlMode(null)}
                            className="p-5 bg-zinc-900 border border-white/10 text-white/40 hover:text-white transition-colors flex items-center justify-center"
                            title="Change Controls"
                          >
                             <Settings size={20} />
                          </button>
                       </div>
                    </div>
                 )}

                 <div className="space-y-4 pt-12 border-t border-white/5">
                    <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                       <span className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('game.fest.best')}</span>
                       <span className="text-white text-xl font-black">{highScore}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {showCodeInput && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-[70] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
             >
                <div className="flex flex-col items-center max-w-sm w-full bg-zinc-900 p-8 rounded-3xl border border-white/10 shadow-2xl">
                   <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><Key className="text-pink-500" size={16}/> SYSTEM_OVERRIDE</h3>
                   <input autoFocus value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase())} className="w-full bg-black/50 border border-pink-500/30 text-pink-400 text-center text-xl tracking-[0.3em] p-4 rounded-xl uppercase placeholder:text-white/10 focus:outline-none focus:border-pink-500 shadow-[inset_0_0_20px_rgba(236,72,153,0.1)] transition-colors font-mono mb-6" placeholder="******" />
                   <div className="flex w-full gap-3">
                      <button onClick={() => setShowCodeInput(false)} className="flex-1 p-3 bg-white/5 border border-white/10 text-white/50 text-[10px] rounded-lg tracking-widest font-bold uppercase hover:bg-white/10 transition-colors uppercase">Cancel</button>
                      <button onClick={handleApplyCode} className="flex-[2] p-3 bg-pink-500 text-black text-[10px] rounded-lg tracking-widest font-black uppercase hover:bg-pink-400 transition-all uppercase">Apply Override</button>
                   </div>
                </div>
             </motion.div>
          )}

          {showShop && (
             <motion.div 
                initial={{ opacity: 0, x: 100 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: 100 }}
                className="absolute inset-0 z-[80] bg-[#0a0a0f] flex flex-col p-6 overflow-hidden pointer-events-auto"
             >
                <div className="flex justify-between items-center mb-8 border-b-4 border-pink-500 pb-4">
                   <h2 className="text-4xl font-black italic text-white tracking-tighter uppercase">the.vault</h2>
                   <button onClick={() => setShowShop(false)} className="bg-white text-black p-2 rounded-lg font-black hover:bg-pink-500 transition-colors"><ChevronLeft size={24}/></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
                   <div className="flex gap-2">
                      {['chars', 'upgrades'].map((tab) => (
                         <button 
                           key={tab} 
                           onClick={() => setShopTab(tab as any)}
                           className={`flex-1 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${shopTab === tab ? 'bg-pink-500 border-pink-500 text-black' : 'bg-white/5 border-white/10 text-white/50'}`}
                         >
                            {t(`game.fest.shop.tab.${tab}`)}
                         </button>
                      ))}
                   </div>

                   {shopTab === 'chars' ? (
                      <div className="grid grid-cols-1 gap-4">
                         {CHARACTERS.map(char => (
                            <button 
                              key={char.id}
                              onClick={() => {
                                 if (unlockedChars.includes(char.id)) { setSelectedCharId(char.id); playSound('click'); }
                                 else if (festCoins >= char.price) { setFestCoins(c => c - char.price); setUnlockedChars(p => [...p, char.id]); setSelectedCharId(char.id); playSound('win'); }
                                 else playSound('alert');
                              }}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${selectedCharId === char.id ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : 'border-white/5 bg-zinc-900/50'}`}
                            >
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg shadow-lg" style={{ backgroundColor: char.color }}></div>
                                  <div className="flex-1">
                                     <p className="font-black text-white uppercase text-sm tracking-widest">{t(char.nameKey)}</p>
                                     <p className="text-white/40 text-[9px] uppercase tracking-widest leading-none mt-1">{t(char.descKey)}</p>
                                  </div>
                                  {!unlockedChars.includes(char.id) ? (
                                     <div className="text-yellow-400 font-black flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded"><Zap size={14} className="fill-yellow-400"/> {char.price}</div>
                                  ) : (
                                     <div className={selectedCharId === char.id ? 'text-pink-500 font-black italic tracking-widest text-[10px]' : 'text-zinc-600 font-black text-[10px]'}>{selectedCharId === char.id ? 'ACTIVE' : 'SELECT'}</div>
                                  )}
                               </div>
                            </button>
                         ))}
                      </div>
                   ) : (
                      <div className="grid grid-cols-2 gap-4">
                         {['magnet', 'jump', 'shield', 'luck'].map(upg => (
                            <div key={upg} className="bg-zinc-900 p-4 border border-white/5 rounded-xl flex flex-col items-center gap-3">
                               <span className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">{(t as any)(`game.fest.item_name.${upg}`)}</span>
                               <span className="text-xl font-black text-white">LV.{upgrades[upg as keyof typeof upgrades]}</span>
                               <button 
                                 onClick={() => {
                                    const cost = (upgrades[upg as keyof typeof upgrades] + 1) * 300;
                                    if (festCoins >= cost) { setFestCoins(c => c - cost); setUpgrades(p => ({...p, [upg]: p[upg as keyof typeof upgrades] + 1})); playSound('score'); }
                                    else playSound('alert');
                                 }}
                                 className="w-full bg-blue-500 text-black text-[10px] font-black py-2.5 rounded uppercase tracking-tighter hover:bg-blue-400 transition-colors"
                               >
                                  {t('game.fest.buy')} / {(upgrades[upg as keyof typeof upgrades] + 1) * 300}
                               </button>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </motion.div>
          )}

          {isPaused && (
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 pointer-events-auto"
             >
                <div className="w-full max-w-sm bg-zinc-900 border-2 border-pink-500 rounded-3xl p-8 flex flex-col items-center space-y-6 shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                   <h2 className="text-5xl font-black italic text-white tracking-tighter mb-4">{t('game.fest.pause')}</h2>
                   
                   <button 
                     onClick={() => setIsPaused(false)}
                     className="w-full py-5 bg-pink-500 text-black font-black text-xl uppercase skew-x-[-10deg] shadow-[0_10px_20px_rgba(236,72,153,0.2)] hover:scale-105 active:scale-95 transition-all"
                   >
                      {t('game.fest.resume')}
                   </button>
                   
                   <button 
                     onClick={() => { 
                        setIsPaused(false); 
                        setIsPlaying(false);
                        setScore(0);
                        setTimeout(() => {
                           playSound('start');
                           setIsPlaying(true);
                        }, 50);
                     }}
                     className="w-full py-4 bg-zinc-800 border border-white/20 text-white font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors"
                   >
                      {t('game.fest.restart')}
                   </button>
                   
                   <button 
                     onClick={() => { setIsPaused(false); setIsPlaying(false); }}
                     className="w-full py-4 text-white/40 font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
                   >
                      {t('game.fest.quit')}
                   </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} width={360} height={640} className="w-full h-full object-contain pointer-events-auto" style={{ filter: 'contrast(1.1) brightness(1.1)', imageRendering: 'pixelated' }} />
      </div>

      {isPlaying && showMobileControls && (
        <div className="relative z-50 w-full mt-4 px-4 flex justify-between md:hidden gap-4 pointer-events-auto">
          <div className="flex gap-4 w-2/3">
            <button onPointerDown={(e) => { e.preventDefault(); keysRef.current.left = true; }} onPointerUp={(e) => { e.preventDefault(); keysRef.current.left = false; }} onPointerLeave={(e) => { e.preventDefault(); keysRef.current.left = false; }} className="flex-1 h-20 bg-gradient-to-t from-gray-900 to-gray-800 rounded-2xl shadow-[0_8px_0_#111827,0_15px_20px_rgba(0,0,0,0.5)] active:translate-y-2 active:shadow-[0_0px_0_#111827,0_0px_0px_rgba(0,0,0,0.5)] flex items-center justify-center text-white/50 border border-white/10 touch-none"><ChevronLeft size={36} /></button>
            <button onPointerDown={(e) => { e.preventDefault(); keysRef.current.right = true; }} onPointerUp={(e) => { e.preventDefault(); keysRef.current.right = false; }} onPointerLeave={(e) => { e.preventDefault(); keysRef.current.right = false; }} className="flex-1 h-20 bg-gradient-to-t from-gray-900 to-gray-800 rounded-2xl shadow-[0_8px_0_#111827,0_15px_20px_rgba(0,0,0,0.5)] active:translate-y-2 active:shadow-[0_0px_0_#111827,0_0px_0px_rgba(0,0,0,0.5)] flex items-center justify-center text-white/50 border border-white/10 touch-none"><ChevronRight size={36} /></button>
          </div>
          <button onPointerDown={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }} onPointerUp={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' })); }} className="w-1/3 h-20 bg-gradient-to-t from-pink-700 to-pink-500 rounded-2xl shadow-[0_8px_0_#831843,0_15px_30px_rgba(236,72,153,0.4)] active:translate-y-2 active:shadow-none flex items-center justify-center text-white border border-pink-400 touch-none"><Rocket size={32} className="animate-pulse" /></button>
        </div>
      )}
      </div>
    </div>
  );
}
