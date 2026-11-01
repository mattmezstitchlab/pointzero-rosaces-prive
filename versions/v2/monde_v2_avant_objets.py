"""LE MONDE AIME — v2 (proposition, d'après les références de direction artistique de Matt, 1/11/2026).

Même moteur, mêmes données, même calage sur les mots que la v1 (monde.py, conservée). Ce qui change :
  1. une toile plus fine (180 points de large au lieu de 120) ;
  2. un cadre de musée fixe (double filet doré, rosaces aux coins) et le titre du chapitre brodé en haut ;
  3. le tambour de la fleur en bas au centre (laiton, vis), une frise de feuillage et de bleuets qui s'allonge ;
  4. des liens au point arrière (pointillés dorés) quand la voix relie ;
  5. une palette plus harmonieuse (lin, or, bleu marine, terracotta, sauge) ;
  6. Saint-Luc (façade, cartouche, l'œil et les signes) et les années invisibles (fenêtre en arc, lune, lampe, bobines) redessinés.

  python3 -I monde_v2.py <sortie.mp4> [--images t1,t2,…]"""
import sys, os, json, subprocess, math, numpy as np
from PIL import Image, ImageDraw, ImageFont
ICI = os.path.dirname(os.path.abspath(__file__)); SCR = os.path.dirname(ICI)
sys.path.insert(0, os.path.join(SCR, 'uptown', 'outils')); import brodeur as B

_av = sys.argv; sys.argv = [_av[0], os.path.join(SCR, 'fleur', 'rythme.json'), '/dev/null', '--images', '0']
FL = {'__file__': os.path.join(SCR, 'fleur', 'fleur.py'), '__name__': 'fleur'}
exec(compile(open(os.path.join(SCR, 'fleur', 'fleur.py')).read().split('\nif planche:')[0], 'fleur.py', 'exec'), FL)
sys.argv = _av
PLANCHE = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--images'), None)
DST = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] != '--images'][0]

EXTRA = ['434', '801', '738', '437', '318', '414', '413', '310', '762', '321', '3753', '932', '930', '783', '725', '971', '740', '307',
         '950', '945', '793', '792', '820', '415', '822', '3781', '840', '3772', '407', '498', '3832', '3799', '445', '3371', '644', '3078', '3807',
         '3778', '356', '3777', '758', '3013', '3012', '3363', '3052', '677', '3046', '3045', '3782', '3863', '3864', '612', '613', '312', '334', '3750',
         '926', '927', '3041', '3042', '3726', '3727', '3787', '3051', '311']
CODES = FL['CODES'] + [c for c in dict.fromkeys(EXTRA) if c not in FL['CODES']]
IDX = {d['code']: i for i, d in enumerate(B.DMC)}
K = {c: k for k, c in enumerate(CODES)}; NP = len(CODES); TOILE = NP
RGB = np.array([B.DMC[IDX[c]]['rgb'] for c in CODES], float)
B.S = 6; B.N = B.S * B.SS; S = B.S
A = B.atlas([IDX[c] for c in CODES], np.random.default_rng(11))
VL = 120; KV = 1.5; V = int(VL * KV); OUT = V * S          # la vue : 120 unités = 180 points = 1080 px
KT = 1.3; TOP = 21                                          # la tapisserie : 1 unité = 1,1 point ; elle commence sous le titre
PXU = KV * S                                                # pixels par unité de la vue
PAN = 170; X0 = [10 + k * PAN for k in range(6)]
LARG = int((X0[-1] + 150) * KT) + 2; H = V
VAR = (np.add.outer(np.arange(H) * 7919, np.arange(LARG + V) * 104729) % 4)
rng = np.random.default_rng(3)

DEBUT = {1: .6, 2: 41.9, 3: 75.0, 4: 111.6, 5: 151.4, 6: 198.55, 7: 208.0, 8: 243.35}
MOTS = {int(k): v for k, v in json.load(open(os.path.join(ICI, 'mots.json'))).items()}
def mot(i, texte, n=1):
    for t0, t1, m in MOTS[i]:
        if texte.lower() in m.lower():
            n -= 1
            if n == 0: return DEBUT[i] + t0
    raise KeyError(f'{i}:{texte}')
SILENCE, AIGUS, IMPACT, PERLE, DUREE = 196.275, 196.775, 198.255, 242.75, 253.0
SERIF = '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'; SERIF_G = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
ITAL = '/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf'; ITAL_G = '/usr/share/fonts/truetype/freefont/FreeSerifBoldItalic.ttf'
SANS = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

class Dessin:
    """un dessin en unités, rendu à 8 px par point (k points par unité), puis chaque point prend le fil le plus présent"""
    def __init__(self, w, h, k=KT):
        self.k = k; self.q = 8 * k; self.w, self.h = int(math.ceil(w * k)), int(math.ceil(h * k))
        self.im = Image.new('RGB', (self.w * 8, self.h * 8), (1, 2, 3)); self.d = ImageDraw.Draw(self.im)
    def c(self, code): return tuple(int(v) for v in RGB[K[code]])
    def P(self, pts): return [(x * self.q, y * self.q) for x, y in pts]
    def poly(self, pts, code, contour=None): self.d.polygon(self.P(pts), fill=self.c(code) if code else None, outline=self.c(contour) if contour else None)
    def ell(self, x, y, rx, ry, code, contour=None, ep=1):
        q = self.q; self.d.ellipse([(x - rx) * q, (y - ry) * q, (x + rx) * q, (y + ry) * q], fill=self.c(code) if code else None, outline=self.c(contour) if contour else None, width=max(1, int(ep * q)))
    def rect(self, x, y, w, h, code, contour=None, ep=1):
        q = self.q; self.d.rectangle([x * q, y * q, (x + w) * q - 1, (y + h) * q - 1], fill=self.c(code) if code else None, outline=self.c(contour) if contour else None, width=max(1, int(ep * q)))
    def ligne(self, pts, code, ep=1): self.d.line(self.P(pts), fill=self.c(code), width=max(1, int(ep * self.q)), joint='curve')
    def arc(self, x, y, r, a0, a1, code, ep=1): q = self.q; self.d.arc([(x - r) * q, (y - r) * q, (x + r) * q, (y + r) * q], a0, a1, fill=self.c(code), width=max(1, int(ep * q)))
    def texte(self, x, y, s, taille, code, police=SANS, centre=True):
        f = ImageFont.truetype(police, int(taille * self.q)); b = self.d.textbbox((0, 0), s, font=f)
        px = x * self.q - ((b[2] - b[0]) / 2 + b[0] if centre else 0); self.d.text((px, y * self.q - b[1]), s, font=f, fill=self.c(code))
    def points(self):
        a = np.asarray(self.im).reshape(self.h, 8, self.w, 8, 3).transpose(0, 2, 1, 3, 4).reshape(self.h, self.w, 64, 3).astype(int)
        cle = a[..., 0] * 65536 + a[..., 1] * 256 + a[..., 2]; fond = 65536 + 2 * 256 + 3
        table = {int(r * 65536 + g * 256 + b): k for k, (r, g, b) in enumerate(RGB.astype(int))}
        out = np.full((self.h, self.w), -1)
        for y in range(self.h):
            for x in range(self.w):
                v, n = np.unique(cle[y, x], return_counts=True); j = n.argmax()
                if v[j] == fond:
                    if n[j] > 64 * .58 or len(v) == 1: continue
                    n[j] = 0; j = n.argmax()
                if n[j] >= 64 * .28: out[y, x] = table.get(int(v[j]), -1)
        return out

