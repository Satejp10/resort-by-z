#!/usr/bin/env python3
"""Download searched photos, normalize them, and generate photos.ts metadata
that mimics a realistic Google-Photos-style camera roll."""
import json, pathlib, random, urllib.request, io, sys

random.seed(42)
ROOT = pathlib.Path("/home/z/my-project")
SEARCH = ROOT / "photo-search"
PHOTOS = ROOT / "public" / "photos"
THUMBS = PHOTOS / "thumbs"
PHOTOS.mkdir(parents=True, exist_ok=True)
THUMBS.mkdir(parents=True, exist_ok=True)

try:
    from PIL import Image
except ImportError:
    sys.exit("PIL missing — pip install pillow")

MAX_FULL = 1400
MAX_THUMB = 540

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

# ---------------- category config ----------------
CATS = {
    "landscape": dict(tags=["landscape", "nature", "mountains", "lake", "outdoors"],
        locs=["Banff, AB, Canada", "Zermatt, Switzerland", "Queenstown, New Zealand"],
        descs=["Lake reflection at dawn", "Alpine panorama", "Clouds rolling over the ridge",
               "Still water, perfect mirror", "Golden hour on the peaks", "View from the trail"]),
    "beach": dict(tags=["beach", "ocean", "sunset", "vacation", "summer"],
        locs=["Maui, HI", "Amalfi Coast, Italy", "Lisbon, Portugal"],
        descs=["Golden hour swim", "Waves at sunset", "Salt air and sunshine",
               "Beach walk, no plans", "Warm sand, cold drink", "Last light over the water"]),
    "dog": dict(tags=["dog", "pets", "Milo", "park", "animals"],
        locs=["Golden Gate Park, San Francisco", "Dolores Park, San Francisco", "Fort Funston, San Francisco"],
        descs=["Milo mid-zoomies", "Best boy at the park", "Fetch #47 of the day",
               "Milo making friends", "Post-swim shake", "Sunbathing pup"]),
    "cat": dict(tags=["cat", "pets", "Luna", "animals", "home"],
        locs=["Home, San Francisco"],
        descs=["Luna found the sunbeam", "Professional napper", "Luna vs. the blanket",
               "Judging you silently", "Cozy circles", "Catnap, 3rd of the day"]),
    "food": dict(tags=["food", "pasta", "restaurant", "dinner"],
        locs=["Flour + Water, San Francisco", "Osteria, New York", "Tartine, San Francisco"],
        descs=["Handmade tagliatelle", "Dinner worth the wait", "Pasta perfection",
               "Saturday dinner", "New favorite spot", "Carbonara night"]),
    "coffee": dict(tags=["coffee", "cafe", "drinks", "latte"],
        locs=["Blue Bottle Coffee, San Francisco", "Ritual Coffee, San Francisco", "Sightglass Coffee, San Francisco"],
        descs=["Morning ritual", "Latte art on point", "Slow Sunday coffee",
               "First coffee of the day", "Corner cafe stop", "Double shot, no rush"]),
    "city": dict(tags=["city", "night", "street", "neon", "urban"],
        locs=["Tokyo, Japan", "New York, NY", "Seoul, South Korea"],
        descs=["Neon and rain", "City lights at midnight", "Streets after the rain",
               "Downtown glow", "Night walk", "Signal lights and steam"]),
    "friends": dict(tags=["friends", "people", "picnic", "party"],
        locs=["Dolores Park, San Francisco", "Marin Headlands, CA", "Backyard, San Francisco"],
        descs=["Sunday in the park", "The whole crew", "Picnic day",
               "Laughing at nothing again", "Golden hour hangout", "Long table dinner"]),
    "waterfall": dict(tags=["waterfall", "nature", "forest", "hiking", "outdoors"],
        locs=["Columbia River Gorge, OR", "Yosemite Valley, CA", "Olympic National Park, WA"],
        descs=["Mist and moss", "The long way up", "Trail reward",
               "Water thundering down", "Green everywhere", "Cooler by the falls"]),
    "paris": dict(tags=["paris", "travel", "city", "eiffel", "europe"],
        locs=["Paris, France"],
        descs=["Rainy Paris evening", "Tour Eiffel from the street", "Cafe window seat",
               "Rooftops of Paris", "Seine at dusk", "First morning in Paris"]),
    "cake": dict(tags=["cake", "birthday", "celebration", "dessert"],
        locs=["Home, San Francisco", "Grandma's house, Sacramento"],
        descs=["Make a wish", "Birthday girl", "Candles lit, lights off",
               "Chocolate cake, no survivors", "Party centerpiece", "Homemade, of course"]),
    "winter": dict(tags=["winter", "snow", "cabin", "mountains"],
        locs=["Aspen, CO", "Whistler, BC", "Lake Tahoe, CA"],
        descs=["Cabin mornings", "First snow of the trip", "Pines in white",
               "Firewood and cocoa", "Silent forest walk", "Snowed in, happily"]),
}

