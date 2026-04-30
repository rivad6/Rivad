const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

const regex = /\/\/ Truss cross patterns([\s\S]*?)(?=\/\/ Danger stripes for breaking)/;

const replacement = `// Truss cross patterns
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i = 0; i < p.width - 5; i += 10) {
               ctx.moveTo(p.x + i, p.y + 4);
               ctx.lineTo(p.x + i + 10, p.y + PLATFORM_HEIGHT);
               ctx.moveTo(p.x + i + 10, p.y + 4);
               ctx.lineTo(p.x + i, p.y + PLATFORM_HEIGHT);
            }
            ctx.stroke();

            // Colored lights / speakers block on top
            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.roundRect(p.x + 2, p.y - 2, p.width - 4, 6, 2);
            ctx.fill();

            // Inner highlight
            ctx.fillStyle = pLight;
            ctx.fillRect(p.x + 4, p.y - 1, p.width - 8, 2);
            
            // Neon underglow for everything except breaking
            if (p.type !== 'breaking') {
               ctx.shadowBlur = 10;
               ctx.shadowColor = pColor;
               ctx.fillStyle = pColor;
               ctx.fillRect(p.x + 4, p.y + PLATFORM_HEIGHT - 2, p.width - 8, 2);
               ctx.shadowBlur = 0;
            }
            
            // Subwoofers for boost
            if (p.type === 'boost') {
                ctx.fillStyle = '#000';
                ctx.beginPath();
                const bounce = Math.sin(Date.now() * 0.02) * 2;
                ctx.arc(p.x + p.width/2 - 12, p.y + PLATFORM_HEIGHT/2, 4 + bounce, 0, Math.PI*2);
                ctx.arc(p.x + p.width/2 + 12, p.y + PLATFORM_HEIGHT/2, 4 + bounce, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = pColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Booster beam going UP
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                const grad = ctx.createLinearGradient(0, p.y, 0, p.y - 100);
                grad.addColorStop(0, pColor);
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
                ctx.fillRect(p.x + 10, p.y - 100, p.width - 20, 100);
                ctx.restore();
            }

            `;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
