import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import OuvragesBloc from "./OuvragesBloc";
import { ToolIcon } from "./ToolIcons";
import { ArrowLeft, CircleHelp, Compass, Folder, Grid3x3, LayoutGrid, Maximize, Menu, Palette, Pencil, Redo2, Search, Shapes, Share2, Sparkles, Spool, Square, Undo2, X } from "lucide-react";
import { GrilleOutils, GROUPES_BRODER, GROUPES_DESSIN, Loupe, Nuancier } from "./DockGrilles";
import type { Pattern } from "../lib/pattern";
import { FLOSS } from "../lib/dmc";
import { dansAime } from "../lib/aimeSync";
import PreferencesCompte from "./PreferencesCompte";
import type { Tool } from "../lib/stitch";
import type { ViewMode } from "./Canvas";
import { LEVEL_LABELS, type InterfaceLevel } from "../lib/interfaceLevel";
import { VISIBILITY, VISIBILITY_ORDER, type Visibility } from "../lib/visibility";
import VisibilityOrb from "./VisibilityOrb";
import Point, { ouvrirConfort } from "./point/Point";
import PointDuBloc from "./point/PointDuBloc";
import "./blocs/broderie";
import type { ContexteBroderie } from "./blocs/broderie";
import { ecrireEssaiBloc, lireEssaiBloc } from "../lib/point/registre";
import type { ModePoint } from "../lib/point/modes";

/**
 * Les deux docks du studio (charte UniO du Monde AIME).
 * En haut, blanc : des verbes. Dessiner, Broder, Fils, Partager. Chaque verbe garde une ligne courte
 * (le fil actif, les outils les plus utilisés) et déplie sous lui une grille : tous les points et outils,
 * ou le nuancier DMC. Choisir replie le dock. Les ouvrages se rangent sous le rond du profil.
 * En bas, sombre : se repérer. Le cercle, l'ouvrage, les lectures, la loupe qui agrandit sous le pointeur, le zoom.
 */
export type DockPath = null | "dessiner" | "fils" | "broder" | "partager" | "visibilite";
/** les blocs qu'on peut demander d'ailleurs : Mes ouvrages, le nuancier, la grille des outils */
export type BlocDemande = "inviter" | "nuancier" | "outils" | "aucun";
type Bloc = null | "menu" | "chercher" | "inviter" | "outils" | "nuancier";

export interface DockActions {
  home: () => void; settings: () => void; share: () => void;
  motifs: () => void; exportPanel: () => void; save: () => void; palette: () => void;
  threadsSettings: () => void; follow: () => void; layers: () => void; drawSettings: () => void;
  /** une nouvelle grille vierge (l'ouvrage en cours reste rangé dans Mes ouvrages) */
  nouveau: () => void;
  /** relancer la visite de l'orbe */
  visite?: () => void;
  /** exposer une copie de l'ouvrage dans la Galerie des Vivants (feuille « Exposer ») */
  exposer?: () => void;
}

interface Props {
  /** un autre contexte (le compositeur) a la main sur le Point : le dock ne le rend pas, un seul Point à l'écran */
  sansPoint?: boolean;
  patternName: string;
  saving: string;
  workspace: "create" | "stitch";
  onWorkspace: (mode: "create" | "stitch") => void;
  tool: Tool;
  onTool: (tool: Tool) => void;
  level: InterfaceLevel;
  onLevel: (level: InterfaceLevel) => void;
  view: ViewMode;
  onView: (view: ViewMode) => void;
  symbols: boolean;
  onSymbols: () => void;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
  colorHex: string; colorLabel: string;
  path: DockPath; onPath: (path: DockPath) => void;
  inspectorOpen: boolean;
  visibility: Visibility; onVisibility: (value: Visibility) => void;
  actions: DockActions;
  zoom: { zoomIn: () => void; zoomOut: () => void; fit: () => void; magnify: () => void };
  readOnly?: boolean;
  /** le mode Fils du dock du bas : les pastilles DMC (FlossRail en variante dock) */
  fils?: ReactNode;
  /** le rond du profil : mes ouvrages (ouvrir d'un clic ou glisser sur la grille) et déposer un fichier */
  ouvrages?: { courant?: string; ouvrir: (id: string) => void; importer: (f: File) => void };
  /** la progression du patron : le cercle du dock et le mode Progression */
  progression?: { total: number; done: number; couleurs: { idx: number; hex: string; code: string; cells: number; done: number }[] };
  onCouleur?: (idx: number) => void;
  /** le patron : pour le nuancier (fils du motif) et la loupe */
  pattern?: Pattern;
  /** l'index DMC du fil actif */
  couleur?: number;
  /** un bloc demandé d'ailleurs ; n change à chaque demande */
  blocDemande?: { bloc: BlocDemande; n: number } | null;
  /** les lignes de la grille, visibles ou masquées (Affichage, dans le Point du bloc) */
  grille?: "visible" | "masquee"; onGrille?: () => void;
  /** ouvrir le sélecteur de fichier de l'import (image, PDF, projet) */
  onImporter?: (genre?: "image" | "pdf" | "projet") => void;
  /** ouvrir le compositeur de rosaces */
  onComposer?: () => void;
}
type Genre = "tout" | "outils" | "fils" | "fonctions";
const GENRES: [Genre, string][] = [["tout", "Tout"], ["outils", "Outils"], ["fils", "Fils"], ["fonctions", "Fonctions"]];
type Resultat = { id: string; genre: Exclude<Genre, "tout">; label: string; meta: string; hex?: string; faire: () => void };
const sansAccents = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
/* les noms DMC sont en anglais : on cherche aussi en français */
const COULEURS_FR: Record<string, string[]> = { rouge: ["red"], bleu: ["blue"], vert: ["green"], jaune: ["yellow"], rose: ["pink", "rose"], noir: ["black"], blanc: ["white"], gris: ["gray", "grey"], violet: ["violet", "purple"], mauve: ["mauve", "lavender"], orange: ["orange"], marron: ["brown"], brun: ["brown"], beige: ["beige", "tan"], or: ["gold"], dore: ["gold"], argent: ["silver"], turquoise: ["turquoise"], corail: ["coral"], creme: ["cream", "ecru"], ecru: ["ecru"], kaki: ["khaki"], saumon: ["salmon"], lilas: ["lavender", "lilac"], fonce: ["dark", "dk"], clair: ["light", "lt"], pale: ["pale", "vy lt"] };
const correspond = (texte: string, q: string) => { const t = sansAccents(texte); return q.split(/\s+/).every(m => t.includes(m) || (COULEURS_FR[m] ?? []).some(e => t.includes(e))); };
const initiales = (s: string) => s.trim().split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(x => x[0]).join("").toUpperCase() || "·";
type ModeBas = "reperes" | "fils" | "progression";
const MODES: [ModeBas, string, string][] = [["reperes", "Repères", "#FFFFFF"], ["fils", "Fils", "#4FD69A"], ["progression", "Progression", "#F5B754"]];

