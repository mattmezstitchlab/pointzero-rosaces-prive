/**
 * Essai privé : la carte vivante. Une seule carte fictive, trois formes et sa page, un carrousel, un retournement accessible.
 * Indépendant du studio : ni la loupe, ni le Dock Radial, ni le Bureau éditorial ne sont montés ou modifiés.
 * Adresse : /essai-carte (comme /essai-image).
 */
import { useState } from "react";
import CarteVivante from "../components/carte/CarteVivante";
import { CARTE_EXEMPLE } from "../lib/carte/exemple";
import { FORMATS, modulesVisibles, NOMS_MODULES, ROLES, type Format, type Role } from "../lib/carte/carte";
import "./EssaiCarte.css";

export default function EssaiCarte() {
  const [format, setFormat] = useState<Format>("verticale"), [role, setRole] = useState<Role>("visiteur");
  const visibles = modulesVisibles(CARTE_EXEMPLE, role);
  return <main className="ec">
    <header className="ec-tete">
      <p className="ec-sur">Essai privé · Point Zéro</p>
      <h1>La carte vivante</h1>
      <p className="ec-chapeau">Une identité, plusieurs formes. La même carte devient sa propre page, sans changer d’adresse, avec ses données et ses gestes.</p>
    </header>
    <div className="ec-reglages">
      <div className="ec-groupe" role="group" aria-label="Forme de la carte">
        {FORMATS.map(f => <button key={f.id} type="button" aria-pressed={format === f.id} onClick={() => setFormat(f.id)} title={f.aide}>{f.nom}</button>)}
      </div>
      <div className="ec-groupe" role="group" aria-label="Regarder la carte en tant que">
        {ROLES.map(r => <button key={r.id} type="button" aria-pressed={role === r.id} onClick={() => setRole(r.id)}>{r.nom}</button>)}
      </div>
    </div>
    <CarteVivante carte={CARTE_EXEMPLE} role={role} format={format} onFormat={setFormat} />
    <p className="ec-note">Modules visibles pour ce rôle : {visibles.map(t => NOMS_MODULES[t].toLowerCase()).join(", ")}.<br />
      Démonstration sans données personnelles réelles : aucune demande n’est envoyée.</p>
  </main>;
}
