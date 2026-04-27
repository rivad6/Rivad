import { useEffect, useRef, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAudio } from '../../context/AudioContext';
import { useAchievements } from '../../context/AchievementsContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, User, Key, Shield, Zap, Rocket, AlertCircle } from 'lucide-react';

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

export function FestJump() {
  const { t } = useLanguage();
  const { playSound } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [score, setScore] = useState(0);
  const [hudShield, setHudShield] = useState(0);
  const [hudJetpack, setHudJetpack] = useState(0);
  const [festCoins, setFestCoins] = useState(() => Number(localStorage.getItem('fest_coins') || 0));
  const [unlockedChars, setUnlockedChars] = useState<string[]>(() => JSON.parse(localStorage.getItem('fest_chars') || '["default"]'));
  const [selectedCharId, setSelectedCharId] = useState(() => localStorage.getItem('fest_selected_char') || 'default');
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('fest_highscore') || 0));
  const [unlockedCodes, setUnlockedCodes] = useState<string[]>([]);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const selectedChar = useMemo(() => CHARACTERS.find(c => c.id === selectedCharId) || CHARACTERS[0], [selectedCharId]);

  useEffect(() => {
    localStorage.setItem('fest_coins', festCoins.toString());
    localStorage.setItem('fest_chars', JSON.stringify(unlockedChars));
    localStorage.setItem('fest_selected_char', selectedCharId);
    localStorage.setItem('fest_highscore', highScore.toString());
  }, [festCoins, unlockedChars, selectedCharId, highScore]);

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
    let powerups: {x: number, y: number, type: 'spring' | 'rocket' | 'shield' | 'coin'}[] = [];
    let enemies: {x: number, y: number, speed: number, width: number}[] = [];

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
      shield: 0,
      jetpack: 0,
    };

    let platforms = Array.from({ length: 12 }, (_, i) => {
      const height = canvas.height - (i * 80 + 20);
      const typeRand = Math.random();
      return {
        x: (canvas.width / 2 - PLATFORM_WIDTH / 2) + Math.sin(height * 0.005) * 120,
        y: height,
        hasSpring: Math.random() > 0.9,
        type: (typeRand > 0.8 && i > 3) ? 'moving' : (typeRand > 0.6 && i > 5) ? 'breaking' : 'normal',
        vx: (typeRand > 0.8 && i > 3) ? (Math.random() > 0.5 ? 2 : -2) : 0,
        broken: false,
        width: PLATFORM_WIDTH,
      };
    });

    // Start platform
    platforms[0] = { x: canvas.width / 2 - PLATFORM_WIDTH / 2, y: canvas.height - 20, hasSpring: false, type: 'normal', vx: 0, broken: false, width: PLATFORM_WIDTH };

    let cameraY = 0;
    let maxScore = 0;
    let shake = 0;

    const keys = { left: false, right: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft') keys.left = true;
      if (e.key === 'ArrowRight') keys.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys.left = false;
      if (e.key === 'ArrowRight') keys.right = false;
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

    const spawnEnemy = () => {
      if (maxScore > 1000 && Math.random() > 0.98) {
        enemies.push({
          x: Math.random() > 0.5 ? -40 : canvas.width + 40,
          y: -100,
          speed: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
          width: 32
        });
      }
    };

    const spawnPowerup = (platform: any) => {
       const rand = Math.random();
       if (rand > 0.98) {
         powerups.push({
           x: platform.x + 10,
           y: platform.y - 20,
           type: 'rocket'
         });
       } else if (rand > 0.95) {
         powerups.push({
           x: platform.x + 10,
           y: platform.y - 20,
           type: 'shield'
         });
       } else if (rand > 0.8) {
         powerups.push({
           x: platform.x + platform.width / 2 - 5,
           y: platform.y - 15,
           type: 'coin'
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

    const update = () => {
      if (shake > 0) shake *= 0.9;

      // Movement
      if (keys.left) player.vx -= 1;
      else if (keys.right) player.vx += 1;
      else player.vx *= 0.8;

      player.vx = Math.max(-selectedChar.speed, Math.min(selectedChar.speed, player.vx));

      player.x += player.vx;
      
      if (player.jetpack > 0) {
        player.vy = -15;
        player.jetpack--;
      } else {
        player.vy += GRAVITY;
      }
      player.y += player.vy;

      // Screen wrap
      if (player.x < 0) player.x += canvas.width;
      if (player.x >= canvas.width) player.x -= canvas.width;

      // Camera follow
      if (player.y < canvas.height / 2) {
        let diff = canvas.height / 2 - player.y;
        cameraY += diff;
        player.y = canvas.height / 2;
        maxScore = Math.floor(cameraY);
        setScore(maxScore);
        if (maxScore > highScore) setHighScore(maxScore);

        // Codes logic
        if (maxScore > 500) setUnlockedCodes(prev => prev.includes('FEST5') ? prev : [...prev, 'FEST5']);
        if (maxScore > 2000) setUnlockedCodes(prev => prev.includes('BEATS10') ? prev : [...prev, 'BEATS10']);
        if (maxScore > 5000) setUnlockedCodes(prev => prev.includes('VIPPRO') ? prev : [...prev, 'VIPPRO']);

        platforms.forEach((p, idx) => {
          p.y += diff;
          if (p.y > canvas.height) {
            let minY = Math.min(...platforms.map(p2 => p2.y));
            p.y = minY - (Math.random() * 40 + 60);
            
            // Advance generation patterns based on score
            const isMoving = Math.random() < Math.min(0.5, maxScore / 20000);
            const isBreaking = !isMoving && Math.random() < Math.min(0.4, maxScore / 25000);
            
            p.type = isMoving ? 'moving' : isBreaking ? 'breaking' : 'normal';
            p.vx = isMoving ? (Math.random() > 0.5 ? (Math.random() * 2 + 1) : -(Math.random() * 2 + 1)) : 0;
            p.broken = false;
            
            // Layout structures
            if (maxScore < 2000) {
               p.x = (canvas.width / 2 - PLATFORM_WIDTH / 2) + Math.sin(p.y * 0.005) * 120;
            } else {
               p.x = Math.random() * (canvas.width - PLATFORM_WIDTH);
            }
            
            p.y = minY - (80 + Math.random() * 40); // Consistent gap
            if (p.type !== 'breaking') {
              spawnPowerup(p);
            }
            spawnEnemy();
          }
        });

        enemies.forEach(e => e.y += diff);
        powerups.forEach(pw => pw.y += diff);
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
          
          if (p.type === 'moving') {
            p.x += p.vx;
            // Platforms wrap around the screen too to feel fully cylindrical
            if (p.x < -p.width) p.x += canvas.width + p.width;
            if (p.x > canvas.width) p.x -= canvas.width + p.width;
          }

          let hit = false;
          for (const pr of playerRects) {
            if (
              pr.x + 4 < p.x + p.width &&
              pr.x + pr.w - 4 > p.x &&
              player.y + player.height >= p.y &&
              player.y + player.height <= p.y + PLATFORM_HEIGHT + player.vy
            ) {
              hit = true;
              break;
            }
          }

          if (hit) {
            // Check for Perfect Jump
            const distFromCenter = Math.abs((player.x + player.width/2) - (p.x + p.width/2));
            const isPerfect = distFromCenter < 10;
            
            if (isPerfect) {
              setScore(prev => prev + 50);
              setFestCoins(prev => prev + 2);
              createParticles(p.x + p.width/2, p.y, '#ffffff');
              shake = 5;
            }

            player.vy = p.hasSpring ? selectedChar.jumpForce * 1.8 : selectedChar.jumpForce;
            if (p.type === 'breaking') {
              p.broken = true;
              createParticles(p.x + p.width/2, p.y + PLATFORM_HEIGHT/2, '#9ca3af');
            } else {
              if (p.hasSpring) {
                shake = 10;
                playSound('score');
              } else {
                playSound('click');
              }
              createParticles(player.x + player.width/2, player.y + player.height, selectedChar.color);
            }
          }
        });
      } else {
        // Evaluate moving platforms even when going up, just so they keep moving
        platforms.forEach(p => {
          if (p.broken) return;
          if (p.type === 'moving') {
            p.x += p.vx;
            if (p.x < -p.width) p.x += canvas.width + p.width;
            if (p.x > canvas.width) p.x -= canvas.width + p.width;
          }
        });
      }

      // Collisions Powerups
      powerups = powerups.filter(pw => {
        let hit = false;
        for (const pr of playerRects) {
          if (pr.x < pw.x + 20 && pr.x + pr.w > pw.x && player.y < pw.y + 20 && player.y + player.height > pw.y) {
            hit = true;
            break;
          }
        }
        if (hit) {
          if (pw.type === 'coin') {
            setFestCoins(prev => prev + 5);
            playSound('powerup');
            createParticles(pw.x, pw.y, '#facc15');
          } else {
            playSound('score');
            if (pw.type === 'rocket') player.jetpack = 120;
            if (pw.type === 'shield') player.shield = 1;
          }
        }
        return !hit && pw.y < canvas.height;
      });

      // Collisions Enemies
      enemies.forEach((e, index) => {
        e.x += e.speed;
        if (e.x < -50 || e.x > canvas.width + 50) e.speed *= -1;

        let hit = false;
        for (const pr of playerRects) {
          if (
            pr.x < e.x + e.width - 4 &&
            pr.x + pr.w > e.x + 4 &&
            player.y < e.y + e.width - 4 &&
            player.y + player.height > e.y + 4
          ) {
            hit = true;
            break;
          }
        }

        if (hit) {
          if (player.shield > 0) {
            player.shield = 0;
            enemies.splice(index, 1);
            shake = 15;
            playSound('alert');
          } else {
            playSound('hit');
            setIsPlaying(false);
          }
        }
      });
      enemies = enemies.filter(e => e.y < canvas.height);

      // Game Over
      if (player.y > canvas.height) {
        playSound('lose');
        setIsPlaying(false);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // BG with multiple layers and dynamic gradient
      const bgColorTop = cameraY < 2000 ? '#0a0a1a' : cameraY < 6000 ? '#022c22' : cameraY < 12000 ? '#1e1b4b' : '#3b0764';
      const bgColorBot = cameraY < 2000 ? '#1e1b4b' : cameraY < 6000 ? '#065f46' : cameraY < 12000 ? '#3730a3' : '#000000';
      
      let bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, bgColorTop);
      bgGrad.addColorStop(1, bgColorBot);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

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

      const drawWithWrap = (origX: number, drawFn: (x: number) => void) => {
        drawFn(origX);
        drawFn(origX - canvas.width);
        drawFn(origX + canvas.width);
      };

      // Platforms
      platforms.forEach(p => {
        if (p.broken) return; // don't draw broken platforms

        drawWithWrap(p.x, (pX) => {
          // Platform Shadow
          ctx.fillStyle = 'rgba(0,0,0,0.2)';
          ctx.fillRect(pX + 4, p.y + 4, p.width, PLATFORM_HEIGHT);

          let pColor = '#a7f3d0';
          if (p.type === 'moving') pColor = '#60a5fa'; // Blue for moving
          else if (p.type === 'breaking') pColor = '#fca5a5'; // Red/Pink for breaking
          else if (cameraY > 5000) pColor = '#e879f9'; // Zone 2 colors
          
          if (p.hasSpring) pColor = '#fde047';

          ctx.fillStyle = pColor;
          ctx.fillRect(pX, p.y, p.width, PLATFORM_HEIGHT);

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
          if (pw.type === 'coin') {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pwX + 10, pw.y + 10, 6, 0, Math.PI*2);
            ctx.fill();
            // Inner circle
            ctx.strokeStyle = '#eab308';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pwX + 10, pw.y + 10, 4, 0, Math.PI*2);
            ctx.stroke();
          } else {
            ctx.fillStyle = pw.type === 'rocket' ? '#f59e0b' : '#3b82f6';
            ctx.beginPath();
            ctx.arc(pwX + 10, pw.y + 10, 8, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText(pw.type === 'rocket' ? '🚀' : '🛡️', pwX + 2, pw.y + 15);
          }
        });
      });

      // Enemies
      enemies.forEach(e => {
        drawWithWrap(e.x, (eX) => {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(eX, e.y, e.width, e.width);
          ctx.fillStyle = 'white';
          ctx.font = '20px Arial';
          ctx.fillText('👿', eX + 4, e.y + 22);
        });
      });

      // Particles
      particles = particles.filter(p => p.life > 0);
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
        p.life -= 0.03;
        p.y += 1;
      });
      ctx.globalAlpha = 1;

      // Player
      drawPlayer(player.x, player.y);

      update();
      setHudShield(player.shield);
      setHudJetpack(player.jetpack);

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('touchmove', handlePointerMove);
    };
  }, [isPlaying, selectedChar]);

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

  useEffect(() => {
    if (isPlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; }
  }, [isPlaying]);

  return (
    <div className={isPlaying ? "fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden" : "flex flex-col items-center max-w-full overflow-hidden font-[var(--font-pixel)] select-none"}>
      <div className={isPlaying ? "w-full min-w-[320px] max-w-[500px] h-full max-h-[850px] mx-auto flex flex-col" : "w-full max-w-[400px] mx-auto flex flex-col"}>
      <div className="flex justify-between items-end w-full px-6 py-4 mb-4 text-[#fcfcfc] bg-zinc-900/50 rounded-2xl border border-white/5 backdrop-blur-sm shrink-0 pt-4">
        <div>
          <p className="text-brand-accent flex items-center gap-2 text-[10px] uppercase font-bold tracking-tighter opacity-80">
            <User className="w-3 h-3" />
            {t(selectedChar.nameKey)}
          </p>
          <div className="flex items-baseline gap-1">
            <p className="text-4xl font-black italic tracking-tighter">{score}</p>
            <span className="text-[10px] text-zinc-500 font-mono">/ {highScore} HI</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end justify-end h-full">
          <div className="flex items-center gap-2 text-yellow-400 px-3 py-1 bg-yellow-400/10 rounded-full border border-yellow-400/20 mb-2">
            <Zap className="w-3 h-3 fill-yellow-400" />
            <span className="text-xs font-black italic">{festCoins}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
            {unlockedCodes.map(c => <span key={c} className="text-[7px] text-pink-400 bg-pink-500/10 px-1.5 py-0.5 border border-pink-500/20 rounded uppercase font-mono">{c}</span>)}
          </div>
        </div>
      </div>
      
      <div ref={containerRef} className="relative border-4 border-zinc-800 bg-[#0a0a0a] crt rounded-lg overflow-hidden touch-none w-[400px] max-w-full h-[65vh] md:h-auto md:aspect-[3/4] flex justify-center items-center flex-col shadow-2xl mx-auto">
        <FullscreenButton targetRef={containerRef} className="top-2 right-2" />
        <AnimatePresence>
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
                <div className="w-full flex flex-col items-center flex-1 py-4 justify-between h-full">
                  <div className="text-center w-full">
                    <h3 className="text-brand-accent text-2xl mb-1 italic font-black">FEST JUMP II</h3>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-2">
                       <Zap className="w-3 h-3 text-yellow-500" /> {festCoins} KARMAS
                    </p>
                  </div>

                  <div className="w-full relative px-6 mt-4">
                     <div className="flex justify-between items-center w-full overflow-hidden relative" style={{ height: "140px" }}>
                       <button 
                         onClick={() => {
                           playSound('hover');
                           const currentIndex = CHARACTERS.findIndex(c => c.id === selectedCharId);
                           const prevIndex = (currentIndex - 1 + CHARACTERS.length) % CHARACTERS.length;
                           setSelectedCharId(CHARACTERS[prevIndex].id);
                         }}
                         className="absolute left-0 z-10 w-8 h-8 flex items-center justify-center text-white bg-black/50 rounded-full"
                       >
                         &lt;
                       </button>
                       
                       <div className="flex-1 flex flex-col items-center justify-center pointer-events-none">
                         <div className="w-20 h-20 mb-3 flex items-center justify-center relative bg-black/40 border border-white/5" style={{ backgroundColor: `${selectedChar.color}15` }}>
                            <div className="w-12 h-12 relative z-10" style={{ backgroundColor: selectedChar.color }}></div>
                         </div>
                         <p className="text-[12px] text-white uppercase font-bold tracking-widest">{t(selectedChar.nameKey)}</p>
                         <p className="text-[8px] text-zinc-400 mt-1 h-8 max-w-[150px] leading-tight italic">{t(selectedChar.descKey)}</p>
                       </div>

                       <button 
                         onClick={() => {
                           playSound('hover');
                           const currentIndex = CHARACTERS.findIndex(c => c.id === selectedCharId);
                           const nextIndex = (currentIndex + 1) % CHARACTERS.length;
                           setSelectedCharId(CHARACTERS[nextIndex].id);
                         }}
                         className="absolute right-0 z-10 w-8 h-8 flex items-center justify-center text-white bg-black/50 rounded-full"
                       >
                         &gt;
                       </button>
                     </div>
                  </div>

                  <div className="w-full px-8 mt-2 flex flex-col gap-3">
                     {unlockedChars.includes(selectedCharId) ? (
                       <button onClick={() => { playSound('click'); setIsPlaying(true); }} className="w-full bg-brand-accent text-white py-3 uppercase text-[12px] font-bold hover:bg-white hover:text-black transition-all">
                         [ START GAME ]
                       </button>
                     ) : (
                       <button onClick={() => buyChar(selectedChar)} className={`w-full py-3 uppercase text-[12px] font-bold transition-all ${festCoins >= selectedChar.price ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
                         UNLOCK - {selectedChar.price} KARMAS
                       </button>
                     )}
                     <button onClick={() => { playSound('hover'); setShowCodeInput(true); }} className="text-[8px] text-zinc-500 hover:text-white uppercase tracking-widest mt-2 flex items-center justify-center gap-1">
                       <Key className="w-3 h-3" /> Insert Code
                     </button>
                  </div>
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
                    <button onClick={() => { playSound('hover'); setShowCodeInput(false); }} className="flex-1 bg-zinc-800 text-zinc-400 py-3 text-[10px] uppercase">Atrás</button>
                    <button onClick={handleApplyCode} className="flex-1 bg-brand-accent text-white py-3 text-[10px] uppercase font-bold">Aplicar</button>
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
          className="block w-full h-full object-contain touch-none"
        />
        
        {/* HUD while playing */}
        {isPlaying && (
          <div className="absolute top-4 left-4 z-10 flex gap-2 pointer-events-none">
            {hudShield > 0 && (
              <div className="bg-blue-500/80 backdrop-blur-sm p-1.5 rounded-md border border-blue-400/50 flex flex-col items-center">
                <Shield className="w-4 h-4 text-white animate-pulse" />
                <span className="text-[6px] text-white font-mono uppercase mt-0.5">Escudo</span>
              </div>
            )}
            {hudJetpack > 0 && (
              <div className="bg-amber-500/80 backdrop-blur-sm p-1.5 rounded-md border border-amber-400/50 flex flex-col items-center">
                <Rocket className="w-4 h-4 text-white animate-bounce" />
                <span className="text-[6px] text-white font-mono uppercase mt-0.5">Turbo</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-8 w-[400px] max-w-full px-4 text-[8px] text-zinc-500 uppercase tracking-widest font-mono">
        <div className="space-y-2">
          <p className="text-white mb-2 underline decoration-brand-accent underline-offset-4">Consejos Pro</p>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div> Resortes: Super Salto</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> 🚀: Turbo-Arte</div>
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> 🛡️: Inmunidad</div>
          <p className="mt-4 text-pink-500 font-bold opacity-80">LEAKED CODES:</p>
          <p className="text-pink-400">RICHART, RIVAD2026, GODMODE</p>
        </div>
        <div className="space-y-2">
           <p className="text-white mb-2 underline decoration-red-500 underline-offset-4">Amenazas</p>
           <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500"></div> Críticos de Arte</div>
           <p className="mt-4 leading-relaxed opacity-60 italic">Escala la espiral infinita del éxito y derrota el conformismo.</p>
        </div>
      </div>
      </div>
    </div>
  );
}
