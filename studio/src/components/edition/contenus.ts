/**
 * Les contenus éditoriaux de l'édition (la landing sous le héros) : textes, images, légendes, crédits, sources.
 * Phase 1 du Bureau éditorial : ils sortent du code, sans rien changer à l'écran.
 *
 * - ORIGINE est le texte actuel. Il sert de secours : un champ absent ou invalide d'une version publiée retombe toujours dessus.
 * - ORIGINE est aussi le schéma : une version publiée ne peut ni ajouter un champ, ni changer la forme d'un champ,
 *   ni la longueur d'une liste. Seuls des textes, des adresses d'images vérifiées et des drapeaux sont acceptés ; jamais de code.
 * - Les paramètres des moteurs (colonnes de la broderie, seuils du défilement, recette 5D) ne sont pas ici : ils restent dans le code.
 *
 * Mise en forme permise dans les textes : *italique*. Dans un titre, « & » est dessiné en italique à empattements.
 * Gabarits : {reponse} dans les réactions de l'Orbe, {n} dans les phrases qui comptent.
 */
import { createContext, useContext } from "react";

export type Licence = "domaine-public" | "reconstitution" | "capture" | "autorise";
export interface Media {
  /** chemin sous le site (images/…) ou adresse https du stockage de médias */
  src: string;
  alt: string;
  legende: string;
  licence: Licence;
  /** une image générée ou recomposée : la légende doit le dire */
  reconstitution: boolean;
  /** provenance (musée, numéro d'inventaire, page) ; vide si sans objet */
  provenance: string;
}
export interface TexteScene { kicker: string; titre: string; sous: string; corps: string }

