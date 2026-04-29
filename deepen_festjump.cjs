const fs = require('fs');
const path = require('path');

let festFilePath = path.join(__dirname, 'src/components/games/FestJump.tsx');
let content = fs.readFileSync(festFilePath, 'utf8');

// 1. Add new Platform Type: Billboard / Ad Integration
content = content.replace(/const isPhantom = !isMoving && !isBreaking && !isGlass && Math\.random\(\) < 0\.15;/, 
`const isPhantom = !isMoving && !isBreaking && !isGlass && Math.random() < 0.15;
            const isBillboard = !isMoving && !isBreaking && !isGlass && !isPhantom && Math.random() < 0.1;`);

content = content.replace(/p\.type = isMoving \? 'moving' \: isBreaking \? 'breaking' \: isGlass \? 'glass' \: isPhantom \? 'phantom' \: isBoost \? 'boost' \: isSponsor \? 'sponsor' \: 'normal';/,
`p.type = isMoving ? 'moving' : isBreaking ? 'breaking' : isGlass ? 'glass' : isPhantom ? 'phantom' : isBoost ? 'boost' : isSponsor ? 'sponsor' : isBillboard ? 'billboard' : 'normal';
            if (isBillboard) {
               p.width = PLATFORM_WIDTH * 2; // Make billboard platforms wider
            }`);

// Drawing the billboard in Draw loops
content = content.replace(/if \(p\.type === 'sponsor'\) \{[\s\n]*ctx\.fillStyle = 'rgba\(255,255,255,0\.9\)';[\s\n]*ctx\.font = 'bold 8px monospace';[\s\n]*ctx\.fillText\('SPONSOR', pX \+ p\.width\/2 - 15, p\.y \+ Math\.sin\(Date\.now\(\)\*0\.005\)\*2\);[\s\n]*\}/g,
`if (p.type === 'sponsor') {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('SPONSOR', pX + p.width/2 - 15, p.y + Math.sin(Date.now()*0.005)*2);
          }
          if (p.type === 'billboard') {
             ctx.fillStyle = '#0f172a'; // dark slate
             ctx.beginPath();
             ctx.roundRect(pX + 10, p.y - 40, p.width - 20, 30, 4);
             ctx.fill();
             ctx.strokeStyle = '#38bdf8';
             ctx.lineWidth = 2;
             ctx.stroke();
             ctx.fillStyle = '#38bdf8';
             ctx.font = 'bold 10px monospace';
             const brands = ['CYBER-COLA', 'SNEAKER CORP', 'SISYPHUS TECH', 'NEON GEAR'];
             const idx = Math.floor((p.x % 100) / 25) % brands.length;
             ctx.fillText(brands[idx], pX + 15, p.y - 20);
             
             // Billboard supports
             ctx.fillStyle = '#475569';
             ctx.fillRect(pX + 20, p.y - 10, 4, 10);
             ctx.fillRect(pX + p.width - 24, p.y - 10, 4, 10);
          }`);

// Make Billboard collidable and grant massive bonus points
content = content.replace(/if \(p\.type === 'boost'\) \{/g, 
`if (p.type === 'billboard') {
              if (comboTimer <= 0) {
                 addFloatingText(player.x, player.y - 30, 'AD ENGAGEMENT!', '#38bdf8');
                 setFestCoins(prev => prev + 5);
                 playSound('powerup');
              }
            }
            if (p.type === 'boost') {`);

// 2. Add "Ad Break" powerup event
content = content.replace(/let comboTimer = 0;/, "let comboTimer = 0;\n    let adBreakTimer = 0;");

content = content.replace(/let isShooting = false;/, 
`let isShooting = false;
    let cameraShake = 0;`);

// Ad break logic in update loop
content = content.replace(/if \(shake > 0\) shake \*= Math\.pow\(0\.9, normalDt\);/,
`if (shake > 0) shake *= Math.pow(0.9, normalDt);
      if (adBreakTimer > 0) {
         adBreakTimer -= normalDt;
         if (Math.random() < 0.1) {
            setFestCoins(prev => prev + 1);
            bonusScore += 50;
            addFloatingText(player.x + (Math.random()-0.5)*100, player.y - Math.random()*100, '$$$', '#10b981');
         }
      }`);

// Ad break rendering
content = content.replace(/if \(comboTimer > 0 && comboMultiplier > 1\) \{/,
`if (adBreakTimer > 0) {
         ctx.fillStyle = \`rgba(16, 185, 129, \${adBreakTimer / 300})\`;
         ctx.font = '900 40px monospace';
         ctx.textAlign = 'center';
         ctx.fillText('SPONSOR RAIN!', canvas.width/2, 100);
         ctx.textAlign = 'left';
         
         ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      if (comboTimer > 0 && comboMultiplier > 1) {`);

// Trigger ad break with VIP powerup
content = content.replace(/if \(pw\.type === 'vip'\) \{[\s\S]*?\} else if \(pw\.type === 'merch'\)/,
`if (pw.type === 'vip') {
            setFestCoins(prev => prev + 50);
            bonusScore += 500;
            playSound('win');
            addFloatingText(pw.x, pw.y, 'VIP +50!', '#f59e0b', '#78350f');
            adBreakTimer = 300; // Trigger Ad Break!
            shake = 20;
            screenFlash = 0.8;
          } else if (pw.type === 'merch')`);

// Enhance Player rendering shapes
content = content.replace(/const pWidth = player\.width \* stretchX;/g, 
`// Ensure aspect ratio keeps the player grounded properly
        const pWidth = player.width * stretchX;`);

fs.writeFileSync(festFilePath, content);
console.log('FestJump Deepened successfully.');
