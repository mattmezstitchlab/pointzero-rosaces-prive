"""LE MONDE AIME — la voix de Matt, illustrée en broderie animée, sur « La Fleur du Ciel ».

Une seule tapisserie qui se brode en se racontant (comme Bayeux) : cinq panneaux, un fil qui les relie (la tige).
La fleur grandit dans son petit tambour, chapitre après chapitre ; au silence elle vient au centre ; à l'impact elle éclôt.
Chaque élément apparaît sur le mot qui le dit (les mots et leurs instants : faster-whisper sur les 8 enregistrements).

  python3 -I monde.py <sortie.mp4> [--images t1,t2,…]"""
import sys, os, json, subprocess, math, numpy as np
from PIL import Image, ImageDraw, ImageFont
ICI = os.path.dirname(os.path.abspath(__file__)); SCR = os.path.dirname(ICI)
sys.path.insert(0, os.path.join(SCR, 'uptown', 'outils')); import brodeur as B

# ——— la fleur (mêmes pétales que « La Fleur du Ciel » brodée) ———
_av = sys.argv; sys.argv = [_av[0], os.path.join(SCR, 'fleur', 'rythme.json'), '/dev/null', '--images', '0']
FL = {'__file__': os.path.join(SCR, 'fleur', 'fleur.py'), '__name__': 'fleur'}
exec(compile(open(os.path.join(SCR, 'fleur', 'fleur.py')).read().split('\nif planche:')[0], 'fleur.py', 'exec'), FL)
sys.argv = _av
PLANCHE = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--images'), None)
DST = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and sys.argv[i - 1] != '--images'][0]

# ——— les fils : ceux de la fleur, puis ceux de la tapisserie ———
EXTRA = ['434', '801', '738', '437', '318', '414', '413', '310', '762', '321', '3753', '932', '930', '783', '725', '971', '740', '307',
         '950', '945', '793', '792', '820', '415', '822', '3781', '840', '3772', '407', '498', '3832', '3799', '445', '3371', '644', '3078', '3807']
CODES = FL['CODES'] + [c for c in EXTRA if c not in FL['CODES']]
IDX = {d['code']: i for i, d in enumerate(B.DMC)}
K = {c: k for k, c in enumerate(CODES)}; NP = len(CODES); TOILE = NP
RGB = np.array([B.DMC[IDX[c]]['rgb'] for c in CODES], float)
B.S = 9; B.N = B.S * B.SS; S = B.S
A = B.atlas([IDX[c] for c in CODES], np.random.default_rng(11))
V = 120; OUT = V * S                                          # la vue : 120 × 120 points, 1080 px
H = 120; PAN = 150; X0 = [10 + k * PAN for k in range(6)]    # la tapisserie : 6 panneaux (le 1er en deux)
LARG = X0[-1] + 140
VAR = (np.add.outer(np.arange(H) * 7919, np.arange(LARG) * 104729) % 4)
rng = np.random.default_rng(3)

# ——— la voix : où commence chaque morceau dans le morceau de musique, et l'instant de chaque mot ———
DEBUT = {1: .6, 2: 41.9, 3: 75.0, 4: 111.6, 5: 151.4, 6: 198.55, 7: 208.0, 8: 243.35}
MOTS = {int(k): v for k, v in json.load(open(os.path.join(ICI, 'mots.json'))).items()}
def mot(i, texte, n=1):
    """l'instant (dans le morceau) où commence le n-ième mot de l'enregistrement i qui contient « texte »"""
    for t0, t1, m in MOTS[i]:
        if texte.lower() in m.lower():
            n -= 1
            if n == 0: return DEBUT[i] + t0
    raise KeyError(f'{i}:{texte}')
SILENCE, AIGUS, IMPACT, PERLE, DUREE = 196.275, 196.775, 198.255, 242.75, 253.0

# ——— dessiner un élément : à grande échelle (8 px par point), puis chaque point prend le fil le plus présent ———
Q = 8
class Dessin:
    def __init__(self, w, h): self.w, self.h = w, h; self.im = Image.new('RGB', (w * Q, h * Q), (1, 2, 3)); self.d = ImageDraw.Draw(self.im)
    def c(self, code): return tuple(int(v) for v in RGB[K[code]])
    def P(self, pts): return [(x * Q, y * Q) for x, y in pts]
    def poly(self, pts, code): self.d.polygon(self.P(pts), fill=self.c(code))
    def ell(self, x, y, rx, ry, code, contour=None, ep=1):
        self.d.ellipse([(x - rx) * Q, (y - ry) * Q, (x + rx) * Q, (y + ry) * Q], fill=self.c(code) if code else None, outline=self.c(contour) if contour else None, width=int(ep * Q))
    def rect(self, x, y, w, h, code, contour=None, ep=1):
        self.d.rectangle([x * Q, y * Q, (x + w) * Q - 1, (y + h) * Q - 1], fill=self.c(code) if code else None, outline=self.c(contour) if contour else None, width=int(ep * Q))
    def ligne(self, pts, code, ep=1): self.d.line(self.P(pts), fill=self.c(code), width=max(1, int(ep * Q)), joint='curve')
    def arc(self, x, y, r, a0, a1, code, ep=1): self.d.arc([(x - r) * Q, (y - r) * Q, (x + r) * Q, (y + r) * Q], a0, a1, fill=self.c(code), width=int(ep * Q))
    def texte(self, x, y, s, taille, code, police='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', centre=True):
        f = ImageFont.truetype(police, int(taille * Q)); b = self.d.textbbox((0, 0), s, font=f)
        px = x * Q - ((b[2] - b[0]) / 2 + b[0] if centre else 0); self.d.text((px, y * Q - b[1]), s, font=f, fill=self.c(code))
    def points(self):
        a = np.asarray(self.im).reshape(self.h, Q, self.w, Q, 3).transpose(0, 2, 1, 3, 4).reshape(self.h, self.w, Q * Q, 3).astype(int)
        cle = a[..., 0] * 65536 + a[..., 1] * 256 + a[..., 2]
        out = np.full((self.h, self.w), -1)
        table = {int(r * 65536 + g * 256 + b): k for k, (r, g, b) in enumerate(RGB.astype(int))}
        for y in range(self.h):
            for x in range(self.w):
                v, n = np.unique(cle[y, x], return_counts=True)
                j = n.argmax(); fond = 1 * 65536 + 2 * 256 + 3
                if v[j] == fond:
                    if n[j] > Q * Q * .58 or len(v) == 1: continue
                    n[j] = 0; j = n.argmax()
                if n[j] >= Q * Q * .3: out[y, x] = table.get(int(v[j]), -1)
        return out