ELEMENTS = []
def el(x, y, des, t, d=1.6, ordre='balaye', defait=None, dd=1.0, scintille=None, refait=None):
    """un élément de la tapisserie, posé en (x, y) unités ; brodé de t à t + d"""
    g = des.points(); h, w = g.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(float); r = rng.random((h, w))
    cle = {'balaye': xx + r * 3, 'bas': -yy + r * 3, 'haut': yy + r * 3, 'centre': np.hypot(xx - w / 2, yy - h / 2) + r * 2, 'hasard': r * 10}[ordre]
    m = g >= 0; rang = np.zeros((h, w))
    if m.sum(): rang[m] = cle[m].argsort().argsort() / max(1, m.sum() - 1)
    ELEMENTS.append(dict(x=int(round(x * KT)), y=int(round(TOP + y * KT)), g=g, t=t, d=d, rang=rang, tp=t + rang * d, defait=defait, dd=dd, scintille=scintille, refait=refait))

LIENS = []
def lien(pts, t, d=1.2, code='729', tiret=True):
    """un lien au point arrière (pointillés dorés) entre des éléments, en unités de la tapisserie"""
    LIENS.append(dict(pts=[(x * KT, TOP + y * KT) for x, y in pts], t=t, d=d, rgb=RGB[K[code]], tiret=tiret))

def personne(D, x, y, h, corps, tete='945', bras=None, ombre=None):
    D.ell(x, y + h * .12, h * .11, h * .12, tete)
    D.poly([(x - h * .16, y + h * .27), (x + h * .16, y + h * .27), (x + h * .21, y + h * .72), (x - h * .21, y + h * .72)], corps)
    if ombre: D.poly([(x + h * .02, y + h * .27), (x + h * .16, y + h * .27), (x + h * .21, y + h * .72), (x + h * .05, y + h * .72)], ombre)
    D.ligne([(x - h * .08, y + h * .7), (x - h * .1, y + h)], corps, h * .08); D.ligne([(x + h * .08, y + h * .7), (x + h * .1, y + h)], corps, h * .08)
    if bras: D.ligne(bras, corps, h * .07)

def main_(D, x, y, s, peau='950', ombre='3772', angle=0, manche=None):
    """une main : paume, quatre doigts aux phalanges marquées, pouce, ombre, manche brodée"""
    a = math.radians(angle); R = lambda px, py: (x + (px * math.cos(a) - py * math.sin(a)) * s, y + (px * math.sin(a) + py * math.cos(a)) * s)
    if manche: D.poly([R(-1.15, 1.5), R(1.25, 1.4), R(1.5, 3.4), R(-1.2, 3.6)], manche); D.ligne([R(-1.1, 2.4), R(1.35, 2.3)], '3778', s * .25)
    D.poly([R(-1, 0), R(1, 0), R(1.1, 1.6), R(-.9, 1.7)], peau); D.poly([R(.3, 0), R(1, 0), R(1.1, 1.6), R(.4, 1.65)], '945')
    for dx, L in [(-.75, 1.5), (-.25, 1.8), (.25, 1.7), (.75, 1.3)]:
        D.ligne([R(dx, .1), R(dx, -L)], peau, s * .42); D.ell(*R(dx, -L), s * .21, s * .21, peau); D.ligne([R(dx, -L * .5), R(dx + .1, -L * .5)], ombre, s * .1)
    D.ligne([R(1, .9), R(1.7, .1)], peau, s * .42); D.ligne([R(-.9, 1.65), R(1.05, 1.55)], ombre, s * .12)

# ===== 1 — Aux origines =====
x = X0[0]
d = Dessin(1, 1); d.rect(0, 0, 1, 1, '729'); el(x + 66, 40, d, 1.0, .2)
d = Dessin(3, 66); d.ligne([(1.5, 0), (1.5, 66)], '3363', .8); el(x + 65, 41, d, 1.6, 5.5, 'haut')
d = Dessin(50, 42); main_(d, 22, 22, 6.5, angle=-20, manche='3865'); d.ligne([(34, 2), (44, 30)], '415', .9); d.ligne([(34, 2), (28, 14)], '3363', .5)
el(x + 38, 4, d, mot(1, 'main', 1), 2.2, 'bas')
d = Dessin(30, 26); d.poly([(4, 23), (26, 2), (23, 10), (9, 21)], '762'); d.ligne([(4, 23), (26, 2)], '3782', .6); d.ligne([(2, 25), (16, 25)], '823', .6); d.rect(20, 18, 7, 7, '823')
el(x + 2, 60, d, mot(1, 'écrire'), 1.6)
d = Dessin(30, 22)
for r_ in range(4):
    for c_ in range(5): d.rect(c_ * 6.2 + (3 if r_ % 2 else 0) - 3, 17 - r_ * 5.2, 5.6, 4.6, '3778' if (r_ + c_) % 2 else '356')
el(x + 52, 62, d, mot(1, 'construire'), 1.8, 'bas')
d = Dessin(46, 26); main_(d, 11, 12, 3.8, angle=70, manche='3865'); main_(d, 35, 12, 3.8, angle=-70, manche='3865'); d.ligne([(15, 10), (23, 13), (31, 10)], '356', .6)
el(x + 92, 60, d, mot(1, 'transmettre'), 2.0, 'centre')
lien([(x + 32, 86), (x + 52, 92)], mot(1, 'transmettre') + .6); lien([(x + 82, 92), (x + 96, 86)], mot(1, 'transmettre') + .9)
d = Dessin(150, 3); d.ligne([(0, 1.5), (150, 1.5)], '3363', .8); el(x - 12, 108, d, mot(1, 'fil'), 4.0)
x = X0[1]
d = Dessin(50, 14); d.texte(25, 1, '1746', 11, '3777', SERIF); el(x + 40, 2, d, mot(1, '1746'), 1.4)
d = Dessin(80, 28)
for k in range(4): d.poly([(k * 18, 28), (k * 18, 17), (k * 18 + 9, 10), (k * 18 + 18, 17), (k * 18 + 18, 28)], '356' if k % 2 else '3778')
for k in range(4):
    for j in (4, 11): d.rect(k * 18 + j, 20, 2.6, 3.4, '725')
d.rect(72, 2, 4.4, 26, '3777'); d.rect(64, 8, 3.6, 20, '3777')
el(x + 25, 16, d, mot(1, 'Mulhouse'), 2.6, 'bas')
d = Dessin(40, 9); d.texte(20, 1, 'Mulhouse', 6.4, '823', ITAL_G); el(x + 45, 46, d, mot(1, 'Mulhouse') + .8, 1.0)
d = Dessin(22, 14)
for k in range(8): d.ell(3 + k * 2.4 + math.sin(k) * 1.4, 12 - k * 1.4, 1.8, 1.3, '3782')
el(x + 98, 4, d, mot(1, 'textile'), 3.0, 'bas')
for k in range(3):
    d = Dessin(18, 20); d.texte(9, 1, 'DMC'[k], 17, '823', SERIF_G); el(x + 38 + k * 18, 58, d, [mot(1, 'D,'), mot(1, 'M,'), mot(1, 'C.')][k], .8, 'haut')
