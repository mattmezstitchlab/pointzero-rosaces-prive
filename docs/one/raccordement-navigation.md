# AIME / .0NE — Raccordement de la navigation (30/10/2026)

*Branche `raccordement` (commit 8c7a8a3), avancée sur `convergence` → preview.lemondeaime.com. Production inchangée. Le film n'est pas modifié.*

**Parcours unique :** Film LUMIERE → Première rencontre (préférences) → Accueil de choix → Disque .0NE | Cube ATLAS.
Préférences déjà enregistrées → directement l'accueil ; « Modifier mes préférences » rouvre la Première rencontre.

## Routes réelles, avant / après

| Destination | Adresse | Avant | Après |
|---|---|---|---|
| Entrée du site | `/` | → film (redirection) | inchangé |
| Film LUMIERE | `/studio/one/lumiere` | existant, testé ; fin ou « Passer » → Première rencontre | inchangé (film non modifié) |
| Première rencontre | `/studio/one/premiere-rencontre` | existant ; menait directement à `/one/univers` (le choix était sauté) | mène à l'accueil ; si préférences enregistrées → accueil ; `?modifier` pour les revoir |
| **Accueil de choix** | `/studio/accueil` (et `/accueil`) | **manquant** | **créé** : le Disque → .0NE, le Cube → ATLAS |
| Disque .0NE | `/studio/one/univers` (et `/studio/one`) | prototype fonctionnel, testé | + lien « Accueil AIME » (retour au choix) |
| Galerie (rosaces au centre) | `/studio/one/univers?u=galerie` | prototype fonctionnel | inchangé |
| Bureau (vos ouvrages au centre) | `/studio/one/univers?u=bureau` | prototype fonctionnel | inchangé |
| Atelier Broderie (POINT ZÉRO) | `/studio/atelier` | public | inchangé |
| Galerie des Vivants | `/studio/galerie` | existant ; demande une base (vide sur l'aperçu) | inchangé |
| Bureau éditorial | `/studio/bureau` | prototype ; demande un serveur (indisponible sur l'aperçu) | inchangé |
| CINÉMA | — | **manquant** (pas de Disque CINÉMA ; le plus proche : `/studio/one/lumiere/vivre`, prototype) | non créé : aucune destination fictive |
| ATLAS | — | **lien absent** (« non raccordé ») | `https://atlas-de-pique-de-coeur.vercel.app/` (vérifiée : production publique, 643 applications) ; `/atlas` y redirige |
| Ancien ATLAS « Mémoire active » | `https://atlasaime.vercel.app/` | projet séparé, plus ancien | non utilisé (à décider) |
| Tous les accès | `/studio/explorer` | existant | + accueil ; ATLAS devient « projet séparé » avec son lien |
| Ancienne mosaïque | `/studio/one/mosaique` | gardée pour comparaison | inchangée (candidate à redirection vers l'accueil) |
| Socle visuel AIME | `/studio/essai-aime` | prototype | inchangé (référence de design) |
| Écran de secours (erreur) | — | renvoyait à `.0NE` | renvoie à l'accueil AIME |

## Branches

- Intégrées dans `convergence` : bureau-contenus, cartes-vivantes, design-aime, disque-indicateurs, edition-landing, lumiere-film, one-terminal, one-universel, point, radial-universel, rosaces, tambour-vivant.
- Non intégrées, et non nécessaires à cette navigation : `album-original-2026` (WAV masters, privé, ne jamais fusionner), `archive/*` (copies d'archive), branches du dépôt public (accueil, docks-navigation, metamorphose, unions, etc. : expériences de l'ancien site, non fusionnées).
- ATLAS vit dans son propre dépôt (mattmezstitchlab/Atlas-de-pique-de-coeur) : rien n'est copié.

## Tests

- `tests/e2e/parcours_aime.py` : 44/44 (Chromium, WebKit/Safari, téléphones) — film → Passer → Première rencontre → accueil ; Disque → .0NE → retour ; Cube → ATLAS (nouvel onglet) ; retour au film avec préférences → accueil direct ; modifier les préférences ; thème gardé ; /atlas et /accueil ; téléphone sans débordement.
- Non-régression : ouverture du film 56/56, convergence 58/58, .0NE 25/25, démonstration du Disque 74/74, 499 tests unitaires.
