#!/usr/bin/env python3
import json, math, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "scripts", "data", "sources")
DISTRICTS_OUT = os.path.join(ROOT, "public", "data", "districts")
GEO_DIR = os.path.join(ROOT, "public", "geo", "states")
INDIA_TS = os.path.join(ROOT, "src", "data", "india.ts")

FILE_NAME = {"TG": "ts"}
EXCLUDED = {"JK": {"Mirpur", "Muzaffarabad"}}
MAX_SR_DRIFT = 0.15

def norm(s):
    return re.sub(r"[^a-z]", "", (s or "").lower().replace("&", "and"))

def _strip_templates(s):
    out, depth, i = [], 0, 0
    while i < len(s):
        if s.startswith("{{", i):
            depth += 1; i += 2; continue
        if s.startswith("}}", i) and depth:
            depth -= 1; i += 2; continue
        if depth == 0:
            out.append(s[i])
        i += 1
    return "".join(out)

def _clean(s):
    s = re.sub(r"<ref[^>]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\{\{formatnum:([^{}|]*)\}\}", r"\1", s, flags=re.I)
    s = _strip_templates(s)
    s = re.sub(r"\[\[(?:File|Image):[^\]]*\]\]", "", s)
    s = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"<[^>]+>", " ", s).replace("'''", "").replace("''", "").replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", s).strip()

def _cell(c):
    depth = 0
    for i, ch in enumerate(c):
        if c.startswith("[[", i) or c.startswith("{{", i): depth += 1
        if c.startswith("]]", i) or c.startswith("}}", i): depth -= 1
        if ch == "|" and depth == 0 and not c.startswith("||", i):
            if re.search(r"(style|rowspan|colspan|align|class|scope|width)\s*=", c[:i]):
                return c[i + 1:]
    return c

def wiki_tables(text):
    for m in re.finditer(r"^\{\|.*?^\|\}", text, flags=re.S | re.M):
        hdr, rows, cur, allhdr = [], [], [], True
        for line in m.group(0).split("\n")[1:] + ["|-"]:
            if line.startswith("|-") or line.startswith("|}"):
                if cur:
                    if not hdr and allhdr: hdr = cur
                    elif not allhdr: rows.append(cur)
                cur, allhdr = [], True
                continue
            if line.startswith("|+"): continue
            if line.startswith("!"):
                cur.extend(_clean(_cell(x)) for x in re.split(r"!!|\|\|", line[1:])); continue
            if line.startswith("|"):
                allhdr = False
                cur.extend(_clean(_cell(x)) for x in line[1:].split("||"))
            elif cur:
                cur[-1] += " " + _clean(line)
        yield hdr, rows

def _num(s):
    m = re.search(r"\d+(?:\.\d+)?", (s or "").replace(",", "").replace(" ", "").replace("|", ""))
    return float(m.group(0)) if m else None

def wiki_districts(state):
    """{name: {pop, area, hq, literacy, sexRatio}} from the biggest district table."""
    text = open(os.path.join(SRC, "wikipedia", f"districts-{state}.wikitext")).read()
    best = {}
    for hdr, rows in wiki_tables(text):
        h = [x.lower() for x in hdr]
        col = lambda pred: next((i for i, x in enumerate(h) if pred(x)), None)
        pi = col(lambda x: "population" in x)
        ni = col(lambda x: x in ("district", "name", "official name") or x.startswith("district"))
        ai = col(lambda x: x.startswith("area"))
        hi = col(lambda x: x.startswith("headquarter"))
        li = col(lambda x: x.startswith("literacy"))
        si = col(lambda x: "sex ratio" in x)
        if pi is None or ni is None: continue
        out = {}
        for r in rows:
            get = lambda i: r[i] if i is not None and i < len(r) else None
            pop = _num(get(pi))
            if pop and get(ni):
                out[get(ni)] = dict(pop=int(pop), area=_num(get(ai)), hq=get(hi),
                                    literacy=_num(get(li)), sexRatio=_num(get(si)))
        if len(out) > len(best): best = out
    return best

