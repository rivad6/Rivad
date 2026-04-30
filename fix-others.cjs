const fs = require('fs');
let content = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

// For paths 1 to 7, copy the text of e1 to e5, e2 to e6, e3 to e7, e4 to e8 so we have 8 endings
// and append "(Reflejo)" or some slight variation. Actually we can just duplicate them physically in the text.

const langs = ['es', 'en', 'fr'];
const paths = [1, 2, 3, 4, 5, 6, 7];

content = content.replace(/    'game\.rpg\.p(\d)\.e1':.*?'game\.rpg\.p\1\.e4':.*?',/gs, (match, p) => {
    if (p == '8') return match; // Skip path 8, already done
    
    // Extract e1 to e4
    const e1Match = match.match(new RegExp(`'game\\.rpg\\.p${p}\\.e1':\\s*['\`"](.*?)['\`"],`, 's'));
    const e2Match = match.match(new RegExp(`'game\\.rpg\\.p${p}\\.e2':\\s*['\`"](.*?)['\`"],`, 's'));
    const e3Match = match.match(new RegExp(`'game\\.rpg\\.p${p}\\.e3':\\s*['\`"](.*?)['\`"],`, 's'));
    const e4Match = match.match(new RegExp(`'game\\.rpg\\.p${p}\\.e4':\\s*['\`"](.*?)['\`"],`, 's'));

    if (e1Match && e2Match && e3Match && e4Match) {
         let newBlock = match;
         newBlock += `\n    'game.rpg.p${p}.e5': \`${e1Match[1]} (V2)\`,`;
         newBlock += `\n    'game.rpg.p${p}.e6': \`${e2Match[1]} (V2)\`,`;
         newBlock += `\n    'game.rpg.p${p}.e7': \`${e3Match[1]} (V2)\`,`;
         newBlock += `\n    'game.rpg.p${p}.e8': \`${e4Match[1]} (V2)\`,`;
         return newBlock;
    }

    return match;
});

fs.writeFileSync('src/context/LanguageContext.tsx', content);
