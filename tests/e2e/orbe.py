"""Le studio de broderie, dans un vrai navigateur : l'orbe qui guide parcourt les deux docks, de bout en bout.
Usage : cd studio && npx vite build && npx vite preview --port 4620, puis  python3 tests/e2e/orbe.py
Captures (facultatif) : CAPTURES=<dossier> python3 tests/e2e/orbe.py"""
import os, sys, math
from playwright.sync_api import sync_playwright

B = os.environ.get('BASE', 'http://localhost:4620')
CAP = os.environ.get('CAPTURES')
resultats, erreurs = [], []
def ok(c, nom):
    print(('OK ' if c else 'ÉCHEC ') + nom, flush=True); resultats.append(bool(c))
def capture(pg, nom):
    if CAP: os.makedirs(CAP, exist_ok=True); pg.screenshot(path=os.path.join(CAP, nom + '.png'))

def boite(pg, sel):
    return pg.evaluate("""s => { const r = [...document.querySelectorAll(s)].map(e => e.getBoundingClientRect()).filter(b => b.width && b.height);
      if (!r.length) return null; const x = Math.min(...r.map(b => b.left)), y = Math.min(...r.map(b => b.top));
      return { x, y, r: Math.max(...r.map(b => b.right)), b: Math.max(...r.map(b => b.bottom)) }; }""", sel)

LIEUX = {
    'atelier': dict(chemin='/atelier', premier='Bonjour, je suis Le Point', fin='Commencer à broder', dernier='Tout voir', menu='#pzs-brand'),
}
def parcours(b, largeur, hauteur, nom, lieu='atelier'):
    L = LIEUX[lieu]
    ctx = b.new_context(viewport={'width': largeur, 'height': hauteur}, reduced_motion='reduce')
    pg = ctx.new_page(); pg.set_default_timeout(8000)
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(B + L['chemin']); pg.wait_for_selector('#og-titre')
    ok(pg.locator('#og-titre').inner_text() == L['premier'], f'{nom} : Le Point s’ouvre dès l’arrivée ({lieu})')
    titres, horsCadre, horsEcran, loin, sansFocus = [], [], [], [], []
    for k in range(30):
        pg.wait_for_timeout(380)  # Le Point se pose (deux images, puis une vérification à 320 ms)
        titre = pg.locator('#og-titre').inner_text(); titres.append(titre)
        cadre = boite(pg, '.og-cadre'); orbe = boite(pg, '.og-orbe'); carte = boite(pg, '.og-carte')
        cible = pg.evaluate("""() => { const t = document.querySelector('#og-titre').textContent; return t; }""")
        # le cadre entoure bien un outil des docks : il chevauche un élément [data-guide]
        dans = pg.evaluate("""c => [...document.querySelectorAll('[data-guide]')].some(e => { const b = e.getBoundingClientRect();
            return b.width && b.left >= c.x - 1 && b.right <= c.r + 1 && b.top >= c.y - 1 && b.bottom <= c.b + 1; })""", cadre)
        if not dans: horsCadre.append(titre)
        if carte['x'] < 0 or carte['r'] > largeur + 1 or carte['y'] < 0 or carte['b'] > hauteur + 1: horsEcran.append(titre)
        # l'orbe se pose contre l'outil présenté
        ocx = (orbe['x'] + orbe['r']) / 2
        if not (cadre['x'] - 20 <= ocx <= cadre['r'] + 20) or min(abs(orbe['y'] - cadre['b']), abs(orbe['b'] - cadre['y'])) > 30: loin.append(titre)
        fin = pg.get_by_role('button', name=L['fin']).count() == 1
        if pg.evaluate('document.activeElement && document.activeElement.textContent') not in ('Suivant', L['fin']): sansFocus.append(titre)
        if k in (0, 2, 4, 10) or fin: capture(pg, f'{nom}-{k + 1:02d}')
        if fin: break
        pg.get_by_role('button', name='Suivant').click()
    total = int(pg.locator('.og-rang span').nth(1).inner_text().split('/')[1])
    ok(len(titres) == total and len(set(titres)) == total and titres[-1] == L['dernier'], f'{nom} : {total} étapes de bout en bout, chacune sur son outil')
    ok(not sansFocus, f'{nom} : le focus reste sur « Suivant » à chaque étape ' + str(sansFocus))
    ok(not horsCadre, f'{nom} : le cadre entoure toujours un outil des docks ' + str(horsCadre))
    ok(not horsEcran, f'{nom} : la bulle reste dans l’écran ' + str(horsEcran))
    ok(not loin, f'{nom} : l’orbe se pose contre chaque outil présenté ' + str(loin))
    ok(pg.locator('.og-orbe').evaluate("e => Math.max(...getComputedStyle(e).transitionDuration.split(',').map(parseFloat))") < 0.01, f'{nom} : moins d’animations demandées, l’orbe ne glisse pas')
    pg.get_by_role('button', name=L['fin']).click()
    ok(pg.locator('#og-titre').count() == 0, f'{nom} : « {L["fin"]} » ferme la visite')
    pg.reload(); pg.wait_for_timeout(800)
    ok(pg.locator('#og-titre').count() == 0, f'{nom} : la visite ne revient pas à la réouverture')
    pg.locator(L['menu']).click(); pg.get_by_role('button', name='Revoir la visite avec Le Point').click()
    ok(pg.locator('#og-titre').inner_text() == L['premier'], f'{nom} : le menu de l’orbe relance la visite')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    ok(pg.locator('#og-titre').count() == 0, f'{nom} : Échap ferme la visite')
    ctx.close()
    return titres

