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
font_letter  = ImageFont.truetype(UNI,                       46 * SCALE)
font_latin   = ImageFont.truetype(SUPP + "Arial Bold.ttf",  13 * SCALE)
font_sound   = ImageFont.truetype(SUPP + "Arial.ttf",       11 * SCALE)
font_example = ImageFont.truetype(UNI,                       10 * SCALE)
font_wm      = ImageFont.truetype(SUPP + "Arial.ttf",       10 * SCALE)

letters = [
    ("Ђ", "Đ",  "/dj/",  "ђак = student"),
    ("Ј", "J",  "/j/",   "јесен = autumn"),
    ("Љ", "Lj", "/lj/",  "љубав = love"),
    ("Њ", "Nj", "/nj/",  "Њујорк = New York"),
    ("Ћ", "Ć",  "/ć/",   "ћерка = daughter"),
    ("Џ", "Dž", "/dž/",  "џем = jam"),
]

# ── use a real draw context for accurate textbbox measurements ───────
_tmp_img  = Image.new("RGB", (W * 2, 2000), BG)
_tmp_draw = ImageDraw.Draw(_tmp_img)

def bottom(text, font):
    """Returns bb[3]: how far below the draw point the glyph extends."""
    bb = _tmp_draw.textbbox((0, 0), text, font=font)
    return bb[3]

def cell_height():
    """Total height one cell occupies, measured with bb[3] chaining."""
    GAP_LLat = 10 * SCALE
    GAP_LS   = 8  * SCALE
    GAP_SE   = 6  * SCALE
    return (bottom("Ђ", font_letter) + GAP_LLat +
            bottom("→ Lj", font_latin) + GAP_LS +
            bottom("/dj/", font_sound) + GAP_SE +
            bottom("test", font_example))

CELL_H   = cell_height()
GAP_LLat = 10 * SCALE
GAP_LS   = 8  * SCALE
GAP_SE   = 6  * SCALE

# ── vertical layout ────────────────────────────────────────────────
PAD       = 20 * SCALE
TITLE_Y   = PAD
title_h   = bottom("Serbian", font_title)
SUB_Y     = TITLE_Y + title_h + 10 * SCALE
sub_h     = bottom("sub", font_sub)
HDR_DIV_Y = SUB_Y + sub_h + 12 * SCALE

ROW_GAP   = 28 * SCALE
ROW_0_Y   = HDR_DIV_Y + 16 * SCALE
ROW_1_Y   = ROW_0_Y + CELL_H + ROW_GAP

WM_Y = ROW_1_Y + CELL_H + 14 * SCALE
H    = WM_Y + bottom("cyrilica.com", font_wm) + 16 * SCALE

img  = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

def cx(text, font, x_center):
    bb = draw.textbbox((0, 0), text, font=font)
    return x_center - (bb[2] - bb[0]) // 2

col_xs = [W // 6, W // 2, 5 * W // 6]
div1_x = W // 3
div2_x = 2 * W // 3

# ── draw ───────────────────────────────────────────────────────────
draw.text((cx("6 Letters Unique to Serbian Cyrillic", font_title, W // 2), TITLE_Y),
          "6 Letters Unique to Serbian Cyrillic", font=font_title, fill=GOLD)

draw.text((cx("Not found in Russian — each maps perfectly to a Latin equivalent", font_sub, W // 2), SUB_Y),
          "Not found in Russian — each maps perfectly to a Latin equivalent", font=font_sub, fill=SUBTEXT)

draw.rectangle([(40 * SCALE, HDR_DIV_Y), (W - 40 * SCALE, HDR_DIV_Y + SCALE)], fill=DIVIDER)

div_top = HDR_DIV_Y + 8 * SCALE
div_bot = ROW_1_Y + CELL_H + 4 * SCALE
draw.rectangle([(div1_x - SCALE, div_top), (div1_x + SCALE, div_bot)], fill=DIVIDER)
draw.rectangle([(div2_x - SCALE, div_top), (div2_x + SCALE, div_bot)], fill=DIVIDER)

def draw_cell(letter, latin, sound, example, x_center, row_y):
    y = row_y
    # Cyrillic letter — advance by bb[3] so next item starts below glyph bottom
    draw.text((cx(letter, font_letter, x_center), y), letter, font=font_letter, fill=CYR_COL)
    y += bottom(letter, font_letter) + GAP_LLat

    lat_str = f"→ {latin}"
    draw.text((cx(lat_str, font_latin, x_center), y), lat_str, font=font_latin, fill=LAT_COL)
    y += bottom(lat_str, font_latin) + GAP_LS

    draw.text((cx(sound, font_sound, x_center), y), sound, font=font_sound, fill=WHITE)
    y += bottom(sound, font_sound) + GAP_SE

    draw.text((cx(example, font_example, x_center), y), example, font=font_example, fill=SUBTEXT)

for i, (letter, latin, sound, example) in enumerate(letters):
    col = i % 3
    row_y = ROW_0_Y if i < 3 else ROW_1_Y
    draw_cell(letter, latin, sound, example, col_xs[col], row_y)

draw.text((cx("cyrilica.com", font_wm, W // 2), WM_Y), "cyrilica.com", font=font_wm, fill=WATERMARK)

out = "images/serbian-unique-letters.png"
img.save(out, "PNG", optimize=True)
print(f"Saved {out}  ({W}x{H} px → displays at {W//SCALE}x{H//SCALE})")
