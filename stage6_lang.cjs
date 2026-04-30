const fs = require('fs');
let code = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

code = code.replace(/'game\.race\.out_of_gas': 'Sin gasolina',/g, "'game.race.out_of_gas': '¡Te quedaste sin gas, valedor!',");
code = code.replace(/'game\.race\.crashed': 'Vehículo Destruido',/g, "'game.race.crashed': '¡Te mandaron al corralón!',");

code = code.replace(/'game\.race\.out_of_gas': 'OUT OF GAS!',/g, "'game.race.out_of_gas': 'OUT OF GAS!',");
code = code.replace(/'game\.race\.crashed': 'VEHICLE DESTROYED',/g, "'game.race.crashed': 'TOTALED!',");

code = code.replace(/'game\.race\.out_of_gas': 'PANNE D\'ESSENCE !',/g, "'game.race.out_of_gas': 'PANNE D\\'ESSENCE !',");
code = code.replace(/'game\.race\.crashed': 'VÉHICULE DÉTRUIT',/g, "'game.race.crashed': 'DÉTRUIT !',");

fs.writeFileSync('src/context/LanguageContext.tsx', code);
