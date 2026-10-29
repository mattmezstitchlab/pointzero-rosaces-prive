import { useEffect, useState } from "react";
import Point from "./Point";
import { commandesDuBloc, placePointDuBloc } from "../../lib/point/registre";

/**
 * Le Point d'un bloc : posé sur le bord du bloc sélectionné (ici, le Cadre de l'ouvrage), il ouvre le menu de ce type de bloc.
 * C'est le même Point (même noyau, même Confort, mêmes présentations) ; seules les commandes viennent du registre.
 * Le bloc garde ses poignées : le Point se pose à côté, jamais dessus.
 */
export default function PointDuBloc<C>({ type, nom, contexte, selecteur = ".cadre" }: { type: string; nom: string; contexte: C; selecteur?: string }) {
  const [pos, setPos] = useState<{ left: number; top: number; bord: string } | null>(null);
  useEffect(() => {
    let el: HTMLElement | null = null, obs: MutationObserver | null = null, raf = 0;
    const lire = () => {
      el = el && document.contains(el) ? el : document.querySelector<HTMLElement>(selecteur);
      if (!el) { setPos(null); return; }
      const cs = getComputedStyle(el), v = (k: string) => parseFloat(cs.getPropertyValue(k)) || 0;
      const b = { x: v("--fx0"), y: v("--fy0"), w: v("--fw"), h: v("--fh") };
      const haut = document.querySelector(".pzs-top")?.getBoundingClientRect().bottom ?? 72;
      const p = placePointDuBloc(b, { w: window.innerWidth, h: window.innerHeight }, haut + 8);
      setPos(p);
      /* les panneaux du bas (Confort, Loupe) s'ouvrent au-dessus du Point du bloc, pour ne jamais le couvrir */
      document.documentElement.style.setProperty("--pz-bas-libre", Math.round(window.innerHeight - p.top + 8) + "px");
    };
    const programmer = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(lire); };
    lire();
    const brancher = () => { el = document.querySelector<HTMLElement>(selecteur); if (el) { obs?.disconnect(); obs = new MutationObserver(programmer); obs.observe(el, { attributes: true, attributeFilter: ["style"] }); } };
    brancher();
    const minuteur = window.setInterval(() => { if (!el || !document.contains(el)) { brancher(); programmer(); } }, 800);
    window.addEventListener("resize", programmer);
    return () => { obs?.disconnect(); cancelAnimationFrame(raf); window.clearInterval(minuteur); window.removeEventListener("resize", programmer); document.documentElement.style.removeProperty("--pz-bas-libre"); };
  }, [selecteur]);
  const modes = commandesDuBloc(type, contexte);
  if (!pos) return null;
  return <div className="lp-bloc" data-bord={pos.bord} style={{ left: pos.left, top: pos.top }}>
    <Point contexte={"bloc-" + type} ancrage="autour" guide="point-du-bloc" etiquette={`outils du bloc ${nom}`} modes={modes} />
  </div>;
}