CONFIG = {
    "AN": {"legacy": {"Nicobars": "Nicobar"}},
    "AP": {
        "whole": {
            "Alluri Sitharama Raju": ["wiki:Alluri Sitharama Raju", "wiki:Polavaram"],
            "Anakapalli": "wiki:Anakapalli", "Anantapuramu": "wiki:Ananthapuramu",
            "Annamayya": "wiki:Annamayya", "Bapatla": "wiki:Bapatla", "Chittoor": "wiki:Chittoor",
            "Konaseema": "wiki:Dr. B. R. Ambedkar Konaseema", "East Godavari": "wiki:East Godavari",
            "Eluru": "wiki:Eluru", "Guntur": "wiki:Guntur", "Kakinada": "wiki:Kakinada",
            "Krishna": "wiki:Krishna", "Kurnool": "wiki:Kurnool", "Nandyal": "wiki:Nandyal",
            "Sri Potti Sriramulu Nellore": "wiki:Sri Potti Sriramulu Nellore", "NTR": "wiki:NTR",
            "Palnadu": "wiki:Palnadu", "Parvathipuram Manyam": "wiki:Parvathipuram Manyam",
            "Prakasam": ["wiki:Prakasam", "wiki:Markapuram"], "Srikakulam": "wiki:Srikakulam",
            "Sri Sathya Sai": "wiki:Sri Sathya Sai", "Tirupati": "wiki:Tirupati",
            "Visakhapatnam": "wiki:Visakhapatnam", "Vizianagaram": "wiki:Vizianagaram",
            "West Godavari": "wiki:West Godavari", "YSR": "wiki:YSR Kadapa",
        },
        "literacyFrom": {
            "Alluri Sitharama Raju": "Visakhapatnam", "Anakapalli": "Visakhapatnam",
            "Anantapuramu": "Anantapur", "Annamayya": "Kadapa", "Bapatla": "Guntur",
            "Chittoor": "Chittoor", "Konaseema": "East Godavari", "East Godavari": "East Godavari",
            "Eluru": "West Godavari", "Guntur": "Guntur", "Kakinada": "East Godavari",
            "Krishna": "Krishna", "Kurnool": "Kurnool", "Nandyal": "Kurnool",
            "Sri Potti Sriramulu Nellore": "Nellore", "NTR": "Krishna", "Palnadu": "Guntur",
            "Parvathipuram Manyam": "Vizianagaram", "Prakasam": "Prakasam",
            "Srikakulam": "Srikakulam", "Sri Sathya Sai": "Anantapur", "Tirupati": "Chittoor",
            "Visakhapatnam": "Visakhapatnam", "Vizianagaram": "Vizianagaram",
            "West Godavari": "West Godavari", "YSR": "Kadapa",
        },
        "tier": {"Visakhapatnam": 1.5, "NTR": 2, "Guntur": 2, "Tirupati": 3, "Kakinada": 3,
                 "Sri Potti Sriramulu Nellore": 3, "Kurnool": 3},
    },
    "AR": {
        "alias": {"Dibang Valley": "Upper Dibang Valley"},
        "legacy": {"Upper Dibang Valley": "Dibang Valley", "Pakke Kessang": "Pakke-Kessang"},
        "groups": [
            {"parents": ["Lohit"], "members": {"Lohit": None, "Namsai": 95950}},
            {"parents": ["Tirap"], "members": {"Tirap": None, "Longding": 56953}},
            {"parents": ["Kurung Kumey"], "members": {"Kurung Kumey": None, "Kra Daadi": 46123}},
            {"parents": ["East Kameng"], "members": {"East Kameng": None, "Pakke Kessang": 21577}},
            {"parents": ["West Siang", "East Siang"], "members": {
                "West Siang": 58182, "East Siang": 70956, "Siang": 31920,
                "Lower Siang": 22630, "Lepa Rada": 14490, "Shi Yomi": 13310}},
            {"parents": ["Lower Subansiri", "Upper Subansiri"], "members": {
                "Lower Subansiri": None, "Upper Subansiri": "legacy:Upper Subansiri", "Kamle": 22256}},
        ],
    },
    "AS": {
        "legacy": {"South Salmara Mankachar": "South Salmara-Mankachar"},
        "groups": [
            {"parents": ["Dhubri"], "members": {"Dhubri": None, "South Salmara Mankachar": "legacy:South Salmara-Mankachar"}},
            {"parents": ["Nagaon"], "members": {"Nagaon": None, "Hojai": "legacy:Hojai"}},
            {"parents": ["Jorhat"], "members": {"Jorhat": None, "Majuli": "legacy:Majuli"}},
            {"parents": ["Sivasagar"], "members": {"Sivasagar": None, "Charaideo": "legacy:Charaideo"}},
            {"parents": ["Sonitpur"], "members": {"Sonitpur": None, "Biswanath": "legacy:Biswanath"}},
            {"parents": ["Karbi Anglong"], "members": {"Karbi Anglong": None, "West Karbi Anglong": "legacy:West Karbi Anglong"}},
        ],
    },
    "BR": {"alias": {"Pashchim Champaran": "West Champaran", "Purba Champaran": "East Champaran",
                     "Kaimur (Bhabua)": "Kaimur"}},
    "CG": {
        "legacy": {"Bametara": "Bemetara", "Dakshin Bastar Dantewada": "Dantewada",
                   "Kabeerdham": "Kabirdham", "Uttar Bastar Kanker": "Kanker", "Janjgir Champa": "Janjgir-Champa"},
        "groups": [
            {"parents": ["Raipur"], "members": {"Raipur": None, "Gariaband": "legacy:Gariaband", "Baloda Bazar": 1305343}},
            {"parents": ["Durg"], "members": {"Durg": None, "Balod": "legacy:Balod", "Bametara": "legacy:Bemetara"}},
            {"parents": ["Bilaspur"], "members": {"Bilaspur": None, "Mungeli": "legacy:Mungeli"}},
            {"parents": ["Bastar"], "members": {"Bastar": None, "Kondagaon": "legacy:Kondagaon"}},
            {"parents": ["Dakshin Bastar Dantewada"], "members": {"Dakshin Bastar Dantewada": None, "Sukma": "legacy:Sukma"}},
            {"parents": ["Surguja"], "members": {"Surguja": None, "Surajpur": "legacy:Surajpur", "Balrampur": "legacy:Balrampur"}},
        ],
        "literacyFrom": {"Baloda Bazar": "Raipur"},
        "hq": {"Baloda Bazar": "Baloda Bazar"},
    },
    "DL": {
        "whole": {g: f"legacy:{l}" for g, l in {
            "Central": "Central Delhi", "East": "East Delhi", "New Delhi": "New Delhi",
            "North": "North Delhi", "North East": "North East Delhi", "North West": "North West Delhi",
            "Shahdara": "Shahdara", "South": "South Delhi", "South East": "South East Delhi",
            "South West": "South West Delhi", "West": "West Delhi"}.items()},
        "legacy": {"Central": "Central Delhi", "East": "East Delhi", "North": "North Delhi",
                   "North East": "North East Delhi", "North West": "North West Delhi",
                   "South": "South Delhi", "South East": "South East Delhi",
                   "South West": "South West Delhi", "West": "West Delhi"},
    },
    "GJ": {
        "alias": {"Kachchh": "Kutch", "Mahesana": "Mehsana", "Ahmadabad": "Ahmedabad",
                  "Dohad": "Dahod", "The Dangs": "Dang"},
        "legacy": {"Devbhumi Dwarka": "Devbhoomi Dwarka", "Mehsana": "Mahesana", "Panchmahal": "Panchmahal"},
        "groups": [
            {"parents": ["Bhavnagar"], "members": {"Bhavnagar": None, "Botad": "legacy:Botad"}},
            {"parents": ["Rajkot"], "members": {"Rajkot": None, "Morbi": "legacy:Morbi"}},
            {"parents": ["Jamnagar"], "members": {"Jamnagar": None, "Devbhumi Dwarka": "legacy:Devbhoomi Dwarka"}},
            {"parents": ["Junagadh"], "members": {"Junagadh": None, "Gir Somnath": "legacy:Gir Somnath"}},
            {"parents": ["Sabar Kantha"], "members": {"Sabarkantha": None, "Aravalli": "legacy:Aravalli"}},
            {"parents": ["Panch Mahals"], "members": {"Panchmahal": None, "Mahisagar": "legacy:Mahisagar"}},
            {"parents": ["Vadodara"], "members": {"Vadodara": None, "Chhota Udaipur": "legacy:Chhota Udaipur"}},
        ],
    },
    "HR": {
        "alias": {"Gurgaon": "Gurugram", "Mewat": "Nuh"},
        "groups": [{"parents": ["Bhiwani"], "members": {"Bhiwani": None, "Charkhi Dadri": "legacy:Charkhi Dadri"}}],
    },
    "HP": {"alias": {"Lahul & Spiti": "Lahaul and Spiti"}},
    "JH": {
        "alias": {"Kodarma": "Koderma", "Purbi Singhbhum": "East Singhbhum", "Pashchimi Singhbhum": "West Singhbhum"},
        "legacy": {"East Singhbhum": "Jamshedpur (East Singhbhum)", "Sahibganj": "Sahebganj",
                   "Saraikela-Kharsawan": "Seraikela Kharsawan"},
    },
    "JK": {
        "alias": {"Badgam": "Budgam", "Baramula": "Baramulla", "Bandipore": "Bandipora", "Shupiyan": "Shopiyan"},
        "legacy": {"Punch": "Poonch", "Shopiyan": "Shopian"},
    },
    "KA": {
        "alias": {"Bangalore": "Bengaluru Urban", "Bangalore Rural": "Bengaluru Rural", "Belgaum": "Belagavi",
                  "Bagalkot": "Bagalkote", "Bijapur": "Vijayapura", "Bellary": "Ballari", "Shimoga": "Shivamogga",
                  "Chikmagalur": "Chikkamagaluru", "Tumkur": "Tumakuru", "Mysore": "Mysuru",
                  "Chamarajanagar": "Chamarajanagara", "Gulbarga": "Kalaburagi"},
        "legacy": {"Bagalkote": "Bagalkot", "Chamarajanagara": "Chamarajanagar",
                   "Chikkaballapura": "Chikkaballapur", "Davanagere": "Davangere"},
        "manual": {"Bidar": {"area": 5448, "literacyRate": 70.5}},
        "hq": {"Bidar": "Bidar"},
    },
    "LA": {"alias": {"Leh (Ladakh)": "Leh"}},
    "MH": {
        "alias": {"Buldana": "Buldhana", "Gondiya": "Gondia", "Raigarh": "Raigad", "Ahmadnagar": "Ahmednagar", "Bid": "Beed"},
        "groups": [
            {"parents": ["Mumbai", "Mumbai Suburban"], "members": {"Mumbai": None}},
            {"parents": ["Thane"], "members": {"Thane": None, "Palghar": "legacy:Palghar"}},
        ],
        "legacy": {"Mumbai": ["Mumbai City", "Mumbai Suburban"]},
    },
    "ML": {
        "groups": [
            {"parents": ["Jaintia Hills"], "members": {"West Jaintia Hills": None, "East Jaintia Hills": "legacy:East Jaintia Hills"}},
            {"parents": ["West Khasi Hills"], "members": {"West Khasi Hills": None, "South West Khasi Hills": "legacy:South West Khasi Hills"}},
            {"parents": ["East Garo Hills"], "members": {"East Garo Hills": None, "North Garo Hills": "legacy:North Garo Hills"}},
            {"parents": ["West Garo Hills"], "members": {"West Garo Hills": None, "South West Garo Hills": "legacy:South West Garo Hills"}},
        ],
    },
    "MN": {
        "groups": [
            {"parents": ["Imphal East"], "members": {"Imphal East": None, "Jiribam": "legacy:Jiribam"}},
            {"parents": ["Thoubal"], "members": {"Thoubal": None, "Kakching": "legacy:Kakching"}},
            {"parents": ["Ukhrul"], "members": {"Ukhrul": None, "Kamjong": "legacy:Kamjong"}},
            {"parents": ["Tamenglong"], "members": {"Tamenglong": None, "Noney": "legacy:Noney"}},
            {"parents": ["Churachandpur"], "members": {"Churachandpur": None, "Pherzawl": "legacy:Pherzawl"}},
            {"parents": ["Chandel"], "members": {"Chandel": None, "Tengnoupal": "legacy:Tengnoupal"}},
            {"parents": ["Senapati"], "members": {"Senapati": None, "Kangpokpi": "legacy:Kangpokpi"}},
        ],
    },
    "MP": {
        "alias": {"Khargone (West Nimar)": "Khargone", "Narsimhapur": "Narsinghpur", "Khandwa (East Nimar)": "Khandwa"},
        "groups": [
            {"parents": ["Shajapur"], "members": {"Shajapur": None, "Agar Malwa": "legacy:Agar Malwa"}},
            {"parents": ["Tikamgarh"], "members": {"Tikamgarh": None, "Niwari": 404807}},
        ],
        "literacyFrom": {"Niwari": "Tikamgarh"},
        "hq": {"Niwari": "Niwari", "Sheopur": "Sheopur"},
        "manual": {"Sheopur": {"area": 6585, "literacyRate": 57.4}},
    },
    "MZ": {
        "groups": [
            {"parents": ["Lunglei"], "members": {"Lunglei": None, "Hnahthial": "legacy:Hnahthial"}},
            {"parents": ["Champhai"], "members": {"Champhai": None, "Khawzawl": "legacy:Khawzawl"}},
        ],
    },
    "OR": {
        "alias": {"Debagarh": "Deogarh", "Baleshwar": "Balasore", "Jagatsinghapur": "Jagatsinghpur",
                  "Jajapur": "Jajpur", "Anugul": "Angul", "Baudh": "Boudh"},
        "legacy": {"Balangir": "Bolangir", "Kendujhar": "Keonjhar", "Nabarangapur": "Nabarangpur",
                   "Subarnapur": "Sonepur", "Jajpur": "Jajapur"},
    },
    "PB": {
        "alias": {"Muktsar": "Sri Muktsar Sahib", "Sahibzada Ajit Singh Nagar": "S.A.S. Nagar"},
        "legacy": {"Ferozepur": "Firozpur", "S.A.S. Nagar": "Sahibzada Ajit Singh Nagar",
                   "Shahid Bhagat Singh Nagar": "Nawanshahr"},
        "groups": [
            {"parents": ["Firozpur"], "members": {"Ferozepur": None, "Fazilka": "legacy:Fazilka"}},
            {"parents": ["Gurdaspur"], "members": {"Gurdaspur": None, "Pathankot": "legacy:Pathankot"}},
        ],
        "hq": {"Faridkot": "Faridkot"},
        "manual": {"Faridkot": {"area": 1469, "literacyRate": 69.6}},
    },
    "RJ": {"alias": {"Jhunjhunun": "Jhunjhunu", "Dhaulpur": "Dholpur", "Jalor": "Jalore", "Chittaurgarh": "Chittorgarh"},
           "legacy": {"Ganganagar": "Sri Ganganagar"}},
    "SK": {"alias": {"North District": "North Sikkim", "West District": "West Sikkim",
                     "South District": "South Sikkim", "East District": "East Sikkim"}},
    "TG": {
        "whole": {
            "Adilabad": "wiki:Adilabad", "Komaram Bheem": "wiki:Kumuram Bheem Asifabad",
            "Mancherial": "wiki:Mancherial", "Nirmal": "wiki:Nirmal", "Nizamabad": "wiki:Nizamabad",
            "Jagtial": "wiki:Jagtial", "Peddapalli": "wiki:Peddapalli", "Kamareddy": "wiki:Kamareddy",
            "Rajanna Sircilla": "wiki:Rajanna Sircilla", "Karimnagar": "wiki:Karimnagar",
            "Jayashankar Bhupalapally": "wiki:Jayashankar Bhupalpally", "Sangareddy": "wiki:Sangareddy",
            "Medak": "wiki:Medak", "Siddipet": "wiki:Siddipet", "Jangaon": "wiki:Jangaon",
            "Warangal Urban": "wiki:Hanumakonda", "Warangal Rural": "wiki:Warangal", "Mulugu": "wiki:Mulugu",
            "Bhadradri Kothagudem": "wiki:Bhadradri kothagudem", "Khammam": "wiki:Khammam",
            "Mahabubabad": "wiki:Mahabubabad", "Suryapet": "wiki:Suryapet", "Nalgonda": "wiki:Nalgonda",
            "Yadadri Bhuvanagiri": "wiki:Yadadri Bhuvanagiri", "Medchal Malkajgiri": "wiki:Medchal–Malkajgiri",
            "Hyderabad": "wiki:Hyderabad", "Ranga Reddy": "wiki:Ranga Reddy", "Vikarabad": "wiki:Vikarabad",
            "Narayanpet": "wiki:Narayanpet", "Mahabubnagar": "wiki:Mahabubnagar",
            "Nagarkurnool": "wiki:Nagarkurnool", "Wanaparthy": "wiki:Wanaparthy",
            "Jogulamba Gadwal": "wiki:Jogulamba Gadwal",
        },
        "wikiStats": True,
        "tier": {"Hyderabad": 1, "Medchal Malkajgiri": 1, "Ranga Reddy": 1, "Warangal Urban": 2},
    },
    "TN": {
        "alias": {"The Nilgiris": "Nilgiris", "Kanniyakumari": "Kanyakumari"},
        "legacy": {"Kancheepuram": "Kanchipuram", "Nilgiris": "The Nilgiris", "Thiruvallur": "Tiruvallur",
                   "Thiruvarur": "Tiruvarur", "Thoothukkudi": "Thoothukudi"},
        "groups": [
            {"parents": ["Kancheepuram"], "members": {"Kancheepuram": None, "Chengalpattu": "legacy:Chengalpattu"}},
            {"parents": ["Vellore"], "members": {"Vellore": None, "Ranipet": "legacy:Ranipet", "Tirupathur": 1111812}},
            {"parents": ["Viluppuram"], "members": {"Viluppuram": None, "Kallakurichi": "legacy:Kallakurichi"}},
            {"parents": ["Tirunelveli"], "members": {"Tirunelveli": None, "Tenkasi": "legacy:Tenkasi"}},
        ],
        "literacyFrom": {"Tirupathur": "Vellore"},
        "hq": {"Tirupathur": "Tirupathur"},
    },
    "TR": {
        "legacy": {"Sipahijala": "Sepahijala", "Unokoti": "Unakoti"},
        "groups": [
            {"parents": ["West Tripura"], "members": {"West Tripura": None, "Khowai": "legacy:Khowai", "Sipahijala": "legacy:Sepahijala"}},
            {"parents": ["South Tripura"], "members": {"South Tripura": None, "Gomati": "legacy:Gomati"}},
            {"parents": ["North Tripura"], "members": {"North Tripura": None, "Unokoti": "legacy:Unakoti"}},
        ],
    },
    "UK": {"alias": {"Garhwal": "Pauri Garhwal", "Hardwar": "Haridwar"}},
    "UP": {
        "alias": {"Jyotiba Phule Nagar": "Amroha", "Mahamaya Nagar": "Hathras", "Kheri": "Lakhimpur Kheri",
                  "Allahabad": "Prayagraj", "Faizabad": "Ayodhya", "Mahrajganj": "Maharajganj",
                  "Sant Ravidas Nagar (Bhadohi)": "Bhadohi", "Kanshiram Nagar": "Kasganj"},
        "legacy": {"Rae Bareli": "Raebareli", "Shrawasti": "Shravasti", "Siddharthnagar": "Siddharth Nagar"},
        "groups": [
            {"parents": ["Moradabad", "Budaun"], "members": {
                "Moradabad": "wiki:Moradabad", "Sambhal": None, "Budaun": "wiki:Budaun"}},
            {"parents": ["Ghaziabad"], "members": {"Ghaziabad": "wiki:Ghaziabad", "Hapur": "wiki:Hapur"}},
            {"parents": ["Muzaffarnagar"], "members": {"Muzaffarnagar": "wiki:Muzaffarnagar", "Shamli": "wiki:Shamli"}},
            {"parents": ["Sultanpur", "Rae Bareli"], "members": {
                "Sultanpur": "wiki:Sultanpur", "Rae Bareli": "wiki:Rae Bareli", "Amethi": "wiki:Amethi"}},
        ],
    },
    "WB": {
        "alias": {"Darjiling": "Darjeeling", "Koch Bihar": "Cooch Behar", "Maldah": "Malda",
                  "North Twenty-Four Parganas": "North 24 Parganas", "Hugli": "Hooghly", "Puruliya": "Purulia",
                  "Haora": "Howrah", "South Twenty-Four Parganas": "South 24 Parganas"},
        "legacy": {"Purba Bardhaman": "Bardhaman"},
        "groups": [
            {"parents": ["Jalpaiguri"], "members": {"Jalpaiguri": None, "Alipurduar": "legacy:Alipurduar"}},
            {"parents": ["Darjiling"], "members": {"Darjeeling": None, "Kalimpong": "legacy:Kalimpong"}},
            {"parents": ["Paschim Medinipur"], "members": {"Paschim Medinipur": None, "Jhargram": "legacy:Jhargram"}},
            {"parents": ["Barddhaman"], "members": {"Purba Bardhaman": None, "Paschim Bardhaman": "legacy:Paschim Bardhaman"}},
        ],
    },
}