# day clusters: (date, [photo indices in category], hour-start)
SCHEDULE = {
    "coffee":   [("2026-10-10", [0, 1], 9), ("2026-10-09", [2, 3], 8), ("2026-09-28", [4], 10), ("2026-09-14", [5], 9), ("2026-08-30", [6], 11)],
    "food":     [("2026-10-10", [0], 11), ("2026-10-09", [1, 2], 19), ("2026-10-04", [3], 13), ("2026-09-20", [4, 5], 20), ("2026-09-08", [6], 12)],
    "dog":      [("2026-10-09", [0, 1, 2], 16), ("2026-10-03", [3], 11), ("2026-09-19", [4, 5], 15), ("2026-08-15", [6], 10)],
    "cat":      [("2026-10-05", [0], 14), ("2026-09-25", [1, 2], 13), ("2026-09-01", [3], 16), ("2026-08-10", [4, 5], 12), ("2026-06-05", [6], 15)],
    "friends":  [("2026-10-02", [0, 1, 2], 12), ("2026-09-12", [3, 4], 17), ("2026-05-24", [5, 6], 11)],
    "landscape":[("2026-06-14", [0, 1, 2, 3], 7), ("2025-09-06", [4, 5, 6], 8)],
    "beach":    [("2026-07-18", [0, 1, 2, 3], 16), ("2026-07-19", [4, 5, 6], 10)],
    "waterfall":[("2026-06-15", [0, 1, 2, 3], 9), ("2026-06-16", [4, 5, 6], 14)],
    "paris":    [("2026-02-10", [0, 1, 2, 3], 15), ("2026-02-11", [4, 5, 6], 10)],
    "city":     [("2026-03-21", [0, 1, 2, 3], 21), ("2026-03-22", [4, 5], 20), ("2026-09-06", [6], 22)],
    "cake":     [("2026-08-22", [0, 1, 2, 3], 18), ("2025-12-31", [4, 5, 6], 23)],
    "winter":   [("2025-12-28", [0, 1, 2, 3], 9), ("2025-12-29", [4, 5, 6], 11)],
}

CAMERAS = [
    ("Pixel 9 Pro", "PXL", "f/1.7 · 1/120 · ISO 64 · 6.86mm"),
    ("Pixel 9 Pro", "PXL", "f/2.2 · 1/60 · ISO 108 · 2.55mm"),
    ("iPhone 16", "IMG", "f/1.78 · 1/100 · ISO 50 · 5.7mm"),
    ("Sony α7 III", "DSC", "f/4.0 · 1/250 · ISO 200 · 85mm"),
    ("Canon EOS R6", "IMG", "f/2.8 · 1/500 · ISO 400 · 70mm"),
    ("GoPro HERO12", "GOP", "f/2.8 · 1/240 · ISO 100 · 2.87mm"),
]

def normalize(img: Image.Image, target_ratio=None):
    """Center-ish crop to ratio then return."""
    if target_ratio:
        w, h = img.size
        cur = w / h
        if abs(cur - target_ratio) > 0.02:
            if cur > target_ratio:  # too wide -> crop width
                nw = int(h * target_ratio)
                x = (w - nw) // 2
                img = img.crop((x, 0, x + nw, h))
            else:  # too tall -> crop height, bias slightly up
                nh = int(w / target_ratio)
                y = int((h - nh) * 0.40)
                img = img.crop((0, y, w, y + nh))
    img = img.convert("RGB")
    return img

def shrink(img: Image.Image, max_edge: int, q: int):
    w, h = img.size
    scale = min(1.0, max_edge / max(w, h))
    if scale < 1.0:
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=q, optimize=True, progressive=True)
    return buf.getvalue(), img.size[0], img.size[1]

