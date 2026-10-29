/**
 * Essai privé : la carte vivante. Une seule carte fictive, ses formes et sa page, un carrousel, un retournement accessible.
 * Indépendant du studio : ni la loupe, ni le Dock Radial, ni le Bureau éditorial ne sont montés ou modifiés.
 * Adresse : /essai-carte (comme /essai-image). Direction artistique : l'atelier dans la pénombre, ivoire et cuivre.
 */
import { useState } from "react";
import { Layers, Link2, Sparkles, UserRound } from "lucide-react";
import CarteVivante from "../components/carte/CarteVivante";
import { CARTE_EXEMPLE } from "../lib/carte/exemple";
import { FORMATS, modulesVisibles, NOMS_MODULES, ROLES, type Format, type Role } from "../lib/carte/carte";
import "./EssaiCarte.css";

const LEGENDES: Record<Format, [string, string]> = {
  ronde: ["01 · Carte ronde", "Une première impression, qui capte l’essentiel en un clin d’œil."],
  carree: ["02 · Carte carrée", "Une vignette de galerie, à poser parmi d’autres."],
  verticale: ["03 · Carte verticale", "Un format mobile clair et complet, pensé pour une consultation rapide."],
  page: ["04 · Carte page", "Toutes les informations se déploient, sans changer de page."],
};
const PILIERS = [
  { icone: <Layers aria-hidden="true" />, titre: "Un seul contenu", texte: "La même carte, partout, sans duplication." },
  { icone: <Sparkles aria-hidden="true" />, titre: "Plusieurs formats", texte: "Ronde, carrée, verticale ou page, selon le contexte." },
  { icone: <UserRound aria-hidden="true" />, titre: "Des rôles adaptés", texte: "Visiteur, client ou propriétaire : chacun voit ce qui lui est ouvert." },
  { icone: <Link2 aria-hidden="true" />, titre: "Un même lien", texte: "Une identité unique ; la carte devient sa page sans changer d’adresse." },
];

export default function EssaiCarte() {
  const [format, setFormat] = useState<Format>("verticale"), [role, setRole] = useState<Role>("visiteur");
  const visibles = modulesVisibles(CARTE_EXEMPLE, role);
  return <main className="ec">
    <header className="ec-tete">
      <div className="ec-centre">
        <h1>La carte vivante</h1>
        <p className="ec-sous">Une même carte, plusieurs formes</p>
        <p className="ec-chapeau">Une identité, plusieurs formats. La même carte devient sa propre page, sans changer d’adresse, avec ses données et ses gestes.</p>
      </div>
      <div className="ec-groupe ec-formes" role="group" aria-label="Forme de la carte">
        {FORMATS.map(f => <button key={f.id} type="button" aria-pressed={format === f.id} onClick={() => setFormat(f.id)} title={f.aide}>{f.nom}</button>)}
      </div>
      <div className="ec-groupe ec-roles" role="group" aria-label="Regarder la carte en tant que">
        {ROLES.map(r => <button key={r.id} type="button" aria-pressed={role === r.id} onClick={() => setRole(r.id)}>{r.nom}</button>)}
      </div>
    </header>
    <p className="ec-devise">Un seul lien, plusieurs expériences.</p>
    <div className="ec-scene">
      <CarteVivante carte={CARTE_EXEMPLE} role={role} format={format} onFormat={setFormat} />
      <div className="ec-legende"><p className="ec-num">{LEGENDES[format][0]}</p><p className="ec-desc">{LEGENDES[format][1]}</p></div>
    </div>
    <ul className="ec-piliers">{PILIERS.map(p => <li key={p.titre}>{p.icone}<div><b>{p.titre}</b><span>{p.texte}</span></div></li>)}</ul>
    <p className="ec-note">Modules visibles pour ce rôle : {visibles.map(t => NOMS_MODULES[t].toLowerCase()).join(", ")}.<br />
      Démonstration sans données personnelles réelles : aucune demande n’est envoyée.</p>
  </main>;
}
