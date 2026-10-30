/**
 * La carte ATLAS dans le Disque : le lien entre les deux systèmes, pas leur fusion.
 * Le centre montre ce qu'ATLAS a publié (titre, période, une phrase) et un lien sortant vers sa version publique.
 * Aucun lecteur de composition ici : la création s'ouvre dans ATLAS, dans un nouvel onglet, sans référent ni paramètre.
 * L'objet choisi (?o=type.id, filtré par lib/one/contextes) n'est qu'une référence, vérifiée par lib/one/atlas ; une référence non publiée le dit.
 */
import { useEffect } from "react";
import { ArrowUpRight, LayoutGrid } from "lucide-react";
import type { ContexteUnivers } from "../../lib/one/contextes";
import { LIEN_SORTANT, MESSAGES_ATLAS, referencesPubliees, resoudreAtlas, type ReferenceAtlas } from "../../lib/one/atlas";

/** « entree.e-cube-grille » → { type, id } ; le reste est refusé par resoudreAtlas */
const depuisObjet = (o: string): unknown => { const i = o.indexOf("."); return i < 1 ? null : { type: o.slice(0, i), id: o.slice(i + 1) }; };
const versObjet = (r: ReferenceAtlas) => r.type + "." + r.id;

/** ouvrir une adresse déjà résolue : nouvel onglet, sans référent, sans accès en retour à cette page */
const ouvrir = (adresse: string) => { window.open(adresse, "_blank", "noopener,noreferrer"); };

export const ATLAS: ContexteUnivers = {
  id: "atlas", permissions: { partager: false, modifier: false, supprimer: false },
  Composant({ etat, outils, publier }) {
    const publiees = referencesPubliees();
    const demandee = etat.o ? resoudreAtlas(depuisObjet(etat.o)) : null;
    useEffect(() => {
      publier([
        ...publiees.map(({ reference, publication }) => {
          const r = resoudreAtlas(reference);
          return { id: "atlas-" + reference.id, nom: publication.titre, groupe: "metier" as const, icone: <ArrowUpRight aria-hidden="true" />,
            aide: "ouvrir sa version publique dans ATLAS (nouvel onglet)", ouvrir: () => { if (r.ok) ouvrir(r.adresse); else outils.dire(r.message); } };
        }),
        { id: "atlas-compositions", nom: "Compositions", groupe: "metier" as const, icone: <LayoutGrid aria-hidden="true" />,
          aide: "les compositions publiques d’ATLAS", ouvrir: () => outils.dire(MESSAGES_ATLAS["route-a-confirmer"]) },
      ], demandee && !demandee.ok ? demandee.message : "ATLAS, l’application du Cube : ses créations publiques s’ouvrent chez elle, dans un nouvel onglet.");
    }, [etat.o]); // eslint-disable-line react-hooks/exhaustive-deps

    return <div className="dq-atlas">
      <p className="dq-atlas-sur"><span className="dq-atlas-carre" aria-hidden="true" />ATLAS · application indépendante</p>
      {demandee && !demandee.ok && <p className="dq-atlas-refus" role="status">{demandee.message}</p>}
      <ul className="dq-atlas-liste">
        {publiees.map(({ reference, publication }) => {
          const r = resoudreAtlas(reference), choisie = etat.o === versObjet(reference);
          return <li key={versObjet(reference)} aria-current={choisie ? "true" : undefined}>
            <p className="dq-atlas-titre">{publication.titre}</p>
            {publication.periode && <p className="dq-atlas-periode">{publication.periode}</p>}
            <p>{publication.phrase}</p>
            {r.ok
              ? <a className="one-bouton one-bouton-plein" href={r.adresse} {...LIEN_SORTANT}>Ouvrir dans ATLAS<ArrowUpRight aria-hidden="true" /><span className="sr-only"> (site séparé, nouvel onglet)</span></a>
              : <p className="dq-atlas-refus">{r.message}</p>}
          </li>;
        })}
      </ul>
    </div>;
  },
};
