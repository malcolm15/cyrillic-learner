from PIL import Image, ImageDraw, ImageFont

SCALE = 2
W_DISP = 700
W = W_DISP * SCALE

BG        = (26, 26, 46)
GOLD      = (255, 196, 37)
BG_COL    = (60, 200, 120)   # green for Bulgarian
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

# Left side (UNIQUE IN BULGARIAN): 2 rows, single column at W//4
# Right side (NOT IN BULGARIAN): row 0 = Ё at 5W//8, Ы at 7W//8; row 1 = Э centered at 3W//4
left = [
    ("Ъ", "/ǎ/",   "ъгъл = corner"),
    ("Щ", "/sht/", "защо = why"),
]
right_row0 = [
    ("Ё", "/yo/", "Russian: ёж"),
    ("Ы", "/y/",  "Russian: мы"),
]
right_row1 = ("Э", "/e/", "Russian: это")

# ── measure ──────────────────────────────────────────────────────────
_tmp = Image.new("RGB", (10, 10))
_d   = ImageDraw.Draw(_tmp)

def text_h(text, font):
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[3] - bb[1]

LETTER_H  = text_h("Ъ", font_letter)
SOUND_H   = text_h("/g/", font_sound)
EXAMPLE_H = text_h("test", font_example)
GAP_LS    = 22 * SCALE
GAP_SE    = 8 * SCALE

CELL_CONTENT_H = LETTER_H + GAP_LS + SOUND_H + GAP_SE + EXAMPLE_H

# ── vertical layout ────────────────────────────────────────────────
TITLE_Y   = 20 * SCALE
title_h   = text_h("Cyrillic", font_title)
SUB_Y     = TITLE_Y + title_h + 6 * SCALE
sub_h     = text_h("sub", font_sub)
HDR_DIV_Y = SUB_Y + sub_h + 10 * SCALE
COL_HDR_Y = HDR_DIV_Y + 12 * SCALE
col_hdr_h = text_h("ONLY", font_col_hdr)

ROW_PAD_TOP   = 22 * SCALE
ROW_INNER_GAP = 28 * SCALE
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

mid_x = W // 2

# ── draw ───────────────────────────────────────────────────────────
draw.text((cx("Bulgarian Cyrillic vs Russian Cyrillic", font_title, W // 2), TITLE_Y),
          "Bulgarian Cyrillic vs Russian Cyrillic", font=font_title, fill=GOLD)

draw.text((cx("30 letters vs 33 — what sounds different and what's missing", font_sub, W // 2), SUB_Y),
          "30 letters vs 33 — what sounds different and what's missing", font=font_sub, fill=SUBTEXT)

draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)
draw.rectangle([(mid_x - SCALE, HDR_DIV_Y), (mid_x + SCALE, NOTE_Y - 8 * SCALE)], fill=DIVIDER)

draw.text((cx("UNIQUE IN BULGARIAN", font_col_hdr, W // 4),     COL_HDR_Y),
          "UNIQUE IN BULGARIAN", font=font_col_hdr, fill=BG_COL)
draw.text((cx("NOT IN BULGARIAN",    font_col_hdr, 3 * W // 4), COL_HDR_Y),
          "NOT IN BULGARIAN",    font=font_col_hdr, fill=RU_COL)

def draw_cell(letter, sound, example, x_center, row_y, letter_col):
    draw.text((cx(letter,  font_letter,  x_center), row_y),
              letter, font=font_letter, fill=letter_col)
    draw.text((cx(sound,   font_sound,   x_center), row_y + LETTER_H + GAP_LS),
              sound, font=font_sound, fill=WHITE)
    draw.text((cx(example, font_example, x_center), row_y + LETTER_H + GAP_LS + SOUND_H + GAP_SE),
              example, font=font_example, fill=SUBTEXT)

# Left: 2-row single column at W//4
draw_cell(*left[0], W // 4, ROW_0_Y, BG_COL)
draw_cell(*left[1], W // 4, ROW_1_Y, BG_COL)

# Right row 0: Ё and Ы at 5W//8 and 7W//8
draw_cell(*right_row0[0], 5 * W // 8, ROW_0_Y, RU_COL)
draw_cell(*right_row0[1], 7 * W // 8, ROW_0_Y, RU_COL)

# Right row 1: Э centered in right half
draw_cell(*right_row1, 3 * W // 4, ROW_1_Y, RU_COL)

note = "Bulgarian = 30 letters  ·  Russian = 33 letters  ·  3 letters absent"
draw.text((cx(note, font_note, W // 2), NOTE_Y), note, font=font_note, fill=SUBTEXT)
draw.text((cx("cyrilica.com", font_wm, W // 2), WM_Y), "cyrilica.com", font=font_wm, fill=WATERMARK)

out = "images/bulgarian-vs-russian-alphabet.png"
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