def mouvement(b):
    """Sans « moins d'animations » : l'orbe glisse d'un outil à l'autre."""
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); pg.goto(B + '/atelier'); pg.wait_for_selector('#og-titre'); pg.wait_for_timeout(900)
    avant = boite(pg, '.og-orbe'); pg.get_by_role('button', name='Suivant').click(); pg.wait_for_timeout(120)
    pendant = boite(pg, '.og-orbe'); pg.wait_for_timeout(900); apres = boite(pg, '.og-orbe')
    ok(avant['x'] != apres['x'] and pendant['x'] not in (avant['x'], apres['x']), 'ordinateur : l’orbe glisse d’un outil au suivant')
    ctx.close()

def docks(b, largeur, hauteur, nom):
    """Les docks rétractables : grilles des points, nuancier, loupe ; le point zéro ; plus de BurO."""
    ctx = b.new_context(viewport={'width': largeur, 'height': hauteur})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e))); pg.set_default_timeout(6000)
    pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/atelier'); pg.wait_for_timeout(1200)
    zero = boite(pg, '.pz-point-zero-bouton')
    ok(zero and abs((zero['x'] + zero['r']) / 2 - largeur / 2) < 4 and abs((zero['y'] + zero['b']) / 2 - hauteur / 2) < 8, f'{nom} : le bouton d’import est au point zéro, au centre de la grille')
    pg.locator('[data-guide="dessiner"]').click(); pg.wait_for_timeout(250)
    ok(pg.locator('.dg-case').count() >= 19, f'{nom} : Dessiner déplie la grille de tous les points et outils')
    capture(pg, f'docks-{nom}-dessiner')
    pg.locator('.dg-case', has_text='Demi-point').click(); pg.wait_for_timeout(200)
    ok(pg.locator('.dg-case').count() == 0 and 'Demi-point' in pg.locator('.pzs-crumbs').inner_text(), f'{nom} : choisir un point replie le dock et le garde actif')
    pg.locator('.pzs-up').click(); pg.locator('[data-guide="fils"]').click(); pg.wait_for_timeout(250)
    pg.locator('#dg-cherche-fil').fill('rouge foncé'); pg.wait_for_timeout(200)
    n = pg.locator('.dg-pastille').count()
    ok(n > 0 and pg.locator('.pzs-bottom').count() == 1, f'{nom} : le nuancier se déplie dans le dock du haut ({n} rouges foncés)')
    capture(pg, f'docks-{nom}-nuancier')
    code = pg.locator('.dg-pastille .dg-code').first.inner_text(); pg.locator('.dg-pastille').first.click(); pg.wait_for_timeout(200)
    ok(pg.locator('.dg-pastille').count() == 0 and code in pg.locator('.pzs-top').inner_text(), f'{nom} : toucher une pastille rend le fil actif et replie le dock')
    pg.locator('.pzs-up').click(); pg.wait_for_timeout(150)
    pg.get_by_role('button', name='Loupe : la grille agrandie sous le pointeur').click(); pg.wait_for_timeout(200)
    g = pg.locator('.cadre-contour').bounding_box()  # le cadre : la grille de l'ouvrage
    pg.mouse.move(g['x'] + g['width'] * .2, g['y'] + g['height'] * .05); pg.wait_for_timeout(150); a1 = pg.locator('.pzs-loupe-dock').inner_text()
    pg.mouse.move(g['x'] + g['width'] * .8, g['y'] + g['height'] * .1); pg.wait_for_timeout(150); a2 = pg.locator('.pzs-loupe-dock').inner_text()
    ok('X ' in a1 and a1 != a2, f'{nom} : la loupe suit le pointeur sur la grille')
    capture(pg, f'docks-{nom}-loupe')
    pg.get_by_role('button', name='Fermer la loupe').click()
    pg.locator('[data-guide="dessiner"]').click(); pg.locator('[data-guide="outil-cross"]').click(); pg.wait_for_timeout(150)
    for n in range(12): pg.mouse.click(g['x'] + g['width'] * .3 + (n % 4) * 12, g['y'] + g['height'] * .3 + (n // 4) * 12)
    pg.locator('.pzs-up').click(); pg.locator('[data-guide="fils"]').click(); pg.wait_for_timeout(250)
    pg.locator('.dg-filtre button').nth(1).click(); pg.wait_for_timeout(250)
    px = pg.evaluate("() => { const c = document.querySelector('.dg-carte canvas'); if (!c) return 0; const d = [0,1,2].map(n => document.querySelectorAll('.dg-carte canvas')[n].getContext('2d').getImageData(0,0,22,22).data); return d.reduce((s, a) => s + a.filter((v, i) => i % 4 === 3 && v > 0).length, 0); }")
    anim = pg.locator('.dg-scintille').first.evaluate("e => getComputedStyle(e).animationName")
    ok(px > 0 and anim == 'dg-scintille', f'{nom} : la pastille du fil brodé montre ses pixels qui scintillent ({px} pixels)')
    capture(pg, f'docks-{nom}-scintille')
    pg.keyboard.press('Escape')
    pg.locator('.pzs-profil').click(); pg.wait_for_timeout(200)
    t = pg.locator('.pzs-bloc').inner_text()
    ok('Mes ouvrages' in t and 'Nouvelle grille' in t and 'Votre espace AIME' not in t and 'BurO' not in t, f'{nom} : Mes ouvrages dans le dock, sans BurO ni Espace AIME')
    pg.goto(B + '/buro'); pg.wait_for_timeout(600)
    ok(pg.locator('#mm-titre').count() == 1, f'{nom} : l’ancienne adresse /buro mène à l’accueil')
    ctx.close()

def depuis_accueil(b):
    """L'accueil met Le Point en avant : « Faire la visite » ouvre l'atelier avec la visite, même déjà vue."""
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/'); pg.wait_for_timeout(800)
    ok(pg.locator('#chapitres .ch').count() == 8 and pg.locator('#tout dt').count() == 12, 'accueil : huit chapitres illustrés et tout le studio')
    ok(pg.locator('#editions').count() == 0 and 'Boutique' not in pg.locator('body').inner_text(), 'accueil : plus de page ni de lien vers les éditions')
    etape = lambda: pg.locator('.mm-etapes li[aria-current]').inner_text().strip()
    H = pg.evaluate('document.querySelector(".mm").offsetHeight - innerHeight')
    vus = []
    for f in (0, .45, .72, .98):
        pg.evaluate(f'window.scrollTo(0,{int(H*f)})'); pg.wait_for_timeout(400); vus.append(etape())
    ok([v.split()[-1] for v in vus] == ['peinture', 'pixels', 'croix', 'patron'], 'accueil : au défilement, la peinture devient pixels, point de croix, puis patron ' + str(vus))
    teintes = pg.locator('canvas.mm-toile').evaluate("c => { const x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, s = new Set(); for (let i = 0; i < x.length; i += 4 * 997) s.add(x[i] >> 4 << 8 | x[i+1] >> 4 << 4 | x[i+2] >> 4); return s.size; }")
    ok(teintes > 20, f'accueil : le patron est dessiné en couleurs DMC ({teintes} teintes)')
    pg.locator('#ch-nuancier').scroll_into_view_if_needed(); pg.wait_for_timeout(1200)
    ok('vu' in pg.locator('#ch-nuancier').get_attribute('class') and pg.locator('.ix a[aria-current]').get_attribute('href') == '#ch-nuancier', 'accueil : le chapitre apparaît et l’index de gauche le suit')
    ok(pg.evaluate("[...document.querySelectorAll('.ch-ecran img')].every(i => i.complete && i.naturalWidth > 0) || [...document.querySelectorAll('.ch-ecran img')].filter(i => i.loading !== 'lazy').every(i => i.naturalWidth > 0)"), 'accueil : les captures du studio se chargent')
    for k in range(8): pg.mouse.move(300 + k * 30, 300 + k * 12); pg.wait_for_timeout(16)
    ok(pg.locator('canvas.tp-traine').count() == 1, 'accueil : la souris laisse une traîne de points et de symboles')
    pg.evaluate('window.scrollTo(0,0)'); pg.wait_for_timeout(300)
    fond = pg.locator('.cross-stitch-home').evaluate("e => getComputedStyle(e).backgroundImage")
    ok('linear-gradient' in fond, 'accueil : le fond est une grille gris clair')
    pg.get_by_role('button', name='Faire la visite avec Le Point').first.click(); pg.wait_for_selector('#og-titre')
    ok(pg.url.endswith('/atelier') and pg.locator('#og-titre').inner_text() == 'Bonjour, je suis Le Point', 'accueil → « Faire la visite » : Le Point démarre dans l’atelier')
    pg.goto(B + '/boutique'); pg.wait_for_timeout(600)
    ok(pg.locator('#mm-titre').count() == 1, 'l’ancienne adresse /boutique mène à l’accueil')
    ctx.close()

def cadre(b, largeur, hauteur, nom):
    """Le Cadre : une photo s'ouvre dans son cadre ; un coin la recompte ; un bord agrandit la toile ; le + règle la photo ; on trace un format."""
    import tempfile, os
    from PIL import Image
    photo = os.path.join(tempfile.mkdtemp(), 'roses.jpg')
    Image.open(os.path.join(os.path.dirname(__file__), '../../studio/public/images/landing/peinture-roses.webp')).convert('RGB').save(photo, quality=90)
    ctx = b.new_context(viewport={'width': largeur, 'height': hauteur})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e))); pg.set_default_timeout(8000)
    pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/atelier'); pg.wait_for_timeout(1000)
    pg.set_input_files('input[aria-label="Importer une image, un PDF ou un projet"]', photo)
    pg.wait_for_function("() => /roses/.test(document.querySelector('.cadre-tete')?.textContent || '')", timeout=15000)
    dims = lambda: pg.locator('.cadre-dims').inner_text()
    d0 = dims(); g0 = pg.locator('.cadre-contour').bounding_box()
    ok('Aida 14' in pg.locator('.cadre-tete').inner_text() and '≈' in pg.locator('.cadre-surprise').inner_text(), f'{nom} : l’étiquette du cadre donne la taille réelle, le temps et les écheveaux ({d0})')
    capture(pg, f'cadre-{nom}-photo')
    c = pg.locator('.cadre-se').bounding_box(); x, y = c['x'] + 6, c['y'] + 6
    pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x - g0['width'] * .25, y - g0['height'] * .25, steps=6)
    ok(pg.locator('.cadre-fantome').count() == 1 and 'recomptée' in pg.locator('.cadre-tete').inner_text(), f'{nom} : tirer un coin montre le nouveau format en direct')
    pg.mouse.up(); pg.wait_for_function(f"() => document.querySelector('.cadre-dims')?.textContent !== {d0!r}", timeout=15000)
    w0, w1 = int(d0.split()[0]), int(dims().split()[0])
    ok(w1 < w0, f'{nom} : le coin recompte les points depuis la photo ({d0} → {dims()})')
    e = pg.locator('.cadre-e'); e.focus(); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300)
    ok(int(dims().split()[0]) == w1 + 1, f'{nom} : au clavier, le bord droit ajoute une colonne de toile')
    pg.locator('.cadre-plus').click(); pg.get_by_role('menuitem', name='La photo').click()
    avant = pg.evaluate("() => document.querySelector('canvas').toDataURL().length")
    pg.get_by_role('button', name='Ancienne').click(); pg.wait_for_timeout(2500)
    ok(pg.locator('.cadre-photo [aria-pressed="true"]').inner_text().strip().endswith('Ancienne'), f'{nom} : la palette « Ancienne » recolore depuis la photo')
    capture(pg, f'cadre-{nom}-ancienne')
    pg.keyboard.press('Escape'); pg.locator('.cadre-plus').click(); pg.get_by_role('menuitem', name='Nouveau cadre').click(); pg.wait_for_timeout(300)
    ok(pg.locator('.cadre-tracer').count() == 1, f'{nom} : « Nouveau cadre » propose de tracer son format')
    pg.locator('.cadre-formats button', has_text='Marque-page').click(); pg.wait_for_timeout(500)
    ok(dims().startswith('33 × 99'), f'{nom} : un marque-page de 6 × 18 cm fait 33 × 99 points sur Aida 14')
    ctx.close()