const DRAW: [Tool, string][] = [["hand", "Main"], ["cross", "Croix"], ["erase", "Gomme"], ["fill", "Remplir"], ["pick", "Pipette"], ["select", "Sélection"]];
const DRAW_MORE: [Tool, string][] = [["half", "Demi-point"], ["quarter", "Quart"], ["threeQuarter", "Trois quarts"], ["petite", "Petite croix"], ["bead", "Perle"], ["back", "Point arrière"], ["knot", "Nœud"], ["long", "Point lancé"], ["line", "Ligne"], ["rect", "Rectangle"], ["ellipse", "Ellipse"], ["lasso", "Lasso"], ["move", "Déplacer"]];
const STITCH: [Tool, string][] = [["hand", "Main"], ["mark", "Marquer"], ["block", "Bloc 10 × 10"], ["row", "Ligne"], ["pick", "Pipette"], ["details", "Détails"], ["park", "Parking"], ["unpick", "À défaire"], ["note", "Note"]];
const BEGINNER = new Set<Tool>(["hand", "cross", "erase", "pick", "mark"]);
const VIEWS: [ViewMode, string][] = [["flat", "À plat"], ["pattern", "Patron"], ["real", "Réaliste"]];
const ICONES_VUE: Record<string, ReactNode> = { flat: <Square aria-hidden="true" />, pattern: <Grid3x3 aria-hidden="true" />, real: <Sparkles aria-hidden="true" /> };
const LABELS: Record<Exclude<DockPath, null>, string> = { dessiner: "Dessiner", fils: "Fils", broder: "Broder", partager: "Partager", visibilite: "Visibilité" };
const PARENT: Partial<Record<Exclude<DockPath, null>, DockPath>> = { visibilite: "partager" };
/* la ligne courte de Broder : les gestes les plus fréquents ; tout le reste est dans la grille */
const STITCH_VITE: [Tool, string][] = [["hand", "Main"], ["mark", "Marquer"], ["block", "Bloc 10 × 10"], ["row", "Ligne"]];

function Tool_({ children, pressed, onClick, disabled, haspopup, count, soon, label, guide, verbe }: { children: ReactNode; pressed?: boolean; onClick?: () => void; disabled?: boolean; haspopup?: boolean; count?: number; soon?: boolean; label?: string; guide?: string; verbe?: boolean }) {
  return <button type="button" data-guide={guide} className={"pzs-tool" + (label ? " pzs-icon pzs-picto" : "") + (verbe ? " pzs-verbe" : "")} aria-label={label} title={label} aria-pressed={pressed === undefined ? undefined : pressed} aria-haspopup={haspopup ? "true" : undefined}
    disabled={disabled} onClick={onClick} data-on={pressed ? "1" : undefined}>
    {children}{count !== undefined && <span className="pzs-count" aria-hidden="true">{count}</span>}
    {soon && <span className="pzs-soon">Bientôt</span>}
  </button>;
}

/**
 * Un rang qui défile, dit clairement : quand il déborde, un fondu et une flèche montrent qu'il y a d'autres boutons,
 * de quel côté ; le bouton qui reçoit le focus est ramené entièrement à l'écran. Jamais de bouton coupé sans indice.
 */
