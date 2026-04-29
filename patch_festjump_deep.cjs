const fs = require('fs');
const path = require('path');

let festJumpPath = path.join(__dirname, 'src/components/games/FestJump.tsx');
let currFest = fs.readFileSync(festJumpPath, 'utf8');

// 1. Add doubleJump property to characters
currFest = currFest.replace(/interface Character \{[^\}]+\}/, 
`interface Character {
  id: string;
  nameKey: string;
  descKey: string;
  price: number;
  jumpForce: number;
  speed: number;
  color: string;
  accent: string;
  doubleJump?: boolean;
}`);

currFest = currFest.replace(/id: 'cyber',[\s\S]*?accent: '#eab308'/m, 
`$&, 
    doubleJump: true`);

// 2. Add player jump counter and logic
currFest = currFest.replace(/jetpack: 0,[\s\n]*magnet: 0,[\s\n]*lastShot: 0,/m, 
`$&
      jumps: 0,`);

currFest = currFest.replace(/const handleKeyDown = \(e: KeyboardEvent\) => \{/,
`const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ') {
         if (player.jumps > 0 && player.jumps < (selectedChar.doubleJump ? 2 : 1) && player.vy > -5 && player.vy < 10) {
            player.vy = selectedChar.jumpForce * 0.8;
            player.jumps++;
            playSound('jump');
            createParticles(player.x + player.width/2, player.y + player.height, '#fff');
         }
      }`);

currFest = currFest.replace(/player\.vy = \(p\.hasSpring \? selectedChar\.jumpForce \* 1\.85 : selectedChar\.jumpForce\) - JUMP_BOOST;/g, 
`player.vy = (p.hasSpring ? selectedChar.jumpForce * 1.85 : selectedChar.jumpForce) - JUMP_BOOST;
            player.jumps = 1;`);


// 3. Add more platform types
currFest = currFest.replace(/const isPhantom = !isMoving && !isBreaking && !isGlass && Math\.random\(\) < 0\.15;/,
`const isPhantom = !isMoving && !isBreaking && !isGlass && Math.random() < 0.15;
            const isSponsor = !isMoving && !isBreaking && !isGlass && !isPhantom && Math.random() < 0.05;`);
currFest = currFest.replace(/p\.type = isMoving \? 'moving' : isBreaking \? 'breaking' : isGlass \? 'glass' : isPhantom \? 'phantom' : isBoost \? 'boost' : 'normal';/,
`p.type = isMoving ? 'moving' : isBreaking ? 'breaking' : isGlass ? 'glass' : isPhantom ? 'phantom' : isBoost ? 'boost' : isSponsor ? 'sponsor' : 'normal';`);

currFest = currFest.replace(/else if \(cameraY > 5000\) pColor = '#e879f9';/,
`else if (cameraY > 5000) pColor = '#e879f9';
          if (p.type === 'sponsor') pColor = '#f43f5e';`);

currFest = currFest.replace(/if \(p\.type === 'boost'\) \{/g,
`if (p.type === 'sponsor') {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.font = 'bold 8px monospace';
            ctx.fillText('SPONSOR', pX + p.width/2 - 15, p.y + Math.sin(Date.now()*0.005)*2);
          }
          if (p.type === 'boost') {`);

currFest = currFest.replace(/if \(p\.type !== 'breaking' && p\.type !== 'phantom' && p\.type !== 'boost'\) \{[\s]*spawnPowerup\(p\);[\s]*\}/,
`if (p.type !== 'breaking' && p.type !== 'phantom' && p.type !== 'boost') {
              spawnPowerup(p);
            }
            if (p.type === 'sponsor') {
              spawnPowerup(p);
              spawnPowerup({...p, x: p.x + p.width/2});
            }`);

fs.writeFileSync(festJumpPath, currFest);
console.log('FestJump platform and jump logic updated.');
