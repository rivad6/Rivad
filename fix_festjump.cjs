const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

// 1. Fix sensitivity by adding touchTargetX and interpolating vx
code = code.replace(/let cameraY = 0;/, "let cameraY = 0;\n    let touchTargetX: number | null = null;");
code = code.replace(/const handlePointerMove = \(e: any\) => \{[\s\S]*?player\.vx = 0;\s*\};/m, 
  "const handlePointerMove = (e: any) => {\n      const rect = canvas.getBoundingClientRect();\n      const clientX = e.touches ? e.touches[0].clientX : e.clientX;\n      touchTargetX = ((clientX - rect.left) / rect.width) * canvas.width - player.width / 2;\n    };");

code = code.replace(/const handlePointerUp = \(\) => isShooting = false;/, "const handlePointerUp = () => { isShooting = false; touchTargetX = null; };");
code = code.replace(/canvas\.addEventListener\('touchend', handlePointerUp\);/, "canvas.addEventListener('touchend', handlePointerUp);\n    canvas.addEventListener('mouseleave', handlePointerUp);");

// In update, handle the velocity for smoothness
code = code.replace(/if \(keys\.left\) player\.vx -= 1 \* normalDt;[\s\S]*?player\.vx\)\);/m, 
`if (touchTargetX !== null) {
         const diff = touchTargetX - player.x;
         player.vx = diff * 0.15; // Smooth tracking
         player.vx = Math.max(-selectedChar.speed * 1.5, Math.min(selectedChar.speed * 1.5, player.vx));
      } else {
         if (keys.left) player.vx -= 1.5 * normalDt;
         else if (keys.right) player.vx += 1.5 * normalDt;
         else player.vx *= Math.pow(0.8, normalDt);
         player.vx = Math.max(-selectedChar.speed, Math.min(selectedChar.speed, player.vx));
      }`);


// 2. Fix Graphics (Retro Grid, Pixelated rendering)
code = code.replace(/ctx\.fillStyle = '#0f172a'; \/\/ Classic dark slate background for DOS game feel[\s\S]*?ctx\.fillRect\(0, 0, canvas\.width, canvas\.height\);/m, 
`ctx.fillStyle = '#050510'; // Deep dark blue for synth grid
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Synthwave / Retro grid background
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const yOffset = (cameraY * 0.3) % gridSize;
      ctx.beginPath();
      for(let y = yOffset; y < canvas.height; y += gridSize) {
         ctx.moveTo(0, y);
         ctx.lineTo(canvas.width, y);
      }
      for(let x = 0; x < canvas.width; x += gridSize) {
         ctx.moveTo(x, 0);
         ctx.lineTo(x, canvas.height);
      }
      ctx.stroke();`);

// Player rect rendering
code = code.replace(/ctx\.beginPath\(\);\s*ctx\.roundRect\(charX, charY, pWidth, pHeight, 4\);\s*ctx\.fill\(\);/s, 
`ctx.fillStyle = '#000'; // outline
      ctx.fillRect(charX - 1, charY - 1, pWidth + 2, pHeight + 2);
      ctx.fillStyle = selectedChar.color;
      ctx.fillRect(charX, charY, pWidth, pHeight);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillRect(charX, charY, pWidth, 2);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(charX, charY + pHeight - 4, pWidth, 4);`);
      

// Platform retro rendering
code = code.replace(/ctx\.fillStyle = 'rgba\\(0,0,0,0\.5\\)';[\s\n]*ctx\.fillRect\\(p\.x \+ 4, p\.y \+ 4, p\.width, PLATFORM_HEIGHT\\);/, 
`ctx.fillStyle = '#020617'; // hard drop shadow instead of alpha for retro style
        ctx.fillRect(p.x + 4, p.y + 4, p.width, PLATFORM_HEIGHT);`);
        
code = code.replace(/ctx\.fillStyle = '#334155';[\s\S]*?ctx\.fillRect\(p\.x, p\.y, p\.width, 3\);/m, 
`ctx.fillStyle = '#000';
            ctx.fillRect(p.x - 1, p.y - 1, p.width + 2, PLATFORM_HEIGHT + 2);
            ctx.fillStyle = '#1e1b4b'; // dark retro base
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT);
            ctx.fillStyle = pColor;
            ctx.fillRect(p.x, p.y, p.width, PLATFORM_HEIGHT - 4);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(p.x, p.y, p.width, 2);`);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
