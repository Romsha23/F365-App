"""Build a single self-contained HTML doc + ZIP of all F365 screenshots.

Output:
- F365-App-All-Pages.html  (open in any browser, images embedded)
- F365-App-All-Pages.zip   (just the PNGs, open any image viewer)
"""
import base64
import os
import zipfile

HERE = os.path.dirname(__file__)
SRC = os.path.join(HERE, "..", "page-screenshots")
HTML_OUT = os.path.join(HERE, "F365-App-All-Pages.html")
ZIP_OUT = os.path.join(HERE, "F365-App-All-Pages.zip")


def title(name: str) -> str:
    return os.path.splitext(name)[0].replace("-", " ").replace("_", " ").title()


def main() -> None:
    files = sorted(f for f in os.listdir(SRC) if f.lower().endswith(".png"))

    # ZIP
    with zipfile.ZipFile(ZIP_OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(os.path.join(SRC, f), arcname=f)

    # HTML with embedded base64 images
    parts = [
        "<!doctype html><html><head><meta charset='utf-8'>",
        "<title>F365 - All App Pages</title>",
        "<style>",
        "body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:0;background:#fafafa;color:#222}",
        ".cover{padding:80px 24px;text-align:center;background:linear-gradient(180deg,#fff,#fde7f1)}",
        ".cover h1{font-size:42px;color:#c2185b;margin:0 0 12px}",
        ".cover p{color:#555;margin:6px 0}",
        ".toc{max-width:780px;margin:24px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06)}",
        ".toc h2{color:#c2185b;margin-top:0}",
        ".toc ol{columns:2;-webkit-columns:2;column-gap:32px;line-height:1.9}",
        ".toc a{color:#333;text-decoration:none}",
        ".toc a:hover{color:#c2185b}",
        ".page{max-width:780px;margin:32px auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);page-break-after:always}",
        ".page h2{color:#c2185b;margin:0 0 4px}",
        ".page .file{color:#888;font-size:12px;font-style:italic;margin-bottom:16px}",
        ".page img{display:block;margin:0 auto;max-height:720px;max-width:100%;border-radius:14px;box-shadow:0 4px 14px rgba(0,0,0,.12)}",
        "@media print{.page{box-shadow:none;margin:0;border-radius:0}}",
        "</style></head><body>",
        "<div class='cover'>",
        "<h1>F365 - All App Pages</h1>",
        "<p>Visual reference of every screen in the app</p>",
        f"<p><em>Total screens: {len(files)}</em></p>",
        "</div>",
        "<div class='toc'><h2>Contents</h2><ol>",
    ]
    for f in files:
        anchor = os.path.splitext(f)[0]
        parts.append(f"<li><a href='#{anchor}'>{title(f)}</a></li>")
    parts.append("</ol></div>")

    for f in files:
        with open(os.path.join(SRC, f), "rb") as img:
            b64 = base64.b64encode(img.read()).decode("ascii")
        anchor = os.path.splitext(f)[0]
        parts.append(
            f"<div class='page' id='{anchor}'>"
            f"<h2>{title(f)}</h2>"
            f"<div class='file'>{f}</div>"
            f"<img src='data:image/png;base64,{b64}' alt='{title(f)}'/>"
            f"</div>"
        )

    parts.append("</body></html>")
    with open(HTML_OUT, "w", encoding="utf-8") as out:
        out.write("".join(parts))

    print(f"Saved HTML: {HTML_OUT} ({os.path.getsize(HTML_OUT)//1024} KB)")
    print(f"Saved ZIP:  {ZIP_OUT} ({os.path.getsize(ZIP_OUT)//1024} KB)")


if __name__ == "__main__":
    main()
