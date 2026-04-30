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
fs.writeFileSync('src/components/games/FestJump.tsx', code);
