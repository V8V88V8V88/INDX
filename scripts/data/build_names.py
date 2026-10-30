#!/usr/bin/env python3
import json, os, re, sys, time, unicodedata, urllib.parse, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCE = os.path.join(ROOT, "scripts", "data", "sources", "wikidata-names.json")
OVERRIDES = os.path.join(ROOT, "scripts", "data", "sources", "name-overrides.json")
DISTRICTS = os.path.join(ROOT, "public", "data", "districts")
OUT = os.path.join(ROOT, "public", "data", "names")
INDIA_TS = os.path.join(ROOT, "src", "data", "india.ts")
ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "INDX-data-build/1.0 (https://github.com/V8V88V8V88/INDX)"

LANGS = ["hi", "bn", "mr", "te", "ta", "gu", "kn", "ml", "or", "pa"]

ISO = {
    "TG": ["IN-TG", "IN-TS"], "CG": ["IN-CG", "IN-CT"], "UK": ["IN-UK", "IN-UT"],
    "OR": ["IN-OD", "IN-OR"], "DD": ["IN-DH", "IN-DD", "IN-DN"],
}

ALIASES = {
    "AP": {"YSR": "Kadapa"},
    "CG": {"Bametara": "Bemetara", "Janjgir Champa": "Janjgir–Champa"},
    "JK": {"Shopiyan": "Shopian"},
    "ML": {"Ribhoi": "Ri-Bhoi"},
    "MP": {"Hoshangabad": "Narmadapuram"},
    "OR": {"Nabarangapur": "Nabarangpur"},
    "TG": {"Komaram Bheem": "Komaram Bheem Asifabad"},
    "TR": {"Unokoti": "Unakoti"},
}

DISTRICT_WORDS = [
    "district", "जिला", "ज़िला", "जनपद", "जिल्हा", "জেলা", "மாவட்டம்", "జిల్లా", "ಜಿಲ್ಲೆ",
    "ജില്ല", "જિલ્લો", "ଜିଲ୍ଲା", "ਜ਼ਿਲ੍ਹਾ", "ਜ਼ਿਲਾ", "ਜਿਲ੍ਹਾ", "ਜ਼ਿਲ੍ਹੇ",
]


