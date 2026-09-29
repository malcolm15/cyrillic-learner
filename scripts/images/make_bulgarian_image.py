import os

from PIL import Image, ImageDraw, ImageFont

# Repo root, resolved from this file so the script runs from any directory.
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

# Left side (DIFFERENT IN BULGARIAN): 2 rows, single column at W//4
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

def ink(text, font):
    """Where a string's actual ink starts and ends, relative to its draw point."""
    bb = _d.textbbox((0, 0), text, font=font)
    return bb[1], bb[3]

# Spacing is measured ink to ink, not from a fixed sample glyph, so a letter with
# a descender (Щ) clears its label by the same amount as one without (Ъ). The four
# values are the medians measured off ukrainian-vs-russian-alphabet.png.
GAP_LS_INK   = round(12.5 * SCALE)  # glyph ink bottom   -> label ink top
GAP_SE_INK   = round(9.5 * SCALE)   # label ink bottom   -> example ink top
ROW_GAP_INK  = round(45.5 * SCALE)  # example ink bottom -> next row's glyph ink top
NOTE_GAP_INK = 14 * SCALE           # example ink bottom -> note ink top

ROW_0 = [left[0], right_row0[0], right_row0[1]]
ROW_1 = [left[1], right_row1]

def row_lines(cells):
    """One shared label line and one shared example line for a whole row.

    Both are set by the deepest ink in the row, so a descending letter cannot
    reach its neighbour's label and every label in the row stays level.
    """
    label_top   = max(ink(c[0], font_letter)[1] for c in cells) + GAP_LS_INK
    label_h     = max(ink(c[1], font_sound)[1] - ink(c[1], font_sound)[0] for c in cells)
    example_top = label_top + label_h + GAP_SE_INK
    return label_top, example_top

def cell_offsets(letter, sound, example, lines):
    """Draw-point offsets inside one cell, plus the cell's own ink bottom."""
    label_top, example_top = lines
    snd_top, _      = ink(sound,   font_sound)
    ex_top,  ex_bot = ink(example, font_example)
    return label_top - snd_top, example_top - ex_top, example_top - ex_top + ex_bot

LINES_0 = row_lines(ROW_0)
LINES_1 = row_lines(ROW_1)

row_0_ink_bottom = max(cell_offsets(*c, LINES_0)[2] for c in ROW_0)
row_1_ink_bottom = max(cell_offsets(*c, LINES_1)[2] for c in ROW_1)
row_1_ink_top    = min(ink(c[0], font_letter)[0] for c in ROW_1)

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

note = "Bulgarian = 30 letters  ·  Russian = 33 letters  ·  3 letters absent"
NOTE_Y = ROW_1_Y + row_1_ink_bottom + NOTE_GAP_INK - ink(note, font_note)[0]
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

draw.text((cx("30 letters vs 33. What sounds different and what's missing.", font_sub, W // 2), SUB_Y),
          "30 letters vs 33. What sounds different and what's missing.", font=font_sub, fill=SUBTEXT)

draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)
draw.rectangle([(mid_x - SCALE, HDR_DIV_Y), (mid_x + SCALE, NOTE_Y - 8 * SCALE)], fill=DIVIDER)

draw.text((cx("DIFFERENT IN BULGARIAN", font_col_hdr, W // 4),     COL_HDR_Y),
          "DIFFERENT IN BULGARIAN", font=font_col_hdr, fill=BG_COL)
draw.text((cx("NOT IN BULGARIAN",    font_col_hdr, 3 * W // 4), COL_HDR_Y),
          "NOT IN BULGARIAN",    font=font_col_hdr, fill=RU_COL)

def draw_cell(letter, sound, example, x_center, row_y, letter_col, lines):
    sound_dy, example_dy, _ = cell_offsets(letter, sound, example, lines)
    draw.text((cx(letter,  font_letter,  x_center), row_y),
              letter, font=font_letter, fill=letter_col)
    draw.text((cx(sound,   font_sound,   x_center), row_y + sound_dy),
              sound, font=font_sound, fill=WHITE)
    draw.text((cx(example, font_example, x_center), row_y + example_dy),
              example, font=font_example, fill=SUBTEXT)

# Left: 2-row single column at W//4
draw_cell(*left[0], W // 4, ROW_0_Y, BG_COL, LINES_0)
draw_cell(*left[1], W // 4, ROW_1_Y, BG_COL, LINES_1)

# Right row 0: Ё and Ы at 5W//8 and 7W//8
draw_cell(*right_row0[0], 5 * W // 8, ROW_0_Y, RU_COL, LINES_0)
draw_cell(*right_row0[1], 7 * W // 8, ROW_0_Y, RU_COL, LINES_0)

# Right row 1: Э centered in right half
draw_cell(*right_row1, 3 * W // 4, ROW_1_Y, RU_COL, LINES_1)

draw.text((cx(note, font_note, W // 2), NOTE_Y), note, font=font_note, fill=SUBTEXT)
draw.text((cx("cyrilica.com", font_wm, W // 2), WM_Y), "cyrilica.com", font=font_wm, fill=WATERMARK)

out = os.path.join(ROOT, "images", "bulgarian-vs-russian-alphabet.png")
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
