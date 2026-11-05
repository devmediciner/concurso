import os
import json
import re
import math
import unicodedata
from datetime import datetime
import urllib.request
from bs4 import BeautifulSoup

# Reference City: Divinópolis - MG
DIVINOPOLIS = {
    "name": "Divinópolis",
    "uf": "MG",
    "lat": -20.1446,
    "lng": -44.8912
}

UF_CODES = {
    11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO",
    21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA",
    31: "MG", 32: "ES", 33: "RJ", 35: "SP",
    41: "PR", 42: "SC", 43: "RS",
    50: "MS", 51: "MT", 52: "GO", 53: "DF"
}

CAPITALS = {
    "AC": "Rio Branco", "AL": "Maceió", "AP": "Macapá", "AM": "Manaus",
    "BA": "Salvador", "CE": "Fortaleza", "DF": "Brasília", "ES": "Vitória",
    "GO": "Goiânia", "MA": "São Luís", "MT": "Cuiabá", "MS": "Campo Grande",
    "MG": "Belo Horizonte", "PA": "Belém", "PB": "João Pessoa", "PR": "Curitiba",
    "PE": "Recife", "PI": "Teresina", "RJ": "Rio de Janeiro", "RN": "Natal",
    "RS": "Porto Alegre", "RO": "Porto Velho", "RR": "Boa Vista", "SC": "Florianópolis",
    "SP": "São Paulo", "SE": "Aracaju", "TO": "Palmas"
}

KNOWN_ENTITIES = {
    "usp": ("São Paulo", "SP"),
    "unicamp": ("Campinas", "SP"),
    "unesp": ("São Paulo", "SP"),
    "hcfmrp": ("Ribeirão Preto", "SP"),
    "famesp": ("Marília", "SP"),
    "funcabes": ("Taubaté", "SP"),
    "prudenprev": ("Presidente Prudente", "SP"),
    "ipsm": ("São José dos Campos", "SP"),
    "fauscs": ("São Caetano do Sul", "SP"),
    "ufmg": ("Belo Horizonte", "MG"),
    "santa casa bh": ("Belo Horizonte", "MG"),
    "cisicom": ("Formiga", "MG"),
    "cimag": ("São Lourenço", "MG"),
    "ufba": ("Salvador", "BA"),
    "ufms": ("Campo Grande", "MS"),
    "ufrj": ("Rio de Janeiro", "RJ"),
    "uerj": ("Rio de Janeiro", "RJ"),
    "cbmerj": ("Rio de Janeiro", "RJ"),
    "igesdf": ("Brasília", "DF"),
    "hospital santa lucia": ("Brasília", "DF"),
    "hsl": ("Brasília", "DF"),
    "cnu": ("Nacional", "Nacional"),
    "marinha do brasil": ("Nacional", "Nacional"),
    "exercito brasileiro": ("Nacional", "Nacional"),
    "comando da aeronautica": ("Nacional", "Nacional"),
    "ebserh": ("Nacional", "Nacional"),
    "policia federal": ("Nacional", "Nacional"),
    "inb": ("Resende", "RJ"),
    "transpetro": ("Rio de Janeiro", "RJ"),
    "correios": ("Brasília", "DF"),
    "dataprev": ("Brasília", "DF"),
    "agsus": ("Brasília", "DF"),
    "esfcex": ("Salvador", "BA")
}

