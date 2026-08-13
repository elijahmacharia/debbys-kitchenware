#!/usr/bin/env python3
"""
Draws the app icons: a lidded cooking pot over the shop name.

Why a script and not an image editor: this build environment has no image
libraries and no font files, so both the pot and the lettering are described as
geometry and rasterised here by hand. Everything is supersampled and averaged
down, which is what keeps the curves smooth instead of jagged.

Run:  python3 scripts/generate-icons.py
Nothing else depends on this file at build or run time. It exists so the mark
can be regenerated at new sizes without redrawing it by eye.
"""
import struct, zlib, math, pathlib

INK   = (17, 17, 16)      # tile background, matches --ink
WHITE = (255, 255, 255)   # pot and lettering
CLAY  = (173, 71, 40)     # lid knob, the single accent, matches --clay-600

BG, FG, AC = 0, 1, 2      # layer ids returned by the sampler


# --- geometry helpers --------------------------------------------------------

def in_ellipse(x, y, cx, cy, rx, ry):
    if rx <= 0 or ry <= 0:
        return False
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0


def in_round_rect(x, y, x0, y0, x1, y1, r):
    if not (x0 <= x <= x1 and y0 <= y <= y1):
        return False
    r = min(r, (x1 - x0) / 2, (y1 - y0) / 2)
    cx = min(max(x, x0 + r), x1 - r)
    cy = min(max(y, y0 + r), y1 - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def near_segment(x, y, ax, ay, bx, by, half):
    """Used for the diagonals of the Y."""
    dx, dy = bx - ax, by - ay
    L2 = dx * dx + dy * dy
    t = 0.0 if L2 == 0 else max(0.0, min(1.0, ((x - ax) * dx + (y - ay) * dy) / L2))
    px, py = ax + t * dx, ay + t * dy
    return (x - px) ** 2 + (y - py) ** 2 <= half * half


def in_ring(x, y, cx, cy, rx, ry, t):
    """A stroked ellipse: inside the outer, outside the inner."""
    return in_ellipse(x, y, cx, cy, rx, ry) and not in_ellipse(x, y, cx, cy, rx - t, ry - t)


# --- letterforms -------------------------------------------------------------
# Drawn as geometry rather than a bitmap font, so the wordmark has real stems
# and bowls instead of staircase edges. Each glyph is described inside a box of
# height H with the pen at its top-left corner. Only the six characters the
# name needs are here; add more the same way if the name ever changes.

def glyph_width(ch, H):
    return {'D': 0.70, 'E': 0.62, 'B': 0.66, 'Y': 0.68, 'S': 0.62, "'": 0.20}[ch] * H


def in_glyph(ch, gx, gy, H):
    """gx, gy are already local to the glyph box."""
    T = 0.155 * H          # stroke thickness
    W = glyph_width(ch, H)

    if ch == 'E':
        if gx <= T and 0 <= gy <= H:
            return True
        if gy <= T or gy >= H - T:
            return 0 <= gx <= W
        if abs(gy - H / 2) <= T / 2:
            return 0 <= gx <= W * 0.84
        return False

    if ch == 'D':
        if gx <= T and 0 <= gy <= H:
            return True
        return (in_ring(gx, gy, T * 0.5, H / 2, W - T * 0.5, H / 2, T)
                and gx >= T * 0.5)

    if ch == 'B':
        if gx <= T and 0 <= gy <= H:
            return True
        top = in_ring(gx, gy, T * 0.5, H * 0.27, W - T * 0.5 - 0.03 * H, H * 0.27, T)
        bot = in_ring(gx, gy, T * 0.5, H * 0.73, W - T * 0.5, H * 0.27, T)
        return (top or bot) and gx >= T * 0.5

    if ch == 'Y':
        mid = H * 0.46
        if near_segment(gx, gy, 0, 0, W / 2, mid, T / 2):
            return True
        if near_segment(gx, gy, W, 0, W / 2, mid, T / 2):
            return True
        return near_segment(gx, gy, W / 2, mid, W / 2, H, T / 2)

    if ch == 'S':
        ry = H * 0.295
        # Upper bowl: keep everything except the lower-right quadrant, so the
        # stroke opens downward. Lower bowl mirrors it.
        up = in_ring(gx, gy, W / 2, ry, W / 2, ry, T) and not (gx > W / 2 and gy > ry)
        lo = in_ring(gx, gy, W / 2, H - ry, W / 2, ry, T) and not (gx < W / 2 and gy < H - ry)
        return up or lo

    if ch == "'":
        return in_round_rect(gx, gy, 0, 0, T * 0.95, H * 0.32, T * 0.4)

    return False


def word_width(word, H, tracking):
    total = sum(glyph_width(c, H) for c in word)
    return total + tracking * (len(word) - 1)


def in_word(x, y, word, H, ox, oy, tracking):
    if not (oy <= y <= oy + H):
        return False
    pen = ox
    for ch in word:
        w = glyph_width(ch, H)
        if pen <= x <= pen + w and in_glyph(ch, x - pen, y - oy, H):
            return True
        pen += w + tracking
    return False


# --- the mark ----------------------------------------------------------------

def make_sampler(S, with_text, art_scale):
    cx = S / 2
    cy = S * (0.435 if with_text else 0.5)
    k = S * art_scale

    body_top, body_bot = cy - 0.05 * k, cy + 0.21 * k
    half_top, half_bot = 0.190 * k, 0.152 * k
    foot_r = 0.055 * k

    rim_h = 0.050 * k
    rim_top = body_top - rim_h
    rim_half = 0.198 * k
    dome_rx, dome_ry = 0.115 * k, 0.052 * k
    knob_r = 0.034 * k
    knob_cy = rim_top - dome_ry - knob_r * 0.45

    h_top, h_bot = body_top + 0.055 * k, body_top + 0.110 * k
    h_thick = 0.068 * k

    word, H = "DEBBY'S", 0.108 * S
    tracking = 0.055 * H
    text_ox = cx - word_width(word, H, tracking) / 2
    text_oy = cy + 0.30 * k

    def body_half(y):
        t = (y - body_top) / (body_bot - body_top)
        return half_top + (half_bot - half_top) * t

    def sample(x, y):
        if in_ellipse(x, y, cx, knob_cy, knob_r, knob_r):
            return AC
        # Lid: a shallow dome sitting on a flat rim.
        if y <= rim_top and in_ellipse(x, y, cx, rim_top, dome_rx, dome_ry):
            return FG
        if in_round_rect(x, y, cx - rim_half, rim_top, cx + rim_half, body_top, rim_h * 0.45):
            return FG
        # Handles, tucked into the body so they read as attached.
        if h_top <= y <= h_bot:
            inner = body_half(y) - 0.02 * k
            if in_round_rect(x, y, cx + inner, h_top, cx + inner + h_thick, h_bot, (h_bot - h_top) * 0.45):
                return FG
            if in_round_rect(x, y, cx - inner - h_thick, h_top, cx - inner, h_bot, (h_bot - h_top) * 0.45):
                return FG
        # Tapered body with a softened foot.
        if body_top <= y <= body_bot:
            hw = body_half(y)
            if y > body_bot - foot_r:
                d = y - (body_bot - foot_r)
                hw -= foot_r - math.sqrt(max(0.0, foot_r * foot_r - d * d))
            if abs(x - cx) <= hw:
                return FG
        if with_text and in_word(x, y, word, H, text_ox, text_oy, tracking):
            return FG
        return BG

    return sample


def render(S, with_text=True, art_scale=1.0, ss=3):
    """Supersamples ss x ss per pixel and averages, which is what removes the
    staircase edges from the curves and the lettering."""
    sample = make_sampler(S, with_text, art_scale)
    step = 1.0 / ss
    off = step / 2
    n = ss * ss
    rows = []
    for py in range(S):
        row = bytearray()
        row.append(0)  # PNG filter byte: none
        for px in range(S):
            counts = [0, 0, 0]
            for sy in range(ss):
                y = py + off + sy * step
                for sx in range(ss):
                    counts[sample(px + off + sx * step, y)] += 1
            if counts[BG] == n:
                row += bytes(INK)
            elif counts[FG] == n:
                row += bytes(WHITE)
            elif counts[AC] == n:
                row += bytes(CLAY)
            else:
                row += bytes(
                    round((INK[c] * counts[BG] + WHITE[c] * counts[FG] + CLAY[c] * counts[AC]) / n)
                    for c in range(3)
                )
        rows.append(bytes(row))
    return png(S, S, b''.join(rows))


def png(w, h, raw):
    def chunk(tag, data):
        c = tag + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(raw, 9))
            + chunk(b'IEND', b''))


if __name__ == '__main__':
    root = pathlib.Path(__file__).resolve().parent.parent
    (root / 'public' / 'icons').mkdir(parents=True, exist_ok=True)
    out = {
        'public/icons/icon-192.png': render(192, True, 1.0, ss=4),
        'public/icons/icon-512.png': render(512, True, 1.0, ss=3),
        # Android crops maskable icons to a circle, so: pot only, name dropped
        # because it would be sliced off. Scaled up to fill the tile properly
        # while still landing inside the middle 80% safe zone — at 1.4 the art
        # spans roughly 17%-83% horizontally and 21%-80% vertically.
        'public/icons/maskable-512.png': render(512, False, 1.40, ss=3),
        'src/app/apple-icon.png': render(180, True, 1.0, ss=4),
    }
    for rel, data in out.items():
        (root / rel).write_bytes(data)
        print(f'{rel}  {len(data)} bytes')
