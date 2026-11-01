import type { ReactNode } from "react";
import TopDock from "./TopDock";
import { ouvrirConfort } from "./point/Point";
import "./SiteDocks.css";

export function GlobalDock({ accueil, studio, importer, ouvrages, visite, preferences, preparation = false }: { accueil: () => void; studio: () => void; importer: () => void; ouvrages: () => void; visite?: () => void; preferences?: () => void; preparation?: boolean }) {
  return <div className="pz-site-docks"><TopDock label="Navigation Point Zéro" idBloc="pz-menu-global"
    marque={<button type="button" className="pzs-tool pzs-marque" onClick={accueil}>Point Zéro</button>}
    menu={[{ label: "Accueil", faire: accueil }, ...(!preparation ? [{ label: "Importer", faire: importer }] : []), { label: "Studio", faire: studio }, ...(!preparation ? [{ label: "Mes ouvrages", faire: ouvrages }] : []), { label: "Confort", faire: ouvrirConfort }, ...(preferences ? [{ label: "Préférences du studio", faire: preferences }] : []), ...(visite ? [{ label: "Visite avec Le Point", faire: visite }] : [])]}
    droite={<button type="button" className="pzs-tool pzs-noir" onClick={ouvrages} disabled={preparation} title={preparation ? "Terminez ou quittez la préparation avant de changer d’ouvrage" : undefined}>Mes ouvrages</button>}>
    <button type="button" className="pzs-tool" onClick={importer} disabled={preparation} title={preparation ? "Une préparation est en cours" : undefined}>Importer</button>
    <button type="button" className="pzs-tool" onClick={studio}>Studio</button>
  </TopDock></div>;
}
export function ContextDock({ label, children }: { label: string; children: ReactNode }) {
  return <nav className="pz-context-dock" aria-label={label}>{children}</nav>;
}
