"""« La Fleur du Ciel » brodée : la fleur se brode pendant 3 min 18, et éclôt à l'impact (03:18.255).

  python3 -I fleur.py <rythme.json> <sortie-image.mp4> [début fin] [--images t1,t2,…  (planche : seulement ces instants, en PNG)]

Repères (mesurés, documents LUMIERE) : le silence 03:16.275 → 03:16.750 ; les aigus sans basse 03:16.775 → 03:18.240 ;
le contact 03:18.255 (+53 dB de basse en 20 ms) ; l'arc-en-ciel 03:20.25 → 03:26.25 ; la Perle s'allume 04:02.75 ; fin 04:13.
Le ciel se brode en anneaux ; chaque anneau prend la couleur du moment du morceau où il est brodé (le voyage du film)."""
import sys, os, json, subprocess, numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'uptown', 'outils')); import brodeur as B

_ix = sys.argv.index('--images') if '--images' in sys.argv else None
args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and (_ix is None or i != _ix + 1)]
frythme, dst = args[0], args[1]
deb = float(args[2]) if len(args) > 2 else 0.; fin_r = float(args[3]) if len(args) > 3 else 1e9
planche = next((sys.argv[i + 1] for i, a in enumerate(sys.argv) if a == '--images'), None)
R = json.load(open(frythme)); DUREE = R['duree']; EN = np.array(R['energie'])
G, FPS, S = 160, 25, B.S; OUT = G * S
SILENCE, AIGUS, IMPACT, ARC0, ARC1, PERLE = 196.275, 196.775, 198.255, 200.25, 206.25, 242.75

# ——— les fils ———
CODES = ['939', '823', '336', '333', '3746', '3838', '3807', '3755', '3325', '775', '3756', '3716', '3354', '778', '3609', '3740', '3768', '931', '3810',
         '3766', '3865', 'B5200', '712', '3822', '729', '676', '3078', '726', '3348', '3347', '3346', '988', '210', '211', '3747', '340', '666', '946',
         '743', '704', '996', '797', '3731', '3843', '552']
IDX = {d['code']: i for i, d in enumerate(B.DMC)}
PAL = [IDX[c] for c in CODES]; K = {c: k for k, c in enumerate(CODES)}; TOILE = len(PAL)
A = B.atlas(PAL, np.random.default_rng(11))
VAR = (np.add.outer(np.arange(G) * 7919, np.arange(G) * 104729) % 4)
rng = np.random.default_rng(5)
yy, xx = np.mgrid[0:G, 0:G].astype(np.float64) + .5
C = np.array([80., 74.])                        # le cœur de la fleur
DC = np.hypot(xx - C[0], yy - C[1])

# ——— la fleur : des pétales en ellipses, de la base (le cœur) à la pointe ; o : 0 fermée (le bouton) → 1 éclose ———
BOUTON = ['3348', '3348', '712', '3865', '778', '3716', '3354']
EXT = ['3865', '3865', '3716', '3716', '3609', '210', '211', '340', '3755', '3755']
MIL = ['3078', '3865', '3716', '3609', '3609', '211']
INT = ['729', '726', '743', '3822', '3078']
LISERE = {'3716': '3354', '3609': '3731', '210': '552', '211': '210', '340': '3746', '3755': '3807', '3865': '778', '3078': '3822',
          '712': '3822', '3348': '3347', '778': '3354', '3354': '3731', '729': '676', '726': '729', '743': '729', '3822': '729'}
LIS = np.array([K[LISERE.get(c, c)] for c in CODES])
COUCHES = [  # n, longueur ouverte, largeur, longueur bouton, largeur bouton, décalage (°), couleurs
    (10, 50., 11., 28., 5.5, 0., EXT), (8, 36., 9.5, 25., 5., 22.5, MIL), (6, 19., 7., 20., 4.2, 0., INT)]
