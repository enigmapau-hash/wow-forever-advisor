#!/usr/bin/env python3
"""Compara talentos y Legado de Zephras sin modificar recomendaciones de la PWA."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys
from urllib.request import Request, urlopen

INDEX_URL = "https://zephras.com/data/forever/enUS/talents/index.json"
BASE_URL = "https://zephras.com/data/forever/enUS/talents/"
VERSION_RE = re.compile(r"\d+\.\d+\.\d+\.\d+")
LABELS = {
    "ranks": "textos y rangos", "maxRank": "rango máximo",
    "pointsInTreeRequired": "puntos requeridos", "tree": "rama",
    "row": "fila", "column": "columna", "spellId": "hechizo",
    "arrows": "dependencias", "earnedBy": "desafíos de Legado",
    "seasonalCap": "límite estacional",
}


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha(value):
    return hashlib.sha256(canonical(value).encode("utf-8")).hexdigest()


def read_url(url):
    request = Request(url, headers={"User-Agent": "WoWForeverAdvisor-PatchTracker/1.0",
                                    "Accept": "application/json"})
    with urlopen(request, timeout=25) as response:
        body = response.read(3_000_001)
    if len(body) > 3_000_000:
        raise ValueError("Respuesta superior a 3 MB.")
    return json.loads(body.decode("utf-8"))


def latest(fetch=read_url):
    index = fetch(INDEX_URL)
    if index.get("format") != "zephras-talents-index/1":
        raise ValueError("Formato de índice desconocido.")
    build = index.get("latest")
    if not isinstance(build, str) or not VERSION_RE.fullmatch(build):
        raise ValueError("Número de compilación inválido.")
    url = BASE_URL + build + ".json"
    if not any(e.get("build") == build and e.get("url") == url
               for e in index.get("files", [])):
        raise ValueError("La URL de la última compilación no está en el índice.")
    data = fetch(url)
    if data.get("format") != "zephras-talents/1" or data.get("build") != build:
        raise ValueError("Compilación o formato no coincidentes.")
    return data, url


def snapshot(data):
    if data.get("format") != "zephras-talents/1":
        raise ValueError("Formato de talentos no reconocido.")
    if not isinstance(data.get("build"), str) or not VERSION_RE.fullmatch(data["build"]):
        raise ValueError("Compilación de talentos inválida.")
    if not isinstance(data.get("classes"), list) or len(data["classes"]) < 9:
        raise ValueError("Faltan clases.")
    legacy = data.get("legacy")
    if (not isinstance(legacy, dict) or not isinstance(legacy.get("trees"), list)
            or len(legacy["trees"]) < 3):
        raise ValueError("Faltan árboles de Legado.")
    if not isinstance(legacy.get("earnedBy"), list):
        raise ValueError("Faltan desafíos de Legado.")
    records = {}

    def add(key, label, area, fields):
        if key in records:
            raise ValueError("ID duplicado: " + key)
        if not isinstance(fields, dict):
            raise ValueError("Registro inválido.")
        records[key] = {"label": label, "area": area,
                        "fields": {k: sha(v) for k, v in sorted(fields.items())}}

    def sorted_list(items):
        return sorted(items, key=canonical)

    for cls in data["classes"]:
        token = cls.get("token")
        if not isinstance(token, str) or not re.fullmatch(r"[a-z]+", token):
            raise ValueError("Clase sin identificador.")
        if (not isinstance(cls.get("talents"), list) or not cls["talents"]
                or not isinstance(cls.get("arrows"), list)):
            raise ValueError("Clase sin talentos o dependencias.")
        add("class/" + token, cls.get("name", token), "clases",
            {k: sorted_list(v) if k == "trees" else v
             for k, v in cls.items() if k not in ("talents", "arrows")})
        for talent in cls["talents"]:
            ident = talent.get("id")
            if not isinstance(ident, int):
                raise ValueError("Talento sin ID.")
            add(f"talent/{token}/{ident}",
                f"{cls.get('name', token)} · {talent.get('name', ident)}",
                "talentos", {k: v for k, v in talent.items() if k != "id"})
        add("arrows/" + token, f"{cls.get('name', token)} · dependencias",
            "talentos", {"arrows": sorted_list(cls["arrows"])})
    add("legacy/general", "Legado · reglas generales", "legado",
        {k: v for k, v in legacy.items() if k not in ("trees", "earnedBy")})
    for tree in legacy["trees"]:
        tree_id = tree.get("id")
        if (not isinstance(tree_id, int) or not isinstance(tree.get("perks"), list)
                or not tree["perks"]):
            raise ValueError("Árbol de Legado sin ID o ventajas.")
        name = tree.get("name", str(tree_id))
        add(f"legacy/tree/{tree_id}", "Legado · " + name, "legado",
            {k: v for k, v in tree.items() if k not in ("perks", "arrows")})
        for perk in tree["perks"]:
            ident = perk.get("id")
            if not isinstance(ident, int):
                raise ValueError("Ventaja de Legado sin ID.")
            add(f"legacy/perk/{tree_id}/{ident}",
                f"Legado · {name} · {perk.get('name', ident)}",
                "legado", {k: v for k, v in perk.items() if k != "id"})
        add(f"legacy/arrows/{tree_id}", f"Legado · {name} · dependencias",
            "legado", {"arrows": sorted_list(tree.get("arrows", []))})
    add("legacy/earnedBy", "Legado · desafíos para conseguir puntos", "legado",
        {"earnedBy": sorted_list(legacy["earnedBy"])})
    for key in ("pointsByLevel", "talentedPerk"):
        if not isinstance(data.get(key), list):
            raise ValueError("Faltan los puntos por nivel o Con talento.")
        add("progress/" + key, key, "progresión de puntos",
            {key: sorted_list(data[key])})
    return {"schemaVersion": 1, "build": data["build"], "records": records}


def compare(old, new):
    if old is None:
        return "baseline", [], None
    if old.get("schemaVersion") != 1 or not isinstance(old.get("records"), dict):
        raise ValueError("Estado previo corrupto: no se sobrescribe.")
    changes = []
    a_records, b_records = old["records"], new["records"]
    for key in sorted(set(a_records) | set(b_records)):
        a, b = a_records.get(key), b_records.get(key)
        if a == b:
            continue
        a_fields, b_fields = a["fields"] if a else {}, b["fields"] if b else {}
        fields = sorted(k for k in set(a_fields) | set(b_fields)
                        if a_fields.get(k) != b_fields.get(k))
        changes.append({
            "key": key, "label": (b or a)["label"], "area": (b or a)["area"],
            "kind": "añadido" if not a else "eliminado" if not b else "modificado",
            "fields": fields,
        })
    status = ("changed" if changes else
              "version_only" if old["build"] != new["build"] else "unchanged")
    return status, changes, old["build"]


def make_report(old, new, status, changes, previous_version, url):
    old_build = previous_version or "(primera lectura)"
    build = new["build"]
    signature = sha({"old": old, "new": new})[:20]
    title = (f"[Patch Tracker] {old_build} → {build}: cambios en talentos/Legado"
             if old_build != build else
             f"[Patch Tracker] Cambios de datos en {build}")
    lines = [
        f"<!-- wow-forever-patch-tracker:{signature} -->",
        "# WoW Forever — Cambios detectados",
        "",
        f"**Versión anterior:** {old_build} · **Versión nueva:** {build}",
        "",
        "> Informe automático: no constituye una recomendación validada. "
        "No modificar datos de la PWA sin revisión editorial.",
        "",
        f"- [Archivo analizado]({url})",
        f"- [Índice Zephras]({INDEX_URL})",
        "- [Noticias Blizzard](https://worldofwarcraft.blizzard.com/es-es/news)",
    ]
    if changes:
        totals = Counter(change["area"] for change in changes)
        lines += ["", "**Registros afectados:** " +
                  ", ".join(f"{key}: {value}" for key, value in sorted(totals.items())),
                  "", "## Revisión recomendada"]
        for token, nombre in (("warrior", "Guerrero"), ("paladin", "Paladín")):
            if any(c["key"].startswith((f"talent/{token}/", f"class/{token}",
                                         f"arrows/{token}")) for c in changes):
                lines.append(f"- Revisar las **nueve fichas piloto del {nombre}**: "
                             "el efecto sobre cada objetivo aún debe valorarse.")
        if any(c["area"] == "legado" for c in changes):
            lines.append("- Revisar los **tres perfiles de Legado** y sus requisitos.")
        if any(c["area"] == "progresión de puntos" for c in changes):
            lines.append("- Revisar las guías para **Subir al 60**.")
        lines += ["", "## Detalle de registros"]
        for item in changes[:100]:
            fields = ", ".join(LABELS.get(f, f) for f in item["fields"])
            lines.append("- **" + item["kind"].capitalize() + "** · " + item["label"] +
                         " (" + item["key"] + ")" + (" — " + fields if fields else ""))
        if len(changes) > 100:
            lines.append(f"- … y {len(changes) - 100} registros adicionales.")
    else:
        lines += ["", "No hay diferencias en los campos vigilados. "
                  "Podría haber cambios fuera de este conjunto."]
    lines += [
        "", "## Alcance y atribución",
        "Se vigilan árboles, rangos, requisitos, dependencias y textos de talentos; "
        "árboles, ventajas, desafíos y puntos de Legado. Aún NO se vigilan todos "
        "los hechizos, profesiones, equipo, PvP ni correcciones del servidor.",
        "Datos organizados por [Zephras](https://zephras.com), CC BY 4.0. "
        "Nombres y textos del juego pertenecen a Blizzard Entertainment. "
        "El estado almacena huellas, no copias de los textos.",
        "",
        "**Acción manual:** verificar las notas oficiales, revisar las fichas "
        "afectadas y publicar cambios solo tras aprobación.",
    ]
    return {
        "status": status, "title": title,
        "marker": "wow-forever-patch-tracker:" + signature,
        "changes": len(changes), "previousBuild": previous_version,
        "newBuild": build, "report": "\n".join(lines) + "\n",
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--previous", required=True, type=Path)
    parser.add_argument("--next", dest="next_state", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--summary", required=True, type=Path)
    args = parser.parse_args(argv)
    old = json.loads(args.previous.read_text(encoding="utf-8")) if args.previous.exists() else None
    data, url = latest()
    new = snapshot(data)
    status, changes, prev = compare(old, new)
    report = make_report(old, new, status, changes, prev, url)
    for path in (args.next_state, args.report, args.summary):
        path.parent.mkdir(parents=True, exist_ok=True)
    args.next_state.write_text(json.dumps(new, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
                               encoding="utf-8")
    args.report.write_text(report["report"], encoding="utf-8")
    args.summary.write_text(json.dumps({k: v for k, v in report.items() if k != "report"},
                                       ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{status}: {prev} -> {new['build']}; {len(changes)} cambios")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print("Patch Tracker ERROR:", exc, file=sys.stderr)
        sys.exit(1)
