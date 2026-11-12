#!/usr/bin/env python3
"""Build the human-facing DOCX guide for the DSH Cantonese speech plugin.

Run with the workspace Python that has python-docx installed:
    python3 scripts/build_user_guide.py
The PDF is exported separately with LibreOffice Kit.
"""

from pathlib import Path

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "USER-GUIDE.docx"

FONT = "Arial Unicode MS"
MONO = "Menlo"
NAVY = RGBColor(0x1F, 0x3A, 0x5F)
TEAL = RGBColor(0x1F, 0x6F, 0x7A)
GRAY = RGBColor(0x5B, 0x67, 0x70)
DARK = RGBColor(0x24, 0x2B, 0x33)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
LIGHT = "EEF4F8"
LIGHTER = "F7F9FB"
CODE_BG = "F3F5F7"
BORDER = "D8E0E6"
ACCENT = "D9EAF2"

_number = 0

doc = Document()

# ---------- page + base styles ----------
section = doc.sections[0]
section.page_width = Cm(21)
section.page_height = Cm(29.7)
section.top_margin = Cm(2.1)
section.bottom_margin = Cm(1.9)
section.left_margin = Cm(2.1)
section.right_margin = Cm(2.1)
section.header_distance = Cm(0.8)
section.footer_distance = Cm(0.8)

normal = doc.styles["Normal"]
normal.font.name = FONT
normal.font.size = Pt(10.5)
normal.font.color.rgb = DARK
normal.paragraph_format.space_after = Pt(5)
normal.paragraph_format.line_spacing = 1.22
normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT)


def set_run(run, font=FONT, size=10.5, bold=False, color=DARK, italic=False, east_asia=None):
    run.font.name = font
    run.font.size = Pt(size)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    for attr in ("w:ascii", "w:hAnsi", "w:cs"):
        rfonts.set(qn(attr), font)
    rfonts.set(qn("w:eastAsia"), east_asia or font)


def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def cell_margins(cell, top=90, bottom=90, left=120, right=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    mar = tc_pr.first_child_found_in("w:tcMar")
    if mar is None:
        mar = OxmlElement("w:tcMar")
        tc_pr.append(mar)
    for name, value in (("top", top), ("bottom", bottom), ("left", left), ("right", right)):
        node = mar.find(qn(f"w:{name}"))
        if node is None:
            node = OxmlElement(f"w:{name}")
            mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def cell_border(cell, color=BORDER, size=6):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), str(size))
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)


def para_bottom_border(paragraph, color="1F3A5F", size=12):
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)


def heading(text, level=1):
    global _number
    _number = 0
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(16 if level == 1 else 11)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    if level == 1:
        set_run(run, size=17, bold=True, color=NAVY)
        para_bottom_border(p)
    elif level == 2:
        set_run(run, size=12.5, bold=True, color=TEAL)
    else:
        set_run(run, size=11, bold=True, color=NAVY)
    return p