def petales(o):
    """le fil de chaque point : trois couronnes de pétales (dehors 10, milieu 8, cœur 6), puis la perle ; -1 : pas de fleur"""
    fil = np.full((G, G), -1)
    e = o * o * (3 - 2 * o)
    px, py = xx - C[0], yy - C[1]
    for couche, (n, Lf, wf, Lb, wb, dec, coul) in enumerate(COUCHES):
        # la couche du cœur s'ouvre un peu après les autres
        ec = np.clip((e - .15 * couche) / (1 - .15 * couche), 0, 1)
        for k in range(n):
            vari = 1 + .06 * np.sin(k * 2.3 + couche)
            ang_b = np.radians(-90 + (k - (n - 1) / 2) * (2.6 - .5 * couche))
            ang_o = np.radians(-90 + k * 360 / n + dec + 6 * couche)
            d = (ang_o - ang_b + np.pi) % (2 * np.pi) - np.pi
            a = ang_b + d * ec; L = (Lb + (Lf - Lb) * ec) * vari; w = (wb + (wf - wb) * ec) * vari
            u = np.array([np.cos(a), np.sin(a)])
            al = px * u[0] + py * u[1]; ac = -px * u[1] + py * u[0]
            # une légère courbure (le pétale se tord un peu), une pointe arrondie, une base étroite
            ac = ac - .06 * w * (al / max(L, 1)) ** 2 * L * .2
            t = al / L; tc = np.clip(t, 0, 1)
            larg = w * np.sqrt(np.clip(np.sin(tc * np.pi * .92 + .08), 0, 1)) * (1 - .25 * tc) * np.where(tc > .78, np.sqrt(np.clip(1 - ((tc - .78) / .22) ** 2, 0, 1)), 1)
            dedans = (t >= 0) & (t <= 1) & (np.abs(ac) <= larg)
            palette = BOUTON if (couche == 0 and ec < .45) else coul
            j = np.clip((tc * len(palette)).astype(int), 0, len(palette) - 1)
            v = np.array([K[c] for c in palette])[j]
            bord = dedans & (np.abs(ac) > larg - 1.0) & (larg > 1.6)
            nervure = dedans & (np.abs(ac) < .5) & (tc > .15) & (tc < .7) & (couche < 2) & (ec > .5)
            v = np.where(bord | nervure, LIS[v], v)
            fil = np.where(dedans, v, fil)
    if e > .25:
        r = 1.6 + 3.4 * e
        fil = np.where(DC <= r, np.where(DC <= r * .5, K['B5200'], K['3865']), fil)
    return fil

# la tige et les feuilles (fixes)
def tige():
    fil = np.full((G, G), -1)
    for y in range(int(C[1]) + 2, G):
        x = C[0] + 3.5 * np.sin((y - C[1]) / 22)
        for dx in (-1, 0, 1): fil[y, int(round(x + dx))] = K['3346'] if dx else K['3347']
    for sg, y0 in ((-1, 118), (1, 132)):          # deux feuilles
        x0 = C[0] + 3.5 * np.sin((y0 - C[1]) / 22)
        for s in np.linspace(0, 1, 200):
            L, w = 30, 7.5 * np.sin(s * np.pi)
            cx, cy = x0 + sg * s * L, y0 - s * L * .55 - 6 * np.sin(s * np.pi)
            for q in np.linspace(-w, w, 15):
                X, Y = int(round(cx + q * .45)), int(round(cy + q * sg * .8))
                if 0 <= X < G and 0 <= Y < G: fil[Y, X] = K['988'] if abs(q) > w - 1.5 else (K['3347'] if q * sg > 0 else K['3348'])
    return fil
TIGE = tige()
BOUTON_F = petales(0.); OUVERTE = petales(1.)

# ——— le ciel du morceau : la couleur d'un anneau dépend de l'instant où il est brodé ———
CIEL = [(0, ['939', '823']), (8.25, ['823', '336', '333']), (40, ['336', '333', '3746', '3838']), (72.25, ['3755', '3325', '775', '3756']),
        (112.25, ['3716', '3354', '778', '3609']), (136, ['3740', '3746', '333']), (160.25, ['3768', '931', '3838']), (186.25, ['3810', '3766', '931'])]
ETOILES_LA = [(8.25, 72.25), (136, 160.25)]
def ciel(t):
    i = max(k for k, (t0, _) in enumerate(CIEL) if t >= t0); return CIEL[i][1]

