/**
 * Essai : le Cadre-Tambour (V2, « le disque unique »). Un seul objet, deux états.
 * - Cadre : le format, son étiquette en haut (le Cadre) et le dock du bas accroché dessous. Le Cadre reste la source canonique.
 * - Tambour : le même objet se referme en un disque d'une seule pièce, calculé depuis un seul centre (lib/tambour/disque.ts) :
 *   A, la toile (le vrai ouvrage, éditable : on y dessine, brode, gomme, comme dans le Cadre) ; B, le bois et sa vis ;
 *   C, la couronne noire des commandes, qui restent entières à l'intérieur (rond, mot, focus). Les familles s'ouvrent sur la même couronne.
 * - La caméra nacrée au centre : discrète et transparente aux gestes au repos (on dessine au centre) ; elle s'éveille quand la main
 *   revient sur la couronne. Au clavier : Broder › Sur ma toile.
 * - Morphose : le contour du Cadre devient le bois ; les commandes quittent le dock pour la couronne ; le chemin inverse au retour.
 *   Instantané quand les animations sont réduites. L'ouvrage n'est ni dupliqué ni modifié.
 * Aucune logique du Cadre ni de la grille ne change : ce composant se pose par-dessus.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Camera, ChevronsDownUp, Ellipsis, Minimize2 } from "lucide-react";
import Point from "./point/Point";
import { commandesDuBloc } from "../lib/point/registre";
import type { ModePoint } from "../lib/point/modes";
import type { ContexteBroderie } from "./blocs/broderie";
import { geometrieDisque, type Disque } from "../lib/tambour/disque";
import "./blocs/broderie";
import "./TambourAtelier.css";

export const CADRE_TAMBOUR_CLE = "pointzero:essai:cadre-tambour";
export const lireCadreTambour = () => { try { return localStorage.getItem(CADRE_TAMBOUR_CLE) === "1"; } catch { return false; } };
export const ecrireCadreTambour = (v: boolean) => { try { if (v) localStorage.setItem(CADRE_TAMBOUR_CLE, "1"); else localStorage.removeItem(CADRE_TAMBOUR_CLE); } catch { /* rien */ } };

/** les commandes gardées au premier anneau quand la place manque (le reste passe dans « Plus ») ; Confort est toujours là */
export const PRIORITE = ["points", "broder", "fils", "affichage", "loupe", "retracter"];
export function premierAnneau(modes: ModePoint[], capacite: number): ModePoint[] {
  if (modes.length + 1 <= capacite) return modes;   /* + 1 : Confort, apporté par le Point */
  const garder = Math.max(2, capacite - 2), prio = [...PRIORITE.map(id => modes.find(m => m.id === id)).filter((m): m is ModePoint => !!m), ...modes.filter(m => !PRIORITE.includes(m.id))];
  const tete = prio.slice(0, garder), reste = modes.filter(m => !tete.includes(m));
  return [...modes.filter(m => tete.includes(m)), { id: "plus", nom: "Plus", icone: <Ellipsis aria-hidden="true" />, aide: reste.map(m => m.nom).join(", "), groupe: "creation", ouvrir: () => {}, enfants: () => reste }];
}

