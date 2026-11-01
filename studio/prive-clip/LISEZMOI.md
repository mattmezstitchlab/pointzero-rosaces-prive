# Données privées des clips brodés

- `uptown/` : UPTOWN (le clip de Saint-Luc), restauré (Real-ESRGAN realesr-animevideov3, ×4) puis brodé sur « Amor amour 2 » (Matt), 1/11/2026.
  - `clip.json` : format `clip-brode` v1 — la palette (36 fils DMC, données craft-color-codes CC BY 4.0), la carte du temps UPTOWN → Amor,
    les parties du morceau (mesurées dans le WAV), les temps forts.
  - `fils-NNN.bin.gz` : 50 images par fichier, 160 × 160 octets par image (l'indice du fil de chaque point), gzip. 5 123 images, 7,0 Mo.
  - Produits par le même calcul que la vidéo rendue `UPTOWN-brode-Amor-1920.mp4` (même palette, même carte, même hystérésis).
- Lus par la page `/uptown` (`src/clip/`).

**Copiés dans le site QUE si `LUMIERE_AUDIO_PRIVE=1`** (la version candidate privée, protégée), comme `prive-audio/`.
**Avant toute publication publique** : l'accord de Matt ; ce dossier ne va pas dans le dépôt public.