# ——— l'ordre de la broderie : le bouton, puis la tige et les feuilles, puis le ciel en anneaux ———
DEBUT, FIN_BRODE = 1.0, SILENCE - .3
fixe = np.where(BOUTON_F >= 0, BOUTON_F, TIGE)
groupe = np.where(BOUTON_F >= 0, 0, np.where(TIGE >= 0, 1, 2))
cle = groupe * 1000 + np.where(groupe == 1, yy, DC) + rng.random((G, G)) * (1.5 if True else 0)
ordre = np.argsort(cle.ravel())
# le débit suit l'énergie du morceau : l'aiguille va plus vite quand la musique monte
tt = np.arange(0, FIN_BRODE, .1); en = EN[np.clip((tt * 10).astype(int), 0, len(EN) - 1)]
debit = np.where(tt < DEBUT, 0, .15 + en ** 2); cumul = np.cumsum(debit); cumul /= cumul[-1]
# les tout premiers points, un à un (le geste) : on ralentit le début
rang = np.empty(G * G); rang[ordre] = np.arange(G * G) / (G * G - 1)
rang = rang ** 1.0
T_POINT = np.interp(rang, np.concatenate([[0], cumul]), np.concatenate([[DEBUT], tt + .1])).reshape(G, G)
premiers = ordre[:24]; T_POINT.ravel()[premiers] = DEBUT + np.arange(24) * .55     # 24 premiers points, à la main
# la couleur du ciel, fixée au moment où le point est brodé
FIL_CIEL = np.zeros((G, G), int)
for (t0, codes) in CIEL:
    m = T_POINT >= t0
    ch = rng.integers(0, len(codes), (G, G)); FIL_CIEL = np.where(m, np.array([K[c] for c in codes])[ch], FIL_CIEL)
etoile = np.zeros((G, G), bool)
for a, b in ETOILES_LA: etoile |= (T_POINT >= a) & (T_POINT < b) & (rng.random((G, G)) < .025)
FIL_CIEL = np.where(etoile, np.where(rng.random((G, G)) < .5, K['3078'], K['B5200']), FIL_CIEL)
FOND = np.where(fixe >= 0, fixe, FIL_CIEL)
# le rayon brodé, pour la caméra
RAYON = np.array([DC[T_POINT <= t].max() if (T_POINT <= t).any() else 0 for t in np.arange(0, FIN_BRODE + 1, .5)])

ARC = ['666', '946', '743', '704', '996', '797', '552']    # l'arc-en-ciel, le rouge dehors
def arc(t):
    """l'arc-en-ciel autour de la fleur, brodé en tournant depuis le haut"""
    u = np.clip((t - ARC0) / (ARC1 - ARC0), 0, 1)
    if u <= 0: return None
    ang = (np.degrees(np.arctan2(xx - C[0], -(yy - C[1]))) + 360) % 360
    r0 = 56.
    band = (r0 + 7 - DC)            # 0 (dehors) → 7 (dedans)
    m = (band >= 0) & (band < 7) & (ang <= u * 360)
    return np.where(m, np.array([K[c] for c in ARC])[np.clip(band.astype(int), 0, 6)], -1)

def image(t):
    """(fils de chaque point, brodé ?, demi-point ?) à l'instant t"""
    fait = T_POINT <= t - .3; demi = (T_POINT <= t) & ~fait
    fil = FOND.copy()
    if t >= IMPACT:
        o = min(1., (t - IMPACT) / 2.4); o = 1 - (1 - o) ** 3
        ff = petales(o); fil = np.where(ff >= 0, ff, np.where(BOUTON_F >= 0, FIL_CIEL, fil)); fil = np.where((TIGE >= 0) & (ff < 0), TIGE, fil)
        a = arc(t)
        if a is not None: fil = np.where((a >= 0) & (OUVERTE < 0), a, fil)
    return fil, fait, demi

