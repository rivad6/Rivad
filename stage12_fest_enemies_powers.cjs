const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

// 1. Redesenamos powerups
const powerupsRegex = /powerups\.forEach\(pw => \{[\s\S]*?ctx\.restore\(\);\s*\}\);/;
const powerupsReplace = `powerups.forEach(pw => {
        const timeOffset = Date.now() * 0.005;
        const bob = Math.sin(timeOffset + pw.x) * 3;
        
        ctx.save();
        ctx.translate(pw.x + 10, pw.y + 10 + bob);
        
        if (pw.type === 'glowstick') {
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 10;
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.roundRect(-4, -10, 8, 20, 4);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(0, -6, 2, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        } else if (pw.type === 'vip') {
            ctx.shadowColor = '#818cf8';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#312e81'; 
            ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();
            ctx.lineWidth = 3; ctx.strokeStyle = '#818cf8'; ctx.stroke();
            ctx.fillStyle = '#c7d2fe';
            ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center'; ctx.fillText('SHLD', 0, 3);
            ctx.shadowBlur = 0;
        } else if (pw.type === 'merch') {
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-10, 10); ctx.lineTo(10, 10); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.fillRect(-2, -2, 4, 10);
            ctx.shadowBlur = 0;
        } else if (pw.type === 'beer') {
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#f59e0b'; // cup
            ctx.beginPath(); ctx.moveTo(-6, 8); ctx.lineTo(6, 8); ctx.lineTo(8, -8); ctx.lineTo(-8, -8); ctx.fill();
            ctx.fillStyle = '#fff'; // foam
            ctx.beginPath(); ctx.arc(0, -8, 8, 0, Math.PI); ctx.fill();
            ctx.shadowBlur = 0;
        } else if (pw.type === 'magnet') {
            ctx.shadowColor = '#a855f7';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, -2, 8, Math.PI, 0); ctx.stroke();
            ctx.fillStyle = '#a855f7';
            ctx.fillRect(-10, -2, 4, 8); ctx.fillRect(6, -2, 4, 8);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-10, 4, 4, 2); ctx.fillRect(6, 4, 4, 2);
            ctx.shadowBlur = 0;
        }
        
        ctx.restore();
      });`;
code = code.replace(powerupsRegex, powerupsReplace);

// 2. Redisenamos enemigos
const enemiesRegex = /enemies\.forEach\(e => \{[\s\S]*?\n\s*\}\);/;
const enemiesReplace = `enemies.forEach(e => {
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
code = code.replace(enemiesRegex, enemiesReplace);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
