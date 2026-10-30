"""L'ouverture LUMIERE (« Découvrir AIME ») et « Vivre LUMIERE », dans plusieurs moteurs (Chromium, WebKit/Safari, Firefox).
La liste de Matt :
- aucun écran explicatif avant le film ;
- le film démarre sans clic (muet) ;
- le son s'active par un geste et se cale sur la position actuelle ;
- les deux commandes fonctionnent ;
- l'impact reste synchronisé ;
- la fin rejoint la Première rencontre ;
- en cas d'échec, l'accès à la Première rencontre reste disponible.
Usage : BASE=http://localhost:4630 NAVIGATEURS=chromium,webkit,firefox python3 tests/e2e/ouverture.py"""
import os, re, time
from playwright.sync_api import sync_playwright
B = os.environ['BASE'].rstrip('/'); NAVS = os.environ.get('NAVIGATEURS', 'chromium').split(','); CAP = os.environ.get('CAPTURES')
res = []
def ok(c, nom): res.append((bool(c), nom)); print(('✓ ' if c else 'ÉCHEC ') + nom)
def args(n): return ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] if n == 'chromium' else []
def lt(pg): return pg.evaluate('window.__lumiere?.lecteur?.t ?? -1')

with sync_playwright() as p:
    for n in NAVS:
        b = getattr(p, n).launch(args=args(n)); N = f'[{n}]'
        gl = b.new_page().evaluate("!!document.createElement('canvas').getContext('webgl2')")
        ctx = b.new_context(viewport={'width': 1366, 'height': 820}); pg = ctx.new_page(); err = []
        pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto(B + '/'); pg.wait_for_timeout(2500)
        if not gl:
            # sans WebGL (ce moteur, ici) : l'image fixe et l'entrée dans .0NE — jamais un écran noir sans issue
            ok(pg.get_by_role('button', name='Entrer').is_visible(), f'{N} sans WebGL : « Entrer » est disponible (image fixe)')
            pg.get_by_role('button', name='Entrer').click(); pg.wait_for_selector('.one-marque', timeout=15000)
            ok('/one/premiere-rencontre' in pg.url, f'{N} sans WebGL : → la Première rencontre')
            ctx.close(); b.close(); continue
        # 1. aucun écran : seulement le film et deux commandes
        texte = pg.evaluate("document.body.innerText.replace(/\\s+/g, ' ').trim()")
        boutons = [x.strip() for x in pg.locator('button:visible, a:visible').all_inner_texts()]
        ok(set(re.sub(r'[◖◗→]', '', x).strip() for x in boutons) == {'Activer le son', 'Passer'}, f'{N} 1. seulement deux commandes visibles ({boutons})')
        ok('naissance du Point' not in texte and 'Explorer' not in texte and pg.locator('input[type=file]').count() == 0, f'{N} 1. aucun titre, aucun texte, aucun sélecteur de fichier')
        ok(pg.locator('.cv-nav').count() == 0, f'{N} 1. pas de navigation superposée au film')
        # 2. le film démarre seul, muet
        t1 = lt(pg); pg.wait_for_timeout(1500); t2 = lt(pg)
        ok(t1 > 0.5 and t2 > t1, f'{N} 2. le film démarre sans clic et avance ({t1:.2f} s → {t2:.2f} s)')
        if CAP: pg.screenshot(path=f'{CAP}/ouv-{n}-1-etoile.png')
        # 3. le son, sur un geste, calé sur la position actuelle (pas de retour au début)
        avant = lt(pg)
        pg.get_by_role('button', name=re.compile('Activer le son')).click()
        pg.wait_for_function("window.__lumiere.lecteur.son && window.__lumiere.journal.some(e => e.evt.startsWith('son à'))", timeout=15000)
        pg.wait_for_timeout(600); apres = lt(pg)
        j = pg.evaluate("window.__lumiere.journal.filter(e => e.evt.startsWith('son à')).pop().evt")
        m = re.search(r'son à ([\d.]+) s \(fichier ([\d.]+) s\)', j); t0, f = float(m.group(1)), float(m.group(2))
        ok(apres >= avant and apres < avant + 6, f'{N} 3. le son ne fait pas repartir le film ({avant:.2f} s → {apres:.2f} s)')
        ok(abs(f - t0) < 1e-3, f'{N} 3. la musique démarre à la position du film (film {t0:.3f} s = fichier {f:.3f} s, soit le morceau à {184.25 + t0:.3f} s)')
        ok(pg.get_by_role('button', name=re.compile('Couper le son')).is_visible(), f'{N} 3. le bouton devient « Couper le son »')
        # 4. l'impact : sur l'horloge du son, le contact de l'image tombe sur 03:18.255 du morceau
        tm = pg.evaluate("(() => { const m = window.__lumiere.lecteur.o.montage; const c = m.musique[0]; return c.debut + (14.005 - c.position); })()")
        ok(abs(tm - 198.255) < 1e-9, f'{N} 4. le contact (image 14,005 s) = morceau {tm:.3f} s')
        if n != 'firefox':
            pg.wait_for_function('window.__lumiere.lecteur.t > 14.2', timeout=30000)
            ok(pg.evaluate("window.__lumiere.lecteur.musique()[0].tempsMorceau - window.__lumiere.lecteur.t") == 184.25, f'{N} 4. après le contact, musique et image restent alignées (écart 184,25 s exact)')
        # couper le son : l'image continue, sans saut
        a = lt(pg); pg.get_by_role('button', name=re.compile('Couper le son')).click(); pg.wait_for_timeout(700); c = lt(pg)
        ok(c > a and c < a + 3 and not pg.evaluate('window.__lumiere.lecteur.son'), f'{N} 3. « Couper le son » : l’image continue ({a:.2f} → {c:.2f} s)')
        # 5. Passer : la Première rencontre, tout de suite
        pg.get_by_role('button', name=re.compile('Passer')).click(); pg.wait_for_selector('.one-marque', timeout=15000)
        ok('/one/premiere-rencontre' in pg.url, f'{N} 5. « Passer » → la Première rencontre (adresse {pg.url.split("/studio")[-1]})')
        pg.reload(); pg.wait_for_selector('.one-marque', timeout=15000)
        ok(pg.locator('.lf-film').count() == 0, f'{N} 5. recharger ne remontre pas le film')
        ok(not err, f'{N} aucune erreur de page ({err[:1]})')
        ctx.close()
        # 6. la fin : la lumière blanchit, le Point rejoint le Disque de la Première rencontre
        ctx = b.new_context(viewport={'width': 1366, 'height': 820}); pg = ctx.new_page()
        pg.goto(B + '/studio/one/lumiere?t=41'); pg.wait_for_selector('.lf-voile .lf-orbe', timeout=30000)
        if CAP: pg.wait_for_timeout(500); pg.screenshot(path=f'{CAP}/ouv-{n}-2-fin.png')
        pg.wait_for_selector('.lf-voile', state='detached', timeout=15000)
        ok(pg.locator('.pzt-anneau').count() > 0 and '/one/premiere-rencontre' in pg.url, f'{N} 6. la fin rejoint le vrai Disque de la Première rencontre')
        ctx.close()
        # 7. mouvement réduit : une image fixe, l'entrée directe
        ctx = b.new_context(viewport={'width': 1366, 'height': 820}, reduced_motion='reduce'); pg = ctx.new_page()
        pg.goto(B + '/'); pg.wait_for_timeout(2000)
        ok(pg.locator('.lf-toile').count() == 0 and pg.get_by_role('button', name=re.compile('Entrer')).is_visible(), f'{N} 7. mouvement réduit : image fixe, « Entrer »')
        ok(pg.locator('main .sr-only').count() >= 1, f'{N} 7. la description du film existe pour les lecteurs d’écran')
        if CAP: pg.screenshot(path=f'{CAP}/ouv-{n}-3-fixe.png')
        ctx.close()
        # 8. téléphone : les deux commandes dans les coins, ≥ 44 px
        dev = p.devices['iPhone 14'] if n == 'webkit' else {'viewport': {'width': 390, 'height': 844}, 'is_mobile': n != 'firefox', 'has_touch': True, 'device_scale_factor': 3}
        ctx = b.new_context(**dev); pg = ctx.new_page(); pg.goto(B + '/'); pg.wait_for_timeout(2500)
        g = pg.get_by_role('button', name=re.compile('Activer le son')).bounding_box(); d = pg.get_by_role('button', name=re.compile('Passer')).bounding_box()
        ok(g and d and g['x'] < 60 and d['x'] + d['width'] > 330 and g['height'] >= 44 and d['height'] >= 44 and d['y'] + d['height'] <= 844, f'{N} 8. téléphone : deux commandes dans deux coins opposés, ≥ 44 px')
        if CAP: pg.screenshot(path=f'{CAP}/ouv-{n}-4-telephone.png')
        ctx.close()
        # 9. Vivre LUMIERE : le chapitre complet
        ctx = b.new_context(viewport={'width': 1366, 'height': 820}); pg = ctx.new_page(); err = []
        pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto(B + '/studio/one/lumiere/vivre'); pg.wait_for_selector('.lf-grand', timeout=20000)
        ok('4:13' in pg.locator('.lf-temps').inner_text(), f'{N} 9. Vivre LUMIERE : le chapitre complet dure 4:13')
        pg.locator('.lf-grand').click(); pg.wait_for_timeout(2000)
        ok(pg.evaluate('window.__lumiereVivre.lecteur.lecture && window.__lumiereVivre.lecteur.son'), f'{N} 9. « Lecture » lance le film avec la musique (au geste)')
        pg.mouse.move(600, 400); pg.get_by_role('button', name='Scènes').click()
        ok(pg.locator('.lf-scenes li').count() == 9, f'{N} 9. neuf scènes')
        pg.locator('.lf-scenes button', has_text='La suspension').click(); pg.wait_for_timeout(1500)
        t, mo = pg.evaluate('[window.__lumiereVivre.lecteur.t, window.__lumiereVivre.lecteur.musique()[0].tempsMorceau]')   # lus ensemble
        ok(194.2 < t < 197.5 and abs(mo - t) < 1e-9, f'{N} 9. aller à « La suspension » : film {t:.2f} s = morceau {mo:.2f} s (l’impact à 198,255)')
        ok(pg.evaluate('window.__lumiereVivre.verifier().ok'), f'{N} 9. repères verrouillés exacts')
        if CAP: pg.wait_for_timeout(2500); pg.mouse.move(610, 410); pg.screenshot(path=f'{CAP}/ouv-{n}-5-vivre.png')
        pg.keyboard.press('Space'); pg.wait_for_timeout(300); pg.goto(B + '/studio/explorer'); pg.goto(B + '/studio/one/lumiere/vivre'); pg.wait_for_selector('.lf-grand')
        ok('Reprendre' in pg.locator('.lf-grand').inner_text(), f'{N} 9. reprise : « {pg.locator(".lf-grand").inner_text()} »')
        ok(not err, f'{N} 9. aucune erreur ({err[:1]})')
        ctx.close(); b.close()

n = sum(1 for r in res if r[0]); print(f'— {n}/{len(res)}')
