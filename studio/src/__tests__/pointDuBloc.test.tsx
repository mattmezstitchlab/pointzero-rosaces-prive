/**
 * Un bloc → un Point → un menu radial contextuel : le registre des types de blocs, la place du Point sur le bord du bloc,
 * puis l'essai dans l'atelier (outils de broderie réellement branchés, retour au dock).
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "../App";
import AccessibilityShell from "../components/AccessibilityShell";
import { commandesDuBloc, enregistrerTypeBloc, ESSAI_BLOC_CLE, placePointDuBloc, typeBloc } from "../lib/point/registre";
import "../components/blocs/broderie";

describe("Le registre des types de blocs", () => {
  it("un type déclare ses commandes ; Confort n'y figure jamais (le Point l'apporte)", () => {
    enregistrerTypeBloc<{ n: number }>({ id: "essai-photo", nom: "Photo", commandes: c => [
      { id: "recadrer", nom: "Recadrage", aide: "a", groupe: "metier", ouvrir: () => {} },
      { id: "lumiere", nom: "Lumière", aide: "b", groupe: "metier", actif: c.n > 0, ouvrir: () => {} }] });
    expect(commandesDuBloc("essai-photo", { n: 1 }).map(m => m.id)).toEqual(["recadrer", "lumiere"]);
    expect(commandesDuBloc("inconnu", {})).toEqual([]);
    expect(() => enregistrerTypeBloc({ id: "essai-photo", nom: "x", commandes: () => [] })).toThrow(/déjà/);
    enregistrerTypeBloc({ id: "essai-faux", nom: "x", commandes: () => [{ id: "confort", nom: "Confort", aide: "", groupe: "acces", ouvrir: () => {} }] });
    expect(() => commandesDuBloc("essai-faux", {})).toThrow(/Confort/);
  });
  it("la broderie est enregistrée avec des commandes métier, sans Confort", () => {
    expect(typeBloc("broderie")?.nom).toBe("Broderie");
  });
  it("le Point se pose au bord droit du bloc, sinon dessous, toujours dans l'écran", () => {
    expect(placePointDuBloc({ x: 400, y: 200, w: 600, h: 400 }, { w: 1440, h: 900 })).toEqual({ left: 1010, top: 377, bord: "droite" });
    const t = placePointDuBloc({ x: 40, y: 290, w: 310, h: 310 }, { w: 390, h: 844 });
    expect(t.bord).toBe("dessous"); expect(t.left).toBe(304); expect(t.left + 46).toBeLessThanOrEqual(380); // sous le coin droit
    const bas = placePointDuBloc({ x: 0, y: 500, w: 390, h: 600 }, { w: 390, h: 844 });
    expect(bas.top + 46).toBeLessThanOrEqual(834);
  });
});

vi.mock("../lib/library", async importOriginal => ({ ...await importOriginal<typeof import("../lib/library")>(), saveLibrary: vi.fn().mockResolvedValue(undefined) }));
const saved = { matchMedia: globalThis.matchMedia, ResizeObserver: globalThis.ResizeObserver, getContext: HTMLCanvasElement.prototype.getContext };
beforeAll(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof globalThis.matchMedia;
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof globalThis.ResizeObserver;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});
afterAll(() => { globalThis.matchMedia = saved.matchMedia; globalThis.ResizeObserver = saved.ResizeObserver; HTMLCanvasElement.prototype.getContext = saved.getContext; });
let root: Root | null = null, container: HTMLElement | null = null;
const attendre = () => act(async () => { for (let k = 0; k < 4; k++) await new Promise(r => requestAnimationFrame(() => r(null))); });
const cliquer = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { el!.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); await attendre(); };
async function ouvrir() {
  window.history.replaceState(null, "", "/atelier");
  localStorage.setItem("pointzero:visite-docks:v1", "vue");
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root!.render(<AccessibilityShell><App /></AccessibilityShell>); });
  await attendre();
}
const secteurs = () => [...document.querySelectorAll<HTMLButtonElement>('[data-presentation] [role="menuitem"]')];
beforeEach(() => localStorage.clear());
afterEach(async () => { await act(async () => root?.unmount()); root = null; container?.remove(); container = null; localStorage.clear(); });

describe("L'essai : les outils sur le bloc", () => {
  it("se choisit dans le menu AIME, remplace le dock du bas par le Point du bloc, et se défait", async () => {
    await ouvrir();
    expect(container!.querySelector(".pzs-bottom")).toBeTruthy();
    await cliquer(container!.querySelector("#pzs-brand"));
    await cliquer([...container!.querySelectorAll("#pzs-bloc button")].find(b => b.textContent === "Essai : les outils sur le bloc"));
    expect(localStorage.getItem(ESSAI_BLOC_CLE)).toBe("1");
    expect(container!.querySelector(".pzs-bottom")).toBeNull();
    expect(document.querySelectorAll(".lp-point").length).toBe(1);
    expect(document.querySelector(".lp-contexte")?.getAttribute("data-contexte")).toBe("bloc-broderie");
    await cliquer(container!.querySelector("#pzs-brand"));
    await cliquer([...container!.querySelectorAll("#pzs-bloc button")].find(b => b.textContent === "Revenir au dock du bas"));
    expect(container!.querySelector(".pzs-bottom")).toBeTruthy();
    expect(localStorage.getItem(ESSAI_BLOC_CLE)).toBeNull();
  });
  it("le menu du bloc : Confort d'abord, puis les seuls outils de la broderie, réellement branchés", async () => {
    localStorage.setItem(ESSAI_BLOC_CLE, "1");
    await ouvrir();
    await cliquer(document.querySelector(".lp-point"));
    expect(secteurs().map(s => s.dataset.mode)).toEqual(["confort", "loupe", "tout-voir", "points", "fils", "symboles", "patron"]);
    await cliquer(secteurs().find(s => s.dataset.mode === "symboles"));
    await cliquer(document.querySelector(".lp-point"));
    expect(secteurs().find(s => s.dataset.mode === "symboles")!.getAttribute("aria-label")).toMatch(/^Symboles, actif/);
    await cliquer(secteurs().find(s => s.dataset.mode === "loupe"));
    expect(container!.querySelector(".pzs-loupe-dock")).toBeTruthy();
    await cliquer(document.querySelector(".lp-point"));
    await cliquer(secteurs().find(s => s.dataset.mode === "points"));
    expect(container!.querySelector('[data-guide="outil-cross"]')).toBeTruthy(); // la grille des points s'est dépliée
  });
});