FAN = ['823', '312', '334', '3768', '3363', '3013', '729', '725', '3046', '758', '3778', '356', '3726', '3041']
d = Dessin(100, 22)
for k, c in enumerate(FAN):
    a = math.radians(205 + k * 130 / (len(FAN) - 1)); d.ligne([(50, 21), (50 + math.cos(a) * 46, 21 + math.sin(a) * 19)], c, 2.6)
    d.ell(50 + math.cos(a) * 46, 21 + math.sin(a) * 19, 1.6, 1.6, c)
el(x + 15, 80, d, mot(1, 'centaines'), 2.2, 'centre')
lien([(x + 65, 14), (x + 65, 18)], mot(1, '1746') + .8, .5); lien([(x + 65, 54), (x + 65, 58)], mot(1, 'maison'), .6); lien([(x + 65, 79), (x + 65, 84)], mot(1, 'centaines') + .3, .5)
d = Dessin(90, 3)
for k in range(22): d.ligne([(2 + k * 4, .5), (3.6 + k * 4, 2.5)], FAN[k % len(FAN)], .5); d.ligne([(3.6 + k * 4, .5), (2 + k * 4, 2.5)], FAN[k % len(FAN)], .5)
el(x + 20, 104, d, mot(1, 'gestes'), 1.6)

# ===== 2 — La mémoire des hommes =====
x = X0[1 + 1]
d = Dessin(100, 2.4); d.rect(0, 0, 33, 2.4, '823'); d.rect(33, 0, 34, 2.4, 'B5200'); d.rect(67, 0, 33, 2.4, '356'); el(x + 15, 1, d, DEBUT[2], 2.0)
d = Dessin(110, 12); d.texte(55, 1, 'Georges Clemenceau', 8.6, '823', SERIF); el(x + 10, 6, d, mot(2, 'Georges'), 1.8)
d = Dessin(50, 8); d.texte(25, 1, '11 · 11 · 1918', 6, '334', SERIF); el(x + 40, 18, d, mot(2, 'Clémenceau') + .9, 1.0)
d = Dessin(130, 22)
for k in range(8):
    px_ = 6 + k * 16 + (12 if k >= 4 else 0) - (2 if k >= 4 else 0)
    if 46 < px_ < 86: continue
    personne(d, px_, 3, 17, '932', '932', ombre='334'); d.ell(px_, 4, 3, 1.6, '930')
el(x, 50, d, mot(2, 'hommes'), 2.0, 'balaye', defait=mot(2, 'nommer') - .6, dd=1.4, refait=mot(2, 'choisir'))
d = Dessin(46, 50)
d.rect(0, 6, 46, 44, '3046'); d.rect(0, 2, 46, 5, '3045'); d.rect(-1, 0, 48, 3, '3863')
for k in range(7): d.rect(1 + k * 6.5, 2.6, 3, 2, '3863')
d.d.chord([14 * d.q, 18 * d.q, 32 * d.q, 36 * d.q], 180, 360, fill=(1, 2, 3)); d.d.rectangle([14 * d.q, 27 * d.q, 32 * d.q - 1, 50 * d.q], fill=(1, 2, 3))
d.arc(23, 27, 9.5, 180, 360, '3045', 1.2)
for k in range(2): d.rect(3 + k * 5, 14, 2, 30, '3863'); d.rect(36 + k * 5, 14, 2, 30, '3863')
el(x + 42, 26, d, mot(2, 'soldat', 1), 3.2, 'bas')
d = Dessin(8, 10); d.poly([(4, 0), (8, 7), (4, 10), (0, 7)], '971'); d.poly([(4, 3), (6, 7), (4, 9), (2, 7)], '307')
el(x + 61, 64, d, mot(2, 'inconnue'), .8, 'bas', scintille=True)
d = Dessin(14, 3); d.rect(0, 0, 14, 3, '414'); el(x + 58, 74, d, mot(2, 'inconnue'), .6)
d = Dessin(20, 9); d.ell(10, 7, 10, 6, '932'); d.rect(0, 7, 20, 2, '930'); d.ell(10, 2.6, 2.6, 1.8, '932'); d.ell(13, 6, 4, 3, '334')
el(x + 55, 84, d, mot(2, 'présence'), 1.8, 'bas')
def bleuet(D, cx, cy, r=2.2):
    for j in range(8): a = j * math.pi / 4; D.ell(cx + math.cos(a) * r, cy + math.sin(a) * r, r * .58, r * .58, '3807' if j % 2 else '793')
    D.ell(cx, cy, r * .45, r * .45, '820')
d = Dessin(130, 22)
for k in range(10):
    side = -1 if k < 5 else 1; j = k % 5; cx = (8 + j * 9) if side < 0 else (122 - j * 9); cy = 8 + (j % 2) * 4
    d.ligne([(cx, cy), (cx + side * 2, 22)], '3363', .5); d.ell(cx + side * 3, cy + 7, 1.6, .7, '3052'); bleuet(d, cx, cy)
el(x, 82, d, mot(2, 'mémoire'), 2.4, 'centre')
d = Dessin(3, 3); d.ell(1.5, 1.5, 1.4, 1.4, '729'); el(x + 129, 107, d, mot(2, 'commence'), .6)

