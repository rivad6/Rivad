const fs = require('fs');
const path = require('path');

let festJumpPath = path.join(__dirname, 'src/components/games/FestJump.tsx');
let currFest = fs.readFileSync(festJumpPath, 'utf8');

const drawInstancePattern = /const drawInstance = \(ix: number, iy: number\) => \{[\s\S]*?ctx\.restore\(\);\s*\};/;

const newDrawInstance = `const drawInstance = (ix: number, iy: number) => {
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

        const charX = ix + pOffsetX;
        const charY = iy + pOffsetY;

        // Custom drawn characters based on ID
        if (selectedChar.id === 'default') {
            ctx.fillStyle = selectedChar.color;
            ctx.beginPath();
            ctx.roundRect(charX, charY, pWidth, pHeight, 4);
            ctx.fill();
            // Headphone band
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(charX + pWidth/2, charY + 6, pWidth/2 + 2, Math.PI, 0);
            ctx.stroke();
            // Earcups
            ctx.fillStyle = selectedChar.accent;
            ctx.fillRect(charX - 2, charY + 4, 4, 8);
            ctx.fillRect(charX + pWidth - 2, charY + 4, 4, 8);
            // Face
            ctx.fillStyle = '#000';
            ctx.fillRect(charX + pWidth/2 - 4, charY + 12, 2, 2);
            ctx.fillRect(charX + pWidth/2 + 2, charY + 12, 2, 2);
        }
        else if (selectedChar.id === 'punk') {
            ctx.fillStyle = selectedChar.color;
            ctx.fillRect(charX, charY, pWidth, pHeight);
            // Mohawk
            ctx.fillStyle = selectedChar.accent;
            for(let m=0; m<3; m++) {
                ctx.beginPath();
                ctx.moveTo(charX + pWidth/2 - 4 + m*4, charY);
                ctx.lineTo(charX + pWidth/2 - 2 + m*4, charY - 8);
                ctx.lineTo(charX + pWidth/2 + m*4, charY);
                ctx.fill();
            }
            // Shades
            ctx.fillStyle = '#111';
            ctx.fillRect(charX + 2, charY + 8, pWidth - 4, 6);
        }
        else if (selectedChar.id === 'cyber') {
            ctx.fillStyle = selectedChar.color;
            ctx.beginPath();
            ctx.moveTo(charX, charY);
            ctx.lineTo(charX + pWidth, charY);
            ctx.lineTo(charX + pWidth - 4, charY + pHeight);
            ctx.lineTo(charX + 4, charY + pHeight);
            ctx.fill();
            // Visor
            ctx.fillStyle = selectedChar.accent;
            ctx.fillRect(charX, charY + 6, pWidth, 8);
            ctx.fillStyle = '#fff';
            ctx.fillRect(charX + 4, charY + 8, pWidth - 16, 2); // glowing eye slit
        }
        else if (selectedChar.id === 'ghost') {
            ctx.fillStyle = selectedChar.color;
            ctx.beginPath();
            ctx.arc(charX + pWidth/2, charY + pWidth/2, pWidth/2, Math.PI, 0);
            ctx.lineTo(charX + pWidth, charY + pHeight);
            // Wavy bottom
            ctx.lineTo(charX + pWidth*0.75, charY + pHeight - 4);
            ctx.lineTo(charX + pWidth*0.5, charY + pHeight);
            ctx.lineTo(charX + pWidth*0.25, charY + pHeight - 4);
            ctx.lineTo(charX, charY + pHeight);
            ctx.fill();
            // Eyes
            ctx.fillStyle = selectedChar.accent;
            ctx.beginPath();
            ctx.arc(charX + pWidth/2 - 4, charY + 10, 3, 0, Math.PI*2);
            ctx.arc(charX + pWidth/2 + 4, charY + 10, 3, 0, Math.PI*2);
            ctx.fill();
        }

        // Shield Effect
        if (player.shield > 0) {
          ctx.beginPath();
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.arc(ix + Math.max(player.width, 24)/2, iy + Math.max(player.height, 24)/2, 20 + Math.sin(Date.now()*0.01)*2, 0, Math.PI*2);
          ctx.stroke();
        }

        // Magnet Effect
        if (player.magnet > 0) {
          ctx.beginPath();
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.arc(ix + Math.max(player.width, 24)/2, iy + Math.max(player.height, 24)/2, 30 + Math.cos(Date.now()*0.01)*5, 0, Math.PI*2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Jetpack Effect
        if (player.jetpack > 0) {
          createParticles(ix + Math.max(player.width, 24)/2 - 4, iy + Math.max(player.height, 24), '#f59e0b');
        }

        ctx.restore();
      };`;

currFest = currFest.replace(drawInstancePattern, newDrawInstance);

fs.writeFileSync(festJumpPath, currFest);
console.log('FestJump character drawing overhauled.');