def rosace(b, largeur, hauteur, nom):
    """Composer une rosace : cinq gestes → une signature → un vrai patron dans le Cadre ; le lien partagé ; le clavier seul."""
    ctx = b.new_context(viewport={'width': largeur, 'height': hauteur})
    pg = ctx.new_page(); pg.on('pageerror', lambda e: erreurs.append(str(e))); pg.set_default_timeout(8000)
    pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/atelier'); pg.wait_for_timeout(900)
    bas = [x for x in pg.evaluate("() => [...document.querySelectorAll('.pzs-bottom button:not(.pzs-cercle)')].map(b => (b.innerText.trim() || b.getAttribute('aria-label') || '').split(' :')[0])") if x]
    ok(bas == ['Picto', 'À plat', 'Patron', 'Réaliste', 'Tout voir', 'Loupe'], f'{nom} : le dock du bas est réduit à Picto, À plat, Patron, Réaliste, Tout voir, Loupe {bas}')
    pg.get_by_role('button', name='Composer une rosace').first.click(); pg.wait_for_selector('#cr-titre')
    ok(pg.locator('#cr-titre').inner_text() == 'Quelle forme ?' and pg.locator('[role="radio"]').count() == 4, f'{nom} : Composer une rosace ouvre la première question, quatre images')
    capture(pg, f'rosace-{nom}-question')
    petites = pg.evaluate("() => [...document.querySelectorAll('.cr button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 28); }).length")
    ok(petites == 0, f'{nom} : aucune cible trop petite dans le parcours ({petites})')
    for rep in ['Rosace', 'Courbe', 'Aérée', 'Fin', 'Vive']:
        pg.get_by_role('radio', name=rep, exact=True).click(); pg.wait_for_timeout(250)
    ok(pg.locator('.cr .sceau svg').first.get_attribute('aria-label') == 'Sceau 5D-13133, graine 1 : rosace, courbe, aérée, fin, vive', f'{nom} : cinq gestes donnent la signature 5D-13133 et son sceau')
    capture(pg, f'rosace-{nom}-motif')
    pg.get_by_role('button', name='Broder ce motif').click(); pg.wait_for_timeout(800)
    tete = pg.locator('.cadre-nom').text_content() + ' ' + pg.locator('.cadre-dims').inner_text()
    ok('Rosace 5D-13133' in tete and '61 × 61' in tete, f'{nom} : le motif s’ouvre dans le Cadre, avec ses 61 × 61 points')
    pg.locator('.cadre-se').focus(); pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300)
    ok('67 × 67' in pg.locator('.cadre-dims').inner_text(), f'{nom} : un coin recalcule la rosace à la nouvelle taille')
    # le lien partagé : la recette seule, en lecture, sans compte ; même empreinte que dans Node (version v0.1)
    pg.goto(B + '/atelier?rosace=5D-13133.g59.v0.1'); pg.wait_for_selector('.cr-fin')
    ok(pg.locator('#cr-titre').inner_text() == 'Kaléidoscope' and pg.locator('.cr-fin').get_attribute('data-empreinte') == '508323518', f'{nom} : le lien partagé ouvre « Kaléidoscope », identique au point près à la référence')
    ok(pg.get_by_role('button', name='Recommencer').count() == 0 and 'une recette partagée' in pg.locator('.cr').inner_text().lower(), f'{nom} : le lien partagé est en lecture seule')
    pg.get_by_role('button', name='Broder ce motif').click(); pg.wait_for_timeout(600)
    ok('rosace=' not in pg.url and 'Kaléidoscope' in pg.locator('.cadre-nom').text_content(), f'{nom} : « Broder ce motif » en fait un ouvrage à soi, et l’adresse redevient celle de l’atelier')
    ctx.close()

