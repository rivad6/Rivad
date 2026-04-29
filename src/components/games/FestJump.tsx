import { useEffect, useRef, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Key, Shield, Zap, Rocket, AlertCircle, ChevronLeft, ChevronRight, Settings, Music, Target } from 'lucide-react';

interface Character {
  id: string;
  nameKey: string;
  descKey: string;
  price: number;
  jumpForce: number;
  speed: number;
  color: string;
  accent: string;
}

const CHARACTERS: Character[] = [
  { 
    id: 'default', 
    nameKey: 'game.fest.char.default', 
    descKey: 'game.fest.char.default.desc',
    price: 0, 
    jumpForce: -12, 
    speed: 8, 
    color: '#6EE7B7', 
    accent: '#f43f5e' 
  },
  { 
    id: 'punk', 
    nameKey: 'game.fest.char.punk', 
    descKey: 'game.fest.char.punk.desc',
    price: 200, 
    jumpForce: -13.5, 
    speed: 10, 
    color: '#f43f5e', 
    accent: '#6EE7B7' 
  },
  { 
    id: 'ghost', 
    nameKey: 'game.fest.char.ghost', 
    descKey: 'game.fest.char.ghost.desc',
    price: 500, 
    jumpForce: -11, 
    speed: 12, 
    color: '#ffffff', 
    accent: '#3b82f6' 
  },
  { 
    id: 'cyber', 
    nameKey: 'game.fest.char.cyber', 
    descKey: 'game.fest.char.cyber.desc',
    price: 1000, 
    jumpForce: -15, 
    speed: 9, 
    color: '#a855f7', 
    accent: '#eab308' 
  },
];

const CODES: Record<string, () => void> = {
  'RIVAD2026': () => {}, // Handled in logic
  'RICHART': () => {},
  'GODMODE': () => {},
};

import { FullscreenButton } from '../ui/FullscreenButton';

