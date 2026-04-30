const fs = require('fs');
let code = fs.readFileSync('src/components/games/FestJump.tsx', 'utf8');

// 1. Remove handleGameOver and its useEffect
code = code.replace(/const handleGameOver = \(\) => \{[\s\S]*?\}, \[isPlaying\]\);/, '');

// 2. Adjust game over logic
const gameOverLogic = `playSound('lose');
             const finalScore = Math.floor(maxScore) + bonusScore;
             setScore(finalScore);
             setFestCoins(prev => prev + sessionCoins + Math.floor(finalScore / 50));
             if (finalScore > highScore) setHighScore(finalScore);
             setIsPlaying(false);`;

code = code.replace(/playSound\('lose'\);\s*setIsPlaying\(false\);/g, gameOverLogic);

code = code.replace(/sessionCoins \+= (\d+); if \(coinsRefDOM.current\) coinsRefDOM.current.innerText = \(festCoins \+ sessionCoins\).toString\(\);/g, 
  "sessionCoins += $1; if (coinsRefDOM.current) coinsRefDOM.current.innerText = (festCoins + sessionCoins).toString() + ' KARMAS';");

fs.writeFileSync('src/components/games/FestJump.tsx', code);
