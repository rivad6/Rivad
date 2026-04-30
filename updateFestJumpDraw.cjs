const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

const replacement = `      if (adBreakTimer > 0) {
         // Subtle scanline overlay for sponsor rain
         ctx.fillStyle = \`rgba(16, 185, 129, \${(adBreakTimer / 400) * 0.15})\`;
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         
         ctx.save();
         // Fake event broadcast banners
         ctx.fillStyle = 'rgba(0,0,0,0.8)';
         ctx.fillRect(0, 20, canvas.width, 60);
         
         ctx.fillStyle = '#10b981';
         ctx.font = 'bold 24px monospace';
         ctx.textAlign = 'center';
         const flash = Math.floor(Date.now() / 200) % 2 === 0;
         if (flash) {
            ctx.fillText('>>> EVENT SPONSOR TAKEOVER <<<', canvas.width/2, 50);
         }
         
         ctx.fillStyle = \`rgba(16, 185, 129, \${(adBreakTimer / 400)\})\`;
         ctx.font = '12px monospace';
         ctx.fillText('VIP REWARDS ACTIVATED', canvas.width/2, 70);
         
         // Little floating ad banners
         const tOffset = Date.now() * 0.002;
         for(let k=0; k<3; k++) {
            const bx = (canvas.width / 2) + Math.sin(tOffset + k * 2) * 150;
            const by = (canvas.height / 2) + Math.cos(tOffset * 0.5 + k * 2) * 150;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(bx - 50, by - 15, 100, 30);
            ctx.strokeStyle = '#10b981';
            ctx.strokeRect(bx - 50, by - 15, 100, 30);
            ctx.fillStyle = '#10b981';
            ctx.font = '10px monospace';
            ctx.fillText('+KARMA AIRDROP', bx, by + 4);
         }
         ctx.restore();
      }`;

code = code.replace(/if \(adBreakTimer > 0\) \{\s*ctx\.fillStyle[\s\S]*?ctx\.textAlign = 'left';\s*\}/, replacement);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
