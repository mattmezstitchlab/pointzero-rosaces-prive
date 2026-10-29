/**
 * Le Tambour vivant, lot A : la file « dernière image », le carré du tambour, les fils échangés, le passage vers l'atelier,
 * les commandes du Point, et le raccourci du centre (présent seulement quand on le demande).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { carreCentre, DerniereImage, echanger, filsParPresence, voisins, type Grille } from "../lib/tambour/vivant";
import { CLE_CAPTURE, deposer, reprendre } from "../lib/tambour/capture";
import { commandesTambour, type ContexteTambour } from "../components/blocs/tambour";
import { commandesDuBloc, typeBloc } from "../lib/point/registre";
import { createPattern } from "../lib/pattern";
import { FLOSS } from "../lib/dmc";
import LePoint from "../components/point/LePoint";

const ctx = (o: Partial<ContexteTambour> = {}): ContexteTambour => ({ camera: "repos", basculerCamera: vi.fn(), aSource: false, vue: "points", afficher: vi.fn(), couleurs: 8, choisirCouleurs: vi.fn(),
  cote: 64, choisirCote: vi.fn(), fils: [3, 7], voisins: () => [10, 11, 12], echanger: vi.fn(), echanges: 0, annulerEchanges: vi.fn(), fige: false, figer: vi.fn(), capturer: vi.fn(), importer: vi.fn(), ...o });

describe("Tambour vivant : le calcul", () => {
  it("le tambour garde le plus grand carré centré de l'image", () => {
    expect(carreCentre(1280, 720)).toEqual({ sx: 280, sy: 0, cote: 720 });
    expect(carreCentre(600, 800)).toEqual({ sx: 0, sy: 100, cote: 600 });
  });
  it("la dernière image gagne : pendant un calcul, les images suivantes se remplacent, aucune ne s'accumule", async () => {
    const vus: number[] = [], faits: number[] = [];
    let liberer: () => void = () => {};
    const file = new DerniereImage<number, number>(n => { vus.push(n); return n === 1 ? new Promise(r => { liberer = () => r(n); }) : Promise.resolve(n); }, r => faits.push(r));
    file.soumettre(1); file.soumettre(2); file.soumettre(3); file.soumettre(4);
    expect(file.occupe).toBe(true); expect(vus).toEqual([1]);
    liberer(); await new Promise(r => setTimeout(r, 0)); await new Promise(r => setTimeout(r, 0));
    expect(vus).toEqual([1, 4]); expect(faits).toEqual([1, 4]); expect(file.occupe).toBe(false);
  });
  it("échanger un fil ne touche pas la grille d'origine ; les fils sont rangés du plus présent au moins présent", () => {
    const g: Grille = { w: 3, h: 2, cross: Int16Array.from([5, 5, 9, -1, 5, 9]), palette: [5, 9] };
    const e = echanger(g, new Map([[9, 42]]));
    expect([...e.cross]).toEqual([5, 5, 42, -1, 5, 42]); expect(e.palette).toEqual([5, 42]); expect([...g.cross]).toEqual([5, 5, 9, -1, 5, 9]);
    expect(filsParPresence(g)).toEqual([{ fil: 5, n: 3 }, { fil: 9, n: 2 }]);
  });
  it("les voisins d'un fil sont des fils DMC proches, jamais lui-même", () => {
    const i = FLOSS.findIndex(f => f.code === "321"), v = voisins(i, 8);
    expect(v).toHaveLength(8); expect(v).not.toContain(i);
    const d = (j: number) => FLOSS[j].lab.reduce((s, x, k) => s + (x - FLOSS[i].lab[k]) ** 2, 0);
    expect(d(v[0])).toBeLessThanOrEqual(d(v[7]));
  });
  it("l'ouvrage passe à l'atelier par la session de l'onglet, une seule fois", () => {
    const p = createPattern("Mon tambour vivant", 4, 4); p.cross[0] = 12;
    expect(deposer(p)).toBe(true); expect(sessionStorage.getItem(CLE_CAPTURE)).toBeTruthy();
    const q = reprendre(); expect(q?.name).toBe("Mon tambour vivant"); expect(q?.cross[0]).toBe(12);
    expect(reprendre()).toBeNull(); expect(sessionStorage.getItem(CLE_CAPTURE)).toBeNull();
  });
});

describe("Le type de bloc « tambour »", () => {
  it("est enregistré, sans Confort, avec ses commandes dans l'ordre", () => {
    expect(typeBloc("tambour")?.nom).toBe("Tambour");
    expect(commandesDuBloc("tambour", ctx()).map(m => m.id)).toEqual(["camera", "vues", "couleurs", "detail", "fils", "figer", "capturer", "photo"]);
  });
  it("chaque feuille appelle sa vraie action", () => {
    const c = ctx({ echanges: 2 }), l = commandesTambour(c), f = (id: string) => l.find(m => m.id === id)!;
    f("camera").ouvrir(); expect(c.basculerCamera).toHaveBeenCalled();
    expect(f("couleurs").enfants!().map(m => m.valeur)).toEqual(["4", "6", "8", "12", "16", "24"]);
    f("couleurs").enfants!().find(m => m.id === "couleurs-16")!.ouvrir(); expect(c.choisirCouleurs).toHaveBeenCalledWith(16);
    f("detail").enfants!().find(m => m.id === "detail-80")!.ouvrir(); expect(c.choisirCote).toHaveBeenCalledWith(80);
    f("vues").enfants!().find(m => m.id === "vue-comparer")!.ouvrir(); expect(c.afficher).toHaveBeenCalledWith("comparer");
    const fils = f("fils").enfants!(); expect(fils[0].couleur).toBe(FLOSS[3].hex);
    fils[0].enfants!()[1].ouvrir(); expect(c.echanger).toHaveBeenCalledWith(3, 11);
    fils.find(m => m.id === "annuler-echanges")!.ouvrir(); expect(c.annulerEchanges).toHaveBeenCalled();
    f("capturer").ouvrir(); expect(c.capturer).toHaveBeenCalled();
  });
  it("la caméra ouverte se dit « Fermer la caméra », et l'état actif se voit", () => {
    const m = commandesTambour(ctx({ camera: "active" }))[0];
    expect(m.nom).toBe("Fermer la caméra"); expect(m.actif).toBe(true);
  });
});

describe("Le centre du Point (mode Tambour seulement)", () => {
  let root: Root | null = null, hote: HTMLDivElement | null = null;
  afterEach(() => { act(() => root?.unmount()); hote?.remove(); root = null; });
  const monter = (centre?: Parameters<typeof LePoint>[0]["centre"]) => {
    hote = document.createElement("div"); document.body.appendChild(hote); root = createRoot(hote);
    act(() => root!.render(<LePoint scene modes={[{ id: "confort", nom: "Confort", aide: "c", groupe: "acces", ouvrir: () => {} }, { id: "a", nom: "A", aide: "a", groupe: "metier", ouvrir: () => {} }]} centre={centre} />));
  };
  it("sans option, le centre reste une sphère décorative", () => {
    monter(); expect(hote!.querySelector(".lp-centre-action")).toBeNull(); expect(hote!.querySelector(".lp-anneau > .lp-centre")).not.toBeNull();
  });
  it("avec l'option, la sphère ouvre l'action ; elle reste un double, hors du clavier et du lecteur d'écran", () => {
    const ouvrir = vi.fn(); monter({ nom: "Caméra", aide: "ouvrir", ouvrir });
    const b = hote!.querySelector<HTMLButtonElement>(".lp-centre-action")!;
    expect(b.getAttribute("aria-hidden")).toBe("true"); expect(b.tabIndex).toBe(-1); expect(b.textContent).toBe("");
    act(() => b.click()); expect(ouvrir).toHaveBeenCalled();
  });
});
