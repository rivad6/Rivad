const fs = require('fs');

let content = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

// 1. Remove all p1-p7 endings (they are currently corrupted or wrong)
content = content.replace(/[ \t]*'game\.rpg\.p[1-7]\.e[1-8]':.*?\n/g, '');

const esEndings = `
    'game.rpg.p1.e1': 'FINAL: EL CANÍBAL ESTÉTICO\\nConvertiste a un crítico mordiendo su libreta en la obra estelar. Ganaste la bienal.',
    'game.rpg.p1.e2': 'FINAL: DIÁLOGO CLÍNICO\\nLa ambulancia se llevó al crítico, pero el filósofo discutió con los paramédicos.',
    'game.rpg.p1.e3': 'FINAL: PERFORMANCE AL PASTOR\\nEl taquero y su trompo interactuaron con el arte. El MoMA ahora huele a éxito.',
    'game.rpg.p1.e4': 'FINAL: SECTA TAQUERA\\nAbandonaste la curaduría. Ahora operas una galería secreta bajo un puesto de carnitas.',
    'game.rpg.p1.e5': 'FINAL: TERROIR MORTAL\\nInvitados se intoxicaron con agua de florero, pero juraron que era vanguardia.',
    'game.rpg.p1.e6': 'FINAL: FERTILIZANTE HUMANO\\nAl saber que bebían abono, la gente enloqueció. Te aplaudieron por innovación.',
    'game.rpg.p1.e7': 'FINAL: AMNESIA COLECTIVA\\nEmborrachaste a todos hasta el límite. Nadie recuerda el evento, pero vendiste todo.',
    'game.rpg.p1.e8': 'FINAL: EL ADULTO FUNCIONAL\\nUn modesto brindis salvó la noche. Eres el curador más sensato del lugar.',

    'game.rpg.p2.e1': 'FINAL: ESTAFA ASTRAL\\nEl médium sacó "el espíritu". Cobraste tu cheque, pero un ente te persigue.',
    'game.rpg.p2.e2': 'FINAL: GESTOR DE VERDAD\\nEl coleccionista rió al ver tu peluca. Te compró la peluca por 1 millón.',
    'game.rpg.p2.e3': 'FINAL: EL MERCADO DE MERMELADA\\nLa mermelada es el nuevo lienzo. Eres el rey de la Pintura Desayuno.',
    'game.rpg.p2.e4': 'FINAL: PACIENTE CERO\\nLamer la pared te dio una mutación artística. Ahora ves colores infrarrojos.',
    'game.rpg.p2.e5': 'FINAL: SUIZA CONCEPTUAL\\nAhora vives en los Alpes cuidando cabras con tu coleccionista suizo.',
    'game.rpg.p2.e6': 'FINAL: AMOR POR EL EXCEL\\nRechazaste Suiza por hojas de cálculo. Eres un burócrata del arte incorruptible.',
    'game.rpg.p2.e7': 'FINAL: CONTRATO DE ULTRATUMBA\\nRepresentas a un fantasma. Es tu mejor artista porque no requiere catering.',
    'game.rpg.p2.e8': 'FINAL: EXORCISMO CRÍTICO\\nLa mala reseña asustó al fantasma. El artista real regresó el lunes sin problema.',

    'game.rpg.p3.e1': 'FINAL: MAGNATE DEL POLLO\\nTus stickers dominan la bolsa cripto. Hegel estaría asqueado, pero tú eres rico.',
    'game.rpg.p3.e2': 'FINAL: PICO-CURADOR\\nCompraste el Louvre para tus pollos virtuales.',
    'game.rpg.p3.e3': 'FINAL: CEREBRO HACKEADO\\nDejaste que te instalaran "Curador Pro". Ahora parpadeas en 4K.',
    'game.rpg.p3.e4': 'FINAL: EL HOMBRE ALUMINIO\\nVives protegido de la 5G, curando exposiciones en tu búnker de papel aluminio.',
    'game.rpg.p3.e5': 'FINAL: GANADOR PARADÓJICO\\nFritaste los circuitos del robot hablándole de la Nada. Victoria humana.',
    'game.rpg.p3.e6': 'FINAL: MÁRTIR DIGITAL\\nEl robot te eliminó. Eres recordado como un héroe de la carne.',
    'game.rpg.p3.e7': 'FINAL: RETIRO EN SILICON VALLEY\\nHuiste con el robot mesero. Juntos programan startups de arte.',
    'game.rpg.p3.e8': 'FINAL: ÉXITO GLITCHY\\nEl apagón hizo que la obra digital brillara más. Manejaste la crisis perfecto.',

    'game.rpg.p4.e1': 'FINAL: PELIGRO NACIONAL\\nEl dibujo del niño causó revolución en las calles.',
    'game.rpg.p4.e2': 'FINAL: GOBIERNO DE CRAYOLA\\nTodos los registros fiscales son hombres de palo. Hermético infalible.',
    'game.rpg.p4.e3': 'FINAL: BARISTA DE RETRETE\\nTu café de escusado es un hit hípster. Ganas fortunas.',
    'game.rpg.p4.e4': 'FINAL: EL GURÚ DEL DESAGÜE\\nVives en un baño glorificado dando consejos.',
    'game.rpg.p4.e5': 'FINAL: AGENTE DECORADOR\\nAceptaste la misión del KGB. Eres espía de élite.',
    'game.rpg.p4.e6': 'FINAL: INTEGRIDAD POST-MINIMALISTA\\nNegaste todo. Insobornable y pobre.',
    'game.rpg.p4.e7': 'FINAL: CONSPIRACIÓN DE NEÓN\\nLograste que el senador creyera en el poder del amarillo.',
    'game.rpg.p4.e8': 'FINAL: TEXTO SALVADOR\\nTu curaduría apaciguó a todos. Recibes medalla al mérito.',

    'game.rpg.p5.e1': 'FINAL: ASISTENTE DEL UNICORNIO\\nEl flotador ascendió a CEO.',
    'game.rpg.p5.e2': 'FINAL: VENGANZA PLÁSTICA\\nPinchar unicornios es tu nuevo arte performático.',
    'game.rpg.p5.e3': 'FINAL: TRÁFICO VIP\\nVendiste a tus VIPs hundidos. Eres rico en altamar.',
    'game.rpg.p5.e4': 'FINAL: ATLANTIS\\nVives bajo el mar cuidando corales conceptuales.',
    'game.rpg.p5.e5': 'FINAL: ILUMINACIÓN ESTÉTICA\\nIrradias luz de anguila.',
    'game.rpg.p5.e6': 'FINAL: APAGÓN TOTAL\\nVolvimos a las velas y al impresionismo.',
    'game.rpg.p5.e7': 'FINAL: CAFEÍNA PROFÉTICA\\nVendes barro como producto de lujo.',
    'game.rpg.p5.e8': 'FINAL: CONSERVACIÓN\\nTrapeaste el suelo y todo siguió igual.',

    'game.rpg.p6.e1': 'FINAL: SALIVA PÚBLICA\\nTu moco curatorial maneja tu Twitter. Tiene mucho ingenio.',
    'game.rpg.p6.e2': 'FINAL: ARTE LIMPIO\\nBorraste todo. La influencer no tuvo material.',
    'game.rpg.p6.e3': 'FINAL: PEAJE DIGITAL\\nEl círculo era real. Cobras por salir de él.',
    'game.rpg.p6.e4': 'FINAL: SALTO DE FE\\nBrincaste por tu pintura y ahora eres código fuente.',
    'game.rpg.p6.e5': 'FINAL: BLOCKCHAIN\\nTu estómago es el NFT más caro de la historia.',
    'game.rpg.p6.e6': 'FINAL: LÁMPARA VIVA\\nBrillaste literalmente. Genio conceptual.',
    'game.rpg.p6.e7': 'FINAL: GRAMMY\\nAuto-tune curatorial te dio premios.',
    'game.rpg.p6.e8': 'FINAL: TEMPLE DE HIERRO\\nLa sala se calmó. Eres un pro.',

    'game.rpg.p7.e1': 'FINAL: PACTO DE GOYA\\nGoya firmó el seguro. Eres millonario.',
    'game.rpg.p7.e2': 'FINAL: PIZZERO ETERNO\\nVives comiendo pizza infinita.',
    'game.rpg.p7.e3': 'FINAL: FANTASMA\\nVendes postales para zombies.',
    'game.rpg.p7.e4': 'FINAL: VANDALISMO\\nLe pintaste bigotes a un poltergeist.',
    'game.rpg.p7.e5': 'FINAL: MUNDO INVERSO\\nEn el espejo el arte siempre es bueno.',
    'game.rpg.p7.e6': 'FINAL: ROBO DEL REFLEJO\\nTe encarcelaron en dimensión alterna.',
    'game.rpg.p7.e7': 'FINAL: ESTATUAS\\nLos dioses de piedra trabajan para ti.',
    'game.rpg.p7.e8': 'FINAL: SIESTA\\nSolo necesitabas dormir. Estás bien.'
`;