const reduit = () => document.documentElement.getAttribute("data-pz-motion") === "reduce" || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const anneauSvg = (c: number, r: number, R: number) => `M ${c - R} ${c} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z M ${c - r} ${c} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
type Rect = { x: number; y: number; w: number; h: number };
function rectCadre(): Rect | null {
  const c = document.querySelector(".cadre"); if (!c) return null;
  const s = getComputedStyle(c), v = (k: string) => parseFloat(s.getPropertyValue(k));
  return Number.isFinite(v("--fx0")) && v("--fw") > 0 ? { x: v("--fx0"), y: v("--fy0"), w: v("--fw"), h: v("--fh") } : null;
}

export default function TambourAtelier({ contexte, retracter, part, etiquette, ouvrage }: { contexte: ContexteBroderie; retracter: () => void; part?: number; etiquette?: string; ouvrage?: string }) {
  const [replie, setReplie] = useState(false);
  const mesurer = useCallback((rep: boolean): Disque => {
    const haut = Math.max(document.querySelector(".pzs-top")?.getBoundingClientRect().bottom ?? 72, document.querySelector(".pzs-crumbs")?.getBoundingClientRect().bottom ?? 0) + 8;
    /* la taille du texte du Confort (--pz-user-font-scale), et le zoom du navigateur (déjà dans la largeur de la fenêtre) */
    const texte = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pz-user-font-scale")) || 1, l = window.innerWidth, h = window.innerHeight;
    /* une seule place pour les messages, sous le disque : le cartouche et les notifications la partagent (jamais l'un sur l'autre) */
    return geometrieDisque(l, h, haut, { texte, replie: rep, bas: 64 });
  }, []);
  const [g, setG] = useState(() => mesurer(false));
  useEffect(() => { setG(mesurer(replie)); const f = () => setG(mesurer(replie)); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [replie, mesurer]);
  const hote = useRef<HTMLDivElement>(null);

  /* la morphose : départ (le Cadre, le dock), arrivée (le disque) ; puis le chemin inverse */
  const depart = useRef<{ cadre: Rect | null; dock: { x: number; y: number } | null } | null>(null);
  if (!depart.current) {
    const d = document.querySelector(".pzs-bottom")?.getBoundingClientRect();
    depart.current = { cadre: rectCadre(), dock: d && d.width ? { x: d.left + d.width / 2, y: d.top + d.height / 2 } : null };
  }
  const [phase, setPhase] = useState<"depart" | "ouvert" | "sortie">(() => (reduit() || !depart.current?.cadre ? "ouvert" : "depart"));
  useLayoutEffect(() => { if (phase !== "depart") return; let r2 = 0; const r = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setPhase("ouvert")); }); return () => { cancelAnimationFrame(r); cancelAnimationFrame(r2); }; }, [phase]);
  const fermer = useCallback(() => {
    if (reduit()) { retracter(); return; }
    depart.current!.cadre = rectCadre() ?? depart.current!.cadre; setPhase("sortie"); window.setTimeout(retracter, 380);
  }, [retracter]);

  /* la place des messages (notifications du studio) : sous le disque, celle du cartouche */
  useLayoutEffect(() => { const r = document.documentElement; r.style.setProperty("--pz-message-y", Math.round(g.cy + g.Ro + 8) + "px"); r.style.setProperty("--pz-disque-r", Math.round(g.Ro) + "px"); return () => { r.style.removeProperty("--pz-message-y"); r.style.removeProperty("--pz-disque-r"); }; }, [g.cy, g.Ro]);
  /* le Cadre et le dock du bas se replient dans le tambour tant qu'il est ouvert */
  useLayoutEffect(() => { document.documentElement.classList.add("pz-tambour-ouvert"); return () => document.documentElement.classList.remove("pz-tambour-ouvert"); }, []);
  /* Échap rétracte aussi quand le focus est sur la grille (pas dans un champ, ni dans un panneau ouvert) */
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (hote.current?.contains(t) || t.closest("input, textarea, select, [role=dialog], .pzs-bloc, .pz-panneau"))) return;
      /* d'abord remonter d'un niveau de la couronne, puis rétracter */
      const retour = hote.current?.querySelector<HTMLElement>('[data-mode="__retour"]');
      e.preventDefault(); if (retour) retour.click(); else fermer();
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [fermer]);

  /* l'orbe du centre : au repos, transparente aux gestes (on dessine au centre) ; elle s'éveille quand la main revient sur la couronne */
  const [eveil, setEveil] = useState(false), minuteur = useRef(0);
  const surCouronne = (e: React.SyntheticEvent) => { if ((e.target as Element).closest?.(".pzt-couronne-zone, [role=menuitem], .lp-centre-action")) { window.clearTimeout(minuteur.current); setEveil(true); } };
  const horsCouronne = () => { window.clearTimeout(minuteur.current); minuteur.current = window.setTimeout(() => setEveil(false), 1400); };
  useEffect(() => () => window.clearTimeout(minuteur.current), []);
  /* le cartouche (place juste) : le mot et l'aide de la commande visée */
  const [carte, setCarte] = useState<{ nom: string; aide: string } | null>(null);
  const viser = (e: React.SyntheticEvent) => { const b = (e.target as Element).closest?.("[role=menuitem]") as HTMLElement | null; if (b) setCarte({ nom: b.querySelector(".lp-mot")?.textContent?.replace("›", "").trim() || b.getAttribute("aria-label")?.split(",")[0] || "", aide: b.title }); };

  const surMaToile = () => { window.location.href = import.meta.env.BASE_URL + "tambour?mode=superposer" + (ouvrage ? "&ouvrage=" + encodeURIComponent(ouvrage) : ""); };
  const modes = useMemo(() => premierAnneau([
    ...commandesDuBloc<ContexteBroderie>("broderie", { ...contexte, dockClassique: undefined, surMaToile }),
    { id: "replier", nom: "Replier", icone: <ChevronsDownUp aria-hidden="true" />, aide: "essai : la couronne se replie, la toile prend toute la place ; les outils reviennent à la demande", groupe: "socle", ouvrir: () => setReplie(true) },
    { id: "retracter", nom: "Rétracter", icone: <Minimize2 aria-hidden="true" />, aide: "le tambour se replie : le patron entier, le Cadre pour agrandir et déplacer, le dock dessous", groupe: "socle", ouvrir: fermer },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], g.capacite), [contexte, g.capacite, fermer]);

  const c = g.Ro + 2, fin = phase === "ouvert";
  const cadre = depart.current!.cadre, dock = depart.current!.dock;
  /* le contour qui se transforme : le Cadre (rectangle) au départ, le bois (cercle) à l'arrivée */
  const rond = { left: g.cx - g.rb, top: g.cy - g.rb, width: 2 * g.rb, height: 2 * g.rb };
  const bois = fin || !cadre ? rond : { left: cadre.x, top: cadre.y, width: cadre.w, height: cadre.h };
  return <div ref={hote} className={"pzt pzt-" + phase + (eveil ? " pzt-eveil" : "") + (replie ? " pzt-replie" : "") + " pzt-etiq-" + g.etiquettes} data-etiquettes={g.etiquettes}
    style={{ ["--pzt-x" as string]: g.cx + "px", ["--pzt-y" as string]: g.cy + "px", ["--pzt-r" as string]: g.r + "px", ["--pzt-rb" as string]: g.rb + "px", ["--pzt-ri" as string]: g.ri + "px", ["--pzt-ro" as string]: g.Ro + "px",
      ["--pzt-bl" as string]: g.env.l + "px", ["--pzt-bh" as string]: g.env.h + "px", ["--pzt-bd" as string]: g.env.rond + "px",
      ["--pzt-dx" as string]: (dock ? dock.x - g.cx : 0) + "px", ["--pzt-dy" as string]: (dock ? dock.y - g.cy : 0) + "px" }}
    onKeyDown={e => { if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); if (replie) setReplie(false); else fermer(); } }}
    onPointerOver={e => { surCouronne(e); viser(e); }} onPointerOut={horsCouronne} onFocus={e => { surCouronne(e); viser(e); }}>
    <div className="pzt-voile" aria-hidden="true" />
    <div className="pzt-bois" aria-hidden="true" style={bois} />
    {!replie && <>
      <svg className="pzt-anneau" width={2 * c} height={2 * c} aria-hidden="true">
        <defs><linearGradient id="pzt-corps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#262626" /><stop offset=".55" stopColor="#141414" /><stop offset="1" stopColor="#0c0c0c" /></linearGradient></defs>
        <path className="pzt-couronne-zone" d={anneauSvg(c, g.ri, g.Ro)} fillRule="evenodd" fill="url(#pzt-corps)" />
        <circle cx={c} cy={c} r={g.Ro - 1.5} className="pzt-rebord" /><circle cx={c} cy={c} r={g.ri + 1.5} className="pzt-rebord-int" />
        <circle cx={c} cy={c} r={g.rho} className="pzt-sillon" />
      </svg>
      <span className="pzt-vis" aria-hidden="true" />
      <div className="pzt-point">
        <Point scene tambour={{ rayon: g.rho, cote: 2 * c, parPage: g.capacite - 3 }} contexte="tambour-atelier" memoire="bloc-broderie" part={part} etiquette={etiquette} modes={modes}
          centre={{ nom: "Sur ma toile", aide: "filmer votre vraie toile et y poser ce patron", icone: <Camera aria-hidden="true" />, ouvrir: surMaToile }} />
      </div>
      {/* le cartouche : le nom et l'aide de la commande visée (une nuance DMC : son numéro et son nom, jamais la couleur seule) */}
      <p className="pzt-cartouche" aria-hidden="true">{carte ? <><b>{carte.nom}</b>{carte.aide && !carte.nom.includes(carte.aide) && <span>{carte.aide}</span>}</> : <span>{g.etiquettes === "cartouche" ? "Touchez une commande : son nom s’affiche ici." : "Survolez une commande : ce qu’elle fait s’affiche ici."}</span>}</p>
    </>}
    {replie && <button type="button" className="pzt-deployer" aria-label="Déployer les outils du tambour" title="Déployer les outils" onClick={() => setReplie(false)}
      style={{ left: g.cx + (g.rb - 4) * Math.SQRT1_2, top: g.cy + (g.rb - 4) * Math.SQRT1_2 }}><span className="lp-centre" /><Ellipsis aria-hidden="true" /></button>}
  </div>;
}