# ——— la tapisserie : des éléments, chacun brodé à son instant, dans son ordre ; certains se défont ———
ELEMENTS = []
def el(x, y, des, t, d=1.6, ordre='balaye', defait=None, dd=1.0, scintille=None, refait=None):
    g = des.points(); h, w = g.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(float); r = rng.random((h, w))
    cle = {'balaye': xx + r * 3, 'bas': -yy + r * 3, 'haut': yy + r * 3, 'centre': np.hypot(xx - w / 2, yy - h / 2) + r * 2, 'hasard': r * 10}[ordre]
    m = g >= 0; rang = np.zeros((h, w)); v = cle[m]; rang[m] = (v.argsort().argsort() / max(1, m.sum() - 1)) if m.sum() else 0
    ELEMENTS.append(dict(x=x, y=y, g=g, t=t, d=d, rang=rang, defait=defait, dd=dd, scintille=scintille, refait=refait))

def personne(D, x, y, h, corps, tete='945', bras=None):
    """une silhouette : tête ronde, corps en trapèze, jambes"""
    D.ell(x, y + h * .12, h * .12, h * .12, tete); D.poly([(x - h * .17, y + h * .28), (x + h * .17, y + h * .28), (x + h * .22, y + h * .72), (x - h * .22, y + h * .72)], corps)
    D.ligne([(x - h * .08, y + h * .7), (x - h * .1, y + h)], corps, h * .08); D.ligne([(x + h * .08, y + h * .7), (x + h * .1, y + h)], corps, h * .08)
    if bras: D.ligne(bras, corps, h * .07)

def main_(D, x, y, s, peau='945', ombre='3772', angle=0):
    """une main stylisée (paume et quatre doigts, pouce), tournée de « angle » degrés"""
    a = math.radians(angle); R = lambda px, py: (x + (px * math.cos(a) - py * math.sin(a)) * s, y + (px * math.sin(a) + py * math.cos(a)) * s)
    D.poly([R(-1, 0), R(1, 0), R(1.1, 1.6), R(-.9, 1.7)], peau)
    for k, (dx, L) in enumerate([(-.75, 1.5), (-.25, 1.8), (.25, 1.7), (.75, 1.3)]):
        D.ligne([R(dx, .1), R(dx, -L)], peau, s * .42); D.ell(*R(dx, -L), s * .21, s * .21, peau)
    D.ligne([R(1, .9), R(1.7, .1)], peau, s * .42); D.ligne([R(-.9, 1.65), R(1.05, 1.55)], ombre, s * .12)

# ===== Chapitre 1 — Aux origines =====
x = X0[0]
d = Dessin(1, 1); d.rect(0, 0, 1, 1, '725'); el(x + 60, 46, d, 1.0, .2)                                  # le premier point
d = Dessin(4, 70); d.ligne([(2, 0), (2, 70)], '3347', 1.2); el(x + 58, 47, d, 1.6, 5.5, 'haut')         # le fil descend : la tige
d = Dessin(44, 40); main_(d, 18, 22, 6.5, angle=-20); d.ligne([(30, 2), (40, 30)], '415', 1); d.ligne([(30, 2), (24, 14)], '3347', .6)
el(x + 30, 12, d, mot(1, 'main', 1), 2.2, 'bas')                                                         # « Il y avait la main »
d = Dessin(34, 32); d.poly([(5, 29), (31, 2), (27, 12), (11, 27)], '762'); d.ligne([(5, 29), (31, 2)], '414', .8); d.ligne([(2, 31), (32, 31)], '3799', .9)
el(x + 4, 36, d, mot(1, 'écrire'), 1.6)                                                                  # écrire : la plume
d = Dessin(34, 26)
for r_ in range(4):
    for c_ in range(5): d.rect(c_ * 7 + (3.5 if r_ % 2 else 0) - 3.5, 20 - r_ * 6.2, 6.4, 5.6, '407' if (r_ + c_) % 2 else '3772')
