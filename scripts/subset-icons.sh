#!/bin/bash
# Download Material Symbols Rounded variable font and subset it to the icons we use.
set -e
FDIR=/home/z/my-project/public/fonts
mkdir -p "$FDIR" /tmp/msr
cd /tmp/msr

UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
CSS_URL="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
curl -s -A "$UA" "$CSS_URL" -o msr.css
echo "--- css blocks: $(grep -c '@font-face' msr.css)"

# grab every woff2 url with its unicode-range; keep the one covering basic latin (U+0000-00FF)
python3 - <<'PYEOF'
import re, pathlib
css = pathlib.Path("msr.css").read_text()
blocks = re.findall(r"@font-face\s*{[^}]+}", css)
best = None
for b in blocks:
    url = re.search(r"url\((https://[^)]+\.woff2)\)", b)
    ur = re.search(r"unicode-range:\s*([^;]+);", b)
    if not url:
        continue
    rng = ur.group(1) if ur else ""
    # basic latin range contains ligature source text (U+006D 'm' etc.)
    if "U+0000-00FF" in rng:
        best = url.group(1)
        break
if best is None:  # fallback: last block is usually latin
    urls = re.findall(r"url\((https://[^)]+\.woff2)\)", css)
    best = urls[-1]
pathlib.Path("font_url.txt").write_text(best)
print("font url:", best)
PYEOF

curl -s -A "$UA" "$(cat font_url.txt)" -o msr-full.woff2
ls -la msr-full.woff2

# unique icon names we need
cat > icons.txt <<'EOF'
menu search close arrow_back arrow_upward keyboard_arrow_up keyboard_arrow_down
chevron_left chevron_right expand_more more_vert check done done_all
add settings help info photo_library explore group construction photo_album
favorite delete archive restore_from_trash delete_forever share edit tune crop
download print cast zoom_in zoom_out rotate_right auto_awesome auto_fix_high
star star_rate bookmark place schedule person account_circle photo_camera
image movie pets restaurant local_cafe beach_access forest light_mode dark_mode
cloud_upload photo collections select_all folder_open fullscreen refresh
photo_filter wb_sunny apps account_box send arrow_forward tag maps
EOF
TEXT=$(tr -d ' \n' < icons.txt)
echo "subset text: $TEXT"

pip install -q fonttools brotli 2>&1 | tail -1
pyftsubset msr-full.woff2 \
  --text="$TEXT" \
  --layout-features='*' \
  --flavor=woff2 \
  --output-file="$FDIR/material-symbols.woff2" \
  --no-hinting --desubroutinize
ls -la "$FDIR/material-symbols.woff2"
echo "SUBSET OK"
