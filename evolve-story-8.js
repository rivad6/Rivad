const fs = require('fs');

let content = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

const transformBlock = (lang, replacements) => {
    for (let key in replacements) {
        // Regex to match: 'key': 'old_value',
        // and replace with 'key': 'new_value',
        const regex = new RegExp(`'${key}':\\s*'.*?',`, 'g');
        content = content.replace(regex, `'${key}': \`${replacements[key]}\`,`);
    }
}

// Just doing Path 8 (Paradox) first, expanding e1 to e8 properly to address the user's specific feedback about clones and fight club, plus ensuring deep lore.
const esPath8 = {
    'game.rpg.p8.e1': 'FINAL: EL RENACIMIENTO ETERNO\\nEres un genio del pincel, pero siempre en el siglo XV. Acabas de inventar el WiFi con cables de cobre y sudor renacentista.',
    'game.rpg.p8.e2': 'FINAL: EL MAGNATE TEMPORAL\\nVendiste boletos VIP para el asedio de Florencia. Eres rico, pero la Inquisición te persigue por revendedor.',
    'game.rpg.p8.e3': 'FINAL: EJÉRCITO DE UNO\\nTienes un imperio formado solo por clones tuyos. El problema es que el sindicato de clones pide vacaciones y tú no quieres pagarlas.',
    'game.rpg.p8.e4': 'FINAL: EL CLUB DE LA PELEA EXISTENCIAL\\nLa primera regla del club es no hablar del club. La segunda es no golpear a tu propio clon en la cara. Terminaste siendo el campeón invicto de romperte la nariz a ti mismo en múltiples ejes temporales.',
    'game.rpg.p8.e5': 'FINAL: EL LOOP PERFECTO\\nRepites la inauguración tan a la perfección que los críticos lloran sangre. Vives en un jueves infinito comiendo canapés prístinos.',
    'game.rpg.p8.e6': 'FINAL: LOCURA CRONOLÓGICA\\nTe bebiste 74 copas de vino en 2 segundos cruzando dimensiones. Ahora hablas en código Morse parpadeando.',
    'game.rpg.p8.e7': 'FINAL: EL VOYEUR CÓSMICO\\nAceptas observar. Ves nacer y morir galaxias en las manchas de humedad de la galería. Es una obra maestra.',
    'game.rpg.p8.e8': 'FINAL: LA NORMALIDAD BIZARRA\\nBrindas. La noche termina. Pero al salir, notas que el cielo es verde neón y todos hablan en latín. Guardas el secreto para no ser despedido.'
};

const enPath8 = {
    'game.rpg.p8.e1': 'ENDING: ETERNAL RENAISSANCE\\nYou are a genius painter, but always in the 15th century. You just invented WiFi using copper wires and Renaissance sweat.',
    'game.rpg.p8.e2': 'ENDING: THE TIME TYCOON\\nYou sold VIP tickets to the Siege of Florence. You are wealthy, but the Inquisition is hunting you for scalping.',
    'game.rpg.p8.e3': 'ENDING: ARMY OF ONE\\nYou have an empire made only of your clones. The problem is the clone union demands vacation time and you refuse to pay.',
    'game.rpg.p8.e4': 'ENDING: EXISTENTIAL FIGHT CLUB\\nThe first rule is you do not talk about the club. The second is do not punch your own clone in the face. You became the undefeated champion of breaking your own nose across multiple timelines.',
    'game.rpg.p8.e5': 'ENDING: THE PERFECT LOOP\\nYou repeat the inauguration so flawlessly that critics weep blood. You live in an infinite Thursday eating pristine canapés.',
    'game.rpg.p8.e6': 'ENDING: CHRONOLOGICAL MADNESS\\nYou drank 74 glasses of wine in 2 seconds crossing dimensions. Now you speak in Morse code by blinking.',
    'game.rpg.p8.e7': 'ENDING: THE COSMIC VOYEUR\\nYou accept to just observe. You see galaxies born and die in the damp spots of the gallery walls. A masterpiece.',
    'game.rpg.p8.e8': 'ENDING: BIZARRE NORMALITY\\nYou toast. Night ends. But walking out, the sky is neon green and everyone speaks Latin. You keep quiet to avoid getting fired.'
};

const frPath8 = {
    'game.rpg.p8.e1': 'FINAL : RENAISSANCE ÉTERNELLE\\nVous êtes un peintre de génie, mais toujours au XVe siècle. Vous venez d\'inventer le WiFi avec des fils de cuivre et de la sueur.',
    'game.rpg.p8.e2': 'FINAL : LE MAGNAT DU TEMPS\\nVous avez vendu des billets VIP pour le siège de Florence. Vous êtes riche, mais l\'Inquisition vous traque pour revente.',
    'game.rpg.p8.e3': 'FINAL : ARMÉE DE UN\\nVous avez un empire composé uniquement de vos clones. Le problème est que le syndicat des clones réclame des vacances.',
    'game.rpg.p8.e4': 'FINAL : FIGHT CLUB EXISTENTIEL\\nLa première règle est de ne pas en parler. La deuxième est de ne pas frapper son propre clone. Vous êtes le champion invaincu de vous casser votre propre nez à travers le continuum espace-temps.',
    'game.rpg.p8.e5': 'FINAL : LA BOUCLE PARFAITE\\nVous répétez l\'événement si parfaitement que les critiques pleurent du sang. Vous vivez dans un jeudi infini.',
    'game.rpg.p8.e6': 'FINAL : FOLIE CHRONOLOGIQUE\\nVous avez bu 74 verres de vin en 2 secondes en traversant les dimensions. Vous parlez en morse en clignant des yeux.',
    'game.rpg.p8.e7': 'FINAL : LE VOYEUR COSMIQUE\\nVous acceptez d\'observer. Vous voyez des galaxies naître et mourir dans l\'humidité de la galerie. Un chef-d\'œuvre.',
    'game.rpg.p8.e8': 'FINAL : NORMALITÉ BIZARRE\\nLa nuit se termine. Mais en sortant, le ciel est vert fluo et tout le monde parle latin. Vous vous taisez pour ne pas être licencié.'
};

transformBlock('es', esPath8);
transformBlock('en', enPath8);
transformBlock('fr', frPath8);

fs.writeFileSync('src/context/LanguageContext.tsx', content);

