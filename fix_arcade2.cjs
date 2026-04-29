const fs = require('fs');
let code = fs.readFileSync('src/components/Arcade.tsx', 'utf8');
code = code.replace(/A:\\\\> AWAITING/g, "A:\\\\&gt; AWAITING");
fs.writeFileSync('src/components/Arcade.tsx', code);
