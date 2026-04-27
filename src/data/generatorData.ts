export const getGeneratorData = (lang: 'es' | 'en' | 'fr') => {
  if (lang === 'en') {
    return {
      TYPES: ["Underground Rave", "Philosophy Congress", "Extreme Spiritual Retreat", "Crypto eSports Tournament", "Indie Festival", "Interdimensional Thrift Market", "Conceptual Town Fair", "Broke Entrepreneurs Summit", "Public Crying Competition", "6-Month Silent Retreat", "Anti-Capitalist Hackathon", "48-Hour Performance Art", "Underground Beyblade Tournament", "Tap Water Tasting", "Conference on Existential Void", "Sad Anime Marathon", "Dead Meme Symposium"],
      LOCATIONS: ["a damp basement in La Roma", "the scorching desert of Sonora", "a clandestine terrace about to be shut down", "an abandoned Discord server", "a Walmart parking lot", "a drained water park", "a retro school auditorium smelling of dampness", "a metaverse nobody uses", "the roof of a taco stand", "a deserted island (bought on financing)", "the center of the earth", "your living room", "an abandoned industrial warehouse", "a luxury restaurant bathroom", "a convenience store at 3 AM", "a drifting fishing boat"],
      AUDIENCES: ["angry old people", "Gen Z with diagnosed anxiety", "millennials clinging to their youth", "bankrupt cryptobros", "influencers with no followers", "stray cats", "bored investors looking to burn money", "depressed AIs", "dogs that look like middle-aged men", "office workers on the verge of collapse", "artists seeking paternal validation", "sleepless programmers", "founders of imaginary startups", "people who read Nietzsche blindly", "showered otakus", "aunties who send minion memes"],
      BUDGETS: ["$10 bucks (and sheer faith)", "half a pack of chewed gum", "infinite budget (mentally, obviously)", "3 devalued Dogecoins", "$50,000 in expired grocery vouchers", "pure exchange (the damn 'exposure')", "imaginary crowdfunding with 0 donors", "your grandma's inheritance", "one bitcoin trapped in a lost hard drive", "couch cushion change", "3 Monopoly bills and raw hope", "promises of 'giving you equity' when it moons", "a predatory loan you'll pay for 30 years", "daddy's credit card", "the leftover budget from a failed film"],
      endings: [
        "If you don't want this to end up in an explanatory Twitter thread about why it failed, send me a message and we'll put together a containment plan. Hit the contact button before it's too late.",
        "Basically, you're about to burn out your mental health. Hire me to stress over it for you (and make it ridiculously successful along the way).",
        "This is a slow-motion car crash. Meaning, perfect material for my portfolio. Let's talk fees and I'll fix it for you.",
        "The good news is you have imagination. The bad news is without logistics this will just be smoke. Give me your dollars and I'll bring the pragmatism. Hit 'Send Transmission'!",
        "Sounds like the exact kind of chaos I shine in. I'll charge you half in money and half in the stress I'm going to take away from you. Schedule a call with me right now."
      ],
      generateResponse: (name: string, budget: string, audience: string, location: string, type: string, ending: string) => {
        return `Your ${type.toLowerCase()} named "${name}" in ${location} has a budget of ${budget} and is aimed at ${audience}. Honestly, it sounds like a beautiful logistical disaster and a production nightmare... But, ${ending}`;
      }
    };
  }
  
  if (lang === 'fr') {
    return {
      TYPES: ["Rave Clandestine", "Congrès de Philosophie", "Retraite Spirituelle Extrême", "Tournoi eSports Crypto", "Festival Indé", "Marché aux Puces Interdimensionnel", "Foire de Village Conceptuelle", "Sommet d'Entrepreneurs Fauchés", "Compétition de Pleurs en Public", "Retraite Silencieuse de 6 Mois", "Hackathon Anti-Capitaliste", "Performance Artistique de 48 Heures", "Tournoi Clandestin de Beyblade", "Dégustation d'Eau du Robinet", "Conférence sur le Vide Existentiel", "Marathon d'Anime Triste", "Symposium de Mèmes Morts"],
      LOCATIONS: ["une cave humide à La Roma", "le désert brûlant de Sonora", "une terrasse clandestine sur le point d'être fermée", "un serveur Discord abandonné", "un parking Walmart", "un parc aquatique drainé", "un amphithéâtre rétro sentant l'humidité", "un métavers que personne n'utilise", "le toit d'une baraque à frites", "une île déserte (achetée à crédit)", "le centre de la terre", "votre salon", "un entrepôt industriel abandonné", "les toilettes d'un restaurant de luxe", "une supérette à 3h du matin", "un bateau de pêche à la dérive"],
      AUDIENCES: ["des vieux en colère", "la Gen Z avec une anxiété diagnostiquée", "des milléniaux accrochés à leur jeunesse", "des cryptobros en faillite", "des influenceurs sans abonnés", "des chats de gouttière", "des investisseurs ennuyés cherchant à brûler de l'argent", "des IA déprimées", "des chiens qui ressemblent à de vieux monsieurs", "des employés de bureau au bord du gouffre", "des artistes cherchant l'approbation paternelle", "des programmeurs insomniaques", "des fondateurs de startups imaginaires", "des gens qui lisent Nietzsche sans le comprendre", "des otakus parfumés", "des tatas qui envoient des mèmes sur WhatsApp"],
      BUDGETS: ["10€ (et la foi de Dieu)", "un demi-paquet de chewing-gum mâché", "budget infini (mentalement, évidemment)", "3 Dogecoins dévalués", "50 000 en tickets restaurant périmés", "pur échange (la maudite 'exposition')", "crowdfunding imaginaire avec 0 donneur", "l'héritage de ta grand-mère", "un bitcoin bloqué dans un disque dur perdu", "les pièces qui traînent au fond du canapé", "3 billets de Monopoly et beaucoup d'espoir", "des promesses de 'parts sociales' quand ça marchera", "un prêt abusif que tu paieras pendant 30 ans", "la carte de crédit de papa", "les restes de budget d'un film raté"],
      endings: [
        "Si vous ne voulez pas que cela se termine par un fil Twitter explicatif sur les raisons de son échec, envoyez-moi un message et nous élaborerons un plan de confinement. Appuyez sur le bouton de contact avant qu'il ne soit trop tard.",
        "En gros, vous êtes sur le point de griller votre santé mentale. Embauchez-moi pour stresser à votre place (et au passage faire en sorte que ce soit un succès ridicule).",
        "C'est un accident de voiture au ralenti. C'est-à-dire, un matériel parfait pour mon portfolio. Parlons honoraires et je vous arrange ça.",
        "La bonne nouvelle c'est que vous avez de l'imagination. La mauvaise c'est que sans logistique ce ne sera que de la fumée. Donnez-moi vos euros et j'apporterai le pragmatisme. Cliquez sur 'Envoyer la Transmission' !",
        "Cela ressemble exactement au genre de chaos dans lequel je brille. Je vous facturerai la moitié en argent et l'autre moitié en stress que je vais vous enlever. Planifiez un appel avec moi dès maintenant."
      ],
      generateResponse: (name: string, budget: string, audience: string, location: string, type: string, ending: string) => {
        return `Votre ${type.toLowerCase()} nommé "${name}" se déroulant dans ${location} a un budget de ${budget} et s'adresse à ${audience}. Franchement, ça ressemble à un magnifique désastre logistique et à un cauchemar de production... Mais, ${ending}`;
      }
    };
  }

  // Default ES
  return {
    TYPES: ["Rave Clandestino", "Congreso de Filosofía", "Retiro Espiritual Extremo", "Torneo de eSports Criptográfico", "Festival Indie", "Bazar de Segunda Mano Interdimensional", "Feria de Pueblo Conceptual", "Cumbre de Emprendedores Quebrados", "Competencia de Llorar en Público", "Retiro de Silencio de 6 Meses", "Hackathon Anti-Capitalista", "Performance de 48 Horas", "Torneo Clandestino de Beyblade", "Degustación de Agua del Grifo", "Conferencia sobre el Vacío Existencial", "Maratón de Anime Triste", "Simposio de Memes Muertos"],
    LOCATIONS: ["un sótano húmedo en la Roma", "el desierto abrasador de Sonora", "una terraza clandestina a punto de clausura", "un Servidor de Discord abandonado", "un estacionamiento de Walmart", "un parque acuático drenado", "un auditorio escolar retro oliendo a humedad", "un metaverso que nadie usa", "el techo de una taquería", "una isla desierta (comprada a meses sin intereses)", "el centro de la tierra", "tu sala", "una bodega industrial abandonada", "el baño de un restaurante de lujo", "un Oxxo a las 3 AM", "un barco pesquero a la deriva"],
    AUDIENCES: ["viejitos enojados", "Gen Z con ansiedad diagnosticada", "millennials aferrados a su juventud", "criptobros en bancarrota", "influencers sin seguidores", "gatos callejeros", "inversores aburridos buscando quemar dinero", "IAs deprimidas", "perros que parecen señores", "oficinistas al borde del colapso", "artistas buscando validación paterna", "programadores que no duermen", "dueños de startups imaginarias", "gente que lee a Nietzsche sin entenderlo", "otakus recién bañados", "tías que mandan piolines en WhatsApp"],
    BUDGETS: ["$10 pesos (y la fe de Dios)", "un paquete de chicles a medio mascar", "presupuesto infinito (mental, obvio)", "3 Dogecoins devaluados", "$50,000 en vales de despensa caducados", "puro intercambio (la maldita 'exposición')", "crowdfunding imaginario con 0 donantes", "la herencia de tu abuela", "un bitcoin atrapado en un disco duro perdido", "las monedas que se cayeron en el sillón", "3 billetes del Monopoly y la esperanza de un milagro", "promesas de 'hacerte socio' cuando la app pegue", "un préstamo leonino que pagarás en 30 años", "la tarjeta de crédito negra de papá", "el presupuesto sobrante de un cortometraje de estudiantes de cine"],
    endings: [
      "Si no quieres que esto termine en un hilo de Twitter explicativo sobre por qué fracasó, envíame un mensaje y armamos un plan de contención. Presiona el botón de contacto antes de que sea demasiado tarde.",
      "Básicamente, estás a punto de quemar tu salud mental. Contrátame para que yo me estrese por ti (y de paso hagamos que esto sea ridículamente exitoso).",
      "Esto es un accidente automovilístico a cámara lenta. Es decir, material perfecto para mi portafolio. Hablemos de honorarios y te lo arreglo.",
      "La buena noticia es que tienes imaginación. La mala es que sin logística esto será humo. Dame tus dólares (o pesos devaluados) y yo pongo el pragmatismo. ¡Dale a 'Enviar Transmisión'!",
      "Suena al tipo exacto de caos en el que brillo. Te cobro la mitad en dinero y la mitad en el estrés que te voy a quitar. Agenda una llamada conmigo ya mismo."
    ],
    generateResponse: (name: string, budget: string, audience: string, location: string, type: string, ending: string) => {
      return `Tu ${type.toLowerCase()} llamado "${name}" en ${location} tiene ${budget} de presupuesto y va dirigido a ${audience}. Honestamente, suena a un desastre logístico hermoso y una pesadilla de producción... Pero, ${ending}`;
    }
  };
};
