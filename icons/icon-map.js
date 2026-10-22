"use strict";

// Imágenes originales del juego servidas desde la CDN de Wowhead. No se alojan ni
// redistribuyen binarios de Blizzard en este repositorio. Se almacenan en la
// caché privada del navegador tras la primera visita con conexión.
// Slugs gráficos representativos de WoW; conservar los textos accesibles.
(() => {
  const base = "https://wow.zamimg.com/images/wow/icons/large/";
  const file = (slug) => `${base}${slug}.jpg`;
  const entries = (values) => Object.fromEntries(
    Object.entries(values).map(([name, slug]) => [name, file(slug)])
  );

  const icons = {
    faccion: entries({
      "Alianza": "inv_bannerpvp_02",
      "Horda": "inv_bannerpvp_01",
    }),
    clase: entries({
      "Guerrero": "classicon_warrior",
      "Paladín": "classicon_paladin",
      "Cazador": "classicon_hunter",
      "Pícaro": "classicon_rogue",
      "Sacerdote": "classicon_priest",
      "Mago": "classicon_mage",
      "Brujo": "classicon_warlock",
      "Druida": "classicon_druid",
      "Chamán": "classicon_shaman",
    }),
    especializacion: {
      "Guerrero": entries({ "Armas": "ability_rogue_eviscerate", "Furia": "ability_warrior_innerrage", "Protección": "ability_warrior_defensivestance" }),
      "Paladín": entries({ "Sagrado": "spell_holy_holybolt", "Protección": "spell_holy_devotionaura", "Reprensión": "spell_holy_auraoflight" }),
      "Cazador": entries({ "Bestias": "ability_hunter_beasttaming", "Puntería": "ability_marksmanship", "Supervivencia": "ability_hunter_swiftstrike" }),
      "Pícaro": entries({ "Asesinato": "ability_rogue_eviscerate", "Combate": "ability_backstab", "Sutileza": "ability_stealth" }),
      "Sacerdote": entries({ "Disciplina": "spell_holy_wordfortitude", "Sagrado": "spell_holy_holybolt", "Sombras": "spell_shadow_shadowwordpain" }),
      "Chamán": entries({ "Elemental": "spell_nature_lightning", "Mejora": "spell_nature_lightningshield", "Restauración": "spell_nature_magicimmunity" }),
      "Mago": entries({ "Arcano": "spell_holy_magicalsentry", "Fuego": "spell_fire_firebolt02", "Escarcha": "spell_frost_frostbolt02" }),
      "Brujo": entries({ "Aflicción": "spell_shadow_deathcoil", "Demonología": "spell_shadow_metamorphosis", "Destrucción": "spell_shadow_rainoffire" }),
      "Druida": entries({ "Equilibrio": "spell_nature_starfall", "Feral": "ability_racial_bearform", "Restauración": "spell_nature_healingtouch" }),
    },
    raza: entries({
      "Gnomo": "achievement_character_gnome_male",
      "Humano": "achievement_character_human_male",
      "Enano": "achievement_character_dwarf_male",
      "Elfo": "achievement_character_nightelf_male",
      "Orco": "achievement_character_orc_male",
      "Tauren": "achievement_character_tauren_male",
      "Troll": "achievement_character_troll_male",
      "No-muerto": "achievement_character_undead_male",
    }),
  };
  self.WOW_ICON_MAP = icons;
  self.WOW_ICON_URLS = [...new Set([
    ...Object.values(icons.faccion),
    ...Object.values(icons.clase),
    ...Object.values(icons.raza),
    ...Object.values(icons.especializacion).flatMap((specs) => Object.values(specs)),
  ])];
})();
