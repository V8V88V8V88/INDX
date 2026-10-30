#!/usr/bin/env python3
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SOURCE = os.path.join(ROOT, "scripts", "data", "sources", "odop", "odop-product-list-v33.txt")
DISTRICTS = os.path.join(ROOT, "public", "data", "districts")
INDIA_TS = os.path.join(ROOT, "src", "data", "india.ts")
OUT = os.path.join(ROOT, "src", "data", "odop.json")

CATS = {"Primary", "Secondary", "Tertiary", "Others"}

ALIASES = {
    "AN": {"South Andamans": "South Andaman"},
    "AP": {
        "Alluri Sitarama Raju": "Alluri Sitharama Raju",
        "Ananthpuram (Anantapur)": "Anantapuramu",
        "Dr BR Ambedkar Konaseema": "Konaseema",
        "Nandyala": "Nandyal",
        "SPSR Nellore": "Sri Potti Sriramulu Nellore",
        "West Godavari District": "West Godavari",
        "YSR Kadapa": "YSR",
    },
    "AR": {"Dibang Valley": "Upper Dibang Valley"},
    "AS": {"South Salamara-Mankachar": "South Salmara Mankachar"},
    "BR": {"Purnea": "Purnia"},
    "CG": {
        "Bemetara": "Bametara",
        "Dantewada": "Dakshin Bastar Dantewada",
        "Janjagir-Champa": "Janjgir Champa",
        "Kabirdham": "Kabeerdham",
        "Kanker": "Uttar Bastar Kanker",
        "Raigarh - Bilaigarh": "Raigarh",
    },
    "DL": {
        "Central": "Central Delhi",
        "East": "East Delhi",
        "North": "North Delhi",
        "North-East": "North East Delhi",
        "North-West": "North West Delhi",
        "South": "South Delhi",
        "South-East": "South East Delhi",
        "South-West": "South West Delhi",
        "West": "West Delhi",
    },
    "GJ": {"Devbhoomi Dwarka": "Devbhumi Dwarka", "Kachchh": "Kutch"},
    "JH": {"Deogarh": "Deoghar", "Garghwa": "Garhwa", "Palamau": "Palamu"},
    "JK": {"Poonch": "Punch", "Shopian": "Shopiyan"},
    "KA": {
        "Ballary": "Ballari",
        "Kalburgi": "Kalaburagi",
        "Koppala": "Koppal",
        "Mysore": "Mysuru",
        "Raichuru": "Raichur",
        "Yadagiri": "Yadgir",
    },
    "MH": {"Mumbai City": "Mumbai", "Mumbai Suburban": "Mumbai"},
    "MP": {"Badhwani": "Barwani"},
    "MZ": {"Siaha": "Saiha"},
    "OR": {"Bolangir": "Balangir", "Khurda": "Khordha", "Nabarangpur": "Nabarangapur", "Sundergarh": "Sundargarh"},
    "RJ": {"Sri Ganganagar": "Ganganagar"},
    "TG": {
        "Jayashanker Bhupalpally": "Jayashankar Bhupalapally",
        "Karimnager": "Karimnagar",
        "Khamman": "Khammam",
        "Kumaram Bheem Asifabad": "Komaram Bheem",
        "Mahabubnager": "Mahabubnagar",
        "Mhabubabad": "Mahabubabad",
    },
    "TN": {
        "Sivagangai": "Sivaganga",
        "Tiruchi (Thiruchirappalli)": "Tiruchirappalli",
        "Tuticorin (Thoothukudi)": "Thoothukkudi",
        "Villupuram": "Viluppuram",
    },
    "TR": {"Sepahijala": "Sipahijala", "Unakoti": "Unokoti"},
    "UK": {"Nanital": "Nainital", "Pauri Garwal": "Pauri Garhwal"},
    "UP": {"Bulandshahar": "Bulandshahr", "Gautam Buddh Nagar": "Gautam Buddha Nagar", "Shravasti": "Shrawasti"},
}


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower().replace("&", "and"))


def spans(line):
    return [(m.start(), m.group()) for m in re.finditer(r"\S+(?: \S+)*", line)]

