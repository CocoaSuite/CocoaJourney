"""Rasterises abbey.svg to src/assets/sample-map.webp at 1.5x (2520×1680)."""
import pathlib
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).resolve().parent
svg = (here / "abbey.svg").read_text()
out = here.parent.parent / "src" / "assets" / "sample-map.webp"

with sync_playwright() as pw:
    b = pw.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1680, "height": 1120}, device_scale_factor=1.5)
    pg.set_content(f"<html><body style='margin:0'>{svg}</body></html>")
    pg.wait_for_timeout(300)
    png = pg.screenshot(clip={"x": 0, "y": 0, "width": 1680, "height": 1120})
    pg.set_content("<canvas id=c></canvas>")
    import base64
    data = base64.b64encode(png).decode()
    webp = pg.evaluate(
        """async (d) => { const img = new Image(); img.src = 'data:image/png;base64,' + d; await img.decode();
        const c = document.getElementById('c'); c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/webp', 0.86); }""",
        data,
    )
    out.write_bytes(base64.b64decode(webp.split(",")[1]))
    b.close()
print("wrote", out, out.stat().st_size // 1024, "KB")