el(x + 80, 16, d, mot(1, 'construire'), 1.8, 'bas')                                                       # construire : les pierres
d = Dessin(46, 30); main_(d, 11, 14, 4.4, angle=60); main_(d, 35, 14, 4.4, angle=-60); d.ligne([(16, 12), (30, 12)], '321', 1)
el(x + 70, 72, d, mot(1, 'transmettre'), 2.0, 'centre')                                                  # transmettre : un fil passe
d = Dessin(140, 3); d.ligne([(0, 1.5), (140, 1.5)], '3347', 1.1); el(x - 10, 116, d, mot(1, 'fil'), 4.0)  # « un simple fil… »
x = X0[1]
d = Dessin(60, 16); d.texte(30, 1, '1746', 13, '801'); el(x + 30, 9, d, mot(1, '1746'), 1.4)
d = Dessin(100, 34)                                                                                      # Mulhouse : la manufacture
for k in range(5): d.poly([(k * 20, 34), (k * 20, 20), (k * 20 + 10, 12), (k * 20 + 20, 20), (k * 20 + 20, 34)], '3772' if k % 2 else '407')
for k in range(5): d.rect(k * 20 + 6, 24, 3, 4, '725'); d.rect(k * 20 + 12, 24, 3, 4, '725')
d.rect(84, 0, 5, 20, '801'); d.rect(64, 4, 4, 16, '801')
el(x + 10, 24, d, mot(1, 'Mulhouse'), 2.6, 'bas')
d = Dessin(30, 18)
for k in range(9): d.ell(4 + k * 3 + math.sin(k) * 2, 14 - k * 1.6, 2.2, 1.6, '762')
el(x + 94, 8, d, mot(1, 'textile'), 3.0, 'bas')                                                         # la fumée
for k, (lettre, mt) in enumerate([('D', 'D'), ('M', 'M'), ('C', 'C')]):                                  # « D, M, C »
    d = Dessin(22, 26); d.texte(11, 1, lettre, 22, '820'); el(x + 30 + k * 22, 60, d, mot(1, mt + (',' if lettre != 'C' else '.')) if False else [mot(1, 'D,'), mot(1, 'M,'), mot(1, 'C.')][k], .8, 'haut')
d = Dessin(120, 22)                                                                                      # « des centaines de couleurs » : l'éventail
FAN = ['321', '971', '725', '307', '704', '3347', '3810', '996', '3755', '797', '552', '3609', '3731', '3716', '783', '434', '801', '310', '762', '3865']
for k, c in enumerate(FAN):
    a = math.radians(200 + k * 140 / (len(FAN) - 1)); d.ligne([(60, 22), (60 + math.cos(a) * 21 * 2.6, 22 + math.sin(a) * 21)], c, 2.2)
el(x + 0, 88, d, mot(1, 'centaines'), 2.2, 'centre')
d = Dessin(100, 4)
for k in range(24): d.rect(2 + k * 4, 1, 2, 2, FAN[k % len(FAN)])
el(x + 10, 111, d, mot(1, 'gestes'), 1.6)                                                               # « des millions de gestes »

