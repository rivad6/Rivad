const fs = require('fs');
let code = fs.readFileSync('src/components/games/MeetingRace.tsx', 'utf8');

const regex = /ctx\.fillStyle = asphaltColor; \/\/ Asphalt\s*ctx\.fillRect\(0, 0, GAME_W, GAME_H\);/;

const replacement = `ctx.fillStyle = asphaltColor; // Asphalt
      ctx.fillRect(0, 0, GAME_W, GAME_H);
      
      // Metrobus Lane (CDMX)
      ctx.fillStyle = 'rgba(220, 38, 38, 0.15)'; // Deep red lane right side
      ctx.fillRect(LANES[5] - LANE_WIDTH/2, 0, LANE_WIDTH, GAME_H);
      ctx.fillStyle = 'rgba(220, 38, 38, 0.5)'; // line
      ctx.fillRect(LANES[5] - LANE_WIDTH/2 - 2, 0, 4, GAME_H);
      
      // Bike Lane (Ciclovía CDMX)
      ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'; // Green lane left side
      ctx.fillRect(LANES[0] - LANE_WIDTH/2, 0, LANE_WIDTH, GAME_H);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.5)'; // line
      ctx.fillRect(LANES[0] + LANE_WIDTH/2 - 2, 0, 4, GAME_H);`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/games/MeetingRace.tsx', code);
