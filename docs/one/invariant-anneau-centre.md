# Invariant .ONE : l'anneau choisit, le centre affiche

Règle de Matt (30/10/2026), vérifiée par `tests/e2e/lecture.py` (fonction `invariant`) et `tests/e2e/portail.py`.

1. Deux zones seulement : l'anneau (je choisis) et le centre (je vois et j'agis). Rien de visible hors du Disque, sauf l'en-tête.
2. La couronne extérieure garde Confort · Faire · Aller · Voir · Origine ; un choix qui change le centre la ramène à ce premier cercle (`revientAuPoint`).
3. L'anneau intérieur montre seulement les choix du niveau courant (types → fichiers → lectures → actions) ; trop de choix : des pages.
4. Une seule représentation principale au centre ; « Agrandir » quand il faut de la place, sans perdre Retour ni Origine.
5. Critère : si l'on masque l'extérieur du Disque, le centre dit encore où l'on est (le fil), ce que l'on regarde (le nom), ce que l'on peut faire (les choix et les gestes).
6. Ne rien inventer : la lecture montre ce que les moteurs extraient ; les limites sont dites ; l'original est conservé.
