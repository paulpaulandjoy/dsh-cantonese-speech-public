#!/usr/bin/env python3
"""Render the DOCX user guide to a print-ready HTML file.

LibreOffice is not always available on the build machine, so this fallback
walks the python-docx body and emits HTML that Chrome can print to PDF.
"""

from __future__ import annotations

import html
import sys
from pathlib import Path

from docx import Document
from docx.enum.text import WD_BREAK
from docx.oxml.ns import qn
from docx.table import Table
from docx.text.paragraph import Paragraph


def esc(value: str) -> str:
    return html.escape(value, quote=False)


def run_html(run) -> str:
    text = esc(run.text).replace("\n", "<br>")
    if text == "":
        return ""
    css = []
    font = run.font.name or ""
    mono = any(key in font.lower() for key in ("menlo", "consolas", "courier", "mono"))
    if run.bold:
        css.append("font-weight:700")
    if run.italic:
        css.append("font-style:italic")
    if run.underline:
        css.append("text-decoration:underline")
    size = run.font.size
    if size is not None:
        css.append(f"font-size:{size.pt:.1f}pt")
    color = run.font.color
    if color is not None and color.rgb is not None:
        css.append(f"color:#{color.rgb}")
    classes = ' class="mono"' if mono else ""
    if mono:
        css.append("white-space:pre-wrap")
    span = (
        f'<span{classes} style="{";".join(css)}">{text}</span>' if css else text
    )
    return span


def paragraph_html(paragraph: Paragraph) -> str:
    style = paragraph.style.name if paragraph.style is not None else "Normal"
    parts = []
    for run in paragraph.runs:
        if run._element.findall(qn("w:br")):
            for br in run._element.findall(qn("w:br")):
                if br.get(qn("w:type")) == "page":
                    parts.append('<div class="pagebreak"></div>')
                else:
                    parts.append("<br>")
        parts.append(run_html(run))
    inner = "".join(parts).strip()
    if inner == "":
        return ""

    if style == "Title":
        return f'<h1 class="title">{inner}</h1>'
    if style.startswith("Heading "):
        try:
            level = int(style.split()[1])
        except ValueError:
            level = 3
        level = min(max(level, 1), 4)
        return f"<h{level}>{inner}</h{level}>"
    if style == "List Bullet":
        return f'<p class="bullet">• {inner}</p>'
    if style == "Quote":
        return f'<blockquote>{inner}</blockquote>'
    return f"<p>{inner}</p>"


def cell_fill(cell) -> str | None:
    tc_pr = cell._tc.tcPr
    if tc_pr is None:
        return None
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        return None
    fill = shd.get(qn("w:fill"))
    if fill in (None, "", "auto"):
        return None
    return fill


def table_html(table: Table) -> str:
    rows = table.rows
    cols = len(table.columns) if table.columns else 0
    if len(rows) == 1 and cols == 1:
        cell = rows[0].cells[0]
        fill = cell_fill(cell)
        body = "".join(
            paragraph_html(p) for p in cell.paragraphs
        ) + "".join(table_html(t) for t in cell.tables)
        if fill is None:
            return f'<div class="note">{body}</div>'
        dark = fill.upper() in ("1F3A5F", "17365D", "243F60")
        cls = "cover" if dark else "note"
        return f'<div class="{cls}" style="background:#{fill}">{body}</div>'

    out = ['<table class="grid">']
    for row in rows:
        out.append("<tr>")
        for cell in row.cells:
            span = cell._tc.grid_span
            attr = f' colspan="{span}"' if span > 1 else ""
            fill = cell_fill(cell)
            style = f' style="background:#{fill}"' if fill else ""
            body = "".join(
                paragraph_html(p) for p in cell.paragraphs
            ) + "".join(table_html(t) for t in cell.tables)
            out.append(f"<td{attr}{style}>{body}</td>")
        out.append("</tr>")
    out.append("</table>")
    return "".join(out)


def body_html(doc) -> str:
    blocks = []
    body = doc.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            blocks.append(paragraph_html(Paragraph(child, doc)))
        elif child.tag == qn("w:tbl"):
            blocks.append(table_html(Table(child, doc)))
    return "\n".join(b for b in blocks if b)


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: docx_to_print_html.py input.docx output.html", file=sys.stderr)
        return 2
    source = Path(sys.argv[1])
    target = Path(sys.argv[2])
    doc = Document(str(source))
    content = body_html(doc)
    page = f"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>DSH 粵語朗讀外掛使用指南</title>
<style>
@page {{ size: A4; margin: 16mm 15mm 18mm; }}
* {{ box-sizing: border-box; }}
body {{
  margin: 0;
  font-family: "PingFang HK", "PingFang SC", "Heiti TC", "Helvetica Neue", "Apple Symbols", "Arial Unicode MS", sans-serif;
  font-size: 10pt;
  line-height: 1.62;
  color: #23313d;
}}
p {{ margin: 0 0 6pt; }}
p.bullet {{ margin: 0 0 3.5pt; padding-left: 2pt; }}
h1 {{ font-size: 20pt; color: #1f3a5f; margin: 16pt 0 8pt; padding-bottom: 4pt;
      border-bottom: 2px solid #1f3a5f; page-break-after: avoid; }}
h2 {{ font-size: 14pt; color: #2d5a86; margin: 13pt 0 5pt; page-break-after: avoid; }}
h3 {{ font-size: 11.5pt; color: #315d84; margin: 10pt 0 4pt; page-break-after: avoid; }}
h4 {{ font-size: 10.5pt; color: #315d84; margin: 8pt 0 3pt; page-break-after: avoid; }}
h1.title {{ font-size: 26pt; border: none; margin: 0 0 10pt; }}
.cover {{ color: #fff; border-radius: 10px; padding: 22pt 20pt 18pt; margin-bottom: 14pt; }}
.cover h1, .cover h2, .cover p {{ color: #fff; }}
.cover .title {{ font-size: 28pt; font-weight: 700; margin: 0 0 6pt; }}
.note {{ background: #eef4f8; border-left: 3pt solid #2d5a86; border-radius: 4px;
         padding: 8pt 10pt; margin: 8pt 0 10pt; page-break-inside: avoid; }}
.note p:last-child {{ margin-bottom: 0; }}
table.grid {{ width: 100%; border-collapse: collapse; margin: 6pt 0 10pt;
              page-break-inside: auto; }}
table.grid td {{ border: 0.6pt solid #c9d6e0; padding: 5pt 7pt; vertical-align: top;
                 font-size: 9.2pt; }}
table.grid tr {{ page-break-inside: avoid; }}
blockquote {{ margin: 6pt 0; padding: 5pt 9pt; border-left: 2pt solid #b9c9d6; color: #465766; }}
.pagebreak {{ break-after: page; page-break-after: always; height: 0; }}
code, pre, .mono {{ font-family: "SF Mono", Menlo, Consolas, monospace; font-size: 8.4pt; }}
a {{ color: #1f4f7a; }}
</style>
</head>
<body>
{content}
</body>
</html>
"""
    target.write_text(page, encoding="utf-8")
    print(f"Wrote {target}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
