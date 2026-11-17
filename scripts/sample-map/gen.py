"""Generates the CocoaJourney sample map ("The Sunken Abbey") as SVG.

Run:  python3 scripts/sample-map/gen.py > scripts/sample-map/abbey.svg
Then: python3 scripts/sample-map/render.py   (rasterises to src/assets/sample-map.webp)
"""
import math
import random

W, H = 1680, 1120
rnd = random.Random(7)
out = []
p = out.append

GREENS = ["#7E9466", "#6F8659", "#8C9B7A", "#66775B", "#93A07A"]


def tree(x, y, r):
    c = rnd.choice(GREENS)
    p(f'<circle cx="{x+r*0.25:.1f}" cy="{y+r*0.35:.1f}" r="{r:.1f}" fill="#2E3A26" opacity=".28"/>')
    p(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="{c}" stroke="#4A5A3E" stroke-width="2"/>')
    for _ in range(3):
        a = rnd.uniform(0, 6.28)
        d = rnd.uniform(0.2, 0.5) * r
        p(f'<circle cx="{x+math.cos(a)*d:.1f}" cy="{y+math.sin(a)*d:.1f}" r="{r*rnd.uniform(.35,.5):.1f}" fill="{c}" stroke="#4A5A3E" stroke-width="1.4" opacity=".9"/>')
    p(f'<circle cx="{x-r*0.3:.1f}" cy="{y-r*0.32:.1f}" r="{r*0.28:.1f}" fill="#B8C49A" opacity=".55"/>')


def rock(x, y, r):
    pts = []
    n = rnd.randint(6, 8)
    for i in range(n):
        a = i / n * 6.283 + rnd.uniform(-.2, .2)
        rr = r * rnd.uniform(.7, 1.1)
        pts.append(f"{x+math.cos(a)*rr:.1f},{y+math.sin(a)*rr*0.8:.1f}")
    p(f'<polygon points="{" ".join(pts)}" fill="#A79C8C" stroke="#5E5346" stroke-width="2" stroke-linejoin="round"/>')
    p(f'<ellipse cx="{x-r*.25:.1f}" cy="{y-r*.25:.1f}" rx="{r*.35:.1f}" ry="{r*.2:.1f}" fill="#D3CABA" opacity=".6"/>')


def inside(x, y, box, m=0):
    x0, y0, x1, y1 = box
    return x0 - m < x < x1 + m and y0 - m < y < y1 + m


ABBEY = (520, 240, 1160, 656)
ROAD_X = 840


def river_y(x):
    return 900 + 40 * math.sin(x / 260) + 30 * math.sin(x / 110 + 1)


def blocked(x, y, m=30):
    if inside(x, y, ABBEY, 60 + m):
        return True
    if abs(x - ROAD_X) < 50 + m and y > 600:
        return True
    if abs(y - river_y(x)) < 70 + m:
        return True
    if math.hypot(x - 260, y - 700) < 140 + m:
        return True
    if math.hypot(x - 1420, y - 620) < 120 + m:
        return True
    if inside(x, y, (1210, 300, 1330, 560), m):
        return True
    return False


p(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">')
p('''<defs>
<filter id="paper" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="3"/>
  <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .32  0 0 0 0 .2  0 0 0 .09 0"/>
</filter>
<filter id="blotch" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="3" seed="11"/>
  <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .5  0 0 0 0 .3  0 0 0 .5 -.1"/>
</filter>
<pattern id="flag" width="56" height="56" patternUnits="userSpaceOnUse">
  <rect width="56" height="56" fill="#D8CBB2"/>
  <path d="M0 0 H56 V56 H0 Z M28 0 V28 M0 28 H56 M14 28 V56 M42 28 V56" fill="none" stroke="#B5A68D" stroke-width="2"/>
  <rect x="3" y="3" width="22" height="22" fill="#DDD1BA"/>
  <rect x="31" y="31" width="8" height="22" fill="#CFC1A6"/>
</pattern>
<radialGradient id="vig" cx="50%" cy="50%" r="75%">
  <stop offset="60%" stop-color="#3A2A20" stop-opacity="0"/>
  <stop offset="100%" stop-color="#3A2A20" stop-opacity=".35"/>
</radialGradient>
</defs>''')

# ground
p(f'<rect width="{W}" height="{H}" fill="#E3D5B5"/>')
p(f'<rect width="{W}" height="{H}" filter="url(#blotch)"/>')

# meadow tints
for _ in range(26):
    x, y = rnd.uniform(0, W), rnd.uniform(0, H)
    p(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rnd.uniform(80,220):.0f}" ry="{rnd.uniform(50,140):.0f}" fill="#B9C394" opacity=".22"/>')

# grass tufts
for _ in range(520):
    x, y = rnd.uniform(0, W), rnd.uniform(0, H)
    if blocked(x, y, 0):
        continue
    p(f'<path d="M{x:.0f} {y:.0f} l-3 -7 M{x:.0f} {y:.0f} l0 -9 M{x:.0f} {y:.0f} l3 -7" stroke="#7C8A5E" stroke-width="1.4" stroke-linecap="round" opacity=".55"/>')

# river
pts = [(x, river_y(x)) for x in range(-40, W + 41, 20)]
d = "M" + " L".join(f"{x:.0f} {y:.0f}" for x, y in pts)
p(f'<path d="{d}" fill="none" stroke="#B8B48C" stroke-width="128" stroke-linecap="round" stroke-linejoin="round"/>')
p(f'<path d="{d}" fill="none" stroke="#7E9C98" stroke-width="96" stroke-linecap="round" stroke-linejoin="round"/>')
p(f'<path d="{d}" fill="none" stroke="#94B2AC" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"/>')
for _ in range(60):
    x = rnd.uniform(0, W)
    y = river_y(x) + rnd.uniform(-30, 30)
    p(f'<path d="M{x:.0f} {y:.0f} q12 -5 24 0" fill="none" stroke="#DDEAE4" stroke-width="2" stroke-linecap="round" opacity=".7"/>')

# road
p(f'<path d="M{ROAD_X} 660 C {ROAD_X-10} 760, {ROAD_X+16} 820, {ROAD_X} 900 S {ROAD_X-20} 1040, {ROAD_X+10} 1140" fill="none" stroke="#B59E78" stroke-width="58" stroke-linecap="round"/>')
p(f'<path d="M{ROAD_X} 660 C {ROAD_X-10} 760, {ROAD_X+16} 820, {ROAD_X} 900 S {ROAD_X-20} 1040, {ROAD_X+10} 1140" fill="none" stroke="#CDB892" stroke-width="44" stroke-linecap="round"/>')
p(f'<path d="M{ROAD_X-40} 700 C 600 720, 420 700, 300 720" fill="none" stroke="#CDB892" stroke-width="26" stroke-linecap="round" stroke-dasharray="1 0" opacity=".9"/>')
for _ in range(80):
    y = rnd.uniform(680, 1120)
    x = ROAD_X + rnd.uniform(-16, 16)
    p(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{rnd.uniform(1.5,3):.1f}" fill="#9C8664" opacity=".6"/>')

# bridge
by = river_y(ROAD_X)
p(f'<g transform="translate({ROAD_X} {by:.0f})">')
p('<rect x="-40" y="-92" width="80" height="184" rx="4" fill="#8A6545" stroke="#4E3826" stroke-width="3"/>')
for i in range(-88, 92, 14):
    p(f'<path d="M-38 {i} H38" stroke="#5E4330" stroke-width="2"/>')
p('<rect x="-46" y="-96" width="8" height="192" rx="3" fill="#6B4A33" stroke="#3E2A1C" stroke-width="2"/>')
p('<rect x="38" y="-96" width="8" height="192" rx="3" fill="#6B4A33" stroke="#3E2A1C" stroke-width="2"/>')
p('</g>')

# abbey floor
x0, y0, x1, y1 = ABBEY
p(f'<rect x="{x0+6}" y="{y0+6}" width="{x1-x0}" height="{y1-y0}" fill="#3A2A20" opacity=".2"/>')
p(f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="url(#flag)"/>')
# moss on floor
for _ in range(40):
    x, y = rnd.uniform(x0, x1), rnd.uniform(y0, y1)
    p(f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rnd.uniform(10,40):.0f}" ry="{rnd.uniform(6,20):.0f}" fill="#8C9B6A" opacity=".35"/>')

# flooded nave (the "sunken" part)
p('<path d="M960 380 Q1010 340 1080 372 Q1140 400 1130 470 Q1150 560 1090 600 Q1010 630 960 590 Q900 540 920 470 Q920 410 960 380 Z" fill="#6E8E8C" stroke="#4E6866" stroke-width="3"/>')
p('<path d="M975 400 Q1040 370 1100 410 Q1120 480 1100 560 Q1030 600 975 570 Q935 520 950 460 Z" fill="#87A7A3"/>')
for i in range(10):
    x = rnd.uniform(960, 1100)
    y = rnd.uniform(420, 570)
    p(f'<path d="M{x:.0f} {y:.0f} q10 -4 20 0" fill="none" stroke="#D8E8E2" stroke-width="2" opacity=".7"/>')
p('<rect x="1020" y="470" width="28" height="28" fill="#A79C8C" stroke="#5E5346" stroke-width="2" transform="rotate(18 1034 484)"/>')

# pillars
for row_y in (350, 540):
    for i, px in enumerate(range(620, 1100, 92)):
        broken = (row_y, i) in {(350, 4), (540, 3), (540, 5)}
        if 930 < px < 1110 and 380 < row_y < 600 and row_y == 540:
            continue
        p(f'<circle cx="{px+5}" cy="{row_y+7}" r="19" fill="#3A2A20" opacity=".25"/>')
        if broken:
            rock(px, row_y, 14)
            rock(px + 24, row_y + 16, 8)
        else:
            p(f'<circle cx="{px}" cy="{row_y}" r="18" fill="#C3B7A2" stroke="#5E5346" stroke-width="3"/>')
            p(f'<circle cx="{px}" cy="{row_y}" r="11" fill="#D6CCBA" stroke="#8E8170" stroke-width="1.5"/>')

# altar & carpet
p('<rect x="790" y="262" width="100" height="44" rx="4" fill="#A9997F" stroke="#4E4334" stroke-width="3"/>')
p('<rect x="806" y="270" width="68" height="28" rx="2" fill="#C9BB9F"/>')
p('<circle cx="826" cy="284" r="5" fill="#E8C46A"/><circle cx="856" cy="284" r="5" fill="#E8C46A"/>')
p('<rect x="815" y="312" width="50" height="330" fill="#9C3D35" opacity=".75"/>')
p('<rect x="815" y="312" width="50" height="330" fill="none" stroke="#C9A45C" stroke-width="3" stroke-dasharray="8 6" opacity=".9"/>')

# crypt stairs
p('<rect x="560" y="276" width="112" height="56" fill="#8E806C" stroke="#4E4334" stroke-width="3"/>')
for i in range(6):
    p(f'<rect x="{560+i*18}" y="278" width="18" height="52" fill="{["#B9AC95","#A99B84","#998B74","#897B66","#796B58","#5E5346"][i]}"/>')

# walls (with gaps for the gate and a collapsed corner)
WALL = "#8C7A66"
segments = [
    (x0, y0, 1060, y0), (x0, y0, x0, y1), (x1, 330, x1, y1),
    (x0, y1, 812, y1), (868, y1, x1, y1),
    (x0, 448, 700, 448),
]
for (a, b, c, e) in segments:
    p(f'<path d="M{a} {b} L{c} {e}" stroke="#3A2A20" stroke-width="32" stroke-linecap="square" opacity=".25" transform="translate(5 6)"/>')
    p(f'<path d="M{a} {b} L{c} {e}" stroke="{WALL}" stroke-width="28" stroke-linecap="square"/>')
    p(f'<path d="M{a} {b} L{c} {e}" stroke="#A8988A" stroke-width="12" stroke-linecap="square" stroke-dasharray="20 8"/>')
# collapsed corner rubble
for _ in range(16):
    rock(rnd.uniform(1070, 1190), rnd.uniform(220, 340), rnd.uniform(6, 16))
# gate posts
for gx in (800, 880):
    p(f'<rect x="{gx-14}" y="{y1-22}" width="28" height="44" rx="3" fill="#7A6A58" stroke="#3E3428" stroke-width="3"/>')

# graveyard
for i in range(5):
    for j in range(3):
        gx = 1230 + i * 22 + rnd.uniform(-3, 3)
        gy = 330 + j * 90 + i * 4
        p(f'<path d="M{gx-8} {gy+14} V{gy} a8 8 0 0 1 16 0 V{gy+14} Z" fill="#B7AD9C" stroke="#4E4334" stroke-width="2" transform="rotate({rnd.uniform(-10,10):.0f} {gx} {gy})"/>')
p('<path d="M1210 300 H1330 V560 H1210 Z" fill="none" stroke="#6B4A33" stroke-width="3" stroke-dasharray="4 8"/>')

# pond
p('<ellipse cx="1420" cy="620" rx="96" ry="64" fill="#B8B48C"/>')
p('<ellipse cx="1420" cy="620" rx="84" ry="54" fill="#7E9C98"/>')
p('<ellipse cx="1410" cy="612" rx="54" ry="30" fill="#9AB7B0"/>')
for (lx, ly) in [(1380, 600), (1450, 640), (1440, 596)]:
    p(f'<circle cx="{lx}" cy="{ly}" r="9" fill="#7E9466" stroke="#4A5A3E" stroke-width="1.5"/>')

# camp
cx, cy = 260, 700
p(f'<circle cx="{cx}" cy="{cy}" r="110" fill="#CDB892" opacity=".7"/>')
for i in range(10):
    a = i / 10 * 6.283
    rock(cx + math.cos(a) * 26, cy + math.sin(a) * 26, 7)
p(f'<path d="M{cx-22} {cy+8} L{cx+22} {cy-8} M{cx-22} {cy-8} L{cx+22} {cy+8}" stroke="#5E4330" stroke-width="8" stroke-linecap="round"/>')
p(f'<path d="M{cx} {cy-24} Q{cx+16} {cy-4} {cx+8} {cy+8} Q{cx} {cy+14} {cx-8} {cy+8} Q{cx-16} {cy-4} {cx} {cy-24} Z" fill="#D9824F" stroke="#9C4A2E" stroke-width="2"/>')
p(f'<path d="M{cx} {cy-12} Q{cx+8} {cy} {cx+3} {cy+6} Q{cx} {cy+8} {cx-3} {cy+6} Q{cx-8} {cy} {cx} {cy-12} Z" fill="#F2C14E"/>')
for (tx, ty, rot) in [(180, 620, -20), (340, 640, 15)]:
    p(f'<g transform="rotate({rot} {tx} {ty})"><path d="M{tx-34} {ty+26} L{tx} {ty-30} L{tx+34} {ty+26} Z" fill="#C17C61" stroke="#6E3A2C" stroke-width="3" stroke-linejoin="round"/><path d="M{tx} {ty-30} L{tx} {ty+26}" stroke="#6E3A2C" stroke-width="2"/></g>')
p('<rect x="300" y="760" width="40" height="26" rx="3" fill="#8A6545" stroke="#4E3826" stroke-width="2"/>')
p('<rect x="200" y="770" width="54" height="16" rx="8" fill="#6B4A33" stroke="#3E2A1C" stroke-width="2"/>')

# rocks
for _ in range(36):
    x, y = rnd.uniform(0, W), rnd.uniform(0, H)
    if not blocked(x, y, 10):
        rock(x, y, rnd.uniform(6, 16))

# forests (dense clusters + scattered trees)
clusters = [(180, 180, 260, 90), (1480, 160, 240, 80), (60, 520, 120, 30), (1560, 1060, 180, 40), (380, 1060, 180, 30), (1600, 760, 120, 26), (500, 80, 140, 26)]
trees = []
for (cx, cy, r, n) in clusters:
    for _ in range(n):
        a = rnd.uniform(0, 6.283)
        d = r * math.sqrt(rnd.random())
        trees.append((cx + math.cos(a) * d, cy + math.sin(a) * d * 0.8, rnd.uniform(22, 38)))
for _ in range(50):
    trees.append((rnd.uniform(0, W), rnd.uniform(0, H), rnd.uniform(20, 30)))
trees = [t for t in trees if not blocked(t[0], t[1], 10) and -20 < t[0] < W + 20 and -20 < t[1] < H + 20]
for t in sorted(trees, key=lambda t: t[1]):
    tree(*t)

# compass
p('<g transform="translate(110 1010)" opacity=".85">')
p('<circle r="46" fill="#EFE4CC" stroke="#72513D" stroke-width="3"/>')
p('<circle r="36" fill="none" stroke="#72513D" stroke-width="1.4" stroke-dasharray="3 4"/>')
p('<path d="M0 -40 L9 0 L0 40 L-9 0 Z" fill="#72513D"/><path d="M0 -40 L9 0 L-9 0 Z" fill="#C17C61"/>')
p('<path d="M-40 0 L0 7 L40 0 L0 -7 Z" fill="#A68B70"/>')
p('</g>')

# paper grain + vignette
p(f'<rect width="{W}" height="{H}" filter="url(#paper)"/>')
p(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')
p('</svg>')
print("\n".join(out))
