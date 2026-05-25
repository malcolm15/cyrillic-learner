from PIL import Image, ImageDraw, ImageFont

SCALE = 2
W_DISP = 700
W = W_DISP * SCALE

BG        = (26, 26, 46)
GOLD      = (255, 196, 37)
CYR_COL   = (90, 160, 255)
LAT_COL   = (60, 200, 120)
WHITE     = (255, 255, 255)
SUBTEXT   = (160, 160, 195)
DIVIDER   = (55, 55, 85)
WATERMARK = (85, 85, 115)

SUPP = "/System/Library/Fonts/Supplemental/"
UNI  = "/Library/Fonts/Arial Unicode.ttf"

font_title   = ImageFont.truetype(SUPP + "Arial Bold.ttf",  20 * SCALE)
font_sub     = ImageFont.truetype(SUPP + "Arial.ttf",       11 * SCALE)
font_col_hdr = ImageFont.truetype(SUPP + "Arial Bold.ttf",  11 * SCALE)
font_cyril   = ImageFont.truetype(UNI,                       18 * SCALE)
font_latin   = ImageFont.truetype(SUPP + "Arial Bold.ttf",  16 * SCALE)
font_meaning = ImageFont.truetype(SUPP + "Arial.ttf",       10 * SCALE)
font_wm      = ImageFont.truetype(SUPP + "Arial.ttf",       10 * SCALE)

# (Cyrillic, Latin, English meaning)
pairs = [
    ("Београд",      "Beograd",      "Belgrade — capital city"),
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

def text_w(text, font):
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]

# ── vertical layout ────────────────────────────────────────────────
PAD          = 20 * SCALE
TITLE_Y      = PAD
title_h      = text_h("Serbian", font_title)
SUB_Y        = TITLE_Y + title_h + 10 * SCALE   # 10px breathing room
sub_h        = text_h("sub", font_sub)
HDR_DIV_Y    = SUB_Y + sub_h + 12 * SCALE
COL_HDR_Y    = HDR_DIV_Y + 10 * SCALE
col_hdr_h    = text_h("CYRILLIC", font_col_hdr)

WORD_H       = text_h("Београд", font_cyril)
MEAN_H       = text_h("meaning", font_meaning)
ROW_H        = WORD_H + 4 * SCALE + MEAN_H   # word + gap + meaning
ROW_GAP      = 10 * SCALE
ROWS_START_Y = COL_HDR_Y + col_hdr_h + 14 * SCALE

rows_total_h = len(pairs) * ROW_H + (len(pairs) - 1) * ROW_GAP

NOTE_Y = ROWS_START_Y + rows_total_h + 14 * SCALE
WM_Y   = NOTE_Y + text_h("note", font_meaning) + 6 * SCALE
H      = WM_Y + text_h("cyrilica.com", font_wm) + 14 * SCALE

img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

def cx(text, font, x_center):
    bb = draw.textbbox((0, 0), text, font=font)
    return x_center - (bb[2] - bb[0]) // 2

mid_x   = W // 2
col_cyr = W // 4
col_lat = 3 * W // 4

# ── draw ───────────────────────────────────────────────────────────
draw.text((cx("Serbian: One Language, Two Scripts", font_title, W // 2), TITLE_Y),
          "Serbian: One Language, Two Scripts", font=font_title, fill=GOLD)

draw.text((cx("Every Cyrillic letter maps 1-to-1 to a Latin equivalent", font_sub, W // 2), SUB_Y),
          "Every Cyrillic letter maps 1-to-1 to a Latin equivalent", font=font_sub, fill=SUBTEXT)

draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)
draw.rectangle([(mid_x - SCALE, HDR_DIV_Y), (mid_x + SCALE, ROWS_START_Y + rows_total_h)], fill=DIVIDER)

draw.text((cx("SERBIAN CYRILLIC", font_col_hdr, col_cyr), COL_HDR_Y),
          "SERBIAN CYRILLIC", font=font_col_hdr, fill=CYR_COL)
draw.text((cx("SERBIAN LATIN", font_col_hdr, col_lat), COL_HDR_Y),
          "SERBIAN LATIN", font=font_col_hdr, fill=LAT_COL)

for i, (cyr, lat, meaning) in enumerate(pairs):
    y = ROWS_START_Y + i * (ROW_H + ROW_GAP)
    draw.text((cx(cyr, font_cyril, col_cyr), y), cyr, font=font_cyril, fill=CYR_COL)
    draw.text((cx(lat, font_latin, col_lat), y + (WORD_H - text_h(lat, font_latin)) // 2),
              lat, font=font_latin, fill=LAT_COL)
    draw.text((cx(meaning, font_meaning, W // 2), y + WORD_H + 4 * SCALE),
              meaning, font=font_meaning, fill=SUBTEXT)

note = "Serbia officially recognizes both scripts — the only country to do so"
draw.text((cx(note, font_meaning, W // 2), NOTE_Y), note, font=font_meaning, fill=SUBTEXT)
draw.text((cx("cyrilica.com", font_wm, W // 2), WM_Y), "cyrilica.com", font=font_wm, fill=WATERMARK)

out = "images/serbian-cyrillic-vs-latin.png"
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
