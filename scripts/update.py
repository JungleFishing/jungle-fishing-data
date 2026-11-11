#!/usr/bin/env python3
"""
Jungle Fishing water tracker: daily update from ANA HidroWebService.

Logs in with ANA_IDENTIFICADOR / ANA_SENHA (GitHub secrets), pulls gauge
telemetry for each station, turns it into one level per day (metres, mean of
that day's readings), merges it into data.json and records the 24h change.

First run for a station (or a station whose gauge changed) backfills daily
data from 1 Jan of last year, replacing the SGB bulletin readings it was seeded
with. After that each run only fetches the last 30 days.

Standard library only, so the GitHub job needs no installs.
"""
import json, os, re, sys, urllib.request, urllib.parse, urllib.error
from datetime import date, datetime, timedelta, timezone
from statistics import mean

BASE = "https://www.ana.gov.br/hidrowebservice"
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data.json")
# id -> ANA telemetry gauge code. The upper Rio Negro uses the Curicuriari gauge
# (Rio Negro just below São Gabriel); São Gabriel's own gauge (14320001) has
# sent no telemetry since 2017. Santa Maria do Boiaçu (14790000) is on the lower Rio Branco.
STATIONS = {"manaus": 14990000, "barcelos": 14480002, "saogabriel": 14330000, "santamaria": 14790000}
MANAUS_TZ = timezone(timedelta(hours=-4))
DEBUG = os.environ.get("JF_DEBUG") == "1"


def http_get(path, params=None, headers=None):
    url = f"{BASE}/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    req = urllib.request.Request(url, headers={"accept": "*/*", "User-Agent": "jungle-fishing-tracker/1.0", **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, json.loads(r.read().decode("utf-8", "replace") or "{}")
    except urllib.error.HTTPError as e:
        return e.code, {"_error": e.read().decode("utf-8", "replace")[:500]}
    except Exception as e:  # timeouts, resets
        return 0, {"_error": str(e)[:300]}


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
        if all(w in k.lower() for w in words):
            return k
    return None


def to_num(v):
    try:
        return float(str(v).replace(",", "."))
    except (TypeError, ValueError):
        return None


def fetch_window(token, code, end_day):
    """{YYYY-MM-DD: [levels in cm]} for the 30 days up to end_day."""
    params = {"Código da Estação": code, "Tipo Filtro Data": "DATA_LEITURA",
              "Data de Busca (yyyy-MM-dd)": end_day.isoformat(), "Range Intervalo de busca": "DIAS_30"}
    status, body = http_get("EstacoesTelemetricas/HidroinfoanaSerieTelemetricaAdotada/v1", params,
                            {"Authorization": f"Bearer {token}"})
    items = body.get("items") if isinstance(body, dict) else None
    if not isinstance(items, list) or not items:
        if status != 200:
            print(f"    {end_day}: HTTP {status} {json.dumps(body)[:200]}")
        return {}
    kd = find_key(items[0], "data", "hora", "medicao") or find_key(items[0], "data", "hora")
    kc = find_key(items[0], "cota", "adotada") or find_key(items[0], "cota")
    ks = find_key(items[0], "cota", "status")
    days = {}
    for row in items:
        v, d = to_num(row.get(kc)), str(row.get(kd) or "")[:10]
        if v is None or len(d) != 10 or v <= 0:
            continue
        if ks and str(row.get(ks) or "0") not in ("0", "", "None"):
            continue  # flagged reading
        days.setdefault(d, []).append(v)
    return days


def clean(daily, prior=None):
    """Drop days that jump more than rivers here can move (~0.4 m/day)."""
    out, last_d, last = {}, None, None
    if prior:
        last_d, last = prior
    for d in sorted(daily):
        if last is not None:
            gap = max(1, (date.fromisoformat(d) - date.fromisoformat(last_d)).days)
            if abs(daily[d] - last) > max(1.5, 0.4 * gap):
                print(f"    skip {d}: {daily[d]} m next to {last} m on {last_d}")
                continue
        out[d] = daily[d]
        last_d, last = d, daily[d]
    return out


def discover(token, ufs, names):
    """Log river-level stations in the given states whose details match, to find gauge codes."""
    for uf in ufs:
      status, body = http_get("EstacoesTelemetricas/HidroInventarioEstacoes/v1", {"Unidade Federativa": uf},
                              {"Authorization": f"Bearer {token}"})
      print(f"  {uf}: HTTP {status}")
      for row in (body.get("items") or []) if isinstance(body, dict) else []:
        txt = json.dumps(row, ensure_ascii=False)
        if any(n in txt.upper() for n in names) and "Fluvio" in str(row.get("Tipo_Estacao")):
            keep = {k: v for k, v in row.items() if v not in (None, "") and any(w in k.lower() for w in
                    ("nome", "codigo", "telemet", "operando", "latitude", "longitude"))}
            print("   ", json.dumps(keep, ensure_ascii=False))


def main():
    with open(DATA_FILE) as f:
        data = json.load(f)
    token = login()
    today = datetime.now(MANAUS_TZ).date()
    any_new = False
    for sid, code in STATIONS.items():
        st = data["stations"].setdefault(sid, {"daily": [], "d24": None})
        backfill = st.get("gauge") != code
        print(f"{sid} ({code}){' backfill' if backfill else ''}")
        raw = {}
        if backfill:
            end = today
            while end >= date(today.year - 1, 1, 1):
                for d, v in fetch_window(token, code, end).items():
                    raw.setdefault(d, []).extend(v)
                end -= timedelta(days=30)
        else:
            raw = fetch_window(token, code, today)
        daily = {d: round(mean(v) / 100, 2) for d, v in raw.items() if v}
        if not daily:
            print("  no data this run, keeping previous values")
            continue
        if backfill:
            if len(daily) < 30:
                print(f"  only {len(daily)} days of history, keeping previous values")
                continue
            start = date(today.year - 1, 1, 1).isoformat()
            daily = clean({d: v for d, v in daily.items() if d >= start})
            st["daily"] = sorted([[d, v] for d, v in daily.items()])
            st["gauge"] = code
        else:
            prior = [x for x in st["daily"] if x[0] < min(daily)]
            daily = clean(daily, prior[-1] if prior else None)
            merged = {d: v for d, v in st["daily"]}
            merged.update(daily)
            st["daily"] = sorted([[d, v] for d, v in merged.items()])
        if len(st["daily"]) >= 2:
            (d1, v1), (d0, v0) = st["daily"][-1], st["daily"][-2]
            st["d24"] = round(v1 - v0, 2) if (date.fromisoformat(d1) - date.fromisoformat(d0)).days == 1 else None
        st["latest"] = st["daily"][-1][0]
        print(f"  {len(daily)} days, {st['daily'][0][0]} to {st['latest']}, latest {st['daily'][-1][1]} m, 24h {st['d24']}")
        any_new = any_new or bool(daily)
    req = os.path.join(os.path.dirname(__file__), "discover.txt")  # e.g. "RR,AM: BRANCO, BOIA"
    if os.path.exists(req):
        ufs, names = open(req).read().split(":", 1)
        print("station search")
        discover(token, [u.strip() for u in ufs.split(",")], [n.strip().upper() for n in names.split(",") if n.strip()])
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
