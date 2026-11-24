"""Build the shared CSS request from the editable stylesheets; no dependencies."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parent / "dist"
sources = [
    "fonts.css", "styles.css", "polish.css", "ui.css", "reference.css",
    "assets/vendor/lenis.css",
]
css = "\n".join(
    f"/* Source: {name} */\n" + (root / name).read_text(encoding="utf-8")
    for name in sources
)
css = "\n".join(line.rstrip() for line in css.splitlines()) + "\n"
(root / "site.css").write_text(css, encoding="utf-8")
version = hashlib.sha256((root / "site.css").read_bytes()).hexdigest()[:10]
for filename in ("index.html", "about.html"):
    page = root / filename
    if not page.exists():
        continue
    html = page.read_text(encoding="utf-8")
    html = re.sub(r'site\.css(?:\?v=[\w-]+)?', f"site.css?v={version}", html)
    page.write_text(html, encoding="utf-8")
print(f"Built site.css ({len(css.encode('utf-8')):,} bytes), version {version}")
