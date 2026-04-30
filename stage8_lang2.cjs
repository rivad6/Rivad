const fs = require('fs');
let code = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

code = code.replace(/'game\.arc\.race': 'VIERNES DE PAGO',/g, "'game.arc.race': 'CAOS VIAL CDMX',");
code = code.replace(/'game\.arc\.race\.desc': '¡Es viernes! Llega al banco antes de que cierren para cobrar tu cheque\. Esquiva las facturas y el tráfico\.',/g, "'game.arc.race.desc': '¡Sobrevive a la hora pico! Esquiva microbuses, baches sueltos y llega a tu destino entero.',");

code = code.replace(/'game\.arc\.race': 'PAY DAY RACE',/g, "'game.arc.race': 'MEXICO CITY RUSH',");
code = code.replace(/'game\.arc\.race\.desc': "It's Friday! Reach the bank before they close to cash your check\. Avoid bills and traffic\.",/g, "'game.arc.race.desc': 'Survive rush hour! Dodge wild microbuses, lethal potholes, and traffic cops.',");

code = code.replace(/'game\.arc\.race': 'COURSE DE LA PAYE',/g, "'game.arc.race': 'RUSH CDMX',");
code = code.replace(/'game\.arc\.race\.desc': "C'est vendredi ! Arrivez à la banque avant la fermeture pour encaisser votre chèque\. Évitez les factures et le trafic\.",/g, "'game.arc.race.desc': 'Survivez à l\\'heure de pointe ! Évitez les microbus fous et arrivez entier.',");

fs.writeFileSync('src/context/LanguageContext.tsx', code);