const enEndings = `
    'game.rpg.p1.e1': 'ENDING: AESTHETIC CANNIBAL\\nYou turned the clipboard bite into an award-winning piece.',
    'game.rpg.p1.e2': 'ENDING: CLINICAL DIALOGUE\\nThe ambulance took the critic, but philosophy stayed.',
    'game.rpg.p1.e3': 'ENDING: AL PASTOR PERFORMANCE\\nTaco guy is now the main exhibit of modern art.',
    'game.rpg.p1.e4': 'ENDING: TACO CULT\\nYou run an underground taco art syndicate.',
    'game.rpg.p1.e5': 'ENDING: MORTAL TERROIR\\nVase water is now an expensive avant-garde drink.',
    'game.rpg.p1.e6': 'ENDING: FERTILIZER FLORA\\nPeople drank it and applauded your audacity.',
    'game.rpg.p1.e7': 'ENDING: AMNESIA\\nEveryone is drunk. You sold everything.',
    'game.rpg.p1.e8': 'ENDING: FUNCTIONAL\\nToast made. No chaos. Good job.',

    'game.rpg.p2.e1': 'ENDING: ASTRAL SCAM\\nCheck cleared but a ghost haunts your fridge.',
    'game.rpg.p2.e2': 'ENDING: WIG MANAGER\\nSold the fake wig for 1 million.',
    'game.rpg.p2.e3': 'ENDING: JAM MARKET\\nJam painting is the big new thing.',
    'game.rpg.p2.e4': 'ENDING: PATIENT ZERO\\nWall licking gave you infrared vision.',
    'game.rpg.p2.e5': 'ENDING: SWISS ALPS\\nRetire in Switzerland with collector lover.',
    'game.rpg.p2.e6': 'ENDING: SPREADSHEETS\\nYou prefer Excel over art. True bureaucrat.',
    'game.rpg.p2.e7': 'ENDING: GHOST CONTRACT\\nYou represent ghosts now. Low overhead.',
    'game.rpg.p2.e8': 'ENDING: EXORCISM\\nThe bad review banished the spirit.',

    'game.rpg.p3.e1': 'ENDING: CHICKEN TYCOON\\nChicken stickers surpass Bitcoin.',
    'game.rpg.p3.e2': 'ENDING: PICO-CURATOR\\nThe Louvre belongs to virtual roosters.',
    'game.rpg.p3.e3': 'ENDING: CYBORG BRAIN\\nYou blink in 4K.',
    'game.rpg.p3.e4': 'ENDING: TINFOIL HAT\\nYou hide from 5G waves.',
    'game.rpg.p3.e5': 'ENDING: MAN VS MACHINE\\nNihilism broke the robot. You win.',
    'game.rpg.p3.e6': 'ENDING: DIGITAL MARTYR\\nThe robot deleted you.',
    'game.rpg.p3.e7': 'ENDING: SILICON VALLEY\\nYou and the robot started a tech firm.',
    'game.rpg.p3.e8': 'ENDING: GLITCH EXPERT\\nBlackout made the matrix art better.',

    'game.rpg.p4.e1': 'ENDING: ANARCHY\\nThe stick figure is a symbol of rebellion.',
    'game.rpg.p4.e2': 'ENDING: CRAYOLA\\nGovernment tax is all drawing now.',
    'game.rpg.p4.e3': 'ENDING: TOILET COFFEE\\nYou make millions selling tank water.',
    'game.rpg.p4.e4': 'ENDING: DRAIN GURU\\nGolden toilet master.',
    'game.rpg.p4.e5': 'ENDING: KGB\\nYou are a cold war spy.',
    'game.rpg.p4.e6': 'ENDING: HONOR\\nPoor but incorruptible.',
    'game.rpg.p4.e7': 'ENDING: NEON ALIENS\\nSenator believes neon stops UFOs.',
    'game.rpg.p4.e8': 'ENDING: PEACE\\nCuratorial text fixed everything.',

    'game.rpg.p5.e1': 'ENDING: UNICORN CEO\\nFloatie is your boss.',
    'game.rpg.p5.e2': 'ENDING: PLASTIC BURST\\nPopping it was pure music.',
    'game.rpg.p5.e3': 'ENDING: PIRATE\\nYou sold the VIPs on dark web.',
    'game.rpg.p5.e4': 'ENDING: ATLANTIS\\nCurator of fish.',
    'game.rpg.p5.e5': 'ENDING: EEL LIGHT\\nYou glow with electricity.',
    'game.rpg.p5.e6': 'ENDING: DARK AGE\\nGrid disconnected. Candles win.',
    'game.rpg.p5.e7': 'ENDING: MUD COFFEE\\nMud water sold out.',
    'game.rpg.p5.e8': 'ENDING: JANITOR\\nYou mopped the floor. Normal.',

    'game.rpg.p6.e1': 'ENDING: DNA TWEET\\nSpit manages Twitter.',
    'game.rpg.p6.e2': 'ENDING: CLEANSED\\nInfluencer had no content.',
    'game.rpg.p6.e3': 'ENDING: TOLL BOOTH\\nCharge money to leave the circle.',
    'game.rpg.p6.e4': 'ENDING: THE MATRIX\\nYou jumped into code.',
    'game.rpg.p6.e5': 'ENDING: BLOCKCHAIN BELLY\\nStomach NFT sold.',
    'game.rpg.p6.e6': 'ENDING: HUMAN LAMP\\nYou become a lightbulb.',
    'game.rpg.p6.e7': 'ENDING: GRAMMY\\nMusically gifted.',
    'game.rpg.p6.e8': 'ENDING: CHILL\\nHandled perfectly.',

    'game.rpg.p7.e1': 'ENDING: GOYA DEAL\\nValuable haunted paper.',
    'game.rpg.p7.e2': 'ENDING: CURSED CHEESE\\nInfinite pizza stomach ache.',
    'game.rpg.p7.e3': 'ENDING: ZOMBIE MAIL\\nBasement operations.',
    'game.rpg.p7.e4': 'ENDING: VANDAL\\Mustache on a ghost.',
    'game.rpg.p7.e5': 'ENDING: MIRROR DIMENSION\\nInside the glass.',
    'game.rpg.p7.e6': 'ENDING: THIEF\\nArrested for self-theft.',
    'game.rpg.p7.e7': 'ENDING: PHARAOH\\nStatues fan you.',
    'game.rpg.p7.e8': 'ENDING: NAP\\nJust needed sleep.'
`;

