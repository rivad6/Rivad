const fs = require('fs');
let content = fs.readFileSync('src/context/LanguageContext.tsx', 'utf8');

const transformBlock = (lang, replacements) => {
    for (let key in replacements) {
        const regex = new RegExp(`'${key}':\\s*[\`'"].*?[\`'"](,|\\b)`, 'gs');
        if (content.match(regex)) {
             content = content.replace(regex, (match, suffix) => `'${key}': \`${replacements[key]}\`${suffix}`);
        }
    }
}

const esEndings = {
'game.rpg.p1.e1': `FINAL: EL CANÍBAL ESTÉTICO\\nConvertiste a un crítico mordiendo su libreta en la obra estelar. Ganaste la bienal por "Arte Ingestivo".`,
'game.rpg.p1.e2': `FINAL: DIÁLOGO CLÍNICO\\nLa ambulancia se llevó al crítico, pero el filósofo discutió con los paramédicos sobre el "ser".`,
'game.rpg.p1.e3': `FINAL: PERFORMANCE AL PASTOR\\nEl taquero y su trompo interactuaron con el arte. El MoMA ahora huele a suadero y éxito.`,
'game.rpg.p1.e4': `FINAL: SECTA TAQUERA\\nAbandonaste la curaduría. Ahora operas una galería secreta bajo un puesto de carnitas.`,
'game.rpg.p1.e5': `FINAL: TERROIR MORTAL\\nTres invitados se intoxicaron con agua de florero, pero juraron que era la experiencia más avant-garde.`,
'game.rpg.p1.e6': `FINAL: FERTILIZANTE HUMANO\\nAl saber que bebían abono, la gente enloqueció. Te aplaudieron por "retar a las industrias hídricas".`,
'game.rpg.p1.e7': `FINAL: AMNESIA COLECTIVA\\nEmborrachaste a todos hasta el límite. Nadie recuerda el evento, pero vendiste todo.`,
'game.rpg.p1.e8': `FINAL: EL ADULTO FUNCIONAL\\nUn modesto brindis salvó la noche. No hubo muertes, no hubo caos. Eres el curador más sensato.`,

'game.rpg.p2.e1': `FINAL: ESTAFA ASTRAL\\nEl médium sacó "el espíritu". Cobraste tu cheque, pero ahora un ente tira tus libros por la noche.`,
'game.rpg.p2.e2': `FINAL: GESTOR DE VERDAD\\nEl coleccionista suizo rió al ver tu peluca barata. Te compró la peluca por 1 millón.`,
'game.rpg.p2.e3': `FINAL: EL MERCADO DE MERMELADA\\nLa mermelada es el nuevo lienzo. Eres el rey de la "Pintura Desayuno".`,
'game.rpg.p2.e4': `FINAL: PACIENTE CERO\\nLamer la pared te dio una mutación artística. Ahora ves colores infrarrojos.`,
'game.rpg.p2.e5': `FINAL: SUIZA CONCEPTUAL\\nAhora vives en los Alpes cuidando cabras y obras maestras con tu amante coleccionista.`,
'game.rpg.p2.e6': `FINAL: AMOR POR EL EXCEL\\nRechazaste a Suiza por las hojas de cálculo. Eres un burócrata del arte, aburrido pero incorruptible.`,
'game.rpg.p2.e7': `FINAL: CONTRATO DE ULTRATUMBA\\nRepresentas a un fantasma. Es tu mejor artista porque no requiere catering.`,
'game.rpg.p2.e8': `FINAL: EXORCISMO CRÍTICO\\nLa mala reseña asustó al fantasma. El artista real regresó a tiempo y el evento fluyó sin bajas.`,

'game.rpg.p3.e1': `FINAL: MAGNATE DEL POLLO\\nTus stickers dominan la bolsa de valores cripto. Hegel estaría asqueado, pero tú eres asquerosamente rico.`,
'game.rpg.p3.e2': `FINAL: PICO-CURADOR\\nCompraste el Louvre para tus pollos virtuales. La Mona Lisa ahora usa sombrero aviar.`,
'game.rpg.p3.e3': `FINAL: CEREBRO HACKEADO\\nDejaste que te instalaran "Curador Pro". Ahora parpadeas en resoluciones 4K y escupes teorías de arte.`,
'game.rpg.p3.e4': `FINAL: EL HOMBRE ALUMINIO\\nVives protegido de las ondas electromagnéticas, curando exposiciones en tu búnker antitético.`,
'game.rpg.p3.e5': `FINAL: GANADOR PARADÓJICO\\nFritaste los circuitos del robot mesero hablándole de la Nada. Eres el campeón de la guerra hombre-máquina.`,
'game.rpg.p3.e6': `FINAL: MÁRTIR DIGITAL\\nEl robot te eliminó. Eres recordado como el primer curador sacrificado en el altar del silicio.`,
'game.rpg.p3.e7': `FINAL: RETIRO EN SILICON VALLEY\\nHuiste con el robot mesero. Juntos programan startups de arte que no sirven para nada.`,
'game.rpg.p3.e8': `FINAL: ÉXITO GLITCHY\\nEl apagón hizo que la obra digital brillara más. Manejaste la crisis de TI como un maestro.`,

'game.rpg.p4.e1': `FINAL: PELIGRO NACIONAL\\nEl dibujo del niño causó revolución en las calles. Eres el anarquista del arte más buscado.`,
'game.rpg.p4.e2': `FINAL: GOBIERNO DE CRAYOLA\\nTodos los registros fiscales son ahora hombres de palo y soles sonrientes. Hermético infalible.`,
'game.rpg.p4.e3': `FINAL: BARISTA DE RETRETE\\nTu café hecho en el tanque del escusado es un hit hípster. Ganas fortunas.`,
'game.rpg.p4.e4': `FINAL: EL GURÚ DEL DESAGÜE\\nTerminaste viviendo en un baño glorificado dando consejos políticos de a diez pesos.`,
'game.rpg.p4.e5': `FINAL: AGENTE DECORADOR\\nAceptaste la misión del KGB. Evalúas la subversión de los jarrones en Europa del Este.`,
'game.rpg.p4.e6': `FINAL: INTEGRIDAD POST-MINIMALISTA\\nNegaste todo. Te volviste insobornable y extremadamente pobre. Eres un mito ético.`,
'game.rpg.p4.e7': `FINAL: CONSPIRACIÓN DE NEÓN\\nLograste que el senador creyera que el amarillo flúor nos protege de alienígenas. Éxito absurdo.`,
'game.rpg.p4.e8': `FINAL: TEXTO SALVADOR\\nTu curaduría diplomática apaciguó a los medios. Tu evento cerró con una elegante medalla al mérito.`,

'game.rpg.p5.e1': `FINAL: ASISTENTE DEL UNICORNIO\\nEl flotador de unicornio ascendió a CEO de la galería. La vida no tiene sentido.`,
'game.rpg.p5.e2': `FINAL: VENGANZA CONTRA EL PLÁSTICO\\nPinchaste al unicornio, y su aire desinflado sonó como una ópera triste. Arte puro.`,
'game.rpg.p5.e3': `FINAL: TRÁFICO DE SIRENAS SECAS\\nVendiste a tus VIPs al mercado negro. Te persigue la Interpol, pero coleccionas Monet reales.`,
'game.rpg.p5.e4': `FINAL: CURADOR DE ATLANTIS\\nSaltaste a la red del helicóptero. Ahora vives bajo el mar cuidando corales conceptuales.`,
'game.rpg.p5.e5': `FINAL: ILUMINACIÓN ESTÉTICA\\nIrradias tanta bioluminiscencia de anguila que eres la estrella de la gala.`,
'game.rpg.p5.e6': `FINAL: EL APAGÓN IMPRESIONISTA\\nCortocircuitaste la ciudad. Ahora todos andan con velas. Has devuelto la humanidad a la época oscura.`,
'game.rpg.p5.e7': `FINAL: CAFEÍNA PROFÉTICA\\nTe forraste vendiendo "agua mística". El barro en los zapatos es tu nueva marca.`,
'game.rpg.p5.e8': `FINAL: PROTOCOLO DE CONSERVACIÓN\\nSeñalizaste los charcos. Limpiaste el piso. Aburridamente seguro, mantuviste el status quo del arte.`,

'game.rpg.p6.e1': `FINAL: COMMUNITY MANAGER DE SALIVA\\nTu moco curatorial maneja tu Twitter. Tiene muchísimo más ingenio que tú.`,
'game.rpg.p6.e2': `FINAL: ARTE EFÍMERO Y LIMPIO\\nBorraste todo. La influencer no tuvo material, y tú quedaste en paz.`,
'game.rpg.p6.e3': `FINAL: CABINA DE PEAJE DIGITAL\\nEl círculo era real. Cobras cripto a quienes quieren huir a otra red social más decente.`,
'game.rpg.p6.e4': `FINAL: SALTO DE FE DIGITAL\\nBrincaste por tu pintura. Eres un código perdido en un foro oscuro del 2005.`,
'game.rpg.p6.e5': `FINAL: ESTÓMAGO DE BLOCKCHAIN\\nTu radiografía gástrica NFT vale millones. Ahora procesas billetes en vez de comida.`,
'game.rpg.p6.e6': `FINAL: LÁMPARA DE VANGUARDIA\\nTe pusiste en el centro de la sala y brillaste. La crítica te llamó "el Edison del arte relacional".`,
'game.rpg.p6.e7': `FINAL: GRAMMY INESPERADO\\nCombinar peluca y seguridad te dio un premio musical. Eres polifacético.`,
'game.rpg.p6.e8': `FINAL: TEMPLE DE HIERRO\\nLa influencer fue olvidada, tu exposición aclamada. Mostraste decencia ante el circo mediático.`,

'game.rpg.p7.e1': `FINAL: EL CANTO BIZARRO DE GOYA\\nLograste que el pintor maldito firmara. Tu ticket vale más que tu casa.`,
'game.rpg.p7.e2': `FINAL: EL GRAN PIZZERO\\nNo pediste arte, pediste pizza eterna. Tienes el estómago lleno de queso maldito.`,
'game.rpg.p7.e3': `FINAL: TARJETERÍA FANTASMA\\nVendes postales de cumpleaños para zombies en la cripta del museo.`,
'game.rpg.p7.e4': `FINAL: VANDALISMO CLÁSICO\\nLe pintaste bigotes al fantasma de Goya. La historia del arte tiene el mejor easter egg.`,
'game.rpg.p7.e5': `FINAL: REY DEL MUNDO INVERSO\\nCruzaste el espejo. Allá eres genio, y el vino nunca causa resaca. Ganaste.`,
'game.rpg.p7.e6': `FINAL: EL CRIMEN DEL REFLEJO\\nRobaste tu propia cartera mágica en el espejo. Te autosometiste a prisión domiciliaria.`,
'game.rpg.p7.e7': `FINAL: ESTATUAS SERVILES\\nLas deidades de mármol ahora te abanican. Eres el faraón de tu propia inauguración.`,
'game.rpg.p7.e8': `FINAL: SIESTA RESTAURADORA\\nYap, solo estabas estresado. Dos tés de manzanilla después, eres una persona completamente normal.`
};

