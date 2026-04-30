const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

// 1. Fix drawing player and redesign characters
const drawPlayerRegex = /const drawPlayer = \(x, y\) => \{[\s\S]*?ctx\.restore\(\);\s*\};/;
const drawPlayerReplacement = `const drawPlayer = (x, y) => {
      ctx.save();
      if (cameraShake > 0) ctx.translate(Math.random()*cameraShake - cameraShake/2, Math.random()*cameraShake - cameraShake/2);
      
      const charX = x;
      const charY = y;
      const pWidth = player.width;
      const pHeight = player.height;

      // Holographic / Neon Aura
      ctx.shadowBlur = 20;
      ctx.shadowColor = selectedChar.accent;
      ctx.fillStyle = selectedChar.color;
      
      // Main Body Shape
      ctx.beginPath();
      ctx.roundRect(charX, charY, pWidth, pHeight, 8);
      ctx.fill();
      
      ctx.shadowBlur = 0;

      // Unique character designs
      if (selectedChar.id === 'ghost') {
         // Shuffler (Ghost)
         ctx.fillStyle = '#fff';
         ctx.beginPath(); ctx.arc(charX + pWidth/2, charY + pHeight/3, 8, 0, Math.PI*2); ctx.fill();
         // Trail
         ctx.globalAlpha = 0.5;
         ctx.fillStyle = selectedChar.accent;
         ctx.beginPath();
         ctx.moveTo(charX + 4, charY + pHeight);
         ctx.lineTo(charX + pWidth/2, charY + pHeight + 15 + Math.sin(Date.now() * 0.01) * 5);
         ctx.lineTo(charX + pWidth - 4, charY + pHeight);
         ctx.fill();
         ctx.globalAlpha = 1.0;
      } else if (selectedChar.id === 'punk') {
         // Basshead (Punk)
         // Mohawk
         ctx.fillStyle = selectedChar.accent;
         for(let i=0; i<4; i++) {
           ctx.fillRect(charX + pWidth/2 - 8 + i*4, charY - 8 + Math.abs(2-i)*2, 4, 10);
         }
         // Visor
         ctx.fillStyle = '#111';
         ctx.fillRect(charX + 2, charY + 8, pWidth - 4, 10);
         ctx.fillStyle = '#fff';
         ctx.fillRect(charX + 4, charY + 10, pWidth - 8, 2);
      } else if (selectedChar.id === 'cyber') {
         // Main-DJ (Cyber)
         ctx.fillStyle = '#0f172a';
         ctx.fillRect(charX + 2, charY + 2, pWidth - 4, pHeight - 4);
         
         // DJ Headphones
         ctx.strokeStyle = selectedChar.color;
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.arc(charX + pWidth/2, charY + pHeight/2 - 4, 12, Math.PI, 0);
         ctx.stroke();
         ctx.fillStyle = selectedChar.accent;
         ctx.fillRect(charX - 4, charY + pHeight/2 - 8, 6, 12);
         ctx.fillRect(charX + pWidth - 2, charY + pHeight/2 - 8, 6, 12);
         
         // Glowing Chest Equalizer
         const t = Date.now() * 0.01;
         ctx.fillStyle = selectedChar.color;
         ctx.fillRect(charX + 6, charY + pHeight - 12 - Math.abs(Math.sin(t)*6), 4, Math.abs(Math.sin(t)*6) + 4);
         ctx.fillRect(charX + 12, charY + pHeight - 12 - Math.abs(Math.sin(t+1)*6), 4, Math.abs(Math.sin(t+1)*6) + 4);
         ctx.fillRect(charX + 18, charY + pHeight - 12 - Math.abs(Math.sin(t+2)*6), 4, Math.abs(Math.sin(t+2)*6) + 4);
      } else {
         // Raver (Default)
         ctx.fillStyle = '#1e293b';
         ctx.fillRect(charX + 2, charY + pHeight/2, pWidth - 4, pHeight/2);
         // Rave glasses
         ctx.fillStyle = selectedChar.accent;
         ctx.fillRect(charX + 4, charY + 6, pWidth - 8, 8);
         // Glowsticks in hands
         if (player.vy < 0) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#10b981';
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(charX - 5, charY + pHeight/2); ctx.lineTo(charX - 10, charY - 5); ctx.stroke();
            
            ctx.shadowColor = '#ec4899';
            ctx.strokeStyle = '#ec4899';
            ctx.beginPath(); ctx.moveTo(charX + pWidth + 5, charY + pHeight/2); ctx.lineTo(charX + pWidth + 10, charY - 5); ctx.stroke();
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
    };`;