function useDefile() {
  const ref = useRef<HTMLElement | null>(null);
  const maj = () => { const e = ref.current; if (!e) return; const g = e.scrollLeft > 2, d = e.scrollLeft + e.clientWidth < e.scrollWidth - 2;
    e.dataset.plus = g && d ? "deux" : g ? "gauche" : d ? "droite" : ""; };
  useLayoutEffect(maj);
  useEffect(() => { const e = ref.current; if (!e) return;
    const focus = (ev: FocusEvent) => { const t = ev.target as HTMLElement; try { t.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch { /* jsdom */ } };
    e.addEventListener("scroll", maj, { passive: true }); e.addEventListener("focusin", focus); window.addEventListener("resize", maj);
    return () => { e.removeEventListener("scroll", maj); e.removeEventListener("focusin", focus); window.removeEventListener("resize", maj); }; }, []);
  return ref;
}

export default function StudioDocks(p: Props) {
  const rangHaut = useDefile(), rangBas = useDefile();
  const [bloc, setBloc] = useState<Bloc>(null);
  const [loupe, setLoupe] = useState(false);
  const [aideOuvrages, setAideOuvrages] = useState(false);
  /* essai : les outils sur le bloc (le Point posé sur le Cadre) au lieu du dock du bas ; réversible depuis le menu */
  const [essaiBloc, setEssaiBloc] = useState(lireEssaiBloc);
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<Genre>("tout");
  const [moi, setMoi] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const blocRef = useRef<HTMLDivElement>(null);
  const aime = dansAime();
  useEffect(() => { if (!aime) return; let vivant = true;
    fetch("/api/auth/get-session", { credentials: "same-origin" }).then(r => r.ok ? r.json() : null).then(j => { if (vivant && j && j.user) setMoi({ name: j.user.name, email: j.user.email, image: j.user.image }); }).catch(() => {});
    return () => { vivant = false; }; }, [aime]);
  const ouvrir = (b: Exclude<Bloc, null>) => setBloc(x => x === b ? null : b);
  useEffect(() => { if (p.blocDemande) setBloc(p.blocDemande.bloc === "aucun" ? null : p.blocDemande.bloc); }, [p.blocDemande]);
  const fermer = () => setBloc(null);
  const retourSite = () => { try { if (document.referrer && new URL(document.referrer).origin === window.location.origin && !new URL(document.referrer).pathname.startsWith("/studio")) { window.history.back(); return; } } catch { /* adresse illisible */ } window.location.href = "/"; };
  useEffect(() => { if (bloc === "chercher") document.getElementById("pzs-cherche")?.focus(); else if (bloc === "nuancier") document.getElementById("dg-cherche-fil")?.focus(); else if (bloc) blocRef.current?.querySelector<HTMLElement>("[aria-pressed=\"true\"], a, button")?.focus(); }, [bloc]);
  const [modes, setModes] = useState(false);
  const [modeBas, setModeBas] = useState<ModeBas>(p.path === "fils" ? "fils" : "reperes");
  const cercleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (p.path === "fils") { setModeBas("fils"); setModes(false); } else setModeBas(m => m === "fils" ? "reperes" : m); }, [p.path]);
  const upRef = useRef<HTMLButtonElement>(null);
  const wasPath = useRef<DockPath>(p.path);
  useEffect(() => {
    if (p.path && p.path !== wasPath.current) upRef.current?.focus();
    wasPath.current = p.path;
  }, [p.path]);

  const up = () => { if (bloc === "outils" || bloc === "nuancier") setBloc(null); p.onPath(p.path ? PARENT[p.path] ?? null : null); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    if (bloc) { e.preventDefault(); const b = bloc; setBloc(null); (b === "menu" ? document.getElementById("pzs-brand") : document.querySelector<HTMLElement>(b === "chercher" ? ".pzs-loupe" : b === "inviter" ? ".pzs-profil" : "[data-guide=\"grille\"]"))?.focus(); return; }
    if (p.path) { e.preventDefault(); up(); }
  };
  const level = (list: [Tool, string][]) => p.level === "beginner" ? list.filter(([id]) => BEGINNER.has(id) || id === p.tool) : list;
  const thread = <button type="button" className="pzs-tool pzs-threadtool" onClick={() => p.onPath("fils")} aria-label={`Fil actif ${p.colorLabel}, changer de fil`}>
    <span className="pzs-swatch" style={{ background: p.colorHex }} aria-hidden="true" />{p.colorLabel}
  </button>;

  const grille = (label: string, n: number) => <button type="button" data-guide="grille" className={"pzs-tool pzs-grille" + (bloc === "outils" ? " pzs-grille-on" : "")} aria-expanded={bloc === "outils"} aria-controls="pzs-bloc" onClick={() => ouvrir("outils")}>
    <LayoutGrid size={17} aria-hidden="true" />{label}<span className="pzs-count" aria-hidden="true">{n}</span>
  </button>;
  const choisir = (id: Tool) => { p.onTool(id); setBloc(null); };

  let items: ReactNode;
  if (p.path === "dessiner") items = <>
    {thread}<span className="pzs-sep" aria-hidden="true" />
    {level(DRAW).map(([id, name]) => <Tool_ key={id} label={name} pressed={p.tool === id} disabled={p.readOnly && id !== "hand"} onClick={() => p.onTool(id)}><ToolIcon tool={id} /></Tool_>)}
    {grille("Tous les points", DRAW.length + DRAW_MORE.length)}
  </>;
  else if (p.path === "fils") items = <>
    <span className="pzs-chip"><span className="pzs-swatch" style={{ background: p.colorHex }} aria-hidden="true" />Fil actif · {p.colorLabel}</span>
    <button type="button" data-guide="grille" className={"pzs-tool pzs-grille" + (bloc === "nuancier" ? " pzs-grille-on" : "")} aria-expanded={bloc === "nuancier"} aria-controls="pzs-bloc" onClick={() => ouvrir("nuancier")}><LayoutGrid size={17} aria-hidden="true" />Nuancier DMC</button>
    <Tool_ onClick={p.actions.threadsSettings}>Fils et toile</Tool_>
  </>;
  else if (p.path === "broder") items = <>
    {thread}<span className="pzs-sep" aria-hidden="true" />
    {level(STITCH_VITE).map(([id, name]) => <Tool_ key={id} label={name} pressed={p.tool === id} disabled={p.readOnly && id !== "hand"} onClick={() => p.onTool(id)}><ToolIcon tool={id} /></Tool_>)}
    {grille("Tous les gestes", STITCH.length + 1)}
  </>;
  else if (p.path === "partager") items = <>
    <Tool_ onClick={p.actions.share}>Inviter à regarder</Tool_>
    {p.actions.exposer && <Tool_ onClick={p.actions.exposer}>Exposer</Tool_>}
    <Tool_ haspopup count={4} onClick={() => p.onPath("visibilite")}><VisibilityOrb value={p.visibility} size={20} />Visibilité · {VISIBILITY[p.visibility].label}</Tool_>
    <Tool_ onClick={p.actions.exportPanel}>Exporter</Tool_>
    <Tool_ onClick={p.actions.save}>Enregistrer</Tool_>
    <Tool_ disabled soon>Lancer un SAL</Tool_>
  </>;
  else if (p.path === "visibilite") items = <>
    {VISIBILITY_ORDER.map(v => <Tool_ key={v} pressed={p.visibility === v} onClick={() => p.onVisibility(v)}><VisibilityOrb value={v} size={20} />{VISIBILITY[v].label}</Tool_>)}
  </>;
  else items = <>
    {/* les verbes : un pictogramme et un mot ; sur téléphone, le mot passe sous le pictogramme, les quatre tiennent sans défiler */}
    <Tool_ guide="dessiner" verbe haspopup count={DRAW.length + DRAW_MORE.length} pressed={p.workspace === "create"} onClick={() => { p.onWorkspace("create"); p.onPath("dessiner"); setBloc("outils"); }}><Pencil aria-hidden="true" /><span className="pzs-lib">Dessiner</span></Tool_>
    <Tool_ guide="broder" verbe haspopup count={STITCH.length + 1} pressed={p.workspace === "stitch"} onClick={() => { p.onWorkspace("stitch"); p.onPath("broder"); setBloc("outils"); }}><Spool aria-hidden="true" /><span className="pzs-lib">Broder</span></Tool_>
    <Tool_ guide="fils" verbe haspopup count={2} onClick={() => { p.onPath("fils"); setBloc("nuancier"); }}><Palette aria-hidden="true" /><span className="pzs-lib">Fils</span></Tool_>
    <Tool_ guide="partager" verbe haspopup count={p.actions.exposer ? 6 : 5} onClick={() => p.onPath("partager")}><Share2 aria-hidden="true" /><span className="pzs-lib">Partager</span></Tool_>
  </>;

  const ql = sansAccents(q.trim());
  const resultats: Resultat[] = [
    ...[...DRAW, ...DRAW_MORE, ...STITCH].filter((x, i, l) => l.findIndex(y => y[0] === x[0]) === i).map(([id, name]): Resultat => ({ id: "o-" + id, genre: "outils", label: name, meta: "Outil" + (STITCH.some(x => x[0] === id) && !DRAW.some(x => x[0] === id) ? " · Broder" : " · Dessiner"), faire: () => { const broder = STITCH.some(x => x[0] === id) && !DRAW.some(x => x[0] === id) && !DRAW_MORE.some(x => x[0] === id);
      p.onWorkspace(broder ? "stitch" : "create"); p.onPath(broder ? "broder" : "dessiner"); p.onTool(id); } })),
    ...(p.progression?.couleurs ?? []).map((c): Resultat => ({ id: "f-" + c.idx, genre: "fils", label: "DMC " + c.code, meta: (FLOSS[c.idx]?.name ?? "") + " · dans le motif" + (c.cells ? " · " + Math.round(c.done / c.cells * 100) + " % brodé" : ""), hex: c.hex, faire: () => p.onCouleur?.(c.idx) })),
    ...(ql ? FLOSS.map((f, idx): Resultat => ({ id: "d-" + idx, genre: "fils", label: "DMC " + f.code, meta: f.name + " · nuancier", hex: f.hex, faire: () => p.onCouleur?.(idx) })).filter(r => !(p.progression?.couleurs ?? []).some(c => "f-" + c.idx === r.id.replace("d-", "f-"))) : []),
    ...([["motifs", "Motifs", p.actions.motifs], ["calques", "Calques", p.actions.layers], ["reglages-dessin", "Réglages du dessin", p.actions.drawSettings], ["palette", "Palette DMC", p.actions.palette], ["fils-toile", "Fils et toile", p.actions.threadsSettings], ["suivi", "Suivi de broderie", p.actions.follow], ["nouveau", "Nouvelle grille", p.actions.nouveau], ["inviter", "Inviter à regarder", p.actions.share], ["exporter", "Exporter", p.actions.exportPanel], ["enregistrer", "Enregistrer", p.actions.save], ["tout-voir", "Tout voir", p.zoom.fit], ["symboles", "Symboles", p.onSymbols], ["reglages", "Réglages et aide", p.actions.settings], ...(p.actions.visite ? [["visite", "Revoir la visite avec Le Point", p.actions.visite]] : [])] as [string, string, () => void][])
      .map(([id, label, f]): Resultat => ({ id: "x-" + id, genre: "fonctions", label, meta: "Fonction de la grille", faire: f })),
  ];
  const trouves = resultats.filter(r => (genre === "tout" || r.genre === genre) && (!ql || correspond(r.label + " " + r.meta, ql))).slice(0, ql ? 40 : 24);
  const total = p.progression?.total ?? 0, prog = total ? (p.progression!.done / total) : 0;
  const teinte = MODES.find(m => m[0] === modeBas)?.[2] ?? "#FFFFFF";
  const toolName = [...DRAW, ...DRAW_MORE, ...STITCH].find(([id]) => id === p.tool)?.[1];
  const crumbs = ["Point Zéro", p.patternName];
  if (p.path) { const parent = PARENT[p.path]; if (parent) crumbs.push(LABELS[parent]); crumbs.push(LABELS[p.path]); }
  if ((p.path === "dessiner" || p.path === "broder") && toolName) crumbs.push(toolName);

  return <>
    <header className="pzs-head" aria-label="En-tête du studio">
      <button type="button" className="lp-evitement" onClick={() => { setLoupe(false); ouvrirConfort(); }}>Réglages de confort</button>
      {bloc && <div className="pzs-voile" aria-hidden="true" onClick={fermer} />}
      <nav className={"pzs-top" + (bloc ? " pzs-ouvert" : "")} aria-label="Dock des outils du studio de broderie" onKeyDown={onKey}>
        <div className="pzs-ligne">
          {aime && <button type="button" className="pzs-tool pzs-icon" aria-label="Revenir sur Le Monde AIME" title="Retour" onClick={retourSite}><ArrowLeft size={18} aria-hidden="true" /></button>}
          <button id="pzs-brand" data-guide="orbe" type="button" className="pzs-orbe" aria-label="Menu AIME : accueil, réglages, affichage" title="Menu AIME" aria-expanded={bloc === "menu"} aria-controls="pzs-bloc" onClick={() => ouvrir("menu")}>
            <Menu size={18} aria-hidden="true" />
          </button>
          <span className="pzs-sep" aria-hidden="true" />
          {aime ? <a className="pzs-tool pzs-marque" href="/" aria-label="AIME, Le Monde AIME">AIME<sup aria-hidden="true">®</sup></a> : <span className="pzs-tool pzs-marque">Point Zéro</span>}
          <span className="pzs-sep" aria-hidden="true" />
          <div className="pzs-row" data-guide="outils" data-defile ref={el => { rangHaut.current = el; }}>
            {p.path && <>
              <button ref={upRef} type="button" className="pzs-tool pzs-up" aria-label="Remonter d’un niveau" onClick={up}><ArrowLeft size={18} aria-hidden="true" /></button>
              <span className="pzs-parent">{LABELS[p.path]}</span>
              <span className="pzs-sep" aria-hidden="true" />
            </>}
            {items}
          </div>
          <span className="pzs-sep" aria-hidden="true" />
          <button type="button" className="pzs-tool pzs-icon" data-guide="historique" aria-label="Annuler" title="Annuler" disabled={!p.canUndo} onClick={p.onUndo}><Undo2 size={17} aria-hidden="true" /></button>
          <button type="button" className="pzs-tool pzs-icon pzs-redo" data-guide="historique" aria-label="Rétablir" title="Rétablir" disabled={!p.canRedo} onClick={p.onRedo}><Redo2 size={17} aria-hidden="true" /></button>
          <span className="pzs-sep" aria-hidden="true" />
          <button type="button" data-guide="chercher" className="pzs-tool pzs-icon pzs-loupe" aria-label={bloc === "chercher" ? "Fermer la recherche" : "Chercher un fil, un outil ou une fonction de la grille"} title="Chercher dans la grille" aria-expanded={bloc === "chercher"} aria-controls="pzs-bloc" onClick={() => ouvrir("chercher")}>
            {bloc === "chercher" ? <X size={17} aria-hidden="true" /> : <Search size={18} aria-hidden="true" />}
          </button>
          {/* Mes ouvrages : un dossier, nommé, toujours dans la barre du haut (le compte s'affiche dans le dossier) */}
          <button type="button" data-guide="profil" className="pzs-tool pzs-ouvrages" aria-label={"Mes ouvrages" + (moi?.name ? ", " + moi.name : "")} title="Mes ouvrages" aria-expanded={bloc === "inviter"} aria-controls="pzs-bloc" onClick={() => ouvrir("inviter")}>
            <Folder size={18} aria-hidden="true" /><span className="pzs-lib">Ouvrages</span>
          </button>
        </div>
        {bloc && <div id="pzs-bloc" className="pzs-bloc" ref={blocRef}>
          {bloc === "menu" && <>
            <div id="pzs-menu" className="pzs-bloc-corps" data-defile>
              <ul className="pzs-bloc-menu">
                {aime && <li><a href="/">Le Monde AIME</a></li>}
                <li><button type="button" onClick={() => { setBloc(null); p.actions.home(); }}>Accueil Point Zéro</button></li>
                <li><button type="button" onClick={() => setBloc("inviter")}>Mes ouvrages</button></li>
                <li><button type="button" onClick={() => setBloc("chercher")}>Chercher</button></li>
                <li><a href={import.meta.env.BASE_URL + "galerie"}>Galerie des Vivants</a></li>
                <li><button type="button" aria-pressed={essaiBloc} onClick={() => { const v = !essaiBloc; ecrireEssaiBloc(v); setEssaiBloc(v); setBloc(null); }}>{essaiBloc ? "Revenir au dock du bas" : "Essai : les outils sur le bloc"}</button></li>
                <li><button type="button" onClick={() => { setBloc(null); p.actions.settings(); }}>Réglages et aide</button></li>
                {p.actions.visite && <li><button type="button" onClick={() => { setBloc(null); p.actions.visite!(); }}>Revoir la visite avec Le Point</button></li>}
              </ul>
            </div>
            <div className="pzs-mini pzs-levels" role="group" aria-label="Affichage du studio">
              <span>Affichage</span>
              {(Object.keys(LEVEL_LABELS) as InterfaceLevel[]).map(id =>
                <button key={id} type="button" aria-pressed={p.level === id} onClick={() => p.onLevel(id)}>{LEVEL_LABELS[id]}</button>)}
            </div>
          </>}
          {bloc === "outils" && <>
            <div className="pzs-bloc-corps" data-defile>
              {p.path === "broder"
                ? <GrilleOutils groupes={GROUPES_BRODER} outil={p.tool} onOutil={choisir} filtre={p.level === "beginner" ? (id => BEGINNER.has(id) || id === p.tool || id === "block" || id === "row") : undefined} desactive={id => !!p.readOnly && id !== "hand"} plus={[["Suivi de broderie", () => { setBloc(null); p.actions.follow(); }]]} />
                : <GrilleOutils groupes={GROUPES_DESSIN} outil={p.tool} onOutil={choisir} filtre={p.level === "beginner" ? (id => BEGINNER.has(id) || id === p.tool) : undefined} desactive={id => !!p.readOnly && id !== "hand"}
                  plus={[["Motifs", () => { setBloc(null); p.actions.motifs(); }], ["Calques", () => { setBloc(null); p.actions.layers(); }], ["Réglages du dessin", () => { setBloc(null); p.actions.drawSettings(); }]]} />}
            </div>
            <div className="pzs-mini" role="group" aria-label="Le fil actif">
              <span>Fil actif</span>
              <button type="button" onClick={() => setBloc("nuancier")}><span className="pzs-swatch" style={{ background: p.colorHex }} aria-hidden="true" />&nbsp;{p.colorLabel} · changer</button>
              <button type="button" onClick={() => setBloc(null)}>Replier</button>
            </div>
          </>}
          {bloc === "nuancier" && p.pattern && <>
            <div className="pzs-bloc-corps" data-defile>
              <Nuancier pattern={p.pattern} couleur={p.couleur ?? 0} onCouleur={idx => { p.onCouleur?.(idx); setBloc(null); }} />
            </div>
            <div className="pzs-mini" role="group" aria-label="Fils">
              <button type="button" onClick={() => { setBloc(null); p.actions.threadsSettings(); }}>Fils et toile</button>
              <button type="button" onClick={() => setBloc(null)}>Replier</button>
            </div>
          </>}
          {bloc === "chercher" && <>
            <div className="pzs-bloc-corps" data-defile>
              <label htmlFor="pzs-cherche" className="sr-only">Chercher un fil, un outil ou une fonction</label>
              <input id="pzs-cherche" className="pzs-champ" type="search" autoComplete="off" placeholder="Chercher : 310, rouge, croix, calques, exporter…" value={q} onChange={e => setQ(e.target.value)} />
              <p className="pzs-note" role="status">{q.trim() ? trouves.length + " résultat" + (trouves.length > 1 ? "s" : "") : "Les fils du motif, les outils et les fonctions de la grille"}</p>
              <ul className="pzs-resultats">
                {trouves.map(r => <li key={r.id}><button type="button" onClick={() => { r.faire(); setBloc(null); }}>
                  {r.hex ? <span className="pzs-swatch" style={{ background: r.hex }} aria-hidden="true" /> : null}<b>{r.label}</b><span>{r.meta}</span>
                </button></li>)}
              </ul>
            </div>
            <div className="pzs-mini" role="group" aria-label="Chercher dans">
              {GENRES.map(([g, l]) => <button key={g} type="button" aria-pressed={genre === g} onClick={() => setGenre(g)}>{l}</button>)}
            </div>
          </>}
          {bloc === "inviter" && <>
            <div className="pzs-bloc-corps" data-defile>
              <p className="pzs-titre">{moi ? (moi.image ? <img className="pzs-avatar" src={moi.image} alt="" /> : <span className="pzs-avatar" aria-hidden="true">{initiales(moi.name || moi.email || "")}</span>) : null}Mes ouvrages{moi?.name ? " · " + moi.name.split(" ")[0] : ""}
                <button type="button" className="pzs-aide-bouton" aria-expanded={aideOuvrages} aria-controls="pzs-aide-ouvrages" onClick={() => setAideOuvrages(v => !v)}><CircleHelp size={16} aria-hidden="true" /><span className="sr-only">Aide sur Mes ouvrages</span></button></p>
              {p.ouvrages && <OuvragesBloc courant={p.ouvrages.courant} ouvrir={id => { setBloc(null); p.ouvrages!.ouvrir(id); }} importer={f => { setBloc(null); p.ouvrages!.importer(f); }} />}
              {moi && <PreferencesCompte />}
              {aideOuvrages && <p id="pzs-aide-ouvrages" className="pzs-note">Touchez un ouvrage pour l’ouvrir ; déposez un fichier pour l’importer. « Partager en direct » : quelqu’un regarde l’ouvrage ouvert, depuis son appareil.{!moi && aime ? " Entrez dans AIME pour retrouver vos ouvrages partout." : moi ? " Vos ouvrages sont sur votre compte AIME et sur cet appareil." : ""}</p>}
            </div>
            <div className="pzs-mini" role="group" aria-label="Nouvel ouvrage et invitation">
              <button type="button" onClick={() => { setBloc(null); p.actions.nouveau(); }}>+ Nouveau motif</button>
              <button type="button" onClick={() => { setBloc(null); p.actions.share(); }}>Partager en direct</button>
              {aime && !moi && <a href="/entrer">Entrer dans AIME</a>}
            </div>
          </>}
        </div>}
      </nav>
      <span className="sr-only" role="status">{p.patternName} · {p.saving}</span>
      {!bloc && <p className="pzs-crumbs">{crumbs.map((c, i) => <span key={i}>{i > 0 && <span aria-hidden="true"> › </span>}{i === crumbs.length - 1 ? <strong>{c}</strong> : c}</span>)}</p>}
    </header>

    {loupe && p.pattern && <div className="pzs-loupe-dock"><Loupe pattern={p.pattern} /><button type="button" className="pzs-loupe-fermer" aria-label="Fermer la loupe" onClick={() => setLoupe(false)}><X size={16} aria-hidden="true" /></button></div>}
    {essaiBloc ? (p.sansPoint ? null : <PointDuBloc<ContexteBroderie> type="broderie" nom={p.patternName} part={prog} etiquette={total ? "patron brodé à " + Math.round(prog * 100) + " %" : undefined} contexte={{
      outil: p.tool,
      choisirOutil: (t, atelier) => { if (p.workspace !== atelier) p.onWorkspace(atelier); p.onPath(atelier === "stitch" ? "broder" : "dessiner"); p.onTool(t); },
      couleur: p.couleur ?? 0, filsDuMotif: (p.progression?.couleurs ?? []).map(c => c.idx),
      choisirFil: idx => p.onCouleur?.(idx),
      vue: p.view, choisirVue: p.onView,
      symboles: !!p.symbols, basculerSymboles: p.onSymbols,
      grille: p.grille ?? "visible", basculerGrille: () => p.onGrille?.(),
      loupe, basculerLoupe: () => setLoupe(v => !v), toutVoir: p.zoom.fit,
      importer: genre => p.onImporter?.(genre), ouvrages: () => setBloc("inviter"), composer: p.onComposer,
      exporter: p.actions.exportPanel, enregistrer: p.actions.save, partager: p.actions.share,
      filsEtToile: p.actions.threadsSettings, suivi: p.actions.follow,
      aide: p.actions.settings, chercher: () => setBloc("chercher"),
      guide: p.actions.visite,
      dockClassique: () => { ecrireEssaiBloc(false); setEssaiBloc(false); requestAnimationFrame(() => cercleRef.current?.focus()); },
    }} />) : <>
    <nav className="pzs-bottom" aria-label="Se repérer dans le studio" data-defile ref={el => { rangBas.current = el; }} onKeyDown={e => { if (e.key === "Escape" && loupe) { e.preventDefault(); setLoupe(false); return; } if (e.key === "Escape" && modes) { e.preventDefault(); setModes(false); cercleRef.current?.focus(); } }}>
      {/* Le Point, contrôleur universel : Confort (toujours premier), Loupe, Guide, puis le métier (Broderie : Repères, Fils, Progression) */}
      {p.sansPoint ? null : <Point contexte="broderie" refBouton={cercleRef} part={prog} teinte={teinte}
        etiquette={"Dock en mode " + (MODES.find(m => m[0] === modeBas)?.[1] ?? "") + (total ? ", patron brodé à " + Math.round(prog * 100) + " %" : "")}
        modes={[
          { id: "loupe", nom: "Loupe", icone: <Search aria-hidden="true" />, aide: "la grille agrandie sous le pointeur ou à la case choisie au clavier, sans rien modifier", groupe: "socle", actif: loupe, ouvrir: () => setLoupe(v => !v) },
          ...(p.actions.visite ? [{ id: "guide", nom: "Guide", icone: <Compass aria-hidden="true" />, aide: "la visite du studio avec Le Point", groupe: "socle", ouvrir: () => p.actions.visite!() } satisfies ModePoint] : []),
          { id: "broderie", nom: "Broderie", icone: <Spool aria-hidden="true" />, aide: "le dock du bas en Repères, Fils DMC ou Progression", groupe: "metier", actif: modes, ouvrir: () => { setModes(v => !v); requestAnimationFrame(() => document.querySelector<HTMLElement>(".pzs-modes [aria-pressed=\"true\"]")?.focus()); } },
        ]} />}
      {modes
        ? <div className="pzs-modes" role="group" aria-label="Les modes du dock">
          {MODES.map(([id, nom, halo]) => <button key={id} type="button" className="pzs-btm pzs-halo-mode" aria-pressed={modeBas === id}
            onClick={() => { setModeBas(id); setModes(false); if (id === "fils" && p.path !== "fils") p.onPath("fils"); else if (id !== "fils" && p.path === "fils") p.onPath(null); requestAnimationFrame(() => cercleRef.current?.focus()); }}>
            <span aria-hidden="true" className="pzs-halo" style={{ boxShadow: `0 0 0 2px ${halo}, 0 0 12px 2px ${halo}` }} />{nom}
          </button>)}
        </div>
        : modeBas === "fils" ? (p.fils ?? null)
        : modeBas === "progression" ? <Progression progression={p.progression} onCouleur={p.onCouleur} />
        : <>
      {/* le dock du bas, réduit à l'essentiel : le nom de l'ouvrage est dans l'étiquette du Cadre ; le zoom à la molette, aux touches + et −, ou à deux doigts */}
      {/* Symboles (le mot des brodeuses), les trois lectures, Tout voir, la Loupe. Sur téléphone : pictogramme et mot court, tout tient sans défiler ; la Loupe y passe par le Point. */}
      <button type="button" data-guide="symboles" className="pzs-btm pzs-vue" aria-pressed={p.symbols} aria-label="Symboles : les symboles par-dessus les couleurs" onClick={p.onSymbols}><Shapes aria-hidden="true" /><span className="pzs-lib">Symboles</span></button>
      <div className="pzs-seg" data-guide="lectures" role="group" aria-label="Affichage de la grille">
        {VIEWS.map(([id, name]) => <button key={id} type="button" className="pzs-vue" aria-pressed={p.view === id} onClick={() => p.onView(id)}>{ICONES_VUE[id]}<span className="pzs-lib">{name}</span></button>)}
      </div>
      <span className="pzs-sep" aria-hidden="true" />
      <button type="button" data-guide="tout-voir" className="pzs-btm pzs-light pzs-vue" onClick={p.zoom.fit}><Maximize aria-hidden="true" /><span className="pzs-lib">Tout voir</span></button>
      <button type="button" data-guide="loupe" className="pzs-btm pzs-loupe-btn" aria-pressed={loupe} aria-label="Loupe : la grille agrandie sous le pointeur" title="Loupe" onClick={() => setLoupe(v => !v)}><Search size={17} aria-hidden="true" /><span className="pzs-loupe-txt">Loupe</span></button>
        </>}
    </nav>
    </>}
  </>;
}