# ---------------- download ----------------
manifest = []
n_total, n_fail = 0, 0
for cat, cfg in CATS.items():
    data = json.loads((SEARCH / f"{cat}.json").read_text())
    results = data.get("results", [])
    for i, res in enumerate(results):
        url = res["original_url"]
        try:
            blob = fetch(url)
            img = Image.open(io.BytesIO(blob))
            img.load()
        except Exception as e:
            n_fail += 1
            print(f"  !! failed {cat}[{i}]: {e}")
            continue
        n_total += 1
        pid = f"p{n_total:03d}"
        # orientation variety: every 4th landscape becomes 4:5 portrait,
        # and every 9th becomes 1:1 (simulating phone camera roll mix)
        w, h = img.size
        ratio = None
        if w > h:
            if n_total % 9 == 0:
                ratio = 1.0
            elif n_total % 4 == 0:
                ratio = 0.8  # 4:5 portrait
        img = normalize(img, ratio)
        full, fw, fh = shrink(img, MAX_FULL, 82)
        thumb, _, _ = shrink(img, MAX_THUMB, 72)
        (PHOTOS / f"{pid}.jpg").write_bytes(full)
        (THUMBS / f"{pid}.jpg").write_bytes(thumb)
        manifest.append(dict(cat=cat, idx=i, id=pid, w=fw, h=fh,
                             bytes=len(full)))
        print(f"  ok {cat}[{i}] -> {pid}.jpg {fw}x{fh} {len(full)//1024}KB")

print(f"\nDownloaded {n_total} photos, {n_fail} failures")

# ---------------- assign dates & metadata ----------------
photos = []
for cat, clusters in SCHEDULE.items():
    cfg = CATS[cat]
    for date, idxs, hour in clusters:
        for k, idx in enumerate(idxs):
            m = next((x for x in manifest if x["cat"] == cat and x["idx"] == idx), None)
            if m is None:
                continue
            minute = (idx * 17 + k * 29) % 60
            sec = (idx * 31) % 60
            cam_name, prefix, exif = CAMERAS[(m["id"][-3:] and int(m["id"][1:])) % len(CAMERAS)]
            dt = f"{date}T{hour:02d}:{minute:02d}:{sec:02d}"
            compact = date.replace("-", "") + f"{hour:02d}{minute:02d}{sec:02d}"
            fname = f"{prefix}_{compact}{m['id'][1:]}{'88.MP4' if False else '.jpg'}"
            photos.append(dict(
                id=m["id"], file=f"/photos/{m['id']}.jpg", thumb=f"/photos/thumbs/{m['id']}.jpg",
                w=m["w"], h=m["h"], date=dt,
                desc=cfg["descs"][idx % len(cfg["descs"])],
                location=cfg["locs"][idx % len(cfg["locs"])],
                tags=random.sample(cfg["tags"], k=min(3, len(cfg["tags"]))),
                camera=cam_name, exif=exif, filename=fname,
            ))

photos.sort(key=lambda p: p["date"], reverse=True)
# count orientation mix
land = sum(1 for p in photos if p["w"] > p["h"]); port = sum(1 for p in photos if p["w"] < p["h"])
sq = sum(1 for p in photos if p["w"] == p["h"])
print(f"orientations: landscape={land} portrait={port} square={sq} total={len(photos)}")

# ---------------- write photos.ts ----------------
lines = []
for p in photos:
    lines.append(
        f'  {{ id: "{p["id"]}", file: "{p["file"]}", thumb: "{p["thumb"]}", w: {p["w"]}, h: {p["h"]}, '
        f'date: "{p["date"]}", desc: {json.dumps(p["desc"])}, location: {json.dumps(p["location"])}, '
        f'tags: {json.dumps(p["tags"])}, camera: "{p["camera"]}", exif: "{p["exif"]}", filename: "{p["filename"]}" }},'
    )
ts = """// AUTO-GENERATED by scripts/build-photos.py — do not edit by hand
export interface Photo {
  id: string;
  file: string;
  thumb: string;
  w: number;
  h: number;
  date: string; // ISO
  desc: string;
  location: string;
  tags: string[];
  camera: string;
  exif: string;
  filename: string;
}

export const PHOTOS: Photo[] = [
""" + "\n".join(lines) + "\n];\n"
(ROOT / "src" / "data" / "photos.ts").parent.mkdir(parents=True, exist_ok=True)
(ROOT / "src" / "data" / "photos.ts").write_text(ts)
print("wrote src/data/photos.ts")

# storage estimate (full bytes)
total_mb = sum(p["bytes"] for p in manifest) / 1e6
print(f"total full-size weight: {total_mb:.1f} MB")