code = code.replace(drawPlayerRegex, drawPlayerReplacement);

// 2. Redesign Powerups
const drawPowerupsRegex = /\/\/ Powerups[\s\S]*?\} else if \(p\.type === 'magnet'\) \{[\s\S]*?\}\s*\});/;
const drawPowerupsReplacement = `// Powerups
      powerups.forEach(p => {
         ctx.save();
         ctx.translate(p.x, p.y + Math.sin(Date.now() * 0.005 + p.x) * 4);
         
         ctx.shadowBlur = 15;
         if (p.type === 'glowstick') {
            ctx.shadowColor = '#10b981';
            ctx.fillStyle = '#10b981';
            ctx.beginPath(); ctx.roundRect(0, 0, 10, 20, 4); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(2, 2, 6, 16);
         } else if (p.type === 'beer') {
            ctx.shadowColor = '#f59e0b';
            ctx.fillStyle = '#f59e0b'; // cup
            ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(16,0); ctx.lineTo(12,20); ctx.lineTo(4,20); ctx.fill();
            ctx.fillStyle = '#fff'; // foam
            ctx.beginPath(); ctx.arc(8, 0, 8, 0, Math.PI); ctx.fill();
         } else if (p.type === 'vip') {
            ctx.shadowColor = '#818cf8';
            ctx.fillStyle = '#818cf8';
            ctx.beginPath(); ctx.arc(10, 10, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText('SHLD', 10, 13);
         } else if (p.type === 'merch') {
            ctx.shadowColor = '#f43f5e';
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(20, 20); ctx.lineTo(0, 20); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('^', 10, 16);
         } else if (p.type === 'magnet') {
            ctx.shadowColor = '#a855f7';
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(10, 10, 8, Math.PI, 0); ctx.stroke();
            ctx.fillRect(0, 10, 4, 6); ctx.fillRect(16, 10, 4, 6);
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 16, 4, 2); ctx.fillRect(16, 16, 4, 2);
         }
         ctx.restore();
      });`;

code = code.replace(drawPowerupsRegex, drawPowerupsReplacement);

// 3. Redesign Enemies
const drawEnemiesRegex = /\/\/ Enemies[\s\S]*?ctx\.restore\(\);\s*\});/;
const drawEnemiesReplacement = `// Enemies
      enemies.forEach(e => {
          ctx.save();
          ctx.translate(e.x + e.width/2, e.y + e.width/2);
          
          if (e.isBouncer) {
              // Bouncer Enemy (Security)
              ctx.fillStyle = '#09090b';
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 20;
              ctx.beginPath(); ctx.roundRect(-e.width/2, -e.width/2, e.width, e.width, 4); ctx.fill();
              
              // Neon Red Cross
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(-e.width/4, -2, e.width/2, 4);
              ctx.fillRect(-2, -e.width/4, 4, e.width/2);
          } else {
              // Drone Enemy (Floating Speaker)
              ctx.rotate(Math.sin(Date.now() * 0.005 + e.x) * 0.2);
              ctx.fillStyle = '#1e1b4b';
              ctx.shadowColor = '#a855f7';
              ctx.shadowBlur = 20;
              ctx.beginPath(); ctx.arc(0, 0, e.width/2, 0, Math.PI*2); ctx.fill();
              
              // Speaker cones
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#0f172a';
              ctx.beginPath(); ctx.arc(0, 0, e.width/3, 0, Math.PI*2); ctx.fill();
              ctx.fillStyle = '#a855f7';
              ctx.beginPath(); ctx.arc(0, 0, e.width/6, 0, Math.PI*2); ctx.fill();
              
              // Animated sound wave ring
              ctx.strokeStyle = 'rgba(168, 85, 247, 0.5)';
              ctx.lineWidth = 2;
              ctx.beginPath(); ctx.arc(0, 0, e.width/2 + Math.abs(Math.sin(Date.now()*0.01)*5), 0, Math.PI*2); ctx.stroke();
          }
          ctx.restore();
      });`;

code = code.replace(drawEnemiesRegex, drawEnemiesReplacement);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
