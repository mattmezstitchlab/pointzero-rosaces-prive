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
import { appliquer, coinsInitiaux, convexe, homographie, matrix3d } from "../lib/tambour/homographie";
import { ecrireCoins, lireCoins, resteAFaire } from "../lib/tambour/superposition";
import { commandesSuperposition, type ContexteSuperposition } from "../components/blocs/superposition";

const ctx = (o: Partial<ContexteTambour> = {}): ContexteTambour => ({ camera: "repos", basculerCamera: vi.fn(), aSource: false, vue: "points", afficher: vi.fn(), couleurs: 8, choisirCouleurs: vi.fn(),
  cote: 64, choisirCote: vi.fn(), fils: [3, 7], voisins: () => [10, 11, 12], echanger: vi.fn(), echanges: 0, annulerEchanges: vi.fn(), fige: false, figer: vi.fn(), capturer: vi.fn(), importer: vi.fn(), superposer: vi.fn(), ...o });

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
    expect(commandesDuBloc("tambour", ctx()).map(m => m.id)).toEqual(["camera", "vues", "couleurs", "detail", "fils", "figer", "capturer", "photo", "superposer"]);
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

describe("Superposer un patron (lot B) : la perspective par quatre coins", () => {
  const carreUnite = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }];
  it("l'homographie envoie exactement chaque coin sur sa cible, même en perspective", () => {
    const vers = [{ x: 30, y: 20 }, { x: 260, y: 40 }, { x: 240, y: 210 }, { x: 10, y: 180 }];
    const h = homographie(carreUnite, vers)!;
    carreUnite.forEach((p, i) => { const q = appliquer(h, p); expect(q.x).toBeCloseTo(vers[i].x, 6); expect(q.y).toBeCloseTo(vers[i].y, 6); });
    /* le centre du patron tombe au croisement des diagonales du quadrilatère (propriété d'une vraie perspective) */
    const c = appliquer(h, { x: 50, y: 25 });
    const croise = (a: { x: number; y: number }, b: typeof a, d: typeof a, e: typeof a) => { const t = ((d.x - a.x) * (e.y - d.y) - (d.y - a.y) * (e.x - d.x)) / ((b.x - a.x) * (e.y - d.y) - (b.y - a.y) * (e.x - d.x)); return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }; };
    const k = croise(vers[0], vers[2], vers[1], vers[3]); expect(c.x).toBeCloseTo(k.x, 6); expect(c.y).toBeCloseTo(k.y, 6);
  });
  it("une simple mise à l'échelle donne une matrice CSS sans perspective", () => {
    const h = homographie(carreUnite, carreUnite.map(p => ({ x: p.x * 2 + 5, y: p.y * 2 + 7 })))!;
    expect(matrix3d(h)).toBe("matrix3d(2,0,0,0,0,2,0,0,0,0,1,0,5,7,0,1)");
  });
  it("refuse trois coins alignés ; un quadrilatère retourné ou croisé n'est pas convexe", () => {
    expect(homographie(carreUnite, [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }, { x: 0, y: 5 }])).toBeNull();
    expect(convexe([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }])).toBe(true);
    expect(convexe([{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 0 }])).toBe(false);
    expect(convexe([{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 0 }, { x: 0, y: 1 }])).toBe(false);
  });
  it("au départ, le patron est centré dans le tambour, à son format", () => {
    const q = coinsInitiaux(80, 40);
    expect(q[0].x).toBeCloseTo(.15); expect(q[1].x).toBeCloseTo(.85); expect(q[2].y - q[1].y).toBeCloseTo(.35); expect((q[0].y + q[3].y) / 2).toBeCloseTo(.5);
  });
  it("les points à faire viennent du suivi de l'ouvrage ; les coins sont retenus par ouvrage", () => {
    const p = createPattern("t", 3, 1); p.cross.set([4, 4, 9]); p.done[0] = 1;
    expect(resteAFaire(p)).toBe(2); expect(resteAFaire(p, 4)).toBe(1); expect(resteAFaire(p, 9)).toBe(1);
    const q = coinsInitiaux(3, 1); ecrireCoins("abc", q); expect(lireCoins("abc")![1].x).toBeCloseTo(q[1].x, 3); expect(lireCoins("autre")).toBeNull();
  });
  it("le menu Superposer : chaque feuille appelle sa vraie action", () => {
    const c: ContexteSuperposition = { camera: "active", basculerCamera: vi.fn(), patron: { id: "a", nom: "Rose" }, ouvrages: [{ id: "a", nom: "Rose" }, { id: "b", nom: "Givre" }], choisirPatron: vi.fn(),
      affichage: "aplats", afficher: vi.fn(), palette: [3, 7], couleur: null, choisirCouleur: vi.fn(), opacite: 50, choisirOpacite: vi.fn(), aFaire: false, basculerAFaire: vi.fn(), reste: 120,
      reinitialiserCoins: vi.fn(), fige: false, figer: vi.fn(), creer: vi.fn() };
    expect(commandesDuBloc("superposition", c).map(m => m.id)).toEqual(["camera", "patron", "affichage", "opacite", "afaire", "coins", "figer", "creer"]);
    const l = commandesSuperposition(c), f = (id: string) => l.find(m => m.id === id)!;
    f("patron").enfants!()[1].ouvrir(); expect(c.choisirPatron).toHaveBeenCalledWith("b");
    f("affichage").enfants!().find(m => m.id === "aff-symboles")!.ouvrir(); expect(c.afficher).toHaveBeenCalledWith("symboles");
    f("affichage").enfants!().find(m => m.id === "aff-couleur")!.enfants!()[1].ouvrir(); expect(c.choisirCouleur).toHaveBeenCalledWith(7);
    expect(f("opacite").enfants!().map(m => m.valeur)).toEqual(["25 %", "50 %", "75 %", "100 %"]);
    f("afaire").ouvrir(); expect(c.basculerAFaire).toHaveBeenCalled(); expect(f("afaire").aide).toContain("120");
    f("coins").enfants!()[0].ouvrir(); expect(c.reinitialiserCoins).toHaveBeenCalled();
    f("creer").ouvrir(); expect(c.creer).toHaveBeenCalled();
  });
});
