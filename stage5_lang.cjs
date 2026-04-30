const fs = require('fs');
let code = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

// Replace Spanish Strings
code = code.replace(/'game\.car\.taxi\.name': 'Traslado Urbano',/g, "'game.car.taxi.name': 'Taxi CDMX',");
code = code.replace(/'game\.car\.taxi\.desc': 'Confiable y equilibrado para el tráfico\.',/g, "'game.car.taxi.desc': 'El clásico e inmortal rosita salvaje.',");
code = code.replace(/'game\.car\.sport\.name': 'Velocity RS',/g, "'game.car.sport.name': 'Fífí Sport',");
code = code.replace(/'game\.car\.sport\.desc': 'Alta velocidad y aerodinámica extrema\.',/g, "'game.car.sport.desc': 'Rapidísimo pero si agarra un bache se desarma.',");
code = code.replace(/'game\.car\.truck\.name': 'Sentinel X',/g, "'game.car.truck.name': 'Combi Ruta 14',");
code = code.replace(/'game\.car\.truck\.desc': 'Blindaje pesado y potencia imparable\.',/g, "'game.car.truck.desc': 'Cámara mi gente, ya se la saben. Pesada y letal.',");
code = code.replace(/'game\.car\.moto\.name': 'Neon Reaper',/g, "'game.car.moto.name': 'Pizzero Kamikaze',");
code = code.replace(/'game\.car\.moto\.desc': 'Agilidad inigualable y derrapes de neón\.',/g, "'game.car.moto.desc': 'Filtra por donde sea, pero un llegue y vales ma...',");

// English
code = code.replace(/'game\.car\.taxi\.name': 'Urban Shuttle',/g, "'game.car.taxi.name': 'CDMX Taxi',");
code = code.replace(/'game\.car\.taxi\.desc': 'Balanced and reliable for heavy traffic\.',/g, "'game.car.taxi.desc': 'The classic pink & white survivor.',");
code = code.replace(/'game\.car\.sport\.desc': 'Extreme speed and aerodynamics\.',/g, "'game.car.sport.desc': 'Ultra fast, but cries at every pothole.',");
code = code.replace(/'game\.car\.truck\.name': 'Sentinel X',/g, "'game.car.truck.name': 'Microbus',");
code = code.replace(/'game\.car\.truck\.desc': 'Heavy armor and unstoppable power\.',/g, "'game.car.truck.desc': 'The real king of the street. Unstoppable.',");
code = code.replace(/'game\.car\.moto\.name': 'Neon Reaper',/g, "'game.car.moto.name': 'Delivery Moto',");
code = code.replace(/'game\.car\.moto\.desc': 'Unmatched agility and neon drifting\.',/g, "'game.car.moto.desc': 'Squeezes through traffic, zero armor.',");

// French
code = code.replace(/'game\.car\.taxi\.name': 'Navette Urbaine',/g, "'game.car.taxi.name': 'Taxi CDMX',");
code = code.replace(/'game\.car\.taxi\.desc': 'Équilibré et fiable pour le trafic intense\.',/g, "'game.car.taxi.desc': 'Le classique rose et blanc.',");
code = code.replace(/'game\.car\.sport\.desc': 'Vitesse extrême et aérodynamisme\.',/g, "'game.car.sport.desc': 'Ultra rapide, mais déteste les nids-de-poule.',");
code = code.replace(/'game\.car\.truck\.name': 'Sentinel X',/g, "'game.car.truck.name': 'Microbus',");
code = code.replace(/'game\.car\.truck\.desc': 'Blindage lourd et puissance imparable\.',/g, "'game.car.truck.desc': 'Le vrai roi de la rue. Imparable.',");
code = code.replace(/'game\.car\.moto\.name': 'Neon Reaper',/g, "'game.car.moto.name': 'Moto Livreur',");
code = code.replace(/'game\.car\.moto\.desc': 'Agilité inégalée et dérapages au néon\.',/g, "'game.car.moto.desc': 'Se faufile partout, aucune armure.',");

fs.writeFileSync('src/context/LanguageContext.tsx', code);