def rendre(t):
    fil, fait, demi = image(t)
    ii = np.where(fait, fil, TOILE)
    img = B.assembler(A['tissu'], ii, VAR).astype(np.float32)
    if demi.any(): d = B.assembler(A['demi'], np.where(demi, fil, TOILE), VAR); mk = np.repeat(np.repeat(demi, S, 0), S, 1); img[mk] = d[mk]
    vide = np.repeat(np.repeat(~fait & ~demi, S, 0), S, 1)
    if vide.any(): img[vide] = B.assembler(A['toile'], np.full((G, G), TOILE), VAR)[vide]
    # la goutte : pendant les aigus sans basse, elle tombe sur la pointe du bouton
    if AIGUS <= t < IMPACT:
        u = (t - AIGUS) / (IMPACT - AIGUS); y = -6 + (C[1] - 27 + 6) * u * u
        gy, gx = np.mgrid[0:OUT, 0:OUT]
        dd = np.hypot((gx - C[0] * S) / 1.0, (gy - y * S) / 1.25)
        m = dd < 3.2 * S
        img[m] = img[m] * .35 + np.array([225, 240, 250]) * .65
        img[(dd < 1.2 * S) & m] = [255, 255, 255]
    # l'impact : une onde de lumière traverse la broderie
    if IMPACT <= t < IMPACT + 3.5:
        r = (t - IMPACT) * 55; gy, gx = np.mgrid[0:OUT, 0:OUT] / S
        dd = np.hypot(gx - C[0], gy - C[1]); w = np.exp(-((dd - r) / 5) ** 2) * (1 - (t - IMPACT) / 3.5)
        img *= (1 + .55 * w[..., None]); img += 30 * w[..., None]
    # la Perle s'allume (04:02.75), puis la lumière devient blanche
    if t >= PERLE:
        u = min(1, (t - PERLE) / 1.2); gy, gx = np.mgrid[0:OUT, 0:OUT] / S
        dd = np.hypot(gx - C[0], gy - C[1]); g = np.exp(-(dd / (3 + 9 * u)) ** 2) * u * (.85 + .15 * np.sin((t - PERLE) * 6.283 / .5))
        img = img * (1 - .75 * g[..., None]) + 255 * .75 * g[..., None]
    if t > DUREE - 4.5:
        u = min(1, (t - (DUREE - 4.5)) / 4); img = img * (1 - u) + np.array([236, 231, 219]) * u
    img = np.clip(img, 0, 255).astype(np.uint8)
    # la caméra : elle suit la broderie qui grandit (le cœur d'abord, puis tout le ciel), revient près du cœur à la Perle
    rb = np.interp(min(t, FIN_BRODE), np.arange(0, FIN_BRODE + 1, .5), RAYON)
    z = np.clip(G / (2 * (rb + 10)), 1, 7.5) if t < IMPACT else 1.
    if t >= PERLE - 6 and t < PERLE: z = 1.
    if t >= PERLE: u = min(1, (t - PERLE) / 8); z = 1 + .9 * (u * u * (3 - 2 * u))
    zz = np.interp(t, [0, 1], [7.5, 7.5]) if t < DEBUT else z
    cx = C[0] + (80 - C[0]) * (1 - (zz - 1) / 6.5); cy = C[1] + (80 - C[1]) * (1 - (zz - 1) / 6.5)
    rr = OUT / (2 * zz); cxp, cyp = np.clip(cx * S, rr, OUT - rr), np.clip(cy * S, rr, OUT - rr)
    if zz > 1.001:
        img = np.asarray(Image.fromarray(img).crop((int(cxp - rr), int(cyp - rr), int(cxp + rr), int(cyp + rr))).resize((OUT, OUT), Image.LANCZOS))
    return img

if planche:
    for v in planche.split(','):
        Image.fromarray(rendre(float(v))).resize((640, 640), Image.LANCZOS).save(f'{dst}-{v}.png')
    print('planche', planche); sys.exit()

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OUT}x{OUT}', '-r', str(FPS), '-i', '-',
                        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', dst], stdin=subprocess.PIPE)
n0, n1 = int(deb * FPS), int(min(DUREE, fin_r) * FPS)
for n in range(n0, n1):
    enc.stdin.write(rendre(n / FPS).tobytes())
    if (n - n0) % 500 == 0: print(f'{n - n0} images ({n / FPS:.1f} s)', flush=True)
enc.stdin.close(); enc.wait(); print('fini', flush=True)