CAPITAL_DISTRICT = {
    "AP": "Guntur", "AR": "Papum Pare", "AS": "Kamrup Metropolitan", "BR": "Patna", "CG": "Raipur",
    "GA": "North Goa", "GJ": "Gandhinagar", "HP": "Shimla", "JH": "Ranchi", "KA": "Bengaluru Urban",
    "KL": "Thiruvananthapuram", "MP": "Bhopal", "MH": "Mumbai", "MN": "Imphal West",
    "ML": "East Khasi Hills", "MZ": "Aizawl", "NL": "Kohima", "OR": "Khordha", "RJ": "Jaipur",
    "SK": "East Sikkim", "TN": "Chennai", "TG": "Hyderabad", "TR": "West Tripura", "UP": "Lucknow",
    "UK": "Dehradun", "WB": "Kolkata", "AN": "South Andaman", "CH": "Chandigarh", "DD": "Daman",
    "DL": "New Delhi", "JK": "Srinagar", "LA": "Leh", "LD": "Lakshadweep", "PY": "Puducherry",
}

def ring_area(ring):
    """Approximate spherical area (km²) of a lon/lat ring."""
    R = 6371.0088
    a = 0.0
    for i in range(len(ring) - 1):
        (l1, p1), (l2, p2) = ring[i][:2], ring[i + 1][:2]
        a += math.radians(l2 - l1) * (2 + math.sin(math.radians(p1)) + math.sin(math.radians(p2)))
    return abs(a * R * R / 2)

