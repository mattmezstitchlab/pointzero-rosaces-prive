/**
 * Le disque unique (Cadre-Tambour V2) : sa géométrie, calculée depuis un seul centre.
 * Trois zones : A, la toile (rayon r) ; B, le bois du tambour (de r à rb) ; C, la couronne des commandes (de ri à Ro).
 * Chaque commande est une enveloppe fixe (le rond, son mot sur une ou deux lignes, son point, et la marge du focus) :
 * le rayon de ses centres est choisi pour que l'enveloppe entière reste dans la couronne, quel que soit son angle,
 * et le nombre de commandes par anneau pour qu'aucune n'en touche une autre. Mathématiques pures : testées sans navigateur.
 */
export interface Enveloppe { l: number; h: number; rond: number; lignes: number }
export interface Disque {
  cx: number; cy: number;
  /** A : la toile ; B : le bois (jusqu'à rb) ; C : la couronne, de ri à Ro ; les centres des commandes à rho */
  r: number; rb: number; ri: number; rho: number; Ro: number;
  env: Enveloppe; marge: number; compact: boolean;
  /** les mots : sous chaque commande, ou (place trop juste) dans un cartouche sous le disque, pour la commande visée */
  etiquettes: "dessous" | "cartouche";
  /** combien de commandes tiennent sur un anneau sans se toucher */
  capacite: number;
}

const BOIS = 12, JEU = 2;

/** L'angle de la i-ème commande sur n (la première en haut, puis dans le sens des aiguilles) : celui du Point. */
export const angleCommande = (i: number, n: number) => ((360 / n) * i - 90) * Math.PI / 180;

/** La plus petite et la plus grande distance au centre d'une enveloppe centrée en (x, y). */
export function distances(x: number, y: number, e: Enveloppe, marge: number) {
  const hw = e.l / 2 + marge, hh = e.h / 2 + marge;
  const dx = Math.max(Math.abs(x) - hw, 0), dy = Math.max(Math.abs(y) - hh, 0);
  return { min: Math.hypot(dx, dy), max: Math.hypot(Math.abs(x) + hw, Math.abs(y) + hh) };
}

/** Les enveloppes de n commandes posées à rho : se touchent-elles ? */
export function chevauchent(rho: number, n: number, e: Enveloppe, ecart: number): boolean {
  const pts = Array.from({ length: n }, (_, i) => ({ x: rho * Math.cos(angleCommande(i, n)), y: rho * Math.sin(angleCommande(i, n)) }));
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.abs(pts[i].x - pts[j].x) < e.l + ecart && Math.abs(pts[i].y - pts[j].y) < e.h + ecart) return true;
  }
  return false;
}

/* sur tous les angles possibles (un niveau peut compter 3 comme 16 commandes) : échantillonné finement */
const ANGLES = Array.from({ length: 144 }, (_, k) => (k / 144) * 2 * Math.PI);
function rhoMinimal(ri: number, e: Enveloppe, marge: number) {
  let bas = ri, haut = ri + e.l + e.h + 2 * marge;
  for (let k = 0; k < 40; k++) { const m = (bas + haut) / 2; if (ANGLES.every(a => distances(m * Math.cos(a), m * Math.sin(a), e, marge).min >= ri)) haut = m; else bas = m; }
  return haut;
}
function rayonExterieur(rho: number, e: Enveloppe, marge: number) {
  return Math.max(...ANGLES.map(a => distances(rho * Math.cos(a), rho * Math.sin(a), e, marge).max));
}

/** L'enveloppe d'une commande : le rond, ses deux lignes de mot et son point ; elle grandit avec la taille du texte (Confort).
    En cartouche, le rond seul (44 px, la cible tactile visée) : le mot est montré sous le disque et toujours dit. */
export function enveloppe(etiquettes: "dessous" | "cartouche", texte = 1): Enveloppe {
  if (etiquettes === "cartouche") return { rond: 44, lignes: 0, l: 44, h: 44 };
  const t = Math.max(1, Math.min(2, texte));
  return { rond: 50, lignes: 2, l: Math.round(86 * Math.min(t, 1.45)), h: Math.round(50 + 4 + 2 * 14 * t + 9) };
}
/** au-dessous de ce rayon de toile, on ne travaille plus confortablement : on passe les mots en cartouche */
export const TOILE_MIN = 130;

/**
 * Le disque pour une place donnée (l × h, sous le dock du haut) : le plus grand tambour possible
 * dont la couronne, avec toutes ses commandes, tient entièrement dans la place.
 */
export function geometrieDisque(l: number, h: number, haut: number, { texte = 1, bas = 12, cote = 8, replie = false } = {}): Disque {
  const compact = l < 600 || h - haut < 560, marge = 6;
  const cx = l / 2, cy = haut + (h - haut - bas) / 2, Rmax = Math.min(l / 2 - cote, (h - haut - bas) / 2);
  const essai = (etiquettes: "dessous" | "cartouche") => {
    const env = enveloppe(etiquettes, texte);
    const pour = (r: number) => { const rb = r + BOIS, ri = rb + JEU, rho = rhoMinimal(ri, env, marge), Ro = rayonExterieur(rho, env, marge); return { r, rb, ri, rho, Ro }; };
    let a = 30, b = Math.max(30, Rmax);
    for (let k = 0; k < 40; k++) { const m = (a + b) / 2; if (pour(m).Ro <= Rmax) a = m; else b = m; }
    const g = pour(Math.floor(a));
    let capacite = 16; while (capacite > 3 && chevauchent(g.rho, capacite, env, 4)) capacite--;
    return { cx, cy, ...g, env, marge, compact, capacite, etiquettes };
  };
  /* couronne repliée (essai de rétraction légère) : la toile prend toute la place, le bois au bord */
  if (replie) { const r = Math.floor(Rmax - BOIS - 4); return { ...essai("cartouche"), r, rb: r + BOIS, ri: r + BOIS + JEU, rho: r + BOIS + JEU, Ro: r + BOIS + JEU }; }
  const d = essai("dessous");
  return d.r >= TOILE_MIN ? d : essai("cartouche");
}
