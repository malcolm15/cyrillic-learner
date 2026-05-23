from PIL import Image, ImageDraw, ImageFont

SCALE = 2
W_DISP, H_DISP = 700, 560
W, H = W_DISP * SCALE, H_DISP * SCALE

BG        = (26, 26, 46)
GOLD      = (255, 196, 37)
UA_COL    = (90, 180, 255)
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
font_letter  = ImageFont.truetype(UNI,                       64 * SCALE)  # big!
font_sound   = ImageFont.truetype(SUPP + "Arial Bold.ttf",  13 * SCALE)
font_example = ImageFont.truetype(UNI,                       11 * SCALE)
font_note    = ImageFont.truetype(SUPP + "Arial.ttf",        10 * SCALE)
font_wm      = ImageFont.truetype(SUPP + "Arial.ttf",        10 * SCALE)

# Letters arranged as 2×2 grid per side
# ua[row][col], ru[row][col]
ua = [
    [("Ґ", "/g/",   "ґанок = porch"),    ("Є", "/ye/",  "єдність = unity")],
    [("І", "/i/",   "іти = to go"),      ("Ї", "/yi/",  "їжа = food")],
]
ru = [
    [("Ё", "/yo/",      "Russian: ёж"),  ("Ъ", "hard sign", "Russian: об'єкт")],
    [("Ы", "/y/",       "Russian: мы"),  ("Э", "/e/",       "Russian: это")],
]

# ── measure real text heights ──────────────────────────────────────
_tmp = Image.new("RGB", (10, 10))
_d   = ImageDraw.Draw(_tmp)

def text_h(text, font):
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]

def text_w(text, font):
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]

LETTER_H  = text_h("Ґ", font_letter)
SOUND_H   = text_h("/g/", font_sound)
EXAMPLE_H = text_h("ґанок = porch", font_example)
GAP_LS    = 8 * SCALE   # letter → sound gap
GAP_SE    = 5 * SCALE   # sound  → example gap

CELL_CONTENT_H = LETTER_H + GAP_LS + SOUND_H + GAP_SE + EXAMPLE_H

# ── vertical layout ────────────────────────────────────────────────
TITLE_Y   = 20 * SCALE
title_h   = text_h("Cyrillic", font_title)
SUB_Y     = TITLE_Y + title_h + 6 * SCALE
sub_h     = text_h("sub", font_sub)
HDR_DIV_Y = SUB_Y + sub_h + 10 * SCALE          # thin rule
COL_HDR_Y = HDR_DIV_Y + 12 * SCALE
col_hdr_h = text_h("ONLY", font_col_hdr)

ROW_PAD_TOP    = 22 * SCALE   # space above first row
ROW_INNER_GAP  = 28 * SCALE   # gap between the two rows
ROW_0_Y = COL_HDR_Y + col_hdr_h + ROW_PAD_TOP
ROW_1_Y = ROW_0_Y + CELL_CONTENT_H + ROW_INNER_GAP

NOTE_Y = ROW_1_Y + CELL_CONTENT_H + 18 * SCALE
WM_Y   = NOTE_Y  + text_h("note", font_note) + 6 * SCALE
H      = WM_Y    + text_h("cyrilica.com", font_wm) + 16 * SCALE

img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

def cx(text, font, x_center):
    bb = draw.textbbox((0, 0), text, font=font)
    return x_center - (bb[2] - bb[0]) // 2

# Column centres for each of the 4 quadrants
# Left half  (0 … W//2):  col0 = W//8,   col1 = 3*W//8
# Right half (W//2 … W):  col0 = 5*W//8, col1 = 7*W//8
Q = [W // 8, 3 * W // 8, 5 * W // 8, 7 * W // 8]

mid_x = W // 2

# ── draw ───────────────────────────────────────────────────────────
# Title
draw.text((cx("Ukrainian Cyrillic vs Russian Cyrillic", font_title, W // 2), TITLE_Y),
          "Ukrainian Cyrillic vs Russian Cyrillic", font=font_title, fill=GOLD)

draw.text((cx("Letters that make Ukrainian unique", font_sub, W // 2), SUB_Y),
          "Letters that make Ukrainian unique", font=font_sub, fill=SUBTEXT)

# Horizontal rule
draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)

# Vertical divider
draw.rectangle([(mid_x - SCALE, HDR_DIV_Y), (mid_x + SCALE, NOTE_Y - 8 * SCALE)], fill=DIVIDER)

# Section headers
draw.text((cx("ONLY IN UKRAINIAN", font_col_hdr, W // 4),     COL_HDR_Y),
          "ONLY IN UKRAINIAN", font=font_col_hdr, fill=UA_COL)
draw.text((cx("NOT IN UKRAINIAN",  font_col_hdr, 3 * W // 4), COL_HDR_Y),
          "NOT IN UKRAINIAN",  font=font_col_hdr, fill=RU_COL)

def draw_cell(letter, sound, example, x_center, row_y, letter_col):
    draw.text((cx(letter,  font_letter,  x_center), row_y),
              letter, font=font_letter, fill=letter_col)
    draw.text((cx(sound,   font_sound,   x_center), row_y + LETTER_H + GAP_LS),
              sound, font=font_sound, fill=WHITE)
    draw.text((cx(example, font_example, x_center), row_y + LETTER_H + GAP_LS + SOUND_H + GAP_SE),
              example, font=font_example, fill=SUBTEXT)

# Ukrainian 2×2
for col_i, q_x in enumerate([Q[0], Q[1]]):
    draw_cell(*ua[0][col_i], q_x, ROW_0_Y, UA_COL)
    draw_cell(*ua[1][col_i], q_x, ROW_1_Y, UA_COL)

# Russian 2×2
for col_i, q_x in enumerate([Q[2], Q[3]]):
    draw_cell(*ru[0][col_i], q_x, ROW_0_Y, RU_COL)
    draw_cell(*ru[1][col_i], q_x, ROW_1_Y, RU_COL)

# Note + watermark
note = "Ukrainian = 33 letters  ·  Russian = 33 letters  ·  4 letters differ"
draw.text((cx(note, font_note, W // 2), NOTE_Y), note, font=font_note, fill=SUBTEXT)
draw.text((cx("cyrilica.com", font_wm, W // 2), WM_Y), "cyrilica.com", font=font_wm, fill=WATERMARK)

out = "images/ukrainian-vs-russian-alphabet.png"
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