def parse(text):
    lines = text.replace("\x0c", "").split("\n")
    start = next(i for i, l in enumerate(lines) if l.strip().startswith("S. No."))
    end = next(i for i, l in enumerate(lines) if "Product Awaited For" in l)
    body = lines[start + 1:end]
    is_row = lambda l: re.match(r"^\s*\d+\s", l)
    known_states = {"Andaman & Nicobar Islands"}
    for line in body:
        if is_row(line):
            cells = spans(line)[1:-2]
            if len(cells) == 3:
                known_states.add(cells[0][1])
    rows, layout = [], None
    for i, line in enumerate(body):
        if not is_row(line):
            continue
        cells = spans(line)
        no = int(cells.pop(0)[1].split()[0]) if " " not in cells[0][1] else None
        sector = cells.pop()
        category = cells.pop()
        assert category[1] in CATS, line
        if len(cells) == 3:
            layout = [c[0] for c in cells]
            rows.append([c[1] for c in cells] + [category[1], sector[1]])
            continue
        state = next((st for st in sorted(known_states, key=len, reverse=True) if cells[0][1].startswith(st + " ")), None)
        if state and len(cells) == 2:
            rows.append([state, cells[0][1][len(state):].strip(), cells[1][1], category[1], sector[1]])
            continue
        values = [None, None, None]
        for x, text in cells:
            col = min(range(3), key=lambda k: abs(layout[k] - x))
            nxt_start = layout[col + 1] if col < 2 else None
            if nxt_start is not None and x + len(text) > nxt_start:
                cut = nxt_start - x
                head, tail = text[:cut].rstrip(), text[cut:].strip()
                if not head or not tail or text[cut - 1] != " ":
                    space = text.rfind(" ", 0, cut + 1)
                    head, tail = text[:space].rstrip(), text[space:].strip()
                values[col], values[col + 1] = head, tail
            else:
                values[col] = text
        missing = [k for k in range(3) if values[k] is None]
        extra = []
        for j in (i - 1, i + 1):
            if 0 <= j < len(body) and body[j].strip() and not is_row(body[j]):
                extra.append(body[j].strip())
        if missing:
            assert len(missing) == 1 and extra, (line, values)
            values[missing[0]] = " ".join(extra)
        rows.append(values + [category[1], sector[1]])
    return rows


def candidates(name):
    names = {name}
    for part in re.split(r"[()/]", name):
        if part.strip():
            names.add(part.strip())
    names.add(re.sub(r"\s*\([^)]*\)", "", name).strip())
    return {norm(n) for n in names if n}


def build(check):
    rows = parse(open(SOURCE).read())
    ts = open(INDIA_TS).read()
    state_ids = {norm(n): i for i, n in re.findall(r'id: "([A-Z]{2})",\s*\n\s*name: "([^"]+)"', ts)}
    ours = {}
    for f in sorted(os.listdir(DISTRICTS)):
        for d in json.load(open(os.path.join(DISTRICTS, f))):
            ours.setdefault(d["stateId"], []).append(d["name"])

    result, unmatched = {}, set()
    for state, district, product, category, sector in rows:
        sid = state_ids[norm(state)]
        alias = ALIASES.get(sid, {}).get(district)
        wanted = {norm(alias)} if alias else candidates(district)
        match = next((d for d in ours.get(sid, []) if norm(d) in wanted), None)
        if not match:
            unmatched.add(f"{sid}/{district}")
            continue
        entries = result.setdefault(sid, {}).setdefault(match, [])
        name = re.sub(r"\s+", " ", product).strip()
        if all(e["product"].lower() != name.lower() for e in entries):
            entries.append({"product": name, "category": category, "sector": sector})

    covered = sum(len(v) for v in result.values())
    total = sum(len(v) for v in ours.values())
    print(f"{len(rows)} products, {covered}/{total} of our districts have at least one")
    if unmatched:
        print(f"{len(unmatched)} ODOP districts not on our map:\n  " + "\n  ".join(sorted(unmatched)))

    output = json.dumps(result, ensure_ascii=False, indent=1, sort_keys=True) + "\n"
    if check:
        if not os.path.exists(OUT) or open(OUT).read() != output:
            sys.exit("src/data/odop.json is out of date, run bun run build:odop")
        return
    with open(OUT, "w") as f:
        f.write(output)


if __name__ == "__main__":
    build("--check" in sys.argv)
