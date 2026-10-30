/**
 * La navigation de retour permanente : un petit Point nacré, toujours au même endroit (en bas à droite ; à gauche si le Point de la personne est à droite).
 * Il ouvre : .0NE, Explorer, le film, les réglages de confort, et « Revenir ». Clavier : Échap referme.
 * Et la garde : si une expérience échoue (erreur, module introuvable), elle propose de revenir à .0NE — jamais d'écran vide.
 */
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import "./convergence.css";

const S = import.meta.env.BASE_URL;
const liens = (base: string) => [
  { nom: ".0NE — tous les univers", chemin: base + "one/univers" },
  { nom: "Explorer les prototypes", chemin: base + "explorer" },
  { nom: "Le film LUMIERE", chemin: base + "one/lumiere" },
  { nom: "Réglages de confort", chemin: base + "one/premiere-rencontre" },
];

/** `base` : l'adresse du studio (.0NE) ; le site AIME, servi à la racine, passe "/studio/". */
export function NavigationConvergence({ base = S }: { base?: string } = {}) {
  const LIENS = liens(base);
  const [ouvert, setOuvert] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null), panneau = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOuvert(false); bouton.current?.focus(); } };
    const dehors = (e: PointerEvent) => { if (!panneau.current?.contains(e.target as Node) && e.target !== bouton.current) setOuvert(false); };
    window.addEventListener("keydown", k, true); window.addEventListener("pointerdown", dehors);
    requestAnimationFrame(() => panneau.current?.querySelector("a")?.focus());
    return () => { window.removeEventListener("keydown", k, true); window.removeEventListener("pointerdown", dehors); };
  }, [ouvert]);
  const ici = window.location.pathname.replace(/\/+$/, "");
  return <nav className="cv-nav" aria-label="Navigation de la version candidate">
    {ouvert && <div className="cv-nav-panneau" ref={panneau} id="cv-nav-panneau">
      {LIENS.map(l => <a key={l.chemin} href={l.chemin} aria-current={ici === l.chemin.replace(/\/+$/, "") ? "page" : undefined}>{l.nom}</a>)}
      {history.length > 1 && <button type="button" onClick={() => history.back()}>Revenir à la page précédente</button>}
    </div>}
    <button ref={bouton} type="button" className="cv-nav-bouton" aria-expanded={ouvert} aria-controls="cv-nav-panneau" onClick={() => setOuvert(v => !v)}>
      <span className="cv-orbe" aria-hidden="true" /><span className="cv-nav-texte">{ouvert ? "Fermer" : "Naviguer"}</span>
    </button>
  </nav>;
}

export class GardeExperience extends Component<{ children: ReactNode; nom?: string }, { erreur: string | null }> {
  state = { erreur: null as string | null };
  static getDerivedStateFromError(e: unknown) { return { erreur: e instanceof Error ? e.message : String(e) }; }
  componentDidCatch(e: unknown) { console.error("[convergence] expérience interrompue :", e); }
  render() {
    if (!this.state.erreur) return this.props.children;
    return <main className="cv-erreur" data-aime="jour" role="alert">
      <span className="cv-orbe cv-orbe-grand" aria-hidden="true" />
      <h1>Cette expérience s’est interrompue.</h1>
      <p>{this.props.nom ? `« ${this.props.nom} » ` : "Cette page "}n’a pas pu s’afficher sur cet appareil. Rien n’a été perdu : vos réglages restent sur cet appareil.</p>
      <div className="cv-actions">
        <a className="cv-bouton cv-plein" href={S + "one/univers"}>Revenir à .0NE</a>
        <a className="cv-bouton" href={S + "explorer"}>Explorer les prototypes</a>
        <button type="button" className="cv-bouton" onClick={() => location.reload()}>Réessayer</button>
      </div>
      <details><summary>Détail technique</summary><code>{this.state.erreur}</code></details>
    </main>;
  }
}
