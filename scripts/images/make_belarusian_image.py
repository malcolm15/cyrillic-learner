import os

from PIL import Image, ImageDraw, ImageFont

import layout

# Repo root, resolved from this file so the script runs from any directory.
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SCALE = 2
W_DISP = 700
W = W_DISP * SCALE

BG        = (26, 26, 46)
GOLD      = (255, 196, 37)
BY_COL    = (60, 200, 120)   # green for Belarusian
RU_COL    = (200, 80, 80)
WHITE     = (255, 255, 255)
SUBTEXT   = (160, 160, 195)
DIVIDER   = (55, 55, 85)
WATERMARK = (85, 85, 115)

SUPP = "/System/Library/Fonts/Supplemental/"
UNI  = "/Library/Fonts/Arial Unicode.ttf"

font_title   = ImageFont.truetype(SUPP + "Arial Bold.ttf",  22 * SCALE)
font_sub     = ImageFont.truetype(SUPP + "Arial.ttf",       12 * SCALE)
font_col_hdr = ImageFont.truetype(SUPP + "Arial Bold.ttf",  12 * SCALE)
font_letter  = ImageFont.truetype(UNI,                       64 * SCALE)
font_sound   = ImageFont.truetype(SUPP + "Arial Bold.ttf",  13 * SCALE)
font_example = ImageFont.truetype(UNI,                       11 * SCALE)
font_note    = ImageFont.truetype(SUPP + "Arial.ttf",        10 * SCALE)
font_wm      = ImageFont.truetype(SUPP + "Arial.ttf",        10 * SCALE)

# Left side (NOT IN RUSSIAN): the two letters Belarusian adds.
# Right side (NOT IN BELARUSIAN): the three it drops.
left = [
    ("Ў", "/w/", "праўда (praŭda) = truth"),
    ("І", "/i/", "гісторыя (historyja) = history"),
]
right_row0 = [
    ("И", "/i/",    "Belarusian writes І"),
    ("Щ", "/shch/", "not in the alphabet"),
]
right_row1 = ("Ъ", "hard sign", "Belarusian writes an apostrophe")

# ── measure ──────────────────────────────────────────────────────────
_tmp = Image.new("RGB", (10, 10))
_d   = ImageDraw.Draw(_tmp)

def text_h(text, font):
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]

# Spacing is measured ink to ink, not from a fixed sample glyph. The gaps are
# the medians measured off ukrainian-vs-russian-alphabet.png, the same four
# values make_bulgarian_image.py uses.
GAP_LS_INK   = round(12.5 * SCALE)  # glyph ink bottom   -> label ink top
GAP_SE_INK   = round(9.5 * SCALE)   # label ink bottom   -> example ink top
ROW_GAP_INK  = round(45.5 * SCALE)  # example ink bottom -> next row's glyph ink top
NOTE_GAP_INK = 14 * SCALE           # example ink bottom -> note ink top

ROW_0 = [left[0], right_row0[0], right_row0[1]]
ROW_1 = [left[1], right_row1]
FONTS = [font_letter, font_sound, font_example]
GAPS  = [GAP_LS_INK, GAP_SE_INK]

# layout.stacked_row_lines is the row-308 rule: one shared ink-top line per
# band, set below the deepest ink in that row.
LINES_0 = layout.stacked_row_lines(_d, ROW_0, FONTS, GAPS)
LINES_1 = layout.stacked_row_lines(_d, ROW_1, FONTS, GAPS)

def cell_ink_bottom(cell, lines):
    return lines[-1] + layout.ink(_d, cell[2], font_example)[1]

row_0_ink_bottom = max(cell_ink_bottom(c, LINES_0) for c in ROW_0)
row_1_ink_bottom = max(cell_ink_bottom(c, LINES_1) for c in ROW_1)
row_1_ink_top    = min(layout.ink(_d, c[0], font_letter)[0] for c in ROW_1)