const enEndings = {
'game.rpg.p1.e1': `ENDING: THE AESTHETIC CANNIBAL\\nYou turned a critic biting his notebook into the star piece. You won an award for Ingestive Art.`,
'game.rpg.p1.e2': `ENDING: CLINICAL DIALOGUE\\nThe ambulance took the critic, but the philosopher argued with paramedics about the "Being".`,
'game.rpg.p1.e3': `ENDING: AL PASTOR PERFORMANCE\\nThe taco guy became part of the art. The MoMA now smells like cilantro and success.`,
'game.rpg.p1.e4': `ENDING: TACO SECT\\nYou quit curating. You now run an underground gallery beneath a taco stand.`,
'game.rpg.p1.e5': `ENDING: MORTAL TERROIR\\nThree guests got poisoned by vase water, swearing it was the most avant-garde experience.`,
'game.rpg.p1.e6': `ENDING: HUMAN FERTILIZER\\nDiscovering they drank fertilizer, people applauded you for "challenging the water industry".`,
'game.rpg.p1.e7': `ENDING: COLLECTIVE AMNESIA\\nYou got everyone completely wasted. No one remembers the event, but everything sold out.`,
'game.rpg.p1.e8': `ENDING: FUNCTIONAL ADULT\\nA modest toast saved the night. No deaths, no chaos. You are the most sensible curator.`,

'game.rpg.p2.e1': `ENDING: ASTRAL SCAM\\nThe medium summoned the spirit. You got paid, but a ghost now throws your books off shelves.`,
'game.rpg.p2.e2': `ENDING: TRUE MANAGER\\nThe Swiss collector laughed at your cheap wig. He bought the wig for 1 million.`,
'game.rpg.p2.e3': `ENDING: THE JAM MARKET\\nJam is the new canvas. You are the king of "Breakfast Painting".`,
'game.rpg.p2.e4': `ENDING: PATIENT ZERO\\nLicking the wall gave you an artistic mutation. You can now see infrared colors.`,
'game.rpg.p2.e5': `ENDING: CONCEPTUAL SWITZERLAND\\nYou live in the Alps tending goats and masterpieces with your collector lover.`,
'game.rpg.p2.e6': `ENDING: SPREADSHEET LOVE\\nYou rejected Switzerland for Excel docs. An art bureaucrat, boring but incorruptible.`,
'game.rpg.p2.e7': `ENDING: AFTERLIFE CONTRACT\\nYou represent a ghost. It's your best artist because they don't require catering.`,
'game.rpg.p2.e8': `ENDING: CRITICAL EXORCISM\\nThe bad review scared the ghost away. The real artist returned and the event flowed.`,

'game.rpg.p3.e1': `ENDING: CHICKEN TYCOON\\nYour stickers dominate crypto. Hegel would be disgusted, but you are filthy rich.`,
'game.rpg.p3.e2': `ENDING: PICO-CURATOR\\nYou bought the Louvre for your virtual chickens. The Mona Lisa wears an avian hat now.`,
'game.rpg.p3.e3': `ENDING: BRAIN HACKED\\nYou let them install "Curator Pro". Now you blink in 4K and spit art theory.`,
'game.rpg.p3.e4': `ENDING: THE ALUMINUM MAN\\nYou live free from 5G, curating shows in your anti-magnetic bunker.`,
'game.rpg.p3.e5': `ENDING: PARADOX WINNER\\nYou fried the robot's circuits with nihilism. You won the man-vs-machine war.`,
'game.rpg.p3.e6': `ENDING: DIGITAL MARTYR\\nThe robot eliminated you. You are remembered as the first sacrifice on the silicon altar.`,
'game.rpg.p3.e7': `ENDING: SILICON ESCAPE\\nYou fled with the robot to Silicon Valley. Together you build useless art startups.`,
'game.rpg.p3.e8': `ENDING: GLITCHY SUCCESS\\nThe system crashed, making the art shine more. You managed IT like a master.`,

'game.rpg.p4.e1': `ENDING: NATIONAL DANGER\\nThe censorship caused riots. You are the most wanted art anarchist.`,
'game.rpg.p4.e2': `ENDING: CRAYOLA GOV\\nAll tax files are now stick figures. Bulletproof bureaucracy.`,
'game.rpg.p4.e3': `ENDING: TOILET BARISTA\\nYour toilet-tank coffee is a hipster hit. You make a fortune.`,
'game.rpg.p4.e4': `ENDING: THE DRAIN GURU\\nYou charge 10 bucks for political advice sitting on a golden toilet.`,
'game.rpg.p4.e5': `ENDING: DECORATOR AGENT\\nYou judge vase subversion in Eastern Europe. A true KGB asset.`,
'game.rpg.p4.e6': `ENDING: POST-MINIMALIST INTEGRITY\\nYou rejected bribes. Extremely poor but an ethical myth.`,
'game.rpg.p4.e7': `ENDING: NEON CONSPIRACY\\nYou convinced the Senate that yellow neon stops aliens. Absurd success.`,
'game.rpg.p4.e8': `ENDING: SAVIOR TEXT\\nYour curatorial piece appeased the media. Elegant medal of honor.`,

'game.rpg.p5.e1': `ENDING: UNICORN ASSISTANT\\nThe pool float was promoted to CEO. Life has no meaning.`,
'game.rpg.p5.e2': `ENDING: ANTI-PLASTIC REVENGE\\nPopping the unicorn sounded like sad opera music. Pure art.`,
'game.rpg.p5.e3': `ENDING: DRY MERMAID TRAFFIC\\nYou sold VIPs to the black market. Interpol hunts you, but you own true Monets.`,
'game.rpg.p5.e4': `ENDING: ATLANTIS CURATOR\\nYou jumped in the net. Now you curate underwater corals.`,
'game.rpg.p5.e5': `ENDING: AESTHETIC ILLUMINATION\\nYou radiate so much eel-light you become the star.`,
'game.rpg.p5.e6': `ENDING: IMPRESSIONIST BLACKOUT\\nYou shut down the grid. Everyone uses candles. The Dark Ages of Art.`,
'game.rpg.p5.e7': `ENDING: PROPHETIC CAFFEINE\\nYou made bank selling mystical water. Mud shoes are your brand.`,
'game.rpg.p5.e8': `ENDING: CONSERVATION PROTOCOL\\nYou cleaned the floor and saved lives. Boring but fully responsible.`,

'game.rpg.p6.e1': `ENDING: SPIT MANAGER\\nYour DNA stain manages your Twitter. Much smarter than you.`,
'game.rpg.p6.e2': `ENDING: CLEAN EPHEMERAL ART\\nYou wiped it off. The influencer had no content. Peace.`,
'game.rpg.p6.e3': `ENDING: DIGITAL TOLLBOOTH\\nThe circle was real. You tax those fleeing to a nicer social network.`,
'game.rpg.p6.e4': `ENDING: DIGITAL LEAP OF FAITH\\nYou jumped in. You are lost code in a 2005 obscure gaming forum.`,
'game.rpg.p6.e5': `ENDING: BLOCKCHAIN STOMACH\\nYour X-ray NFT is worth millions. You process money, not food.`,
'game.rpg.p6.e6': `ENDING: AVANT-GARDE LAMP\\nYou glowed in the center room. The critics hailed you.`,
'game.rpg.p6.e7': `ENDING: UNEXPECTED GRAMMY\\nWig and auto-tune got you a golden gramophone.`,
'game.rpg.p6.e8': `ENDING: IRON TEMPER\\nYou ignored the influencer and rocked the expo. Class act.`,

'game.rpg.p7.e1': `ENDING: BIZARRE GOYA CHANT\\nGoya signed. Your ticket is worth more than the museum.`,
'game.rpg.p7.e2': `ENDING: THE GRAND PIZZA\\nYou asked for infinite pizza. Cursed cheese fills you.`,
'game.rpg.p7.e3': `ENDING: GHOST CARD SHOP\\nYou sell birthday cards to zombies in the basement.`,
'game.rpg.p7.e4': `ENDING: CLASSIC VANDALISM\\nYou drew a mustache on Goya. History's best easter egg.`,
'game.rpg.p7.e5': `ENDING: KING OF THE INVERSE\\nYou stayed in the mirror. Wine never causes hangovers there.`,
'game.rpg.p7.e6': `ENDING: REFLECTION CRIME\\nYou robbed your own wallet in the mirror. House arrest for yourself.`,
'game.rpg.p7.e7': `ENDING: SUBSERVIENT STATUES\\nMarble gods fan you. You are the pharaoh of the exhibit.`,
'game.rpg.p7.e8': `ENDING: RESTORATIVE NAP\\nIt was just stress. Two chamomile teas later, you are normal.`
};