def key(name):
    s = name.lower().strip().replace("&", "and")
    s = re.sub(r"[’'\".,()/–-]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


WORDS = [unicodedata.normalize("NFC", w) for w in DISTRICT_WORDS + ["ਜਿਲ਼੍ਹਾ", "ਜ਼ਿਲ਼੍ਹਾ", "ਜਿਲਾ"]]


def clean(label):
    label = unicodedata.normalize("NFC", label.strip())
    label = re.sub(r"\s*\([^)]*\)\s*$", "", label)
    label = label.split(",")[0].strip()
    for word in WORDS:
        if label.lower().endswith(" " + word):
            label = label[: -len(word) - 1].strip()
        if label.startswith(word + " "):
            label = label[len(word) + 1:].strip()
    label = "".join(str(unicodedata.decimal(c)) if c.isdecimal() else c for c in label)
    return "" if label in WORDS else label


def sparql(query):
    url = ENDPOINT + "?format=json&query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=180) as res:
                return json.load(res)["results"]["bindings"]
        except Exception as err:
            if attempt == 3:
                raise
            print(f"retrying after {err}", file=sys.stderr)
            time.sleep(5 * (attempt + 1))


def label_clauses():
    return "\n".join(
        f'OPTIONAL {{ ?item rdfs:label ?{l} FILTER(lang(?{l})="{l}") }}' for l in LANGS
    )


def rows_to_items(rows):
    items = {}
    for row in rows:
        qid = row["item"]["value"].rsplit("/", 1)[-1]
        item = items.setdefault(qid, {"en": set(), "iso": set(), "labels": {}})
        for name in ("en", "alt"):
            if name in row:
                item["en"].add(row[name]["value"])
        if "iso" in row:
            item["iso"].add(row["iso"]["value"])
        for l in LANGS:
            if l in row:
                item["labels"][l] = row[l]["value"]
    return [
        {"id": qid, "en": sorted(v["en"]), "iso": sorted(v["iso"]), "labels": v["labels"]}
        for qid, v in sorted(items.items())
    ]


def fetch_districts():
    return rows_to_items(sparql(f"""
SELECT ?item ?en ?alt ?iso {" ".join("?" + l for l in LANGS)} WHERE {{
  ?item wdt:P31/wdt:P279* wd:Q1149652 .
  ?item wdt:P131+ ?state . ?state wdt:P300 ?iso . FILTER(STRSTARTS(?iso, "IN-") && STRLEN(?iso) = 5)
  ?item rdfs:label ?en FILTER(lang(?en)="en")
  OPTIONAL {{ ?item skos:altLabel ?alt FILTER(lang(?alt)="en") }}
  {label_clauses()}
}}"""))


def fetch_places(names):
    items = []
    names = sorted(names)
    for i in range(0, len(names), 150):
        values = " ".join(json.dumps(n) + "@en" for n in names[i:i + 150])
        items += rows_to_items(sparql(f"""
SELECT ?item ?en ?iso {" ".join("?" + l for l in LANGS)} WHERE {{
  VALUES ?en {{ {values} }}
  ?item rdfs:label ?en ; wdt:P17 wd:Q668 ; wdt:P31/wdt:P279* wd:Q486972 .
  OPTIONAL {{ ?item wdt:P131+ ?state . ?state wdt:P300 ?iso . FILTER(STRSTARTS(?iso, "IN-") && STRLEN(?iso) = 5) }}
  {label_clauses()}
}}"""))
        time.sleep(1)
    return items


def our_places():
    districts, places = {}, {}
    for file in sorted(os.listdir(DISTRICTS)):
        for d in json.load(open(os.path.join(DISTRICTS, file))):
            districts.setdefault(d["stateId"], set()).add(d["name"])
            if d.get("headquarters"):
                places.setdefault(d["stateId"], set()).add(d["headquarters"])
    ts = open(INDIA_TS).read()
    for name, state in re.findall(r'name: "([^"]+)", stateId: "([A-Z]{2})"', ts):
        places.setdefault(state, set()).add(name)
    return districts, places


def fetch():
    _, places = our_places()
    names = {n for ns in places.values() for n in ns}
    data = {"districts": fetch_districts(), "places": fetch_places(names)}
    os.makedirs(os.path.dirname(SOURCE), exist_ok=True)
    with open(SOURCE, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    print(f"wrote {len(data['districts'])} districts and {len(data['places'])} places to {os.path.relpath(SOURCE, ROOT)}")


def index(items, iso_of):
    by_state = {}
    for item in items:
        for state, isos in iso_of.items():
            if not set(item["iso"]) & set(isos):
                continue
            for en in item["en"]:
                by_state.setdefault(state, {}).setdefault(key(clean(en)), []).append(item)
    return by_state


def build(check):
    data = json.load(open(SOURCE))
    overrides = json.load(open(OVERRIDES)) if os.path.exists(OVERRIDES) else {}
    districts, places = our_places()
    states = sorted(set(districts) | set(places))
    iso_of = {s: ISO.get(s, [f"IN-{s}"]) for s in states}
    district_index = index(data["districts"], iso_of)
    place_index = index(data["places"], iso_of)

    tables = {l: {} for l in LANGS}
    missing = []

    def pick(candidates):
        return min(candidates, key=lambda c: -len(c["labels"]))

    for state in states:
        for kind, names, idx, fallback in (
            ("district", districts.get(state, ()), district_index, place_index),
            ("place", places.get(state, ()), place_index, district_index),
        ):
            for name in sorted(names):
                k = key(name)
                lookup = key(ALIASES.get(state, {}).get(name, name))
                candidates = idx.get(state, {}).get(lookup) or fallback.get(state, {}).get(lookup)
                if not candidates and kind == "district":
                    missing.append(f"{state}/{name}")
                for l in LANGS:
                    override = overrides.get(l, {}).get(state, {}).get(name)
                    label = override or clean((candidates and pick(candidates)["labels"].get(l)) or "")
                    if label and k not in tables[l].setdefault(state, {}):
                        tables[l][state][k] = label

    total = sum(len(v) for v in districts.values())
    print(f"districts matched: {total - len(missing)}/{total}")
    for l in LANGS:
        named = sum(1 for s in districts for n in districts[s] if key(n) in tables[l].get(s, {}))
        print(f"  {l}: {named}/{total} district names")
    if missing:
        print("unmatched districts (English name is shown instead):\n  " + "\n  ".join(missing))

    if check:
        for l in LANGS:
            path = os.path.join(OUT, f"{l}.json")
            if not os.path.exists(path) or json.load(open(path)) != tables[l]:
                sys.exit(f"{os.path.relpath(path, ROOT)} is out of date, run bun run build:names")
        return

    os.makedirs(OUT, exist_ok=True)
    for l in LANGS:
        with open(os.path.join(OUT, f"{l}.json"), "w") as f:
            json.dump(tables[l], f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
            f.write("\n")


if __name__ == "__main__":
    if "--fetch" in sys.argv:
        fetch()
    build("--check" in sys.argv)
