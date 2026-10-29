/**
 * Essai : le Cadre-Tambour. Un seul objet, deux états.
 * - Cadre : le format, son étiquette en haut (le Cadre) et le dock du bas accroché dessous.
 * - Tambour : le même objet se referme en cercle posé sur l'ouvrage ; les outils du Point se rangent tout autour.
 *   On brode et on dessine dans le cercle (le centre laisse passer les gestes vers la grille) ; on déplace l'ouvrage sous le tambour
 *   comme on déplace un vrai tambour sur la toile. Rétracter (la vis, la commande, ou Échap) rend le patron entier et le Cadre.
 * Aucune logique du Cadre ni de la grille ne change : ce composant ne fait que se poser par-dessus.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Camera, Minimize2 } from "lucide-react";
import Point from "./point/Point";
import { commandesDuBloc } from "../lib/point/registre";
import type { ModePoint } from "../lib/point/modes";
import type { ContexteBroderie } from "./blocs/broderie";
import "./blocs/broderie";
import "./TambourAtelier.css";

export const CADRE_TAMBOUR_CLE = "pointzero:essai:cadre-tambour";
export const lireCadreTambour = () => { try { return localStorage.getItem(CADRE_TAMBOUR_CLE) === "1"; } catch { return false; } };
export const ecrireCadreTambour = (v: boolean) => { try { if (v) localStorage.setItem(CADRE_TAMBOUR_CLE, "1"); else localStorage.removeItem(CADRE_TAMBOUR_CLE); } catch { /* rien */ } };

/** Le tambour : centré dans la place laissée par le dock du haut, le plus grand cercle dont l'anneau d'outils tient à l'écran. */
export function placeTambour(l: number, h: number, haut: number) {
  /* les outils sont posés à r + 40 ; un rond, son mot dessous et une marge : 88 px de côté, 96 px en haut et en bas */
  const cx = l / 2, cy = haut + (h - haut) / 2;
  const r = Math.max(60, Math.min(360, l / 2 - 88, (h - haut) / 2 - 96));
  return { cx, cy, r };
}

/** l'anneau sombre (de r à R) : un tracé à trou, qui seul attrape les gestes ; le centre reste à la grille */
const anneauSvg = (c: number, r: number, R: number) => `M ${c - R} ${c} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 Z M ${c - r} ${c} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;

export default function TambourAtelier({ contexte, retracter, part, etiquette, ouvrage }: { contexte: ContexteBroderie; retracter: () => void; part?: number; etiquette?: string; ouvrage?: string }) {
  const lire = () => placeTambour(window.innerWidth, window.innerHeight, Math.max(document.querySelector(".pzs-top")?.getBoundingClientRect().bottom ?? 72, document.querySelector(".pzs-crumbs")?.getBoundingClientRect().bottom ?? 0) + 8);
  const [t, setT] = useState(lire);
  const hote = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = () => setT(lire()); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  /* Échap rétracte aussi quand le focus est sur la grille (pas dans un champ, ni dans un panneau ouvert) */
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && (hote.current?.contains(t) || t.closest("input, textarea, select, [role=dialog], .pzs-bloc, .pz-panneau"))) return;
      retracter();
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [retracter]);
  /* le Cadre et le dock du bas se replient dans le tambour tant qu'il est ouvert */
  useLayoutEffect(() => { document.documentElement.classList.add("pz-tambour-ouvert"); return () => document.documentElement.classList.remove("pz-tambour-ouvert"); }, []);
  const R = t.r + 78, c = R + 4;
  /* le centre nacré : la caméra. Elle ouvre le Tambour vivant, cet ouvrage posé sur la toile filmée (l'anneau le propose aussi : Broder › Sur ma toile) */
  const surMaToile = () => { window.location.href = import.meta.env.BASE_URL + "tambour?mode=superposer" + (ouvrage ? "&ouvrage=" + encodeURIComponent(ouvrage) : ""); };
  const modes: ModePoint[] = [
    ...commandesDuBloc<ContexteBroderie>("broderie", { ...contexte, dockClassique: undefined, surMaToile }),
    { id: "retracter", nom: "Rétracter", icone: <Minimize2 aria-hidden="true" />, aide: "le tambour se replie : le patron entier, le Cadre pour agrandir et déplacer, le dock dessous", groupe: "socle", ouvrir: retracter },
  ];
  return <div ref={hote} className="pzt" style={{ ["--pzt-x" as string]: t.cx + "px", ["--pzt-y" as string]: t.cy + "px", ["--pzt-r" as string]: t.r + "px" }}
    onKeyDown={e => { if (e.key === "Escape" && !e.defaultPrevented) { e.preventDefault(); retracter(); } }}>
    <div className="pzt-voile" aria-hidden="true" />
    <svg className="pzt-anneau" width={2 * c} height={2 * c} aria-hidden="true">
      <defs><linearGradient id="pzt-corps" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c2c2b" /><stop offset=".55" stopColor="#161616" /><stop offset="1" stopColor="#0d0d0d" /></linearGradient></defs>
      <path d={anneauSvg(c, t.r + 12, R)} fillRule="evenodd" fill="url(#pzt-corps)" />
      <circle cx={c} cy={c} r={R - 1.5} className="pzt-rebord" /><circle cx={c} cy={c} r={t.r + 13.5} className="pzt-rebord-int" />
    </svg>
    <div className="pzt-bois" aria-hidden="true" /><span className="pzt-vis" aria-hidden="true" />
    <div className="pzt-point">
      <Point scene tambour={t.r + 12} centre={{ nom: "Sur ma toile", aide: "filmer votre vraie toile et y poser ce patron", icone: <Camera aria-hidden="true" />, ouvrir: surMaToile }} contexte="tambour-atelier" memoire="bloc-broderie" part={part} etiquette={etiquette} modes={modes} />
    </div>
  </div>;
}
