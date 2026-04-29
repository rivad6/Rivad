const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

// Fix the billboard and else block
const replaceBlock = `
             ctx.fillStyle = '#000';
            ctx.fillRect(p.x - 1, p.y - 1, p.width + 2, PLATFORM_HEIGHT + 2);
            ctx.fillStyle = '#1e1b4b'; // dark retro base
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT);
            ctx.fillStyle = pColor;
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(p.x, p.y, p.width, 2);
        } else {
            let pColor = '#34d399';
            if (p.type === 'moving') pColor = '#60a5fa';
            else if (p.type === 'breaking') pColor = '#fca5a5';
            else if (p.type === 'boost') pColor = '#facc15';
            if (p.hasSpring) pColor = '#fde047';

            ctx.fillStyle = '#334155';
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT);
            ctx.fillStyle = pColor;
            ctx.fillRect(p.x, p.y, p.width, 3);
`;

code = code.replace(/ctx\.fillStyle = '#000';[\s\S]*?ctx\.fillRect\(p\.x, p\.y, p\.width, 3\);/, 
`             ctx.fillStyle = '#334155';
             ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT);
             ctx.fillStyle = '#0f172a';
             ctx.fillRect(p.x, p.y, p.width, 3);
        } else {
            let pColor = '#34d399';
            if (p.type === 'moving') pColor = '#60a5fa';
            else if (p.type === 'breaking') pColor = '#fca5a5';
            else if (p.type === 'boost') pColor = '#facc15';
            if (p.hasSpring) pColor = '#fde047';

            ctx.fillStyle = '#000';
            ctx.fillRect(p.x - 1, p.y - 1, p.width + 2, PLATFORM_HEIGHT + 2);
            ctx.fillStyle = '#1e1b4b'; // dark retro base
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT);
            ctx.fillStyle = pColor;
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(p.x, p.y, p.width, 2);`);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
