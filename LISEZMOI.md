# LE MONDE AIME — la voix de Matt : archive privée (1/11/2026)

**PRIVÉ.** Ces fichiers contiennent la voix de Matt et ses enregistrements personnels. Ils ne vont dans **aucun dépôt public**
ni **aucun déploiement** accessible publiquement. `vercel.json` désactive les déploiements de cette branche.
Archivé avec l'accord de Matt (1/11/2026, 12:54).

## Décision artistique (Matt, 1/11/2026, 12:50)
- **Référence officielle : « La Fleur du Ciel » brodée d'origine**, inchangée (images et bande-son) : la version « Musique seule », par défaut.
- Deuxième version retenue : **« La Fleur du Ciel — Avec ma voix »** : le même film, image pour image, avec les 8 enregistrements et le mixage ; sous-titres facultatifs dans un fichier séparé.
- La v1 et la v2 de la tapisserie (LE-MONDE-AIME) sont conservées ; **la v2 n'est pas validée** (trop décorative) ; aucune n'est publiée.

## Contenu
| Dossier | Ce que c'est |
|---|---|
| `enregistrements/vo1.wav … vo8.wav` | les 8 enregistrements originaux de Matt (24 kHz, mono), octet pour octet |
| `transcription/mots-faster-whisper.json` | la transcription mot à mot : pour chaque enregistrement, [début, fin, mot] en secondes depuis le début du fichier (faster-whisper « small », fr) — **automatique, avec des erreurs** (« inconnue », « aimait », « M. » pour AIME) |
| `transcription/texte-original-matt.json` | le texte écrit par Matt, découpé par enregistrement (la référence pour les sous-titres) |
| `sous-titres/` | les sous-titres (WebVTT et SRT) : le texte de Matt, calé sur les instants mesurés, dans le temps du morceau (80 sous-titres) |
| `mixage/mixer.sh` | la recette exacte du mixage (ffmpeg) ; `mixage/mix.m4a` le résultat ; `mixage/fleur-du-ciel-musique-seule.m4a` la musique d'origine |
| `versions/avec-la-voix/` | **La Fleur du Ciel — avec la voix** : flux vidéo copié tel quel du film publié (MD5 du flux vidéo identique), mixage voix + musique ; sous-titres à côté |
| `versions/v1/`, `versions/v2/` | la tapisserie LE MONDE AIME v1 et v2 (vidéos et scripts) ; la v2 non validée |
| `outils/` | les scripts et données pour tout refaire (fleur.py, brodeur.py, dmc.json, symboles.json, rythme.json, soustitres.py), et les versions des outils |

## Placement de la voix dans le morceau (secondes)
| Enregistrement | Départ | Contenu |
|---|---|---|
| vo1 | 0,600 | Aux origines (« Avant les machines… gestes transmis ») |
| vo2 | 41,900 | La mémoire des hommes |
| vo3 | 75,000 | Le commencement d'un regard |
| vo4 | 111,600 | Les années invisibles |
| vo5 | 151,400 | La découverte (« … AIME » à 194,58 s, avant le silence de 196,275 s) |
| vo6 | 198,550 | « Pour une paix désarmée » (juste après l'impact, 198,255 s) |
| vo7 | 208,000 | L'ouverture au monde (03:28) |
| vo8 | 243,350 | La dernière lumière (après la Perle, 242,75 s) |

## Le mixage (paramètres)
- Voix : rééchantillonnée 48 kHz, stéréo, passe-haut 70 Hz, `loudnorm` I = −15 LUFS, TP = −2 dB, LRA = 9 ; posée à son départ (`adelay`).
- Musique : volume 0,8, puis compression déclenchée par la voix (`sidechaincompress` seuil 0,008, ratio 12, attaque 40 ms, relâche 700 ms) : elle se retire sous la voix.
- Somme, limiteur 0,89 (sans normalisation), volume 0,78 → crête ≈ −3,9 dBFS. AAC 192 kbit/s.
- **Refaire** : `bash mixage/mixer.sh` (variables `M`, `V`, `SORTIE`). Vérifié : le son refait est identique, échantillon pour échantillon (MD5 du flux décodé).
- **Refaire la version avec la voix** : `ffmpeg -i <film publié>.mp4 -i mixage/mix.m4a -map 0:v -map 1:a -c copy -movflags +faststart La-Fleur-du-Ciel-avec-la-voix.mp4` (aucun nouveau rendu d'image).
- **Refaire les sous-titres** : `python3 outils/soustitres.py transcription/texte-original-matt.json transcription/mots-faster-whisper.json sortie`.

## Intégrité
`SHA256SUMS` : l'empreinte de chaque fichier. Vérifier : `sha256sum -c SHA256SUMS`.
