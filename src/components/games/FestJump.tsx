import { useEffect, useRef, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Key, Shield, Zap, Rocket, AlertCircle, ChevronLeft, ChevronRight, Settings, Music, Target } from 'lucide-react';
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
  { id: 'default', nameKey: 'CYBER-RUNNER', descKey: 'Standard model', price: 0, jumpForce: -12, speed: 11, color: '#6EE7B7', accent: '#f43f5e' },
  { id: 'punk', nameKey: 'NEON-PUNK', descKey: 'Faster movement', price: 200, jumpForce: -13.5, speed: 14, color: '#f43f5e', accent: '#6EE7B7' },
  { id: 'ghost', nameKey: 'GLITCH-GHOST', descKey: 'Spectral float', price: 500, jumpForce: -11, speed: 16, color: '#ffffff', accent: '#3b82f6' },
  { id: 'cyber', nameKey: 'MECHA-SYS', descKey: 'Double jump active', price: 1000, jumpForce: -15, speed: 12.5, color: '#a855f7', accent: '#eab308', doubleJump: true },
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
  const [festCoins, setFestCoins] = useState(() => Number(localStorage.getItem('fest_coins') || 0));
  const [unlockedChars, setUnlockedChars] = useState<string[]>(() => JSON.parse(localStorage.getItem('fest_chars') || '["default"]'));
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('fest_selected_char') || 'default');
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('fest_highscore') || 0));
  const [upgrades, setUpgrades] = useState(() => {
    const saved = localStorage.getItem('fest_upgrades');
    return saved ? JSON.parse(saved) : { magnet: 0, jump: 0, shield: 0, luck: 0 };
  });
  const [showMobileControls, setShowMobileControls] = useState(() => localStorage.getItem('fest_mobile_controls') === 'true');
  const [gameStats, setGameStats] = useState<{earned: number, total: number, enemies: number, items: number} | null>(null);
  const keysRef = useRef({ left: false, right: false });
  const pausedRef = useRef(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

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
      { score: 0, bgSolid: '#0f0c29', bgTop: 'rgba(236, 72, 153, 0.2)', bgBottom: 'rgba(56, 189, 248, 0.0)', gridColor: 'rgba(236, 72, 153, 0.15)', platNorm: '#10b981', platNormDk: '#065f46', platMov: '#3b82f6', platMovDk: '#1e3a8a', star: 'rgba(255,255,255,0.4)', name: 'Neon City' },
      { score: 1000, bgSolid: '#051205', bgTop: 'rgba(163, 230, 53, 0.15)', bgBottom: 'rgba(16, 185, 129, 0.0)', gridColor: 'rgba(163, 230, 53, 0.15)', platNorm: '#eab308', platNormDk: '#713f12', platMov: '#f97316', platMovDk: '#7c2d12', star: 'rgba(163, 230, 53, 0.4)', name: 'Cyber Slums' },
      { score: 3000, bgSolid: '#1a0505', bgTop: 'rgba(220, 38, 38, 0.2)', bgBottom: 'rgba(249, 115, 22, 0.0)', gridColor: 'rgba(220, 38, 38, 0.2)', platNorm: '#a8a29e', platNormDk: '#44403c', platMov: '#dc2626', platMovDk: '#7f1d1d', star: 'rgba(248, 113, 113, 0.4)', name: 'Crimson Zone' },
      { score: 6000, bgSolid: '#000000', bgTop: 'rgba(168, 85, 247, 0.3)', bgBottom: 'rgba(0, 0, 0, 0.0)', gridColor: 'rgba(168, 85, 247, 0.3)', platNorm: '#d8b4fe', platNormDk: '#6b21a8', platMov: '#fcd34d', platMovDk: '#b45309', star: 'rgba(192, 132, 252, 0.6)', name: 'Void Core' }
    ];

    const getTheme = (score: number) => {
      let t = THEMES[0];
      for(const theme of THEMES) if (score >= theme.score) t = theme;
      return t;
    };

    let animationFrameId: number;
    let particles: {x: number, y: number, vx: number, vy: number, life: number, color: string, size: number}[] = [];
    let trails: {x: number, y: number, life: number, color: string}[] = [];
    let powerups: {x: number, y: number, type: 'vip' | 'merch' | 'glowstick' | 'beer' | 'magnet'}[] = [];
    let enemies: {x: number, y: number, speed: number, width: number, isBouncer?: boolean, minX?: number, maxX?: number}[] = [];
    let floatingTexts: {x: number, y: number, text: string, alpha: number, color: string, color2: string}[] = [];
    let bullets: {x: number, y: number, vy: number}[] = [];
    
    let comboMultiplier = 1;
    let comboTimer = 0;
    let adBreakTimer = 0;
    let cameraShake = 0;
    let screenFlash = 0;

    const PLATFORM_WIDTH = 60;
    const PLATFORM_HEIGHT = 12;
    const GRAVITY = 0.5;
    
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

    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      
      if (e.key === 'ArrowUp' || e.key === ' ') {
         if (player.jumps > 0 && player.jumps < (selectedChar.doubleJump ? 2 : 1) && player.vy > -5 && player.vy < 10) {
            player.vy = selectedChar.jumpForce * 0.8;
            player.jumps++;
            playSound('jump');
            createParticles(player.x + player.width/2, player.y + player.height, '#fff');
         }
         isShooting = true;
      }
      if (e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'ArrowRight') keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp') isShooting = false;
    };

    const handlePointerMove = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      touchTargetX = ((clientX - rect.left) / rect.width) * canvas.width - player.width / 2;
    };

    const handlePointerDown = () => isShooting = true;
    const handlePointerUp = () => { isShooting = false; touchTargetX = null; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
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
             x: platform.x, y: platform.y - 32, speed: 2.5 * (Math.random() > 0.5 ? 1 : -1), width: 28, isBouncer: false
          });
       } else if (maxScore > 3000 && Math.random() > 0.9) {
          // Crimson Zone Enemy (Bouncer)
          enemies.push({
             x: platform.x, y: platform.y - 32, speed: 1.5 * (Math.random() > 0.5 ? 1 : -1), width: 32, isBouncer: true, minX: platform.x, maxX: platform.x + platform.width - 32
          });
       } else if (maxScore > 1000 && Math.random() > 0.93) {
          // Cyber Slums Enemy (Basic)
          enemies.push({
             x: platform.x, y: platform.y - 32, speed: 1.0 * (Math.random() > 0.5 ? 1 : -1), width: 32, isBouncer: false
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

    const drawPlayer = (x: number, y: number) => {
      ctx.save();
      if (cameraShake > 0) ctx.translate(Math.random()*cameraShake - cameraShake/2, Math.random()*cameraShake - cameraShake/2);
      
      let stretchX = 1;
      let stretchY = 1;
      if (player.vy < -5) { stretchX = 0.8; stretchY = 1.2; }
      else if (player.vy > 5) { stretchX = 0.9; stretchY = 1.1; }
      
      const pWidth = player.width * stretchX;
      const pHeight = player.height * stretchY;
      const charX = x + (player.width - pWidth) / 2;
      const charY = y + (player.height - pHeight);

      // Add a slight gradient to the player
      const gradient = ctx.createLinearGradient(charX, charY, charX, charY + pHeight);
      gradient.addColorStop(0, selectedChar.color);
      gradient.addColorStop(1, '#0f172a');
      
      // Glow effect for character
      ctx.shadowBlur = 15;
      ctx.shadowColor = selectedChar.color;

      // Thruster effect
      if (player.vy < -2) {
         ctx.save();
         const thrustLength = Math.min(20, -player.vy * 2);
         ctx.shadowBlur = 20;
         ctx.shadowColor = selectedChar.accent;
         
         ctx.fillStyle = selectedChar.accent;
         ctx.beginPath();
         // draw thruster flames
         ctx.moveTo(charX + pWidth * 0.2, charY + pHeight);
         ctx.lineTo(charX + pWidth * 0.5, charY + pHeight + thrustLength + Math.random()*10);
         ctx.lineTo(charX + pWidth * 0.8, charY + pHeight);
         ctx.fill();
         
         // Inner bright thruster flame
         ctx.fillStyle = '#ffffff';
         ctx.beginPath();
         ctx.moveTo(charX + pWidth * 0.35, charY + pHeight);
         ctx.lineTo(charX + pWidth * 0.5, charY + pHeight + thrustLength*0.6 + Math.random()*5);
         ctx.lineTo(charX + pWidth * 0.65, charY + pHeight);
         ctx.fill();
         ctx.restore();
      }

      // Main body (cyberpunk capsule / block shape)
      ctx.fillStyle = gradient;
      ctx.beginPath();
      if (selectedChar.id === 'ghost') {
         ctx.moveTo(charX + pWidth/2, charY);
         ctx.lineTo(charX + pWidth, charY + pHeight/2);
         ctx.lineTo(charX + pWidth/2, charY + pHeight);
         ctx.lineTo(charX, charY + pHeight/2);
      } else {
         ctx.roundRect(charX, charY, pWidth, pHeight, 8);
      }
      ctx.fill();
      
      // Outline glow removed, add inner geometric details
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      if (selectedChar.id === 'ghost') {
         ctx.beginPath();
         ctx.arc(charX + pWidth/2, charY + pHeight/2 - 2, 4, 0, Math.PI*2);
         ctx.fill();
      } else {
         ctx.fillRect(charX + Math.max(4, pWidth*0.2), charY + pHeight*0.2, pWidth*0.6, pHeight*0.25);
         ctx.fillStyle = selectedChar.accent;
         ctx.fillRect(charX + pWidth*0.3, charY + pHeight*0.55, pWidth*0.4, 2);
      }

      if (player.shield > 0) {
        ctx.beginPath();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#3b82f6';
        ctx.arc(x + player.width/2, y + player.height/2, 22 + Math.sin(Date.now()*0.01)*2, 0, Math.PI*2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (player.jetpack > 0) {
        createParticles(x + player.width/2, y + player.height, '#f59e0b');
        ctx.fillStyle = '#f59e0b';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f59e0b';
        ctx.fillRect(charX - 4, charY + pHeight/2, 6, pHeight/2 + 5);
        ctx.fillRect(charX + pWidth - 2, charY + pHeight/2, 6, pHeight/2 + 5);
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    const update = (dt: number) => {
      if (isPausedGlobal || pausedRef.current) return;
      const normalDt = dt / 16.666;
      
      if (gameState === 'ready') {
        readyTimer -= normalDt;
        if (readyTimer <= 0) gameState = 'playing';
        return;
      }
      
      if (cameraShake > 0) cameraShake *= Math.pow(0.9, normalDt);
      if (screenFlash > 0) screenFlash *= Math.pow(0.8, normalDt);
      if (adBreakTimer > 0) {
         adBreakTimer -= normalDt;
         if (Math.random() < 0.1) {
            setFestCoins(prev => prev + 1);
            bonusScore += 100;
            addFloatingText(player.x + (Math.random()-0.5)*200, player.y - Math.random()*200, t('game.fest.text.sponsor_reward'), '#10b981');
         }
      }

      if (isShooting && Date.now() - player.lastShot > 300) {
         player.lastShot = Date.now();
         bullets.push({ x: player.x + player.width / 2, y: player.y, vy: -15 });
         playSound('score'); 
      }

      bullets.forEach(b => b.y += b.vy * normalDt);
      bullets = bullets.filter(b => b.y > -50);

      if (touchTargetX !== null) {
         const diff = touchTargetX - player.x;
         player.vx = diff * 0.15; // Smooth tracking
         player.vx = Math.max(-selectedChar.speed * 1.5, Math.min(selectedChar.speed * 1.5, player.vx));
      } else {
         if (keys.left) player.vx -= 1.5 * normalDt;
         else if (keys.right) player.vx += 1.5 * normalDt;
         else player.vx *= Math.pow(0.8, normalDt);
         player.vx = Math.max(-selectedChar.speed, Math.min(selectedChar.speed, player.vx));
      }

      player.x += player.vx * normalDt;
      
      if (player.jetpack > 0) {
        player.vy = -18;
        player.jetpack -= normalDt;
      } else {
        player.vy += GRAVITY * normalDt;
      }
      player.y += player.vy * normalDt;

      if (player.x < 0) player.x += canvas.width;
      if (player.x >= canvas.width) player.x -= canvas.width;

      let vDiff = 0;
      if (player.y < canvas.height * 0.4) {
        vDiff = canvas.height * 0.4 - player.y;
        cameraY += vDiff;
        player.y = canvas.height * 0.4;
        maxScore = Math.floor(cameraY);
      }
      
      if (vDiff > 0) {
        platforms.forEach((p) => {
          p.y += vDiff;
          if (p.y > canvas.height) {
            let sortedPlatforms = [...platforms].sort((a,b) => a.y - b.y);
            let topP = sortedPlatforms[0];
            let spacing = 60 + Math.random() * 40; // 60 to 100 spacing
            p.y = topP.y - spacing;
            
            const rand = Math.random();
            const progress = Math.min(1, maxScore / 30000);
            
            p.type = rand < 0.1 ? 'billboard' : 
                     rand < 0.15 ? 'boost' : 
                     rand < 0.2 + progress * 0.3 ? 'moving' : 
                     rand < 0.25 + progress * 0.4 ? 'breaking' : 'normal';
            
            p.width = p.type === 'billboard' ? PLATFORM_WIDTH * 2.5 : PLATFORM_WIDTH;
            
            // Smarter X placement relative to the top platform
            let offset = (Math.random() * 200 - 100);
            let prevX = topP.x + topP.width / 2;
            let newX = prevX + offset - p.width/2;
            
            // Screen wrapping constraint for spawning
            if (newX < 10) newX = canvas.width - p.width - 10;
            if (newX > canvas.width - p.width - 10) newX = 10;
            
            // Avoid spawning directly on top of another platform vertically
            let overlaps = sortedPlatforms.some(op => op !== p && Math.abs(op.y - p.y) < 30 && Math.abs(op.x - newX) < p.width);
            if (overlaps) {
                newX = (newX + 150) % (canvas.width - p.width);
            }

            p.x = Math.max(0, Math.min(canvas.width - p.width, newX));
            
            p.vx = p.type === 'moving' ? (Math.random() * 1.5 + 1 + progress * 1.5) * (Math.random() > 0.5 ? 1 : -1) : 0;
            p.broken = false;
            p.crackValue = 0;
            p.isStepped = false;
            p.hasSpring = Math.random() > 0.9;
            
            if (p.type !== 'breaking' && p.type !== 'boost') {
              spawnEntity(p);
            }
          }
        });
        enemies.forEach(e => e.y += vDiff);
        powerups.forEach(pw => pw.y += vDiff);
        bullets.forEach(b => b.y += vDiff);
      }

      if (player.vy > 0) {
        const pRects = [{x: player.x, w: player.width}, {x: player.x + canvas.width, w: player.width}, {x: player.x - canvas.width, w: player.width}];
        
        platforms.forEach(p => {
          if (p.broken) return;
          if (p.type === 'moving') {
             p.x += p.vx * normalDt;
             if (p.x < -p.width) p.x += canvas.width + p.width;
             if (p.x > canvas.width) p.x -= canvas.width + p.width;
          }

          let hit = false;
          for(const pr of pRects) {
            if (pr.x + 4 < p.x + p.width && pr.x + pr.w - 4 > p.x && player.y + player.height >= p.y && player.y + player.height <= p.y + PLATFORM_HEIGHT + player.vy * normalDt) {
              hit = true; break;
            }
          }

          if (hit) {
             const distCenter = Math.abs((player.x + player.width/2) - (p.x + p.width/2));
             const isPerfect = distCenter < 10;

             if (p.type === 'billboard' && comboTimer <= 0) {
                 addFloatingText(player.x, player.y - 30, t('game.fest.text.sponsor_engaged'), '#0ea5e9');
                 setFestCoins(prev => prev + 5);
                 playSound('powerup');
                 comboTimer = 120;
             } else if (p.type === 'boost') {
                 player.vy = -25;
                 playSound('powerup');
                 cameraShake = 20;
                 screenFlash = 0.6;
                 addFloatingText(player.x, player.y, t('game.fest.text.mega_boost'), '#facc15');
                 comboMultiplier += 2;
                 comboTimer = 180 + upgrades.luck * 60;
                 return;
             }

             if (comboTimer > 0) {
               bonusScore += 10 * comboMultiplier;
             } else comboMultiplier = 1;

             if (isPerfect) {
               bonusScore += 50 * comboMultiplier;
               setFestCoins(prev => prev + 2);
               createParticles(p.x + p.width/2, p.y, '#ffffff'); // Base particles
               createParticles(p.x + p.width/2, p.y, selectedChar.accent); // Accent particles
               cameraShake = 10;
               comboMultiplier++;
               comboTimer = 180 + upgrades.luck * 60;
               addFloatingText(player.x, player.y - 20, `${t('game.fest.text.perfect')} X${comboMultiplier}`, '#ec4899');
               playSound('powerup');
             }

             player.vy = (p.hasSpring ? selectedChar.jumpForce * 1.85 : selectedChar.jumpForce) - JUMP_BOOST;
             player.jumps = 1;
             
             if (p.type === 'breaking') {
               p.broken = true;
               playSound('hit');
             } else {
               playSound('click');
             }
          }
        });
      }

      if (comboTimer > 0) comboTimer -= normalDt;
      else comboMultiplier = 1;

      powerups.forEach((pw, idx) => {
        if (player.magnet > 0 && pw.type !== 'vip') {
          const dx = player.x + player.width / 2 - (pw.x + 10);
          const dy = player.y + player.height / 2 - (pw.y + 10);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MAGNET_RANGE) {
             pw.x += (dx / dist) * 12 * normalDt;
             pw.y += (dy / dist) * 12 * normalDt;
          }
        }
        if (player.x < pw.x + 20 && player.x + player.width > pw.x && player.y < pw.y + 20 && player.y + player.height > pw.y) {
           if (pw.type === 'vip') {
             setFestCoins(prev => prev + 50);
             bonusScore += 500;
             playSound('win');
             addFloatingText(pw.x, pw.y, t('game.fest.text.vip'), '#f59e0b', '#78350f');
             adBreakTimer = 400; 
             cameraShake = 20;
             screenFlash = 0.8;
           } else if (pw.type === 'merch') {
             player.shield = 1;
             playSound('powerup');
             addFloatingText(pw.x, pw.y, t('game.fest.powerup.shield'), '#3b82f6');
           } else if (pw.type === 'glowstick') {
             setFestCoins(prev => prev + 5);
             playSound('score');
           } else if (pw.type === 'beer') {
             player.jetpack = 200;
             playSound('start');
             screenFlash = 0.5;
           } else if (pw.type === 'magnet') {
             player.magnet = 600;
             playSound('powerup');
             addFloatingText(pw.x, pw.y, t('game.fest.text.magnet'), '#a855f7');
           }
           powerups.splice(idx, 1);
        }
      });

      enemies.forEach((e, idx) => {
        e.x += e.speed * normalDt;
        if (e.isBouncer && e.minX !== undefined && e.maxX !== undefined) {
           if (e.x < e.minX || e.x > e.maxX) e.speed *= -1;
        } else {
           if (e.x < -50 || e.x > canvas.width + 50) e.speed *= -1;
        }

        let shot = false;
        bullets.forEach((b, bIdx) => {
           if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.width) {
              shot = true;
              bullets.splice(bIdx, 1);
           }
        });

        if (shot) {
            enemies.splice(idx, 1);
            bonusScore += 200;
            createParticles(e.x + e.width/2, e.y, '#ef4444');
            playSound('score');
            return;
        }

        if (player.x < e.x + e.width - 4 && player.x + player.width > e.x + 4 && player.y < e.y + e.width - 4 && player.y + player.height > e.y + 4) {
          if (player.vy > 0 && player.y + player.height < e.y + 15) {
             enemies.splice(idx, 1);
             player.vy = selectedChar.jumpForce; 
             bonusScore += 200;
             playSound('score');
          } else if (player.shield > 0) {
             player.shield = 0;
             enemies.splice(idx, 1);
             cameraShake = 20;
             screenFlash = 1;
             playSound('alert');
          } else if (player.jetpack > 0) {
             enemies.splice(idx, 1);
             playSound('score');
          } else {
             playSound('lose');
             setIsPlaying(false);
          }
        }
      });

      floatingTexts.forEach(ft => { ft.y -= 1.2 * normalDt; ft.alpha -= 0.02 * normalDt; });
      floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
      particles.forEach(p => { 
          p.life -= 0.04 * normalDt; 
          p.vy += GRAVITY * 0.2 * normalDt; 
          p.x += p.vx * normalDt; 
          p.y += p.vy * normalDt; 
      });
      particles = particles.filter(p => p.life > 0);
      
      trails.forEach(t => { t.life -= 0.1 * normalDt; });
      trails = trails.filter(t => t.life > 0);
      
      if (Math.abs(player.vx) > 3 || Math.abs(player.vy) > 8 || player.jetpack > 0) {
         if (Math.random() > 0.5) {
             trails.push({ x: player.x, y: player.y, life: 0.5, color: selectedChar.accent });
         }
      }

      if (player.y > canvas.height) {
        playSound('lose');
        setIsPlaying(false);
      }

      if (scoreRefDOM.current) scoreRefDOM.current.innerText = (Math.floor(maxScore) + bonusScore).toString();
    };

    const draw = (dt: number) => {
      const theme = getTheme(maxScore);
      
      ctx.fillStyle = theme.bgSolid; // Deep dark blue for synth grid
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Starfield parallax
      for(let i=1; i<40; i++) {
         let sy = (canvas.height - ((cameraY * (i%3 + 1) * 0.1) % canvas.height) + (i*17)) % canvas.height;
         let sx = (i * 23) % canvas.width;
         ctx.shadowBlur = i % 3 === 0 ? 5 : 0;
         ctx.shadowColor = theme.star;
         ctx.fillStyle = theme.star;
         ctx.fillRect(sx, sy, i%3 === 0 ? 3 : 1.5, i%3 === 0 ? 3 : 1.5);
      }
      ctx.shadowBlur = 0;
      
      // Synthwave / Retro grid background
      const gradientBg = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradientBg.addColorStop(0, theme.bgTop); 
      gradientBg.addColorStop(1, theme.bgBottom);

      ctx.fillStyle = gradientBg;
      ctx.fillRect(0, Math.max(0, canvas.height - 300), canvas.width, 300);

      ctx.strokeStyle = theme.gridColor; 
      ctx.lineWidth = 1;
      const gridSize = 50;
      const yOffset = (cameraY * 0.3) % gridSize;
      
      // Add glowing grid effect at bottom
      ctx.shadowBlur = 10;
      ctx.shadowColor = theme.gridColor;
      ctx.beginPath();
      for(let y = yOffset; y < canvas.height; y += gridSize) {
         ctx.moveTo(0, y);
         ctx.lineTo(canvas.width, y);
      }
      for(let x = 0; x < canvas.width; x += gridSize) {
         ctx.moveTo(x, 0);
         ctx.lineTo(x, canvas.height);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (adBreakTimer > 0) {
         ctx.fillStyle = `rgba(16, 185, 129, ${adBreakTimer / 400})`;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         ctx.fillStyle = `rgba(255, 255, 255, ${(adBreakTimer / 400)*0.5})`;
         ctx.font = '900 30px monospace';
         ctx.textAlign = 'center';
         ctx.fillText(t('game.fest.text.sponsor_rain'), canvas.width/2, 100);
         ctx.textAlign = 'left';
      }

      platforms.forEach(p => {
        if (p.broken) return;
        
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
            let pColor = theme.platNorm; 
            if (p.type === 'moving') { pColor = theme.platMov; }
            else if (p.type === 'breaking') { pColor = '#ef4444'; } // Red
            else if (p.type === 'boost') { pColor = '#eab308'; } // Yellow
            
            // Base rectangle
            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, PLATFORM_HEIGHT, 4);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            // Highlight inner pattern
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(p.x + 4, p.y + 2, p.width - 8, 2);
            
            // Danger stripes for breaking or boost
            if (p.type === 'breaking' || p.type === 'boost') {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(p.x, p.y + 4, p.width, PLATFORM_HEIGHT - 4, 4);
                ctx.clip();
                ctx.fillStyle = 'rgba(0,0,0,0.4)';
                for(let i=-20; i<p.width; i+=10) {
                    ctx.beginPath();
                    ctx.moveTo(p.x + i, p.y + 4);
                    ctx.lineTo(p.x + i + 5, p.y + 4);
                    ctx.lineTo(p.x + i - 5, p.y + PLATFORM_HEIGHT);
                    ctx.lineTo(p.x + i - 10, p.y + PLATFORM_HEIGHT);
                    ctx.fill();
                }
                ctx.restore();
            }

            if (p.type === 'breaking' && p.crackValue > 0) {
              ctx.strokeStyle = '#450a0a';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p.x + p.width/2, p.y);
              ctx.lineTo(p.x + p.width/2 + p.crackValue * 4, p.y + 4);
              ctx.lineTo(p.x + p.width/2 - p.crackValue * 3, p.y + 8);
              ctx.lineTo(p.x + p.width/2 + p.crackValue * 5, p.y + 12);
              ctx.stroke();
            }
            
            if (p.hasSpring) {
               ctx.fillStyle = '#64748b';
               ctx.fillRect(p.x + p.width/2 - 8, p.y - 10, 16, 10);
               ctx.fillStyle = '#f43f5e';
               ctx.shadowBlur = 10;
               ctx.shadowColor = '#f43f5e';
               ctx.fillRect(p.x + p.width/2 - 10, p.y - 14, 20, 6);
               ctx.shadowBlur = 0;
            }
        }
      });

      powerups.forEach(pw => {
        const timeOffset = Date.now() * 0.005;
        const bob = Math.sin(timeOffset + pw.x) * 3;
        
        ctx.save();
        ctx.translate(pw.x + 10, pw.y + 10 + bob);
        
        if (pw.type === 'glowstick') {
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#a7f3d0';
            ctx.beginPath();
            ctx.roundRect(2, -5, 4, 16, 2);
            ctx.fill();
            ctx.fillStyle = '#10b981';
            ctx.fillRect(2, 0, 4, 10);
            ctx.shadowBlur = 0;
        } else if (pw.type === 'vip') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#1e1b4b'; // dark retro base
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#f59e0b';
            ctx.stroke();
            // Golden star inside
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            for(let i=0; i<5; i++) {
                ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*6, -Math.sin((18+i*72)/180*Math.PI)*6);
                ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*3, -Math.sin((54+i*72)/180*Math.PI)*3);
            }
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#1e1b4b'; // dark retro base
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI*2);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#a855f7';
            ctx.stroke();
            // Magnet U shape
            ctx.strokeStyle = '#d8b4fe';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 2, 5, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-5, 2); ctx.lineTo(-5, -3);
            ctx.moveTo(5, 2); ctx.lineTo(5, -3);
            ctx.stroke();
            ctx.strokeStyle = '#ef4444'; // Red tips
            ctx.beginPath();
            ctx.moveTo(-5, -3); ctx.lineTo(-5, -4);
            ctx.moveTo(5, -3); ctx.lineTo(5, -4);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        ctx.restore();
      });

      enemies.forEach(e => {
          ctx.save();
          ctx.translate(e.x + e.width / 2, e.y + e.width / 2);
          ctx.rotate(Math.sin(Date.now() * 0.005 + e.x) * 0.1);
          
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#450a0a'; // dark red
          ctx.beginPath();
          ctx.roundRect(-e.width/2, -e.width/2, e.width, e.width, 4);
          ctx.fill();
          
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-e.width/2, -e.width/2 + 2, e.width, 4);
          
          ctx.shadowBlur = 0;
          if (e.isBouncer) {
              // Skull vector
              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.arc(0, -2, 6, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillRect(-4, 2, 8, 4);
              ctx.fillStyle = '#450a0a';
              ctx.fillRect(-3, -2, 2, 3);
              ctx.fillRect(1, -2, 2, 3);
              ctx.fillRect(-1, 2, 2, 2);
              ctx.fillStyle = 'white';
              ctx.fillRect(-2, 6, 1, 2);
              ctx.fillRect(1, 6, 1, 2);
          } else {
              // Space invader vector
              ctx.fillStyle = 'white';
              ctx.fillRect(-6, -4, 12, 6);
              ctx.fillRect(-8, -2, 2, 6);
              ctx.fillRect(6, -2, 2, 6);
              ctx.fillStyle = '#450a0a';
              ctx.fillRect(-3, -2, 2, 2);
              ctx.fillRect(1, -2, 2, 2);
              ctx.fillStyle = 'white';
              ctx.fillRect(-4, 4, 2, 2);
              ctx.fillRect(2, 4, 2, 2);
          }
          
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
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
      });

      floatingTexts.forEach(ft => {
         ctx.globalAlpha = ft.alpha;
         ctx.fillStyle = ft.color2;
         ctx.font = 'bold 12px monospace';
         ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
         ctx.fillStyle = ft.color;
         ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      if (comboTimer > 0 && comboMultiplier > 1) {
         ctx.fillStyle = `rgba(236, 72, 153, ${comboTimer / 180})`;
         ctx.font = 'bold 24px monospace';
         ctx.textAlign = 'right';
         ctx.fillText(`${comboMultiplier}x ${t('game.fest.text.combo')}`, canvas.width - 20, 60);
         ctx.textAlign = 'left';
      }

      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      update(dt);
    };

    let lastTime = performance.now();
    const gameLoop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      draw(Math.min(dt, 50));
      if (isPlaying) animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, selectedChar, upgrades]);

  const handleGameOver = () => {
     setFestCoins(prev => prev + Math.floor(score / 50));
     if (score > highScore) setHighScore(score);
  };

  useEffect(() => {
    if (!isPlaying && score > 0) handleGameOver();
  }, [isPlaying]);

  const [shopTab, setShopTab] = useState<'chars' | 'upgrades' | 'rewards'>('chars');
  const [ownedRewards, setOwnedRewards] = useState<string[]>(() => JSON.parse(localStorage.getItem('fest_rewards') || '[]'));
  useEffect(() => localStorage.setItem('fest_rewards', JSON.stringify(ownedRewards)), [ownedRewards]);

  const MARKETING_REWARDS = [
    { id: 'discount20', name: '20% OFF MERCH', desc: 'Valid at brand store', cost: 1000, type: 'discount', code: 'CYBER20' },
    { id: 'freedrink', name: 'FREE DRINK ENTRY', desc: 'Sponsor: CyberCola', cost: 2500, type: 'coupon', code: 'ENERGYROCK' },
    { id: 'vippass', name: 'VIP PASS', desc: 'Event exclusive ticket', cost: 10000, type: 'ticket', code: 'VIPFRONT26' }
  ];

  return (
    <div className={isPlaying ? "fixed inset-0 z-[100] flex flex-col items-center justify-center p-0 overflow-hidden bg-[#050510]" : "flex flex-col items-center w-full h-full max-w-full overflow-hidden font-mono select-none p-4"}>
      <div className={isPlaying ? "w-full max-w-2xl h-full max-h-screen mx-auto flex flex-col" : "w-full h-full max-w-2xl mx-auto flex flex-col"}>
      
      {/* Top HUD */}
      <div className="flex justify-between items-center w-full px-4 py-3 mb-2 bg-black/60 backdrop-blur-md rounded-t-xl border border-pink-500/20 shrink-0 z-10 shadow-[0_4px_20px_rgba(236,72,153,0.1)]">
        <div className="flex flex-col gap-1">
          <p className="text-pink-400 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]">
            <User className="w-3 h-3" /> <span>{t(selectedChar.nameKey)}</span>
          </p>
          <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-black italic tracking-widest">
            <Zap className="w-3 h-3 fill-yellow-400" />
            <span ref={coinsRefDOM} className="drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]">{festCoins} KARMAS</span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-baseline gap-2 bg-blue-500/10 px-4 py-1.5 rounded border border-blue-400/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]">
            <p ref={scoreRefDOM} className="text-2xl font-black italic tracking-tighter text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]">{score}</p>
            <span className="text-[10px] text-blue-300/60 font-mono font-bold tracking-widest uppercase">/ {highScore} PEAK</span>
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

          {!isPlaying && (
            <motion.div 
               initial={{ opacity: 0, scale: 1.05 }} 
               animate={{ opacity: 1, scale: 1 }} 
               exit={{ opacity: 0, scale: 0.95 }} 
               transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
               className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#050510]/80 backdrop-blur-xl p-4 text-center overflow-y-auto"
            >
              {!showCodeInput ? (
                <div className="w-full max-w-md flex flex-col items-center flex-1 py-6 justify-start h-full">
                  <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500 text-4xl mb-6 italic font-black uppercase drop-shadow-[0_0_15px_rgba(236,72,153,0.5)] relative inline-block tracking-widest">
                     JUMP.EXE
                     <span className="absolute -top-4 -right-12 rotate-12 text-[9px] bg-red-500/20 text-red-400 font-bold px-2 py-1 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)] backdrop-blur-sm">EXPERIMENTAL</span>
                  </h3>
                  
                  <div className="flex w-full px-2 gap-2 mb-6 shrink-0">
                    <button onClick={() => setShopTab('chars')} className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all border-b-2 ${shopTab === 'chars' ? 'border-pink-500 text-pink-400 bg-pink-500/10 shadow-[inset_0_0_10px_rgba(236,72,153,0.2)]' : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'}`}>Models</button>
                    <button onClick={() => setShopTab('upgrades')} className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all border-b-2 ${shopTab === 'upgrades' ? 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-[inset_0_0_10px_rgba(59,130,246,0.2)]' : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'}`}>Mods</button>
                    <button onClick={() => setShopTab('rewards')} className={`flex-1 py-3 text-[10px] font-black tracking-widest uppercase transition-all border-b-2 ${shopTab === 'rewards' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10 shadow-[inset_0_0_10px_rgba(234,179,8,0.2)]' : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'}`}>Rewards</button>
                  </div>

                  <div className="flex-1 w-full overflow-y-auto px-2 custom-scrollbar flex flex-col gap-3">
                    {shopTab === 'rewards' ? MARKETING_REWARDS.map(reward => (
                      <div key={reward.id} className="bg-black/50 p-4 border border-yellow-500/30 rounded-xl flex justify-between items-center text-left hover:border-yellow-500/60 transition-colors">
                         <div>
                            <p className="text-yellow-400 font-bold text-sm tracking-widest uppercase">{reward.name}</p>
                            <p className="text-white/40 text-[9px] uppercase tracking-wider">{reward.desc}</p>
                         </div>
                         {ownedRewards.includes(reward.id) ? (
                            <span className="bg-green-500/20 border border-green-500 text-green-400 px-3 py-2 text-[10px] font-bold rounded">OWNED:<br/>{reward.code}</span>
                         ) : (
                            <button onClick={() => {
                               if (festCoins >= reward.cost) {
                                  setFestCoins(prev => prev - reward.cost);
                                  setOwnedRewards(prev => [...prev, reward.id]);
                                  showMsg('REDEEMED', 'success');
                               } else showMsg('INSUFFICIENT KOINS', 'error');
                            }} className="bg-yellow-500/10 border border-yellow-500/50 px-3 py-2 rounded text-[10px] font-bold text-yellow-400 flex items-center gap-2 hover:bg-yellow-500/30 transition-colors"><Zap className="w-4 h-4"/> {reward.cost}</button>
                         )}
                      </div>
                    )) : shopTab === 'chars' ? CHARACTERS.map(char => (
                      <div key={char.id} className={`bg-black/50 p-4 border rounded-xl flex justify-between items-center text-left transition-colors ${selectedCharId === char.id ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'border-white/10 hover:border-white/30'}`}>
                         <div>
                            <p className="font-bold text-sm tracking-widest uppercase" style={{ color: char.color }}>{t(char.nameKey)}</p>
                            <p className="text-white/40 text-[9px] uppercase tracking-wider">{t(char.descKey)}</p>
                         </div>
                         {unlockedChars.includes(char.id) ? (
                            <button onClick={() => setSelectedCharId(char.id)} className={`px-4 py-2 rounded text-[10px] font-bold tracking-widest transition-colors ${selectedCharId === char.id ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white'}`}>{selectedCharId === char.id ? 'ACTIVE' : 'SELECT'}</button>
                         ) : (
                            <button onClick={() => {
                               if (festCoins >= char.price) {
                                  setFestCoins(prev => prev - char.price);
                                  setUnlockedChars(prev => [...prev, char.id]);
                                  showMsg('UNLOCKED', 'success');
                               } else showMsg('INSUFFICIENT KOINS', 'error');
                            }} className="bg-pink-500/10 border border-pink-500/50 px-3 py-2 rounded text-[10px] font-bold text-pink-400 flex items-center gap-2 hover:bg-pink-500/30 transition-colors"><Zap className="w-4 h-4"/> {char.price}</button>
                         )}
                      </div>
                    )) : (
                      ['magnet', 'jump', 'shield', 'luck'].map(type => (
                         <div key={type} className="bg-black/50 p-4 border border-blue-500/20 rounded-xl flex justify-between items-center text-left hover:border-blue-500/40 transition-colors">
                            <div>
                               <p className="text-blue-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                  {type} 
                                  <span className="text-blue-300/50 text-[10px] bg-blue-900/30 px-2 py-0.5 rounded border border-blue-500/30">LV.{upgrades[type as keyof typeof upgrades]}</span>
                               </p>
                            </div>
                            <button onClick={() => {
                               const cost = (upgrades[type as keyof typeof upgrades] + 1) * 300;
                               if (upgrades[type as keyof typeof upgrades] >= 5) showMsg('MAXIMUM LEVEL', 'info');
                               else if (festCoins >= cost) {
                                  setFestCoins(prev => prev - cost);
                                  setUpgrades(prev => ({ ...prev, [type]: prev[type as keyof typeof upgrades] + 1 }));
                                  showMsg('SYSTEM UPGRADED', 'success');
                               } else showMsg('INSUFFICIENT KOINS', 'error');
                            }} className="bg-blue-500/10 border border-blue-500/50 px-3 py-2 rounded text-[10px] font-bold text-blue-400 flex items-center gap-2 hover:bg-blue-500/30 transition-colors">{upgrades[type as keyof typeof upgrades] >= 5 ? 'MAX_LVL' : <><Zap className="w-4 h-4"/> {(upgrades[type as keyof typeof upgrades] + 1) * 300}</>}</button>
                         </div>
                      ))
                    )}
                  </div>

                  <div className="w-full mt-6 pb-4">
                    <button 
                      onClick={() => { setScore(0); setIsPlaying(true); }}
                      className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-black text-xl italic uppercase tracking-[0.3em] rounded-xl shadow-[0_0_30px_rgba(236,72,153,0.5),inset_0_2px_10px_rgba(255,255,255,0.4)] transition-all active:scale-95 border border-pink-400 group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex flex-col items-center justify-center">
                        INITIALIZE LAUNCH
                        <span className="text-[9px] text-pink-200/50 font-sans tracking-[0.5em] mt-1 -ml-1">PRESS SPACE</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                    </button>
                    
                    <button onClick={() => setShowCodeInput(true)} className="mt-4 text-[10px] text-white/30 hover:text-white/70 uppercase tracking-widest transition-colors font-bold flex items-center justify-center w-full gap-2 opacity-50"><Key size={12}/> {t('game.fest.promo.enter')}</button>
                  </div>
                </div>
              ) : (
                 <div className="flex flex-col items-center max-w-sm w-full bg-black/60 p-8 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                    <h3 className="text-white text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2"><Key className="text-pink-500" size={16}/> SYSTEM_OVERRIDE</h3>
                    <input autoFocus value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase())} className="w-full bg-black/50 border border-pink-500/30 text-pink-400 text-center text-xl tracking-[0.3em] p-4 rounded-xl uppercase placeholder:text-white/10 focus:outline-none focus:border-pink-500 shadow-[inset_0_0_20px_rgba(236,72,153,0.1)] transition-colors font-mono mb-6" placeholder="******" />
                    <div className="flex w-full gap-3">
                       <button onClick={() => setShowCodeInput(false)} className="flex-1 p-3 bg-white/5 border border-white/10 text-white/50 text-[10px] rounded-lg tracking-widest font-bold uppercase hover:bg-white/10 transition-colors">{t('game.fest.promo.abort')}</button>
                       <button onClick={handleApplyCode} className="flex-[2] p-3 bg-pink-500/20 border border-pink-500 text-pink-400 text-[10px] rounded-lg tracking-widest font-bold uppercase hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)]">{t('game.fest.promo.execute')}</button>
                    </div>
                 </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <canvas ref={canvasRef} width={360} height={640} className="w-full h-full object-contain pointer-events-auto" style={{ filter: 'contrast(1.1) brightness(1.1)', imageRendering: 'pixelated' }} />
      </div>

      {isPlaying && showMobileControls && (
        <div className="relative z-50 w-full mt-4 px-4 flex justify-between md:hidden gap-4">
          <div className="flex gap-2 w-1/2">
            <button onTouchStart={(e) => { e.preventDefault(); keysRef.current.left = true; }} onTouchEnd={(e) => { e.preventDefault(); keysRef.current.left = false; }} className="flex-1 h-16 bg-[#ced0c8] rounded shadow-[0_5px_0_#9a9b95] active:translate-y-1 active:shadow-none flex items-center justify-center text-zinc-500 font-bold border-2 border-white/50"><ChevronLeft size={24} /></button>
            <button onTouchStart={(e) => { e.preventDefault(); keysRef.current.right = true; }} onTouchEnd={(e) => { e.preventDefault(); keysRef.current.right = false; }} className="flex-1 h-16 bg-[#ced0c8] rounded shadow-[0_5px_0_#9a9b95] active:translate-y-1 active:shadow-none flex items-center justify-center text-zinc-500 font-bold border-2 border-white/50"><ChevronRight size={24} /></button>
          </div>
          <button onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' })); }} className="w-20 h-16 bg-brand-accent rounded shadow-[0_5px_0_#7f1d1d] active:translate-y-1 active:shadow-none flex items-center justify-center text-white border-2 border-red-400"><Rocket size={24} /></button>
        </div>
      )}
      </div>
    </div>
  );
}
