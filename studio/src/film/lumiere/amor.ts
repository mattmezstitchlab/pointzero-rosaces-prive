/**
 * LUMIERE sur « Amor amour 2 » (décision de Matt, 31/10/2026 : « plus rythmé ») : le même film de 31 plans, remonté sur un autre morceau.
 *
 * Rien n'est refait ni copié : chaque plan garde sa scène et son récit (le temps narratif reste celui de « La Fleur du Ciel »).
 * Une CARTE du temps dit, pour chaque instant du nouveau morceau, quel instant du film il montre. Elle passe par :
 *  - les repères mesurés dans le WAV d'« Amor amour 2 » (48 kHz) : l'entrée du son, les grandes sections, la cassure de 01:40,
 *    le dernier grand passage (02:12.445, sur le temps), la fin du dernier passage (03:16.379), la fin (03:24.920) ;
 *  - l'IMPACT (la goutte rejoint la perle) posé à 02:12.445, le début du dernier grand passage (choix de Matt) ;
 *  - de l'eau de la nuit (−12 s) à la Terre (+8 s), la vitesse est exactement 1 : la séquence validée goutte → creux → chute →
 *    impact → arc-en-ciel est inchangée, au millième près ;
 *  - ailleurs, les coupes tombent sur un temps du morceau (≈ 122 BPM) quand c'est possible (15 coupes sur 18).
 * La version « La Fleur du Ciel » (montages.ts) n'est pas modifiée ; on la retrouve avec ?montage=lumiere-film.
 */
import type { Montage, Morceau, Plan, Provenance } from "../../lib/cinema/montage";
import { interpoler } from "../../lib/cinema/montage";

const MUSIQUE_MATT: Provenance = { auteur: "Matt (Matthieu Lecointre)", droits: "a-verifier",
  note: "Œuvre déclarée par Matt (« 7bis – Amor amour 2 »). Avant toute diffusion publique : vérifier composition, enregistrement et collaborateurs éventuels." };

/** La carte du temps : [instant du film « Fleur du Ciel », instant d'« Amor amour 2 »], strictement croissante (calculée depuis le WAV). */
export const CARTE_AMOR: [number, number][] = [[0, 0.0], [8.25, 2.648], [24.25, 10.329], [40.25, 18.011], [56.25, 25.891], [64.25, 29.435], [72.25, 33.373],
  [80.25, 40.979], [90.25, 50.317], [102.25, 61.635], [112.25, 70.971], [124.25, 78.84], [129.25, 81.795], [135.25, 85.725], [147.25, 93.099],
  [160.25, 101.472], [168.25, 107.36], [180.25, 116.213], [186.25, 120.44], [194.25, 128.44], [196.275, 130.465], [196.775, 130.965], [198.25, 132.44],
  [202.25, 136.44], [206.25, 140.44], [214.25, 153.104], [222.25, 165.4], [229.25, 176.707], [236.25, 187.528], [240.25, 193.879], [242.75, 196.379],
  [248.25, 200.962], [253.0, 204.92]];
/** l'instant d'« Amor amour » qui montre l'instant t du film « Fleur » */
export const versAmor = (t: number) => interpoler(CARTE_AMOR, t);

const r = (temps: number, nature: string, verrouille: boolean, source: "mesure" | "cale" = "mesure") => ({ temps, nature, verrouille, source });
export const AMOR_AMOUR: Morceau = {
  id: "amor-amour", titre: "Amor amour 2", fichier: "7bis - Amor amour 2.wav", duree: 204.92, tempo: 122.3, provenance: MUSIQUE_MATT,
  reperes: {
    lumiere: r(2.648, "le son s'installe (première frontière de section)", false),
    section2: r(33.373, "fin de l'entrée : le premier passage, sur le temps", false),
    section3: r(70.971, "le deuxième passage, sur le temps", false),
    section4: r(101.472, "après la cassure (−23 dB pendant 1 s, 01:40), le temps", false),
    sombre: r(120.44, "12 s avant l'impact : l'eau de la nuit", true, "cale"),
    goutte: r(128.44, "4 s avant l'impact : la goutte", true, "cale"),
    creux: r(130.465, "le creux de la séquence validée (calé sur l'impact)", true, "cale"),
    chute: r(130.965, "la chute de la séquence validée (calée sur l'impact)", true, "cale"),
    impact: r(132.445, "L'IMPACT : le dernier grand passage commence, sur le temps (choix de Matt)", true),
    perle: r(196.379, "la fin du dernier passage, sur le temps : la Perle s'allume", true),
    fin: r(204.92, "fin du morceau", false),
  },
};

/** Remonte un montage du film « Fleur » (plans procéduraux contigus, temps du film = temps de la Fleur) sur « Amor amour ». */
export function remonterSurAmor(m: Montage, opts: { id: string; titre: string }): Montage {
  let curseur = 0;
  const plans: Plan[] = m.plans.map(p => {
    const a = curseur, b = curseur + p.duree; curseur = b;
    const A = versAmor(a), B = versAmor(b);
    if (p.source.genre !== "procedural") throw new Error(`remonter : le plan ${p.id} n'est pas procédural`);
    /* le récit du plan : aux bornes et à chaque point de la carte, l'instant d'Amor (relatif au plan) montre l'instant de la Fleur */
    const recit = (tf: number) => interpoler(p.source.genre === "procedural" ? p.source.narratif : [], tf - a);
    const points: [number, number][] = [[0, recit(a)], ...CARTE_AMOR.filter(([f]) => f > a + 1e-9 && f < b - 1e-9).map(([f, x]) => [+(x - A).toFixed(6), recit(f)] as [number, number]), [+(B - A).toFixed(6), recit(b)]];
    const synchro = (p.synchro ?? []).flatMap(s => {
      const cle = s.repere.split(":")[1], rep = AMOR_AMOUR.reperes[cle];
      return rep ? [{ repere: `${AMOR_AMOUR.id}:${cle}`, tPlan: +(rep.temps - A).toFixed(6) }] : [];
    });
    return { ...p, chapitre: "amor", source: { ...p.source, narratif: points }, duree: +(B - A).toFixed(6), synchro };
  });
  return {
    id: opts.id, titre: opts.titre, version: "chapitre",
    description: `Amor amour 2 · 3 min 25 · ${plans.length} plans · l'impact à 02:12.445`,
    morceaux: { [AMOR_AMOUR.id]: AMOR_AMOUR }, chapitres: [{ id: "amor", titre: AMOR_AMOUR.titre, morceau: AMOR_AMOUR.id }],
    musique: [{ id: "m1", morceau: AMOR_AMOUR.id, debut: 0, fin: AMOR_AMOUR.duree, position: 0, fondus: { sortie: 1.5 } }],
    plans,
  };
}
