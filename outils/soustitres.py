"""Les sous-titres de « La Fleur du Ciel — avec la voix » : le texte écrit par Matt (et non la transcription automatique),
calé mot à mot sur les instants mesurés dans ses enregistrements (faster-whisper), placés à leurs départs dans le morceau.
  python3 -I soustitres.py <texte.json> <mots.json> <sortie (sans extension)>"""
import sys, json, re, unicodedata, difflib
texte, mots, sortie = json.load(open(sys.argv[1])), json.load(open(sys.argv[2])), sys.argv[3]
DEBUT = {1: .6, 2: 41.9, 3: 75.0, 4: 111.6, 5: 151.4, 6: 198.55, 7: 208.0, 8: 243.35}     # le départ de chaque enregistrement dans le morceau (mixer.sh)
def norme(m): m = unicodedata.normalize('NFD', m.lower()); m = ''.join(c for c in m if unicodedata.category(c) != 'Mn'); return re.sub(r"[^a-z0-9]", '', m)
def segments(t):
    """des phrases ; une phrase trop longue est coupée aux virgules (deux lignes de 42 signes au plus)"""
    out = []
    for ph in re.findall(r'[^.?!…:]+[.?!…:]+(?:\s|$)|[^.?!…:]+$', t):
        ph = ph.strip()
        if not ph: continue
        if len(ph) <= 84: out.append(ph); continue
        cour = ''
        for morceau in re.split(r'(?<=,)\s', ph):
            if cour and len(cour) + 1 + len(morceau) > 84: out.append(cour); cour = morceau
            else: cour = (cour + ' ' + morceau).strip()
        if cour: out.append(cour)
    return out
def ligne2(s):
    if len(s) <= 42: return s
    mots_ = s.split(' '); best = min(range(1, len(mots_)), key=lambda k: abs(len(' '.join(mots_[:k])) - len(s) / 2))
    return ' '.join(mots_[:best]) + '\n' + ' '.join(mots_[best:])
cues = []
for i in range(1, 9):
    W = mots[str(i)]; wn = [norme(w[2]) for w in W]
    segs = segments(texte[str(i)]); toks = [(k, norme(m)) for k, s in enumerate(segs) for m in re.split(r"[\s'’\-]+", s) if norme(m)]
    sm = difflib.SequenceMatcher(None, [t for _, t in toks], wn, autojunk=False)
    lien = {}
    for a, b, n in sm.get_matching_blocks():
        for j in range(n): lien[a + j] = b + j
    loc = []
    for k, s in enumerate(segs):
        idx = [lien[j] for j, (kk, _) in enumerate(toks) if kk == k and j in lien]
        loc.append([DEBUT[i] + W[min(idx)][0], DEBUT[i] + W[max(idx)][1], s] if idx else [None, None, s])
    # une phrase que la transcription a mal entendue (« D, M, C » ; « AIME » entendu « M. ») : entre ses voisines, sur les mots restants
    for k, c in enumerate(loc):
        if c[0] is None:
            avant = loc[k - 1][1] if k > 0 and loc[k - 1][1] else DEBUT[i] + W[0][0]
            apres = next((loc[j][0] for j in range(k + 1, len(loc)) if loc[j][0]), DEBUT[i] + W[-1][1])
            c[0], c[1] = avant + .1, apres - .1
            print('calée entre ses voisines :', repr(c[2]), round(c[0], 2), round(c[1], 2))
    cues += [[a, b_ + .35, s] for a, b_, s in loc]
for k in range(len(cues) - 1): cues[k][1] = min(cues[k][1], cues[k + 1][0] - .05)
for c in cues: c[1] = max(c[1], c[0] + 1.0)
for k in range(len(cues) - 1): cues[k][1] = min(cues[k][1], cues[k + 1][0] - .05)
def tc(t, sep): h, r = divmod(t, 3600); m, s = divmod(r, 60); return f'{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s % 1) * 1000)) % 1000:03d}'
with open(sortie + '.vtt', 'w') as f:
    f.write('WEBVTT\nKind: captions\nLanguage: fr\n\nNOTE La Fleur du Ciel — avec la voix de Matt. Texte original de Matt, calé sur ses enregistrements.\n\n')
    for k, (a, b, s) in enumerate(cues, 1): f.write(f'{k}\n{tc(a, ".")} --> {tc(b, ".")}\n{ligne2(s)}\n\n')
with open(sortie + '.srt', 'w') as f:
    for k, (a, b, s) in enumerate(cues, 1): f.write(f'{k}\n{tc(a, ",")} --> {tc(b, ",")}\n{ligne2(s)}\n\n')
print(len(cues), 'sous-titres')
manq = sum(len(segments(texte[str(i)])) for i in range(1, 9)) - len(cues); print('phrases sans instant :', manq)
