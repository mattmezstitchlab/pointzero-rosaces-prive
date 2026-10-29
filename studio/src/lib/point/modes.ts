/**
 * Le Point, contrôleur universel : le noyau.
 * Un seul Point, un anneau de modes. Le noyau ne sait rien de la broderie : chaque contexte déclare ses modes.
 * Primitives de la grammaire circulaire employées ici : Centre (le Point), Anneau (les modes), Secteur (un mode),
 * Repère radial (le haut : Confort, toujours), Marque (un mode actif), Onde (l'annonce d'un changement), Poignée (tirer le Point).
 */
export type GroupeMode = "acces" | "socle" | "metier" | "creation";

export interface ModePoint {
  id: string;
  /** le mot du secteur, court */
  nom: string;
  /** ce que le mode fait, une phrase : dite au lecteur d'écran avec le nom */
  aide: string;
  groupe: GroupeMode;
  /** le mode est en cours (loupe ouverte, réglage actif…) : une marque sur le secteur, et le mot « actif » */
  actif?: boolean;
  ouvrir: () => void;
}

const RANG: Record<GroupeMode, number> = { acces: 0, socle: 1, metier: 2, creation: 3 };
export const GROUPES: Record<GroupeMode, string> = { acces: "Réglage d’accès", socle: "Commun", metier: "Métier", creation: "Création" };

/**
 * L'ordre de l'anneau, dans le sens des aiguilles d'une montre depuis le haut :
 * le réglage d'accès d'abord (toujours à la même place), puis le socle, le métier, la création.
 * Dans un groupe, l'ordre de déclaration est gardé. Il faut exactement un mode d'accès.
 */
export function anneau(modes: ModePoint[]): ModePoint[] {
  const acces = modes.filter(m => m.groupe === "acces");
  if (acces.length !== 1) throw new Error("Le Point demande exactement un mode d’accès (Confort), toujours en premier.");
  const ids = new Set<string>();
  for (const m of modes) { if (ids.has(m.id)) throw new Error(`Mode en double : ${m.id}`); ids.add(m.id); }
  return modes.map((m, i) => ({ m, i })).sort((a, b) => RANG[a.m.groupe] - RANG[b.m.groupe] || a.i - b.i).map(x => x.m);
}

/** L'angle d'un secteur, en degrés, 0 = en haut, sens des aiguilles d'une montre. */
export const angleDe = (i: number, n: number) => (360 * i) / n;

/** La position du centre d'un secteur, dans un carré de côté `cote`, à `rayon` du centre. */
export function positionDe(i: number, n: number, rayon: number, cote: number) {
  const a = ((angleDe(i, n) - 90) * Math.PI) / 180;
  return { x: cote / 2 + rayon * Math.cos(a), y: cote / 2 + rayon * Math.sin(a) };
}

/** Tourner dans l'anneau : on boucle. */
export const tourner = (i: number, n: number, pas: number) => ((i + pas) % n + n) % n;

/**
 * La Poignée : le secteur vers lequel on a tiré le Point, ou null si le geste est trop court (c'est alors un simple clic).
 * dx, dy en pixels écran (y vers le bas).
 */
export function secteurVise(dx: number, dy: number, n: number, seuil = 28): number | null {
  if (Math.hypot(dx, dy) < seuil || n < 1) return null;
  const deg = (Math.atan2(dx, -dy) * 180) / Math.PI; // 0 en haut, sens horaire
  const part = 360 / n;
  return Math.round(((deg + 360) % 360) / part) % n;
}

/** Le nom accessible d'un secteur : son nom, « actif » s'il l'est, puis ce qu'il fait. */
export const nomAccessible = (m: ModePoint) => `${m.nom}${m.actif ? ", actif" : ""} : ${m.aide}`;
