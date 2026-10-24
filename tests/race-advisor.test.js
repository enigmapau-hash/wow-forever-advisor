"use strict";

// Pruebas interactivas v43: el Excel se conserva, pero la fuente de recomendaciones es v2.
const frame=document.getElementById("app-under-test");
const report=document.getElementById("test-report");
async function waitUntil(predicate, timeout=9000) {
  const start=Date.now();
  while(!predicate()) {
    if(Date.now()-start>timeout)throw Error("Tiempo de espera agotado");
    await new Promise(resolve=>setTimeout(resolve,25));
  }
}
const choose=(doc,id,value)=>{
  const button=[...doc.querySelectorAll("#"+id+" button")].find(x=>x.dataset.value===value);
  if(!button)throw Error("Opción inexistente "+id+" "+value);
  button.click();
};
const display=name=>name==="Elfo"?"Elfo de la noche":name;
async function read(path){const r=await fetch("../data/"+path+".json");if(!r.ok)throw Error("Datos ausentes: "+path);return r.json();}
async function withApp() {
  const doc=frame.contentDocument,win=frame.contentWindow;
  if(!doc||!win)throw Error("La aplicación no se ha cargado");
  doc.getElementById("race-advisor").click();
  await waitUntil(()=>doc.querySelector("#faction button")||!doc.getElementById("data-error").hidden);
  if(!doc.getElementById("data-error").hidden)throw Error("Datos raciales v43 no disponibles");
  return {doc,win};
}
function run(name,callback) {
  document.getElementById(name).addEventListener("click",async event=>{
    event.currentTarget.disabled=true;
    report.textContent="Ejecutando…";
    try {report.textContent="OK: "+await callback();}
    catch(e){report.textContent="ERROR: "+e.message;console.error(e);}
    finally{event.currentTarget.disabled=false;}
  });
}
run("run-tests",async()=>{
  const [{fichas},advisor,additions,sky,profiles]=await Promise.all([
    read("race-rankings-v43"),read("race-advisor"),read("race-advisor-additions"),
    read("skyborne"),read("racials")
  ]);
  if(advisor.fichas.length!==51||additions.fichas.length!==3)throw Error("Datos del Excel histórico alterados");
  const {doc,win}=await withApp();
  if(fichas.length!==54||fichas.reduce((n,r)=>n+r.fullOrder.length,0)!==168)throw Error("No son 54 fichas/168 candidaturas");
  if(fichas.filter(r=>r.fullOrder.includes("Cielonato")).length!==30)throw Error("Cobertura de Cielonato incompleta");
  let comparisons=0,singles=0,assertions=0;
  for(const row of fichas) {
    const label=[row.faccion,row.clase,row.especializacion].join(" / ");
    choose(doc,"faction",row.faccion);choose(doc,"character-class",row.clase);
    choose(doc,"specialization",row.especializacion);
    const field=name=>doc.querySelector('[data-field="'+name+'"]')?.textContent;
    if(field("razaRecomendada")!==display(row.razaRecomendada))throw Error(label+": principal");
    if(!doc.getElementById("primary-key-reason").textContent.trim()
        || !doc.getElementById("primary-analysis").textContent.trim())throw Error(label+": análisis principal vacío");
    if(doc.getElementById("primary-ability-name").textContent!==win.WOW_RACE_V43.ability(row,row.razaRecomendada))
      throw Error(label+": facultad destacada");
    if(row.alternativa==="-") {
      singles++;
      if(!doc.getElementById("alternative-profile").hidden||doc.getElementById("race-single-evaluation").hidden)
        throw Error(label+": raza única");
    }else {
      comparisons++;
      if(field("alternativa")!==display(row.alternativa)||doc.getElementById("race-comparison").hidden)
        throw Error(label+": alternativa");
      for(const id of ["compare-primary-pro","compare-primary-con","compare-alternative-pro",
          "compare-alternative-con","alternative-use","alternative-explanation"]) {
        if(doc.getElementById(id).textContent.trim().length<20)throw Error(label+": "+id);
      }
      if(doc.querySelectorAll("#race-comparison-conclusion-text > p").length!==2)
        throw Error(label+": conclusiones incompletas");
      if(doc.getElementById("alternative-ability-name").textContent!==win.WOW_RACE_V43.ability(row,row.alternativa))
        throw Error(label+": habilidad alternativa incorrecta");
      if(row.faccion==="Alianza"&&row.clase==="Druida"&&row.especializacion==="Feral"
          &&doc.getElementById("alternative-ability-name").textContent!=="Walk on Air")
        throw Error(label+": habilidad de Feral");
    }
    assertions+=9;
  }
  if(comparisons!==48||singles!==6||profiles.raciales.length!==8||sky.variantes.length!==2)
    throw Error("Conteos finales");
  return assertions+" comprobaciones; 54 fichas; 48 comparativas; seis únicas; Excel preservado";
});
run("run-racials",async()=>{
  const {doc,win}=await withApp();
  doc.getElementById("explore-racials").click();
  await waitUntil(()=>doc.querySelector('#racial-race button[data-value="Cielonato"]'));
  for(const name of Object.keys(win.WOW_RACE_V43.kits)) {
    choose(doc,"racial-race",name);
    if(name==="Cielonato") {
      if(doc.getElementById("skyborne-result").hidden)throw Error("Perfil Cielonato oculto");
      for(const [f,ability] of [["Alianza","Read Ley Line"],["Horda","Skysight"]]) {
        choose(doc,"skyborne-faction",f);
        if(doc.getElementById("skyborne-ability-title").textContent!==ability)throw Error("Variante "+f);
      }
    }else{
      if(doc.getElementById("racial-result").hidden)throw Error("Perfil oculto "+name);
      if(!doc.getElementById("racial-v43-kit")?.textContent.includes("Activas:"))
        throw Error("Inventario racial ausente "+name);
    }
  }
  return "nueve perfiles y dos variantes de Cielonato con inventario vigente";
});
run("run-navigation",async()=>{
  const {doc,win}=await withApp();
  choose(doc,"faction","Horda");choose(doc,"character-class","Druida");
  choose(doc,"specialization","Feral");
  doc.getElementById("alternative-race-link").click();
  await waitUntil(()=>doc.getElementById("skyborne-faction").dataset.value==="Horda");
  if(doc.getElementById("skyborne-ability-title").textContent!=="Skysight")
    throw Error("El explorador conserva la facción incorrecta");
  if(win.WOW_PWA_VERSION!=="v43")throw Error("Versionado incorrecto");
  return "navegación desde Druida Horda a Cielonato y variante correcta";
});