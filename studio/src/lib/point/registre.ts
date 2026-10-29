/**
 * Un bloc → un Point → un menu radial contextuel.
 * Chaque type de bloc (broderie, photo, carte, PDF, site…) déclare ses commandes dans ce registre ;
 * le Point du bloc n'affiche que celles-là, avec Confort toujours en premier (apporté par le Point lui-même).
 * Le registre ne connaît aucun métier : il range des fonctions qui, à partir du contexte d'un bloc, rendent des ModePoint.
 */
import type { ModePoint } from "./modes";

export interface TypeBloc<C> {
  /** l'identifiant du type (« broderie », « photo »…) */
  id: string;
  /** le nom lu et affiché (« Broderie ») */
  nom: string;
  /** les commandes du bloc, dans l'ordre où elles comptent ; sans Confort, que le Point ajoute toujours */
  commandes: (contexte: C) => ModePoint[];
}

const types = new Map<string, TypeBloc<never>>();

export function enregistrerTypeBloc<C>(t: TypeBloc<C>): void {
  if (types.has(t.id)) throw new Error(`Type de bloc déjà enregistré : ${t.id}`);
  types.set(t.id, t as unknown as TypeBloc<never>);
}
export function typeBloc(id: string) { return types.get(id) ?? null; }
export function typesEnregistres() { return [...types.keys()]; }

/** Les commandes d'un bloc : celles de son type, contrôlées (pas de Confort en double, pas d'identifiant répété). */
export function commandesDuBloc<C>(id: string, contexte: C): ModePoint[] {
  const t = types.get(id) as unknown as TypeBloc<C> | undefined;
  if (!t) return [];
  const liste = t.commandes(contexte);
  const vus = new Set<string>();
  for (const m of liste) {
    if (m.groupe === "acces" || m.id === "confort") throw new Error("Confort est apporté par le Point : un type de bloc ne le déclare pas.");
    if (vus.has(m.id)) throw new Error(`Commande en double dans ${id} : ${m.id}`);
    vus.add(m.id);
  }
  return liste;
}

/** Pour les tests : repartir d'un registre vide. */
export function viderRegistre() { types.clear(); }

/* ——— Essai : l'outil sur le bloc au lieu du dock du bas ——— */
export const ESSAI_BLOC_CLE = "pointzero:essai:outils-sur-le-bloc";
export function lireEssaiBloc(): boolean { try { return localStorage.getItem(ESSAI_BLOC_CLE) === "1"; } catch { return false; } }
export function ecrireEssaiBloc(v: boolean) { try { if (v) localStorage.setItem(ESSAI_BLOC_CLE, "1"); else localStorage.removeItem(ESSAI_BLOC_CLE); } catch { /* l'appareil refuse : l'essai vaut pour cette visite */ } }

/**
 * Où poser le Point d'un bloc : au milieu de son bord droit, juste dehors ; s'il n'y a pas la place (téléphone),
 * sous le bloc, à son coin droit ; toujours entièrement dans l'écran, jamais sous la barre du haut ni sous le bas de l'écran.
 */
export function placePointDuBloc(b: { x: number; y: number; w: number; h: number }, ecran: { w: number; h: number }, haut = 72, taille = 46, marge = 10) {
  const clamp = (v: number, a: number, z: number) => Math.max(a, Math.min(z, v));
  const droite = b.x + b.w + marge;
  if (droite + taille + marge <= ecran.w) return { left: droite, top: clamp(b.y + b.h / 2 - taille / 2, haut, ecran.h - taille - marge), bord: "droite" as const };
  /* dessous, aligné sur le coin droit : le centre du bloc reste libre pour son contenu (l'accueil, un aperçu) */
  return { left: clamp(b.x + b.w - taille, marge, ecran.w - taille - marge), top: clamp(b.y + b.h + marge, haut, ecran.h - taille - marge), bord: "dessous" as const };
}