def geom_area(g):
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    return sum(ring_area(p[0]) - sum(ring_area(h) for h in p[1:]) for p in polys)

def load_states():
    """Read id, area and population blocks from india.ts (via bun, which can import TS)."""
    import subprocess
    out = subprocess.check_output(
        ["bun", "-e", 'import {states} from "./src/data/india.ts"; console.log(JSON.stringify(states))'],
        cwd=ROOT)
    return {s["id"]: s for s in json.loads(out)}

def main(check_only=False):
    states = load_states()
    iips = json.load(open(os.path.join(SRC, "iips-district-projections-2011-2031.json")))
    gsdp = parse_gsdp()
    nat_growth = sum(r["m2026"] + r["f2026"] for r in iips) / sum(r["m2011"] + r["f2011"] for r in iips)

    problems, notes, state_out = [], [], {}
    for st, state in states.items():
        cfg = CONFIG.get(st, {})
        rows = {r["name"]: r for r in iips if r["state"] == st}
        legacy = {d["name"]: d for d in json.load(open(os.path.join(SRC, "legacy-districts", f"{FILE_NAME.get(st, st.lower())}.json")))}
        legacy_norm = {norm(k): v for k, v in legacy.items()}
        geo = json.load(open(os.path.join(GEO_DIR, f"{st}.json")))["features"]
        geo_area = {}
        for f in geo:
            name = f["properties"].get("district")
            geo_area[name] = geo_area.get(name, 0) + geom_area(f["geometry"])
        targets = [n for n in sorted(geo_area) if n not in EXCLUDED.get(st, set())]
        if st == "CH":
            targets, geo_area = ["Chandigarh"], {"Chandigarh": 1.0}
        wiki = wiki_districts(st) if os.path.exists(os.path.join(SRC, "wikipedia", f"districts-{st}.wikitext")) else {}

        def legacy_of(name):
            ref = cfg.get("legacy", {}).get(name, name)
            if isinstance(ref, list):
                return [legacy_norm[norm(r)] for r in ref if norm(r) in legacy_norm]
            d = legacy.get(ref) or legacy_norm.get(norm(ref))
            return [d] if d else []

        def weight(spec):
            if spec is None: return None
            if isinstance(spec, (int, float)): return spec
            if isinstance(spec, list): return sum(weight(s) for s in spec)
            kind, ref = spec.split(":", 1)
            if kind == "wiki":
                if ref not in wiki: problems.append(f"{st}: no Wikipedia row '{ref}'"); return 0
                return wiki[ref]["pop"]
            d = legacy.get(ref)
            if not d: problems.append(f"{st}: no legacy row '{ref}'"); return 0
            return d["population"]

        groups = []
        used = set()
        if "whole" in cfg:
            groups.append({"parents": list(rows), "members": cfg["whole"]})
        for g in cfg.get("groups", []):
            groups.append(g)
        for g in groups:
            for p in g["parents"]:
                if p not in rows: problems.append(f"{st}: unknown IIPS district '{p}'")
                used.add(p)
        alias = cfg.get("alias", {})
        target_norm = {norm(t): t for t in targets}
        for name in rows:
            if name in used: continue
            t = alias.get(name) or target_norm.get(norm(name))
            if not t: problems.append(f"{st}: IIPS district '{name}' has no map district"); continue
            groups.append({"parents": [name], "members": {t: None}})

        recs = {}
        for g in groups:
            ps = [rows[p] for p in g["parents"] if p in rows]
            m11 = sum(r["m2011"] for r in ps); f11 = sum(r["f2011"] for r in ps)
            m26 = sum(r["m2026"] for r in ps); f26 = sum(r["f2026"] for r in ps)
            w = {t: weight(s) for t, s in g["members"].items()}
            known = sum(v for v in w.values() if v is not None)
            rest = [t for t, v in w.items() if v is None]
            if len(rest) > 1: problems.append(f"{st}: group {g['parents']} has more than one remainder")
            if rest:
                w[rest[0]] = (m11 + f11) - known
                if w[rest[0]] <= 0.05 * (m11 + f11):
                    problems.append(f"{st}: remainder for {rest[0]} is {w[rest[0]]} of {m11 + f11}")
            elif abs(known - (m11 + f11)) / (m11 + f11) > 0.03:
                notes.append(f"{st}: {list(w)} 2011 weights sum to {known:,} vs census {m11 + f11:,} (normalised)")
            total_w = sum(w.values())
            single = len(w) == 1
            grp_sr11, grp_sr26 = f11 / m11, f26 / m26
            for t, wt in w.items():
                if t in recs: problems.append(f"{st}: '{t}' assigned twice")
                if t not in targets: problems.append(f"{st}: '{t}' is not a map district")
                share = wt / total_w
                pop11 = round(share * (m11 + f11))
                lg = legacy_of(t)
                if single and len(ps) == 1:
                    sr11 = f11 / m11 * 1000
                    sr26 = f26 / m26 * 1000
                    pop26 = m26 + f26
                    if abs(sr26 / sr11 - 1) > MAX_SR_DRIFT:
                        notes.append(f"{st}: {t} IIPS 2026 projection looks extrapolated (sex ratio {sr11:.0f} -> {sr26:.0f}); "
                                     f"using 2011 census x national growth {nat_growth:.3f}")
                        pop26, sr26 = round((m11 + f11) * nat_growth), sr11
                else:
                    member_sr11 = None
                    if cfg.get("wikiStats") and isinstance(g["members"][t], str) and g["members"][t].startswith("wiki:"):
                        member_sr11 = wiki[g["members"][t][5:]].get("sexRatio")
                    elif lg and len(lg) == 1 and not (g["members"][t] is None and len(w) > 1):
                        member_sr11 = lg[0].get("sexRatio")
                    sr26 = (member_sr11 or grp_sr11 * 1000) * (grp_sr26 / grp_sr11)
                    pop26 = round(share * (m26 + f26))
                recs[t] = {"pop2011": pop11, "population": pop26, "sexRatio": round(sr26)}
        missing = [t for t in targets if t not in recs]
        if missing: problems.append(f"{st}: map districts without data: {missing}")

        split_targets = {t for g in groups if len(g["members"]) > 1 or len(g["parents"]) > 1 for t in g["members"]}
        fixed = {}
        for t in recs:
            if t in split_targets: continue
            manual = cfg.get("manual", {}).get(t, {})
            lg = legacy_of(t)
            if "area" in manual: fixed[t] = manual["area"]
            elif lg: fixed[t] = sum(d["area"] for d in lg)
        pool = [t for t in recs if t not in fixed]
        residual = state["area"] - sum(fixed.values())
        raw = {}
        for t in pool:
            spec = (cfg.get("whole") or {}).get(t)
            if isinstance(spec, str) and spec.startswith("wiki:") and wiki.get(spec[5:], {}).get("area"):
                raw[t] = wiki[spec[5:]]["area"]
            elif isinstance(spec, list):
                raw[t] = sum(wiki.get(s[5:], {}).get("area") or 0 for s in spec)
            else:
                raw[t] = geo_area.get(t, 0)
        raw_total = sum(raw.values())
        for t in pool:
            recs[t]["area"] = round(residual * raw[t] / raw_total) if raw_total and residual > 0 else 0
        for t, a in fixed.items():
            recs[t]["area"] = round(a)
        if pool and residual <= 0:
            problems.append(f"{st}: area residual {residual} for {len(pool)} split districts")
        area_sum = sum(r["area"] for r in recs.values())
        if abs(area_sum - state["area"]) / state["area"] > 0.03:
            notes.append(f"{st}: census district areas add up to {area_sum:,} km² vs state {state['area']:,}; scaled to match")
            for r in recs.values():
                r["area"] = round(r["area"] * state["area"] / area_sum)

        lit_from = cfg.get("literacyFrom", {})
        out = []
        used_ids = set()
        legacy_order = {norm(n): i for i, n in enumerate(legacy)}
        for t in sorted(recs, key=lambda t: (legacy_order.get(norm((legacy_of(t) or [{"name": t}])[0]["name"]), 999), t)):
            r = recs[t]
            lg = legacy_of(t)
            manual = cfg.get("manual", {}).get(t, {})
            spec = (cfg.get("whole") or {}).get(t)
            first = spec[0] if isinstance(spec, list) else spec
            wrow = wiki.get(first[5:]) if isinstance(first, str) and first.startswith("wiki:") else None
            if cfg.get("wikiStats") and wrow and wrow.get("literacy"):
                lit = wrow["literacy"]
            elif "literacyRate" in manual:
                lit = manual["literacyRate"]
            elif t in lit_from:
                src = legacy_of(lit_from[t]) or [legacy_norm.get(norm(lit_from[t]))]
                lit = src[0]["literacyRate"] if src and src[0] else None
            elif lg:
                pops = sum(d["population"] for d in lg)
                lit = sum(d["literacyRate"] * d["population"] for d in lg) / pops
            else:
                lit = None
            if lit is None: problems.append(f"{st}: no literacy for {t}")
            hq = cfg.get("hq", {}).get(t) or (wrow or {}).get("hq") or (lg[0].get("headquarters") if lg else None) or t
            tier = cfg.get("tier", {}).get(t) or (min(d.get("tier") or 4 for d in lg) if lg else 4)
            did = lg[0]["id"] if len(lg) == 1 else None
            if did and st == "TG": did = "TG-" + did.split("-", 1)[1]
            if not did or did in used_ids:
                base = f"{st}-" + re.sub(r"[^A-Z]", "", t.upper())[:3]
                did, k = base, 2
                while did in used_ids: did, k = f"{base}{k}", k + 1
            used_ids.add(did)
            display = f"{t} Delhi" if st == "DL" and t not in ("New Delhi", "Shahdara") else t
            rec = {
                "id": did, "name": display, "stateId": st,
                "population": r["population"], "area": r["area"],
                "density": round(r["population"] / r["area"]) if r["area"] else 0,
                "literacyRate": round(lit, 1) if lit is not None else 0,
                "sexRatio": r["sexRatio"], "headquarters": re.sub(r",.*$", "", hq).strip(), "tier": tier,
            }
            if CAPITAL_DISTRICT.get(st) == t: rec["isCapital"] = True
            out.append(rec)
            if not (30 <= rec["literacyRate"] <= 100): problems.append(f"{st}: {t} literacy {rec['literacyRate']}")
            if not (300 <= rec["sexRatio"] <= 1300): problems.append(f"{st}: {t} sex ratio {rec['sexRatio']}")
            if rec["area"] <= 0: problems.append(f"{st}: {t} area {rec['area']}")

        cap = CAPITAL_DISTRICT.get(st)
        if cap and cap not in recs: problems.append(f"{st}: capital district '{cap}' not found")

        pop = sum(d["population"] for d in out)
        males = sum(d["population"] / (1 + d["sexRatio"] / 1000) for d in out)
        area_sum = sum(d["area"] for d in out)
        if abs(area_sum - state["area"]) / state["area"] > 0.03:
            problems.append(f"{st}: district areas sum to {area_sum} vs state {state['area']}")
        g = gsdp.get(st) or {}
        gdp, gdp_year = (g["y2425"] * 100, "2024-25") if g.get("y2425") else \
                        (g["y2324"] * 100, "2023-24") if g.get("y2324") else \
                        (g["y2526"] * 100, "2025-26") if g.get("y2526") else (state["gdp"], None)
        if gdp_year is None: notes.append(f"{st}: no GSDP in source, keeping {state['gdp']:,} crore")
        state_out[st] = {"population": pop, "density": round(pop / state["area"]),
                         "sexRatio": round((pop - males) / males * 1000), "gdp": round(gdp), "gdpYear": gdp_year,
                         "capitalDistrict": cap, "districts": out}
        print(f"{st}: {len(out):3} districts  pop2026 {pop:>12,}  (was {state['population']:>12,})  "
              f"area {area_sum:>7,}/{state['area']:>7,}  SR {state_out[st]['sexRatio']}  GSDP {round(gdp):>9,} ({gdp_year})")

    for n in notes: print("NOTE", n)
    for p in problems: print("PROBLEM", p)
    if problems:
        sys.exit(1)
    if check_only:
        return

    for st, s in state_out.items():
        with open(os.path.join(DISTRICTS_OUT, f"{FILE_NAME.get(st, st.lower())}.json"), "w") as fh:
            json.dump(s["districts"], fh, indent=2, ensure_ascii=False)
            fh.write("\n")
    write_india_ts(state_out)
    print("wrote", len(state_out), "district files and updated src/data/india.ts")

