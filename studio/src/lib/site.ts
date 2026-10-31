/**
 * Le site Point Zéro (broderie seule) : la même base de code que le Studio AIME, construite avec VITE_SITE=broderie.
 * On n'y trouve que la broderie au point de croix : la landing en chapitres, l'atelier (Mes ouvrages, import PDF, export,
 * Rosaces 5D) et le Tambour vivant. Rien des autres concepts (.0NE, LUMIERE, ATLAS, Galerie, comptes AIME), et aucun appel
 * aux fonctions serveur d'AIME : le site est statique, tout reste sur l'appareil.
 */
export const SITE_BRODERIE = import.meta.env.VITE_SITE === "broderie";