# ── vertical layout ────────────────────────────────────────────────
TITLE_Y   = 20 * SCALE
title_h   = text_h("Cyrillic", font_title)
SUB_Y     = TITLE_Y + title_h + 6 * SCALE
sub_h     = text_h("sub", font_sub)
HDR_DIV_Y = SUB_Y + sub_h + 10 * SCALE
COL_HDR_Y = HDR_DIV_Y + 12 * SCALE
col_hdr_h = text_h("ONLY", font_col_hdr)

ROW_PAD_TOP = 22 * SCALE
ROW_0_Y = COL_HDR_Y + col_hdr_h + ROW_PAD_TOP
ROW_1_Y = ROW_0_Y + row_0_ink_bottom + ROW_GAP_INK - row_1_ink_top

note = "Belarusian does have Ё, and writes it every time. Russian usually leaves the dots off."
NOTE_Y = ROW_1_Y + row_1_ink_bottom + NOTE_GAP_INK - layout.ink(_d, note, font_note)[0]
WM_Y   = NOTE_Y + text_h("note", font_note) + 6 * SCALE
H      = WM_Y   + text_h("cyrilica.com", font_wm) + 16 * SCALE

img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

mid_x = W // 2

# ── draw ───────────────────────────────────────────────────────────
title = "Belarusian Cyrillic vs Russian Cyrillic"
draw.text((layout.centred_x(draw, title, font_title, W // 2), TITLE_Y),
          title, font=font_title, fill=GOLD)

subtitle = "Russian's 33, minus И, Щ and Ъ, plus І and Ў, makes 32"
draw.text((layout.centred_x(draw, subtitle, font_sub, W // 2), SUB_Y),
          subtitle, font=font_sub, fill=SUBTEXT)

draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)
draw.rectangle([(mid_x - SCALE, HDR_DIV_Y), (mid_x + SCALE, NOTE_Y - 8 * SCALE)], fill=DIVIDER)

draw.text((layout.centred_x(draw, "NOT IN RUSSIAN", font_col_hdr, W // 4), COL_HDR_Y),
          "NOT IN RUSSIAN", font=font_col_hdr, fill=BY_COL)
draw.text((layout.centred_x(draw, "NOT IN BELARUSIAN", font_col_hdr, 3 * W // 4), COL_HDR_Y),
          "NOT IN BELARUSIAN", font=font_col_hdr, fill=RU_COL)

def draw_cell(cell, x_center, row_y, lines, letter_col):
    letter, sound, example = cell
    draw.text((layout.centred_x(draw, letter, font_letter, x_center), row_y),
              letter, font=font_letter, fill=letter_col)
    for band, (text, font, fill) in enumerate(
            [(sound, font_sound, WHITE), (example, font_example, SUBTEXT)]):
        y = row_y + lines[band] - layout.ink(draw, text, font)[0]
        draw.text((layout.centred_x(draw, text, font, x_center), y),
                  text, font=font, fill=fill)

# Left: 2 rows, single column at W//4
draw_cell(left[0], W // 4, ROW_0_Y, LINES_0, BY_COL)
draw_cell(left[1], W // 4, ROW_1_Y, LINES_1, BY_COL)

# Right row 0: И and Щ at 5W//8 and 7W//8
draw_cell(right_row0[0], 5 * W // 8, ROW_0_Y, LINES_0, RU_COL)
draw_cell(right_row0[1], 7 * W // 8, ROW_0_Y, LINES_0, RU_COL)

# Right row 1: Ъ centred in the right half
draw_cell(right_row1, 3 * W // 4, ROW_1_Y, LINES_1, RU_COL)

draw.text((layout.centred_x(draw, note, font_note, W // 2), NOTE_Y),
          note, font=font_note, fill=SUBTEXT)
draw.text((layout.centred_x(draw, "cyrilica.com", font_wm, W // 2), WM_Y),
          "cyrilica.com", font=font_wm, fill=WATERMARK)

out = os.path.join(ROOT, "images", "belarusian-vs-russian-alphabet.png")
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
