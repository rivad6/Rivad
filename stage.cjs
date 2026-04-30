const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

const targetStr = `        } else {
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
            }`;

const repStr = `        } else {
            let pColor = theme.platNorm; 
            let pLight = theme.platMov;
            if (p.type === 'moving') { pColor = theme.platMov; pLight = '#0ea5e9'; }
            else if (p.type === 'breaking') { pColor = '#ef4444'; pLight = '#f87171'; } // Red
            else if (p.type === 'boost') { pColor = '#eab308'; pLight = '#fef08a'; } // Yellow
            
            // Draw a festival truss/sound system platform
            ctx.fillStyle = '#0f172a'; // dark metal base
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, PLATFORM_HEIGHT, 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            // Truss cross patterns
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1;
            ctx.beginPath();
            for(let i = 0; i < p.width - 5; i += 10) {
               ctx.moveTo(p.x + i, p.y);
               ctx.lineTo(p.x + i + 10, p.y + PLATFORM_HEIGHT);
               ctx.moveTo(p.x + i + 10, p.y);
               ctx.lineTo(p.x + i, p.y + PLATFORM_HEIGHT);
            }
            ctx.stroke();

            // Colored lights / speakers block on top
            ctx.fillStyle = pColor;
            ctx.beginPath();
            ctx.roundRect(p.x + 2, p.y - 2, p.width - 4, 4, 2);
            ctx.fill();

            // Inner highlight
            ctx.fillStyle = pLight;
            ctx.fillRect(p.x + 4, p.y - 1, p.width - 8, 1);
            
            // Danger stripes for breaking
            if (p.type === 'breaking') {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(p.x + 2, p.y - 2, p.width - 4, 4, 2);
                ctx.clip();
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                for(let i = -10; i < p.width; i += 8) {
                    ctx.beginPath();
                    ctx.moveTo(p.x + i, p.y - 2);
                    ctx.lineTo(p.x + i + 4, p.y - 2);
                    ctx.lineTo(p.x + i - 2, p.y + 2);
                    ctx.lineTo(p.x + i - 6, p.y + 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // Subwoofers for boost
            if (p.type === 'boost') {
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(p.x + p.width/2 - 10, p.y + PLATFORM_HEIGHT/2, 4, 0, Math.PI*2);
                ctx.arc(p.x + p.width/2 + 10, p.y + PLATFORM_HEIGHT/2, 4, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle = pColor;
                ctx.stroke();
            }`;

code = code.replace(targetStr, repStr);
fs.writeFileSync('src/components/games/FestJump.tsx', code);
