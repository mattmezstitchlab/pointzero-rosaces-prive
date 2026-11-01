"""UPTOWN brodé : chaque image du clip restauré devient une broderie au point de croix, sur une grille fixe,
avec une seule palette de fils DMC (celle de l'atelier Point Zéro : craft-color-codes, CC BY 4.0) pour tout le clip.

Quatre rendus d'un même point :
  tissu    : la vraie broderie, dense (deux brins torsadés par croix, ombre, trame à peine visible) ;
  toile    : le travail sur l'Aida (le fond clair laissé en toile nue, des croix plus fines) ;
  symboles : le patron imprimé (un symbole par fil, grille, repère toutes les 10 cases) ;
  mosaique : les couleurs DMC à plat.
Plus la demi-croix (« / ») pour l'ouverture, qui se brode point par point."""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw

ICI = os.path.dirname(__file__)
DMC = json.load(open(os.path.join(ICI, 'dmc.json')))
SYMB = json.load(open(os.path.join(ICI, 'symboles.json')))
S = 12          # pixels par point dans l'image finale
SS = 4          # sur-échantillonnage pour dessiner les tuiles
N = S * SS

def lab(rgb):
    rgb = np.asarray(rgb, np.float64) / 255.
    lin = np.where(rgb <= .04045, rgb / 12.92, ((rgb + .055) / 1.055) ** 2.4)
    M = np.array([[.4124564, .3575761, .1804375], [.2126729, .7151522, .072175], [.0193339, .119192, .9503041]])
    xyz = lin @ M.T / np.array([.95047, 1., 1.08883])
    f = np.where(xyz > .008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)

DMC_RGB = np.array([d['rgb'] for d in DMC], np.float64); DMC_LAB = lab(DMC_RGB)

def choisir_palette(echantillons_lab, k=32, iters=12, graine=1):
    """k-moyennes dans l'espace Lab, puis chaque centre devient le fil DMC le plus proche (sans doublon)."""
    rng = np.random.default_rng(graine); X = echantillons_lab.reshape(-1, 3)
    C = X[rng.choice(len(X), k, replace=False)]
    for _ in range(iters):
        d = ((X[:, None, :] - C[None]) ** 2).sum(-1); a = d.argmin(1)
        C = np.array([X[a == j].mean(0) if (a == j).any() else C[j] for j in range(k)])
    fils = []
    for c in C:
        for j in np.argsort(((DMC_LAB - c) ** 2).sum(-1)):
            if j not in fils: fils.append(int(j)); break
    return fils

# ——— les tuiles ———
def _aida(rng, teinte=(236, 231, 219)):
    """une case de toile Aida : un bloc tissé légèrement bombé, des sillons, un trou à chaque coin"""
    y, x = np.mgrid[0:N, 0:N] / (N - 1)
    bloc = 1 - .10 * ((x - .5) ** 2 + (y - .5) ** 2) * 4
    trame = .035 * np.sin(x * math.pi * 10) * np.sin(y * math.pi * 2) + .035 * np.sin(y * math.pi * 10) * np.sin(x * math.pi * 2)
    bord = np.minimum(np.minimum(x, 1 - x), np.minimum(y, 1 - y))
    sillon = 1 - .18 * np.exp(-(bord / .06) ** 2)
    coin = np.minimum.reduce([np.hypot(x - a, y - b) for a in (0, 1) for b in (0, 1)])
    trou = 1 - .78 * np.exp(-(coin / .10) ** 2)
    v = bloc * sillon * trou * (1 + trame) * (1 + rng.normal(0, .02, (N, N)))
    return np.clip(np.array(teinte)[None, None] * v[..., None], 0, 255)

def _brin(img, couleur, a, b, largeur, rng, ombre=None):
    """un brin de fil, de a à b : cylindre ombré, torsade des fibres ; `ombre` : (dx, dy) de l'ombre portée"""
    y, x = np.mgrid[0:N, 0:N] + .5
    ax, ay, bx, by = a[0] * N, a[1] * N, b[0] * N, b[1] * N
    vx, vy = bx - ax, by - ay; L = math.hypot(vx, vy); ux, uy = vx / L, vy / L
    def champ(ox=0., oy=0.):
        px, py = x - ax - ox, y - ay - oy
        u = px * ux + py * uy; d = -px * uy + py * ux
        return u, d
    w = largeur * N / 2
    if ombre is not None:
        u, d = champ(*[o * N for o in ombre])
        m = np.clip((w * 1.15 - np.abs(d)) / 2, 0, 1) * ((u > -w * .3) & (u < L + w * .3))
        img *= (1 - .38 * m)[..., None]
    u, d = champ()
    dans = (np.abs(d) < w) & (u > -w * .45) & (u < L + w * .45)
    t = np.clip(d / w, -1, 1)
    cyl = .55 + .55 * np.sqrt(1 - t ** 2) - .12 * t      # la lumière vient d'en haut à gauche
    phase = rng.uniform(0, 6.28)
    torsade = .86 + .14 * np.sin((u / (w * .9)) * 3.1 + t * 2.2 + phase)
    bout = np.clip(np.minimum(u + w * .45, L + w * .45 - u) / (w * .5), 0, 1) ** .5
    v = (cyl * torsade)[..., None] * np.array(couleur)[None, None]
    reflet = (np.exp(-((t + .35) / .22) ** 2) * .22 * torsade)[..., None] * 255
    v = np.clip(v + reflet, 0, 255)
    al = (dans * np.clip((w - np.abs(d)) / 1.5, 0, 1) * bout)[..., None]
    img[:] = img * (1 - al) + v * al

