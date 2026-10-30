# LUMIERE — Préproduction visuelle (30/10/2026)

*Branche `convergence`, privée. Rien n'est publié hors de preview.lemondeaime.com.*

## Ce qui existe

- **Prévisualisation 03:14.25 → 03:26.25** (P20 → P24), rendue par nos moteurs : l'approche verticale au-dessus du Disque
  posé dans l'herbe à l'aube, la goutte vue d'en haut (une vraie lentille : elle montre le monde inversé), le creux en
  macro (la goutte suspendue, le monde inversé dans sa lentille), la chute, le contact sur la perle éteinte, la première
  onde RIPPLE (les anneaux du cadran s'allument à son passage, puis les huit points de la couronne, un par temps),
  la rosée qui s'allume dans la prairie, la caméra qui monte.
  - En ligne (privé) : *Vivre LUMIERE* → version « Prévisualisation · 03:14 → 03:26 », et la version « Le film ·
    séquencier de 31 plans » qui joue tout le séquencier avec ses plans provisoires.
  - Export 1080p, 24 i/s, avec l'extrait de musique : fichier de travail privé, non publié.
- **Les quatre planches de référence**, 3840 × 2160, rendues par les mêmes moteurs, sans texte :
  l'Orbe et ses états · le Disque exact, perle éteinte · Gold, forme de lumière provisoire · la prairie (nuit, aube, lever).
  Route privée : `/studio/one/lumiere/planches?p=orbe|disque|gold|prairie`.
- **Le film comme données** : `studio/src/film/lumiere/donnees/fleur-du-ciel.film.json`. 31 plans, chacun avec son
  minutage (temps du morceau), sa mise en scène, sa fabrication, ses repères, et plusieurs versions (prévisualisation,
  génération Manus avec son prompt, tournage, substitution) dont une seule est active.
  `lib/cinema/film.ts` vérifie la cohérence et traduit le film en montage pour le moteur existant.

## Synchronisation

- La coupe P22 → P23 tombe sur l'image n° 4758 (198,250 s) : c'est l'image qui contient l'attaque. Le repère musical
  reste 198,255 s (verrouillé). Image suivante : 37 ms trop tard ; l'image 4758 est la plus juste.
- L'AAC utilisé sur le site est aligné au sample près sur le WAV original (corrélation : 0,0 ms ; empreinte du master
  inchangée, `32ed627f…`). Le master a seulement été lu, jamais modifié.
- Contrôle après export : voir le rapport de la prévisualisation (écart image ↔ son mesuré sur le fichier exporté).

## Décisions appliquées

- L'animatique de la goutte dans l'eau est conservé en archive (Vivre LUMIERE → « Animatique · 44 s (archive) »).
- Gold : forme céleste et dorée provisoire.
- P17 (les mains) : version de substitution non destructive (le Disque déjà posé, seul la nuit) ; la version
  « tournage » attend la prise de vue réelle et la remplacera sans changer durée ni repères.
- L'ouverture du site reste le clip actuel tant que le film n'est pas validé.

## Disque CINÉMA (prochaine étape)

Les données du film sont prêtes à être éditées dans le Bureau : un plan = une fiche (minutage, mise en scène, fabrication,
versions, droits), une version = un média avec sa provenance. Le Bureau devra : lister les plans par mouvement,
activer une version, déposer un média (vidéo, image), saisir un prompt, et refuser toute modification qui déplace un
repère verrouillé (la vérification existe déjà : `verifierFilm` + `verifier`).