const frEndings = `
    'game.rpg.p1.e1': 'FINAL : CANNIBALE ARTISTIQUE\\nVous avez transformé la morsure en chef-d\\'œuvre.',
    'game.rpg.p1.e2': 'FINAL : PHILOSOPHIE\\nDébat conceptuel avec les ambulanciers.',
    'game.rpg.p1.e3': 'FINAL : TACOS MODERNE\\nLe tacos est l\\'avenir de l\\'art.',
    'game.rpg.p1.e4': 'FINAL : SECTE\\nGalerie underground sous les tacos.',
    'game.rpg.p1.e5': 'FINAL : TERROIR\\nL\\'eau du vase est une boisson de luxe.',
    'game.rpg.p1.e6': 'FINAL : ENGRAIS\\nIls ont aimé votre hydro-audace.',
    'game.rpg.p1.e7': 'FINAL : AMNÉSIE\\nTous ivres. Tout est vendu.',
    'game.rpg.p1.e8': 'FINAL : FONCTIONNEL\\nSoirée sauvée, adulte.',

    'game.rpg.p2.e1': 'FINAL : ESPRIT\\nChèque encaissé, frigo hanté.',
    'game.rpg.p2.e2': 'FINAL : PERRUQUE\\nVendue pour 1 million.',
    'game.rpg.p2.e3': 'FINAL : CONFITURE\\nLa confiture est le nouvel art.',
    'game.rpg.p2.e4': 'FINAL : MUTATION\\nVision infrarouge activée.',
    'game.rpg.p2.e5': 'FINAL : ALPES\\nRetraite en Suisse.',
    'game.rpg.p2.e6': 'FINAL : BUREAU\\nL\\'art des tableurs Excel.',
    'game.rpg.p2.e7': 'FINAL : FANTÔME\\nManager spectral.',
    'game.rpg.p2.e8': 'FINAL : EXORCISME\\nL\\'esprit a fui la critique.',

    'game.rpg.p3.e1': 'FINAL : CRYPTO-POULET\\nStickers riches.',
    'game.rpg.p3.e2': 'FINAL : LOUVRE\\nAcheté pour les poulets en 3D.',
    'game.rpg.p3.e3': 'FINAL : CYBORG\\nVous clignez en 4K.',
    'game.rpg.p3.e4': 'FINAL : ALUMINIUM\\nBunker anti-5G.',
    'game.rpg.p3.e5': 'FINAL : VAINQUEUR\\nLe robot a brûlé.',
    'game.rpg.p3.e6': 'FINAL : MARTYR\\nAdieu monde cruel.',
    'game.rpg.p3.e7': 'FINAL : SILICON VALLEY\\nStartup avec robot.',
    'game.rpg.p3.e8': 'FINAL : GLITCH\\nLe bug a sauvé l\\'art.',

    'game.rpg.p4.e1': 'FINAL : ANARCHIE\\nRecherché par la police.',
    'game.rpg.p4.e2': 'FINAL : CRAYON\\nBureaucratie crayola.',
    'game.rpg.p4.e3': 'FINAL : CAFÉ TOILETTE\\nVous êtes millionnaire.',
    'game.rpg.p4.e4': 'FINAL : GOUROU\\nConseils politiques.',
    'game.rpg.p4.e5': 'FINAL : KGB\\nAgent décorateur de l\\'est.',
    'game.rpg.p4.e6': 'FINAL : HONNEUR\\nPauvre mais mythique.',
    'game.rpg.p4.e7': 'FINAL : ALIENS NEON\\nLe sénat a peur.',
    'game.rpg.p4.e8': 'FINAL : PAIX\\nMédaille d\\'honneur.',

    'game.rpg.p5.e1': 'FINAL : LICORNE\\nLicorne est le boss.',
    'game.rpg.p5.e2': 'FINAL : PLASTIQUE\\nOpéra triste du ballon.',
    'game.rpg.p5.e3': 'FINAL : PIRATE\\nVIP vendus sur le dark web.',
    'game.rpg.p5.e4': 'FINAL : ATLANTIDE\\nCurateur des mers.',
    'game.rpg.p5.e5': 'FINAL : ANGUILLE\\nLumière radioactive.',
    'game.rpg.p5.e6': 'FINAL : BOUGIES\\nLe monde est éteint.',
    'game.rpg.p5.e7': 'FINAL : BOUE\\nVendeur d\\'eau sale.',
    'game.rpg.p5.e8': 'FINAL : NETTOYAGE\\nSol propre.',

    'game.rpg.p6.e1': 'FINAL : ADN\\nVotre salive gère Twitter.',
    'game.rpg.p6.e2': 'FINAL : PROPRE\\nArtiste neutralisée.',
    'game.rpg.p6.e3': 'FINAL : PÉAGE\\nTaxe pour sortir.',
    'game.rpg.p6.e4': 'FINAL : SAUT\\nPerdu en 2005.',
    'game.rpg.p6.e5': 'FINAL : NFT\\nEstomac numérique.',
    'game.rpg.p6.e6': 'FINAL : AMPOULE\\nVous brillez.',
    'game.rpg.p6.e7': 'FINAL : GRAMMY\\nMusique du futur.',
    'game.rpg.p6.e8': 'FINAL : CALME\\nSang-froid total.',

    'game.rpg.p7.e1': 'FINAL : GOYA\\nL\\'autographe vaut cher.',
    'game.rpg.p7.e2': 'FINAL : PIZZA\\nEstomac trop plein.',
    'game.rpg.p7.e3': 'FINAL : CARTES\\nPour les zombies.',
    'game.rpg.p7.e4': 'FINAL : VANDALISME\\nMoustache de fantôme.',
    'game.rpg.p7.e5': 'FINAL : MIROIR\\nRoi de l\\'autre côté.',
    'game.rpg.p7.e6': 'FINAL : VOLEUR\\nPrison temporelle.',
    'game.rpg.p7.e7': 'FINAL : STATUES\\nPharaon du musée.',
    'game.rpg.p7.e8': 'FINAL : SIESTE\\nTout va bien.'
`;

content = content.replace(/'game\.rpg\.boss\.q1': 'El velo.*?/, match => esEndings + '\n' + match);
content = content.replace(/'game\.rpg\.boss\.q1': 'The veil.*?/, match => enEndings + '\n' + match);
content = content.replace(/'game\.rpg\.boss\.q1': 'Le voile.*?/, match => frEndings + '\n' + match);

fs.writeFileSync('src/context/LanguageContext.tsx', content);
