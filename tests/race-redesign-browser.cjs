"use strict";
const assert = require("node:assert/strict");

// v43: 54 fichas, ranking v2, contenido contextual y misma experiencia offline.
module.exports = async function testRedesign(page, base, offline = false) {
  await page.goto(base + "/#race-advisor");
  await page.locator("#faction button").first().waitFor();
  const widths = offline ? [390] : [320, 390, 820, 1280];
  for (const width of widths) {
    await page.setViewportSize({width, height: 1000});
    const results = await page.evaluate(async () => {
      const rank = await (await fetch("./data/race-rankings-v43.json")).json();
      const select = (id, value) => {
        const button = [...document.querySelectorAll("#" + id + " button")].find(b => b.dataset.value === value);
        if (!button) throw Error("Selector ausente: " + id + " / " + value);
        button.click();
      };
      const text = id => document.getElementById(id)?.textContent?.trim() || "";
      const display = r => r === "Elfo" ? "Elfo de la noche" : r;
      const state = [];
      for (const r of rank.fichas) {
        select("faction",r.faccion);
        select("character-class",r.clase);
        select("specialization",r.especializacion);
        const main = document.querySelector('[data-field="razaRecomendada"]')?.textContent;
        const second = document.querySelector('[data-field="alternativa"]')?.textContent;
        if (main !== display(r.razaRecomendada)) throw Error("Principal errónea: " + r.faccion + "/" + r.clase + "/" + r.especializacion);
        if (r.alternativa === "-") {
          if (!document.getElementById("alternative-profile").hidden
              || document.getElementById("race-single-evaluation").hidden)
            throw Error("No se reconoce raza única: " + r.clase);
        } else {
          if (second !== display(r.alternativa)
              || document.getElementById("alternative-profile").hidden
              || document.getElementById("race-comparison").hidden)
            throw Error("Alternativa inválida: " + r.faccion + "/" + r.clase + "/" + r.especializacion);
          for(const id of ["compare-primary-pro","compare-primary-con","compare-alternative-pro",
              "compare-alternative-con","alternative-use","alternative-explanation"]) {
            if(text(id).length < 20) throw Error("Texto contextual incompleto: "+id);
          }
          if (document.querySelectorAll("#race-comparison-conclusion-text > p").length !== 2)
            throw Error("Faltan conclusiones para " + r.clase + " " + r.especializacion);
        }
        if (text("primary-key-reason").length < 30 || text("primary-analysis").length < 30
            || text("primary-ability-name").length < 5) throw Error("Ficha principal sin análisis.");
        const ability = self.WOW_RACE_V43.ability(r,r.razaRecomendada);
        if (text("primary-ability-name") !== ability) throw Error("Racial destacada incoherente");
        if (r.alternativa !== "-" && text("alternative-ability-name") !== self.WOW_RACE_V43.ability(r,r.alternativa))
          throw Error("Facultad de alternativa incoherente");
        if (r.faccion === "Alianza" && r.clase === "Druida" && r.especializacion === "Feral"
            && text("alternative-ability-name") !== "Walk on Air") throw Error("Feral debe destacar planeo");
        state.push([r.faccion,r.clase,r.especializacion]);
      }
      const urlIdentity = url => url.match(/(?:news|article)\/(\d{8})/)?.[1]
        || url.match(/\/t\/[^/]+\/(\d+)\/(\d+)/)?.slice(1).join("/") || url;
      const uniqueSources = [...document.querySelectorAll("#race-extra-sources a")].map(a=>urlIdentity(a.href));
      if (new Set(uniqueSources).size !== uniqueSources.length) throw Error("Fuentes duplicadas");
      return {cards:state.length, unique:new Set(state.map(x=>JSON.stringify(x))).size,
        single:rank.fichas.filter(r=>r.alternativa==="-").length,
        candidates:rank.fichas.reduce((n,r)=>n+r.fullOrder.length,0),
        sky:rank.fichas.filter(r=>r.fullOrder.includes("Cielonato")).length
      };
    });
    assert.deepEqual(results,{cards:54,unique:54,single:6,candidates:168,sky:30});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "Sin desbordamiento a " + width + " px");
    const cols=await page.locator(".race-choices").evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(" ").length);
    assert.equal(cols,width<960?1:2);
  }
  await page.goto(base + "/#race-advisor");
  await page.locator("#faction button").first().waitFor();
  await page.locator('#faction button[data-value="Horda"]').click();
  await page.locator('#character-class button[data-value="Druida"]').click();
  await page.locator('#specialization button[data-value="Feral"]').click();
  await page.locator("#alternative-race-link").click();
  await page.waitForURL(/#raciales/);
  assert.equal(await page.locator("#racial-race button[data-value='Cielonato']").getAttribute("aria-pressed"), "true");
  assert.equal(await page.locator("#skyborne-faction button[data-value='Horda']").getAttribute("aria-pressed"), "true",
    "El enlace al perfil de Cielonato debe conservar la facción de origen");
  assert.equal(await page.locator("#skyborne-ability-title").textContent(),"Skysight");
  console.log("Race v43: 54/54; 168 candidaturas; 48 comparativas, 6 únicas; responsive y variante Cielonato",offline?"offline":"online");
};