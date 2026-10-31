/**
 * Le rythme d'« Amor amour 2 », lu dans le WAV (donnees/amor-amour.rythme.json : les temps, la force du grave et de l'attaque
 * sur chaque temps, les accents, l'énergie dix fois par seconde). L'image le lit au temps exact du film : les effets restent
 * synchronisés même son coupé, et identiques d'une lecture à l'autre (rendu image par image compris). Rien n'est tiré au hasard.
 *
 *  - la VITESSE : une vitesse de croisière, l'énergie du morceau, et un coup d'accélérateur sur CHAQUE temps (plus fort avec le grave
 *    ou l'attaque), qui retombe en 0,2 s ;
 *  - la FUITE : la distance parcourue (l'intégrale de la vitesse), qui fait avancer les traînées d'étoiles ;
 *  - les ONDES : sur chaque accent, un anneau nacré part du centre (son âge, sa force).
 * Pendant la séquence validée de l'impact (l'eau → la Terre, 02:00.440 → 02:20.440), aucun effet : elle reste telle quelle.
 */
import donnees from "./donnees/amor-amour.rythme.json";

interface Donnees { duree: number; temps: number[]; forceTemps: number[]; attaqueTemps: number[]; accents: [number, number][]; energieHz: number; energie: number[] }
export interface EtatRythme { vitesse: number; fuite: number; ondes: [number, number][] }

const D = donnees as unknown as Donnees;
const ACCENTS_T = D.accents.map(a => a[0]);
const PAS = 1 / 30;
/** la séquence validée de l'impact, sans effet (avec un fondu de 2,5 s de chaque côté) */
const CALME: [number, number] = [120.44, 140.44], FONDU = 2.5;

const lisse = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/** l'indice du dernier temps ≤ t (recherche dichotomique) */
function dernier(liste: number[], t: number) { let a = 0, b = liste.length - 1, r = -1; while (a <= b) { const m = (a + b) >> 1; if (liste[m] <= t) { r = m; a = m + 1; } else b = m - 1; } return r; }

export function masque(t: number) {
  return Math.min(1 - lisse(CALME[0] - FONDU, CALME[0], t) + lisse(CALME[1], CALME[1] + FONDU, t), 1) * (1 - lisse(D.duree - 3, D.duree - .5, t)) * lisse(0, 2, t);
}
function energie(t: number) { const x = t * D.energieHz, i = Math.floor(x), f = x - i; const e = D.energie; return ((e[Math.min(i, e.length - 1)] ?? 0) * (1 - f) + (e[Math.min(i + 1, e.length - 1)] ?? 0) * f) / 99; }
function impulsion(t: number) {
  let p = 0; const i = dernier(D.temps, t);
  for (let k = Math.max(0, i - 2); k <= i; k++) { const age = t - D.temps[k]; p += (.55 + .45 * Math.max(D.forceTemps[k], D.attaqueTemps[k]) / 99) * Math.exp(-age * 5.5); }   /* chaque temps pousse ; le grave et l'attaque poussent plus fort */
  return p;
}
/** la vitesse « brute » (sans masque) : un fond qui suit l'énergie, et un coup d'accélérateur sur chaque temps */
const vitesseBrute = (t: number) => Math.min(1.4, .25 + .25 * energie(t) + .8 * impulsion(t));   /* une vitesse de croisière, l'énergie, et le coup de chaque temps */

/* la fuite : l'intégrale de la vitesse, tabulée une fois (30 images/s) — la même à chaque lecture */
const FUITE: number[] = [0];
for (let t = PAS; t <= D.duree + PAS; t += PAS) FUITE.push(FUITE[FUITE.length - 1] + (.35 + 1.6 * vitesseBrute(t) * masque(t)) * PAS);

/** l'état du rythme au temps t du film (en secondes d'« Amor amour 2 ») */
export function rythmeA(t: number): EtatRythme {
  const m = masque(t);
  const x = Math.max(0, t) / PAS, i = Math.min(FUITE.length - 2, Math.floor(x)), f = x - i;
  const ondes: [number, number][] = [];
  for (let k = dernier(ACCENTS_T, t); k >= 0 && ondes.length < 6; k--) {
    const [ta, force] = D.accents[k], age = t - ta; if (age > 3.5) break;
    ondes.push([age, force / 99 * m]);
  }
  return { vitesse: vitesseBrute(t) * m, fuite: FUITE[i] * (1 - f) + FUITE[i + 1] * f, ondes };
}
export const RYTHME_AMOR = { morceau: "amor-amour", a: rythmeA, temps: D.temps, accents: D.accents, duree: D.duree };
