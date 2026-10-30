"""Le Portail du temps (Matt, « .ONE — le portail du temps ») : un seul Studio, un seul Disque, un seul Point Zéro.
J'ouvre le Studio · le Disque présente le projet actuel · je vois le PASSÉ, le PRÉSENT et le FUTUR · je tourne la bague ·
le centre indique la période · je relâche et je vois les éléments · une action simple · le détail en grand · retour au Point Zéro ·
mon contexte est conservé. Plus : symétrie, clavier, toucher, téléphone, mouvement réduit, aucun débordement, aucune donnée inventée.
Usage : BASE=http://localhost:4634 NAVIGATEURS=chromium,webkit python3 tests/e2e/portail.py"""
import os, re, math
from playwright.sync_api import sync_playwright
B = os.environ['BASE'].rstrip('/'); NAVS = os.environ.get('NAVIGATEURS', 'chromium').split(','); CAP = os.environ.get('CAPTURES')
R = [0, 0]
def ok(c, m): R[0 if c else 1] += 1; print(('✓ ' if c else 'ÉCHEC ') + m)
def args(n): return ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] if n == 'chromium' else []
U = B + '/studio/one/univers'

with sync_playwright() as p:
    for n in NAVS:
        b = getattr(p, n).launch(args=args(n))
        # ——— ordinateur ———
        N = f'[{n} · ordinateur]'
        ctx = b.new_context(viewport={'width': 1440, 'height': 900}); pg = ctx.new_page(); err = []
        pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto(U); pg.wait_for_selector('.pt-present', timeout=20000); pg.wait_for_timeout(900)
        ok(pg.locator('.pt-titre').inner_text() == 'LUMIERE', f'{N} 1–2. le Studio s’ouvre sur le Présent : LUMIERE')
        ok('31 plans' in pg.locator('.pt-etat').inner_text() and 'générer avec Manus' in pg.locator('.pt-action').inner_text(), f'{N} 2. son état et sa prochaine action (lus dans ses données, déclarés)')
        ok('bloqué' in pg.locator('.pt-present .pt-sur').inner_text().lower(), f'{N} 2. un projet bloqué est dit bloqué')
        ok(pg.locator('.pt-pourquoi li').count() >= 1 and pg.get_by_role('button', name='Reprendre').count() == 1, f'{N} 2. pourquoi il est là, et REPRENDRE')
        ok(pg.locator('.pt-passe li').count() == 7 and pg.locator('.pt-futur li').count() == 3, f'{N} 3. PASSÉ (7 éléments) à gauche, FUTUR (3 possibilités) à droite')
        ok(pg.locator('.pt-passe li[data-precision=aucune]').count() == 1 and 'sans date' in pg.locator('.pt-passe').inner_text(), f'{N} 3. ce qui n’a pas de date est dit sans date')
        # la couronne : Confort, Faire, Aller, Voir, Origine — symétrique ; le Disque au centre, les côtés ne le touchent pas
        items = pg.locator('.one-disque [role=menuitem]')
        noms = [items.nth(i).inner_text().strip() for i in range(items.count())]
        ok([x.split('\n')[0] for x in noms] == ['Confort', 'Faire', 'Aller', 'Voir', 'Origine'], f'{N} couronne : {noms}')
        d = pg.locator('.one-disque .pzt-anneau').bounding_box(); cx, cy = d['x'] + d['width'] / 2, d['y'] + d['height'] / 2
        pos = [items.nth(i).bounding_box() for i in range(items.count())]
        ray = [math.hypot(q['x'] + q['width'] / 2 - cx, q['y'] + q['height'] / 2 - cy) for q in pos]
        ang = sorted([(math.degrees(math.atan2(q['x'] + q['width'] / 2 - cx, -(q['y'] + q['height'] / 2 - cy))) % 360) for q in pos])
        ecarts = [(ang[(i + 1) % 5] - ang[i]) % 360 for i in range(5)]
        ok(max(ray) - min(ray) < 3 and all(abs(e - 72) < 3 for e in ecarts), f'{N} symétrie du cadran : rayons {min(ray):.0f}–{max(ray):.0f} px, écarts {[round(e) for e in ecarts]}°')
        ok(abs(cx - 720) < 3, f'{N} le Disque reste centré dans son espace ({cx:.0f} px)')
        pa, fu = pg.locator('.pt-passe').bounding_box(), pg.locator('.pt-futur').bounding_box()
        ok(pa['x'] + pa['width'] < d['x'] and fu['x'] > d['x'] + d['width'], f'{N} les côtés sont dans les marges, sans toucher le Disque')
        ok(pg.evaluate('document.documentElement.scrollWidth') <= 1440, f'{N} aucun débordement horizontal')
        if CAP: pg.screenshot(path=f'{CAP}/portail-{n}-1.png')
        # 4–6. VOIR › Chronologie : la bague ; tourner, relâcher, voir
        pg.locator('.one-disque [role=menuitem]', has_text='Voir').first.click(); pg.wait_for_timeout(400)
        pg.locator('.one-disque [role=menuitem]', has_text='Chronologie').first.click(); pg.wait_for_selector('.bt', timeout=10000); pg.wait_for_timeout(500)
        ok('f.v=temps' in pg.url and 'f.p=lumiere' in pg.url, f'{N} 4. Chronologie : la bague du temps ({pg.url.split("?")[1]})')
        bague = pg.locator('.bt-svg')
        ok(bague.get_attribute('aria-valuetext').startswith('vendredi 30 octobre 2026'), f'{N} 5. le centre indique la période : {bague.get_attribute("aria-valuetext")}')
        ok(pg.locator('.bt-chiffre').count() == 31 and pg.locator('.bt-point').count() == 2, f'{N} des chiffres (31 jours), des points (2 jours portent des éléments), un cercle')
        bague.focus(); pg.keyboard.press('ArrowLeft'); pg.wait_for_timeout(500)
        ok('f.t=2026-10-29' in pg.url and bague.get_attribute('aria-valuetext').startswith('jeudi 29 octobre'), f'{N} clavier : la bague tourne d’un jour')
        pg.keyboard.press('Enter'); pg.wait_for_timeout(500)
        ok('f.e=heure' in pg.url and pg.locator('.bt-chiffre').count() == 24, f'{N} clavier : Entrée, une échelle plus fine (24 heures)')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(500)
        ok('f.e=jour' in pg.url, f'{N} clavier : Échap, une échelle plus large')
        pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(500)
        # au pointeur : on tire la bague, le centre suit, on relâche
        bb = bague.bounding_box(); bx, by = bb['x'] + bb['width'] / 2, bb['y'] + bb['height'] / 2; r = bb['width'] * 0.4
        pg.mouse.move(bx, by - r); pg.mouse.down(); pg.mouse.move(bx + r * math.sin(0.3), by - r * math.cos(0.3), steps=6)
        pendant = pg.locator('.bt-nom').inner_text(); pg.mouse.move(bx + r * math.sin(0.42), by - r * math.cos(0.42), steps=4); pg.mouse.up(); pg.wait_for_timeout(600)
        ok('f.t=2026-10-2' in pg.url and 'f.t=2026-10-30' not in pg.url, f'{N} au pointeur : la bague tourne, au relâchement la période est choisie (pendant : « {pendant} », après : {pg.url.split("f.t=")[1][:10]})')
        pg.goto(U + '?f.p=lumiere&f.v=temps&f.e=jour&f.t=2026-10-30'); pg.wait_for_selector('.bt'); pg.wait_for_timeout(500)
        if CAP: pg.screenshot(path=f'{CAP}/portail-{n}-2-bague.png')
        pg.get_by_role('button', name='Voir', exact=True).click(); pg.wait_for_selector('.dq-grand .pt-liste')
        ok(pg.locator('.dq-grand .pt-liste li').count() >= 5 and 'date exacte' in pg.locator('.dq-grand').inner_text(), f'{N} 6–8. les éléments de la période, en grand, avec leur précision et leur source')
        pg.locator('.dq-point-replie').click(); pg.wait_for_timeout(400)
        ok('f.t=2026-10-30' in pg.url and pg.locator('.bt').count() == 1, f'{N} revenir : la même période, la même échelle')
        # 9–10. ORIGINE : le Présent, le projet gardé
        pg.locator('.one-disque [role=menuitem]', has_text='Origine').first.click(); pg.wait_for_timeout(500)
        ok('f.v' not in pg.url and pg.locator('.pt-present').count() == 1, f'{N} 9. ORIGINE : retour au Présent, au Point Zéro')
        # un passé daté ouvre la bague à sa date
        pg.locator('.pt-passe button', has_text='La naissance du Point').click(); pg.wait_for_timeout(500)
        ok('f.t=2026-10-30' in pg.url and pg.locator('.bt').count() == 1, f'{N} 3. un élément du passé ouvre la Chronologie à son jour')
        pg.locator('.one-disque [role=menuitem]', has_text='Origine').first.click(); pg.wait_for_timeout(400)
        # 7. épingler (réversible), ignorer (réversible), pourquoi
        pg.get_by_role('button', name='Épingler').click(); pg.reload(); pg.wait_for_selector('.pt-present'); pg.wait_for_timeout(500)
        ok(pg.get_by_role('button', name='Épinglé').get_attribute('aria-pressed') == 'true' and 'épinglé par vous' in pg.locator('.pt-pourquoi').inner_text(), f'{N} 7. épingler : gardé après rechargement, et dit dans « Pourquoi »')
        pg.get_by_role('button', name='Épinglé').click(); pg.wait_for_timeout(300)
        pg.get_by_role('button', name='Pourquoi ?').click(); pg.wait_for_selector('.dq-grand .pt-raisons')
        txt = pg.locator('.dq-grand').inner_text()
        ok('aucune échéance renseignée' in txt and 'avancement non mesuré' in txt and 'déclaré' in txt, f'{N} 8. Pourquoi : les règles, ce qui est déclaré, et ce qui manque (rien d’inventé)')
        pg.locator('.dq-point-replie').click(); pg.wait_for_timeout(300)
        pg.get_by_role('button', name='Ignorer').click(); pg.wait_for_timeout(600)
        ok('Je ne sais pas encore' in pg.locator('.dq-centre').inner_text() or pg.locator('.pt-titre').inner_text() != 'LUMIERE', f'{N} ignorer : la suggestion s’efface (7 jours), le Studio le dit')
        pg.evaluate("localStorage.removeItem('aime:one:present:v1')"); pg.goto(U); pg.wait_for_selector('.pt-present')
        # FAIRE › Ajouter : reconnaître honnêtement
        pg.locator('.one-disque [role=menuitem]', has_text='Faire').first.click(); pg.wait_for_timeout(300)
        pg.locator('.one-disque [role=menuitem]', has_text='Ajouter').first.click(); pg.wait_for_selector('.pt-ajouter')
        png = bytes.fromhex('89504e470d0a1a0a0000000d4948445200000001000000010806000000') + b'\0' * 20
        pg.locator('.pt-entree', has_text='Choisir un fichier').locator('input').set_input_files({'name': 'photo.png', 'mimeType': 'image/png', 'buffer': png})
        t = pg.locator('.pt-reconnu').inner_text()
        ok('Broderie' in t and 'disponible' in t and 'en attente' in t, f'{N} Ajouter : une photo → Broderie (disponible), Mariage (en attente)')
        pg.locator('.pt-entree', has_text='Choisir un fichier').locator('input').set_input_files({'name': 'inconnu.xyz', 'mimeType': '', 'buffer': b'abc'})
        ok('pas reconnu' in pg.locator('.pt-reconnu').inner_text(), f'{N} Ajouter : un fichier inconnu est signalé honnêtement')
        pg.locator('.dq-point-replie').click(); pg.wait_for_timeout(300)
        # REPRENDRE, puis revenir : le contexte est gardé
        pg.goto(U + '?f.p=lumiere'); pg.wait_for_selector('.pt-present')
        pg.get_by_role('button', name='Reprendre').click(); pg.wait_for_url(re.compile(r'/one/lumiere/vivre'), timeout=20000)
        ok(True, f'{N} REPRENDRE : LUMIERE s’ouvre là où il vit (Vivre LUMIERE ; le film n’est pas modifié)')
        pg.go_back(); pg.wait_for_selector('.pt-present', timeout=20000)
        ok('f.p=lumiere' in pg.url and pg.locator('.pt-titre').inner_text() == 'LUMIERE', f'{N} 10. revenir : le contexte est conservé')
        ok(not err, f'{N} aucune erreur {err[:2]}')
        ctx.close()
        # ——— mouvement réduit ———
        N = f'[{n} · mouvement réduit]'
        ctx = b.new_context(viewport={'width': 1280, 'height': 860}, reduced_motion='reduce'); pg = ctx.new_page(); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto(U + '?f.p=lumiere&f.v=temps&f.e=jour&f.t=2026-10-30'); pg.wait_for_selector('.bt'); pg.locator('.bt-svg').focus()
        avant = pg.locator('.bt-chiffre', has_text=re.compile('^30$')).bounding_box(); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(60)
        apres = pg.locator('.bt-chiffre.bt-on').text_content()
        ok(apres == '31', f'{N} la bague saute sans glisser (choisi : {apres})')
        ok(not err, f'{N} aucune erreur')
        ctx.close()
        # ——— téléphone ———
        N = f'[{n} · téléphone]'
        kw = p.devices['iPhone 14'] if n == 'webkit' else {'viewport': {'width': 390, 'height': 844}, 'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx = b.new_context(**kw); pg = ctx.new_page(); err = []; pg.on('pageerror', lambda e: err.append(str(e)))
        pg.goto(U); pg.wait_for_selector('.pt-present', timeout=20000); pg.wait_for_timeout(600)
        liste = [x.strip() for x in pg.locator('.dq-liste > ul > li').all_inner_texts()]
        ok([x.split('\n')[0].replace('›', '').strip() for x in liste] == ['Faire', 'Aller', 'Voir', 'Origine'], f'{N} les mêmes commandes, en liste : {liste}')
        ok(pg.evaluate('document.documentElement.scrollWidth') <= 390, f'{N} aucun débordement horizontal')
        cibles = pg.evaluate("[...document.querySelectorAll('.pt-reprendre, .pt-gestes button, .dq-liste button')].map(e => e.getBoundingClientRect().height)")
        ok(min(cibles) >= 40, f'{N} cibles tactiles ≥ 40 px ({min(cibles):.0f})')
        pg.locator('.dq-liste button', has_text='Voir').click(); pg.locator('.dq-liste button', has_text='Chronologie').click(); pg.wait_for_selector('.bt', timeout=10000); pg.wait_for_timeout(400)
        pg.locator('.bt-cible[data-cle="2026-10-29"]').tap(); pg.wait_for_timeout(500)
        ok('f.t=2026-10-29' in pg.url, f'{N} au doigt : toucher un chiffre le choisit')
        if CAP: pg.screenshot(path=f'{CAP}/portail-{n}-3-telephone.png', full_page=True)
        ok(not err, f'{N} aucune erreur {err[:2]}')
        ctx.close(); b.close()
print(f'— {R[0]}/{R[0] + R[1]}')