export function FestJump({ isPausedGlobal = false, hideFullscreenButton = false }: { isPausedGlobal?: boolean, hideFullscreenButton?: boolean }) {
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
  const [coupon, setCoupon] = useState<{code: string, discount: string} | null>(null);
  const [showMobileControls, setShowMobileControls] = useState(() => localStorage.getItem('fest_mobile_controls') === 'true');
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [gameStats, setGameStats] = useState<{earned: number, total: number, enemies: number, items: number} | null>(null);
  const [currentTheme, setCurrentTheme] = useState<'vaporwave' | 'matrix' | 'classic'>('classic');
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
    if (code === 'RICHART') {
      setFestCoins(prev => prev + 1000);
      showMsg('+$1000 KARMAS', 'success');
      playSound('purchase');
    } else if (code === 'GODMODE') {
      showMsg('SECRET UNLOCKED: GHOST CHARACTER', 'success');
      playSound('win');
      if (!unlockedChars.includes('ghost')) setUnlockedChars(prev => [...prev, 'ghost']);
    } else if (code === 'RIVAD2026') {
       setFestCoins(prev => prev + 5000);
       showMsg('DEVELOPER GIFT: +$5000 KARMAS', 'success');
       playSound('purchase');
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

    let animationFrameId: number;
    let particles: {x: number, y: number, life: number, color: string}[] = [];
    let powerups: {x: number, y: number, type: 'vip' | 'merch' | 'glowstick' | 'beer' | 'magnet'}[] = [];
    let enemies: {x: number, y: number, speed: number, width: number, isBouncer?: boolean, minX?: number, maxX?: number}[] = [];
    let floatingTexts: {x: number, y: number, text: string, alpha: number, color: string, color2: string}[] = [];
    let bullets: {x: number, y: number, vy: number}[] = [];
    let comboMultiplier = 1;
    let comboTimer = 0;

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
    };

    const JUMP_BOOST = upgrades.jump * 0.5;
    const MAGNET_RANGE = 150 + upgrades.magnet * 50;

    let platforms = Array.from({ length: 12 }, (_, i) => {
      const height = canvas.height - (i * 80 + 20);
      const typeRand = Math.random();
      return {
        x: (canvas.width / 2 - PLATFORM_WIDTH / 2) + Math.sin(height * 0.005) * 120,
        y: Math.max(height, 50),
        hasSpring: Math.random() > 0.9,
        type: (typeRand > 0.9) ? 'moving' : (typeRand > 0.8) ? 'breaking' : (typeRand > 0.75) ? 'phantom' : 'normal',
        vx: (typeRand > 0.9) ? (Math.random() > 0.5 ? 2 : -2) : 0,
        broken: false,
        width: PLATFORM_WIDTH,
        isStepped: false,
        crackValue: 0,
        opacity: 1,
        phantomTimer: Math.random() * 100,
      };
    });

    // Start platform: make it full width and indestructible so player never falls through instantly
    platforms[0] = { x: 0, y: canvas.height - 20, hasSpring: false, type: 'normal', vx: 0, broken: false, width: canvas.width, isStepped: false, crackValue: 0, opacity: 1, phantomTimer: 0 };

    let cameraY = 0;
    let maxScore = 0;
    let bonusScore = 0;
    let shake = 0;

    const keys = keysRef.current; // Use the ref
    let isShooting = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'ArrowRight') keys.right = true;
      if (e.key === ' ' || e.key === 'ArrowUp') isShooting = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
      if (e.key === ' ' || e.key === 'ArrowUp') isShooting = false;
    };

    const handlePointerDown = (e: any) => {
       isShooting = true;
    };
    const handlePointerUp = (e: any) => {
       isShooting = false;
    };

    const handlePointerMove = (e: any) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / canvas.height;
      const scaleY = rect.width / rect.height;
      
      let displayedWidth = rect.width;
      if (scaleX > scaleY) {
          displayedWidth = rect.height * scaleX;
      } else {
          displayedWidth = rect.width;
      }
      
      const offsetX = (rect.width - displayedWidth) / 2;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      
      const targetX = ((clientX - rect.left - offsetX) / displayedWidth) * canvas.width - player.width / 2;
      player.x = targetX;
      player.vx = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    canvas.addEventListener('touchend', handlePointerUp);

    const createParticles = (x: number, y: number, color = '#ffffff') => {
      for(let i=0; i<8; i++) {
        particles.push({
          x: x + Math.random()*20, 
          y: y + Math.random()*5, 
          life: 1.0,
          color
        });
      }
    };

    const addFloatingText = (x: number, y: number, text: string, color = 'white', color2 = 'black') => {
      floatingTexts.push({ x, y, text, alpha: 1, color, color2 });
    };

    const spawnEnemy = (platform?: any) => {
      if (maxScore > 1000 && Math.random() > 0.98 && !platform) {
        enemies.push({
          x: Math.random() > 0.5 ? -40 : canvas.width + 40,
          y: -100,
          speed: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
          width: 32
        });
      } else if (platform && maxScore > 3000 && Math.random() > 0.9) {
        enemies.push({
          x: platform.x,
          y: platform.y - 32,
          speed: 1.5 * (Math.random() > 0.5 ? 1 : -1),
          width: 32,
          isBouncer: true,
          minX: platform.x,
          maxX: platform.x + platform.width - 32
        });
      }
    };

    const spawnPowerup = (platform: any) => {
       const rand = Math.random();
       if (rand > 0.98) {
         powerups.push({
           x: platform.x + 10,
           y: platform.y - 20,
           type: 'vip'
         });
       } else if (rand > 0.96) {
         powerups.push({
           x: platform.x + 10,
           y: platform.y - 20,
           type: 'merch'
         });
       } else if (rand > 0.94) {
         powerups.push({
           x: platform.x + 10,
           y: platform.y - 20,
           type: 'magnet'
         });
       } else if (rand > 0.90) {
         powerups.push({
           x: platform.x + 10,
           y: platform.y - 20,
           type: 'beer'
         });
       } else if (rand > 0.75) {
         powerups.push({
           x: platform.x + platform.width / 2 - 5,
           y: platform.y - 15,
           type: 'glowstick'
         });
       }
    };

    const drawPlayer = (x: number, y: number) => {
      const drawInstance = (ix: number, iy: number) => {
        ctx.save();
        if (shake > 0) ctx.translate(Math.random()*shake - shake/2, Math.random()*shake - shake/2);
        
        // Body with squash/stretch
        let stretchX = 1;
        let stretchY = 1;
        if (player.vy < -5) { stretchX = 0.8; stretchY = 1.2; }
        else if (player.vy > 5) { stretchX = 0.9; stretchY = 1.1; }
        
        const pWidth = player.width * stretchX;
        const pHeight = player.height * stretchY;
        const pOffsetX = (player.width - pWidth) / 2;
        const pOffsetY = (player.height - pHeight);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(ix + 4 + pOffsetX, iy + 4 + pOffsetY, pWidth, pHeight);

        // Trail for ghost
        if (selectedChar.id === 'ghost') {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = selectedChar.color;
          ctx.fillRect(ix - player.vx + pOffsetX, iy - player.vy + pOffsetY, pWidth, pHeight);
          ctx.globalAlpha = 1;
        }

        // Body
        ctx.fillStyle = selectedChar.color;
        ctx.fillRect(ix + pOffsetX, iy + pOffsetY, pWidth, pHeight);
        
        // Glasses/Accent
        ctx.fillStyle = selectedChar.accent;
        ctx.fillRect(ix + 2 + pOffsetX, iy + pOffsetY + (6 * stretchY), pWidth - 4, 6 * stretchY);
        
        // Trunk
        ctx.fillStyle = selectedChar.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(ix + player.width/2 - 2, iy + player.height, 4, 8);
        ctx.globalAlpha = 1;

        // Shield Effect
        if (player.shield > 0) {
          ctx.beginPath();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.arc(ix + player.width/2, iy + player.height/2, 20 + Math.sin(Date.now()*0.01)*2, 0, Math.PI*2);
          ctx.stroke();
        }

        // Magnet Effect
        if (player.magnet > 0) {
          ctx.beginPath();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.arc(ix + player.width/2, iy + player.height/2, 30 + Math.cos(Date.now()*0.01)*5, 0, Math.PI*2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Jetpack Effect
        if (player.jetpack > 0) {
          createParticles(ix + player.width/2 - 4, iy + player.height, '#f59e0b');
        }

        ctx.restore();
      };

      drawInstance(x, y);
      if (x < 0) drawInstance(x + canvas.width, y);
      if (x + player.width > canvas.width) drawInstance(x - canvas.width, y);
    };

    let gameState: 'ready' | 'playing' | 'gameover' = 'ready';
    let readyTimer = 120; // 2 seconds at 60fps

    let screenFlash = 0;
    let enemiesDefeated = 0;
    let itemsCollected = 0;

    const update = (dt: number) => {
      if (isPausedGlobal || pausedRef.current) return;
      const normalDt = dt / 16.666; // Normalized to 60fps
      
      if (gameState === 'ready') {
        readyTimer -= normalDt;
        if (readyTimer <= 0) gameState = 'playing';
        return;
      }
      if (gameState === 'gameover') return;

      if (shake > 0) shake *= Math.pow(0.9, normalDt);
      if (screenFlash > 0) screenFlash *= Math.pow(0.8, normalDt);

      // Shooting
      if (isShooting && Date.now() - player.lastShot > 300) {
         player.lastShot = Date.now();
         bullets.push({
           x: player.x + player.width / 2,
           y: player.y,
           vy: -15
         });
         playSound('score'); 
      }

      // Bullets
      bullets.forEach(b => {
         b.y += b.vy * normalDt;
      });
      bullets = bullets.filter(b => b.y > -50);

      // Movement
      if (keys.left) player.vx -= 1 * normalDt;
      else if (keys.right) player.vx += 1 * normalDt;
      else player.vx *= Math.pow(0.8, normalDt);

      player.vx = Math.max(-selectedChar.speed, Math.min(selectedChar.speed, player.vx));
      player.x += player.vx * normalDt;
      
      if (player.jetpack > 0) {
        player.vy = -15;
        player.jetpack -= normalDt;
      } else {
        player.vy += GRAVITY * normalDt;
      }
      player.y += player.vy * normalDt;

      if (player.x < 0) player.x += canvas.width;
      if (player.x >= canvas.width) player.x -= canvas.width;

      // Camera follow
      let vDiff = 0;
      if (player.y < canvas.height * 0.4) {
        vDiff = canvas.height * 0.4 - player.y;
        cameraY += vDiff;
        player.y = canvas.height * 0.4;
        maxScore = Math.floor(cameraY);
      }
      
      const displayScore = Math.floor(maxScore) + bonusScore;
      if (scoreRefDOM.current && displayScore !== parseInt(scoreRefDOM.current.innerText)) {
         scoreRefDOM.current.innerText = displayScore.toString();
      }

      if (vDiff > 0) {
        platforms.forEach((p) => {
          p.y += vDiff;
          if (p.y > canvas.height) {
            let minY = Math.min(...platforms.map(p2 => p2.y));
            p.y = minY - (Math.random() * 40 + 75);
            
            const isMoving = Math.random() < Math.min(0.5, maxScore / 20000);
            const isBreaking = !isMoving && Math.random() < Math.min(0.4, maxScore / 25000);
            const isGlass = !isMoving && !isBreaking && Math.random() < Math.min(0.3, maxScore / 30000);
            const isPhantom = !isMoving && !isBreaking && !isGlass && Math.random() < 0.15;
            const isBoost = !isMoving && !isBreaking && !isGlass && !isPhantom && Math.random() < 0.08;

            p.type = isMoving ? 'moving' : isBreaking ? 'breaking' : isGlass ? 'glass' : isPhantom ? 'phantom' : isBoost ? 'boost' : 'normal';
            p.vx = isMoving ? (Math.random() * 2 + 1 + (maxScore / 10000)) * (Math.random() > 0.5 ? 1 : -1) : 0;
            p.broken = false;
            p.crackValue = 0;
            p.isStepped = false;
            p.opacity = 1;

            if (p.type !== 'breaking' && p.type !== 'phantom' && p.type !== 'boost') {
              spawnPowerup(p);
            }
            if (p.type !== 'phantom') {
              spawnEnemy(p);
            }
            spawnEnemy();
          }
        });

        enemies.forEach(e => e.y += vDiff);
        powerups.forEach(pw => pw.y += vDiff);
        bullets.forEach(b => b.y += vDiff);
      }

      const playerRects = [
        { x: player.x, w: player.width },
        { x: player.x + canvas.width, w: player.width },
        { x: player.x - canvas.width, w: player.width }
      ];

      // Collisions Platforms
      if (player.vy > 0) {
        platforms.forEach(p => {
          if (p.broken) return;
          if (p.type === 'phantom' && p.opacity < 0.3) return; 
          
          if (p.type === 'moving') {
            p.x += p.vx * normalDt;
            if (p.x < -p.width) p.x += canvas.width + p.width;
            if (p.x > canvas.width) p.x -= canvas.width + p.width;
          }

          let hit = false;
          for (const pr of playerRects) {
            if (
              pr.x + 4 < p.x + p.width &&
              pr.x + pr.w - 4 > p.x &&
              player.y + player.height >= p.y &&
              player.y + player.height <= p.y + PLATFORM_HEIGHT + player.vy * normalDt
            ) {
              hit = true;
              break;
            }
          }

          if (hit) {
            const distFromCenter = Math.abs((player.x + player.width/2) - (p.x + p.width/2));
            const isPerfect = distFromCenter < 10;
            
            if (p.type === 'boost') {
               player.vy = -22;
               playSound('powerup');
               shake = 18;
               screenFlash = 0.6;
               addFloatingText(player.x, player.y, 'SONIC BOOST!!', '#facc15');
               comboMultiplier += 2;
               comboTimer = 180 + (upgrades.luck * 60);
               return;
            }

            if (comboTimer > 0) {
              bonusScore += 10 * comboMultiplier;
              addFloatingText(player.x, player.y - 10, `+${Math.floor(10*comboMultiplier)}`, '#facc15');
            } else {
              comboMultiplier = 1;
            }

            if (isPerfect) {
              bonusScore += 50 * comboMultiplier;
              setFestCoins(prev => prev + 2);
              createParticles(p.x + p.width/2, p.y, '#ffffff');
              shake = 5;
              comboMultiplier++;
              comboTimer = 180 + (upgrades.luck * 60);
              addFloatingText(player.x, player.y - 20, 'PERFECT!', '#ec4899', '#be185d');
            }

            player.vy = (p.hasSpring ? selectedChar.jumpForce * 1.85 : selectedChar.jumpForce) - JUMP_BOOST;
            if (p.type === 'breaking') {
              p.broken = true;
              createParticles(p.x + p.width/2, p.y + PLATFORM_HEIGHT/2, '#9ca3af');
              playSound('hit');
            } else if (p.type === 'glass') {
              p.isStepped = true;
              playSound('click');
            } else if (p.hasSpring) {
               shake = 10;
               playSound('score');
            } else {
               playSound('click');
               createParticles(player.x + player.width/2, player.y + player.height, selectedChar.color);
            }
          }
        });
      } else {
        platforms.forEach(p => {
          if (p.broken) return;
          if (p.type === 'phantom') {
             p.phantomTimer = (p.phantomTimer || 0) + normalDt;
             p.opacity = 0.5 + Math.sin(p.phantomTimer * 0.05) * 0.5;
          }
          if (p.isStepped && p.type === 'glass') {
             p.crackValue = (p.crackValue || 0) + 0.06 * normalDt;
             if (p.crackValue >= 1) {
                p.broken = true;
                playSound('hit');
                createParticles(p.x + p.width/2, p.y + PLATFORM_HEIGHT/2, '#93c5fd');
             }
          }
          if (p.type === 'moving') {
            p.x += p.vx * normalDt;
            if (p.x < -p.width) p.x += canvas.width + p.width;
            if (p.x > canvas.width) p.x -= canvas.width + p.width;
          }
        });
      }

      // Combo update
      if (comboTimer > 0) comboTimer -= normalDt;
      else comboMultiplier = 1;

      // Powerups logic
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
        
        let collected = false;
        for (const pr of playerRects) {
          if (pr.x < pw.x + 20 && pr.x + pr.w > pw.x && player.y < pw.y + 20 && player.y + player.height > pw.y) {
            collected = true;
            break;
          }
        }

        if (collected) {
          itemsCollected++;
          if (pw.type === 'vip') {
            setFestCoins(prev => prev + 50);
            bonusScore += 500;
            playSound('powerup');
            addFloatingText(pw.x, pw.y, 'VIP +50!', '#f59e0b', '#78350f');
          } else if (pw.type === 'merch') {
            player.shield = 1;
            playSound('powerup');
            addFloatingText(pw.x, pw.y, 'SHIELD ON', '#3b82f6');
          } else if (pw.type === 'glowstick') {
            setFestCoins(prev => prev + 5);
            addFloatingText(pw.x, pw.y, '+5 KARMAS', '#10b981');
            playSound('score');
          } else if (pw.type === 'beer') {
            player.jetpack = 180;
            playSound('start');
            addFloatingText(pw.x, pw.y, 'HYPER BEAT!', '#facc15');
            screenFlash = 0.4;
          } else if (pw.type === 'magnet') {
            player.magnet = 600;
            playSound('powerup');
            addFloatingText(pw.x, pw.y, 'ATTRACTOR!', '#a855f7');
          }
          powerups.splice(idx, 1);
        }
      });

      // Enemies behavior
      enemies.forEach((e, index) => {
        e.x += e.speed * normalDt;
        if (e.isBouncer && e.minX !== undefined && e.maxX !== undefined) {
           if (e.x < e.minX || e.x > e.maxX) e.speed *= -1;
        } else {
           if (e.x < -50 || e.x > canvas.width + 50) e.speed *= -1;
        }

        let shot = false;
        bullets.forEach((b, bIndex) => {
           if (b.x > e.x && b.x < e.x + e.width && b.y > e.y && b.y < e.y + e.width) {
              shot = true;
              bullets.splice(bIndex, 1);
           }
        });
        
        if (shot) {
            enemies.splice(index, 1);
            bonusScore += 200 * comboMultiplier;
            addFloatingText(e.x, e.y, `BOOM! +${Math.floor(200*comboMultiplier)}`, '#facc15');
            createParticles(e.x + e.width/2, e.y, '#ef4444');
            playSound('score');
            comboMultiplier++;
            comboTimer = 180;
            enemiesDefeated++;
            return;
        }

        let hit = false;
        for (const pr of playerRects) {
          if (pr.x < e.x + e.width - 4 && pr.x + pr.w > e.x + 4 && player.y < e.y + e.width - 4 && player.y + player.height > e.y + 4) {
            hit = true;
            break;
          }
        }

        if (hit) {
          if (player.vy > 0 && player.y + player.height < e.y + 15) {
             enemies.splice(index, 1);
             player.vy = selectedChar.jumpForce; 
             bonusScore += 200 * comboMultiplier;
             addFloatingText(e.x, e.y, `STOMP! +${Math.floor(200*comboMultiplier)}`, '#facc15');
             createParticles(e.x + e.width/2, e.y, '#ef4444');
             playSound('score');
             shake = 8;
             comboMultiplier++;
             comboTimer = 180;
             enemiesDefeated++;
          } else if (player.shield > 0) {
            player.shield = 0;
            enemies.splice(index, 1);
            shake = 18;
            screenFlash = 1;
            playSound('alert');
          } else if (player.jetpack > 0) {
            enemies.splice(index, 1);
            createParticles(e.x + e.width/2, e.y, '#ef4444');
            playSound('score');
            enemiesDefeated++;
          } else {
             playSound('lose');
             setIsPlaying(false);
          }
        }
      });
      
      // Update auxiliary visual entities
      floatingTexts.forEach(ft => {
         ft.y -= 1.2 * normalDt;
         ft.alpha -= 0.02 * normalDt;
      });
      floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);

      particles.forEach(p => {
        p.life -= 0.04 * normalDt;
        p.y += 1.5 * normalDt;
        p.x += (Math.random() - 0.5) * normalDt;
      });
      particles = particles.filter(p => p.life > 0);

      // Game Over
      if (player.y > canvas.height) {
        playSound('lose');
        setIsPlaying(false);
      }
    };

    // Parallax layers
    const parallaxLayers = Array.from({ length: 3 }, (_, i) => {
      return Array.from({ length: 5 }, (_, j) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 50 + i * 100,
        speed: 0.1 + i * 0.1,
        color: i === 0 ? 'rgba(255,255,255,0.03)' : i === 1 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)',
        type: Math.random() > 0.5 ? 'speaker' : 'mountain'
      }));
    });

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // BG with dynamic gradient
      if (currentTheme === 'matrix') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'rgba(0, 255, 70, 0.15)';
        ctx.font = '10px monospace';
        for(let i=0; i<30; i++) {
          const x = (i * 15) % canvas.width;
          const y = (cameraY * 0.2 + i * 100) % canvas.height;
          ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y);
          ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, (y + 200) % canvas.height);
        }
      } else if (currentTheme === 'vaporwave') {
        // Vaporwave Sun and Grid
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#ff0080');
        skyGrad.addColorStop(0.5, '#7000ff');
        skyGrad.addColorStop(1, '#000000');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Retro Sun
        const sunY = 150 + Math.sin(cameraY * 0.0001) * 20;
        const sunGrad = ctx.createLinearGradient(0, sunY - 60, 0, sunY + 60);
        sunGrad.addColorStop(0, '#fde047');
        sunGrad.addColorStop(0.5, '#f97316');
        sunGrad.addColorStop(1, '#ef4444');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(canvas.width/2, sunY, 60, 0, Math.PI*2);
        ctx.fill();

        // Scanlines over sun
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for(let i=0; i<10; i++) {
          ctx.fillRect(canvas.width/2 - 60, sunY - 40 + i * 10, 120, 2);
        }

        // Perspective Grid
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        const gridY = (cameraY * 0.5) % 40;
        for(let i=0; i<canvas.width; i+=40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, canvas.height);
          ctx.stroke();
        }
        for(let i=0; i<canvas.height; i+=40) {
          ctx.beginPath();
          ctx.moveTo(0, i + gridY);
          ctx.lineTo(canvas.width, i + gridY);
          ctx.stroke();
        }
      } else {
        // Classic Festival Theme
        const bgColorTop = cameraY < 2000 ? '#0a0a1a' : cameraY < 6000 ? '#022c22' : cameraY < 12000 ? '#1e1b4b' : '#3b0764';
        const bgColorBot = cameraY < 2000 ? '#1e1b4b' : cameraY < 6000 ? '#065f46' : cameraY < 12000 ? '#3730a3' : '#000000';
        
        let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGrad.addColorStop(0, bgColorTop);
        bgGrad.addColorStop(1, bgColorBot);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Parallax Silhouettes
      parallaxLayers.forEach((layer, i) => {
        const speed = 0.1 + i * 0.15;
        layer.forEach(p => {
          let y = (p.y + cameraY * speed) % (canvas.height + p.size) - p.size;
          ctx.fillStyle = p.color;
          if (p.type === 'speaker') {
            ctx.fillRect(p.x, y, p.size, p.size * 1.5);
            ctx.beginPath();
            ctx.arc(p.x + p.size/2, y + p.size/3, p.size/4, 0, Math.PI*2);
            ctx.arc(p.x + p.size/2, y + p.size, p.size/3, 0, Math.PI*2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.moveTo(p.x, y + p.size);
            ctx.lineTo(p.x + p.size/2, y);
            ctx.lineTo(p.x + p.size, y + p.size);
            ctx.fill();
          }
        });
      });

      // Stars with depth parallax
      for(let i=0; i<80; i++) {
        const layer = (i % 4) + 1;
        const speed = layer * 0.05;
        let sy = (cameraY * speed + i * 50) % canvas.height;
        let sx = (i * 137 + Math.sin(cameraY*0.001 + i)*20) % canvas.width;
        let brightness = Math.sin(Date.now()*0.002 + i) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.25 * layer})`;
        ctx.beginPath();
        ctx.arc(sx, sy, layer * 0.8, 0, Math.PI*2);
        ctx.fill();
      }

      // Festival Lasers and Spotlights
      ctx.globalCompositeOperation = 'screen';
      for(let i=0; i<4; i++) {
         const angle = Math.sin(Date.now() * 0.001 + i) * 0.5 + (i%2 ? Math.PI/4 : -Math.PI/4);
         const originX = (i * canvas.width) / 3;
         const originY = canvas.height;
         
         ctx.save();
         ctx.translate(originX, originY);
         ctx.rotate(angle);
         
         let laserGrad = ctx.createLinearGradient(0, 0, 0, -canvas.height*1.5);
         laserGrad.addColorStop(0, `rgba(${i%2===0 ? '255,0,255' : '0,255,255'}, 0.3)`);
         laserGrad.addColorStop(1, 'rgba(0,0,0,0)');
         
         ctx.fillStyle = laserGrad;
         ctx.beginPath();
         ctx.moveTo(-10, 0);
         ctx.lineTo(10, 0);
         ctx.lineTo(80, -canvas.height*1.5);
         ctx.lineTo(-80, -canvas.height*1.5);
         ctx.fill();
         ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';

      // Floating Geometric Shapes
      ctx.globalAlpha = 0.05;
      for (let i = 0; i < 5; i++) {
         const speed = 0.1 + i * 0.02;
         const yPos = (cameraY * speed + i * 200) % (canvas.height + 200) - 100;
         const xPos = (i * 80 + Math.sin(cameraY * 0.002 + i)*100) % canvas.width;
         ctx.save();
         ctx.translate(xPos, canvas.height - yPos);
         ctx.rotate((cameraY * 0.01 + i) * (i%2 ? 1 : -1));
         ctx.fillStyle = i % 2 === 0 ? selectedChar.accent : '#ffffff';
         ctx.beginPath();
         if (i % 3 === 0) {
            ctx.rect(-30, -30, 60, 60);
         } else if (i % 3 === 1) {
            ctx.arc(0, 0, 40, 0, Math.PI * 2);
         } else {
            ctx.moveTo(0, -40);
            ctx.lineTo(35, 20);
            ctx.lineTo(-35, 20);
            ctx.closePath();
         }
         ctx.fill();
         ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Cosmic Fog (Glowing auras)
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 4; i++) {
        const offset = (cameraY * (0.15 + i * 0.05)) % (canvas.height * 1.5) - canvas.height/2;
        ctx.fillStyle = i % 2 === 0 ? selectedChar.accent : selectedChar.color;
        ctx.beginPath();
        ctx.arc(canvas.width/2 + Math.sin(offset*0.003 + i)*200, offset, 150 + i*30, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Spiral Guide Rail (Dashed line with glow)
      ctx.beginPath();
      ctx.setLineDash([4, 12]);
      ctx.strokeStyle = `rgba(255,255,255,${0.1 + Math.sin(Date.now()*0.002)*0.05})`;
      ctx.lineWidth = 2;
      for(let y = -50; y < canvas.height + 50; y += 10) {
        const absY = cameraY - y + canvas.height;
        const x = (canvas.width / 2) + Math.sin(absY * 0.003) * 140;
        if (y === -50) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Stage Name Text Background
      let currentStageName = "Underground";
      if (maxScore > 10000) currentStageName = "Cosmos";
      else if (maxScore > 5000) currentStageName = "Afterparty";
      else if (maxScore > 2000) currentStageName = "VIP Lounge";
      else if (maxScore > 500) currentStageName = "Main Stage";

      ctx.save();
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(-Math.PI/4);
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.font = '900 80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentStageName.toUpperCase(), 0, 0);
      ctx.restore();

      const drawWithWrap = (origX: number, drawFn: (x: number) => void) => {
        drawFn(origX);
        drawFn(origX - canvas.width);
        drawFn(origX + canvas.width);
      };

      // Platforms
      platforms.forEach(p => {
        if (p.broken) return; // don't draw broken platforms

        drawWithWrap(p.x, (pX) => {
          // Platform drop shadow
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(pX + 4, p.y + 4, p.width, PLATFORM_HEIGHT);

          // Sub-structure (Truss)
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.15)';
          ctx.lineWidth = 1;
          for(let i=0; i<p.width; i+=10) {
             ctx.moveTo(pX + i, p.y + PLATFORM_HEIGHT);
             ctx.lineTo(pX + i + 5, p.y + PLATFORM_HEIGHT + 8);
             ctx.lineTo(pX + i + 10, p.y + PLATFORM_HEIGHT);
          }
          ctx.stroke();

          let pColor = '#a7f3d0';
          if (p.type === 'moving') pColor = '#60a5fa';
          else if (p.type === 'breaking') pColor = '#fca5a5';
          else if (p.type === 'glass') pColor = `rgba(147, 197, 253, ${0.8 - (p.crackValue || 0)})`;
          else if (p.type === 'phantom') pColor = `rgba(168, 85, 247, ${p.opacity * 0.8})`;
          else if (p.type === 'boost') pColor = '#facc15';
          else if (cameraY > 5000) pColor = '#e879f9';
          
          if (p.hasSpring) pColor = '#fde047';

          // Base structure
          ctx.fillStyle = (p.type === 'glass' || p.type === 'phantom') ? 'rgba(0,0,0,0)' : '#171717';
          ctx.fillRect(pX, p.y, p.width, PLATFORM_HEIGHT);

          // Top Stage surface
          ctx.fillStyle = pColor;
          ctx.globalAlpha = p.type === 'phantom' ? p.opacity : 1;
          ctx.fillRect(pX, p.y, p.width, (p.type === 'glass' || p.type === 'phantom') ? PLATFORM_HEIGHT : 3);
          ctx.globalAlpha = 1;

          if (p.type === 'boost') {
            // Draw animated arrows
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            const arrowPos = (Date.now() * 0.01) % 10;
            for(let i=0; i<p.width; i+=15) {
               ctx.beginPath();
               ctx.moveTo(pX + i + 2, p.y + 10 - arrowPos);
               ctx.lineTo(pX + i + 6, p.y + 4 - arrowPos);
               ctx.lineTo(pX + i + 10, p.y + 10 - arrowPos);
               ctx.stroke();
            }
          }
          
          if (p.type === 'glass') {
             ctx.strokeStyle = `rgba(255,255,255,${0.5 - (p.crackValue || 0)})`;
             ctx.strokeRect(pX, p.y, p.width, PLATFORM_HEIGHT);
             if (p.crackValue > 0) {
                // Draw cracks
                ctx.beginPath();
                ctx.moveTo(pX + 10, p.y);
                ctx.lineTo(pX + 20, p.y + PLATFORM_HEIGHT);
                ctx.moveTo(pX + p.width - 15, p.y);
                ctx.lineTo(pX + p.width - 25, p.y + PLATFORM_HEIGHT);
                ctx.stroke();
             }
          }

          // Speaker Details
          if (p.width >= 40) {
             ctx.fillStyle = 'black';
             ctx.beginPath();
             ctx.arc(pX + 10, p.y + PLATFORM_HEIGHT/2 + 1, 3, 0, Math.PI*2);
             ctx.arc(pX + p.width - 10, p.y + PLATFORM_HEIGHT/2 + 1, 3, 0, Math.PI*2);
             ctx.fill();
             ctx.strokeStyle = '#333';
             ctx.stroke();
          }

          // Styling Details
          if (p.type === 'breaking') {
             ctx.beginPath();
             ctx.strokeStyle = '#7f1d1d';
             ctx.lineWidth = 1;
             ctx.moveTo(pX + 10, p.y);
             ctx.lineTo(pX + 15, p.y + PLATFORM_HEIGHT);
             ctx.moveTo(pX + 30, p.y);
             ctx.lineTo(pX + 25, p.y + PLATFORM_HEIGHT);
             ctx.stroke();
          }

          // Reflection
          ctx.fillStyle = 'rgba(255,255,255,0.25)';
          ctx.fillRect(pX, p.y, p.width, 2);

          if (p.hasSpring) {
             ctx.fillStyle = '#ca8a04';
             const jumpPulse = Math.sin(Date.now() * 0.015) * 1.5;
             ctx.fillRect(pX + p.width/2 - 10, p.y - 4 + jumpPulse, 20, 4);
          }
        });
      });

      // Powerups
      powerups.forEach(pw => {
        drawWithWrap(pw.x, (pwX) => {
          if (pw.type === 'glowstick') {
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.roundRect(pwX + 12, pw.y + 5, 4, 16, 2);
            ctx.fill();
            // Glow effect
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#6ee7b7';
            ctx.fill();
            ctx.shadowBlur = 0;
          } else if (pw.type === 'beer') {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.fillText('🍺', pwX + 2, pw.y + 18);
          } else if (pw.type === 'magnet') {
            ctx.fillStyle = '#a855f7';
            ctx.beginPath();
            ctx.arc(pwX + 10, pw.y + 10, 10, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText('🧲', pwX + 2, pw.y + 14);
          } else {
            ctx.fillStyle = pw.type === 'vip' ? '#f59e0b' : '#3b82f6';
            ctx.beginPath();
            ctx.arc(pwX + 10, pw.y + 10, 10, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(pw.type === 'vip' ? '🎟️' : '👕', pwX + 2, pw.y + 14);
          }
        });
      });

      // Enemies
      enemies.forEach(e => {
        drawWithWrap(e.x, (eX) => {
          ctx.fillStyle = '#171717';
          ctx.beginPath();
          ctx.roundRect(eX, e.y, e.width, e.width, 4);
          ctx.fill();
          
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(eX, e.y, e.width, 4); // red cap line

          ctx.fillStyle = 'white';
          ctx.font = '18px Arial';
          ctx.fillText('🙅‍♂️', eX + 6, e.y + 22);
        });
      });

      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      // Player
      drawPlayer(player.x, player.y);

      // Bullets
      bullets.forEach(b => {
        drawWithWrap(b.x, (bX) => {
          ctx.beginPath();
          ctx.arc(bX, b.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15';
          ctx.fill();
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#eab308';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      });

      // Floating Texts
      floatingTexts.forEach(ft => {
         ctx.globalAlpha = ft.alpha;
         ctx.fillStyle = ft.color2;
         ctx.font = 'bold 12px monospace';
         ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
         ctx.fillStyle = ft.color;
         ctx.fillText(ft.text, ft.x, ft.y);
      });
      ctx.globalAlpha = 1;

      // Combo Meter UI
      if (comboTimer > 0 && comboMultiplier > 1) {
         ctx.fillStyle = `rgba(236, 72, 153, ${comboTimer / 180})`;
         ctx.font = 'bold 24px monospace';
         ctx.textAlign = 'right';
         ctx.fillText(`${comboMultiplier}x COMBO!`, canvas.width - 20, 60);
         
         // Combo bar
         ctx.fillStyle = 'rgba(255,255,255,0.2)';
         ctx.fillRect(canvas.width - 120, 70, 100, 4);
         ctx.fillStyle = '#f43f5e';
         ctx.fillRect(canvas.width - 120, 70, 100 * (comboTimer / 180), 4);
         ctx.textAlign = 'left';
      }

      update(dt);

      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (gameState === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.textAlign = 'center';
        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = '#fcfcfc';
        const msg = readyTimer > 40 ? t('game.fest.ready') : t('game.fest.go');
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText(t('game.fest.instruction_short'), canvas.width / 2, canvas.height / 2 + 60);
      }
    };

    let lastTime = performance.now();
    const TIME_STEP = 1000 / 60;

    let lastShield = -1;
    let lastJetpack = -1;

    const gameLoop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      
      const effectiveDt = Math.min(dt, 50); 
      
      if (player.shield !== lastShield) {
        lastShield = player.shield;
        setHudShield(player.shield);
      }
      if (player.jetpack !== lastJetpack) {
        lastJetpack = player.jetpack;
        setHudJetpack(player.jetpack);
      }

      draw(effectiveDt);

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(gameLoop);
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('touchmove', handlePointerMove);
    };
  }, [isPlaying, selectedChar, currentTheme]);

  const handleGameOver = () => {
     const earned = Math.floor(score / 50);
     if (earned > 0) {
       setFestCoins(prev => prev + earned);
     }
  };

  useEffect(() => {
    if (!isPlaying && score > 0) {
      handleGameOver();
    }
  }, [isPlaying]);

  const buyChar = (char: Character) => {
    if (festCoins >= char.price) {
      setFestCoins(prev => prev - char.price);
      setUnlockedChars(prev => [...prev, char.id]);
      showMsg(`DESBLOQUEADO: ${t(char.nameKey)}`, 'success');
      playSound('purchase');
    } else {
      showMsg('KARMAS INSUFICIENTES', 'error');
      playSound('alert');
    }
  };

  const buyUpgrade = (type: keyof typeof upgrades) => {
    const cost = (upgrades[type] + 1) * 300;
    if (festCoins >= cost) {
       setFestCoins(prev => prev - cost);
       setUpgrades(prev => ({ ...prev, [type]: prev[type] + 1 }));
       showMsg(`UPGRADED: ${(type as string).toUpperCase()} LV. ${upgrades[type] + 1}`, 'success');
       playSound('purchase');
    } else {
       showMsg(`NEED ${cost} KARMAS`, 'error');
       playSound('alert');
    }
  };

  const [shopTab, setShopTab] = useState<'chars' | 'upgrades'>('chars');

  const UPGRADE_DATA = [
    { key: 'magnet' as const, icon: <Zap className="w-3 h-3" />, name: 'MAGNET POW', desc: 'Attract items from further' },
    { key: 'jump' as const, icon: <ChevronRight className="w-3 h-3 rotate-[-90deg]" />, name: 'LEAP SKILL', desc: 'Jump higher by default' },
    { key: 'shield' as const, icon: <Shield className="w-3 h-3" />, name: 'START SHIELD', desc: 'Survive one initial hit' },
    { key: 'luck' as const, icon: <Rocket className="w-3 h-3" />, name: 'HYPE MASTERY', desc: 'Combos last much longer' },
  ];

  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }
  }, [isPlaying]);

  return (
    <div className={isPlaying ? "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden" : "flex flex-col items-center w-full max-w-full overflow-hidden font-[var(--font-pixel)] select-none p-4"}>
      <div className={isPlaying ? "w-full min-w-[300px] max-w-[500px] h-full max-h-screen mx-auto flex flex-col" : "w-full max-w-[400px] mx-auto flex flex-col"}>
      <div className="flex justify-between items-end w-full px-4 md:px-6 py-2 md:py-4 mb-2 md:mb-4 text-[#fcfcfc] bg-zinc-900/50 rounded-2xl border border-white/5 backdrop-blur-sm shrink-0 pt-4">
        <div>
          <p className="text-brand-accent flex items-center gap-2 text-[8px] md:text-[10px] uppercase font-bold tracking-tighter opacity-80">
            <User className="w-2.5 h-2.5 md:w-3 md:h-3" />
            <span className="truncate max-w-[80px] md:max-w-none">{t(selectedChar.nameKey)}</span>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button 
                onClick={(e) => { e.stopPropagation(); playSound('hover'); setShowMobileControls(prev => !prev); }} 
                className={`flex items-center gap-1 uppercase text-[6px] md:text-[7px] font-bold border px-1 md:px-1.5 py-0.5 transition-all ${showMobileControls ? 'bg-[#6EE7B7]/10 border-[#6EE7B7] text-[#6EE7B7]' : 'text-zinc-500 border-zinc-800 hover:border-zinc-500'}`}
              >
                <Settings className="w-2 h-2" /> {showMobileControls ? 'ON' : 'OFF'}
              </button>
              <button 
                onClick={() => { pausedRef.current = !pausedRef.current; playSound('click'); }}
                className="p-1 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
              >
                <Rocket size={12} />
              </button>
          </div>
        </div>
          <div className="flex items-baseline gap-1">
            <p ref={scoreRefDOM} className="text-2xl md:text-4xl font-black italic tracking-tighter">{score}</p>
            <span className="text-[8px] md:text-[10px] text-zinc-500 font-mono">/ {highScore} HI</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end justify-end w-full px-2 mb-2">
          <div className="flex items-center gap-2 text-yellow-400 px-2 md:px-3 py-0.5 md:py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20 mb-1">
            <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-yellow-400" />
            <span ref={coinsRefDOM} className="text-[10px] md:text-xs font-black italic">{festCoins}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
            {unlockedCodes.map(c => <span key={c} className="text-[6px] md:text-[7px] text-pink-400 bg-pink-500/10 px-1 md:px-1.5 py-0.5 border border-pink-500/20 rounded uppercase font-mono">{c}</span>)}
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="relative border-4 border-zinc-800 bg-[#0a0a0a] crt rounded-lg overflow-hidden w-full h-full min-h-[350px] md:min-h-[500px] flex justify-center items-center flex-col shadow-2xl mx-auto flex-grow [&.is-fullscreen]:bg-black [&.is-fullscreen]:border-none [&.is-fullscreen]:rounded-none">
        <FullscreenButton targetRef={containerRef} className="top-2 right-2" />
        
        <AnimatePresence>
          {((isPlaying) && (isPausedGlobal || pausedRef.current)) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center flex-col gap-4 md:gap-8 p-4 text-center"
            >
              <div className="flex flex-col items-center gap-2">
                {isPausedGlobal ? (
                  <Music className="w-10 h-10 md:w-12 md:h-12 text-brand-accent animate-pulse" />
                ) : (
                  <Rocket className="w-10 h-10 md:w-16 md:h-16 text-brand-accent animate-pulse" />
                )}
                <h2 className="text-white font-black text-xl md:text-4xl uppercase tracking-[0.2em]">
                  {isPausedGlobal ? t('game.paused.system', 'FESTIVAL SUSPENDED') : 'PAUSED'}
                </h2>
              </div>
              <p className="text-zinc-500 text-[8px] md:text-[10px] uppercase font-bold text-center px-8 md:px-16 leading-relaxed max-w-sm">
                {isPausedGlobal ? t('game.paused.desc', 'The artist is taking a break. The encore will begin shortly.') : t('game.paused.manual', 'Take a breath. The stage will still be there when you return.')}
              </p>
              {!isPausedGlobal && (
                <button
                  onClick={() => { pausedRef.current = false; playSound('start'); }}
                  className="bg-brand-accent text-white px-8 md:px-12 py-3 md:py-4 rounded-full font-black uppercase text-xs md:text-sm tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-[0_0_30px_rgba(242,74,41,0.4)] active:scale-95"
                >
                  RESUME SHOW
                </button>
              )}
            </motion.div>
          )}
          {message && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`absolute top-0 inset-x-0 z-[60] flex justify-center pointer-events-none`}
            >
              <div className={`px-4 py-2 border text-[10px] uppercase tracking-tighter ${
                message.type === 'success' ? 'bg-green-500/20 border-green-500 text-green-400' : 
                message.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-400' : 
                'bg-blue-500/20 border-blue-500 text-blue-400'
              }`}>
                {message.text}
              </div>
            </motion.div>
          )}

          {!isPlaying && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-black/90 p-6 text-center overflow-y-auto"
            >
              {!showCodeInput ? (
                <div className="w-full flex flex-col items-center flex-1 py-2 justify-between h-full">
                  <div className="text-center w-full">
                    <h3 className="text-brand-accent text-xl mb-1 italic font-black">
                      {gameStats ? t('game.fest.gameover') : 'FEST JUMP II'}
                    </h3>
                    {gameStats ? (
                      <div className="bg-zinc-900/80 p-3 border border-zinc-800 rounded-lg mb-2 space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-mono">
                          <span className="text-zinc-500">{t('game.fest.final_score')}</span>
                          <span className="text-white font-bold">{gameStats.total}</span>
                        </div>
                        <div className="flex justify-between text-[10px] uppercase font-mono">
                          <span className="text-zinc-500">{t('game.fest.karmas_earned')}</span>
                          <span className="text-yellow-500 font-bold">+{gameStats.earned}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[8px] text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2">
                         <Zap className="w-3 h-3 text-yellow-500" /> {festCoins} KARMAS
                      </p>
                    )}
                  </div>

                  {/* Tabs */}
                  <div className="flex w-full px-4 gap-2 mb-2">
                    <button 
                      onClick={() => { playSound('hover'); setShopTab('chars'); }} 
                      className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest border-b-4 transition-all ${shopTab === 'chars' ? 'border-brand-accent text-white' : 'border-zinc-800 text-zinc-600'}`}
                    >
                      Lineup
                    </button>
                    <button 
                      onClick={() => { playSound('hover'); setShopTab('upgrades'); }} 
                      className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest border-b-4 transition-all ${shopTab === 'upgrades' ? 'border-brand-accent text-white' : 'border-zinc-800 text-zinc-600'}`}
                    >
                      Upgrades
                    </button>
                  </div>

                  <div className="flex-1 w-full overflow-y-auto px-4 custom-scrollbar">
                    {shopTab === 'chars' ? (
                      <div className="w-full relative py-2">
                        <div className="flex justify-between items-center w-full overflow-hidden relative" style={{ height: "140px" }}>
                          <button 
                            onClick={() => {
                              playSound('hover');
                              const currentIndex = CHARACTERS.findIndex(c => c.id === selectedCharId);
                              const prevIndex = (currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
                              setSelectedCharId(CHARACTERS[prevIndex].id);
                            }}
                            className="absolute left-0 z-10 w-8 h-8 flex items-center justify-center text-white bg-black/50 rounded-full hover:bg-brand-accent transition-colors"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                            <div className="w-20 h-20 mb-3 flex items-center justify-center relative bg-black/40 border border-white/5" style={{ backgroundColor: `${selectedChar.color}15` }}>
                                <motion.div 
                                  key={selectedCharId}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="w-12 h-12 relative z-10" 
                                  style={{ backgroundColor: selectedChar.color }}
                                />
                            </div>
                            <p className="text-[12px] text-white uppercase font-bold tracking-widest">{t(selectedChar.nameKey)}</p>
                            <p className="text-[8px] text-zinc-400 mt-1 h-8 max-w-[150px] leading-tight italic text-center">{t(selectedChar.descKey)}</p>
                          </div>

                          <button 
                            onClick={() => {
                              playSound('hover');
                              const currentIndex = CHARACTERS.findIndex(c => c.id === selectedCharId);
                              const nextIndex = (currentIndex + 1) % CHARACTERS.length;
                              setSelectedCharId(CHARACTERS[nextIndex].id);
                            }}
                            className="absolute right-0 z-10 w-8 h-8 flex items-center justify-center text-white bg-black/50 rounded-full hover:bg-brand-accent transition-colors"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>

                        <div className="mt-2">
                          {unlockedChars.includes(selectedCharId) ? (
                            <button 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); playSound('click'); setIsPlaying(true); }} 
                              className="w-full bg-brand-accent text-white py-3 uppercase text-[12px] font-bold hover:bg-white hover:text-black transition-all relative z-50 cursor-pointer pointer-events-auto"
                            >
                              [ START SHOW ]
                            </button>
                          ) : (
                            <button onClick={() => buyChar(selectedChar)} className={`w-full py-3 uppercase text-[12px] font-bold transition-all ${festCoins >= selectedChar.price ? 'bg-yellow-500 text-black hover:bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] border-2 border-yellow-200' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                              UNLOCK - {selectedChar.price} KARMAS
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 pt-2 pb-4">
                        {UPGRADE_DATA.map((upg) => {
                          const level = upgrades[upg.key];
                          const cost = (level + 1) * 300;
                          return (
                            <div key={upg.key} className="bg-zinc-900/50 p-2 border border-white/5 rounded-lg flex items-center gap-3">
                              <div className="w-10 h-10 bg-black flex items-center justify-center text-brand-accent border border-brand-accent/20 rounded-md shrink-0">
                                {upg.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                  <p className="text-[10px] font-black text-white">{upg.name}</p>
                                  <p className="text-[10px] text-brand-accent italic font-bold">LV. {level}</p>
                                </div>
                                <p className="text-[7px] text-zinc-500 tracking-tighter uppercase mb-2">{upg.desc}</p>
                                <button 
                                  onClick={() => buyUpgrade(upg.key)}
                                  disabled={festCoins < cost}
                                  className={`w-full py-1.5 text-[8px] font-bold uppercase transition-all ${festCoins >= cost ? 'bg-white text-black hover:bg-brand-accent hover:text-white' : 'bg-zinc-800 text-zinc-600'}`}
                                >
                                  UPGRADE - {cost} KARMAS
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                     <p className="text-[8px] text-zinc-400 text-center uppercase tracking-widest leading-relaxed mt-2">Space / Touch = Shoot</p>
                     <button onClick={() => { playSound('hover'); setShowCodeInput(true); }} className="text-[8px] text-zinc-500 hover:text-white uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
                       <Key className="w-3 h-3" /> Insert Code
                     </button>
                  </div>
              ) : (
                <div className="w-full max-w-[240px]">
                  <h4 className="text-white text-[10px] mb-4 uppercase tracking-[0.2em]">{t('game.fest.code.input')}</h4>
                  <input 
                    type="text" 
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="XYZ123"
                    className="w-full bg-zinc-900 border border-zinc-700 px-4 py-3 text-white text-center font-mono focus:outline-none focus:border-brand-accent uppercase mb-4"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { playSound('hover'); setShowCodeInput(false); }} className="flex-1 bg-zinc-800 text-zinc-400 py-3 text-[10px] uppercase">{t('arc.back', 'BACK')}</button>
                    <button onClick={handleApplyCode} className="flex-1 bg-brand-accent text-white py-3 text-[10px] uppercase font-bold">{t('game.fest.unlock', 'APPLY')}</button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <canvas 
          ref={canvasRef} 
          width={400} 
          height={500} 
          className="w-full h-full object-contain touch-none"
        />
        
        {/* HUD while playing */}
        {isPlaying && (
          <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
            {hudShield > 0 && (
              <div className="bg-blue-500/80 backdrop-blur-sm p-1.5 rounded-md border border-blue-400/50 flex flex-col items-center">
                <Shield className="w-4 h-4 text-white animate-pulse" />
                <span className="text-[6px] text-white font-mono uppercase mt-0.5">Merch VIP</span>
              </div>
            )}
            {hudJetpack > 0 && (
              <div className="bg-rose-500/80 backdrop-blur-sm p-1.5 rounded-md border border-rose-400/50 flex flex-col items-center">
                <Rocket className="w-4 h-4 text-white animate-bounce" />
                <span className="text-[6px] text-white font-mono uppercase mt-0.5">Backstage</span>
              </div>
            )}
          </div>
        )}

        {isPlaying && showMobileControls && (
          <>
            <div className="absolute bottom-8 left-8 z-20 pointer-events-none">
              <button 
                onMouseDown={() => { keysRef.current.left = true; playSound('click'); }}
                onMouseUp={() => keysRef.current.left = false}
                onMouseLeave={() => keysRef.current.left = false}
                onTouchStart={(e) => { e.preventDefault(); keysRef.current.left = true; playSound('click'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysRef.current.left = false; }}
                className="w-20 h-20 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center active:bg-white/20 active:border-white/40 transition-all pointer-events-auto shadow-xl"
              >
                <ChevronLeft className="w-10 h-10 text-white/50" />
              </button>
            </div>
            <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
              <button 
                onMouseDown={() => { keysRef.current.right = true; playSound('click'); }}
                onMouseUp={() => keysRef.current.right = false}
                onMouseLeave={() => keysRef.current.right = false}
                onTouchStart={(e) => { e.preventDefault(); keysRef.current.right = true; playSound('click'); }}
                onTouchEnd={(e) => { e.preventDefault(); keysRef.current.right = false; }}
                className="w-20 h-20 bg-white/5 backdrop-blur-md border-2 border-white/20 rounded-full flex items-center justify-center active:bg-white/20 active:border-white/40 transition-all pointer-events-auto shadow-xl"
              >
                <ChevronRight className="w-10 h-10 text-white/50" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 w-full max-w-[450px] px-4 text-[8px] text-zinc-500 uppercase tracking-widest font-mono shrink-0">
        <div className="space-y-2">
          <p className="text-white mb-2 underline decoration-brand-accent underline-offset-4">{t('game.fest.guide', 'Guía del Festival')}</p>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div> {t('game.fest.spring', 'Trampolín: Gran Salto')}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> 🎟️: {t('game.fest.backstage', 'Pase Backstage')}</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 👕: {t('game.fest.merch', 'Merch')}</div>
          <div className="flex items-center gap-2">🍺: +100 Pts</div>
          <p className="mt-4 text-pink-500 font-bold opacity-80">{t('game.fest.leaked_codes', 'LEAKED CODES:')}</p>
          <p className="text-pink-400">RICHART, RIVAD2026, GODMODE</p>
        </div>
        <div className="space-y-2">
           <p className="text-white mb-2 underline decoration-red-500 underline-offset-4">{t('game.fest.threats', 'Amenazas')}</p>
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500"></div> {t('game.fest.bouncers', 'Seguridad / Bouncers')}</div>
           <p className="mt-4 leading-relaxed opacity-60 italic">{t('game.fest.instruction', 'Alcanza la gloria saltando en los escenarios del festival. ¡Consigue los mejores lugares!')}</p>
        </div>
      </div>
    </div>
  );
}
