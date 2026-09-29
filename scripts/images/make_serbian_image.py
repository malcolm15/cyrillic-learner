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
CYR_COL   = (90, 160, 255)
LAT_COL   = (60, 200, 120)
SUBTEXT   = (160, 160, 195)
DIVIDER   = (55, 55, 85)
ROW_RULE  = (40, 40, 66)     # fainter than DIVIDER, sits in the gap between rows
WATERMARK = (85, 85, 115)

SUPP = "/System/Library/Fonts/Supplemental/"

font_title   = ImageFont.truetype(SUPP + "Arial Bold.ttf", 20 * SCALE)
font_sub     = ImageFont.truetype(SUPP + "Arial.ttf",      11 * SCALE)
font_col_hdr = ImageFont.truetype(SUPP + "Arial Bold.ttf", 11 * SCALE)
# One font file for both word columns, so the two scripts share metrics exactly
# instead of being reconciled by an offset, which is what drifted before.
font_word    = ImageFont.truetype(SUPP + "Arial Bold.ttf", 16 * SCALE)
font_meaning = ImageFont.truetype(SUPP + "Arial.ttf",      10 * SCALE)
font_wm      = ImageFont.truetype(SUPP + "Arial.ttf",      10 * SCALE)

# (Cyrillic, Latin, English meaning)
pairs = [
    ("Београд",      "Beograd",      "Belgrade · capital city"),
    ("Србија",       "Srbija",       "Serbia"),
    ("добро јутро",  "dobro jutro",  "good morning"),
    ("хвала",        "hvala",        "thank you"),
    ("да / не",      "da / ne",      "yes / no"),
]

# ── measure ──────────────────────────────────────────────────────────
_tmp = Image.new("RGB", (10, 10))
_d   = ImageDraw.Draw(_tmp)

def text_h(text, font):
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]

# ── vertical layout ────────────────────────────────────────────────
PAD       = 20 * SCALE
TITLE_Y   = PAD
SUB_Y     = TITLE_Y + text_h("Serbian", font_title) + 10 * SCALE
HDR_DIV_Y = SUB_Y + text_h("sub", font_sub) + 12 * SCALE
COL_HDR_Y = HDR_DIV_Y + 10 * SCALE

# Rows sit on shared baselines, so the pitch comes from how far the row's ink
# actually reaches either side of the baseline, not from a sample string.
ROW_ITEMS = ([(c, font_word) for c, _, _ in pairs]
             + [(l, font_word) for _, l, _ in pairs]
             + [(m, font_meaning) for _, _, m in pairs])
ABOVE, BELOW = layout.row_extent(_d, ROW_ITEMS)

PITCH        = 40 * SCALE
FIRST_BASE_Y = COL_HDR_Y + text_h("CYRILLIC", font_col_hdr) + 14 * SCALE + ABOVE
LAST_BASE_Y  = FIRST_BASE_Y + (len(pairs) - 1) * PITCH

NOTE_Y = LAST_BASE_Y + BELOW + 14 * SCALE
WM_Y   = NOTE_Y + text_h("note", font_meaning) + 6 * SCALE
H      = WM_Y + text_h("cyrilica.com", font_wm) + 14 * SCALE

img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

def cx(text, font, x_center):
    bb = draw.textbbox((0, 0), text, font=font)
    return x_center - (bb[2] - bb[0]) // 2

col_cyr, col_lat, col_mean = W // 6, W // 2, 5 * W // 6

# ── draw ───────────────────────────────────────────────────────────
draw.text((cx("Serbian: One Language, Two Scripts", font_title, W // 2), TITLE_Y),
          "Serbian: One Language, Two Scripts", font=font_title, fill=GOLD)

draw.text((cx("Every Cyrillic letter maps 1-to-1 to a Latin equivalent", font_sub, W // 2), SUB_Y),
          "Every Cyrillic letter maps 1-to-1 to a Latin equivalent", font=font_sub, fill=SUBTEXT)

draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)

for label, x in [("SERBIAN CYRILLIC", col_cyr), ("SERBIAN LATIN", col_lat), ("MEANING", col_mean)]:
    draw.text((cx(label, font_col_hdr, x), COL_HDR_Y), label, font=font_col_hdr, fill=GOLD)

for i, (cyr, lat, meaning) in enumerate(pairs):
    baseline = FIRST_BASE_Y + i * PITCH
    if i:   # a faint rule in the gap above this row, never through any text
        rule_y = baseline - ABOVE - (PITCH - ABOVE - BELOW) // 2
        draw.rectangle([(40 * SCALE, rule_y), (W - 40 * SCALE, rule_y + SCALE - 1)], fill=ROW_RULE)
    layout.baseline_row(draw, baseline, [
        (cyr,     font_word,    CYR_COL, col_cyr),
        (lat,     font_word,    LAT_COL, col_lat),
        (meaning, font_meaning, SUBTEXT, col_mean),
    ])

note = "Serbia's constitution puts Cyrillic into official use. Latin is used alongside it every day."
draw.text((cx(note, font_meaning, W // 2), NOTE_Y), note, font=font_meaning, fill=SUBTEXT)
draw.text((cx("cyrilica.com", font_wm, W // 2), WM_Y), "cyrilica.com", font=font_wm, fill=WATERMARK)

out = os.path.join(ROOT, "images", "serbian-cyrillic-vs-latin.png")
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