/* La timeline du patron : chaque fil, de celui qui compte le plus de points au plus petit, rempli à mesure qu'il est brodé. */
function Progression({ progression, onCouleur }: { progression?: Props["progression"]; onCouleur?: (idx: number) => void }) {
  if (!progression || !progression.total) return <span className="pzs-place">Rien à broder pour l’instant : dessinez, importez ou ouvrez un patron.</span>;
  const { total, done } = progression, reste = Math.max(0, total - done);
  const couleurs = [...progression.couleurs].filter(c => c.cells > 0).sort((a, b) => b.cells - a.cells);
  return <>
    <span className="pzs-place" style={{ fontWeight: 700 }}>{Math.round(done / total * 100)} %<span style={{ fontWeight: 400, opacity: .7 }}> · {reste.toLocaleString("fr-FR")} à broder</span></span>
    <div className="pzs-timeline" role="list" aria-label="La timeline du patron, fil par fil">
      {couleurs.map(c => { const part = c.done / c.cells;
        return <button key={c.idx} type="button" role="listitem" className="pzs-etape" onClick={() => onCouleur?.(c.idx)}
          style={{ flexGrow: Math.max(1, c.cells), minWidth: 34 }} aria-label={`DMC ${c.code} : ${Math.round(part * 100)} % brodé, ${c.cells - c.done} points restants`} title={`DMC ${c.code} · ${Math.round(part * 100)} %`}>
          <span className="pzs-etape-fond" style={{ background: c.hex }} />
          <span className="pzs-etape-reste" style={{ left: `${part * 100}%` }} />
          <span className="pzs-etape-code">{c.code}</span>
        </button>; })}
    </div>
  </>;
}
