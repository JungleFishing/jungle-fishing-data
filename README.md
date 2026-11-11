# Jungle Fishing · river level data

Feeds the Water Tracker on jungle-fishing.com/water-tracker.

- `data.json`: daily Rio Negro levels (metres) for Manaus, Barcelos and São Gabriel da Cachoeira.
- `scripts/update.py`: pulls the last 30 days of gauge telemetry from ANA (Agência Nacional de Águas) HidroWebService and merges it into `data.json`.
- `.github/workflows/update.yml`: runs the script every morning (~7am Manaus time) and commits the result.

Needs two repository secrets (Settings → Secrets and variables → Actions): `ANA_IDENTIFICADOR` and `ANA_SENHA`.
Run it by hand from the Actions tab → "Update river levels" → "Run workflow".

Readings before the first ANA run come from SGB (Serviço Geológico do Brasil) Amazon basin bulletins.
