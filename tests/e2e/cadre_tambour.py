"""Essai de l'atelier : le Cadre-Tambour, un seul objet en deux états. Dans le vrai navigateur, sur la version construite :
- Cadre : activé depuis le menu AIME, le dock du bas s'accroche sous le format (comme l'étiquette au-dessus) et le suit quand le zoom change ;
- Tambour : le bouton du dock referme l'ouvrage en cercle ; les outils du Point l'entourent, le centre laisse dessiner sur la grille ;
  l'étiquette du Cadre et le dock se replient dedans ; un outil choisi dans l'anneau agit vraiment ;
- Rétracter (l'anneau, ou Échap) rend le patron entier, le Cadre et le dock accroché ; le menu ramène le dock en bas de l'écran ;
- au clavier ; mobile 390 px ; aucune erreur.
Usage : cd studio && npx vite build && npx vite preview --port 4620, puis  python3 tests/e2e/cadre_tambour.py   (CAPTURES=<dossier>)"""
import os, math
from playwright.sync_api import sync_playwright
B = os.environ.get('BASE', 'http://localhost:4620'); CAP = os.environ.get('CAPTURES')
res, erreurs = [], []
def ok(c, t): res.append(bool(c)); print(('OK ' if c else 'ÉCHEC ') + t, flush=True)
def cap(pg, nom):
    if CAP: pg.screenshot(path=f'{CAP}/cadre-tambour-{nom}.png')
def cadre(pg): return pg.evaluate("() => { const c = getComputedStyle(document.querySelector('.cadre')), v = k => parseFloat(c.getPropertyValue(k)); return { x: v('--fx0'), y: v('--fy0'), w: v('--fw'), h: v('--fh') }; }")
def dock(pg): return pg.evaluate("() => { const r = document.querySelector('.pzs-bottom').getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom }; }")
def accroche(pg):
    c, d = cadre(pg), dock(pg); bas = pg.evaluate('innerHeight') - d['h'] - 12
    attendu = max(c['y'] + 24, min(c['y'] + c['h'] + 12, bas))
    return abs(d['y'] - attendu) <= 3 and abs((d['x'] + d['w'] / 2) - (c['x'] + c['w'] / 2)) <= 3 or (d['x'] <= 13 or d['x'] + d['w'] >= pg.evaluate('innerWidth') - 13)
def page(b, l, h, mobile=False, active=False):
    ctx = b.new_context(viewport={'width': l, 'height': h}, has_touch=mobile, is_mobile=mobile, reduced_motion='reduce')
    ctx.add_init_script("localStorage.setItem('pointzero:visite-docks:v1', 'vue')" + ("; localStorage.setItem('pointzero:essai:cadre-tambour', '1')" if active else ""))
    pg = ctx.new_page(); pg.set_default_timeout(8000); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(B + '/atelier?offerte=5D-12342.g21.v0.1'); pg.wait_for_selector('.cadre[data-pret]', timeout=20000); pg.wait_for_timeout(1500)
    return ctx, pg
MENU = '.pzt [data-presentation][role=menu]'