# ===== Chapitre 2 — La mémoire des hommes =====
x = X0[2]
d = Dessin(120, 3); d.rect(0, 0, 40, 3, '820'); d.rect(40, 0, 40, 3, 'B5200'); d.rect(80, 0, 40, 3, '321'); el(x, 2, d, DEBUT[2], 2.0)
d = Dessin(112, 14); d.texte(56, 1, 'Georges Clemenceau', 8.4, '930', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'); el(x + 4, 8, d, mot(2, 'Georges'), 1.8)
d = Dessin(60, 9); d.texte(30, 1, '11 · 11 · 1918', 7, '932'); el(x + 30, 21, d, mot(2, 'Clémenceau') + .9, 1.0)
d = Dessin(120, 20)                                                                                      # « des hommes partis au combat »
for k in range(7): personne(d, 8 + k * 15, 2, 16, '932', '932', [(8 + k * 15, 9), (12 + k * 15, 5)]); d.ell(8 + k * 15, 3, 3, 1.6, '930')
el(x, 32, d, mot(2, 'hommes'), 2.0, 'balaye', defait=mot(2, 'nommer') - .6, dd=1.4, refait=mot(2, 'choisir'))
d = Dessin(54, 50)                                                                                      # l'Arc de Triomphe
d.rect(0, 6, 54, 44, '437'); d.rect(0, 2, 54, 5, '840'); d.rect(-1, 0, 56, 3, '3781')
d.d.chord([17 * Q, 18 * Q, 37 * Q, 38 * Q], 180, 360, fill=(1, 2, 3)); d.rect(17, 28, 20, 22, None); d.d.rectangle([17 * Q, 28 * Q, 37 * Q - 1, 50 * Q], fill=(1, 2, 3))
for k in range(3): d.rect(3 + k * 4, 12, 2, 30, '840'); d.rect(41 + k * 4, 12, 2, 30, '840')
el(x + 33, 50, d, mot(2, 'soldat', 1), 3.2, 'bas')
FLAMME = (x + 60, 99)
d = Dessin(8, 10); d.poly([(4, 0), (8, 7), (4, 10), (0, 7)], '971'); d.poly([(4, 3), (6, 7), (4, 9), (2, 7)], '307')
el(FLAMME[0] - 4, FLAMME[1] - 10, d, mot(2, 'inconnue'), .8, 'bas', scintille=True)                     # la flamme
d = Dessin(22, 10); d.ell(11, 8, 11, 7, '932'); d.rect(0, 8, 22, 2, '930'); d.ell(11, 3, 3, 2, '932')
el(x + 49, 101, d, mot(2, 'présence'), 1.8, 'bas')                                                      # le casque, sans visage
d = Dessin(120, 16)                                                                                      # les bleuets, la mémoire
for k in range(12):
    cx, cy = 5 + k * 10 + (k % 2) * 2, 10 - (k % 3) * 2; d.ligne([(cx, cy), (cx + 1, 16)], '3347', .6)
    for j in range(6): a = j * math.pi / 3; d.ell(cx + math.cos(a) * 2, cy + math.sin(a) * 2, 1.3, 1.3, '3807')
    d.ell(cx, cy, 1, 1, '820')
el(x, 99, d, mot(2, 'mémoire'), 2.4, 'centre')
d = Dessin(4, 4); d.ell(2, 2, 1.6, 1.6, '725'); el(x + 112, 112, d, mot(2, 'commence'), .6)              # « créer commence ici »

# ===== Chapitre 3 — Le commencement d'un regard =====
x = X0[3]
d = Dessin(50, 9); d.texte(0, 1, 'Saint-Luc', 8, '801', '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', centre=False); el(x + 2, 6, d, mot(3, 'Saint'), 1.4)
d = Dessin(34, 26); d.rect(0, 0, 34, 26, None, '801', 1.4); d.rect(2, 13, 30, 11, '3755'); d.ell(22, 9, 4, 4, '725'); d.rect(2, 16, 30, 8, '3347')
el(x + 4, 18, d, mot(3, 'image'), 2.0, 'centre')
SYM = [(46, 20), (58, 30), (44, 40), (60, 12), (70, 40)]
for k, (sx, sy) in enumerate(SYM):
    d = Dessin(6, 6); d.d.rectangle([0, 0, 6 * Q - 1, 6 * Q - 1], fill=d.c('3865')); B._dessiner_symbole(d.d, B.SYMB[k * 3 % len(B.SYMB)], 3 * Q, 3 * Q, 2.2 * Q, d.c('310'), Q)
    el(x + sx, sy, d, mot(3, 'signes') + (0 if k < 2 else mot(3, 'symboles') - mot(3, 'signes')) + k * .25, .5, 'centre')
d = Dessin(40, 40)
for (a, b) in [(0, 1), (1, 2), (0, 3), (1, 4), (2, 4)]: d.ligne([(SYM[a][0] - 40 + 3, SYM[a][1] - 10 + 3), (SYM[b][0] - 40 + 3, SYM[b][1] - 10 + 3)], '3832', .5)
el(x + 40, 10, d, mot(3, 'relations'), 1.6)
d = Dessin(30, 30)                                                                                      # le dessin : une fleur au trait…
for j in range(6): a = j * math.pi / 3; d.ell(15 + math.cos(a) * 7, 13 + math.sin(a) * 7, 4.5, 4.5, None, '413', .6)
d.ligne([(15, 20), (15, 30)], '413', .6); el(x + 6, 52, d, mot(3, 'dessinais'), 1.2, 'haut')
d = Dessin(30, 30)                                                                                      # … puis composée en couleurs
for j in range(6): a = j * math.pi / 3; d.ell(15 + math.cos(a) * 7, 13 + math.sin(a) * 7, 4.5, 4.5, ['3716', '3609', '210', '3755', '725', '3354'][j])
d.ell(15, 13, 3, 3, '725'); d.ligne([(15, 20), (15, 30)], '3347', 1)
el(x + 6, 52, d, mot(3, 'composais'), 1.2, 'centre', scintille='couleurs', refait=None)
d = Dessin(44, 50)                                                                                      # le saxophone
d.ligne([(10, 2), (14, 6), (16, 36), (22, 44), (30, 44), (36, 38), (37, 28)], '783', 3.4); d.ell(37, 26, 5, 3.2, '725')
d.ligne([(10, 2), (6, 0)], '310', 1.2)
for k in range(6): d.ell(15.2 + k * .15, 12 + k * 4, 1.1, 1.1, '445')
el(x + 80, 14, d, mot(3, 'musique'), 2.4, 'haut')
for k in range(3):                                                                                       # le son
    d = Dessin(30, 30); d.arc(0, 15, 8 + k * 6, -40, 40, '725', .7); el(x + 120, 25, d, mot(3, 'saxophone') + .4 + k * .3, .6, 'centre')
d = Dessin(30, 24); personne(d, 8, 1, 22, '3755'); personne(d, 22, 1, 22, '3716'); el(x + 0, 86, d, mot(3, 'rencontres'), 1.1, 'centre')
d = Dessin(22, 16); d.ell(8, 8, 6, 6, None, '725', 1.4); d.ell(14, 8, 6, 6, None, '783', 1.4); el(x + 30, 90, d, mot(3, 'mariages'), 1.0, 'centre')
d = Dessin(32, 20); main_(d, 7, 11, 2.8, angle=80); main_(d, 25, 11, 2.8, angle=-80); el(x + 52, 88, d, mot(3, 'séparations'), 1.0, 'centre')
d = Dessin(10, 22); d.rect(2, 8, 6, 14, '3865'); d.poly([(5, 0), (8, 5), (5, 8), (2, 5)], '725'); el(x + 84, 86, d, mot(3, 'hommages'), .9, 'bas', scintille=True)
d = Dessin(90, 16)
for k in range(14): d.rect(2 + rng.random() * 86, 1 + rng.random() * 13, 1, 1, 'B5200')
el(x + 0, 84, d, mot(3, 'instants'), 1.6, 'hasard', scintille='etoiles')
d = Dessin(56, 22)                                                                                       # « ceux qu'elle relie »
for k in range(5): personne(d, 6 + k * 11, 6, 15, ['321', '3755', '725', '3347', '552'][k])
for k in range(4): d.ligne([(6 + k * 11, 11), (17 + k * 11, 11)], ['3832', '996', '783', '704'][k], .5)
el(x + 64, 62, d, mot(3, 'vivre'), 1.6)

# ===== Chapitre 4 — Les années invisibles =====
x = X0[4]
d = Dessin(14, 14); d.ell(7, 7, 6, 6, '3078'); d.ell(10, 5, 5, 5, None); d.d.ellipse([5 * Q, 0, 15 * Q, 10 * Q], fill=(1, 2, 3)); el(x + 104, 6, d, DEBUT[4] + .3, 1.6, 'centre')
FEN = []
for k in range(16):                                                                                      # fichiers, interfaces
    fx, fy = 4 + (k % 6) * 19 + rng.integers(-2, 3), 14 + (k // 6) * 16 + rng.integers(-2, 3)
    d = Dessin(14, 11)
    if k % 3 == 0: d.poly([(0, 0), (9, 0), (13, 4), (13, 11), (0, 11)], '762'); d.ligne([(9, 0), (9, 4), (13, 4)], '414', .4)
    else: d.rect(0, 0, 14, 11, '762', '414', .4); d.rect(0, 0, 14, 2.5, ['3755', '3716', '725', '3347'][k % 4])
    t0 = mot(4, 'fichiers') if k % 3 == 0 else mot(4, 'centaines') + (k % 6) * .2
    defait = mot(4, 'abandonnés') + .2 if k in (2, 7, 11) else None
    el(x + fx, fy, d, t0, .7, 'hasard', defait=defait, dd=.6, refait=mot(4, 'recommencés') if defait else None)
    FEN.append((x + fx, fy))
d = Dessin(30, 8)
for k in range(5): d.ell(3 + k * 6, 4, 2.6, 2.6, '725', '783', .4)
el(x + 4, 66, d, mot(4, 'dépenses'), 1.0, 'balaye')
d = Dessin(110, 10)
for k in range(12): d.rect(rng.random() * 108, rng.random() * 9, 1, 1, '3078')
el(x + 4, 2, d, mot(4, 'nuits'), 1.4, 'hasard', scintille='etoiles')
d = Dessin(110, 6)                                                                                       # les systèmes qui ne se parlent pas : des fils rompus
for k in range(3): d.ligne([(10 + k * 36, 3), (24 + k * 36, 3)], '321', .5); d.ligne([(28 + k * 36, 3), (40 + k * 36, 3)], '321', .5)
el(x + 2, 60, d, mot(4, 'parlaient'), 1.0, scintille='clignote')
d = Dessin(36, 30); d.rect(4, 18, 28, 3, '801'); d.rect(6, 21, 2, 9, '801'); d.rect(28, 21, 2, 9, '801')    # seul, à sa table
personne(d, 18, 2, 18, '3781'); d.ligne([(30, 18), (30, 8), (26, 6)], '310', .6); d.ell(26, 7, 3, 1.6, '725')
el(x + 42, 76, d, mot(4, 'seuls'), 1.8, 'bas')
d = Dessin(26, 18)                                                                                       # le fil emmêlé
for k in range(9): d.arc(13 + math.cos(k) * 4, 9 + math.sin(k * 1.7) * 3, 3 + k % 3 * 1.4, k * 40, k * 40 + 250, '3347', .45)
el(x + 82, 82, d, mot(4, 'réunir'), 2.2, 'hasard')
for k, (mt, n) in enumerate([('Pourquoi', 1), ('Pourquoi', 2), ('Pourquoi', 3)]):
    d = Dessin(16, 22); d.texte(8, 1, '?', 20, '321'); t0 = mot(4, mt, n)
    el(x + 8 + k * 40, 36, d, t0, .7, 'haut', defait=t0 + 2.0, dd=.8)

# ===== Chapitre 5 — La découverte =====
x = X0[5]
CX, CY = x + 60, 50
d = Dessin(48, 36)                                                                                       # l'atlas : le Cube déplié
for (cx_, cy_) in [(12, 0), (0, 12), (12, 12), (24, 12), (36, 12), (12, 24)]: d.rect(cx_, cy_, 12, 12, None, '801', .8)
el(CX - 24, 16, d, mot(5, 'atlas'), 2.0)
for k, (cx_, cy_) in enumerate([(12, 0), (0, 12), (12, 12), (24, 12), (36, 12), (12, 24)]):
    d = Dessin(8, 8); d.rect(0, 0, 8, 8, ['3755', '3716', '725', '3347', '210', '971'][k]); el(CX - 24 + cx_ + 2, 16 + cy_ + 2, d, mot(5, 'morceaux') + k * .3, .5, 'centre')
d = Dessin(30, 6)
for k in range(6): d.ligne([(k * 5, 1), (k * 5 + 3, 4)], '414', .5); d.ligne([(k * 5 + 3, 1), (k * 5, 4)], '414', .5)
el(x + 4, 60, d, mot(5, 'répétitions'), .9)
d = Dessin(6, 6); d.ligne([(0, 0), (6, 6)], '321', .8); d.ligne([(6, 0), (0, 6)], '321', .8); el(x + 38, 60, d, mot(5, 'erreurs'), .5)
d = Dessin(16, 6); d.ligne([(0, 3), (7, 3)], '932', .6); d.poly([(7, 1), (9, 3), (7, 5)], '932'); d.ligne([(16, 3), (9.5, 3)], '3832', .6); d.poly([(9.5, 1), (7.5, 3), (9.5, 5)], '3832')
el(x + 48, 60, d, mot(5, 'contradictions'), .9)
d = Dessin(48, 36)                                                                                       # ceux qui existent déjà se comprennent : les liens
for (a, b) in [((18, 6), (18, 18)), ((6, 18), (18, 18)), ((18, 18), (30, 18)), ((30, 18), (42, 18)), ((18, 18), (18, 30))]: d.ligne([a, b], '3832', .6)
el(CX - 24, 16, d, mot(5, 'comprendre'), 1.4)
d = Dessin(70, 7)
for k in range(9):
    B._dessiner_symbole(d.d, B.SYMB[(k * 5) % len(B.SYMB)], (4 + k * 8) * Q, 3.5 * Q, 2.4 * Q, d.c('310'), Q)
el(CX - 35, 68, d, mot(5, 'langage'), 1.2)
for k, (txt, mt, px, py) in enumerate([('RÈGLES', 'règles', x + 6, 80), ('GESTES', 'gestes', x + 84, 80), ('PREUVES', 'preuves', x + 6, 100), ('PERMISSIONS', 'permissions', x + 74, 100)]):
    d = Dessin(46, 7); d.texte(0, 1, txt, 5.6, '820', centre=False); el(px, py, d, mot(5, mt), .9)
d = Dessin(5, 5); d.ell(2.5, 2.5, 2.4, 2.4, '725'); el(CX - 2, 88, d, mot(5, 'point', 1), .4, 'centre')      # « un point »
for k, (mt, dx, dy) in enumerate([('créer', -28, -6), ('transmettre', 26, -6), ('retrouver', -28, 14), ('continuer', 26, 14)]):
    d = Dessin(30, 24); d.ligne([(15, 12), (15 + dx * .5, 12 + dy * .9)], '725', .5); el(CX - 15, 78, d, mot(5, mt), .6, 'centre')
d = Dessin(60, 16); d.texte(30, 1, 'AIME', 14, '310'); el(CX - 30, 98, d, mot(5, 'M.') if any('M.' in m[2] for m in MOTS[5]) else DEBUT[5] + 43.2, .9, 'balaye')

# ——— le temps de chaque point de chaque élément ———
for e in ELEMENTS:
    e['tp'] = e['t'] + e['rang'] * e['d']

# ——— la caméra : elle va d'un panneau à l'autre pendant les respirations de la voix ———
CAM = [(0, X0[0]), (19.6, X0[0]), (21.3, X0[1]), (DEBUT[2] - 1.2, X0[1]), (DEBUT[2] + .6, X0[2]), (DEBUT[3] - 1.0, X0[2]), (DEBUT[3] + .6, X0[3]),
       (DEBUT[4] - 1.0, X0[3]), (DEBUT[4] + .4, X0[4]), (DEBUT[5] - .9, X0[4]), (DEBUT[5] + .4, X0[5])]
def camera(t):
    for (ta, xa), (tb, xb) in zip(CAM, CAM[1:]):
        if ta <= t <= tb: u = (t - ta) / max(1e-6, tb - ta); u = u * u * (3 - 2 * u); return xa + (xb - xa) * u
    return CAM[-1][1]

# ——— la fleur dans son petit tambour : graine, pousse, feuille, tige qui ploie, bouton ———
def petite_fleur(stade):
    D = Dessin(30, 30); D.rect(0, 22, 30, 8, '3781')
    if stade == 0: D.ell(15, 22, 2.4, 1.6, '801')
    if stade >= 1:
        h = [0, 7, 11, 13, 16][stade]; plie = 3 if stade == 3 else 0
        D.ligne([(15, 23), (15 + plie, 23 - h * .6), (15 + plie * .3, 23 - h)], '3347', 1.2)
        D.ell(13, 21 - h * .3, 2.4, 1.3, '3348')
        if stade >= 2: D.ell(19, 20 - h * .5, 3.4, 1.6, '3347')
        if stade == 4: D.ell(15, 23 - h - 2, 2.4, 3.6, '3716'); D.ell(15, 23 - h - 1, 1.6, 2, '3865')
    return D.points()
STADES = [petite_fleur(k) for k in range(5)]
def stade(t): return 0 if t < DEBUT[2] else 1 if t < DEBUT[3] else 2 if t < DEBUT[4] else 3 if t < DEBUT[5] else 4
HOOP = (19, 101, 15)   # le petit tambour : centre, rayon (points de la vue)

# ——— la grande fleur (fin) : les pétales de « La Fleur du Ciel », à l'échelle de la vue ———
FC = (60, 56); ECH = .74
yv, xv = np.mgrid[0:V, 0:V]
FX = np.clip(((xv - FC[0]) / ECH + FL['C'][0]).round().astype(int), 0, 159); FY = np.clip(((yv - FC[1]) / ECH + FL['C'][1]).round().astype(int), 0, 159)
DCV = np.hypot(xv - FC[0], yv - FC[1])
def grande_fleur(o): f = FL['petales'](o); return f[FY, FX]
GF0 = grande_fleur(0.); GF1 = grande_fleur(1.)
ORDRE_GF = np.where(GF0 >= 0, DCV + rng.random((V, V)), 1e9)
def arc_ciel(t):
    u = np.clip((t - 200.25) / 6, 0, 1)
    if u <= 0: return None
    ang = (np.degrees(np.arctan2(xv - FC[0], -(yv - FC[1]))) + 360) % 360; band = 44 + 5.5 - DCV
    m = (band >= 0) & (band < 5.5) & (ang <= u * 360)
    return np.where(m, np.array([K[c] for c in ['321', '971', '307', '704', '996', '797']])[np.clip((band).astype(int), 0, 5)], -1)
def ronde(t):
    """« Pour les anciens, les enfants, les artistes… » : une ronde de silhouettes autour de la fleur, chacune à son mot"""
    D = Dessin(V, V)
    qui = [('anciens', '3781'), ('enfants', '3755'), ('artistes', '552'), ('amoureux', '321'), ('artisans', '434'), ('lumière', '725'), ('personne', '414')]
    n = 0; rr = 58
    for k, (mt, c) in enumerate(qui):
        if t >= mot(7, mt): a = math.radians(-150 + k * 22); personne(D, FC[0] + math.cos(a) * rr, FC[1] + math.sin(a) * rr - 6, 11 if mt != 'enfants' else 8, c); n += 1
    if t >= mot(7, 'générations'):
        m = int(min(16, (t - mot(7, 'générations')) / .3))
        for k in range(m): a = math.radians(8 + k * 12.5); personne(D, FC[0] + math.cos(a) * rr, FC[1] + math.sin(a) * rr - 6, 10, ['3347', '3609', '996', '783', '3832', '820', '3772', '704'][k % 8])
    if t >= mot(7, 'retrouvent') - .3: D.ell(FC[0], FC[1], rr + 1, rr + 1, None, '725', .45)
    return D.points()
RONDE_CACHE = {}
def ronde_c(t):
    cle = round(t * 5) / 5
    if cle not in RONDE_CACHE: RONDE_CACHE.clear(); RONDE_CACHE[cle] = ronde(cle)
    return RONDE_CACHE[cle]
CARTE = None
def carte():
    D = Dessin(V, V)   # une carte du monde stylisée (des continents simples), bleu très pâle
    for pts in [[(10, 30), (32, 22), (40, 34), (30, 48), (24, 62), (18, 50), (8, 42)], [(26, 66), (36, 64), (40, 82), (32, 100), (28, 88)],
                [(52, 26), (66, 20), (70, 30), (60, 36), (54, 34)], [(54, 40), (70, 40), (74, 60), (64, 84), (56, 70), (52, 52)],
                [(70, 22), (104, 20), (112, 36), (96, 50), (84, 46), (74, 36)], [(94, 74), (110, 72), (112, 84), (98, 86)]]:
        D.poly(pts, '3753')
    for (a, b) in [((60, 30), (64, 36)), ((84, 30), (90, 42)), ((30, 34), (24, 46))]: D.ligne([a, b], '932', .4)
    return D.points()
CARTE = carte()
TITRE = None
def titre():
    D = Dessin(V, V); D.texte(60, 46, 'LE MONDE AIME', 11, '310', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
    D.texte(60, 62, 'D’un seul point, un monde.', 7.5, '3781', '/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf'); return D.points()
TITRE = titre(); ORDRE_TITRE = np.where(TITRE >= 0, xv + rng.random((V, V)) * 3, 1e9)

# ——— une image ———
def toile_vue(t, xc):
    """la tapisserie autour de la caméra : (fils, brodé ?, demi ?) pour 121 colonnes"""
    x0 = int(math.floor(xc)); fil = np.full((H, V + 1), -1); etat = np.zeros((H, V + 1))   # 0 vide, .5 demi, 1 fait
    for e in ELEMENTS:
        h, w = e['g'].shape
        if e['x'] + w < x0 or e['x'] > x0 + V + 1 or t < e['t']: continue
        p = (t - e['tp']) / .25; s = np.clip(p, 0, 1)
        if e['defait'] is not None and t >= e['defait']:
            back = np.clip((t - e['defait'] - (1 - e['rang']) * e['dd']) / .2, 0, 1)
            if e['refait'] is not None and t >= e['refait']: back = np.clip(1 - (t - e['refait'] - e['rang'] * 1.2) / .2, 0, 1) * back
            s = s * (1 - back)
        g = e['g'].copy()
        if e['scintille'] is True:    # la flamme
            k = int(t * 8) % 3; g = np.where(g == K['971'], [K['971'], K['740'], K['725']][k], np.where(g == K['307'], [K['307'], K['445'], K['307']][k], g))
        elif e['scintille'] == 'etoiles':
            g = np.where((np.random.default_rng(int(t * 4)).random(g.shape) < .3) & (g >= 0), K['3078'], g)
        elif e['scintille'] == 'clignote' and int(t * 3) % 2: s = s * 0
        elif e['scintille'] == 'couleurs' and t > e['t'] + 1.3 and t < e['t'] + 4:
            pal = np.array([K[c] for c in ['3716', '3609', '210', '3755', '725', '3354', '971', '996']]); sh = int((t - e['t']) * 4)
            lut = np.arange(NP + 1); lut[pal] = pal[(np.arange(len(pal)) + sh) % len(pal)]
            g = np.where(g >= 0, lut[np.clip(g, 0, NP)], g)
        ys, xs = slice(max(0, e['y']), min(H, e['y'] + h)), slice(max(0, e['x'] - x0), min(V + 1, e['x'] + w - x0))
        gy, gx = slice(ys.start - e['y'], ys.stop - e['y']), slice(xs.start - (e['x'] - x0), xs.stop - (e['x'] - x0))
        gg, ss = g[gy, gx], s[gy, gx]; m = (gg >= 0) & (ss > 0)
        fil[ys, xs] = np.where(m, gg, fil[ys, xs]); etat[ys, xs] = np.where(m, np.where(ss >= 1, 1, .5), etat[ys, xs])
    # les bordures (Bayeux) : deux filets brun, brodés au passage
    for yb in (5, 113):
        cols = np.arange(x0, x0 + V + 1); faite = cols < 10 + t * (LARG / 196.)
        fil[yb, :] = np.where(faite, K['434'], fil[yb, :]); etat[yb, :] = np.where(faite, 1, etat[yb, :])
    return fil, etat, x0

def assembler(fil, etat):
    ii = np.where(etat >= 1, fil, TOILE); h, w = fil.shape
    img = B.assembler(A['tissu'], ii, VAR[:h, :w]).astype(np.float32)
    demi = etat == .5
    if demi.any(): dd = B.assembler(A['demi'], np.where(demi, fil, TOILE), VAR[:h, :w]); mk = np.repeat(np.repeat(demi, S, 0), S, 1); img[mk] = dd[mk]
    vide = np.repeat(np.repeat(etat == 0, S, 0), S, 1)
    if vide.any(): img[vide] = B.assembler(A['toile'], np.full((h, w), TOILE), VAR[:h, :w])[vide]
    return img

def rendre(t):
    xc = camera(t); fil, etat, x0 = toile_vue(t, xc)
    img = assembler(fil, etat); dx = int(round((xc - x0) * S)); img = img[:, dx:dx + OUT]
    # le petit tambour (jusqu'au silence) ; puis la grande fleur au centre
    if t < SILENCE - .3:
        st = STADES[stade(t)]; cx, cy, r = HOOP
        ff = np.full((V, V), -1); ee = np.zeros((V, V))
        sub = ff[cy - 15:cy + 15, cx - 15:cx + 15]; sub[:] = st; ee[cy - 15:cy + 15, cx - 15:cx + 15] = (st >= 0) * 1.
        dist = np.hypot(xv - cx, yv - cy); dedans = dist < r
        bois = (dist >= r) & (dist < r + 1.6)
        hoop = assembler(np.where(bois, K['437'], ff), np.where(bois | (dedans & (ee > 0)), 1., np.where(dedans, 0., -1)))
        m = np.repeat(np.repeat(dedans | bois, S, 0), S, 1); img[m] = hoop[m]
    else:
        # la tapisserie s'efface derrière un voile ; la grande fleur se brode au centre, puis éclôt
        u = np.clip((t - (SILENCE - .3)) / 1.0, 0, 1) * (1 if t < 246 else 1)
        img = img * (1 - .86 * u) + np.array([236, 231, 219]) * .86 * u
        if t >= 208.0:
            vv = np.clip((t - 208.0) / 2.5, 0, 1); cm = CARTE >= 0
            cimg = assembler(np.where(cm, CARTE, -1), np.where(cm, 1., 0.)); mm = np.repeat(np.repeat(cm & (xv * 0 + vv > (xv / V)), S, 0), S, 1)
            if t >= mot(7, 'frontières'): pass
            img[mm] = cimg[mm]
        if t < IMPACT:
            prog = np.clip((t - (SILENCE - .3)) / 1.6, 0, 1); seuil = np.quantile(ORDRE_GF[GF0 >= 0], prog) if prog > 0 else -1
            fait = (ORDRE_GF <= seuil); f = np.where(fait, GF0, -1); e_ = np.where(fait, 1., 0.)
        else:
            o = min(1., (t - IMPACT) / 2.4); o = 1 - (1 - o) ** 3; f = grande_fleur(o); e_ = (f >= 0) * 1.
            a = arc_ciel(t)
            if a is not None: f = np.where((a >= 0) & (GF1 < 0), a, f); e_ = np.where(f >= 0, 1., 0.)
        if t >= mot(6, 'désarmée'):     # « Pour une paix désarmée » : des bleuets au pied de la fleur
            f = np.where((BLEUETS_G >= 0) & (f < 0), BLEUETS_G, f); e_ = np.where(f >= 0, 1., 0.)
        if t >= DEBUT[7]:
            rd = ronde_c(t); f = np.where((rd >= 0) & (f < 0), rd, f); e_ = np.where(f >= 0, 1., 0.)
        fi = assembler(np.where(f >= 0, f, 0), e_); m = np.repeat(np.repeat(e_ > 0, S, 0), S, 1); img[m] = fi[m]
        # la goutte ; l'onde à l'impact
        if AIGUS <= t < IMPACT:
            uu = (t - AIGUS) / (IMPACT - AIGUS); y = -4 + (FC[1] - 21 + 4) * uu * uu
            gy, gx = np.mgrid[0:OUT, 0:OUT]; dd = np.hypot(gx - FC[0] * S, (gy - y * S) / 1.25); mm = dd < 2.6 * S
            img[mm] = img[mm] * .35 + np.array([225, 240, 250]) * .65; img[dd < S] = 255
        if IMPACT <= t < IMPACT + 3.5:
            r = (t - IMPACT) * 45; gy, gx = np.mgrid[0:OUT, 0:OUT] / S; dd = np.hypot(gx - FC[0], gy - FC[1])
            w = np.exp(-((dd - r) / 4) ** 2) * (1 - (t - IMPACT) / 3.5); img *= (1 + .55 * w[..., None]); img += 30 * w[..., None]
        if t >= PERLE:
            uu = min(1, (t - PERLE) / 1.2); gy, gx = np.mgrid[0:OUT, 0:OUT] / S; dd = np.hypot(gx - FC[0], gy - FC[1])
            g = np.exp(-(dd / (2.5 + 7 * uu)) ** 2) * uu * (.85 + .15 * math.sin((t - PERLE) * 12.566))
            img = img * (1 - .75 * g[..., None]) + 255 * .75 * g[..., None]
        # la fleur devient un point de lumière, puis l'accueil : « LE MONDE AIME »
        tm = mot(8, 'monde', 1) - .6
        if t >= tm - 3.4:
            uu = np.clip((t - (tm - 3.4)) / 3.0, 0, 1); gy, gx = np.mgrid[0:OUT, 0:OUT] / S; dd = np.hypot(gx - FC[0], gy - FC[1])
            rayon = 80 * (1 - uu) ** 1.5 + .8; lum = np.clip(1 - (dd - rayon) / 3, 0, 1)
            img = img * lum[..., None] + np.array([236, 231, 219]) * (1 - lum[..., None])
            img = np.where((dd < 1.4 + 2.5 * uu)[..., None], 255, img)
        if t >= tm:
            prog = np.clip((t - tm) / 1.6, 0, 1); seuil = np.quantile(ORDRE_TITRE[TITRE >= 0], prog)
            fait = ORDRE_TITRE <= seuil; ti = assembler(np.where(fait, TITRE, 0), fait * 1.); m = np.repeat(np.repeat(fait, S, 0), S, 1); img[m] = ti[m]
    if t > DUREE - 1.2: uu = (t - (DUREE - 1.2)) / 1.2; img = img * (1 - .25 * uu) + 236 * .25 * uu
    return np.clip(img, 0, 255).astype(np.uint8)

# les bleuets de la paix (une fois)
_D = Dessin(V, V)
for k in range(7):
    cx_, cy_ = FC[0] - 21 + k * 7, 104 - (k % 2) * 3; _D.ligne([(cx_, cy_), (cx_, 113)], '3347', .6)
    for j in range(6): a2 = j * math.pi / 3; _D.ell(cx_ + math.cos(a2) * 1.8, cy_ + math.sin(a2) * 1.8, 1.2, 1.2, '3807')
    _D.ell(cx_, cy_, .9, .9, '820')
BLEUETS_G = _D.points()

if __name__ == '__main__':
    if PLANCHE:
        for v in PLANCHE.split(','): Image.fromarray(rendre(float(v))).resize((540, 540), Image.LANCZOS).save(f'{DST}-{v}.png')
        print('planche'); sys.exit()
    FPS = 25
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT}x{OUT}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', DST], stdin=subprocess.PIPE)
    for n in range(int(DUREE * FPS)):
        enc.stdin.write(rendre(n / FPS).tobytes())
        if n % 500 == 0: print(n, flush=True)
    enc.stdin.close(); enc.wait(); print('fini')