def _tissu_sous(couleur, rng, n_var=4):
    """la broderie dense : sous la croix, la toile a pris l'ombre du fil (on ne voit plus le blanc entre les points)"""
    out = []
    for _ in range(n_var):
        img = _aida(rng) * .25 + np.array(couleur)[None, None] * .45
        j = lambda: rng.uniform(-.02, .02); i = .05
        _brin(img, couleur, (i + j(), 1 - i + j()), (1 - i + j(), i + j()), .60, rng)
        _brin(img, couleur, (i + j(), i + j()), (1 - i + j(), 1 - i + j()), .60, rng, ombre=(.03, .05))
        out.append(_reduire(img))
    return np.stack(out)

def _reduire(img):
    return np.asarray(Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((S, S), Image.LANCZOS))

def tuiles_croix(couleur, largeur, rng, demi=False, n_var=4, toile_sous=True, marge=.11):
    out = []
    for _ in range(n_var):
        img = _aida(rng) if toile_sous else np.full((N, N, 3), 0.)
        j = lambda: rng.uniform(-.025, .025)
        i = marge
        _brin(img, couleur, (i + j(), 1 - i + j()), (1 - i + j(), i + j()), largeur, rng)                  # « / » dessous
        if not demi: _brin(img, couleur, (i + j(), i + j()), (1 - i + j(), 1 - i + j()), largeur, rng, ombre=(.03, .05))   # « \ » dessus
        out.append(_reduire(img))
    return np.stack(out)

def tuile_aida(rng, n_var=4):
    return np.stack([_reduire(_aida(rng)) for _ in range(n_var)])

def _dessiner_symbole(dr, prims, cx, cy, r, encre, ep):
    for p in prims:
        if p['t'] == 'c':
            rr = p['r'] * r; box = [cx - rr, cy - rr, cx + rr, cy + rr]
            dr.ellipse(box, fill=encre if p.get('f') else None, outline=encre, width=ep)
        elif p['t'] == 'r':
            box = [cx + p['x'] * r, cy + p['y'] * r, cx + (p['x'] + p['w']) * r, cy + (p['y'] + p['h']) * r]
            dr.rectangle(box, fill=encre if p.get('f') else None, outline=encre, width=ep)
        elif p['t'] == 'p':
            pts = [(cx + a * r, cy + b * r) for a, b in p['pts']]
            dr.polygon(pts, fill=encre if p.get('f') else None, outline=encre, width=ep)
        else:
            for x1, y1, x2, y2 in p['segs']: dr.line([(cx + x1 * r, cy + y1 * r), (cx + x2 * r, cy + y2 * r)], fill=encre, width=ep)

def tuile_symbole(k, couleur=None):
    """la case du patron : fond blanc (ou la couleur du fil, très pâle), le symbole du fil, le filet de la grille"""
    fond = (255, 255, 255) if couleur is None else tuple(int(255 - (255 - c) * .62) for c in couleur)
    lum = .299 * fond[0] + .587 * fond[1] + .114 * fond[2]
    im = Image.new('RGB', (N, N), fond); dr = ImageDraw.Draw(im)
    _dessiner_symbole(dr, SYMB[k % len(SYMB)], N / 2, N / 2, N * .34, (20, 20, 24) if lum > 120 else (250, 250, 250), max(2, N // 16))
    dr.line([(0, 0), (N, 0)], fill=(190, 190, 196), width=SS); dr.line([(0, 0), (0, N)], fill=(190, 190, 196), width=SS)
    return np.asarray(im.resize((S, S), Image.LANCZOS))[None]

def tuile_mosaique(couleur):
    im = np.full((N, N, 3), couleur, np.float64)
    y, x = np.mgrid[0:N, 0:N]; bord = (x < SS) | (y < SS)
    im[bord] *= .80
    return _reduire(im)[None]

def atlas(palette, rng):
    """toutes les tuiles : [rendu][indice de fil] → (variantes, S, S, 3) ; l'indice -1 (dernier) = la toile nue"""
    cols = [DMC_RGB[j] for j in palette]
    A = {}
    A['tissu'] = np.stack([tuiles_croix(c, .60, rng, marge=.05, toile_sous=False) * 0 + _tissu_sous(c, rng) for c in cols] + [tuile_aida(rng)])
    A['toile'] = np.stack([tuiles_croix(c, .32, rng) for c in cols] + [tuile_aida(rng)])
    A['demi'] = np.stack([tuiles_croix(c, .32, rng, demi=True) for c in cols] + [tuile_aida(rng)])
    sy = [tuile_symbole(k, c) for k, c in enumerate(cols)] + [tuile_symbole(0) * 0 + 255]
    A['symboles'] = np.stack([np.repeat(t, 4, 0) for t in sy])
    mo = [tuile_mosaique(c) for c in cols] + [tuile_mosaique(np.array([236, 231, 219.]))]
    A['mosaique'] = np.stack([np.repeat(t, 4, 0) for t in mo])
    return A

def assembler(tuiles, idx, var):
    """idx (h, w) d'indices de fil (-1 : toile nue) → image (h·S, w·S, 3)"""
    t = tuiles[idx, var]                          # (h, w, S, S, 3)
    h, w = idx.shape
    return t.transpose(0, 2, 1, 3, 4).reshape(h * S, w * S, 3)

def grille_patron(img, h, w):
    """le repère toutes les 10 cases, comme sur une grille imprimée"""
    im = img.copy()
    for k in range(0, w + 1, 10): im[:, max(0, k * S - 1):k * S + 1] = (70, 70, 78)
    for k in range(0, h + 1, 10): im[max(0, k * S - 1):k * S + 1, :] = (70, 70, 78)
    return im