with sync_playwright() as p:
    b = p.chromium.launch()
    try:
        ctx, pg = page(b, 1440, 900)
        ok(pg.evaluate("getComputedStyle(document.querySelector('.pzs-bottom')).bottom") != 'auto' and pg.locator('.pzs-ouvrir-tambour').count() == 0, 'par défaut, rien ne change : le dock reste en bas de l’écran')
        # 1. activer depuis le menu AIME
        pg.get_by_role('button', name='Menu AIME : accueil, réglages, affichage').click(); pg.get_by_role('button', name='Essai : le Cadre-Tambour').click(); pg.wait_for_timeout(600)
        ok(pg.locator('.pzs-bottom.pzs-accroche').count() == 1 and accroche(pg), '1. le dock du bas s’accroche sous le format, centré, comme l’étiquette au-dessus')
        cap(pg, '1-cadre')
        # 2. il suit le Cadre quand le zoom change
        avant = dock(pg)
        for _ in range(2): pg.evaluate("window.dispatchEvent(new CustomEvent('pointzero:canvas', { detail: { action: 'zoomOut' } }))"); pg.wait_for_timeout(250)
        pg.wait_for_timeout(500); apres = dock(pg)
        ok(apres['y'] < avant['y'] - 20 and accroche(pg), f'2. le format rétrécit : le dock remonte avec lui ({round(avant["y"])} → {round(apres["y"])} px)')
        for _ in range(4): pg.evaluate("window.dispatchEvent(new CustomEvent('pointzero:canvas', { detail: { action: 'zoomIn' } }))"); pg.wait_for_timeout(200)
        pg.wait_for_timeout(500)
        ok(abs(dock(pg)['b'] - (900 - 12)) <= 3, '2. le format dépasse l’écran : le dock reste en bas de l’écran, jamais perdu')
        pg.evaluate("window.dispatchEvent(new CustomEvent('pointzero:canvas', { detail: { action: 'fit' } }))"); pg.wait_for_timeout(600)
        # 3. le tambour
        pg.locator('.pzs-ouvrir-tambour').click(); pg.wait_for_selector('.pzt', timeout=5000); pg.wait_for_timeout(400)
        t = pg.evaluate("() => { const s = getComputedStyle(document.querySelector('.pzt')); return { x: parseFloat(s.getPropertyValue('--pzt-x')), y: parseFloat(s.getPropertyValue('--pzt-y')), r: parseFloat(s.getPropertyValue('--pzt-r')) }; }")
        pos = pg.evaluate(f"() => [...document.querySelectorAll('{MENU} [role=menuitem]')].map(e => {{ const r = e.getBoundingClientRect(); return [e.dataset.mode, r.left + r.width / 2, r.top + r.height / 2, r.left, r.right, r.top, r.bottom]; }})")
        ok(len(pos) >= 8 and all(abs(math.hypot(x - t['x'], y - t['y']) - (t['r'] + 50)) <= 30 for _, x, y, *_ in pos), f'3. les {len(pos)} outils entourent le tambour (Confort, Loupe, Points, Broder, Fils, Affichage…)')
        ok(pos[0][0] == 'confort' and pos[0][2] < t['y'] - t['r'], '3. Confort, toujours le premier, en haut')
        ok(all(l >= 0 and r <= 1440 and tp >= 0 and bt <= 900 for *_, l, r, tp, bt in pos), '3. tous les outils tiennent à l’écran')
        ok(pg.evaluate(f"() => {{ const e = document.elementFromPoint({t['x']} + {t['r']} / 2, {t['y']} - {t['r']} / 3); return e && e.tagName === 'CANVAS'; }}"), '3. dans le tambour, le geste va à la grille (on y dessine, on y brode)')
        ok(pg.evaluate(f"() => {{ const e = document.elementFromPoint({t['x']}, {t['y']}); return !!e && !!e.closest('.lp-centre-action'); }}") and pg.locator('.pzt .lp-centre-action').get_attribute('aria-hidden') == 'true', '3. au centre, la sphère nacrée de la caméra (un raccourci : l’anneau le porte aussi)')
        ok(pg.evaluate(f"() => {{ const e = document.elementFromPoint({t['x']} + {t['r']} + 30, {t['y']} + 8); return e && !!e.closest('.pzt'); }}"), '3. l’anneau attrape les gestes : pas de point posé par erreur entre deux outils')
        ok(pg.evaluate("() => getComputedStyle(document.querySelector('.cadre-tete')).visibility === 'hidden' && getComputedStyle(document.querySelector('.pzs-bottom')).visibility === 'hidden'"), '3. l’étiquette du Cadre et le dock sont repliés dans le tambour')
        ok(pg.evaluate("() => { const e = document.elementFromPoint(innerWidth / 2, 40); return !!e && !!e.closest('.pzs-top'); }"), '3. le dock du haut reste net et utilisable')
        cap(pg, '2-tambour')
        # 4. un outil de l'anneau agit vraiment : Affichage → Symboles
        sym_avant = pg.evaluate("() => document.querySelector('[data-guide=symboles]')?.getAttribute('aria-pressed')")
        pg.locator(f'{MENU} [data-mode="affichage"]').click(); pg.wait_for_timeout(250)
        ok(pg.locator(f'{MENU} [data-mode="symboles"]').count() == 1, '4. Affichage ouvre sa famille, autour du même tambour')
        pg.locator(f'{MENU} [data-mode="symboles"]').click(); pg.wait_for_timeout(300)
        ok(pg.evaluate("() => document.querySelector('[data-guide=symboles]')?.getAttribute('aria-pressed')") != sym_avant, '4. Symboles agit sur la grille')
        cap(pg, '3-affichage')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        ok(pg.locator('.pzt').count() == 1 and pg.locator(f'{MENU}').get_attribute('data-niveau') == '0', '4. Échap remonte d’abord d’un niveau (le tambour reste ouvert)')
        # 5. Rétracter
        pg.locator(f'{MENU} [data-mode="retracter"]').click(); pg.wait_for_timeout(400)
        ok(pg.locator('.pzt').count() == 0 and pg.evaluate("() => getComputedStyle(document.querySelector('.cadre-tete')).visibility === 'visible'") and accroche(pg), '5. Rétracter : le patron entier, le Cadre et le dock accroché reviennent')
        ok(pg.evaluate("document.activeElement?.classList.contains('pzs-ouvrir-tambour')"), '5. le focus revient au bouton du tambour')
        # 6. au clavier : Entrée ouvre, Échap (focus sur la grille) rétracte
        pg.keyboard.press('Enter'); pg.wait_for_timeout(400); ok(pg.locator('.pzt').count() == 1, '6. au clavier : Entrée ouvre le tambour')
        pg.evaluate("document.activeElement?.blur()"); pg.keyboard.press('Escape'); pg.wait_for_timeout(400)
        ok(pg.locator('.pzt').count() == 0, '6. Échap rétracte le tambour')
        # la caméra : Broder › Sur ma toile (pour le clavier), et le centre ; les deux ouvrent le Tambour vivant avec cet ouvrage posé
        pg.locator('.pzs-ouvrir-tambour').click(); pg.wait_for_timeout(400)
        pg.locator(f'{MENU} [data-mode="broder"]').click(); pg.wait_for_timeout(250)
        ok(pg.locator(f'{MENU} [data-mode="sur-ma-toile"]').count() == 1, 'Broder › Sur ma toile : la caméra, accessible au clavier et au lecteur d’écran')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        pg.locator('.pzt .lp-centre-action').click(); pg.wait_for_url(lambda u: '/tambour' in u, timeout=10000); pg.wait_for_selector('[data-tambour=etat]'); pg.wait_for_timeout(1500)
        ok('mode=superposer' in pg.url and 'ouvrage=' in pg.url and 'Ma rosace offerte' in pg.locator('[data-tambour=etat]').inner_text(), 'le centre ouvre le Tambour vivant : Superposer, avec cet ouvrage posé')
        pg.go_back(); pg.wait_for_selector('.cadre[data-pret]', timeout=20000); pg.wait_for_timeout(1200)
        # 7. le menu ramène le dock en bas de l'écran
        pg.get_by_role('button', name='Menu AIME : accueil, réglages, affichage').click(); pg.get_by_role('button', name='Revenir au dock en bas de l’écran').click(); pg.wait_for_timeout(400)
        ok(pg.locator('.pzs-bottom.pzs-accroche').count() == 0 and pg.locator('.pzs-ouvrir-tambour').count() == 0 and pg.evaluate("document.querySelector('.pzs-bottom').style.top") == '', '7. le menu ramène le dock en bas de l’écran, comme avant')
        ctx.close()

        # mobile 390 px
        ctx, pg = page(b, 390, 844, mobile=True, active=True)
        ok(accroche(pg), 'mobile : le dock accroché sous le format')
        pg.locator('.pzs-ouvrir-tambour').tap(); pg.wait_for_timeout(500)
        ok(pg.evaluate(f"() => [...document.querySelectorAll('{MENU} [role=menuitem]')].every(e => {{ const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && r.height >= 24; }})"), 'mobile : l’anneau d’outils tient dans l’écran')
        ok(pg.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'mobile : pas de défilement horizontal')
        cap(pg, '4-mobile')
        pg.locator(f'{MENU} [data-mode="retracter"]').tap(); pg.wait_for_timeout(400); ok(pg.locator('.pzt').count() == 0, 'mobile : Rétracter')
        cap(pg, '5-mobile-cadre'); ctx.close()
    finally:
        b.close()
ok(not erreurs, 'aucune erreur de page ' + str(erreurs[:3]))
n = sum(res); print(f'— {n}/{len(res)}'); raise SystemExit(0 if n == len(res) else 1)
