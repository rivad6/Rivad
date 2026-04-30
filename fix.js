const fs = require('fs');
let code = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

code = code.replace(/'performance inmersivo'\./g, '"performance inmersivo".');
code = code.replace(/'immersive performance'\./g, '"immersive performance".');
code = code.replace(/'performance immersive'\./g, '"performance immersive".');

fs.writeFileSync('src/context/LanguageContext.tsx', code);