export const ORIGINE = {
  histoire: {
    origine: {
      kicker: "01 · L’origine", titre: "Garance & indigo", sous: "Des couleurs qui traversent les siècles.",
      corps: "Avant les fils, il y eut des plantes, des voyages et des mains expertes : la racine de garance pour le rouge, les feuilles d’indigotier pour le bleu.",
      geste: "Passez la souris, le doigt, ou Tab puis les flèches : la loupe voit à travers la broderie, jusqu’à la grille et aux symboles.",
      media: { src: "images/histoire/reconstitution-pigments.webp", licence: "reconstitution", reconstitution: true, provenance: "",
        alt: "Reconstitution : poudres de garance et d’indigo, racines, feuilles et une étoffe imprimée, rendues en broderie",
        legende: "Reconstitution générée (pigments, racines, étoffe), rendue en broderie par la conversion du studio. Pas une photographie d’époque." } as Media,
    },
    indiennes: {
      kicker: "02 · Les indiennes", titre: "Indiennes", sous: "Des étoffes venues d’Inde, un savoir-faire inégalé.",
      corps: "Peintes et imprimées sur coton, fixées par des mordants, elles portaient des rouges et des bleus qui résistaient au temps. L’Europe s’en éprend ; la France en interdit l’importation et la fabrication de 1686 à 1759.",
      rouge: {
        nom: "Garance", texte: "La racine de Rubia tinctorum. Un rouge qu’un mordant fixe sur le coton.",
        media: { src: "images/histoire/met-palampore-2010-337.webp", licence: "domaine-public", reconstitution: false, provenance: "The Metropolitan Museum of Art, 2010.337",
          alt: "Palampore de la côte de Coromandel : un grand arbre fleuri, rouges de garance et bleus, rendu en broderie",
          legende: "Palampore, côte de Coromandel (Inde), pour le marché sri-lankais, premier quart du XVIIIᵉ siècle. The Metropolitan Museum of Art, 2010.337, domaine public. Rendu en broderie par le studio." } as Media,
      },
      bleu: {
        nom: "Indigo", texte: "Les feuilles de l’indigotier. Un bleu profond, posé autour de réserves qui protègent le fond.",
        media: { src: "images/histoire/met-reserve-bleue-40-128.webp", licence: "domaine-public", reconstitution: false, provenance: "The Metropolitan Museum of Art, 40.128",
          alt: "Panneau à réserve bleue : oiseaux et feuillages en bleus d’indigo, rendu en broderie",
          legende: "Panneau de rideau à réserve bleue, vers 1725–1775. The Met, 40.128, domaine public. Rendu en broderie par le studio." } as Media,
      },
    },
    mulhouse: {
      kicker: "03 · Mulhouse, 1746", titre: "Mulhouse", sous: "Une manufacture, un nouveau chapitre.",
      corps: "En 1746, Samuel Koechlin, Jean-Jacques Schmaltzer, Jean-Henri Dollfus et Jean-Jacques Feer lancent l’impression de cotonnades à la planche. La ville n’est pas encore française : une république alliée aux cantons suisses, qui rejoint la France en 1798. De la lignée Dollfus naîtra Dollfus-Mieg et Compagnie : DMC.",
      aparte: ["1746", "Mulhouse"],
      media: { src: "images/histoire/reconstitution-atelier.webp", licence: "reconstitution", reconstitution: true, provenance: "",
        alt: "Reconstitution : un artisan imprime une étoffe à la planche de bois, rendue en broderie",
        legende: "Reconstitution générée d’un atelier d’impression à la planche, rendue en broderie. Pas un document d’époque." } as Media,
    },
    brodeuses: {
      kicker: "04 · Les brodeuses", titre: "Brodeuses", sous: "Des gestes transmis de génération en génération.",
      corps: "Elles ont fait vivre ces motifs, les ont adaptés, enseignés, enrichis. En 1884, Thérèse de Dillmont commence à travailler avec DMC ; en 1886 paraît son *Encyclopédie des ouvrages de dames*, qui diffuse les points bien au-delà de l’Alsace.",
      media: { src: "images/histoire/reconstitution-ouvrages.webp", licence: "reconstitution", reconstitution: true, provenance: "",
        alt: "Reconstitution : des ouvrages anciens ouverts sur des motifs brodés, des écheveaux et des ciseaux, rendus en broderie",
        legende: "Reconstitution générée (ouvrages, écheveaux), rendue en broderie. Couvertures et étiquettes imaginées." } as Media,
    },
    sources: {
      titre: "Sources de cette séquence",
      liens: [
        { libelle: "Palampore, 2010.337 — The Met", url: "https://www.metmuseum.org/art/collection/search/75909" },
        { libelle: "Curtain panel, blue-resist textile, 40.128 — The Met", url: "https://www.metmuseum.org/art/collection/search/13797" },
        { libelle: "Indienne — Wikipédia (mordants, garance, indigo ; interdiction 1686–1759)", url: "https://en.wikipedia.org/wiki/Indienne" },
        { libelle: "Mulhouse — Encyclopædia Universalis (1746, alliance suisse, réunion de 1798)", url: "https://www.universalis.fr/encyclopedie/mulhouse/" },
        { libelle: "Thérèse de Dillmont — Wikipédia (DMC dès 1884, Encyclopédie, 1886)", url: "https://en.wikipedia.org/wiki/Th%C3%A9r%C3%A8se_de_Dillmont" },
      ],
    },
  },
  /* les cinq rencontres avec l'Orbe, dans l'ordre des dimensions du moteur (l'ordre et les clés restent dans le code) */
  rencontres: {
    structure: { titre: "La forme", question: "Ces étoffes répètent leurs motifs, encore et encore. Et vous, quelle forme aimeriez-vous donner à votre création ?", reaction: "{reponse} : votre création existe déjà. Elle vous suivra pendant toute la visite." },
    trace: { titre: "Les lignes", question: "À Mulhouse, on gravait les motifs dans le bois, ligne après ligne. Quelles lignes pour la vôtre ?", reaction: "{reponse} : les lignes sont posées." },
    echelle: { titre: "La finesse", question: "Les brodeuses choisissaient la finesse de leurs points. Grands aplats ou dentelle ?", reaction: "{reponse} : votre motif a trouvé sa finesse." },
    palette: { titre: "Les couleurs", question: "Certaines couleurs traversent les siècles. Et vous, quelles couleurs aimeriez-vous retrouver dans votre création ?", reaction: "{reponse} : voilà, votre création vient de prendre ses couleurs." },
    densite: { titre: "Le plein", question: "Dernier geste : laisser respirer la toile, ou la remplir ?", reaction: "{reponse} : votre rosace est complète. Elle vous attend, un peu plus bas." },
  },
  fils: {
    kicker: "05 · Aujourd’hui", titre: "489 fils, un seul geste.",
    chapeau: "Le même amour des couleurs, maintenant dans vos mains : explorez les fils du nuancier, famille par famille.",
    etapes: ["Les fils apparaissent autour du centre", "Une famille de couleurs", "Ses nuances, du clair au foncé", "Un numéro DMC"],
  },
  rosace: {
    kicker: "06 · Créez maintenant", titreAvant: "Et si c’était votre rosace ?", titreApres: "Votre rosace naît.",
    legende: "Motif réel du moteur 5D, rendu à l’écran (simulation de broderie).",
  },
  cadeau: {
    kicker: "07 · Le cadeau",
    titreFini: "Cette rosace est la vôtre.",
    orbeFini: "Vous venez de créer votre première rosace POINT ZÉRO. Nous vous l’offrons.",
    texteFini: "Vous pouvez la modifier, changer ses couleurs, la broder… ou simplement la conserver comme une création artistique.",
    titreEnCours: "Votre rosace vous attend.", orbeEnCours: "Il reste {n} choix. Vous pouvez les faire, ou me laisser choisir pour vous.", boutonReste: "Choisir pour moi les {n} restants",
    titreVide: "Et si nous imaginions la vôtre ?", orbeVide: "Ces motifs ont traversé les siècles. Cinq choix suffisent pour créer le vôtre.", boutonVide: "Choisir pour moi",
    usages: [
      { titre: "Une œuvre à regarder", texte: "Vous ne brodez pas ? Ce n’est pas grave. Une rosace peut aussi être une œuvre à regarder, à partager, bientôt à exposer à la Galerie des Vivants." },
      { titre: "Un ouvrage à broder", texte: "Le jour où vous le souhaitez : son patron, ses fils DMC, ses symboles, le suivi de vos points." },
    ],
    note: "Ouverte dans l’atelier, votre rosace rejoint Mes ouvrages, enregistrée dans ce navigateur, sur cet appareil, sans compte. Elle peut disparaître en navigation privée, si les données du navigateur sont effacées, ou sur un autre appareil : pour la garder à coup sûr, téléchargez son projet (Exporter). Rien n’est publié sans votre accord.",
  },
  appareils: {
    ipad: { src: "images/ecrans/atelier-ipad-patron.webp", licence: "capture", reconstitution: false, provenance: "Capture de l’atelier Point Zéro",
      alt: "L’atelier Point Zéro sur iPad : une rosace en lecture Patron, symboles et grille", legende: "" } as Media,
    ordinateur: { src: "images/ecrans/atelier-ordinateur.webp", licence: "capture", reconstitution: false, provenance: "Capture de l’atelier Point Zéro",
      alt: "L’atelier Point Zéro sur ordinateur : la rosace offerte dans son cadre, les docks de l’atelier", legende: "" } as Media,
    iphone: { src: "images/ecrans/atelier-iphone-fils.webp", licence: "capture", reconstitution: false, provenance: "Capture de l’atelier Point Zéro",
      alt: "L’atelier sur iPhone : le Point du bloc ouvert sur les nuances DMC", legende: "" } as Media,
    legende: "L’atelier, sur ordinateur, tablette et téléphone. Captures de l’atelier actuel.",
  },
};
export type Contenus = typeof ORIGINE;

