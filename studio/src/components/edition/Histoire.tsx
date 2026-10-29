/**
 * La séquence historique, en ouverture de l'édition : des indiennes et des teintures anciennes jusqu'au fil DMC.
 * Tout est rendu en broderie par la conversion du studio, et une loupe voit à travers : la grille, les symboles, le fil.
 * Deux étoffes sont de vraies pièces de musée (The Met, domaine public) ; les autres images sont des reconstitutions générées,
 * annoncées comme telles. Les faits sont sourcés en bas de la séquence.
 */
import { useState, type ReactNode } from "react";
import { BookOpen, Compass, FileText, FileUp, Folder, Image as ImageIcon, Palette, PenLine, Search, Sparkles, FileJson } from "lucide-react";
import type { ModePoint } from "../../lib/point/modes";
import { FLOSS } from "../../lib/dmc";
import Brode, { type Broderie } from "./Brode";

const IMG = import.meta.env.BASE_URL + "images/histoire/";
export const CHAPITRES_HISTOIRE = [
  { id: "hi-origine", num: "01", titre: "L’origine" },
  { id: "hi-indiennes", num: "02", titre: "Les indiennes" },
  { id: "hi-mulhouse", num: "03", titre: "Mulhouse, 1746" },
  { id: "hi-brodeuses", num: "04", titre: "Les brodeuses" },
] as const;

export interface ActionsHistoire {
  ouvrir: (entree: "create" | "library" | "stitch") => void;
  visite: () => void;
  choisirFichier: (accept: string) => void;
  aller: (id: string) => void;
}