def normalize(text):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text).encode("ASCII", "ignore").decode("utf-8")
    return text.lower().strip()

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class VacancyScraper:
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        self.municipios_file = os.path.join(data_dir, "municipios.json")
        self.cache_file = os.path.join(data_dir, "vagas.json")
        self.cities = []
        self.cities_by_uf = {}
        self.city_lookup = {}
        self._load_cities()

    def _load_cities(self):
        if not os.path.exists(self.municipios_file):
            print("Downloading municipios.json...")
            os.makedirs(self.data_dir, exist_ok=True)
            url = "https://raw.githubusercontent.com/kelvins/municipios-brasileiros/main/json/municipios.json"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8-sig")
                self.cities = json.loads(raw)
            with open(self.municipios_file, "w", encoding="utf-8") as f:
                json.dump(self.cities, f, ensure_ascii=False)
        else:
            with open(self.municipios_file, "r", encoding="utf-8") as f:
                self.cities = json.load(f)

        for c in self.cities:
            uf = UF_CODES.get(c.get("codigo_uf"), "")
            c["uf"] = uf
            if uf not in self.cities_by_uf:
                self.cities_by_uf[uf] = []
            self.cities_by_uf[uf].append(c)
            norm = normalize(c["nome"])
            self.city_lookup[(norm, uf)] = c

        # Sort candidate cities by descending name length to match longer names first
        for uf in self.cities_by_uf:
            self.cities_by_uf[uf].sort(key=lambda x: len(x["nome"]), reverse=True)

    def extract_city(self, card_title, title_text, slug, uf):
        # 1. Check known entities
        norm_title = normalize(title_text)
        norm_card = normalize(card_title)
        norm_slug = normalize(slug)

        for key, (k_city, k_uf) in KNOWN_ENTITIES.items():
            if key in norm_title or key in norm_card or key in norm_slug:
                if k_uf == "Nacional":
                    return "Âmbito Nacional", "Nacional", None, None
                # Lookup coords
                match = self.city_lookup.get((normalize(k_city), k_uf))
                if match:
                    return match["nome"], k_uf, match["latitude"], match["longitude"]
                return k_city, k_uf, None, None

        # 2. Check "Prefeitura (Municipal)? (da Estância.*?)? de ([Cidade])"
        patterns = [
            r'Prefeitura (?:Municipal )?(?:da Estância [^ ]+ )?(?:de |da |do |dos |das )?([A-Za-zÀ-ÖØ-öø-ÿ\s\']+?)(?=\s*-\s*[A-Z]{2}|\s+abre|\s+publica|\s+divulga|\s+anuncia|\s+retifica|$)',
            r'Câmara (?:Municipal )?(?:de |da |do |dos |das )?([A-Za-zÀ-ÖØ-öø-ÿ\s\']+?)(?=\s*-\s*[A-Z]{2}|\s+abre|\s+publica|\s+divulga|\s+anuncia|\s+retifica|$)',
            r'Hospital Municipal (?:de |da |do |dos |das )?([A-Za-zÀ-ÖØ-öø-ÿ\s\']+?)(?=\s*-\s*[A-Z]{2}|\s+abre|\s+publica|\s+divulga|\s+anuncia|\s+retifica|$)',
            r'Prefeitura de ([A-Za-zÀ-ÖØ-öø-ÿ\s\']+)'
        ]
        
        for pat in patterns:
            match = re.search(pat, card_title, re.I) or re.search(pat, title_text, re.I)
            if match:
                cand = match.group(1).strip()
                cand_norm = normalize(cand)
                # Check with current UF
                if uf and (cand_norm, uf) in self.city_lookup:
                    c = self.city_lookup[(cand_norm, uf)]
                    return c["nome"], uf, c["latitude"], c["longitude"]
                # Try finding in any UF if cand has high specificity
                for u in UF_CODES.values():
                    if (cand_norm, u) in self.city_lookup:
                        c = self.city_lookup[(cand_norm, u)]
                        return c["nome"], u, c["latitude"], c["longitude"]

        # 3. Match against city list of that UF
        combined = f"{title_text} | {card_title} | {slug.replace('-', ' ')}"
        combined_norm = normalize(combined)

        if uf and uf in self.cities_by_uf:
            for cand in self.cities_by_uf[uf]:
                cand_norm = normalize(cand["nome"])
                if len(cand_norm) < 4:
                    if re.search(r'\b' + re.escape(cand_norm) + r'\b', combined_norm):
                        return cand["nome"], uf, cand["latitude"], cand["longitude"]
                else:
                    if cand_norm in combined_norm:
                        return cand["nome"], uf, cand["latitude"], cand["longitude"]

        # 4. Check if UF is DF
        if uf == "DF":
            c = self.city_lookup.get(("brasilia", "DF"))
            if c:
                return "Brasília", "DF", c["latitude"], c["longitude"]
            return "Brasília", "DF", -15.7975, -47.8919

        # 5. Check if any city in all Brazil is explicitly mentioned
        for u, cap in CAPITALS.items():
            if normalize(cap) in combined_norm:
                c = self.city_lookup.get((normalize(cap), u))
                if c:
                    return c["nome"], u, c["latitude"], c["longitude"]

        # Fallback
        if uf:
            return f"Órgão Estadual ({uf})", uf, None, None
        return "Âmbito Nacional", "Nacional", None, None

    def scrape(self, force_refresh=False):
        if not force_refresh and os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                    # Check age of cache (e.g. valid for 1 hour)
                    cache_time = datetime.fromisoformat(cached_data.get("updated_at", "2000-01-01T00:00:00"))
                    age_seconds = (datetime.now() - cache_time).total_seconds()
                    if age_seconds < 3600:
                        print(f"Returning cached vacancies ({len(cached_data.get('vagas', []))} items, age: {int(age_seconds/60)} min)")
                        return cached_data
            except Exception as e:
                print("Cache read error, scraping fresh:", e)

        print("Fetching data from PCI Concursos (https://www.pciconcursos.com.br/vagas/medico)...")
        url = "https://www.pciconcursos.com.br/vagas/medico"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
            }
        )

        with urllib.request.urlopen(req, timeout=15) as resp:
            text = resp.read().decode("utf-8", errors="replace")

        soup = BeautifulSoup(text, "html.parser")
        cards = soup.find_all("div", class_=["na", "ea"])

        vagas = []
        now = datetime.now()

        for card in cards:
            is_open = "na" in card.get("class", [])
            title_a = card.find("a")
            if not title_a:
                continue

            title_text = title_a.get_text(strip=True)
            card_title = title_a.get("title", "")
            link = title_a.get("href", "")
            slug = link.split("/")[-1] if "/" in link else ""

            # State badge
            cc = card.find("div", class_="cc")
            uf = cc.get_text(strip=True).upper() if cc else ""

            # Check UF in card_title or slug if empty
            if not uf:
                uf_match = re.search(r'[\s\-](' + '|'.join(UF_CODES.values()) + r')[\s\-]', f" {card_title} {slug} ")
                if uf_match:
                    uf = uf_match.group(1)

            # Info block
            cd = card.find("div", class_="cd")
            cd_text = cd.get_text(" | ", strip=True) if cd else ""

            # Date block
            ce = card.find("div", class_="ce")
            ce_text = ce.get_text(" ", strip=True) if ce else ""

            # Salary extraction
            salary_raw = None
            salary_val = 0.0
            sal_match = re.search(r'R\$\s*([\d\.]+(?:,\d{2})?)', cd_text)
            if sal_match:
                salary_raw = sal_match.group(0)
                num_str = sal_match.group(1).replace(".", "").replace(",", ".")
                try:
                    salary_val = float(num_str)
                except ValueError:
                    pass

            # Deadline extraction
            dates = re.findall(r'(\d{2})/(\d{2})/(\d{4})', ce_text)
            deadline_str = None
            deadline_iso = None
            days_remaining = None
            is_expired = not is_open

            if dates:
                d, m, y = dates[-1]
                deadline_str = f"{d}/{m}/{y}"
                deadline_iso = f"{y}-{m}-{d}"
                try:
                    d_dt = datetime.strptime(f"{y}-{m}-{d} 23:59:59", "%Y-%m-%d %H:%M:%S")
                    diff = (d_dt - now).total_seconds()
                    days_remaining = math.ceil(diff / 86400)
                    if diff < 0:
                        is_expired = True
                except Exception:
                    pass

            # Vacancies count
            vacancies_raw = "CR"
            v_match = re.search(r'(\d+)\s*vagas?', cd_text, re.I)
            if v_match:
                vacancies_raw = f"{v_match.group(1)} vagas"
            elif "cadastro de reserva" in cd_text.lower() or "cr" in cd_text.lower():
                vacancies_raw = "Cadastro de Reserva"

            # Detect City & UF
            city, uf_detected, lat, lng = self.extract_city(card_title, title_text, slug, uf)
            final_uf = uf_detected if uf_detected else (uf if uf else "Nacional")

            # Distance to Divinópolis
            dist_km = None
            dist_road_km = None
            distance_category = "Sem localização exata"

            if lat is not None and lng is not None:
                dist_km = round(haversine(DIVINOPOLIS["lat"], DIVINOPOLIS["lng"], lat, lng), 1)
                dist_road_km = round(dist_km * 1.25, 1) # Estimated road distance
                if dist_km <= 70:
                    distance_category = "Vizinho (< 70 km)"
                elif dist_km <= 150:
                    distance_category = "Próximo (70 - 150 km)"
                elif dist_km <= 300:
                    distance_category = "Médio (150 - 300 km)"
                elif dist_km <= 600:
                    distance_category = "Distante (300 - 600 km)"
                else:
                    distance_category = "Muito Distante (> 600 km)"
            elif final_uf == "Nacional":
                distance_category = "Âmbito Nacional"

            # Google Maps Directions URL
            maps_query = f"{city}, {final_uf}, Brasil" if city and final_uf != "Nacional" else ""
            maps_url = f"https://www.google.com/maps/dir/Divinopolis+-+MG/{urllib.parse.quote_plus(maps_query)}" if maps_query else None

            # Clean cargo and escolaridade
            cargo_parts = [p.strip() for p in cd_text.split("|") if p.strip()]
            
            # Status label
            if is_expired:
                status_label = "Encerrado"
            elif days_remaining is not None and days_remaining <= 2:
                status_label = "Últimos Dias"
            else:
                status_label = "Inscrições Abertas"

            vagas.append({
                "id": len(vagas) + 1,
                "title": title_text,
                "headline": card_title,
                "link": link,
                "city": city,
                "uf": final_uf,
                "status": status_label,
                "is_open": not is_expired,
                "salary_str": salary_raw if salary_raw else "Consulte o edital",
                "salary_val": salary_val,
                "deadline_str": deadline_str if deadline_str else (ce_text if ce_text else "Consulte o edital"),
                "deadline_iso": deadline_iso,
                "days_remaining": days_remaining,
                "vacancies": vacancies_raw,
                "details": cd_text,
                "cargo_parts": cargo_parts,
                "dist_km": dist_km,
                "dist_road_km": dist_road_km,
                "distance_category": distance_category,
                "lat": lat,
                "lng": lng,
                "maps_url": maps_url
            })

        # Calculate statistics
        total = len(vagas)
        total_open = len([v for v in vagas if v["is_open"]])
        total_mg = len([v for v in vagas if v["uf"] == "MG"])
        open_with_dist = [v for v in vagas if v["is_open"] and v["dist_km"] is not None]
        closest = min(open_with_dist, key=lambda x: x["dist_km"]) if open_with_dist else None
        
        highest_salary = max([v for v in vagas if v["salary_val"] > 0], key=lambda x: x["salary_val"], default=None)

        # Unique states with counts
        state_counts = {}
        for v in vagas:
            state_counts[v["uf"]] = state_counts.get(v["uf"], 0) + 1

        result = {
            "updated_at": datetime.now().isoformat(),
            "origin": DIVINOPOLIS,
            "stats": {
                "total": total,
                "total_open": total_open,
                "total_mg": total_mg,
                "closest": {
                    "title": closest["title"] if closest else "N/A",
                    "city": closest["city"] if closest else "N/A",
                    "uf": closest["uf"] if closest else "N/A",
                    "dist_km": closest["dist_km"] if closest else 0,
                    "dist_road_km": closest["dist_road_km"] if closest else 0,
                    "salary_str": closest["salary_str"] if closest else ""
                } if closest else None,
                "highest_salary": {
                    "title": highest_salary["title"] if highest_salary else "N/A",
                    "city": highest_salary["city"] if highest_salary else "N/A",
                    "salary_str": highest_salary["salary_str"] if highest_salary else ""
                } if highest_salary else None,
                "state_counts": state_counts
            },
            "vagas": vagas
        }

        # Save to cache
        os.makedirs(self.data_dir, exist_ok=True)
        with open(self.cache_file, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"Scraped and saved {len(vagas)} vacancies to {self.cache_file}.")
        return result

if __name__ == "__main__":
    scraper = VacancyScraper()
    res = scraper.scrape(force_refresh=True)
    print("Done! Total:", res["stats"]["total"], "Open:", res["stats"]["total_open"], "MG:", res["stats"]["total_mg"])
    if res["stats"]["closest"]:
        print("Closest:", res["stats"]["closest"])
    if res["stats"]["highest_salary"]:
        print("Highest Salary:", res["stats"]["highest_salary"])

