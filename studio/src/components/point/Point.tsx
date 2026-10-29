import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import LePoint from "./LePoint";
import PanneauConfort from "./PanneauConfort";
import { hotePortail, type ModePoint } from "../../lib/point/modes";

/** L'événement qui ouvre Confort de n'importe où (lien d'évitement, raccourci d'un autre studio). */
export const OUVRIR_CONFORT = "pz:point:confort";
export const ouvrirConfort = () => window.dispatchEvent(new CustomEvent(OUVRIR_CONFORT));

/**
 * Le Point d'un contexte : le même composant partout. Il apporte toujours Confort (le réglage d'accès, premier)
 * et ajoute les modes que le contexte déclare (Loupe et Broderie dans l'atelier ; Guide et Espace dans le compositeur…).
 * Un seul Point est à l'écran à la fois : le contexte qui a la main le rend, les autres le taisent.
 * Le Point ne crée rien et ne déplace pas : la création reste dans FAIRE, la navigation dans ALLER.
 */
export default function Point({ contexte, modes, part, teinte, etiquette, refBouton, guide }: {
  /** le nom du contexte (« broderie », « compositeur ») : pour les tests et la lecture du code */
  contexte: string;
  modes: ModePoint[];
  part?: number; teinte?: string; etiquette?: string; guide?: string;
  refBouton?: { current: HTMLButtonElement | null };
}) {
  const [confort, setConfort] = useState(false);
  const [annonce, setAnnonce] = useState("");
  const bouton = useRef<HTMLButtonElement | null>(null);
  const ref = refBouton ?? bouton;
  useEffect(() => {
    const ouvrir = () => setConfort(true);
    window.addEventListener(OUVRIR_CONFORT, ouvrir);
    return () => window.removeEventListener(OUVRIR_CONFORT, ouvrir);
  }, []);
  const fermer = () => { setConfort(false); requestAnimationFrame(() => ref.current?.focus()); };
  const tous: ModePoint[] = [
    { id: "confort", nom: "Confort", aide: "taille du texte, contraste, thème, mouvement", groupe: "acces", actif: confort, ouvrir: () => setConfort(v => !v) },
    /* ouvrir un autre mode referme Confort : un seul panneau à la fois */
    ...modes.map(m => ({ ...m, ouvrir: () => { setConfort(false); m.ouvrir(); } })),
  ];
  return <span className="lp-contexte" data-contexte={contexte}>
    <LePoint modes={tous} part={part} teinte={teinte} etiquette={etiquette} guide={guide} refBouton={ref} annonceExterne={annonce} />
    {confort && createPortal(<PanneauConfort onFermer={fermer} onAnnonce={setAnnonce} />, hotePortail(ref.current))}
  </span>;
}
