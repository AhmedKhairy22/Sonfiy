"""Assemble the single-file artifact page (dist-artifact/earth-frequency.html).

Run after `npx vite build --mode artifact`. Embeds the preprocessed data and the context
image so the page needs no network access and no files beside it, and strips the
<html>/<head>/<body> wrapper because the artifact host adds its own.
"""
from pathlib import Path
import base64, io, json, re
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist-artifact"
PUB = ROOT / "public"
EXP = "data/experiences/global-temperature"
SEA = "data/experiences/sea-level"

html = (DIST / "index.html").read_text()
title = re.search(r"<title>.*?</title>", html, re.S).group(0)
fonts = "\n".join(re.findall(r'<link rel="(?:stylesheet|preconnect)" href="https://fonts\.(?:googleapis|gstatic)\.com[^>]*>', html))
styles = "\n".join(re.findall(r"<style[^>]*>.*?</style>", html, re.S))
scripts = re.findall(r"<script[^>]*>.*?</script>", html, re.S)
assert len(scripts) == 1 and 'type="module"' in scripts[0], "expected one inline module script"

data = {f"{EXP}/{f}": json.loads((PUB / EXP / f).read_text())
        for f in ["global-annual.json", "grid-annual.json", "color-scale.json"]}
data[f"{SEA}/annual.json"] = json.loads((PUB / SEA / "annual.json").read_text())
grid_file = data[f"{EXP}/grid-annual.json"]["file"]
data[f"{EXP}/{grid_file}"] = base64.b64encode((PUB / EXP / grid_file).read_bytes()).decode()

img = Image.open(PUB / "assets/images/nasa-gistemp-2025-map.png").convert("RGB")
img.thumbnail((1280, 1280))
buf = io.BytesIO(); img.save(buf, "JPEG", quality=84)
assets = {
    "assets/images/nasa-gistemp-2025-map.png": "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(),
    "assets/images/nasa-svs-porthole.webp": "data:image/webp;base64," + base64.b64encode((PUB / "assets/images/nasa-svs-porthole.webp").read_bytes()).decode(),
}

payload = json.dumps({"data": data, "assets": assets}, separators=(",", ":")).replace("</", "<\\/")
page = "\n".join([
    title,
    fonts,
    styles,
    f"<script>window.__EJ__={payload}</script>",
    '<div id="root"></div>',
    scripts[0],
])
out = DIST / "sonify.html"
out.write_text(page)
print(f"wrote {out} ({out.stat().st_size / 1e6:.1f} MB)")
