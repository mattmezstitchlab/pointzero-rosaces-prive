/**
 * L'édition (la landing sous le héros) : le même Point en présentation « scène », de vraies actions, le vrai moteur 5D.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import Edition from "../components/edition/Edition";
import { progression, etapeDe } from "../components/edition/defilement";
import { rosaceDe, visibilite } from "../components/edition/rosace";
import { generer } from "../lib/motif5d/generer";
import { recetteDe, RECETTES } from "../lib/motif5d/recettes";

describe("Le défilement et la rosace qui naît", () => {
  it("une progression bornée, des étapes qui ne changent qu'aux seuils", () => {
    expect(progression(0, 3000, 1000)).toBe(0);
    expect(progression(-1000, 3000, 1000)).toBe(0.5);
    expect(progression(-5000, 3000, 1000)).toBe(1);
    expect(etapeDe(0.31, [0, 0.08, 0.3, 0.45, 0.82])).toBe(2);
  });
  it("la rosace est le motif réel du moteur 5D, case pour case", () => {
    const r = recetteDe(RECETTES[8].code), ro = rosaceDe(r.signature, r.graine, 81);
    const { pattern } = generer({ ...r, w: 81, h: 81 });
    expect(ro.cases.length).toBe([...pattern.cross].filter(v => v >= 0).length);
    for (const c of ro.cases.slice(0, 200)) expect(pattern.cross[c.y * 81 + c.x]).toBe(c.f);
  });
  it("chaque case naît une fois et ne disparaît plus : centre, secteur, huit secteurs, anneaux, tout", () => {
    const r = recetteDe(RECETTES[8].code), ro = rosaceDe(r.signature, r.graine, 81);
    const vues = (p: number) => ro.cases.filter(c => visibilite(c, p) > 0.5).length;
    const suite = [0.02, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.85, 1].map(vues);
    for (let k = 1; k < suite.length; k++) expect(suite[k]).toBeGreaterThanOrEqual(suite[k - 1]);
    expect(suite[suite.length - 1]).toBe(ro.cases.length);
    const unSecteur = ro.cases.filter(c => visibilite(c, 0.29) > 0.5);
    expect(new Set(unSecteur.filter(c => c.d > 0.05).map(c => c.secteur))).toEqual(new Set([0]));
  });
});

const saved = { matchMedia: globalThis.matchMedia, getContext: HTMLCanvasElement.prototype.getContext };
beforeAll(() => {
  (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) as unknown as typeof globalThis.matchMedia;
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});
afterAll(() => { globalThis.matchMedia = saved.matchMedia; HTMLCanvasElement.prototype.getContext = saved.getContext; });
let root: Root | null = null, hote: HTMLElement | null = null;
afterEach(async () => { await act(async () => root?.unmount()); root = null; hote?.remove(); hote = null; });
const cliquer = async (el: Element | null | undefined) => { expect(el).toBeTruthy(); await act(async () => { el!.dispatchEvent(new MouseEvent("click", { bubbles: true })); }); };
const dans = (scene: string, id: string) => document.querySelector<HTMLButtonElement>(`#${scene} [data-mode="${id}"]`);

describe("Trois scènes, le même Point, de vraies actions", () => {
  it("le disque est ouvert dans la page, sans bouton ni ovale noir, et sans voler le focus", async () => {
    const ouvrir = vi.fn();
    hote = document.createElement("div"); document.body.appendChild(hote); root = createRoot(hote);
    await act(async () => { root!.render(<Edition actions={{ ouvrir, importer: vi.fn(), visite: vi.fn() }} />); });
    expect(document.querySelectorAll(".ed .lp-anneau.lp-scene").length).toBe(3);
    expect(document.querySelector(".ed .lp-point")).toBeNull();
    expect(document.activeElement).toBe(document.body);
    for (const s of ["ed-origine", "ed-rosace", "ed-fils"]) expect(document.querySelector(`#${s} [role=menu] [data-mode="confort"]`)).toBeTruthy(); // Confort, toujours premier
    await cliquer(dans("ed-origine", "creer"));
    expect(document.querySelector(".lp-centre-mot")).toBeNull();
    await cliquer(dans("ed-origine", "creer-motif"));
    expect(ouvrir).toHaveBeenCalledWith("create");
    expect(dans("ed-origine", "creer-motif")).toBeTruthy(); // en scène, le disque reste ouvert
  });
  it("la rosace change avec les choix du disque (moteur 5D), le nuancier choisit un vrai fil", async () => {
    hote = document.createElement("div"); document.body.appendChild(hote); root = createRoot(hote);
    await act(async () => { root!.render(<Edition actions={{ ouvrir: vi.fn(), importer: vi.fn(), visite: vi.fn() }} />); });
    const recette = () => document.querySelector(".ed-recette code")!.textContent;
    expect(recette()).toBe(RECETTES[8].code);
    await cliquer(dans("ed-rosace", "structure")); await cliquer(dans("ed-rosace", "structure-1"));
    expect(recette()).toMatch(/^5D-2/);
    await cliquer(dans("ed-rosace", "__retour")); await cliquer(dans("ed-rosace", "variation"));
    expect(recette()).toMatch(/\.g60\./);
    expect(document.querySelector(".ed-fiche-code")!.textContent).toBe("DMC 321");
    await cliquer(dans("ed-fils", "famille-bleus"));
    const nuance = document.querySelector<HTMLButtonElement>('#ed-fils [data-mode^="dmc-"]')!;
    await cliquer(nuance);
    expect(document.querySelector(".ed-fiche-code")!.textContent).toBe("DMC " + nuance.dataset.mode!.slice(4));
    expect(document.querySelector(".ed-fiche")!.textContent).toMatch(/simulation/);
  });
});