/* le fil le plus présent d'une teinte (rouge, bleu) dans une broderie : dit honnêtement « proche, à l'écran » */
function dominant(b: Broderie, teinte: "rouge" | "bleu") {
  const ok = (hex: string) => { const n = parseInt(hex.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, bl = n & 255;
    return teinte === "rouge" ? r > g + 40 && r > bl + 30 : bl > r + 25 && bl >= g; };
  return b.palette.find(f => ok(FLOSS[f].hex)) ?? null;
}
function Fil({ idx, nom, texte }: { idx: number | null; nom: string; texte: ReactNode }) {
  const f = idx === null ? null : FLOSS[idx];
  return <div className="hi-fil">
    <span className="hi-fil-pastille" style={{ background: f?.hex ?? "#ccc" }} aria-hidden="true" />
    <div><p className="hi-fil-nom">{nom}</p><p className="hi-fil-texte">{texte}</p>
      {f && <p className="hi-fil-dmc">À l’écran, proche de <b>DMC {f.code}</b> ({f.name}) — indicatif</p>}</div>
  </div>;
}

export default function Histoire({ actions, Disque }: { actions: ActionsHistoire; Disque: (p: { contexte: string; modes: ModePoint[]; etiquette: string; max?: number }) => ReactNode }) {
  const [loupe, setLoupe] = useState(0);
  const [rouge, setRouge] = useState<number | null>(null), [bleu, setBleu] = useState<number | null>(null);
  const modes: ModePoint[] = [
    { id: "histoire", nom: "Histoire", icone: <BookOpen aria-hidden="true" />, aide: "les indiennes, Mulhouse, les brodeuses", groupe: "socle", ouvrir: () => {}, enfants: () => [
      { id: "hi-2", nom: "Les indiennes", icone: <BookOpen aria-hidden="true" />, aide: "des étoffes venues d’Inde", groupe: "socle", ouvrir: () => actions.aller("hi-indiennes") },
      { id: "hi-3", nom: "Mulhouse, 1746", icone: <BookOpen aria-hidden="true" />, aide: "une manufacture, un nouveau chapitre", groupe: "socle", ouvrir: () => actions.aller("hi-mulhouse") },
      { id: "hi-4", nom: "Les brodeuses", icone: <BookOpen aria-hidden="true" />, aide: "des gestes transmis", groupe: "socle", ouvrir: () => actions.aller("hi-brodeuses") },
    ] },
    { id: "loupe", nom: "Loupe", icone: <Search aria-hidden="true" />, aide: "voir à travers la broderie : la grille, les symboles, le fil", groupe: "socle", ouvrir: () => setLoupe(n => n + 1) },
    { id: "nuancier", nom: "Nuancier", icone: <Palette aria-hidden="true" />, aide: "les 489 fils DMC, plus bas", groupe: "metier", ouvrir: () => actions.aller("ed-fils") },
    { id: "creer", nom: "Créer", icone: <PenLine aria-hidden="true" />, aide: "un nouveau motif, une rosace, une image", groupe: "metier", ouvrir: () => {}, enfants: () => [
      { id: "creer-motif", nom: "Nouveau motif", icone: <PenLine aria-hidden="true" />, aide: "ouvrir l’atelier sur une grille vierge", groupe: "metier", ouvrir: () => actions.ouvrir("create") },
      { id: "creer-rosace", nom: "Une rosace", icone: <Sparkles aria-hidden="true" />, aide: "le compositeur, plus bas", groupe: "metier", ouvrir: () => actions.aller("ed-rosace") },
      { id: "creer-image", nom: "Depuis une image", icone: <ImageIcon aria-hidden="true" />, aide: "une photo convertie en fils DMC", groupe: "metier", ouvrir: () => actions.choisirFichier("image/png,image/jpeg,image/webp") },
    ] },
    { id: "importer", nom: "Importer", icone: <FileUp aria-hidden="true" />, aide: "une image, un patron PDF, un projet", groupe: "creation", ouvrir: () => {}, enfants: () => [
      { id: "imp-image", nom: "Image", icone: <ImageIcon aria-hidden="true" />, aide: "PNG, JPEG, WebP", groupe: "creation", ouvrir: () => actions.choisirFichier("image/png,image/jpeg,image/webp") },
      { id: "imp-pdf", nom: "Patron PDF", icone: <FileText aria-hidden="true" />, aide: "un patron sur plusieurs pages, recomposé", groupe: "creation", ouvrir: () => actions.choisirFichier(".pdf,application/pdf") },
      { id: "imp-projet", nom: "Projet", icone: <FileJson aria-hidden="true" />, aide: "une sauvegarde JSON ou un fichier OXS", groupe: "creation", ouvrir: () => actions.choisirFichier(".json,.oxs,application/json") },
    ] },
    { id: "ouvrages", nom: "Mes ouvrages", icone: <Folder aria-hidden="true" />, aide: "les ouvrages rangés sur cet appareil", groupe: "creation", ouvrir: () => actions.ouvrir("library") },
    { id: "guide", nom: "Guide", icone: <Compass aria-hidden="true" />, aide: "la visite de l’atelier avec le Point", groupe: "socle", ouvrir: actions.visite },
  ];

  return <div className="hi">
    <section id="hi-origine" className="ed-scene hi-scene hi-sombre" aria-labelledby="hi-origine-titre">
      <div className="ed-plateau hi-plateau">
        <Brode src={IMG + "reconstitution-pigments.webp"} cols={84} maxFils={16} loupeDemandee={loupe}
          alt="Reconstitution : poudres de garance et d’indigo, racines, feuilles et une étoffe imprimée, rendues en broderie"
          legende="Reconstitution générée (pigments, racines, étoffe), rendue en broderie par la conversion du studio. Pas une photographie d’époque." />
        <div className="hi-texte">
          <p className="ed-num">01 · L’origine</p>
          <h2 id="hi-origine-titre" tabIndex={-1}>Des couleurs qui traversent les siècles.</h2>
          <p>Avant les fils, il y eut des plantes, des voyages et des mains expertes : la racine de garance pour le rouge, les feuilles d’indigotier pour le bleu.</p>
          <p className="hi-geste">Passez la souris, le doigt, ou Tab puis les flèches : la loupe voit à travers la broderie, jusqu’à la grille et aux symboles.</p>
        </div>
        <div className="hi-disque"><Disque contexte="edition-histoire" modes={modes} etiquette="Le Point de Point Zéro : l’histoire, la loupe, le nuancier, l’atelier" max={1} /></div>
        <p className="hi-aparte" aria-hidden="true">Rouge de garance<br />et bleu d’indigo.<br />Deux couleurs qui ont<br />changé le textile.</p>
      </div>
    </section>

    <section id="hi-indiennes" className="ed-scene hi-scene" aria-labelledby="hi-indiennes-titre">
      <div className="ed-plateau hi-plateau hi-avec-fiche">
        <Brode src={IMG + "met-palampore-2010-337.webp"} cols={96} maxFils={18} surFils={b => setRouge(dominant(b, "rouge"))}
          alt="Palampore de la côte de Coromandel : un grand arbre fleuri, rouges de garance et bleus, rendu en broderie"
          legende="Palampore, côte de Coromandel (Inde), pour le marché sri-lankais, premier quart du XVIIIᵉ siècle. The Metropolitan Museum of Art, 2010.337, domaine public. Rendu en broderie par le studio." />
        <div className="hi-texte">
          <p className="ed-num">02 · Les indiennes</p>
          <h2 id="hi-indiennes-titre" tabIndex={-1}>Des étoffes venues d’Inde, un savoir-faire inégalé.</h2>
          <p>Peintes et imprimées sur coton, fixées par des mordants, les indiennes portaient des rouges et des bleus qui résistaient au temps. L’Europe s’en éprend ; la France en interdit l’importation et la fabrication de 1686 à 1759, pour protéger la laine et la soie.</p>
        </div>
        <aside className="hi-fiche" aria-label="Les deux couleurs">
          <Fil idx={rouge} nom="Garance" texte="La racine de Rubia tinctorum. Un rouge qu’un mordant fixe sur le coton." />
          <div className="hi-fiche-mini">
            <Brode src={IMG + "met-reserve-bleue-40-128.webp"} cols={46} maxFils={8} surFils={b => setBleu(dominant(b, "bleu"))}
              alt="Panneau à réserve bleue : oiseaux et feuillages en bleus d’indigo, rendu en broderie"
              legende="Panneau de rideau à réserve bleue, vers 1725–1775. The Met, 40.128, domaine public." />
          </div>
          <Fil idx={bleu} nom="Indigo" texte="Les feuilles de l’indigotier. Un bleu profond, posé autour de réserves qui protègent le fond." />
        </aside>
      </div>
    </section>

    <section id="hi-mulhouse" className="ed-scene hi-scene hi-sombre" aria-labelledby="hi-mulhouse-titre">
      <div className="ed-plateau hi-plateau hi-avec-fiche">
        <Brode src={IMG + "reconstitution-atelier.webp"} cols={150} maxFils={16}
          alt="Reconstitution : un artisan imprime une étoffe à la planche de bois, rendue en broderie"
          legende="Reconstitution générée d’un atelier d’impression à la planche, rendue en broderie. Pas un document d’époque." />
        <div className="hi-texte">
          <p className="ed-num">03 · Mulhouse, 1746</p>
          <h2 id="hi-mulhouse-titre" tabIndex={-1}>Une manufacture, un nouveau chapitre.</h2>
          <p>En 1746, à Mulhouse, Samuel Koechlin, Jean-Jacques Schmaltzer, Jean-Henri Dollfus et Jean-Jacques Feer lancent l’impression de cotonnades à la planche. De la lignée Dollfus naîtra Dollfus-Mieg et Compagnie : DMC.</p>
        </div>
        <aside className="hi-fiche hi-fiche-texte">
          <p className="hi-fiche-titre">Mulhouse n’était pas encore française.</p>
          <p>Une république alliée aux cantons suisses, qui rejoint la France en 1798.</p>
          <p className="hi-fiche-date">1746 · Mulhouse</p>
        </aside>
      </div>
    </section>

    <section id="hi-brodeuses" className="ed-scene hi-scene" aria-labelledby="hi-brodeuses-titre">
      <div className="ed-plateau hi-plateau">
        <Brode src={IMG + "reconstitution-ouvrages.webp"} cols={120} maxFils={18}
          alt="Reconstitution : des ouvrages anciens ouverts sur des motifs brodés, des écheveaux et des ciseaux, rendus en broderie"
          legende="Reconstitution générée (ouvrages, écheveaux), rendue en broderie. Couvertures et étiquettes imaginées." />
        <div className="hi-texte">
          <p className="ed-num">04 · Les brodeuses</p>
          <h2 id="hi-brodeuses-titre" tabIndex={-1}>Des gestes transmis de génération en génération.</h2>
          <p>Les brodeuses ont fait vivre ces motifs, les ont adaptés, enseignés, enrichis. En 1884, Thérèse de Dillmont commence à travailler avec DMC ; en 1886 paraît son <i>Encyclopédie des ouvrages de dames</i>, qui diffuse les points bien au-delà de l’Alsace.</p>
        </div>
      </div>
    </section>

    <details className="hi-sources">
      <summary>Sources de cette séquence</summary>
      <ul>
        <li><a href="https://www.metmuseum.org/art/collection/search/75909" target="_blank" rel="noreferrer">Palampore, 2010.337 — The Met</a></li>
        <li><a href="https://www.metmuseum.org/art/collection/search/13797" target="_blank" rel="noreferrer">Curtain panel, blue-resist textile, 40.128 — The Met</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Indienne" target="_blank" rel="noreferrer">Indienne — Wikipédia (mordants, garance, indigo ; interdiction 1686–1759)</a></li>
        <li><a href="https://www.universalis.fr/encyclopedie/mulhouse/" target="_blank" rel="noreferrer">Mulhouse — Encyclopædia Universalis (1746, alliance suisse, réunion de 1798)</a></li>
        <li><a href="https://en.wikipedia.org/wiki/Th%C3%A9r%C3%A8se_de_Dillmont" target="_blank" rel="noreferrer">Thérèse de Dillmont — Wikipédia (DMC dès 1884, Encyclopédie, 1886)</a></li>
      </ul>
    </details>
  </div>;
}
