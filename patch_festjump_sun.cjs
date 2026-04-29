const fs = require('fs');
const festJumpPath = 'src/components/games/FestJump.tsx';
let currFest = fs.readFileSync(festJumpPath, 'utf8');

// 1. Add player explosion effect
currFest = currFest.replace(/if \(player\.y > canvas\.height\) \{[\s\S]*?playSound\('lose'\);[\s\S]*?setIsPlaying\(false\);[\s\S]*?\}/g, 
`if (player.y > canvas.height) {
        if (player.vy < 50) { // meaning they just fell out
          createParticles(player.x + player.width/2, canvas.height - 10, '#f43f5e');
          createParticles(player.x + player.width/2, canvas.height - 10, '#eab308');
        }
        playSound('lose');
        setIsPlaying(false);
      }`);

currFest = currFest.replace(/} else \{[\s\S]*?playSound\('lose'\);[\s\S]*?setIsPlaying\(false\);[\s\S]*?\}/g, 
`} else {
             createParticles(player.x + player.width/2, player.y + player.height/2, '#f43f5e');
             createParticles(player.x + player.width/2, player.y + player.height/2, '#ffffff');
             playSound('lose');
             
             // Tiny delay before actually stopping to show explosion? 
             // We can just stop it. The particles will freeze or clear.
             // But let's just do it instantly.
             setIsPlaying(false);
          }`);

// 2. Add Synthwave Sun below the starfield, above the grid
currFest = currFest.replace(/\/\/ Synthwave \/ Retro grid background/, 
`// Synthwave Sun
      ctx.save();
      const sunY = (canvas.height * 0.8) + (cameraY * 0.05) % 80;
      ctx.translate(canvas.width / 2, sunY);
      
      const sunGradient = ctx.createLinearGradient(0, -100, 0, 100);
      sunGradient.addColorStop(0, '#f97316'); // Orange
      sunGradient.addColorStop(0.4, '#e11d48'); // Pink-red
      sunGradient.addColorStop(0.8, '#7e22ce'); // Purple
      
      ctx.beginPath();
      ctx.arc(0, 0, 100, 0, Math.PI * 2);
      ctx.fillStyle = sunGradient;
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#e11d48';
      ctx.fill();

      // Sun stripes (outrun style)
      ctx.globalCompositeOperation = 'destination-out';
      for(let i = 0; i < 7; i++) {
         const stripeY = i * 18 - 20;
         const stripeH = 3 + i * 2;
         ctx.fillRect(-120, stripeY, 240, stripeH);
      }
      ctx.restore();

      // Synthwave / Retro grid background`);

// 3. Make bullets look better (lasers)
currFest = currFest.replace(/ctx\.fillStyle \= '\#f43f5e';[\s\S]*?ctx\.fillRect\(b\.x, b\.y, 4, 12\);/g, 
`ctx.shadowBlur = 10;
        ctx.shadowColor = '#f43f5e';
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.roundRect(b.x - 1, b.y, 4, 16, 2);
        ctx.fill();
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(b.x, b.y + 2, 2, 12);
        ctx.shadowBlur = 0;`);

// 4. Improve floating text font
currFest = currFest.replace(/ctx\.font = 'bold 16px monospace';/g, `ctx.font = '900 18px monospace'; ctx.textAlign = 'center';`);

// 5. Increase game visual polish: Add bloom effect overlay when shooting/action? 
// Maybe just keep styles clean.

fs.writeFileSync(festJumpPath, currFest);
console.log('FestJump styles improved.');
