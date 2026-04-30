const fs = require('fs');
let code = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');
code = code.replace(/2026/g, 'VIRTUAL');
fs.writeFileSync('src/context/LanguageContext.tsx', code);