def parse_gsdp():
    text = open(os.path.join(SRC, "wikipedia", "state-gdp.wikitext")).read()
    hdr, rows = next(wiki_tables(text))
    names = {
        "Andhra Pradesh": "AP", "Arunachal Pradesh": "AR", "Assam": "AS", "Bihar": "BR", "Chhattisgarh": "CG",
        "Goa": "GA", "Gujarat": "GJ", "Haryana": "HR", "Himachal Pradesh": "HP", "Jharkhand": "JH",
        "Karnataka": "KA", "Kerala": "KL", "Madhya Pradesh": "MP", "Maharashtra": "MH", "Manipur": "MN",
        "Meghalaya": "ML", "Mizoram": "MZ", "Nagaland": "NL", "Odisha": "OR", "Punjab": "PB", "Rajasthan": "RJ",
        "Sikkim": "SK", "Tamil Nadu": "TN", "Telangana": "TG", "Tripura": "TR", "Uttar Pradesh": "UP",
        "Uttarakhand": "UK", "West Bengal": "WB", "Andaman and Nicobar Islands": "AN", "Chandigarh": "CH",
        "Delhi": "DL", "Jammu and Kashmir": "JK", "Ladakh": "LA", "Lakshadweep": "LD", "Puducherry": "PY",
    }
    out = {}
    for r in rows:
        if len(r) < 4 or r[1] not in names: continue
        val = lambda s: _num(s) if s and re.search(r"\d", s) else None
        out[names[r[1]]] = {"y2324": val(r[2]), "y2425": val(r[3]), "y2526": val(r[4]) if len(r) > 4 else None}
    return out

