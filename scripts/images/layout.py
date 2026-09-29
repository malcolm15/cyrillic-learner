"""Shared layout helpers for the image generators in this directory.

Two rules live here, both learned from earlier batches.

baseline_row
    Pillow anchors text at the font's ascender line, so strings set in
    different fonts and drawn at the same y land on different baselines. The
    Serbian word-pairs image drifted 5 to 8px that way, because its three
    fonts have ascents of 39, 29 and 19. Anchoring on the baseline instead
    puts a row of mixed fonts on one line by construction.

stacked_row_lines
    The row-aligned rule settled in Batch 38c (ledger row 308), for the
    images that stack a label and an example under a big glyph: every band in
    a row shares one ink-top line, set below the deepest ink of the band
    above. A letter with a descender therefore cannot reach its neighbour's
    label, and every label in the row stays level.

The image rebuilds tracked in ledger rows 302 to 305 are meant to adopt it
rather than rediscover either rule.

Every measurement here is ink, not the font's notional box, and every y is in
device pixels at the caller's SCALE.
"""


def ink(draw, text, font):
    """Ink top and bottom of a string, relative to its own draw point."""
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[1], bb[3]


def ink_about_baseline(draw, text, font):
    """How far a string's ink reaches above and below its baseline."""
    bb = draw.textbbox((0, 0), text, font=font, anchor="ls")
    return -bb[1], bb[3]


def centred_on_baseline(draw, text, font, x_center, baseline_y):
    """The draw point that centres a string's ink and sits it on a baseline.

    Centring is on the ink box rather than the advance width, so a string with
    uneven side bearings still looks centred.
    """
    bb = draw.textbbox((0, 0), text, font=font, anchor="ls")
    return x_center - (bb[0] + bb[2]) // 2, baseline_y


def centred_x(draw, text, font, x_center):
    """The draw x that centres a string's ink on x_center, for a top-anchored draw.

    New and rebuilt image scripts call this. The older generators keep their own
    local cx() until each is next rebuilt; nothing is retrofitted here.
    """
    bb = draw.textbbox((0, 0), text, font=font)
    return x_center - (bb[2] - bb[0]) // 2


def baseline_row(draw, baseline_y, items):
    """Draw several strings on one shared baseline.

    items: an iterable of (text, font, fill, x_center). Fonts may differ; the
    baselines match exactly, because each string is anchored on its baseline
    rather than on its ascender line.
    """
    for text, font, fill, x_center in items:
        draw.text(centred_on_baseline(draw, text, font, x_center, baseline_y),
                  text, font=font, fill=fill, anchor="ls")


def row_extent(draw, items):
    """(above, below) how far a whole row's ink reaches either side of its baseline.

    items: an iterable of (text, font). Use it to set the pitch between
    baseline rows without guessing from a sample string.
    """
    above = below = 0
    for text, font in items:
        a, b = ink_about_baseline(draw, text, font)
        above, below = max(above, a), max(below, b)
    return above, below


def stacked_row_lines(draw, cells, fonts, gaps):
    """Ledger row 308's rule: one shared ink-top line per band in a row.

    cells: the row's cells, each a tuple of strings, one string per band
    fonts: one font per band
    gaps:  the ink-to-ink gap between consecutive bands, so len(gaps) is
           len(fonts) - 1

    Returns the ink-top offset for bands 1 onward, relative to the row's draw
    point. Band 0 is the glyph itself and needs no line; it is drawn at the
    row's draw point as before.
    """
    tops = []
    prev_bottom = max(ink(draw, c[0], fonts[0])[1] for c in cells)
    for band, gap in enumerate(gaps, start=1):
        top = prev_bottom + gap
        height = max(
            ink(draw, c[band], fonts[band])[1] - ink(draw, c[band], fonts[band])[0]
            for c in cells
        )
        tops.append(top)
        prev_bottom = top + height
    return tops
