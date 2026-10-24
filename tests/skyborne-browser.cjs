"use strict";
const assert = require("node:assert/strict");

// Cielonato v43: variantes de facción, alternativas nuevas y modo offline.
module.exports = async function testSkyborne(page, context, base) {
  await context.setOffline(false);
  await page.goto(base + "/#raciales");
  await page.locator('#racial-race button[data-value="Cielonato"]').waitFor();
  await page.locator('#racial-race button[data-value="Cielonato"]').click();
  assert.equal(await page.locator("#skyborne-result").isVisible(),true);
  assert.equal(await page.locator("#racial-race button").count(),9);
  assert.equal(await page.locator("#skyborne-alternatives a").count(),8,
    "Las seis alternativas de Druida y las dos nuevas de Pícaro Horda");
  for(const [side,spell] of [["Alianza","Read Ley Line"],["Horda","Skysight"]]) {
    await page.locator('#skyborne-faction button[data-value="'+side+'"]').click();
    assert.equal(await page.locator("#skyborne-ability-title").textContent(),spell);
    assert.equal(await page.locator('#skyborne-faction button[data-value="'+side+'"]').getAttribute("aria-pressed"),"true");
  }
  for(const width of [320,390,820,1280]) {
    await page.setViewportSize({width,height:844});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),
      "Cielonato no desborda pantalla a "+width);
  }
  await page.goto(base+"/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve=>navigator.serviceWorker.addEventListener("controllerchange",resolve,{once:true}));
    }
  });
  assert((await page.evaluate(()=>caches.keys())).some(name=>name.endsWith(":v43")));
  await context.setOffline(true);
  await page.reload();
  await page.locator("#home-explore-racials").click();
  await page.locator('#racial-race button[data-value="Cielonato"]').click();
  await page.locator('#skyborne-faction button[data-value="Horda"]').click();
  assert.equal(await page.locator("#skyborne-ability-title").textContent(),"Skysight");
  await context.setOffline(false);
  // La ausencia del inventario Cielonato no puede producir falsos top 2.
  const fallback = await context.browser().newContext({serviceWorkers:"block"});
  try {
    await fallback.route("**/data/skyborne.json",route=>route.fulfill({contentType:"application/json",body:"{}"}));
    const p=await fallback.newPage();
    await p.goto(base + "/#race-advisor");
    await p.locator("#data-error").waitFor();
    assert.equal(await p.locator("#data-error").isVisible(),true);
    assert.equal(await p.locator("#advisor-result").isVisible(),false);
  } finally {await fallback.close();}
  console.log("Cielonato v43: variantes, 8 alternativas, cuatro anchuras, offline y fallo explícito: OK");
};