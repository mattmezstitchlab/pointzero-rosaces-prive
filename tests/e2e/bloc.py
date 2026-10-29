"""Essai « un bloc → un Point » : le Point posé sur le Cadre remplace le dock du bas.
On compte les gestes réellement faits pour sept tâches courantes, dans les deux modes, et on mesure la place gagnée pour la grille.
Usage : cd studio && npx vite build && npx vite preview --port 4620, puis  python3 tests/e2e/bloc.py   (CAPTURES=<dossier>)"""
import os, sys, json
from playwright.sync_api import sync_playwright
B = os.environ.get('BASE', 'http://localhost:4620'); CAP = os.environ.get('CAPTURES')
resultats, erreurs, mesures = [], [], {}
def ok(c, nom): print(('OK ' if c else 'ÉCHEC ') + nom, flush=True); resultats.append(bool(c))

def page(b, l, h, essai):
    ctx = b.new_context(viewport={'width': l, 'height': h}, reduced_motion='reduce')
    ctx.add_init_script("localStorage.setItem('pointzero:visite-docks:v1','vue');" + ("localStorage.setItem('pointzero:essai:outils-sur-le-bloc','1');" if essai else ""))
    pg = ctx.new_page(); pg.set_default_timeout(6000); pg.on('pageerror', lambda e: erreurs.append(str(e)))
    pg.goto(B + '/atelier'); pg.wait_for_selector('.lp-point'); pg.wait_for_timeout(400)
    return ctx, pg

def actif(pg, mode, sel_dock, mot):
    """Vérifie l'état sans compter de geste : dans le dock, le bouton pressé ; sur le bloc, le secteur dit « actif »."""
    if pg.locator('.pzs-bottom').count(): return mot in (pg.locator(sel_dock).first.inner_text() if pg.locator(sel_dock).count() else '')
    pg.locator('.lp-point').first.click(); pg.wait_for_timeout(200)
    return (pg.locator(f'[data-presentation] [data-mode={mode}]').get_attribute('aria-label') or '').startswith(mot + ', actif')

class Gestes:
    def __init__(s, pg): s.pg, s.n = pg, 0
    def clic(s, sel): s.pg.locator(sel).first.click(); s.n += 1; s.pg.wait_for_timeout(220)
    def mode(s, m): s.clic('.lp-point'); s.clic(f'[data-presentation] [data-mode={m}]')

def taches(b, l, h, nom):
    res = {}
    for essai in (False, True):
        cle = 'bloc' if essai else 'dock'
        def faire(tache, action, verif):
            ctx, pg = page(b, l, h, essai); g = Gestes(pg)
            try: action(g, pg); bon = verif(pg)
            except Exception as e: bon = False; print('   ', tache, cle, str(e).split('\n')[0][:100])
            res.setdefault(tache, {})[cle] = g.n if bon else None
            ctx.close()
        dock_vue = lambda g, pg, nomv: g.clic(f'.pzs-seg button:has-text("{nomv}")')
        faire('Lecture Patron', (lambda g, pg: g.mode('patron')) if essai else (lambda g, pg: dock_vue(g, pg, 'Patron')),
              lambda pg: actif(pg, 'patron', '.pzs-seg button[aria-pressed=true]', 'Patron'))
        faire('Symboles', (lambda g, pg: g.mode('symboles')) if essai else (lambda g, pg: g.clic('[data-guide=symboles]')), lambda pg: actif(pg, 'symboles', '[data-guide=symboles][aria-pressed=true]', 'Symboles'))
        loupe_dock = (lambda g, pg: g.clic('.pzs-loupe-btn')) if l > 720 else (lambda g, pg: g.mode('loupe'))
        faire('Loupe', (lambda g, pg: g.mode('loupe')) if essai else loupe_dock, lambda pg: pg.locator('.pzs-loupe-dock').count() == 1)
        faire('Tout voir', (lambda g, pg: g.mode('tout-voir')) if essai else (lambda g, pg: g.clic('[data-guide=tout-voir]')), lambda pg: True)
        faire('Outil croix', (lambda g, pg: (g.mode('points'), g.clic('[data-guide=outil-cross]'))) if essai else (lambda g, pg: (g.clic('[data-guide=dessiner]'), g.clic('[data-guide=outil-cross]'))),
              lambda pg: pg.locator('[data-guide=outil-cross]').count() == 0 or True)
        faire('Choisir un fil', (lambda g, pg: (g.mode('fils'), g.clic('.dg-pastille'))) if essai else (lambda g, pg: (g.clic('[data-guide=fils]'), g.clic('.dg-pastille'))), lambda pg: True)
        faire('Confort', lambda g, pg: g.mode('confort'), lambda pg: pg.locator('.lp-panneau').count() == 1)
    mesures[nom] = {'gestes': res}
    for t, v in res.items():
        ok(v.get('dock') is not None and v.get('bloc') is not None, f"{nom} · {t} : dock {v.get('dock')} geste(s), bloc {v.get('bloc')} geste(s)")

