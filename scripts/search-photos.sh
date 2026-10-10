#!/bin/bash
# Fetch a realistic camera-roll photo set via z-ai image-search (parallel)
# NOTE: --output flag is broken in this CLI version; we capture stdout instead.
set -u
OUT=/home/z/my-project/photo-search
mkdir -p "$OUT"
rm -f "$OUT"/test.json

run_q() {
  local slug="$1"; shift
  local query="$*"
  z-ai image-search -q "$query" -c 7 --gl us --no-rank > "$OUT/$slug.raw" 2>&1
  # strip progress lines, keep JSON only
  python3 - "$OUT/$slug.raw" "$OUT/$slug.json" <<'PYEOF'
import sys, json, pathlib
raw = pathlib.Path(sys.argv[1]).read_text(errors="ignore")
start = raw.find("{")
try:
    data = json.loads(raw[start:])
    ok = bool(data.get("success")) and len(data.get("results", [])) > 0
except Exception:
    ok = False
pathlib.Path(sys.argv[2]).write_text(json.dumps(data if ok else {}, indent=1))
print(("OK  " if ok else "FAIL") + f" {sys.argv[2]} results={len(data.get('results', []) if ok else [])}")
PYEOF
  rm -f "$OUT/$slug.raw"
}
export -f run_q
export OUT

Q1="mountain lake landscape dramatic clouds reflection"
Q2="golden retriever dog running in a sunny park"
Q3="delicious pasta dish on restaurant table food photography"
Q4="city street at night with neon lights and rain"
Q5="beach sunset with ocean waves golden hour"
Q6="friends laughing together at an outdoor picnic"
Q7="cappuccino latte art on wooden table in a cafe"
Q8="waterfall in a green forest long exposure"
Q9="paris street with eiffel tower in the distance"
Q10="birthday cake with lit candles on a table"
Q11="cute cat sleeping curled up on a couch"
Q12="snow covered cabin in pine forest winter"

printf '%s\n' "landscape|$Q1" "dog|$Q2" "food|$Q3" "city|$Q4" "beach|$Q5" "friends|$Q6" \
  "coffee|$Q7" "waterfall|$Q8" "paris|$Q9" "cake|$Q10" "cat|$Q11" "winter|$Q12" \
  | xargs -P 4 -I{} bash -c 'IFS="|" read -r slug query <<< "{}"; run_q "$slug" "$query"'

echo "ALL SEARCHES COMPLETE"
ls -la "$OUT" | grep -c "\.json"
