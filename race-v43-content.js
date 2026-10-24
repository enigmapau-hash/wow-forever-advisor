"use strict";
// Race Advisor v43: contenido orientativo para el escenario PvP masivo 50/30/20.
// La posición proviene de data/race-rankings-v43.json, nunca del Excel histórico.
(() => {
  const kits = Object.freeze({
    Gnomo: {
      featured: "Escape Artist",
      active: ["Escape Artist", "Eureka!"],
      passive: ["Expansive Mind", "Engineering Specialization"],
      pro: "Escape Artist libera raíces y ralentizaciones y concede una ventana breve de movimiento; Eureka! apoya habilidades directas o canalizadas durante 8 segundos, además de reducir costes.",
      caveat: "No libera aturdimientos. Eureka! no potencia efectos periódicos y su interacción con sigilo exige cautela; Ingeniería solo cuenta si se usa realmente.",
      condition: "si recuperar movilidad es decisivo y su clase no dispone ya de otra liberación lista"
    },
    Humano: {
      featured: "Will to Survive",
      active: ["Will to Survive", "Perception"],
      passive: ["Ruthless", "The Human Spirit"],
      pro: "Will to Survive permite volver a actuar tras un aturdimiento; Perception puede descubrir amenazas ocultas y Ruthless añade crítico sin depender de un arma concreta.",
      caveat: "La salida del aturdimiento no sirve contra todas las formas de control; Perception depende de que existan enemigos ocultos y el espíritu no equivale a regeneración inmediata.",
      condition: "cuando los aturdimientos y la recuperación de acción pesan más que otras defensas"
    },
    Enano: {
      featured: "Stoneform",
      active: ["Stoneform", "Find Treasure"],
      passive: ["Earth Fury", "Big Game Hunter"],
      pro: "Stoneform ofrece una ventana de resistencia frente a daño físico y efectos concretos; Earth Fury mejora la bonificación del golpe crítico, no su probabilidad.",
      caveat: "Stoneform no cubre toda la presión mágica ni añade movilidad. Find Treasure y el beneficio contra bestias no se consideran ventajas universales contra jugadores.",
      condition: "cuando predomina el daño físico y conviene resistir bajo foco"
    },
    Elfo: {
      featured: "Elune’s Light",
      active: ["Elune’s Light", "Shadowmeld"],
      passive: ["Quickness", "Wisp Spirit"],
      pro: "Elune’s Light abre una ventana de críticos; Shadowmeld ayuda a preparar una posición inmóvil y Quickness aporta carrera y esquiva física moderadas.",
      caveat: "Shadowmeld no equivale a Esfumarse durante el combate; Wisp Spirit no concede ventaja directa mientras se lucha y la ventana de críticos no garantiza impactos.",
      condition: "cuando la preparación de posición, ocultación y control de la entrada prevalecen"
    },
    Orco: {
      featured: "Hardiness",
      active: ["Blood Fury", "Shatter Curse"],
      passive: ["Savage", "Hardiness"],
      pro: "Hardiness acorta los aturdimientos; Blood Fury proporciona una ventana ofensiva y Shatter Curse responde a maldiciones y presión mágica limitada.",
      caveat: "Hardiness no elimina por completo un aturdimiento; Blood Fury no equivale a un porcentaje fijo de rendimiento y Shatter Curse no es inmunidad mágica.",
      condition: "cuando interesa actuar de forma continua ante aturdimientos y aprovechar ventanas ofensivas"
    },
    Tauren: {
      featured: "War Stomp",
      active: ["War Stomp", "Cultivation"],
      passive: ["Plainsrunning", "Endurance"],
      pro: "War Stomp controla brevemente a enemigos cercanos y Endurance añade salud; Plainsrunning ayuda sobre todo en tramos de desplazamiento sostenido y reentrada.",
      caveat: "War Stomp exige acercarse y tiene un límite de objetivos; Plainsrunning pierde utilidad al detenerse o recibir daño y Cultivation no puntúa en PvP.",
      condition: "cuando importan salud, control de proximidad y rutas seguras de reentrada"
    },
    Troll: {
      featured: "Berserking",
      active: ["Berserking", "Rapid Regeneration"],
      passive: ["Beast Slaying", "Regeneration"],
      pro: "Berserking acelera ataques o lanzamientos durante una ventana temporal; Rapid Regeneration puede ayudar a recuperarse cuando el personaje deja de actuar.",
      caveat: "Rapid Regeneration se interrumpe con acciones, movimiento o daño; Beast Slaying no aplica universalmente a jugadores y Berserking no evita interrupciones.",
      condition: "cuando puede aprovechar ventanas de lanzamiento o presión y no recibe foco continuo"
    },
    "No-muerto": {
      featured: "Will of the Forsaken",
      active: ["Will of the Forsaken", "Cannibalize"],
      passive: ["Underwater Breathing", "Touch of the Grave"],
      pro: "Will of the Forsaken rompe miedo, sueño y encanto; Touch of the Grave aporta un drenaje condicionado que complementa el aguante.",
      caveat: "No rompe aturdimientos; Cannibalize exige un cadáver adecuado y un intervalo sin interrupción, y Underwater Breathing no aporta ventaja universal en combate.",
      condition: "cuando miedo, sueño o encanto cortan acciones importantes"
    },
    Cielonato: {
      featured: "Wind Blessed",
      active: ["Walk on Air", "Read Ley Line / Skysight (según facción)"],
      passive: ["Wind Blessed", "Elemental Insight"],
      pro: "Wind Blessed añade celeridad pasiva; Walk on Air permite variar rutas con planeo y la facultad de facción ayuda a recuperación o desplazamiento.",
      caveat: "El planeo y las líneas ley o convergencias dependen del terreno; el valor de la celeridad varía por clase y no equivale a recursos gratuitos.",
      condition: "con terreno favorable y ventanas de movilidad o regeneración que puedan aprovecharse"
    }
  });
  const role = Object.freeze({
    "Brujo|Aflicción": "mantener presión periódica, drenajes y posición frente al foco",
    "Brujo|Demonología": "coordinar mascota y aguante sin acreditar todos los demonios a la vez",
    "Brujo|Destrucción": "encontrar ventanas de daño directo sin exponerse innecesariamente",
    "Cazador|Bestias": "proteger distancia y mascota; sin transferir celeridad al compañero automáticamente",
    "Cazador|Puntería": "aprovechar el alcance y mantener líneas de tiro al cambiar de posición",
    "Cazador|Supervivencia": "usar trampas y combate cercano sin perder rutas de retirada",
    "Chamán|Elemental": "mantener lanzamientos y tótems bajo presión y conservar maná",
    "Chamán|Mejora": "sostener contacto y presión cuerpo a cuerpo mientras alterna utilidades",
    "Chamán|Restauración": "curar bajo foco y reubicar apoyo y tótems con seguridad",
    "Druida|Equilibrio": "preparar lanzamientos y reposicionamiento según el terreno",
    "Druida|Feral": "mantener presión en forma felina; la variante oso/portador puede cambiar prioridades",
    "Druida|Restauración": "mantener curaciones periódicas y rutas de cobertura",
    "Guerrero|Armas": "sostener contacto y apoyar el control del frente",
    "Guerrero|Furia": "mantener presión cuerpo a cuerpo ante interrupciones de movimiento",
    "Guerrero|Protección": "defender posiciones y aliados, sin puntuar amenaza PvE como control",
    "Mago|Arcano": "administrar maná y buscar ventanas de lanzamiento",
    "Mago|Escarcha": "conservar control y reposicionamiento teniendo en cuenta Traslación",
    "Mago|Fuego": "crear ventanas de daño y críticos sin garantizar lanzamientos bajo foco",
    "Paladín|Protección": "sostener objetivos, mitigación y protección de aliados",
    "Paladín|Reprensión": "llegar al contacto, mantener sellos y dar apoyo puntual",
    "Paladín|Sagrado": "mantener curaciones y defensas ante el control enemigo",
    "Pícaro|Asesinato": "sostener venenos y contacto sin tratar la energía máxima como regeneración",
    "Pícaro|Combate": "mantener contacto considerando Carrera mejorada y el valor de Esfumarse",
    "Pícaro|Sutileza": "preparar iniciativa y reiniciar sigilo sin gastar Esfumarse gratuitamente",
    "Sacerdote|Disciplina": "proteger aliados con escudos y Penance sin duplicar absorción y apoyo",
    "Sacerdote|Sagrado": "mantener curación y recursos entre oleadas de presión",
    "Sacerdote|Sombras": "sostener presión sin sumar curaciones que exigen abandonar Shadowform"
  });
  const priest = Object.freeze({
    Gnomo: "Confounding Flash y Contingency Plan: la confusión puede romperse por daño y persisten discrepancias de reutilización del escudo.",
    Humano: "Divine Grace y Feedback: la primera sirve a un aliado, no al propio sacerdote; su reutilización tiene fuentes discrepantes.",
    Enano: "Desperate Prayer y Chastise: la autocura es de uso escaso y Chastise requiere humanoide; Sombras debe abandonar Shadowform para curarse.",
    Elfo: "Starshards y Elune's Grace: la protección de esta última se agota tras tres fallos de ataque.",
    Troll: "Hex of Weakness y Shadowguard: la reducción adicional de sanación no se acredita como garantizada si la banda ya aplica otra; sin cobertura aliada Hex gana valor.",
    "No-muerto": "Touch of Weakness y Dark Sacrifice: transforma salud en maná con un coste real, junto a la respuesta de Will of the Forsaken."
  });
  const featuredUse = Object.freeze({
    Gnomo: "Escape Artist permite recuperar movilidad; su utilidad marginal disminuye si otra liberación de clase está disponible.",
    Humano: "Will to Survive libera un aturdimiento para volver a actuar; no elimina las demás formas de control.",
    Enano: "Stoneform refuerza la defensa física durante una ventana limitada, sin resolver miedo ni desplazamientos.",
    Elfo: "Elune’s Light facilita una ventana ofensiva de críticos; Shadowmeld prepara una posición inmóvil.",
    Orco: "Hardiness acorta los aturdimientos y Blood Fury ofrece una ventana ofensiva sin garantizar daño efectivo.",
    Tauren: "War Stomp interrumpe a enemigos próximos; Plainsrunning depende de carrera sostenida o reentrada montada.",
    Troll: "Berserking acelera la actuación durante una ventana ofensiva o de curación, siempre que no se interrumpa.",
    "No-muerto": "Will of the Forsaken devuelve capacidad de acción ante miedo, sueño o encanto, no ante aturdimientos.",
    Cielonato: "Walk on Air permite cambiar de trayectoria con un planeo breve si el terreno lo permite."
  });
  function abilityDescription(record,race){
    if (race === "Cielonato") {
      if(record.especializacion === "Feral")
        return "Walk on Air habilita rutas de entrada o repliegue aprovechando desniveles; no da ventaja automática en terreno llano.";
      return record.faccion === "Alianza"
        ? "Read Ley Line aumenta la regeneración de salud y maná durante su ventana activa; su rendimiento bajo presión no está garantizado."
        : "Skysight aporta una ventana de velocidad de carrera para reposicionarse; su ventaja es situacional.";
    }
    if (record.clase === "Sacerdote" && race === "Troll")
      return "Hex of Weakness aporta reducción de sanación y poder de ataque, pero su beneficio adicional depende de los efectos aliados ya presentes.";
    if(record.clase === "Mago" && race === "Gnomo")
      return "Escape Artist aún sirve ante ralentizaciones y como recurso de reserva; se solapa parcialmente con Traslación mientras está disponible.";
    if(record.clase === "Pícaro" && race === "Gnomo")
      return "Escape Artist conserva valor cuando conviene reservar Esfumarse para reiniciar el sigilo; Combate dispone además de Carrera mejorada.";
    if(record.clase === "Sacerdote" && record.especializacion === "Sombras" && race === "Enano")
      return "Desperate Prayer exige abandonar Shadowform para curarse; Stoneform sigue ofreciendo protección física.";
    return featuredUse[race] || "";
  }
  function ability(record, race) {
    if (race === "Cielonato") {
      if (record.especializacion === "Feral") return "Walk on Air";
      return record.faccion === "Alianza" ? "Read Ley Line" : "Skysight";
    }
    if (record.clase === "Sacerdote" && record.faccion === "Horda" && race === "Troll") return "Hex of Weakness";
    return kits[race]?.featured || "";
  }
  function evidence(record, race) {
    const kit = kits[race];
    if (!kit) return null;
    const add = record.clase === "Sacerdote" ? " " + priest[race] : "";
    const primary = record.clase === "Sacerdote" && race === "Troll"
      ? "Hex of Weakness aporta reducción condicionada del daño y la sanación enemigos; Shadowguard complementa la respuesta. " + kit.pro
      : kit.pro;
    return {
      aFavor: primary + " En " + record.clase + " " + record.especializacion + ", el análisis se centra en " + role[record.clase + "|" + record.especializacion] + "." + add,
      aTenerEnCuenta: kit.caveat + (race === "Tauren"
        ? " El modelo base no supone acumulación de Plainsrunning durante el combate frontal."
        : race === "Cielonato"
          ? " Cielonato requiere acceso a esa raza y el escenario base no presume terreno favorable."
          : "") + (record.clase === "Sacerdote" && race === "Troll"
            ? " El efecto marginal de Hex depende de la reducción de sanación ya presente." : "")
    };
  }
  function context(record) {
    const main = evidence(record, record.razaRecomendada);
    const alt = record.alternativa !== "-" ? evidence(record, record.alternativa) : null;
    if (!main) return null;
    const subject = role[record.clase + "|" + record.especializacion];
    const caution = record.faccion === "Horda" && record.clase === "Sacerdote"
      ? " La recomendación presupone cobertura aliada de reducción de sanación durante frente y objetivos, sin afirmar una regla de acumulación."
      : "";
    const third = record.segundaTerceraMuyProximas
      ? " La tercera raza también queda próxima a la alternativa y puede ser adecuada con otras condiciones."
      : "";
    return {
      principal: main,
      alternativaAnalisis: alt,
      conclusionPrincipal: "Para " + record.clase + " " + record.especializacion
        + " en " + record.faccion + ", " + raceLabel(record.razaRecomendada)
        + " encabeza el escenario editorial de PvP masivo porque aporta herramientas especialmente útiles para "
        + subject + "." + (record.empateTecnicoEditorial
          ? " Es una elección muy ajustada respecto a la alternativa y el orden puede variar con el combate."
          : " Es una recomendación editorial, no una ventaja medida.") + caution,
      conclusionAlternativa: alt
        ? raceLabel(record.alternativa) + " es la segunda opción en el escenario base y puede resultar preferible "
          + kits[record.alternativa].condition + ". La comparación depende de las condiciones del encuentro, "
          + "la composición del grupo y las mecánicas aún no verificadas del cliente de lanzamiento." + third
        : "",
      fuentes: ["https://worldofwarcraft.blizzard.com/es-es/news/24304075",
        record.clase === "Sacerdote" || record.clase === "Guerrero"
          ? "https://worldofwarcraft.blizzard.com/es-es/news/24301514"
          : ["Cazador","Druida"].includes(record.clase)
            ? "https://worldofwarcraft.blizzard.com/es-es/news/24301515"
            : ["Pícaro","Brujo"].includes(record.clase)
              ? "https://worldofwarcraft.blizzard.com/es-es/news/24310968"
              : ["Mago","Chamán"].includes(record.clase)
                ? "https://worldofwarcraft.blizzard.com/es-es/news/24302097"
                : "https://worldofwarcraft.blizzard.com/es-es/news/24302099"]
    };
  }
  function raceLabel(name) { return name === "Elfo" ? "Elfo de la noche" : name; }
  function apply(data, records, profiles, skyborne) {
    if (!data || data.schemaVersion !== 2 || data.resumen?.fichas !== 54
        || data.resumen?.candidaturas !== 168 || !Array.isArray(data.fichas) || data.fichas.length !== 54)
      throw Error("La clasificación racial v2 está ausente o incompleta.");
    const old = new Map(records.map(row => [JSON.stringify([row.faccion,row.clase,row.especializacion]),row]));
    // Tabla independiente de elegibilidad: ninguna raza puede entrar ni omitirse al calcular top 2.
    const allowed = {
      Alianza: {
        Brujo: ["Gnomo","Humano"],
        Cazador: ["Humano","Enano","Elfo","Cielonato"],
        "Chamán": ["Enano"], Druida: ["Elfo","Cielonato"],
        Guerrero: ["Gnomo","Humano","Enano","Elfo","Cielonato"],
        Mago: ["Gnomo","Humano","Cielonato"],
        "Paladín": ["Humano","Enano"],
        "Pícaro": ["Gnomo","Humano","Enano","Elfo","Cielonato"],
        Sacerdote: ["Gnomo","Humano","Enano","Elfo"]
      },
      Horda: {
        Brujo: ["Orco","No-muerto","Troll"],
        Cazador: ["Orco","Tauren","Troll","Cielonato"],
        "Chamán": ["Orco","Tauren","Troll","Cielonato"],
        Druida: ["Tauren","Cielonato"],
        Guerrero: ["Orco","Tauren","Troll","No-muerto","Cielonato"],
        Mago: ["Orco","Troll","No-muerto"],
        "Paladín": ["No-muerto"],
        "Pícaro": ["Orco","Troll","No-muerto","Cielonato"],
        Sacerdote: ["Troll","No-muerto"]
      }
    };
    const rank = new Map();
    let count=0,sky=0,unique=0;
    for(const item of data.fichas) {
      const key = JSON.stringify([item.faccion,item.clase,item.especializacion]);
      const original = old.get(key);
      if (!original || rank.has(key) || !Array.isArray(item.fullOrder) || item.fullOrder.length === 0
          || new Set(item.fullOrder).size !== item.fullOrder.length || item.fullOrder[0] !== item.razaRecomendada
          || (item.fullOrder[1] || "-") !== item.alternativa
          || !item.puntuacionesEditoriales || Object.keys(item.puntuacionesEditoriales).length !== item.fullOrder.length
          || !item.fullOrder.every((race, i) => Number.isFinite(item.puntuacionesEditoriales[race])
            && (i === 0 || item.puntuacionesEditoriales[item.fullOrder[i-1]] >= item.puntuacionesEditoriales[race]))
          || item.empateTecnicoEditorial !== (item.fullOrder.length > 1
            && item.puntuacionesEditoriales[item.fullOrder[0]] - item.puntuacionesEditoriales[item.fullOrder[1]] < 2)
          || item.segundaTerceraMuyProximas !== (item.fullOrder.length > 2
            && item.puntuacionesEditoriales[item.fullOrder[1]] - item.puntuacionesEditoriales[item.fullOrder[2]] < 2)
          || !allowed[item.faccion]?.[item.clase]
          || item.fullOrder.length !== allowed[item.faccion][item.clase].length
          || !item.fullOrder.every(race => allowed[item.faccion][item.clase].includes(race)))
        throw Error("Orden de razas o elegibilidad incoherente para " + key);
      for(const race of item.fullOrder) {
        if (race === "Cielonato") {
          if (!skyborne?.variantes?.find(v=>v.faccion === item.faccion && v.clases.includes(item.clase)))
            throw Error("Cielonato no validado: " + key);
          sky++;
        } else if (!profiles.has(race)) throw Error("Raza no reconocida: " + race);
      }
      if(item.fullOrder.length === 1) unique++;
      count += item.fullOrder.length;
      rank.set(key,item);
    }
    if (rank.size !== old.size || count !== 168 || sky !== 30 || unique !== 6)
      throw Error("La cobertura completa de razas no coincide.");
    return records.map(row => {
      const r=rank.get(JSON.stringify([row.faccion,row.clase,row.especializacion]));
      const updated={...row,razaRecomendada:r.razaRecomendada,alternativa:r.alternativa,
        empateTecnicoEditorial:r.empateTecnicoEditorial,
        segundaTerceraMuyProximas:r.segundaTerceraMuyProximas,
        prioridad:"Orientativa · beta",rankingCompleto:r.fullOrder};
      const main=kits[r.razaRecomendada],secondary=kits[r.alternativa];
      updated.motivoPrincipal="En PvP masivo, "+raceLabel(r.razaRecomendada)+" destaca para "+role[updated.clase+"|"+updated.especializacion]+".";
      updated.explicacion=updated.motivoPrincipal+" "+main.pro;
      updated.usoAlternativa=secondary ? "Alternativa cuando "+secondary.condition+"." : "";
      updated.motivoComparacion = secondary ? "Comparación provisional del escenario PvP masivo 50/30/20." : "";
      return updated;
    });
  }
  self.WOW_RACE_V43=Object.freeze({kits,role,apply,context,ability,abilityDescription,evidence,raceLabel});
})();