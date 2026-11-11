#!/usr/bin/env python3
# rerun: 2026-11-11 after ANA web login
"""
Jungle Fishing water tracker: daily update from ANA HidroWebService.

Logs in with ANA_IDENTIFICADOR / ANA_SENHA (GitHub secrets), pulls the last
30 days of telemetry for each station, turns it into one level per day
(metres), merges it into data.json and records the 24h change.

Standard library only, so the GitHub job needs no installs.
"""
import json, os, sys, urllib.request, urllib.parse, urllib.error
from datetime import datetime, timedelta, timezone
from statistics import mean

BASE = "https://www.ana.gov.br/hidrowebservice"
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data.json")
STATIONS = {"manaus": 14990000, "barcelos": 14480002, "saogabriel": 14320001}
MANAUS_TZ = timezone(timedelta(hours=-4))
DEBUG = os.environ.get("JF_DEBUG") == "1"


def http_get(path, params=None, headers=None):
    url = f"{BASE}/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    req = urllib.request.Request(url, headers={"accept": "*/*", "User-Agent": "jungle-fishing-tracker/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode("utf-8", "replace") or "{}")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:500]
        return e.code, {"_error": body}


def login():
    ident, senha = os.environ.get("ANA_IDENTIFICADOR"), os.environ.get("ANA_SENHA")
    if not ident or not senha:
        sys.exit("Missing ANA_IDENTIFICADOR / ANA_SENHA secrets.")
    code, body = http_get("EstacoesTelemetricas/OAUth/v1", headers={"Identificador": ident, "Senha": senha})
    items = body.get("items") if isinstance(body, dict) else None
    token = (items or {}).get("tokenautenticacao") if isinstance(items, dict) else None
    token = token or body.get("token") or body.get("access_token")
    if not token:
        sys.exit(f"ANA login failed (HTTP {code}): {json.dumps(body)[:300]}")
    print("ANA login OK")
    return token


def find_key(row, *words):
    for k in row:
        kl = k.lower()
        if all(w in kl for w in words):
            return k
    return None


def to_num(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None


def fetch_station(token, code):
    """Return {YYYY-MM-DD: [levels in cm]} for the last 30 days."""
    auth = {"Authorization": f"Bearer {token}"}
    today = datetime.now(MANAUS_TZ).strftime("%Y-%m-%d")
    attempts = [
        ("EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1",
         {"Código da Estação": code, "Tipo Filtro Data": "DATA_LEITURA",
          "Data de Busca (yyyy-MM-dd)": today, "Range Intervalo de busca": "DIAS_30"}),
        ("EstacoesTelemetricas/HidroinfoanaSerieTelemetricaDetalhada/v1",
         {"Código da Estação": code, "Tipo Filtro Data": "DATA_LEITURA",
          "Data de Busca (yyyy-MM-dd)": today, "Range Intervalo de busca": "DIAS_30"}),
    ]
    for path, params in attempts:
        status, body = http_get(path, params, auth)
        items = body.get("items") if isinstance(body, dict) else None
        if not isinstance(items, list) or not items:
            print(f"  {path.split('/')[1]}: HTTP {status}, no items. {json.dumps(body)[:300]}")
            continue
        sample = items[0]
        if DEBUG:
            print("  sample row:", json.dumps(sample)[:600])
        kd = find_key(sample, "data", "hora") or find_key(sample, "data")
        kc = find_key(sample, "cota", "adotada") or find_key(sample, "cota")
        if not kd or not kc:
            print(f"  {path.split('/')[1]}: unexpected fields {list(sample)[:12]}")
            continue
        days = {}
        for row in items:
            v, d = to_num(row.get(kc)), str(row.get(kd) or "")[:10]
            if v is None or len(d) != 10:
                continue
            days.setdefault(d, []).append(v)
        print(f"  {path.split('/')[1]}: {len(items)} readings over {len(days)} days")
        return days
    return {}


def discover(token, names=("GABRIEL", "CURICURIARI", "BARCELOS")):
    """Log telemetric stations whose name matches, to find the right codes."""
    import re
    auth = {"Authorization": f"Bearer {token}"}
    for path, params in [
        ("EstacoesTelemetricas/HidroInventarioEstacoes/v1", {"Unidade Federativa": "AM"}),
        ("EstacoesTelemetricas/HidroInventarioEstacoes/v1", {"Código da Estação": 14320001}),
    ]:
        status, body = http_get(path, params, auth)
        items = body.get("items") if isinstance(body, dict) else None
        print(f"  inventory {params}: HTTP {status}, {len(items) if isinstance(items, list) else 0} items {'' if items else json.dumps(body)[:200]}")
        for row in items or []:
            txt = json.dumps(row, ensure_ascii=False)
            if any(n in txt.upper() for n in names):
                print("   ", txt[:400])
    try:  # legacy public list of telemetric stations (no login)
        url = "https://telemetriaws1.ana.gov.br/ServiceANA.asmx/ListaEstacoesTelemetricas?statusEstacoes=0&origem="
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "jungle-fishing-tracker/1.0"}), timeout=90) as r:
            xml = r.read().decode("utf-8", "replace")
        for block in re.findall(r"<Table>(.*?)</Table>", xml, re.S):
            if any(n in block.upper() for n in names):
                print("    legacy:", " ".join(re.sub(r"\s+", " ", block).split())[:400])
    except Exception as e:
        print("  legacy list failed:", e)


def main():
    with open(DATA_FILE) as f:
        data = json.load(f)
    token = login()
    any_new = False
    for sid, code in STATIONS.items():
        print(f"{sid} ({code})")
        st = data["stations"][sid]
        days = fetch_station(token, code)
        if not days:
            print("  no data this run, keeping previous values")
            continue
        daily = {d: round(mean(v) / 100, 2) for d, v in days.items() if v}
        # sanity check against the last stored value: telemetry glitches can be metres off
        # (rivers here move at most ~0.4 m a day, so allow that per day of gap)
        prior = [x for x in st["daily"] if x[0] < min(daily)] if daily else []
        last_d, last = (prior[-1] if prior else (None, None))
        for d in sorted(daily):
            if last is not None:
                gap = max(1, (datetime.fromisoformat(d) - datetime.fromisoformat(last_d)).days)
                if abs(daily[d] - last) > max(1.5, 0.4 * gap):
                    print(f"  skip {d}: {daily[d]} m looks wrong next to {last} m on {last_d}")
                    del daily[d]
                    continue
            last_d, last = d, daily[d]
        merged = {d: v for d, v in st["daily"]}
        merged.update(daily)
        st["daily"] = sorted([[d, v] for d, v in merged.items()])
        if len(st["daily"]) >= 2:
            (d1, v1), (d0, v0) = st["daily"][-1], st["daily"][-2]
            gap = (datetime.fromisoformat(d1) - datetime.fromisoformat(d0)).days
            st["d24"] = round(v1 - v0, 2) if gap == 1 else None
        print(f"  latest {st['daily'][-1]}  24h change {st.get('d24')}")
        any_new = any_new or bool(daily)
    if DEBUG:
        print("station search")
        discover(token)
    if any_new:
        data["updated"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
        data["source"] = "ANA HidroWebService telemetry"
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, separators=(",", ":"))
        f.write("\n")
    if not any_new:
        sys.exit("No new data from ANA for any station.")


if __name__ == "__main__":
    main()
