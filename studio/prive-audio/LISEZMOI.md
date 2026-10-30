# Audio privé de LUMIERE

- `fleur-du-ciel.m4a` : « La Fleur du Ciel » entière (4 min 13), AAC 192 kbit/s, 48 kHz.
- `fleur-du-ciel-extrait.m4a` : 03:04.25 → 03:48.25 (44 s), AAC 192 kbit/s.

Encodés depuis une copie isolée du master (SHA-256 32ed627f…, branche `album-original-2026`). Les masters ne sont pas modifiés.
Le décodage est **exact à l'échantillon** dans Chromium, WebKit (Safari) et Firefox, mesuré par corrélation avec le WAV.
L'impact reste donc à 03:18.255. Le MP3 aurait introduit −23 ms dans WebKit, d'où le choix de l'AAC.

**Ces fichiers ne sont copiés dans le site QUE si la variable `LUMIERE_AUDIO_PRIVE=1` est définie au moment de la construction.**
Elle ne l'est que pour la version candidate privée (`convergence`, protégée par l'authentification Vercel).

**Avant toute publication publique** :
- vérifier les droits (composition, enregistrement, collaborateurs éventuels) ;
- et ne pas transférer ce dossier vers le dépôt public sans l'accord de Matt.