/* ——— Validation : la version publiée est fondue sur ORIGINE, champ par champ ——— */
export const LIMITES = { titre: 140, court: 400, long: 1600 } as const;
const LICENCES: Licence[] = ["domaine-public", "reconstitution", "capture", "autorise"];
/** une adresse d'image acceptée : un fichier du site (images/…), ou le stockage de médias Vercel Blob en https */
export function srcOk(v: string) {
  return /^images\/[a-z0-9][a-z0-9/_-]*\.(webp|png|jpe?g|avif)$/i.test(v) && !v.includes("..")
    || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w./%-]+$/i.test(v) && !v.includes("..");
}
export const urlOk = (v: string) => { try { const u = new URL(v); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; } };
const limite = (cle: string) => /titre|kicker|nom|libelle|bouton/i.test(cle) ? LIMITES.titre : /corps|note|texte|legende|question|chapeau/i.test(cle) ? LIMITES.long : LIMITES.court;
/* du texte, pas du balisage : aucun chevron, aucun caractère de contrôle */
const texteOk = (v: string, cle: string) => v.trim().length > 0 && v.length <= limite(cle) && !/[<>\u0000-\u0008\u000b-\u001f\u007f]/.test(v);

export interface Ecart { chemin: string; raison: string }

function fondre(origine: unknown, brut: unknown, chemin: string, ecarts: Ecart[]): unknown {
  if (brut === undefined) return origine;
  const ecart = (raison: string) => { ecarts.push({ chemin, raison }); return origine; };
  if (typeof origine === "string") {
    if (typeof brut !== "string") return ecart("un texte est attendu");
    const cle = chemin.split(".").pop() ?? "";
    if (cle === "src") return srcOk(brut) ? brut : ecart("adresse d’image refusée");
    if (cle === "url") return urlOk(brut) ? brut : ecart("lien https attendu");
    if (cle === "licence") return (LICENCES as string[]).includes(brut) ? brut : ecart("licence inconnue");
    if (cle === "legende" && brut === "" && origine === "") return brut;
    if (cle === "provenance" && brut === "") return brut;
    if (!texteOk(brut, cle)) return ecart("texte vide, trop long ou contenant du balisage");
    if (origine.includes("{reponse}") && !brut.includes("{reponse}")) return ecart("le gabarit {reponse} doit rester");
    if (origine.includes("{n}") && !brut.includes("{n}")) return ecart("le gabarit {n} doit rester");
    return brut;
  }
  if (typeof origine === "boolean") return typeof brut === "boolean" ? brut : ecart("oui ou non attendu");
  if (Array.isArray(origine)) {
    if (!Array.isArray(brut) || brut.length !== origine.length) return ecart(`une liste de ${origine.length} éléments est attendue`);
    return origine.map((o, i) => fondre(o, brut[i], `${chemin}[${i}]`, ecarts));
  }
  if (origine && typeof origine === "object") {
    if (!brut || typeof brut !== "object" || Array.isArray(brut)) return ecart("un groupe de champs est attendu");
    const b = brut as Record<string, unknown>, o = origine as Record<string, unknown>;
    for (const k of Object.keys(b)) if (!(k in o)) ecarts.push({ chemin: chemin ? `${chemin}.${k}` : k, raison: "champ inconnu, ignoré" });
    const sortie: Record<string, unknown> = {};
    for (const k of Object.keys(o)) sortie[k] = fondre(o[k], b[k], chemin ? `${chemin}.${k}` : k, ecarts);
    /* un média : une reconstitution le dit dans sa légende ; un média qui change d'image doit déclarer sa licence et sa nature */
    if ("src" in o && "reconstitution" in o) {
      const m = sortie as unknown as Media, om = o as unknown as Media;
      if (m.reconstitution && m.legende && !/reconstitution/i.test(m.legende)) { ecarts.push({ chemin, raison: "une reconstitution doit être annoncée dans la légende" }); return origine; }
      if (m.licence === "reconstitution" && !m.reconstitution) { ecarts.push({ chemin, raison: "licence « reconstitution » sans le drapeau reconstitution" }); return origine; }
      if (m.src !== om.src && (b.licence === undefined || b.reconstitution === undefined)) { ecarts.push({ chemin, raison: "nouvelle image : licence et nature (reconstitution ou non) à déclarer" }); return origine; }
    }
    return sortie;
  }
  return origine;
}

/** Fond une version publiée sur ORIGINE : tout champ absent ou invalide garde le texte d'origine ; les écarts sont listés. */
export function validerContenus(brut: unknown): { contenus: Contenus; ecarts: Ecart[] } {
  const ecarts: Ecart[] = [];
  const contenus = fondre(ORIGINE, brut ?? {}, "", ecarts) as Contenus;
  return { contenus, ecarts };
}

/** L'adresse servie d'un média : un fichier du site est servi sous la base du studio. */
export const adresse = (src: string) => /^https:/.test(src) ? src : import.meta.env.BASE_URL + src;
/** Un gabarit : {reponse}, {n}. */
export const remplir = (gabarit: string, valeurs: Record<string, string | number>) => gabarit.replace(/\{(\w+)\}/g, (m, k) => k in valeurs ? String(valeurs[k]) : m);

/* Le contexte : la partie publique ne lira que la version publiée (phase 2) ; sans elle, l'origine. */
export const ContexteContenus = createContext<Contenus>(ORIGINE);
export const useContenus = () => useContext(ContexteContenus);
