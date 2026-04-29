const fs = require('fs');
const path = require('path');

const gamesDir = path.join(__dirname, 'src/components/games');
const files = fs.readdirSync(gamesDir);

files.forEach(file => {
  if (file.endsWith('.tsx') && file !== 'FestJump.tsx') {
    let content = fs.readFileSync(path.join(gamesDir, file), 'utf8');
    
    // Global improvement 1: Add a universal backdrop blur to gameover states if not present
    content = content.replace(/bg-black\/90/g, 'bg-black/90 backdrop-blur-sm');
    
    // Global improvement 2: Add dynamic karma earning multipliers based on performance where possible
    // Search for simple `setCoins(prev => prev + 10)` and double it up
    content = content.replace(/setFestCoins\(\(?prev\)?\s*=>\s*prev\s*\+\s*([0-9]+)\)/g, (match, num) => {
        return `setFestCoins(prev => prev + ${parseInt(num) + 5})`;
    });

    // Write back
    fs.writeFileSync(path.join(gamesDir, file), content);
  }
});

console.log('Global games enhanced.');
