/**
 * Le type de bloc « broderie » : ses commandes pour le Point du bloc.
 * Elles appellent les vraies actions de l'atelier (rien de simulé) ; le registre ne sait rien de la broderie, ce fichier si.
 */
import { Grid3x3, Maximize, Palette, Pencil, Search, Shapes } from "lucide-react";
import { enregistrerTypeBloc, typeBloc } from "../../lib/point/registre";

export interface ContexteBroderie {
  symboles: boolean; patron: boolean; loupe: boolean;
  points: () => void; fils: () => void; basculerSymboles: () => void; basculerPatron: () => void; basculerLoupe: () => void; toutVoir: () => void;
}

if (!typeBloc("broderie")) enregistrerTypeBloc<ContexteBroderie>({
  id: "broderie", nom: "Broderie",
  commandes: c => [
    { id: "loupe", nom: "Loupe", icone: <Search aria-hidden="true" />, aide: "la grille agrandie sous le pointeur ou à la case choisie au clavier", groupe: "socle", actif: c.loupe, ouvrir: c.basculerLoupe },
    { id: "tout-voir", nom: "Tout voir", icone: <Maximize aria-hidden="true" />, aide: "le patron entier à l’écran", groupe: "socle", ouvrir: c.toutVoir },
    { id: "points", nom: "Points", icone: <Pencil aria-hidden="true" />, aide: "la croix, le demi-point, le point arrière et tous les outils de dessin", groupe: "metier", ouvrir: c.points },
    { id: "fils", nom: "Fils", icone: <Palette aria-hidden="true" />, aide: "le nuancier DMC et le fil actif", groupe: "metier", ouvrir: c.fils },
    { id: "symboles", nom: "Symboles", icone: <Shapes aria-hidden="true" />, aide: "les symboles par-dessus les couleurs", groupe: "metier", actif: c.symboles, ouvrir: c.basculerSymboles },
    { id: "patron", nom: "Patron", icone: <Grid3x3 aria-hidden="true" />, aide: "la grille à suivre, case par case ; un second geste revient au rendu réaliste", groupe: "metier", actif: c.patron, ouvrir: c.basculerPatron },
  ],
});
