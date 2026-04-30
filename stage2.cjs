const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

const targetBackgroundStars = \`      // Background Stars (Parallax)
            // Parallax Particles (Confetti / Dust)
      bgParticles.forEach(p => {
         p.wobble += 0.02;
         ctx.fillStyle = theme.star;
         ctx.beginPath();
         ctx.arc(p.x + Math.sin(p.wobble)*5, p.y, p.s, 0, Math.PI*2);
         ctx.fill();
      });\`;

const repBackgroundStars = \`      // Parallax Particles (Confetti / Dust)
      bgParticles.forEach(p => {
         p.wobble += 0.02;
         ctx.fillStyle = theme.star;
         ctx.beginPath();
         ctx.arc(p.x + Math.sin(p.wobble)*5, p.y, p.s, 0, Math.PI*2);
         ctx.fill();
      });

      // Render Crowd at the bottom of the screen always
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      const timeOffset = Date.now() * 0.005;
      for (let ix = 0; ix <= canvas.width + 10; ix += 10) {
         const crowdBounce = Math.sin(timeOffset + ix * 0.1) * 8 * Math.min(1, comboMultiplier / 2);
         const crowdHeight = 40 + Math.sin(ix * 0.5) * 10 + crowdBounce;
         if (ix === 0) ctx.moveTo(0, canvas.height);
         ctx.lineTo(ix, canvas.height - crowdHeight);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.fill();

      // Occasional glow sticks in crowd
      for (let ix = 20; ix < canvas.width; ix += 40) {
         if (Math.sin(timeOffset * 0.5 + ix) > 0.4) {
            ctx.strokeStyle = theme.platMov;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const glowY = canvas.height - 35 + Math.sin(timeOffset * 2 + ix) * 10;
            const glowX = ix + Math.cos(timeOffset * 2 + ix) * 5;
            ctx.moveTo(ix, canvas.height - 15);
            ctx.lineTo(glowX, glowY);
            ctx.stroke();
         }
      }\`;

code = code.replace(targetBackgroundStars, repBackgroundStars);

fs.writeFileSync('src/components/games/FestJump.tsx', code);