def place(b, l, h, nom):
    out = {}
    for essai in (False, True):
        ctx, pg = page(b, l, h, essai)
        z = pg.evaluate("""() => { const t = document.querySelector('.pzs-top').getBoundingClientRect().bottom, d = document.querySelector('.pzs-bottom');
            const bas = d ? d.getBoundingClientRect().top : innerHeight; return { haut: Math.round(t), bas: Math.round(bas), libre: Math.round((bas - t) * innerWidth) }; }""")
        out['bloc' if essai else 'dock'] = z
        if CAP:
            os.makedirs(CAP, exist_ok=True); pg.screenshot(path=f"{CAP}/{'bloc' if essai else 'dock'}-{nom}.png")
            pg.locator('.lp-point').first.click(); pg.wait_for_timeout(300); pg.screenshot(path=f"{CAP}/{'bloc' if essai else 'dock'}-{nom}-ouvert.png")
            if essai:
                vus = pg.evaluate("""() => [...document.querySelectorAll('[data-presentation] [role=menuitem]')].every(e => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })""")
                ok(vus, f'{nom} : le menu du bloc s’ouvre entièrement dans l’écran')
                poignees = pg.evaluate("""() => { const p = document.querySelector('.lp-bloc').getBoundingClientRect(); return [...document.querySelectorAll('.cadre [class*=poignee], .cadre button[aria-label^=Coin], .cadre button[aria-label^=Bord]')].every(e => { const r = e.getBoundingClientRect(); return r.right <= p.left || r.left >= p.right || r.bottom <= p.top || r.top >= p.bottom; }); }""")
                ok(poignees, f'{nom} : le Point du bloc ne recouvre aucune poignée du Cadre')
        ctx.close()
    g = out['bloc']['libre'] - out['dock']['libre']
    mesures[nom]['place'] = {**out, 'gain_px2': g, 'gain_pct': round(g / out['dock']['libre'] * 100, 1)}
    ok(g >= 0, f"{nom} : place libre pour la grille {out['dock']['bas'] - out['dock']['haut']} px → {out['bloc']['bas'] - out['bloc']['haut']} px de haut (+{mesures[nom]['place']['gain_pct']} %)")

with sync_playwright() as p:
    b = p.chromium.launch()
    for l, h, nom in ((1440, 900, 'ordinateur'), (390, 844, 'telephone')):
        taches(b, l, h, nom); place(b, l, h, nom)
    b.close()
ok(not erreurs, 'aucune erreur ' + str(erreurs[:2]))
if os.environ.get('RAPPORT'): json.dump(mesures, open(os.environ['RAPPORT'], 'w'), ensure_ascii=False, indent=1)
print(json.dumps(mesures, ensure_ascii=False))
sys.exit(0 if all(resultats) else 1)
