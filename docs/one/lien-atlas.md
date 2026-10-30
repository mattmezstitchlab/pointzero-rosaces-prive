# Le lien .0NE → ATLAS

**Le lien entre les deux systèmes, pas leur fusion.** Les deux applications restent indépendantes : ATLAS vit dans son dépôt (`mattmezstitchlab/Atlas-de-pique-de-coeur`) et sur sa propre adresse ; .0NE ne recopie ni ses moteurs, ni ses données, ni ses compositions.

## Ce qui existe sur cette branche (`atlas-reference`)

| Pièce | Fichier | Rôle |
| --- | --- | --- |
| Le contrat de référence | `studio/src/lib/one/atlas.ts` | Une création ATLAS = `{ type, id }`. `resoudreAtlas()` rend l’adresse publique, ou la raison du refus |
| La carte ATLAS | `studio/src/one/disque/atlas.tsx` | Un contexte du Disque : titre, période, une phrase, « Ouvrir dans ATLAS ». Pas de lecteur |
| L’univers « atlas » | `studio/src/lib/one/univers.ts` | La case dans « Tous les univers » ; `ouverture: { type: "atlas", reference }` |
| Le contrat des univers | `studio/src/lib/one/contrat.ts` | Une ouverture `atlas` n’est acceptée que si sa référence est publiée |
| Les tests | `studio/src/__tests__/atlasReference.test.ts`, `tests/e2e/atlas_reference.py` | Unitaires, et le parcours dans un navigateur (ordinateur et téléphone) |

## Les règles

- **Destination fixe** : l’origine de `ATLAS_URL` (`studio/src/lib/destinations.ts`), et aucune autre. Une adresse fournie par la personne n’est jamais suivie.
- **Une table fermée** : seules les références vérifiées sur la version publique d’ATLAS sont dans `PUBLIEES`. Aujourd’hui, une seule : `entree.e-cube-grille`, « Du cube à la grille » → `https://atlas-de-pique-de-coeur.vercel.app/#e-cube-grille`. ATLAS la renvoie vers `/chronologie#e-cube-grille` après sa refonte des adresses (PR #6 d’ATLAS) ; l’adresse reste donc valable avant et après.
- **Rien de personnel ne voyage** : aucun paramètre ajouté, ni préférences, ni prénom, ni contexte du Disque. Nouvel onglet, `rel="noopener noreferrer"`, `referrerPolicy="no-referrer"` : ATLAS ne reçoit pas l’adresse de .0NE et n’a aucun accès en retour.
- **Dire ce qui n’est pas publié** : une référence inconnue (« pas encore publiée »), invalide (« pas valide ») ou une composition (« pas encore d’adresse publique confirmée ») ne s’ouvre pas, et la ligne d’état le dit.
- **L’adresse de .0NE** peut désigner une référence : `/studio/one/univers?u=atlas&o=entree.e-cube-grille`. Elle passe par le filtre de `lireEtat` (lettres, chiffres, `.`, `_`, `-`), puis par `resoudreAtlas`.

## Ce qui attend ATLAS

- **Les compositions** : le type `composition` existe dans le contrat, mais rien ne s’ouvre tant qu’ATLAS n’a pas confirmé la route définitive de ses compositions publiques. Il suffira alors d’ajouter la route dans `resoudreAtlas` et chaque composition publiée dans `PUBLIEES`.

## Ce qui n’est pas touché

Le film LUMIERE, la Première rencontre, la géométrie du Disque (`DisqueOne`), les autres univers et leurs contextes.

## Vérifier

```bash
cd studio && npx vitest run src/__tests__/atlasReference.test.ts
```

```bash
BASE=http://localhost:4174 python3 tests/e2e/atlas_reference.py
```

L’essai de navigateur intercepte la version publique d’ATLAS (le réseau du banc d’essai peut la bloquer) et vérifie l’adresse demandée et l’absence d’en-tête `Referer`.
