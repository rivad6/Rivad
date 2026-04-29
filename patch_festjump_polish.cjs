const fs = require('fs');
const path = require('path');

let festJumpPath = path.join(__dirname, 'src/components/games/FestJump.tsx');
let currFest = fs.readFileSync(festJumpPath, 'utf8');

// Improve Perfect hit particles and visual feedback
currFest = currFest.replace(/if \(isPerfect\) \{[\s\S]*?addFloatingText[^\n]+/m,
`if (isPerfect) {
              bonusScore += 50 * comboMultiplier;
              setFestCoins(prev => prev + 2);
              createParticles(p.x + p.width/2, p.y, '#ffffff'); // Base particles
              createParticles(p.x + p.width/2, p.y, selectedChar.accent); // Accent particles
              shake = 10;
              comboMultiplier++;
              comboTimer = 180 + (upgrades.luck * 60);
              addFloatingText(player.x, player.y - 20, 'PERFECT! X' + comboMultiplier, '#ec4899', '#be185d');
              playSound('powerup');`);
              
currFest = currFest.replace(/const createParticles = \(([^)]+)\) => \{[\s\S]*?\};/, 
`const createParticles = ($1) => {
      const pCount = color === '#ffffff' ? 12 : 8;
      for(let i=0; i<pCount; i++) {
        particles.push({
          x: x + (Math.random() - 0.5)*30, 
          y: y + (Math.random() - 0.5)*15, 
          life: 1.0 + Math.random()*0.5,
          color
        });
      }
    };`);

// Also fix some issues with max level in Upgrades
currFest = currFest.replace(/const cost = \(level \+ 1\) \* 300;/g, 
`const isMax = level >= 5;
const cost = (level + 1) * 300;`);

currFest = currFest.replace(/<button[^>]*onClick=\{\(\) => buyUpgrade\(upg\.key\)\}[^>]*>[\s\S]*?<\/button>/g,
`<button 
                                  onClick={() => buyUpgrade(upg.key)}
                                  disabled={festCoins < cost || isMax}
                                  className={\`w-full py-1.5 text-[8px] font-bold uppercase transition-all \${isMax ? 'bg-zinc-800 text-zinc-500 line-through' : festCoins >= cost ? 'bg-white text-black hover:bg-brand-accent hover:text-white' : 'bg-zinc-800 text-zinc-600'}\`}
                                >
                                  {isMax ? 'MAX LEVEL' : \`UPGRADE - \${cost} KARMAS\`}
                                </button>`);

currFest = currFest.replace(/if \(festCoins >= cost\) \{/g, `if (festCoins >= cost && upgrades[type] < 5) {`);

fs.writeFileSync(festJumpPath, currFest);
console.log('FestJump additional polish applied.');