# ===== 3 — Le commencement d'un regard =====
x = X0[3]
d = Dessin(44, 38)                                                                                       # Saint-Luc : la façade et son cartouche
d.rect(2, 10, 40, 22, '3778'); d.poly([(0, 11), (22, 2), (44, 11)], '356'); d.rect(17, 6, 10, 26, '758')
for k in range(4): d.d.chord([(4 + k * 10 if k < 2 else 8 + k * 10) * d.q, 14 * d.q, (10 + k * 10 if k < 2 else 14 + k * 10) * d.q, 26 * d.q], 180, 360, fill=d.c('312')); d.rect(4 + k * 10 if k < 2 else 8 + k * 10, 20, 6, 6, '312')
d.d.chord([19 * d.q, 18 * d.q, 25 * d.q, 32 * d.q], 180, 360, fill=d.c('3777')); d.rect(19, 25, 6, 7, '3777')
d.ell(-1, 26, 4, 7, '3363'); d.ell(45, 26, 4, 7, '3363'); d.rect(0, 32, 44, 2, '3052')
el(x + 2, 0, d, mot(3, 'Saint'), 2.0, 'bas')
d = Dessin(38, 8); d.rect(0, 0, 38, 8, None, '729', .3); d.texte(19, 1.3, 'Saint-Luc', 5.4, '823', ITAL_G); el(x + 5, 35, d, mot(3, 'Saint') + 1.2, .8)
CX3, CY3 = x + 72, 24                                                                                    # l'œil : regarder les signes
d = Dessin(26, 14); d.d.chord([0, 0, 26 * d.q, 14 * d.q], 0, 360, fill=d.c('3865')); d.ell(13, 7, 5, 5, '334'); d.ell(13, 7, 2.4, 2.4, '823'); d.ell(11.6, 5.6, .8, .8, 'B5200')
d.d.arc([0, 0, 26 * d.q, 14 * d.q], 180, 360, fill=d.c('823'), width=int(d.q * .7)); d.d.arc([0, 0, 26 * d.q, 14 * d.q], 0, 180, fill=d.c('823'), width=int(d.q * .7))
el(CX3 - 13, CY3 - 7, d, mot(3, 'image'), 1.6, 'centre')
d = Dessin(30, 8)
for k in range(9): a = math.radians(200 + k * 17.5); d.ligne([(15 + math.cos(a) * 9, 8 + math.sin(a) * 5), (15 + math.cos(a) * 13, 8 + math.sin(a) * 7)], '729', .4)
el(CX3 - 15, CY3 - 15, d, mot(3, 'représentait'), .8, 'centre')
ICONES = [(CX3 - 34, CY3 - 4), (CX3 - 22, CY3 + 12), (CX3 + 22, CY3 + 12), (CX3 + 34, CY3 - 4)]
for k, (ix, iy) in enumerate(ICONES):
    d = Dessin(10, 10); d.rect(0, 0, 10, 10, None, '729', .35)
    if k == 0: d.poly([(1.5, 8), (4.5, 3.5), (7, 8)], '3052'); d.ell(7.4, 3, 1.3, 1.3, '725')
    if k == 1: d.poly([(2, 4), (5, 2.4), (8, 4), (5, 5.6)], '677', '3863'); d.poly([(2, 4), (5, 5.6), (5, 8.6), (2, 7)], '3046', '3863'); d.poly([(5, 5.6), (8, 4), (8, 7), (5, 8.6)], '3045', '3863')
    if k == 2: d.ligne([(2.5, 7.5), (5, 2.5), (7.5, 7.5), (2.5, 7.5)], '3863', .3); d.ell(5, 2.5, 1, 1, '356'); d.ell(2.5, 7.5, 1, 1, '312'); d.ell(7.5, 7.5, 1, 1, '3363')
    if k == 3: d.texte(5, 1.3, 'A', 7, '3863', ITAL)
    el(ix - 5, iy - 5, d, (mot(3, 'signes') if k < 2 else mot(3, 'symboles')) + (k % 2) * .4, .7, 'centre')
    lien([(ix + (5 if ix < CX3 else -5), iy), (CX3 + (-13 if ix < CX3 else 13), CY3)], mot(3, 'relations') + k * .15, .7)
d = Dessin(26, 26)
for j in range(6): a = j * math.pi / 3; d.ell(13 + math.cos(a) * 6, 11 + math.sin(a) * 6, 4, 4, None, '3787', .45)
d.ligne([(13, 17), (13, 26)], '3787', .45); el(x + 8, 50, d, mot(3, 'dessinais'), 1.2, 'haut')
d = Dessin(26, 26)
for j in range(6): a = j * math.pi / 3; d.ell(13 + math.cos(a) * 6, 11 + math.sin(a) * 6, 4, 4, ['758', '3727', '3042', '334', '725', '3778'][j])
d.ell(13, 11, 2.6, 2.6, '729'); d.ligne([(13, 17), (13, 26)], '3363', .8)
el(x + 8, 50, d, mot(3, 'composais'), 1.2, 'centre', scintille='couleurs')
d = Dessin(34, 40)                                                                                       # le saxophone
d.ligne([(8, 2), (11, 5), (12.5, 28), (17, 35), (23, 35), (28, 30), (28.5, 22)], '783', 2.8); d.ligne([(9, 3), (12, 6), (13.4, 27)], '725', .8)
d.ell(28.6, 20.5, 4.2, 2.6, '725', '783', .5); d.ligne([(8, 2), (5, 0)], '3787', 1)
for k in range(6): d.ell(12.2 + k * .15, 9 + k * 3.2, .9, .9, '677')
el(x + 98, 2, d, mot(3, 'musique'), 2.4, 'haut')
d = Dessin(16, 14); d.ligne([(2, 10), (2, 3), (8, 1), (8, 8)], '3863', .5); d.ell(1.2, 10, 1.4, 1, '3863'); d.ell(7.2, 8, 1.4, 1, '3863')
d.ligne([(12, 12), (12, 6)], '3863', .5); d.ell(11.2, 12, 1.4, 1, '3863')
el(x + 120, 0, d, mot(3, 'saxophone') + .5, .8, 'centre')
d = Dessin(22, 16); personne(d, 6, 0, 15, '312', ombre='823'); personne(d, 16, 0, 15, '3778', ombre='356'); el(x + 2, 86, d, mot(3, 'rencontres'), 1.1, 'centre')
d = Dessin(16, 10); d.ell(6, 5, 4, 4, None, '729', 1); d.ell(10, 5, 4, 4, None, '725', 1); el(x + 30, 89, d, mot(3, 'mariages'), 1.0, 'centre')
d = Dessin(24, 14); main_(d, 5, 8, 2, angle=80); main_(d, 19, 8, 2, angle=-80); el(x + 52, 87, d, mot(3, 'séparations'), 1.0, 'centre')
d = Dessin(16, 16); d.rect(4, 6, 4, 9, '3865'); d.poly([(6, 0), (8, 4), (6, 6), (4, 4)], '725'); d.rect(0, 13, 16, 3, '823'); d.rect(1, 10.6, 12, 2.4, '356')
el(x + 82, 85, d, mot(3, 'hommages'), .9, 'bas', scintille=True)
d = Dessin(30, 18)
for k in range(5): personne(d, 3 + k * 6, 3, 11, ['356', '312', '729', '3363', '3041'][k])
el(x + 104, 82, d, mot(3, 'vivre'), 1.6)
lien([(x + 8, 84), (x + 20, 76), (x + 40, 80), (x + 64, 76), (x + 90, 80), (x + 110, 78)], mot(3, 'relie') - .4, 1.6, '356')

