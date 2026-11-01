#!/bin/bash
# la musique (« La Fleur du Ciel ») et la voix de Matt (8 morceaux, posés à leurs instants) ; la musique s'efface sous la voix
cd "$(dirname "$0")"
# la musique : « La Fleur du Ciel » (AAC aligné sur le master ; aussi dans le dépôt privé, studio/prive-audio/fleur-du-ciel.m4a)
M=${M:-fleur-du-ciel-musique-seule.m4a}
V=${V:-../enregistrements}
SORTIE=${SORTIE:-mix.m4a}
D=(0 600 41900 75000 111600 151400 198550 208000 243350)
IN=""; F=""
for i in 1 2 3 4 5 6 7 8; do IN="$IN -i $V/vo$i.wav"; F="$F[$i:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,loudnorm=I=-15:TP=-2:LRA=9,aresample=48000,adelay=${D[$i]}|${D[$i]}[v$i];"; done
ffmpeg -v error -y -i $M $IN -filter_complex "$F[v1][v2][v3][v4][v5][v6][v7][v8]amix=inputs=8:normalize=0,apad[vo];[vo]asplit=2[vox][sc];[0:a]volume=0.8[mus];[mus][sc]sidechaincompress=threshold=0.008:ratio=12:attack=40:release=700:makeup=1[musd];[musd][vox]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.89:level=false,volume=0.78[out]" -map "[out]" -c:a aac -b:a 192k "$SORTIE"