def body(text, size=10.5, color=DARK, space_after=5, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.22
    run = p.add_run(text)
    set_run(run, size=size, color=color, italic=italic)
    return p


def lead_para(lead, text, size=10.5):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(5)
    r1 = p.add_run(lead)
    set_run(r1, size=size, bold=True, color=NAVY)
    r2 = p.add_run(text)
    set_run(r2, size=size, color=DARK)
    return p


def bullet(text, lead=None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.left_indent = Cm(0.7)
    p.paragraph_format.first_line_indent = Cm(-0.35)
    if lead:
        r = p.add_run(lead)
        set_run(r, bold=True, color=NAVY)
    r = p.add_run(text)
    set_run(r)
    return p


def numbered(text, lead=None):
    global _number
    _number += 1
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.left_indent = Cm(0.8)
    p.paragraph_format.first_line_indent = Cm(-0.45)
    r = p.add_run(f"{_number}.  ")
    set_run(r, bold=True, color=TEAL)
    if lead:
        r = p.add_run(lead)
        set_run(r, bold=True, color=NAVY)
    r = p.add_run(text)
    set_run(r)
    return p


def code_block(text):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cant_split(table)
    cell = table.cell(0, 0)
    cell.width = Cm(16.6)
    shade(cell, CODE_BG)
    cell_border(cell, "DDE4E9", 4)
    cell_margins(cell, 100, 100, 150, 150)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.12
    lines = text.split("\n")
    for index, line in enumerate(lines):
        run = p.add_run(line)
        set_run(run, font=MONO, east_asia=FONT, size=8.4, color=RGBColor(0x2B, 0x32, 0x38))
        if index < len(lines) - 1:
            run.add_break()
    doc.add_paragraph().paragraph_format.space_after = Pt(1)



def cant_split(table):
    for row in table.rows:
        tr_pr = row._tr.get_or_add_trPr()
        if tr_pr.find(qn("w:cantSplit")) is None:
            node = OxmlElement("w:cantSplit")
            tr_pr.append(node)


def note(title, text, fill="E8F2F6", title_color=TEAL):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    cant_split(table)
    cell = table.cell(0, 0)
    cell.width = Cm(16.6)
    shade(cell, fill)
    cell_border(cell, "C9DEE7", 4)
    cell_margins(cell, 120, 120, 160, 160)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(title)
    set_run(r, size=10, bold=True, color=title_color)
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_after = Pt(0)
    p2.paragraph_format.line_spacing = 1.2
    r2 = p2.add_run(text)
    set_run(r2, size=9.6, color=DARK)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)


def make_table(headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    hdr = table.rows[0]
    # repeat header across pages
    tr_pr = hdr._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)
    for i, text in enumerate(headers):
        cell = hdr.cells[i]
        shade(cell, "1F3A5F")
        cell_margins(cell, 80, 80, 100, 100)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        set_run(r, size=9.2, bold=True, color=WHITE)
        if widths:
            cell.width = Cm(widths[i])
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for i, text in enumerate(row):
            cell = cells[i]
            if row_index % 2 == 1:
                shade(cell, LIGHTER)
            cell_margins(cell, 75, 75, 100, 100)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.1
            r = p.add_run(text)
            set_run(r, size=9.2)
            if widths:
                cell.width = Cm(widths[i])
    cant_split(table)
    doc.add_paragraph().paragraph_format.space_after = Pt(1)
    return table


def page_field(paragraph, field):
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = field
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run = paragraph.add_run()
    run._r.append(fld_begin)
    run._r.append(instr)
    run._r.append(fld_sep)
    run._r.append(fld_end)


# ---------- header / footer ----------
header_p = section.header.paragraphs[0]
header_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
hr = header_p.add_run("DSH 粵語朗讀外掛  ·  使用者與 AI 協作指南  ·  v1.1.0")
set_run(hr, size=8, color=GRAY)
para_bottom_border(header_p, "D8E0E6", 6)

footer_p = section.footer.paragraphs[0]
footer_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = footer_p.add_run("第 ")
set_run(r, size=8, color=GRAY)
page_field(footer_p, "PAGE")
r = footer_p.add_run(" 頁，共 ")
set_run(r, size=8, color=GRAY)
page_field(footer_p, "NUMPAGES")
r = footer_p.add_run(" 頁  ·  Private  ·  MIT License")
set_run(r, size=8, color=GRAY)

# ---------- cover ----------
cover = doc.add_table(rows=1, cols=1)
cover.alignment = WD_TABLE_ALIGNMENT.CENTER
cover.autofit = False
c = cover.cell(0, 0)
c.width = Cm(16.8)
shade(c, "1F3A5F")
cell_margins(c, 420, 420, 420, 420)
p = c.paragraphs[0]
p.alignment = WD_ALIGN_PARAGRAPH.LEFT
p.paragraph_format.space_after = Pt(8)
r = p.add_run("DSH DESKTOP  /  macOS")
set_run(r, size=9, bold=True, color=RGBColor(0xBF, 0xD6, 0xE5))
p2 = c.add_paragraph()
p2.paragraph_format.space_after = Pt(4)
r = p2.add_run("粵語朗讀外掛")
set_run(r, size=30, bold=True, color=WHITE)
p3 = c.add_paragraph()
p3.paragraph_format.space_after = Pt(14)
r = p3.add_run("使用者指南 × GitHub 版本管理 × AI 協作")
set_run(r, size=13, color=RGBColor(0xD9, 0xEA, 0xF2))
p4 = c.add_paragraph()
p4.paragraph_format.space_after = Pt(0)
r = p4.add_run("給人類看的完整版  ·  可以照著做，也可以交給 AI 做")
set_run(r, size=9.5, color=RGBColor(0xBF, 0xD6, 0xE5))

doc.add_paragraph().paragraph_format.space_after = Pt(18)
body("版本 1.1.0", size=12, color=NAVY)
body("2026-11-12  ·  macOS  ·  DSH Desktop", size=9.5, color=GRAY)
body("Repository：github.com/paulpaulandjoy/dsh-cantonese-speech-public", size=9.5, color=GRAY)
body("Release：github.com/paulpaulandjoy/dsh-cantonese-speech-public/releases/tag/v1.1.0", size=9.5, color=GRAY)
doc.add_paragraph().paragraph_format.space_after = Pt(8)
note(
    "開始前最重要的一件事",
    "這個 repo 目前是 Private，並已採用 MIT License。Private 只影響誰能看到；拿到 code 的人可依 MIT 使用、修改、再分享，但要保留 copyright notice。"
)
doc.add_page_break()

# ---------- intro + contents ----------
heading("這份指南怎樣用", 1)
body(
    "這不是只寫給工程師看的文件。它假設你係新手，會由「今日想做甚麼」開始，"
    "一步步帶你完成安裝、日常使用、版本管理、分享，以及同 AI 合作的流程。"
)
body(
    "你可以只看第 1、2 節就開始用；想管好 GitHub，看第 4 節；想教仔仔或交給 AI，"
    "看第 5、6 節。最後的附錄有一頁「快速卡」，可以印出來貼在電腦旁。"
)
note(
    "一個簡單原則",
    "先 Private、先備份、先測試。License 已用 MIT；Public 與否是曝光決定，不是授權前提。"
    "任何安裝、push、改 Public、刪 repo，都應該由人類明確說「可以」才做。",
    fill="FFF4E5",
    title_color=RGBColor(0x9A, 0x5B, 0x00),
)
heading("目錄", 2)
contents = [
    ("1", "專案現況與 30 秒快速開始"),
    ("2", "日常操作：五個按鈕"),
    ("3", "安裝到新 Mac 與分享"),
    ("4", "GitHub 版本管理與 Keychain"),
    ("5", "與 AI 合作：給甚麼、怎樣驗收"),
    ("6", "完全人手可重複的步驟"),
    ("7", "疑難排解"),
    ("8", "安全、私隱與仔仔學習"),
    ("A", "附錄：名詞、網址、快速卡"),
]
for num, title in contents:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(f"{num}.  ")
    set_run(r, size=10.5, bold=True, color=TEAL)
    r = p.add_run(title)
    set_run(r, size=10.5, color=DARK)

# ---------- 1. status / quick start ----------
doc.add_page_break()
heading("1. 專案現況與 30 秒快速開始", 1)
body(
    "這個 plugin 讓 DSH Desktop 用 macOS 本機語音讀出助手回覆，也可以選取頁面上任何文字朗讀。"
    "它不呼叫模型、不上傳文字，所以日常使用不會增加 token。"
)
make_table(
    ["項目", "現況"],
    [
        ("Plugin", "粵語朗讀回覆（Cantonese speech replies）"),
        ("GitHub repo", "paulpaulandjoy/dsh-cantonese-speech-public（Public）"),
        ("最新版本", "v1.1.0（2026-11-12）"),
        ("Release", "v1.1.0 — Documentation release"),
        ("License", "MIT（Copyright 2026 Cheung Chi Sing）"),
        ("平台", "macOS + DSH Desktop"),
        ("聲音", "Sinji（香港粵語）、Samantha（英文）"),
        ("Token 用量", "本機 DOM + /usr/bin/say；沒有額外模型呼叫"),
    ],
    widths=[4.0, 12.6],
)
heading("30 秒快速開始", 2)
numbered("在 DSH 安裝這個 bundle；如果已安裝，跳去下一步。", "安裝：")
numbered("重新整理 DSH 頁面。", "重載：")
numbered("確認 macOS 有 Sinji 和 Samantha 聲音。", "聲音：")
code_block("say -v '?' | grep -E 'Sinji|Samantha'")
numbered("輸入框左邊按 ▶ 讀最新回覆，或按食指選取文字。", "使用：")
note(
    "如果只想先試一次",
    "按 ▶ 讀最新一個已完成回覆；按食指再點一段文字，可以讀任何訊息、code block 或側欄文字。"
    "播放中按黑色方塊會停止並重設；速度會保留。",
)

# ---------- 2. controls ----------
heading("2. 日常操作：五個按鈕", 1)
body("按鈕都在輸入框左邊，順序是：喇叭、播放／暫停、重讀、速度、食指。")
make_table(
    ["按鈕", "平時", "播放中／暫停中"],
    [
        ("喇叭", "開／關自動朗讀；黑色＝開，禁止喇叭＝關", "黑色方塊：停止所有朗讀並重設"),
        ("▶／暫停", "▶ 讀當前 session 最新一個已完成回覆", "暫停；暫停後變 ▶ 繼續"),
        ("↻", "重讀目前文字；冇文字時變灰", "重讀目前文字"),
        ("速度", "0.8×／1×／1.25×／1.5×", "即時套用；會重播目前句子"),
        ("食指", "進入選取文字模式", "可再按取消"),
    ],
    widths=[3.0, 7.4, 6.2],
)
heading("喇叭：自動朗讀開關，不是 Play", 2)
bullet("沒有播放、自動朗讀開：黑色喇叭。按一下變禁止喇叭，關閉自動朗讀。")
bullet("沒有播放、自動朗讀關：禁止喇叭。按一下變黑色喇叭，開啟自動朗讀。")
bullet("播放中或暫停中：黑色方塊。按一下停止所有朗讀並 Reset。")
bullet("Reset 會清除播放隊列、暫停位置、選取文字、重讀狀態；保留速度，也保留原本自動朗讀開關。")
bullet("最新回覆會保留，供 ▶ 再播。")
heading("▶／暫停：手動播放最新回覆", 2)
bullet("沒有播放時按 ▶：由頭讀當前 session 最新一個已完成助手回覆。")
bullet("播放中按 暫停：暫停。暫停中按 ▶：繼續目前內容，不是重讀最新。")
bullet("手動 Play 不會改動自動朗讀開關：禁止喇叭時只讀一次，讀完仍然禁止。")
bullet("如果還沒有已完成回覆，▶ 會變灰。")
heading("食指：選取任何文字朗讀", 2)
numbered("按食指，按鈕閃爍，cursor 變十字。")
numbered("移到文字上，會出現 2px 外框＋淡色底，顯示將會讀的範圍。")
numbered("按一下文字：讀取並退出選取模式；cursor 還原。")
numbered("Esc、右鍵、再按食指：取消。")
numbered("點擊會被攔截，不會誤開 link 或按到下面 button。")
body("範圍規則：回覆內文讀整個 message bubble；直接點 code block 讀該段 code；其他位置讀最近訊息、段落、表格或側欄文字。URL 會略過，code 會照讀。上限 8,000 字。")
note(
    "選取範圍不準時",
    "Hover 的外框就是實際會讀的範圍。如果太大或太細，改點訊息內另一個位置，或直接點 code block。"
    "仍然不準就記下你點的位置，交給維護者調整 selector。",
)

heading("Web／手機版：Browser TTS（初版）", 2)
body("如果 DSH 以 web profile 在瀏覽器使用，plugin 會改用 Browser TTS（Web Speech API）；聲音由開網頁的裝置播出，不是 Mac 的喇叭。")
bullet("初版支援：手動 Play、手指選取文字、暫停／繼續、重讀、速度。")
bullet("初版沒有自動朗讀；每次要按 ▶ 開始。")
bullet("第一次 Play 需要用戶手勢，這是 iOS／瀏覽器 autoplay 限制。")
bullet("粵語 voice 視乎裝置；如果沒有香港粵語，會 fallback 中文或系統預設。")
bullet("Desktop profile 仍然用 macOS say；Web profile 用 Browser TTS。")
note(
    "怎樣分辨",
    "Web 版 status 會回傳 mode: browser；Desktop 版回傳 mode: host。Browser TTS 不需要 /usr/bin/say，也不會把聲音送到 Mac。",
    fill="EEF7EE",
    title_color=RGBColor(0x2F, 0x6B, 0x3A),
)

# ---------- 3. install/share ----------
heading("3. 安裝到新 Mac 與分享", 1)
heading("系統要求", 2)
bullet("macOS，使用 /usr/bin/say。")
bullet("DSH Desktop，已開啟一個 profile。")
bullet("已安裝 voices：Sinji（中文香港）及 Samantha（英文美國）。")
code_block("say -v '?' | grep -E 'Sinji|Samantha'")
body("如果沒有聲音，去：系統設定 → 輔助使用 → 朗讀內容 → 系統聲音 → 管理聲音，下載上述兩個 voices。")
heading("方法 A：用 Release zip（朋友最簡單）", 2)
numbered("下載 Release 的 dsh-cantonese-speech-1.1.0.zip，解壓。", "取得檔案：")
numbered("放到例如 ~/Downloads/dsh-cantonese-speech。", "位置：")
numbered("DSH → Settings → Plugins → 找 Install bundle／安裝 bundle，選該資料夾。", "安裝：")
numbered("如果 UI 沒有本機資料夾選項，對 agent 說下面那句。", "用 AI：")
code_block(
    "請用 plugin_manager install_bundle 安裝這個本機 bundle：\n"
    "/Users/你的名字/Downloads/dsh-cantonese-speech\n\n"
    "安裝後重新載入，並確認輸入框左邊有朗讀控制。"
)
numbered("重新整理頁面；仍未見就重開 DSH。", "重載：")
heading("方法 B：由 GitHub 下載", 2)
body("Private repo 只有你或 collaborator 能開。你自己可以用 Safari 開 repo，按 Code → Download ZIP；朋友要你加 collaborator，或直接收 Release zip。")
heading("分享給朋友", 2)
bullet("Private repo：Settings → Collaborators → Add people；朋友接受後才看到。")
bullet("不想加 collaborator：直接傳 Release zip；朋友只需要 macOS + DSH + voices。")
bullet("這是 DSH Desktop 外掛，不是獨立 .app；Windows 朋友暫時用不到。")
bullet("不要傳 GitHub token、Keychain 密碼、2FA code、DSH credentials 或個人資料；朋友只需要 zip 和安裝指示。")

# ---------- 4. GitHub / keychain ----------
heading("4. GitHub 版本管理與 Keychain", 1)
heading("四個名詞", 2)
make_table(
    ["名詞", "意思"],
    [
        ("Repo", "一個項目連版本歷史；不只是一個資料夾"),
        ("Commit", "一次「存檔」，記錄改了甚麼"),
        ("Tag", "一個固定版本標籤，例如 v1.1.0"),
        ("Release", "以 tag 為基礎，附下載檔和版本說明"),
    ],
    widths=[3.2, 13.4],
)
heading("Private 與 Public", 2)
bullet("GitHub 的可見性是整個 repo 計，不能同一個 repo 內某些 folder public、某些 private。")
bullet("要混合，就分開 repo：dsh-cantonese-speech（Private）、family-ai-lab（Private）、公開範例（Public）。")
bullet("Private → Public 會公開整個 history；一旦被 fork／下載，不能當完全收回。")
bullet("本專案已用 MIT：拿到 code 的人可以使用、修改、再分享，但要保留 copyright notice。Private 只影響誰能看到。")
doc.add_page_break()
heading("Keychain 在哪裏？", 2)
body("GitHub CLI 的 token 存在 macOS 的登入 Keychain，不是 repo 內，也不是普通文字檔。")
make_table(
    ["項目", "位置／內容"],
    [
        ("Keychain Access app", "應用程式 → 工具程式 → Keychain Access"),
        ("Login keychain 檔案", "~/Library/Keychains/login.keychain-db"),
        ("Service", "gh:github.com"),
        ("Account", "<你的 GitHub 帳號>"),
        ("Token 顯示", "Keychain Access 搜尋 gh:github.com；不要隨便按 Show password"),
    ],
    widths=[5.0, 11.6],
)
body("如果你要撤銷：")
code_block(
    "./tools/gh_2.103.3_macOS_arm64/bin/gh auth logout\n"
    "# 或 GitHub → Settings → Applications → 撤銷 GitHub CLI"
)
note(
    "安全提示",
    "不要把 Keychain 密碼、token 或 2FA code 貼給 AI 或朋友。AI 只需要知道「已登入」，"
    "不需要知道 token 是甚麼。",
)
heading("目前這部機的 GitHub CLI", 2)
body("Homebrew 的 /opt/homebrew 權限不足，所以沒有用 sudo 強改；改用可攜版：")
code_block(
    "tools/gh_2.103.3_macOS_arm64/bin/gh --version\n"
    "tools/gh_2.103.3_macOS_arm64/bin/gh auth status"
)
body("已登入你的 GitHub 帳號；Git 已設定 local credential helper，正常 git push 不會再問 username。")
heading("日常更新", 2)
code_block(
    'cd "$HOME/Documents/dsh-cantonese-speech"\n'
    "git status\n"
    "git add .\n"
    'git commit -m "feat: 描述改動"\n'
    "git push"
)
heading("新版 tag 與 Release", 2)
code_block(
    'git tag -a v1.1.0 -m "v1.1.0"\n'
    "git push origin v1.1.0\n\n"
    "cd ..\n"
    "zip -r dsh-cantonese-speech-1.1.0.zip dsh-cantonese-speech -x '*.DS_Store' 'dsh-cantonese-speech/.git/*'\n\n"
    'gh release create v1.1.0 --title "v1.1.0" --notes "..." dsh-cantonese-speech-1.1.0.zip'
)
heading("如果沒有 AI／沒有 CLI", 2)
body("可以用 GitHub Desktop：File → Add Local Repository → 選這個資料夾 → Commit → Push；或用 GitHub 網頁上載。完整步驟見 repo 的 GITHUB-DESKTOP.md。")
heading("License 與轉 Public", 2)
numbered("本專案用 MIT License；copyright 為 2026 Cheung Chi Sing。", "License：")
numbered("LICENSE 已加入 repo；不需要再選其他 License。", "已加：")
numbered("MIT 已授權使用、修改、再分享，但要求保留 copyright notice。", "權利：")
numbered("Public 是可選曝光；轉 Public 前檢查 history 沒有密碼、token、私人資料。", "Public：")
note(
    "License 已就緒",
    "Repo 仍然是 Private；MIT 不會因 Private 而失效。轉 Public 前只需檢查 history，不需要再等 License。",
    fill="E8F2F6",
    title_color=TEAL,
)

note(
    "免責聲明",
    "本軟件按「現狀」提供，不附帶任何明示或暗示保證。使用風險由使用者自行承擔；作者不對因使用本軟件而引致的任何直接或間接損失負責。"
    "本專案與 DeepSeek 並無隸屬或背書關係，亦不保證支援、特定用途適用性或未來 DSH／macOS 兼容性。",
    fill="FDECEC",
    title_color=RGBColor(0x9B, 0x2C, 0x2C),
)

# ---------- 5. AI collaboration ----------
heading("5. 與 AI 合作：給甚麼、怎樣驗收", 1)
body(
    "AI 不是魔法，也不是代你負責任的人。最有效的方式，是把它當成一個「會讀檔案、會改 code、會跑測試的工程助手」："
    "你給它清楚的目標和限制，它先給計劃，你批准後才動手，最後由你驗收。"
)
heading("分工", 2)
make_table(
    ["人類負責", "AI 可以負責"],
    [
        ("決定目標、優先次序、可否公開", "讀 repo、整理現況、提出方案"),
        ("GitHub 登入、2FA、Keychain 授權", "改 code、寫測試、跑測試、整理 diff"),
        ("明確批准 install／push／Release／Public", "準備 commit、tag、Release notes、更新文件"),
        ("最終驗收、決定 License、承擔風險", "報告改動、測試結果、未驗證事項"),
    ],
    widths=[8.3, 8.3],
)
heading("每次給 AI 的五樣東西", 2)
numbered("一句話說清楚要達到的結果，不要只說「幫我整好佢」。", "目標：")
numbered("給 repo 或資料夾路徑、相關檔案、錯誤訊息。", "上下文：")
numbered("講明不可以做甚麼，例如不要改 UI、不要 push、不要轉 Public。", "限制：")
numbered("講清楚怎樣算完成，例如「按鈕出現、route 回 200、測試通過」。", "完成標準：")
numbered("要求它先給計劃，等你說「可以」才動手。", "批准：")
heading("可以直接複製的 prompt 模板", 2)
code_block(
    "請先讀這個 repo 的 README.md、USER-GUIDE.md、CHANGELOG.md：\n"
    "/path/to/dsh-cantonese-speech\n\n"
    "目標：\n"
    "（例如：修正停止後 Play 按鈕狀態）\n\n"
    "背景／重現步驟：\n"
    "（貼錯誤訊息、操作步驟、預期結果）\n\n"
    "限制：\n"
    "- 不要改其他功能\n"
    "- 不要 push、不要改 Public\n"
    "- 先給修改計劃，等我確認\n\n"
    "完成標準：\n"
    "- 指定測試通過\n"
    "- 更新 USER-GUIDE.md / CHANGELOG.md\n"
    "- 報告改了哪些檔案、怎樣驗證"
)
heading("AI 應該怎樣工作", 2)
numbered("先讀現有文件和 code，不靠猜。", "理解：")
numbered("先說計劃、影響範圍、風險；需要時問一個清楚問題。", "計劃：")
numbered("只改必要檔案；保持現有風格；不刪無關內容。", "修改：")
numbered("跑得到就測試；測試不到就明確說「未驗證」。", "驗證：")
numbered("報告：改了甚麼、為甚麼、怎樣測試、未完成／風險。", "交接：")
numbered("安裝、push、Release、改 Public 前，逐次取得人類同意。", "批准：")
heading("AI 根據甚麼工作？", 2)
bullet("Repo 內的 source、README、USER-GUIDE、CHANGELOG、設定檔。")
bullet("你提供的錯誤訊息、截圖、重現步驟、預期結果。")
bullet("實際測試結果和 route 回應，不是「應該可以」。")
bullet("官方文件（例如 GitHub Docs）和已安裝套件的實際 API；不靠記憶猜 API。")
bullet("如果資料不足，AI 應問，而不是自己發明答案。")
heading("AI 不應該做", 2)
bullet("不應要求你貼密碼、token、2FA code、Keychain 密碼。")
bullet("不應未經批准 push、改 Public、刪 repo、安裝系統工具。")
bullet("不應把未測試的東西說成「已完成」。")
bullet("不應在 session 關閉後假裝會自動維護 GitHub。")
heading("怎樣減少 token", 2)
bullet("把 repo 當唯一 source of truth；不要每次重貼全部 code。")
bullet("新 session 先叫 AI 讀 README 和 USER-GUIDE，不要重新解釋背景。")
bullet("只指出要改的檔案和行為；不要叫 AI「重新做一個 plugin」。")
bullet("用 commit／tag／Release 記錄版本，不要靠聊天記錄。")
bullet("文件同 code 一齊更新，下一次就不用再問。")

# ---------- 6. human-only ----------
heading("6. 完全人手可重複的步驟", 1)
body("以下步驟不需要 AI。你可以用 GitHub Desktop、GitHub 網頁，或已安裝的 gh。")
heading("A. 安裝 plugin", 2)
numbered("下載 Release zip 並解壓。", "取得：")
numbered("DSH → Settings → Plugins → Install bundle，選資料夾。", "安裝：")
numbered("重新整理頁面，測試 ▶ 和食指。", "測試：")
heading("B. 修改檔案", 2)
numbered("用任何文字編輯器改 index.js／client.js；改前先備份。", "改：")
numbered("重新整理頁面測 UI；host 改動要 disable/enable plugin 或重開 DSH。", "測：")
numbered("把改動寫入 USER-GUIDE.md 和 CHANGELOG.md。", "文件：")
heading("C. 用 GitHub Desktop 上載", 2)
numbered("GitHub Desktop → Add Local Repository → 選 repo 資料夾。", "加入：")
numbered("左邊看 Changes，寫 commit message。", "Commit：")
numbered("按 Commit to main，再按 Push origin。", "Push：")
heading("D. 用 GitHub 網頁上載（不想裝工具）", 2)
numbered("GitHub repo → Add file → Upload files。", "上載：")
numbered("拖入改動的檔案，寫 commit message。", "Commit：")
numbered("按 Commit changes。", "完成：")
body("限制：網頁上載不適合大量檔案或刪除；版本歷史也較難看。少量文件更新可以。")
heading("E. 建立 tag 與 Release（網頁）", 2)
numbered("Repo → Releases → Draft a new release。", "Release：")
numbered("Choose a tag → 輸入 v1.1.0 → Create new tag。", "Tag：")
numbered("填標題、說明，上載 zip。", "內容：")
numbered("按 Publish release。Private repo 仍然只有你／collaborator 看到。", "發佈：")
heading("F. 回滾", 2)
bullet("想撤回某個 commit：GitHub Desktop → History → 右鍵 → Revert；或 `git revert <hash>`。")
bullet("想回到舊版：下載舊 Release zip，重新安裝。")
bullet("不要用 force push 覆寫歷史，除非你清楚知道後果。")

# ---------- 7. troubleshooting ----------
heading("7. 疑難排解", 1)
make_table(
    ["問題", "檢查／做法"],
    [
        ("按鈕不見了", "重新整理 DSH；仍未見就重開 DSH。"),
        ("沒有聲音", "檢查音量／輸出；用 say -v '?' 確認 Sinji、Samantha；測 route。"),
        ("▶ 變灰", "當前 session 還沒有已完成回覆；等回覆完成。"),
        ("選取範圍不準", "看 hover 外框；改點訊息另一個位置或 code block；回報位置。"),
        ("git push 問 username", "跑 gh auth status；確認 local credential helper；或用 GitHub Desktop。"),
        ("Homebrew 不能安裝", "不要 sudo chown；改用可攜版 gh，或 GitHub Desktop。"),
        ("PDF 過期", "改 DOCX 後重新 export PDF；或叫 AI 重新產生。"),
        ("Private repo 朋友看不到", "加 collaborator，或傳 Release zip。"),
    ],
    widths=[5.4, 11.2],
)
heading("快速 route 檢查", 2)
code_block("curl 'http://127.0.0.1:49169/local-speech?action=status'")
body("應回傳 enabled、status、speed、source、canReplay、hasLatest 等欄位。")

# ---------- 8. safety/kid ----------
heading("8. 安全、私隱與仔仔學習", 1)
heading("安全規則", 2)
bullet("Repo 預設 Private；Public 前檢查 history 和 secrets；本專案已用 MIT。")
bullet("不要把 token、密碼、2FA、Keychain 密碼寫入 code、README、commit 或聊天。")
bullet("朋友給的 plugin 也是本機程式；只安裝你信任的來源。")
bullet("Public 後可能被 fork／下載，不能當完全收回。")
heading("給 8 歲仔仔的安排", 2)
bullet("用家長 GitHub account；不要用仔仔全名、學校、地址、相片開 account。")
bullet("由 Scratch／Code.org 開始，之後才 Python；GitHub 當「遊戲存檔點」。")
bullet("AI 用來問「為甚麼」、找 bug、出練習；不要直接抄答案。")
bullet("每次 commit 由家長一起看 diff；Public 由家長決定。")
bullet("不要讓仔仔接觸 API key、付款資料、Private repo 的敏感內容。")

# ---------- appendix ----------
heading("附錄 A：名詞與網址", 1)
make_table(
    ["名詞", "解釋"],
    [
        ("Repo", "項目＋版本歷史"),
        ("Commit", "一次存檔"),
        ("Branch", "平行版本；本專案主要用 main"),
        ("Tag", "固定版本標籤，例如 v1.1.0"),
        ("Release", "以 tag 為基礎的下載頁"),
        ("Private", "只有你和 collaborator 看到"),
        ("Public", "任何人有 link 都看到"),
        ("License", "法律授權；本專案用 MIT"),
        ("Keychain", "macOS 儲存密碼／token 的地方"),
        ("CLI", "文字指令介面；本專案用 gh"),
    ],
    widths=[3.8, 12.8],
)
body("Repo：https://github.com/paulpaulandjoy/dsh-cantonese-speech-public")
body("Release：https://github.com/paulpaulandjoy/dsh-cantonese-speech-public/releases/tag/v1.1.0")
body("GitHub CLI 文件：https://cli.github.com/manual/")
body("GitHub Docs（容量）：https://docs.github.com/zh/repositories/creating-and-managing-repositories/repository-limits")

heading("附錄 B：一頁快速卡", 1)
note(
    "每天用",
    "▶ 讀最新回覆；暫停／繼續；喇叭開關自動朗讀；播放中黑色方塊＝停止＋重設；速度保留。",
    fill="E8F2F6",
)
note(
    "要 AI 幫手時",
    "給 repo 路徑＋目標＋限制＋完成標準；叫它先讀 README／USER-GUIDE；先給計劃；"
    "安裝／push／Public 前要明確批准；不貼密碼／token／2FA。",
    fill="EEF7EE",
    title_color=RGBColor(0x2F, 0x6B, 0x3A),
)
body("版本：v1.1.0  ·  2026-11-12  ·  这份指南应随每次功能更新。", size=9, color=GRAY, italic=True)

doc.save(OUT)
print(f"Wrote {OUT}")