# ===== 4 — Les années invisibles =====
x = X0[4]
d = Dessin(40, 44)                                                                                       # la fenêtre en arc, la nuit, la lune
d.rect(0, 14, 40, 30, '3750'); d.d.chord([0, 0, 40 * d.q, 30 * d.q], 180, 360, fill=d.c('3750'))
d.ell(27, 12, 5, 5, '677'); d.ell(25.5, 11, 1.4, 1, '3046')
for k in range(9): d.rect(3 + (k * 7.7) % 34, 6 + (k * 11.3) % 30, .9, .9, '3078')
d.poly([(0, 44), (6, 36), (10, 38), (14, 33), (19, 37), (24, 34), (29, 38), (34, 35), (40, 39), (40, 44)], '823')
for k in range(5): d.rect(8 + k * 6, 39, 1.2, 1.4, '725')
d.ligne([(20, 0), (20, 44)], '3863', .7); d.ligne([(0, 24), (40, 24)], '3863', .7); d.d.arc([0, 0, 40 * d.q, 30 * d.q], 180, 360, fill=d.c('3863'), width=int(d.q * 1.2)); d.rect(0, 14, 40, 30, None, '3863', 1.2)
el(x + 46, 0, d, DEBUT[4] + .3, 2.2, 'bas', scintille='etoiles')
for k in range(12):
    gauche = k < 6; j = k % 6; fx = (2 + (j % 2) * 16) if gauche else (100 + (j % 2) * 16); fy = 4 + (j // 2) * 15
    d = Dessin(14, 11)
    if k % 3 == 0: d.poly([(0, 0), (9, 0), (13, 4), (13, 11), (0, 11)], '677', '3782'); d.ligne([(9, 0), (9, 4), (13, 4)], '3782', .3); d.rect(2, 6, 7, .8, '3782')
    else:
        d.rect(0, 0, 14, 11, 'B5200', '932', .35); d.rect(0, 0, 14, 2.2, '3753'); d.ell(1.6, 1.1, .5, .5, '356'); d.ell(3, 1.1, .5, .5, '725')
        if k % 3 == 1: d.ligne([(2, 9), (5, 6), (8, 7.5), (12, 4)], '356', .4)
        else: d.rect(2, 4, 3, 2, '725'); d.rect(2, 7, 3, 2, '725'); d.rect(6, 4.6, 6, .7, '932'); d.rect(6, 7.6, 6, .7, '932')
    t0 = mot(4, 'fichiers') if k % 3 == 0 else mot(4, 'centaines') + j * .2
    defait = mot(4, 'abandonnés') + .2 if k in (1, 8) else None
    el(x + fx, fy, d, t0, .7, 'hasard', defait=defait, dd=.6, refait=mot(4, 'recommencés') if defait else None)
d = Dessin(16, 9)
for k in range(4): d.ell(4 + (k % 2) * 2, 7 - k * 1.6, 3, 1.1, '725', '783', .3)
d.poly([(9, 1), (15, 1), (15, 9), (9, 9)], 'B5200', '3782'); d.texte(12, 4.6, '€', 3.5, '3863', SERIF)
el(x + 104, 50, d, mot(4, 'dépenses'), 1.0, 'balaye')
d = Dessin(60, 22)                                                                                       # seul, la nuit, à sa table ; la lampe
d.rect(4, 16, 52, 2, '3863'); d.rect(8, 18, 1.6, 4, '3863'); d.rect(50, 18, 1.6, 4, '3863')
personne(d, 26, 1, 16, '3864', '3863', ombre='3782'); d.rect(31, 11.6, 9, 4.4, '3787'); d.rect(31, 15.4, 11, .8, '414')
d.ligne([(48, 16), (48, 6), (44, 4)], '783', .5); d.ell(43, 5, 3, 1.6, '725'); d.poly([(40, 6), (46, 6), (50, 16), (36, 16)], '677')
for k, c in enumerate(['823', '356', '3363']): d.rect(8, 13 - k * 1.6, 9, 1.5, c)
el(x + 36, 46, d, mot(4, 'seuls'), 2.0, 'bas')
d = Dessin(44, 16)                                                                                       # les bobines, le fil emmêlé
d.rect(0, 5, 5, 8, '356'); d.rect(-1, 4, 7, 1.2, '3863'); d.rect(-1, 12.8, 7, 1.2, '3863')
d.rect(39, 5, 5, 8, '312'); d.rect(38, 4, 7, 1.2, '3863'); d.rect(38, 12.8, 7, 1.2, '3863')
for k in range(9): d.arc(22 + math.cos(k) * 5, 9 + math.sin(k * 1.7) * 3, 3 + k % 3 * 1.3, k * 40, k * 40 + 250, ['356', '312', '729'][k % 3], .35)
d.ligne([(5, 9), (14, 8)], '356', .35); d.ligne([(39, 9), (30, 10)], '312', .35)
el(x + 44, 72, d, mot(4, 'réunir'), 2.2, 'hasard')
d = Dessin(130, 4)
for k in range(4): d.ligne([(4 + k * 32, 2), (14 + k * 32, 2)], '3778', .35); d.ligne([(18 + k * 32, 2), (28 + k * 32, 2)], '3778', .35)
el(x, 92, d, mot(4, 'parlaient'), 1.0, scintille='clignote')
for k in range(3):
    d = Dessin(10, 14); d.texte(5, 1, '?', 12, '356', SERIF); t0 = mot(4, 'Pourquoi', k + 1)
    el(x + 98 + k * 10, 62 - (k % 2) * 4, d, t0, .6, 'haut', defait=t0 + 2.2, dd=.8)

# ===== 5 — La découverte =====
x = X0[5]; CX, CY = x + 65, 30
d = Dessin(48, 36)
for (cx_, cy_) in [(12, 0), (0, 12), (12, 12), (24, 12), (36, 12), (12, 24)]: d.rect(cx_, cy_, 12, 12, None, '3863', .7)
el(CX - 24, 6, d, mot(5, 'atlas'), 2.0)
for k, (cx_, cy_) in enumerate([(12, 0), (0, 12), (12, 12), (24, 12), (36, 12), (12, 24)]):
    d = Dessin(9, 9); d.rect(0, 0, 9, 9, ['334', '758', '725', '3363', '3042', '3778'][k]); el(CX - 24 + cx_ + 1.5, 6 + cy_ + 1.5, d, mot(5, 'morceaux') + k * .3, .5, 'centre')
d = Dessin(24, 5)
for k in range(5): d.ligne([(k * 5, .6), (k * 5 + 3, 4)], '3782', .45); d.ligne([(k * 5 + 3, .6), (k * 5, 4)], '3782', .45)
el(x + 8, 50, d, mot(5, 'répétitions'), .9)
d = Dessin(5, 5); d.ligne([(0, 0), (5, 5)], '356', .7); d.ligne([(5, 0), (0, 5)], '356', .7); el(x + 36, 50, d, mot(5, 'erreurs'), .5)
d = Dessin(16, 5); d.ligne([(0, 2.5), (7, 2.5)], '312', .5); d.poly([(7, 1), (9, 2.5), (7, 4)], '312'); d.ligne([(16, 2.5), (9.5, 2.5)], '356', .5); d.poly([(9.5, 1), (7.5, 2.5), (9.5, 4)], '356')
el(x + 46, 50, d, mot(5, 'contradictions'), .9)
d = Dessin(48, 36)
for (a, b) in [((18, 6), (18, 18)), ((6, 18), (18, 18)), ((18, 18), (30, 18)), ((30, 18), (42, 18)), ((18, 18), (18, 30))]: d.ligne([a, b], '729', .45)
el(CX - 24, 6, d, mot(5, 'comprendre'), 1.4)
d = Dessin(64, 7)
for k in range(8): d.rect(1 + k * 8, .5, 6, 6, '677', '729', .25); B._dessiner_symbole(d.d, B.SYMB[(k * 5) % len(B.SYMB)], (4 + k * 8) * d.q, 3.5 * d.q, 2 * d.q, d.c('823'), max(2, int(d.q * .4)))
el(CX - 32, 46, d, mot(5, 'langage'), 1.2)
POS_MOTS = [('RÈGLES', 'règles', x + 8, 62), ('GESTES', 'gestes', x + 92, 62), ('PREUVES', 'preuves', x + 8, 86), ('PERMISSIONS', 'permissions', x + 86, 86)]
for txt, mt, px_, py_ in POS_MOTS:
    d = Dessin(42, 10); d.rect(0, 0, 42, 10, None, '729', .35); d.texte(21, 2.2, txt, 5.6, '823', SERIF_G); el(px_ - 1, py_ - 1, d, mot(5, mt), .9)
d = Dessin(7, 7); d.poly([(3.5, 0), (7, 3.5), (3.5, 7), (0, 3.5)], '725', '729'); d.ell(3.5, 3.5, 1, 1, '307'); el(CX - 3.5, 74, d, mot(5, 'point', 1), .5, 'centre')
for k, (mt, (txt, mm, px_, py_)) in enumerate(zip(['créer', 'transmettre', 'retrouver', 'continuer'], POS_MOTS)):
    lien([(CX + (-4 if px_ < CX else 4), 77.5), (px_ + (40 if px_ < CX else 0), py_ + 4)], mot(5, mt), .6, '729')
d = Dessin(60, 14); d.texte(30, 1, 'AIME', 12, '823', SERIF_G); el(CX - 30, 92, d, DEBUT[5] + 43.2, .9, 'balaye')

# ——— la caméra (en points de la tapisserie) ———
CAM = [(0, X0[0]), (19.6, X0[0]), (21.3, X0[1]), (DEBUT[2] - 1.2, X0[1]), (DEBUT[2] + .6, X0[2]), (DEBUT[3] - 1.0, X0[2]), (DEBUT[3] + .6, X0[3]),
       (DEBUT[4] - 1.0, X0[3]), (DEBUT[4] + .4, X0[4]), (DEBUT[5] - .9, X0[4]), (DEBUT[5] + .4, X0[5])]
def camera(t):
    """la colonne (en points) du bord gauche de la vue : le panneau est centré"""
    for (ta, xa), (tb, xb) in zip(CAM, CAM[1:]):
        if ta <= t <= tb: u = (t - ta) / max(1e-6, tb - ta); u = u * u * (3 - 2 * u); xx_ = xa + (xb - xa) * u; break
    else: xx_ = CAM[-1][1]
    return (xx_ + 65) * KT - V / 2

# ——— le cadre de musée, le titre des chapitres ———
yv, xv = np.mgrid[0:V, 0:V]
def cadre():
    D = Dessin(VL, VL, KV)
    for m in (2.2, 3.6): D.rect(m, m, VL - 2 * m, VL - 2 * m, None, '729', .35)
    for (cx_, cy_) in [(6, 6), (VL - 6, 6), (6, VL - 6), (VL - 6, VL - 6)]:   # les rosaces aux coins
        for j in range(4): a = j * math.pi / 2 + math.pi / 4; D.ell(cx_ + math.cos(a) * 1.6, cy_ + math.sin(a) * 1.6, .9, .9, '356')
        for j in range(4): a = j * math.pi / 2; D.ell(cx_ + math.cos(a) * 1.7, cy_ + math.sin(a) * 1.7, .6, .6, '312')
        D.ell(cx_, cy_, .7, .7, '729')
    return D.points()
CADRE = cadre()
TITRES = [(1.2, DEBUT[2] - 1.4, 'Aux origines'), (DEBUT[2] + .4, DEBUT[3] - 1.2, 'La mémoire des hommes'), (DEBUT[3] + .4, DEBUT[4] - 1.2, 'Le commencement d’un regard'),
          (DEBUT[4] + .2, DEBUT[5] - 1.1, 'Les années invisibles'), (DEBUT[5] + .2, SILENCE - 2.2, 'La découverte'), (DEBUT[7] - .5, PERLE - 1, 'L’ouverture au monde')]
TITRE_G = {}
def titre_g(s):
    if s not in TITRE_G:
        D = Dessin(VL, 12, KV); D.texte(VL / 2, 3.0, s, 7, '823', ITAL_G)
        f = ImageFont.truetype(ITAL_G, int(7 * D.q)); w = D.d.textbbox((0, 0), s, font=f); lw = (w[2] - w[0]) / D.q / 2
        D.ligne([(VL / 2 - lw - 16, 7), (VL / 2 - lw - 4, 7)], '729', .3); D.ligne([(VL / 2 + lw + 4, 7), (VL / 2 + lw + 16, 7)], '729', .3)
        D.ell(VL / 2 - lw - 3, 7, .7, .7, '729'); D.ell(VL / 2 + lw + 3, 7, .7, .7, '729')
        g = D.points(); full = np.full((V, V), -1); full[:g.shape[0], :] = g[:, :V]; TITRE_G[s] = (full, np.where(full >= 0, xv + rng.random((V, V)) * 4, 1e9))
    return TITRE_G[s]

# ——— la fleur dans son tambour (en bas, au centre) ; la frise qui s'allonge ———
def petite_fleur(stade):
    D = Dessin(30, 30, .95); D.rect(0, 22, 30, 8, '3863'); D.rect(0, 22, 30, 1.2, '3864')
    if stade == 0: D.ell(15, 22, 2.2, 1.4, '3777')
    if stade >= 1:
        h = [0, 7, 11, 13, 16][stade]; plie = 3 if stade == 3 else 0
        D.ligne([(15, 23), (15 + plie, 23 - h * .6), (15 + plie * .3, 23 - h)], '3363', 1.0)
        D.ell(12.6, 21 - h * .3, 2.4, 1.2, '3013')
        if stade >= 2: D.ell(19, 20 - h * .5, 3.4, 1.5, '3363')
        if stade == 4: D.ell(15, 23 - h - 2, 2.4, 3.6, '758'); D.ell(15, 23 - h - 1, 1.6, 2, '3865'); D.ell(15.6, 23 - h - 2.6, .6, 1.4, '3727')
    return D.points()
STADES = [petite_fleur(k) for k in range(5)]
def stade(t): return 0 if t < DEBUT[2] else 1 if t < DEBUT[3] else 2 if t < DEBUT[4] else 3 if t < DEBUT[5] else 4
HC = (60, 108); HR = 9.5     # le tambour (unités de la vue)
def frise():
    D = Dessin(VL, VL, KV); y0 = 108
    for side in (-1, 1):
        pts = [(HC[0] + side * (HR + 2 + k * 2.2), y0 + 2.4 * math.sin(k * .5)) for k in range(22)]
        D.ligne(pts, '3363', .45)
        for k in range(2, 22, 3):
            px_, py_ = pts[k]; D.ell(px_ + side * .6, py_ - 1.6, 1.3, .6, '3052')
            if k % 6 == 2: bleuet(D, px_, py_ + 2.4, 1.3)
    return D.points()
FRISE = frise(); ORDRE_FRISE = np.where(FRISE >= 0, np.abs(xv / KV - HC[0]) + rng.random((V, V)) * 2, 1e9)

FC = (60, 58); ECH = .62
FX = np.clip(((xv / KV - FC[0]) / ECH + FL['C'][0]).round().astype(int), 0, 159); FY = np.clip(((yv / KV - FC[1]) / ECH + FL['C'][1]).round().astype(int), 0, 159)
DCV = np.hypot(xv / KV - FC[0], yv / KV - FC[1])
def grande_fleur(o): return FL['petales'](o)[FY, FX]
GF0 = grande_fleur(0.); GF1 = grande_fleur(1.)
ORDRE_GF = np.where(GF0 >= 0, DCV + rng.random((V, V)), 1e9)
def arc_ciel(t):
    u = np.clip((t - 200.25) / 6, 0, 1)
    if u <= 0: return None
    ang = (np.degrees(np.arctan2(xv / KV - FC[0], -(yv / KV - FC[1]))) + 360) % 360; band = (38 + 4 - DCV) / 4 * 6
    m = (band >= 0) & (band < 6) & (ang <= u * 360)
    return np.where(m, np.array([K[c] for c in ['356', '3778', '725', '3013', '334', '3042']])[np.clip(band.astype(int), 0, 5)], -1)
def ronde(t):
    D = Dessin(VL, VL, KV)
    qui = [('anciens', '3787'), ('enfants', '334'), ('artistes', '3041'), ('amoureux', '356'), ('artisans', '3863'), ('lumière', '729'), ('personne', '927')]
    rr = 47
    for k, (mt, c) in enumerate(qui):
        if t >= mot(7, mt): a = math.radians(-150 + k * 20); personne(D, FC[0] + math.cos(a) * rr, FC[1] + math.sin(a) * rr - 5, 9 if mt != 'enfants' else 7, c)
    if t >= mot(7, 'générations'):
        m = int(min(16, (t - mot(7, 'générations')) / .3))
        for k in range(m): a = math.radians(-4 + k * 13); personne(D, FC[0] + math.cos(a) * rr, FC[1] + math.sin(a) * rr - 5, 8, ['3363', '3727', '334', '783', '356', '823', '3772', '3013'][k % 8])
    if t >= mot(7, 'retrouvent') - .3: D.ell(FC[0], FC[1], rr - 6, rr - 6, None, '729', .3)
    return D.points()
RONDE_CACHE = {}
def ronde_c(t):
    cle = round(t * 5) / 5
    if cle not in RONDE_CACHE: RONDE_CACHE.clear(); RONDE_CACHE[cle] = ronde(cle)
    return RONDE_CACHE[cle]
def carte():
    D = Dessin(VL, VL, KV)
    for pts in [[(14, 32), (34, 25), (41, 36), (32, 48), (27, 60), (21, 50), (12, 43)], [(28, 64), (37, 62), (41, 78), (34, 94), (30, 84)],
                [(52, 28), (65, 23), (68, 32), (59, 37), (54, 35)], [(54, 41), (68, 41), (72, 59), (63, 80), (56, 68), (52, 52)],
                [(70, 25), (101, 23), (108, 37), (93, 50), (82, 46), (73, 37)], [(91, 72), (106, 70), (108, 81), (95, 83)]]:
        D.poly(pts, '3753')
    return D.points()
CARTE = carte()
def titre_final():
    D = Dessin(VL, VL, KV); D.texte(60, 48, 'LE MONDE AIME', 10.5, '823', SERIF_G)
    D.ligne([(30, 63), (52, 63)], '729', .3); D.ligne([(68, 63), (90, 63)], '729', .3); D.poly([(60, 61.6), (61.4, 63), (60, 64.4), (58.6, 63)], '729')
    D.texte(60, 67, 'D’un seul point, un monde.', 6.4, '3777', ITAL); return D.points()
TITRE = titre_final(); ORDRE_TITRE = np.where(TITRE >= 0, xv + rng.random((V, V)) * 3, 1e9)
_D = Dessin(VL, VL, KV)
for k in range(7):
    cx_, cy_ = FC[0] - 18 + k * 6, 98 - (k % 2) * 2.6; _D.ligne([(cx_, cy_), (cx_, 106)], '3363', .45); bleuet(_D, cx_, cy_, 1.4)
BLEUETS_G = _D.points()

# ——— une image ———
def toile_vue(t, xc):
    x0 = int(math.floor(xc)); fil = np.full((H, V + 1), -1); etat = np.zeros((H, V + 1))
    for e in ELEMENTS:
        h, w = e['g'].shape
        if e['x'] + w < x0 or e['x'] > x0 + V + 1 or t < e['t']: continue
        s = np.clip((t - e['tp']) / .25, 0, 1)
        if e['defait'] is not None and t >= e['defait']:
            back = np.clip((t - e['defait'] - (1 - e['rang']) * e['dd']) / .2, 0, 1)
            if e['refait'] is not None and t >= e['refait']: back = np.clip(1 - (t - e['refait'] - e['rang'] * 1.2) / .2, 0, 1) * back
            s = s * (1 - back)
        g = e['g'].copy()
        if e['scintille'] is True:
            k = int(t * 8) % 3; g = np.where(g == K['971'], [K['971'], K['740'], K['725']][k], np.where(g == K['307'], [K['307'], K['445'], K['307']][k], g))
        elif e['scintille'] == 'etoiles': g = np.where((np.random.default_rng(int(t * 4)).random(g.shape) < .2) & (g == K['3078']), K['B5200'], g)
        elif e['scintille'] == 'clignote' and int(t * 3) % 2: s = s * 0
        elif e['scintille'] == 'couleurs' and e['t'] + 1.3 < t < e['t'] + 4:
            pal = np.array([K[c] for c in ['758', '3727', '3042', '334', '725', '3778']]); sh = int((t - e['t']) * 4)
            lut = np.arange(NP + 1); lut[pal] = pal[(np.arange(len(pal)) + sh) % len(pal)]; g = np.where(g >= 0, lut[np.clip(g, 0, NP)], g)
        ys, xs = slice(max(0, e['y']), min(H, e['y'] + h)), slice(max(0, e['x'] - x0), min(V + 1, e['x'] + w - x0))
        if xs.stop <= xs.start or ys.stop <= ys.start: continue
        gy, gx = slice(ys.start - e['y'], ys.stop - e['y']), slice(xs.start - (e['x'] - x0), xs.stop - (e['x'] - x0))
        gg, ss = g[gy, gx], s[gy, gx]; m = (gg >= 0) & (ss > 0)
        fil[ys, xs] = np.where(m, gg, fil[ys, xs]); etat[ys, xs] = np.where(m, np.where(ss >= 1, 1, .5), etat[ys, xs])
    return fil, etat, x0

def assembler(fil, etat, x0=0):
    ii = np.where(etat >= 1, fil, TOILE); h, w = fil.shape; var = VAR[:h][:, (np.arange(w) + x0) % VAR.shape[1]]
    img = B.assembler(A['tissu'], ii, var).astype(np.float32)
    demi = etat == .5
    if demi.any(): dd = B.assembler(A['demi'], np.where(demi, fil, TOILE), var); mk = np.repeat(np.repeat(demi, S, 0), S, 1); img[mk] = dd[mk]
    vide = np.repeat(np.repeat(etat == 0, S, 0), S, 1)
    if vide.any(): img[vide] = B.assembler(A['toile'], np.full((h, w), TOILE), var)[vide]
    return img

def poser(img, f, prog=None, ordre=None):
    """poser une couche de points (V × V) sur l'image ; prog : la part brodée (selon ordre)"""
    m = f >= 0
    if prog is not None: m = m & (ordre <= (np.quantile(ordre[f >= 0], min(1, prog)) if prog > 0 else -1))
    if not m.any(): return img
    c = assembler(np.where(m, f, 0), m * 1.); mk = np.repeat(np.repeat(m, S, 0), S, 1); img[mk] = c[mk]; return img

def liens(img, t, x0):
    """les liens au point arrière : des pointillés dorés, avec leur relief (un trait d'ombre, un reflet)"""
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)); dr = ImageDraw.Draw(im)
    for L in LIENS:
        if t < L['t']: continue
        u = min(1, (t - L['t']) / L['d']); pts = [((x - x0) * S, y * S) for x, y in L['pts']]
        seg = [(pts[k], pts[k + 1]) for k in range(len(pts) - 1)]; tot = sum(math.dist(a, b) for a, b in seg); reste = tot * u
        for a, b in seg:
            l = math.dist(a, b)
            if l <= 0 or reste <= 0: continue
            n = int(min(l, reste) // 9)
            for k in range(n + 1):
                p0 = k * 9 / l; p1 = min(1, (k * 9 + 5.5) / l)
                if p0 >= 1: break
                A_ = (a[0] + (b[0] - a[0]) * p0, a[1] + (b[1] - a[1]) * p0); B_ = (a[0] + (b[0] - a[0]) * p1, a[1] + (b[1] - a[1]) * p1)
                dr.line([(A_[0] + 1, A_[1] + 1), (B_[0] + 1, B_[1] + 1)], fill=(120, 90, 40), width=2)
                dr.line([A_, B_], fill=tuple(int(v) for v in L['rgb']), width=2)
            reste -= l
    return np.asarray(im).astype(np.float32)

CREME = np.array([236, 231, 219])
def rendre(t):
    xc = camera(t); fil, etat, x0 = toile_vue(t, xc)
    img = assembler(fil, etat, x0); dx = int(round((xc - x0) * S)); img = img[:, dx:dx + OUT]
    img = liens(img, t, xc)
    if t >= SILENCE - .3:   # le voile : la tapisserie se retire, la fleur vient
        u = np.clip((t - (SILENCE - .3)) / 1.0, 0, 1); img = img * (1 - .88 * u) + CREME * .88 * u
    # le cadre (brodé au tout début), le titre du chapitre
    img = poser(img, CADRE, prog=t / 1.6, ordre=np.where(CADRE >= 0, np.abs(xv - V / 2) + np.abs(yv - V / 2) + rng.random((V, V)), 1e9)) if t < 1.6 else poser(img, CADRE)
    for (ta, tb, s) in TITRES:
        if ta <= t <= tb + .8:
            g, o = titre_g(s); prog = min(1, (t - ta) / 1.4) if t <= tb else max(0, 1 - (t - tb) / .8)
            img = poser(img, g, prog, o)
    if t < SILENCE - .3:
        # la frise (elle s'allonge avec l'histoire) et le tambour de la fleur
        img = poser(img, FRISE, prog=min(1, t / (SILENCE - 4)), ordre=ORDRE_FRISE)
        st = STADES[stade(t)]; cx, cy = int(HC[0] * KV), int(HC[1] * KV); r = HR * KV
        h_, w_ = st.shape; ff = np.full((V, V), -1); ff[cy - h_ // 2:cy - h_ // 2 + h_, cx - w_ // 2:cx - w_ // 2 + w_] = st
        dist = np.hypot(xv - cx, yv - cy); dedans = dist < r; bois = (dist >= r) & (dist < r + 2.2); vis = (np.abs(xv - cx) < 2.5) & (yv >= cy - r - 5) & (yv < cy - r - 1)
        f2 = np.where(bois, K['3046'], np.where(vis, K['783'], np.where(dedans, ff, -1))); e2 = np.where(bois | vis | (dedans & (ff >= 0)), 1., np.where(dedans, 0., -1))
        hoop = assembler(np.where(f2 >= 0, f2, 0), np.clip(e2, 0, 1)); m = np.repeat(np.repeat(dedans | bois | vis, S, 0), S, 1); img[m] = hoop[m]
    else:
        if t >= DEBUT[7]:
            vv = np.clip((t - DEBUT[7]) / 2.5, 0, 1); img = poser(img, np.where((xv / V) < vv, CARTE, -1))
        if t < IMPACT: f = np.where(ORDRE_GF <= (np.quantile(ORDRE_GF[GF0 >= 0], np.clip((t - (SILENCE - .3)) / 1.6, 0, 1)) if t > SILENCE - .3 else -1), GF0, -1)
        else:
            o = min(1., (t - IMPACT) / 2.4); o = 1 - (1 - o) ** 3; f = grande_fleur(o)
            a = arc_ciel(t)
            if a is not None: f = np.where((a >= 0) & (GF1 < 0), a, f)
        if t >= mot(6, 'désarmée'): f = np.where((BLEUETS_G >= 0) & (f < 0), BLEUETS_G, f)
        if t >= DEBUT[7]: rd = ronde_c(t); f = np.where((rd >= 0) & (f < 0), rd, f)
        img = poser(img, f)
        if AIGUS <= t < IMPACT:
            uu = (t - AIGUS) / (IMPACT - AIGUS); y = -4 + (FC[1] - 17 + 4) * uu * uu
            gy, gx = np.mgrid[0:OUT, 0:OUT]; dd = np.hypot(gx - FC[0] * PXU, (gy - y * PXU) / 1.25); mm = dd < 2.2 * PXU
            img[mm] = img[mm] * .35 + np.array([225, 240, 250]) * .65; img[dd < .8 * PXU] = 255
        if IMPACT <= t < IMPACT + 3.5:
            r = (t - IMPACT) * 45; gy, gx = np.mgrid[0:OUT, 0:OUT] / PXU; dd = np.hypot(gx - FC[0], gy - FC[1])
            w = np.exp(-((dd - r) / 4) ** 2) * (1 - (t - IMPACT) / 3.5); img *= (1 + .5 * w[..., None]); img += 26 * w[..., None]
        if t >= PERLE:
            uu = min(1, (t - PERLE) / 1.2); gy, gx = np.mgrid[0:OUT, 0:OUT] / PXU; dd = np.hypot(gx - FC[0], gy - FC[1])
            g = np.exp(-(dd / (2.2 + 6 * uu)) ** 2) * uu * (.85 + .15 * math.sin((t - PERLE) * 12.566))
            img = img * (1 - .75 * g[..., None]) + 255 * .75 * g[..., None]
        tm = mot(8, 'monde', 1) - .6
        if t >= tm - 3.4:
            uu = np.clip((t - (tm - 3.4)) / 3.0, 0, 1); gy, gx = np.mgrid[0:OUT, 0:OUT] / PXU; dd = np.hypot(gx - FC[0], gy - FC[1])
            rayon = 70 * (1 - uu) ** 1.5 + .7; lum = np.clip(1 - (dd - rayon) / 3, 0, 1)
            fond = poser(np.broadcast_to(CREME, img.shape).astype(np.float32).copy(), CADRE)
            img = img * lum[..., None] + fond * (1 - lum[..., None])
            if t < tm + .5: img = np.where((dd < (1.2 + 2.2 * uu) * (1 - max(0, t - tm) / .5))[..., None], 255, img)   # le point de lumière s'efface quand le titre se brode
        if t >= tm: img = poser(img, TITRE, np.clip((t - tm) / 1.6, 0, 1), ORDRE_TITRE)
    return np.clip(img, 0, 255).astype(np.uint8)

if __name__ == '__main__':
    if PLANCHE:
        for v in PLANCHE.split(','): Image.fromarray(rendre(float(v))).resize((540, 540), Image.LANCZOS).save(f'{DST}-{v}.png')
        print('planche'); sys.exit()
    FPS = 25
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT}x{OUT}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', DST], stdin=subprocess.PIPE)
    for n in range(int(DUREE * FPS)):
        enc.stdin.write(rendre(n / FPS).tobytes())
        if n % 500 == 0: print(n, flush=True)
    enc.stdin.close(); enc.wait(); print('fini')