const frEndings = {
'game.rpg.p1.e1': `FINAL : L'ESTHÉTIQUE CANNIBALE\\nVous avez transformé le critique qui mordait son carnet en chef-d'œuvre. Prix gagné.`,
'game.rpg.p1.e2': `FINAL : DIALOGUE CLINIQUE\\nL'ambulance a emporté le critique pendant qu'un philosophe débattait de l'Être.`,
'game.rpg.p1.e3': `FINAL : TACOS EXPÉRIMENTAL\\nLe vendeur de tacos est devenu l'attraction principale du musée.`,
'game.rpg.p1.e4': `FINAL : SECTE DU TACO\\nVous avez tout quitté pour une galerie underground sous un stand de tacos.`,
'game.rpg.p1.e5': `FINAL : TERROIR MORTEL\\nTrois invités intoxiqués par l'eau des vases, jurant que c'était avant-gardiste.`,
'game.rpg.p1.e6': `FINAL : ENGRAIS HUMAIN\\nLes gens ont applaudi votre audace de leur faire boire de l'engrais.`,
'game.rpg.p1.e7': `FINAL : AMNÉSIE COLLECTIVE\\nTout le monde est ivre mort. Personne ne s'en souvient, mais l'expo est sold out.`,
'game.rpg.p1.e8': `FINAL : ADULTE FONCTIONNEL\\nUn toast modeste a sauvé la nuit. Vous êtes le curateur le plus sensé.`,

'game.rpg.p2.e1': `FINAL : ARNAQUE ASTRALE\\nL'esprit a détruit votre bibliothèque, mais vous avez empoché votre chèque.`,
'game.rpg.p2.e2': `FINAL : VRAI GESTIONNAIRE\\nLe collectionneur a adoré votre perruque bon marché et l'a achetée 1 million.`,
'game.rpg.p2.e3': `FINAL : MARCHÉ DE LA CONFITURE\\nLa confiture est la nouvelle toile. Vous êtes le Maître du Petit-Déjeuner.`,
'game.rpg.p2.e4': `FINAL : PATIENT ZÉRO\\nLécher le mur vous a donné des pouvoirs infrarouges de vision chromatique.`,
'game.rpg.p2.e5': `FINAL : CONCEPTUALITÉ SUISSE\\nVous vivez heureux dans les Alpes avec des chefs-d'œuvre et des chèvres.`,
'game.rpg.p2.e6': `FINAL : AMOUR DU TABLEUR\\nVous avez préféré le bureau au glamour suisse. L'art bureaucratique a gagné.`,
'game.rpg.p2.e7': `FINAL : CONTRAT FANTÔME\\nVotre meilleur artiste ne mange rien et ne demande jamais d'acompte.`,
'game.rpg.p2.e8': `FINAL : EXORCISME CRITIQUE\\nLa mauvaise note a banni l'esprit. La soirée s'est terminée dans le calme.`,

'game.rpg.p3.e1': `FINAL : L'EMPIRE DU POULET\\nVos stickers valent des Bitcoins. Hegel pleure de détresse.`,
'game.rpg.p3.e2': `FINAL : PICO-CURATEUR\\nVous avez acheté le Louvre. La Joconde observe désormais un coq en 3D.`,
'game.rpg.p3.e3': `FINAL : CERVEAU PIRATÉ\\nVotre firmware vous permet de parler en 4K. Vous êtes une machine curante.`,
'game.rpg.p3.e4': `FINAL : L'HOMME D'ALUMINIUM\\nProtégé de la 5G, vous vivez caché loin du WiFi et de la critique.`,
'game.rpg.p3.e5': `FINAL : VAINQUEUR DU PARADOXE\\nVous avez détruit les circuits du droïde avec du nihilisme.`,
'game.rpg.p3.e6': `FINAL : MARTYR NUMÉRIQUE\\nLe robot vous a supprimé. Votre sacrifice lance l'ère Post-Humaine de l'art.`,
'game.rpg.p3.e7': `FINAL : FUITE EN CALIFORNIE\\nVous programmez des startups artistiques inutiles avec votre droïde ami.`,
'game.rpg.p3.e8': `FINAL : SUCCÈS GLITCHY\\nLe bug a sublimé l'œuvre. Tout le monde a loué votre génie technique.`,

'game.rpg.p4.e1': `FINAL : LE DANGER NATIONAL\\nLe dessin censuré est le pochoir de la révolution. Vous êtes recherché.`,
'game.rpg.p4.e2': `FINAL : GOUVERNEMENT CRAYOLA\\nLa bureaucratie remplacée par des soleils souriants en craie. Imparable.`,
'game.rpg.p4.e3': `FINAL : LE CAFÉ WC\\nVotre expresso tiré de la cuve des toilettes vaut de l'or chez les hipsters.`,
'game.rpg.p4.e4': `FINAL : LE GOUROU DES TUYAUX\\nInstallé sur vos WC en or, vous facturez vos conseils politiques.`,
'game.rpg.p4.e5': `FINAL : AGENT DÉCORATEUR\\nVous jugez de la subversion des vases en Europe de l'Est pour le KGB.`,
'game.rpg.p4.e6': `FINAL : INTÉGRITÉ MYTHIQUE\\nVous êtes extrêmement pauvre, mais votre éthique post-minimaliste est légendaire.`,
'game.rpg.p4.e7': `FINAL : CONSPIRATION FLUORESCENTE\\nLe Sénat croit que le jaune néon chasse les aliens. Succès massif pour rien.`,
'game.rpg.p4.e8': `FINAL : TEXTE SAUVEUR\\nUn texte curatorial brillant a calmé les médias et sauvé votre pension.`,

'game.rpg.p5.e1': `FINAL : L'ASSISTANT LICORNE\\nLa bouée licorne vient d'être promue PDG. Plus rien n'a de sens.`,
'game.rpg.p5.e2': `FINAL : ANTI-PLASTIQUE\\nL'éclatement du poney fut sublime. L'opéra triste du plastique perforé.`,
'game.rpg.p5.e3': `FINAL : TRAFIC SOUS-MARIN\\nVous avez revendu les VIP ligotés. Interpol vous cherche en vain.`,
'game.rpg.p5.e4': `FINAL : CURATEUR D'ATLANTIDE\\nVous soignez les coraux au fond de l'océan. Adieu monde mortel.`,
'game.rpg.p5.e5': `FINAL : LUMIÈRE ESTHÉTIQUE\\nVous irradiez l'énergie pure de l'anguille sur les murs.`,
'game.rpg.p5.e6': `FINAL : ÂGE SOMBRE\\nLa ville est plongée dans le noir. L'impressionnisme est revenu.`,
'game.rpg.p5.e7': `FINAL : PROPHÉTIE CAFÉINÉE\\nL'eau boueuse est la nouvelle tendance. Vous vendez "l'Aura Humide".`,
'game.rpg.p5.e8': `FINAL : PROTOCOLO SÉCURISÉ\\nTout est propre. Prévisible, ennuyeux, mais juridiquement inattaquable.`,

'game.rpg.p6.e1': `FINAL : SALIVE TWEETANTE\\nVotre ADN craché tweete mieux que l'artiste lui-même.`,
'game.rpg.p6.e2': `FINAL : ART NET ET PROPRE\\nLe nettoyage a frustré la star d'internet. L'art triomphe sur les likes.`,
'game.rpg.p6.e3': `FINAL : PÉAGE DIGITAL\\nLe cercle aspirait vraiment les gens. Vous facturez le passage.`,
'game.rpg.p6.e4': `FINAL : SAUT DE LA FOI\\nVous avez plongé dans votre peinture. Vous hantez maintenant un vieux forum de 2005.`,
'game.rpg.p6.e5': `FINAL : ESTOMAC SUR BLOCKCHAIN\\nL'IRM de votre ventre peindu vaut des millions en cryptomonnaie.`,
'game.rpg.p6.e6': `FINAL : LUMIÈRE HUMAINE\\nVous brillez intensément. C'est absurde, mais les critiques aiment.`,
'game.rpg.p6.e7': `FINAL : GRAMMY SURPRISE\\nL'Auto-tune expérimental a touché une corde sensible de l'académie.`,
'game.rpg.p6.e8': `FINAL : TREMPE DE FER\\nLe calme de la galerie l'a emporté sur le bruit du vlog.`,

'game.rpg.p7.e1': `FINAL : PACTE DE GOYA\\nL'autographe sombre de Goya a propulsé votre carrière, à un certain prix.`,
'game.rpg.p7.e2': `FINAL : BOURRATIF ET MAUDIT\\nLa pizza éternelle pèse dans votre estomac. Le fromage coule d'outre-tombe.`,
'game.rpg.p7.e3': `FINAL : MAGASIN FANTASMATIQUE\\nVous dessinez pour les morts. Un marché en pleine croissance.`,
'game.rpg.p7.e4': `FINAL : VANDALISME ABSOLU\\nLe spectre a des moustaches roses. L'Histoire s'en souviendra.`,
'game.rpg.p7.e5': `FINAL : ROI DE L'INVERSE\\nLe vin à l'envers guérit le foie. Vous régnerez ici pour toujours.`,
'game.rpg.p7.e6': `FINAL : CRIME DE REFLET\\nVoler son propre miroir a entraîné le paradoxe policier le plus étrange.`,
'game.rpg.p7.e7': `FINAL : PHARAON DE L'EXPO\\nLes statues vivantes gèrent le manteau des invités à la perfection.`,
'game.rpg.p7.e8': `FINAL : SIESTE RÉPARATRICE\\nUn bon thé chaud et tout a un sens. Fin.`
};

transformBlock('es', esEndings);
transformBlock('en', enEndings);
transformBlock('fr', frEndings);

fs.writeFileSync('src/context/LanguageContext.tsx', content);

