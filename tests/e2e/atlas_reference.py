"""Le lien .0NE → ATLAS (pas une fusion) : je sélectionne une création ATLAS depuis le Disque et j'arrive sur sa version publique.
1. la carte ATLAS est dans « Tous les univers » · 2. le Disque montre « Du cube à la grille » · 3. le lien va à la seule origine d'ATLAS,
sans paramètre, dans un nouvel onglet, sans référent · 4. l'onglet ouvert demande exactement l'adresse publique, sans en-tête Referer ·
5. une référence pas encore publiée le dit, et rien ne s'ouvre · 6. une adresse fournie dans ?o= n'ouvre rien · 7. les compositions attendent ATLAS.
La version publique d'ATLAS est interceptée (le réseau du banc d'essai peut la bloquer) : on vérifie l'adresse et les en-têtes demandés.
Ordinateur (couronne) et téléphone (liste). Usage : BASE=… NAVIGATEURS=chromium,webkit [CHROMIUM=chemin] python3 tests/e2e/atlas_reference.py"""
import os
from playwright.sync_api import sync_playwright
B = os.environ['BASE'].rstrip('/'); NAVS = os.environ.get('NAVIGATEURS', 'chromium').split(',')
ATLAS = 'https://atlas-de-pique-de-coeur.vercel.app'
res = []
def ok(c, nom): res.append((bool(c), nom)); print(('✓ ' if c else 'ÉCHEC ') + nom)
PREFS = "localStorage.setItem('aime:one:preferences:v1', JSON.stringify({ rencontre: { terminee: true } }))"

with sync_playwright() as p:
    for n in NAVS:
        for mobile in (False, True):
            N = f'{n}{" téléphone" if mobile else ""}'
            exe = os.environ.get('CHROMIUM') if n == 'chromium' else None
            nav = getattr(p, n).launch(**({'executable_path': exe} if exe else {}))
            ctx = nav.new_context(viewport={'width': 390, 'height': 844} if mobile else {'width': 1280, 'height': 900}, is_mobile=mobile and n == 'chromium', has_touch=mobile)
            demandes = []
            def atlas(route, req): demandes.append((req.url, req.headers.get('referer'))); route.fulfill(status=200, content_type='text/html', body='<title>Atlas de pique de cœur</title><h1>ATLAS</h1>')
            ctx.route(ATLAS + '/**', atlas)
            ctx.add_init_script(PREFS)
            err = []; pg = ctx.new_page(); pg.on('pageerror', lambda e: err.append(str(e)))

            pg.goto(B + '/studio/one/univers'); pg.wait_for_selector('.dq', timeout=20000); pg.wait_for_timeout(600)
            pg.click('.dq-bouton-grille'); pg.wait_for_selector('.dq-grille')
            case = pg.locator('.dq-case[data-univers="atlas"]')
            ok(case.count() == 1 and 'Disponible' in case.inner_text(), f'{N} 1. la carte ATLAS est dans « Tous les univers », disponible')
            case.click(); pg.wait_for_selector('.dq-atlas', timeout=10000)
            ok('u=atlas' in pg.url and 'Du cube à la grille' in pg.inner_text('.dq-atlas'), f'{N} 2. le Disque montre « Du cube à la grille »')

            lien = pg.locator('.dq-atlas a.one-bouton').first
            href, cible, rel, refpol = (lien.get_attribute(a) for a in ('href', 'target', 'rel', 'referrerpolicy'))
            ok(href == ATLAS + '/#e-cube-grille' and cible == '_blank' and 'noopener' in rel and 'noreferrer' in rel and refpol == 'no-referrer',
               f'{N} 3. le lien : la seule origine d\'ATLAS, sans paramètre, nouvel onglet, sans référent')

            with ctx.expect_page() as nouvelle: lien.click()
            onglet = nouvelle.value; onglet.wait_for_load_state()
            ok(onglet.url == ATLAS + '/#e-cube-grille' and demandes and demandes[-1][0] == ATLAS + '/' and not demandes[-1][1],
               f'{N} 4. l\'onglet arrive sur la version publique d\'ATLAS ({onglet.url}), sans en-tête Referer')
            ok(onglet.evaluate('window.opener') is None, f'{N}    l\'onglet ATLAS n\'a aucun accès en retour à .0NE')
            onglet.close(); n_avant = len(demandes)

            pg.goto(B + '/studio/one/univers?u=atlas&o=entree.e-pas-encore'); pg.wait_for_selector('.dq-atlas'); pg.wait_for_timeout(400)
            ok('pas encore publiée' in pg.inner_text('.dq-atlas'), f'{N} 5. une référence non publiée le dit clairement')
            pg.goto(B + '/studio/one/univers?u=atlas&o=url.exemple.org'); pg.wait_for_selector('.dq-atlas'); pg.wait_for_timeout(400)
            ok('pas valide' in pg.inner_text('.dq-atlas'), f'{N} 6. un type inconnu dans l\'adresse de .0NE est refusé')
            pg.goto(B + '/studio/one/univers?u=atlas&o=' + 'entree:https://exemple.org/#x'); pg.wait_for_selector('.dq-atlas'); pg.wait_for_timeout(400)
            hrefs = pg.eval_on_selector_all('a[href]', 'l => l.map(a => a.href)')
            ok(not any('exemple.org' in h for h in hrefs) and all(h.startswith(B) or h.startswith(ATLAS + '/') for h in hrefs),
               f'{N}    une adresse fournie n\'apparaît dans aucun lien : seules .0NE et l\'origine d\'ATLAS')
            ok(len(demandes) == n_avant, f'{N}    aucune requête vers ATLAS sans geste de la personne')

            pg.goto(B + '/studio/one/univers?u=atlas'); pg.wait_for_selector('.dq-atlas'); pg.wait_for_timeout(400)
            if mobile: pg.get_by_role('button', name='Compositions').first.click()
            else: pg.locator('[data-mode="atlas-compositions"], button:has-text("Compositions")').first.click()
            pg.wait_for_timeout(300)
            ok('pas encore d’adresse publique confirmée' in pg.inner_text('.dq-zone'), f'{N} 7. les compositions attendent la route d\'ATLAS')
            ok(not err, f'{N}    aucune erreur ({err[:1]})')
            ctx.close(); nav.close()

echoues = [x for x in res if not x[0]]
print(f'\n{len(res) - len(echoues)}/{len(res)}'); raise SystemExit(1 if echoues else 0)