def write_india_ts(state_out):
    src = open(INDIA_TS).read()
    for st, s in state_out.items():
        m = re.search(r'\{\s*id: "%s",.*?\n    cities:' % st, src, flags=re.S)
        if not m: raise SystemExit(f"state block {st} not found in india.ts")
        block = m.group(0)
        new = re.sub(r"population: \d+,", f"population: {s['population']},", block, count=1)
        new = re.sub(r"density: \d+,", f"density: {s['density']},", new, count=1)
        new = re.sub(r"sexRatio: \d+,", f"sexRatio: {s['sexRatio']},", new, count=1)
        new = re.sub(r"gdp: \d+,", f"gdp: {s['gdp']},", new, count=1)
        new = re.sub(r'\n    gdpYear: [^\n]*', "", new)
        if s["gdpYear"]:
            new = re.sub(r"(\n    gdp: \d+,)", r"\1" + f'\n    gdpYear: "{s["gdpYear"]}",', new, count=1)
        new = re.sub(r'\n    capitalDistrict: [^\n]*', "", new)
        if s["capitalDistrict"]:
            new = re.sub(r'(\n    capital: "[^"]*",)', r'\1' + f'\n    capitalDistrict: "{s["capitalDistrict"]}",', new, count=1)
        src = src.replace(block, new)
    open(INDIA_TS, "w").write(src)

if __name__ == "__main__":
    main(check_only="--check" in sys.argv)