def rosace_clavier(b):
    ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page(); pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/atelier'); pg.wait_for_timeout(900)
    pg.get_by_role('button', name='Composer une rosace').first.focus(); pg.keyboard.press('Enter'); pg.wait_for_selector('#cr-titre'); pg.wait_for_timeout(200)
    for fleches in (1, 0, 3, 1, 2):
        for _ in range(fleches): pg.keyboard.press('ArrowRight')
        pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    lbl = pg.locator('.cr .sceau svg').first.get_attribute('aria-label')
    ok(lbl == 'Sceau 5D-21423, graine 1 : anneaux, droit, totale, moyen, vive', f'ordinateur : les cinq gestes au clavier seul ({lbl})')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(600)
    ok(pg.locator('.cr').count() == 0 and 'Rosace 5D-21423' in pg.locator('.cadre-nom').text_content(), 'ordinateur : Entrée sur « Broder ce motif » ouvre le motif dans le Cadre')
    ctx.close()

def le_point(b, largeur, hauteur, nom):
    """Le Point, contrôleur universel : un seul, l'anneau dans l'écran, cibles de 44 px, Confort au clavier, réglages appliqués."""
    ctx = b.new_context(viewport={'width': largeur, 'height': hauteur})
    pg = ctx.new_page(); pg.set_default_timeout(8000)
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/atelier'); pg.wait_for_selector('.lp-point')
    ok(pg.locator('.lp-point').count() == 1, f'{nom} : un seul Point dans tout le studio')
    pt = boite(pg, '.lp-point')
    ok(pt['r'] - pt['x'] >= 44 and pt['b'] - pt['y'] >= 44, f'{nom} : le Point fait au moins 44 × 44 px')
    pg.locator('.lp-point').focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    a = boite(pg, '[data-presentation]')
    ok(a and a['x'] >= 0 and a['r'] <= largeur and a['y'] >= 0, f'{nom} : l’anneau s’ouvre entièrement dans l’écran')
    sect = pg.evaluate("""() => [...document.querySelectorAll('[data-presentation] [role=menuitem]')].map(e => { const r = e.getBoundingClientRect(); return { m: e.dataset.mode, x: r.left, y: r.top, r: r.right, b: r.bottom }; })""")
    ok([s['m'] for s in sect][0] == 'confort' and all(s['r'] - s['x'] >= 44 and s['b'] - s['y'] >= 44 for s in sect), f'{nom} : Confort en premier, chaque secteur d’au moins 44 px')
    rond = pg.locator('[data-presentation=arc]').count() == 1  # dans l'arc, des pastilles rondes : on compare les distances entre centres
    chev = any(((math.hypot((p['x'] + p['r']) / 2 - (q['x'] + q['r']) / 2, (p['y'] + p['b']) / 2 - (q['y'] + q['b']) / 2) < min(p['r'] - p['x'], q['r'] - q['x'])) if rond
               else not (p['r'] <= q['x'] or q['r'] <= p['x'] or p['b'] <= q['y'] or q['b'] <= p['y'])) for i, p in enumerate(sect) for q in sect[i+1:])
    ok(not chev, f'{nom} : aucun secteur n’en recouvre un autre')
    if rond:
        dock = boite(pg, '.pzs-bottom')
        ok(all(q['b'] <= dock['y'] for q in sect), f'{nom} : l’arc compact reste au-dessus du dock, sans couvrir ses boutons')
    vus = pg.evaluate("""() => [...document.querySelectorAll('[data-presentation] [role=menuitem]')].every(e => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return h === e || e.contains(h); })""")
    ok(vus, f'{nom} : chaque secteur est réellement visible et cliquable (rien ne le recouvre ni ne le rogne)')
    ok(pg.evaluate("document.activeElement.dataset.mode") == 'confort', f'{nom} : le focus est sur Confort à l’ouverture')
    capture(pg, f'point-anneau-{nom}')
    pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    pn = boite(pg, '.lp-panneau')
    ok(pn and pn['x'] >= 0 and pn['r'] <= largeur and pn['y'] >= 0 and pn['b'] <= hauteur, f'{nom} : le panneau Confort tient dans l’écran')
    pg.get_by_label('Mouvements réduits').check(); pg.wait_for_timeout(100)
    ok(pg.evaluate("document.documentElement.dataset.pzMotion") == 'reduce', f'{nom} : « Mouvements réduits » s’applique à toute la page')
    ok('Mouvements réduits activé' in pg.locator('.lp-annonce').inner_text(), f'{nom} : le changement est annoncé')
    pg.get_by_role('button', name='Lecture confortable').click(); pg.wait_for_timeout(150)
    taille = pg.evaluate("getComputedStyle(document.querySelector('.lp-panneau h2')).fontSize")
    ok(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--pz-user-font-scale').trim()") == '1.25', f'{nom} : « Lecture confortable » agrandit le texte à 125 % ({taille})')
    capture(pg, f'point-confort-{nom}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    ok(pg.locator('.lp-panneau').count() == 0 and pg.evaluate("document.activeElement.classList.contains('lp-point')"), f'{nom} : Échap ferme Confort et rend le focus au Point')
    pg.reload(); pg.wait_for_selector('.lp-point')
    ok(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--pz-user-font-scale').trim()") == '1.25', f'{nom} : les réglages restent après rechargement (sur cet appareil)')
    ctx.close()

def point_contextes(b, largeur, hauteur, nom):
    """Le même Point dans deux contextes : l'atelier (Loupe au clavier, menu AIME sans orbe) puis le compositeur 5D (Guide, Espace)."""
    ctx = b.new_context(viewport={'width': largeur, 'height': hauteur})
    pg = ctx.new_page(); pg.set_default_timeout(8000)
    pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue')")
    pg.goto(B + '/atelier'); pg.wait_for_selector('.lp-point')
    ok(pg.locator('#pzs-brand .pzs-orb').count() == 0 and pg.locator('.pzs-orb').count() == 0, f'{nom} : le menu du haut n’a plus de forme d’orbe')
    pg.locator('#pzs-brand').click(); pg.wait_for_timeout(150)
    ok(all(t in pg.locator('#pzs-bloc').inner_text() for t in ['Accueil Point Zéro', 'Réglages et aide', 'Revoir la visite']), f'{nom} : le menu AIME garde toutes ses fonctions')
    capture(pg, f'contexte-menu-aime-{nom}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    # Loupe au clavier
    pg.locator('.lp-point').click(); pg.wait_for_timeout(150)
    pg.locator('[data-presentation] [data-mode=loupe]').click(); pg.wait_for_timeout(150)
    pg.locator('canvas[role=application]').focus(); pg.wait_for_timeout(100)
    a = pg.locator('.pzs-loupe-dock').inner_text()
    for k in ['ArrowRight', 'ArrowRight', 'ArrowDown']: pg.keyboard.press(k)
    pg.wait_for_timeout(150); a2 = pg.locator('.pzs-loupe-dock').inner_text()
    ok('X 1 · Y 1' in a and 'X 3 · Y 2' in a2 and 'suit le clavier' in a2, f'{nom} : la Loupe suit la case choisie au clavier')
    ok(pg.locator('button[aria-label=Annuler]').is_disabled(), f'{nom} : la Loupe au clavier ne modifie pas l’ouvrage')
    capture(pg, f'contexte-loupe-clavier-{nom}')
    pg.locator('button[aria-label="Fermer la loupe"]').click(); pg.wait_for_timeout(100)
    pg.locator('.lp-point').click(); pg.wait_for_timeout(200)
    capture(pg, f'contexte-1-broderie-{nom}')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    # le compositeur
    pg.locator('.pz-point-zero-composer').click(); pg.wait_for_selector('.cr .cr-point .lp-point')
    ok(pg.locator('.lp-point').count() == 1, f'{nom} : dans le compositeur, toujours un seul Point')
    pg.locator('.lp-point').focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    modes = pg.evaluate("[...document.querySelectorAll('[data-presentation] [role=menuitem]')].map(e => e.dataset.mode)")
    ok(modes == ['confort', 'guide', 'espace'], f'{nom} : le Point du compositeur propose Confort, Guide, Espace ({modes})')
    vus = pg.evaluate("""() => [...document.querySelectorAll('[data-presentation] [role=menuitem]')].every(e => { const r = e.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return h === e || e.contains(h); })""")
    ok(vus, f'{nom} : chaque secteur est visible et cliquable au-dessus du compositeur')
    capture(pg, f'contexte-2-compositeur-{nom}')
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(100)
    ok(pg.evaluate("document.activeElement.dataset.mode") == 'guide', f'{nom} : dans le compositeur, les flèches tournent l’anneau (pas les images)')
    pg.keyboard.press('Home'); pg.wait_for_timeout(100)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    ok(pg.locator('.cr').count() == 1, f'{nom} : Échap referme l’anneau, pas le compositeur')
    # Espace : tirer le centre vers la vignette en haut à droite choisit la réponse 2
    c = pg.locator('.cr-centre').bounding_box(); x, y = c['x'] + c['width'] / 2, c['y'] + c['height'] / 2
    pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 70, y - 70, steps=6); pg.mouse.up(); pg.wait_for_timeout(250)
    ok('2 / 5' in pg.locator('.cr-sur').inner_text() and pg.locator('.cr-anneau').first.inner_text().startswith('1.'), f'{nom} : Espace actif, tirer le centre choisit une réponse')
    pg.locator('.lp-point').click(); pg.wait_for_timeout(150); pg.locator('[data-presentation] [data-mode=espace]').click(); pg.wait_for_timeout(150)
    pg.mouse.move(x, y); pg.mouse.down(); pg.mouse.move(x + 70, y - 70, steps=6); pg.mouse.up(); pg.wait_for_timeout(250)
    ok('2 / 5' in pg.locator('.cr-sur').inner_text(), f'{nom} : Espace coupé, tirer ne choisit plus rien')
    pg.locator('.cr-reponses [role=radio]').first.click(); pg.wait_for_timeout(200)
    ok('3 / 5' in pg.locator('.cr-sur').inner_text(), f'{nom} : Espace coupé, les images restent choisissables')
    pg.locator('.lp-point').click(); pg.wait_for_timeout(150); pg.locator('[data-presentation] [data-mode=guide]').click(); pg.wait_for_timeout(500)
    ok(pg.locator('#og-titre').inner_text() == 'Quatre réponses', f'{nom} : le Guide du compositeur démarre sur ses propres étapes')
    capture(pg, f'contexte-2-guide-compositeur-{nom}')
    ctx.close()

COUVERTURE = """m => [...document.querySelectorAll('.cr-vignette')].map(v => { const r = v.getBoundingClientRect(); let dedans = 0, total = 0;
    for (let x = r.left + 4; x < r.right; x += 8) for (let y = r.top + 4; y < r.bottom; y += 8) { total++; const h = document.elementFromPoint(x, y); if (h && h.closest('[data-presentation], .lp-panneau')) dedans++; }
    return total ? Math.round(dedans / total * 100) : 0; })"""
def point_telephone(b):
    """Sur téléphone, le menu du Point ne doit pas masquer les quatre choix du compositeur : arc compact contre liste."""
    mesures = {}
    for pres in ('arc', 'liste'):
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True)
        pg = ctx.new_page(); pg.set_default_timeout(8000)
        pg.on('pageerror', lambda e: erreurs.append(str(e)))
        pg.add_init_script(f"localStorage.setItem('pointzero:visite-docks:v1','vue'); localStorage.setItem('pointzero:point:presentation','{pres}')")
        pg.goto(B + '/atelier'); pg.wait_for_selector('.lp-point')
        pg.locator('.pz-point-zero-composer').click(); pg.wait_for_selector('.cr .lp-point')
        pg.locator('.lp-point').focus(); pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
        ok(pg.locator(f'[data-presentation={pres}]').count() == 1, f'telephone : le menu s’ouvre en {pres}')
        couv = pg.evaluate(COUVERTURE); mesures[pres] = couv
        a = boite(pg, '[data-presentation]')
        surface = round((a['r'] - a['x']) * (a['b'] - a['y']) / (390 * 844) * 100)
        print(f'   mesure {pres} : surface du menu {surface} % de l’écran, choix recouverts {couv} %', flush=True)
        ok(pg.evaluate("document.activeElement.dataset.mode") == 'confort', f'telephone ({pres}) : le focus est sur Confort')
        pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(80)
        ok(pg.evaluate("document.activeElement.dataset.mode") == 'guide', f'telephone ({pres}) : les flèches parcourent les modes')
        capture(pg, f'telephone-{pres}-compositeur')
        pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
        ok(max(pg.evaluate(COUVERTURE)) == 0 and pg.evaluate("document.activeElement.classList.contains('lp-point')"), f'telephone ({pres}) : refermé, plus rien ne masque les choix, le focus revient au Point')
        # un toucher à côté referme sans choisir l'image dessous
        pg.locator('.lp-point').tap(); pg.wait_for_timeout(250)
        v = pg.locator('.cr-vignette').nth(1).bounding_box()
        pg.touchscreen.tap(v['x'] + v['width'] / 2, v['y'] + 20); pg.wait_for_timeout(250)
        ok(pg.locator('[data-presentation]').count() == 0 and '1 / 5' in pg.locator('.cr-sur').inner_text(), f'telephone ({pres}) : un toucher à côté referme le menu sans choisir d’image')
        # Confort reste joignable et réglable
        pg.locator('.lp-point').tap(); pg.wait_for_timeout(250); pg.locator('[data-presentation] [data-mode=confort]').tap(); pg.wait_for_timeout(250)
        pn = boite(pg, '.lp-panneau')
        ok(pn and pn['y'] >= 0 and pn['b'] <= 844, f'telephone ({pres}) : Confort s’ouvre dans l’écran')
        capture(pg, f'telephone-{pres}-confort')
        ctx.close()
    ok(max(mesures['arc']) <= 25, f'telephone : l’arc compact laisse les quatre choix visibles ({mesures["arc"]} % recouverts)')

with sync_playwright() as p:
    b = p.chromium.launch()
    depuis_accueil(b)
    parcours(b, 1440, 900, 'ordinateur')
    parcours(b, 390, 844, 'telephone')
    docks(b, 1440, 900, 'ordinateur')
    docks(b, 390, 844, 'telephone')
    mouvement(b)
    cadre(b, 1440, 900, 'ordinateur')
    cadre(b, 390, 844, 'telephone')
    rosace(b, 1440, 900, 'ordinateur')
    rosace(b, 390, 844, 'telephone')
    rosace_clavier(b)
    le_point(b, 1440, 900, 'ordinateur')
    le_point(b, 390, 844, 'telephone')
    point_contextes(b, 1440, 900, 'ordinateur')
    point_contextes(b, 390, 844, 'telephone')
    point_telephone(b)
    b.close()
ok(not erreurs, 'aucune erreur dans la page ' + str(erreurs[:3]))
sys.exit(0 if all(resultats) else 1)
