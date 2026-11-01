import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
const site = vi.hoisted(() => ({ broderie: false }));
vi.mock("../lib/site", () => ({ get SITE_BRODERIE() { return site.broderie; }, PROTOTYPES: false, GALERIE: false }));
import CrossStitchHome from "../components/CrossStitchHome";
import { entryStudio, publicPathFor } from "../lib/entryNavigation";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  localStorage.clear();
  site.broderie = false;
  vi.restoreAllMocks();
});
function mount(extra: { onOuvrages?: () => void; onShare?: () => void; onVisite?: () => void } = {}) {
  const onOpen = vi.fn(), onImport = vi.fn();
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() => root!.render(<CrossStitchHome projectName="Roses de famille" onOpen={onOpen} onImport={onImport} {...extra}/>));
  return { view: host, onOpen, onImport };
}
describe("Point Zéro spécialisé", () => {
  it("ouvre la racine spécialisée et conserve les destinations historiques", () => {
    expect(entryStudio("", "", "/")).toBe("stitch-home");
    expect(publicPathFor("stitch-home")).toBe("/");
    expect(entryStudio("", "", "/aime")).toBe("stitch-home");
    expect(entryStudio("?studio=embroidery", "", "/atelier")).toBe("embroidery");
    expect(entryStudio("", "", "/atelier")).toBe("embroidery");
    expect(publicPathFor("embroidery")).toBe("/atelier");
  });
  it("ne crée ni ne remplace de données à l’ouverture", () => {
    localStorage.setItem("ouvrage", "données existantes");
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { view, onOpen } = mount();
    expect(view.querySelectorAll("h1")).toHaveLength(1);
    expect(view.textContent).toContain("Roses de famille");
    expect(view.textContent).toContain("son effacement supprime les projets locaux");
    expect(view.querySelector("iframe")).toBeNull();
    expect(view.textContent).toContain("Le puzzle PDF");
    expect(view.querySelector("h1")?.textContent).toBe("Point Zéro");
    expect(view.querySelector(".ru .ed-brode-photo")?.getAttribute("src")).toMatch(/met-palampore/);
    expect(write).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    expect(localStorage.getItem("ouvrage")).toBe("données existantes");
  });
  it("relie chaque action à son intention, sans catalogue d’univers généralistes", () => {
    const { view, onOpen } = mount();
    const actions = [
      ["Mes ouvrages", "library"], ["Créer mon patron", "create"],
      ["Préparer", "prepare"], ["Continuer à broder", "stitch"],
    ];
    for (const [label, intent] of actions) {
      const button = [...view.querySelectorAll("button")].find(b => b.textContent === label || b.textContent?.includes(label + " "))!;
      act(() => button.click());
      expect(onOpen).toHaveBeenLastCalledWith(intent);
    }
    expect(view.querySelector('a[href="/aime"]')).toBeNull();
    expect(view.textContent).not.toContain("Architecture mère");
    expect(view.querySelector('a[href="#csh-import"]')).not.toBeNull();
  });
  it("transmet le fichier choisi une seule fois et accepte de le sélectionner à nouveau", () => {
    const { view, onImport } = mount();
    const input = view.querySelector<HTMLInputElement>('input[aria-label="Importer une image, un PDF ou un projet"]')!;
    expect(input.accept).toContain(".oxs");
    expect(input.accept).toContain(".pdf");
    const file = new File(["image"], "souvenir.png", { type: "image/png" });
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(onImport).toHaveBeenCalledExactlyOnceWith(file);
    expect(input.value).toBe("");
    Object.defineProperty(input, "files", { configurable: true, value: [] });
    act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(onImport).toHaveBeenCalledTimes(1);
  });
  it("suit la charte AIME : dock du haut, « + Entrer » vers Mes ouvrages, dock du bas des sections", () => {
    const onOuvrages = vi.fn(), onShare = vi.fn(), onVisite = vi.fn();
    const { view, onOpen } = mount({ onOuvrages, onShare, onVisite });
    expect(view.querySelector('nav[aria-label="Navigation point de croix"]')).toBeTruthy();
    const enter = view.querySelector<HTMLButtonElement>('button[aria-label="Entrer dans Point Zéro"]')!;
    act(() => enter.click());
    expect(onOuvrages).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
    const bottom = view.querySelector('nav[aria-label="Sections de la page"]')!;
    expect([...bottom.querySelectorAll("a")].map(a => a.textContent)).toEqual(["Le studio", "Le Point", "Tout le studio", "Commencer"]);
    expect([...bottom.querySelectorAll("a")].map(a => a.getAttribute("href"))).toEqual(["#chapitres", "#ch-point", "#tout", "#commencer"]);
    for (const id of ["chapitres", "ch-point", "tout", "commencer"]) expect(view.querySelector("#" + id)).toBeTruthy();
    act(() => bottom.querySelector<HTMLButtonElement>('button[aria-label^="Le Point"]')!.click());
    expect(onVisite).toHaveBeenCalledTimes(1);
    const brand = view.querySelector<HTMLButtonElement>('button[aria-label="Menu Point Zéro"]')!;
    act(() => brand.click());
    expect(brand.getAttribute("aria-expanded")).toBe("true");
    expect([...view.querySelectorAll("#pzh-menu button")].map(b => b.textContent)).not.toContain("Boutique de patrons");
    act(() => [...view.querySelectorAll<HTMLButtonElement>("#pzh-menu button")].find(b => b.textContent === "Faire la visite avec Le Point")!.click());
    expect(onVisite).toHaveBeenCalledTimes(2);
    expect(view.querySelector("#pzh-menu")).toBeNull();
    const invite = [...view.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent?.includes("Inviter à regarder"))!;
    act(() => invite.click());
    expect(onShare).toHaveBeenCalled();
    expect(view.textContent).toContain("Bientôt");
  });
  it("explique par l’image : le fond floral de la une, brodé sous la loupe, puis huit chapitres illustrés et tout le studio", () => {
    const { view, onOpen } = mount();
    expect(view.querySelector("#editions")).toBeNull();
    expect(view.querySelector(".ru .ed-brode-vue")?.getAttribute("aria-label")).toMatch(/palampore.*points de croix/);
    expect(view.querySelector(".ru figcaption")?.textContent).toMatch(/domaine public/);
    const chapitres = view.querySelectorAll("#chapitres .ch");
    expect(chapitres).toHaveLength(8);
    for (const c of chapitres) {
      expect(c.querySelector("h2")?.textContent, c.id).toBeTruthy();
      const imgs = c.querySelectorAll<HTMLImageElement>(".ch-ecran img");
      expect(imgs.length, c.id).toBeGreaterThanOrEqual(1);
      for (const im of imgs) { expect(im.alt.length, c.id).toBeGreaterThan(10); expect(im.getAttribute("src")).toMatch(/images\/landing\/ecran-.+\.webp$/); }
    }
    expect(view.querySelector("#ch-lectures")!.querySelectorAll(".ch-ecran img")).toHaveLength(3);
    const index = view.querySelector('nav[aria-label="Chapitres"]')!;
    expect([...index.querySelectorAll("a")].map(a => a.getAttribute("href"))).toEqual([...chapitres].map(c => "#" + c.id));
    const tout = view.querySelector("#tout")!;
    expect(tout.querySelectorAll("dt")).toHaveLength(12);
    for (const t of ["demi-point", "point arrière", "puzzle PDF", "Miyuki Delica", "parking des fils", "PDF paginé", "contraste élevé"]) expect(tout.textContent).toContain(t);
    act(() => [...view.querySelectorAll<HTMLButtonElement>(".ru button")].find(b => b.textContent === "Créer mon patron")!.click());
    expect(onOpen).toHaveBeenLastCalledWith("create");
  });
  it("sans visite branchée, « Faire la visite » ouvre l’atelier", () => {
    const { view, onOpen } = mount();
    act(() => [...view.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Faire la visite avec Le Point")!.click());
    expect(onOpen).toHaveBeenCalledWith("create");
  });
  it("sans branchement, « + Entrer » ouvre mes ouvrages", () => {
    const { view, onOpen } = mount();
    act(() => view.querySelector<HTMLButtonElement>('button[aria-label="Entrer dans Point Zéro"]')!.click());
    expect(onOpen).toHaveBeenCalledWith("library");
  });
});


it("retire Tout le studio et ses ancres uniquement sur le site Broderie", () => {
  site.broderie = true;
  // Éviter les effets Canvas : ce test vise la structure de la navigation.
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  expect(view.querySelector("#tout")).toBeNull();
  expect(view.querySelector('[href="#tout"]')).toBeNull();
  expect(view.querySelector("#ed-rencontres")).toBeTruthy();
  expect(view.querySelector("#ed-histoire")).toBeNull();
  expect(view.querySelector('[href="#ed-rencontres"]')).toBeTruthy();
  expect(view.querySelector('[aria-label="Importer un PDF, une photo ou un projet"]')).toBeTruthy();
});


it("unifie les imports et rend chaque destination explicite sans perdre les formats", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const onOuvrages = vi.fn();
  const { view, onImport, onOpen } = mount({ onOuvrages });
  expect(view.querySelector("#csh-import")).toBeNull();
  expect(view.querySelector("#ed-histoire")).toBeNull();
  expect(view.querySelector('[href^="#hi-"]')).toBeNull();
  expect(view.querySelector("#ed-cadeau")).toBeNull();
  const imports = view.querySelectorAll<HTMLInputElement>(".ru #hero-import input[type=file]");
  expect(imports).toHaveLength(1);
  expect(view.querySelectorAll(".ru .pzh-import-pill")).toHaveLength(1);
  const input = imports[0];
  for (const ext of [".pdf", "image/png", "image/jpeg", "image/webp", ".json", ".oxs"]) expect(input.accept).toContain(ext);
  const fichiers = [new File(["%PDF"], "patron.pdf", { type: "application/pdf" }), new File(["image"], "photo.png", { type: "image/png" }), new File(["{}"], "ouvrage.json", { type: "application/json" }), new File(["<chart/>"], "ouvrage.oxs")];
  fichiers.forEach((file, n) => {
    Object.defineProperty(input, "files", { configurable: true, value: [file] });
    act(() => input.dispatchEvent(new Event("change", { bubbles: true })));
    expect(onImport).toHaveBeenNthCalledWith(n + 1, file);
    expect(input.value).toBe("");
  });
  const clic = vi.spyOn(input, "click");
  const dock = view.querySelector('nav[aria-label="Navigation Point Zéro"]')!;
  act(() => [...dock.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Importer")!.click());
  expect(clic).toHaveBeenCalledOnce();
  act(() => [...dock.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Studio")!.click());
  expect(onOpen).toHaveBeenLastCalledWith("stitch");
  act(() => [...dock.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Mes ouvrages")!.click());
  expect(onOuvrages).toHaveBeenCalledOnce();
  expect(view.querySelector(".ru")!.textContent).not.toContain("Créer mon patron");
  expect(view.querySelector('[href="#ed-fils"]')).toBeTruthy();
  expect(view.querySelector(".ru .mm-sommaire")).toBeNull();
  expect(view.querySelector(".tp-traine")).toBeTruthy();
  expect(view.querySelector('nav[aria-label="Actions de la page"]')).toBeTruthy();
  for (const lien of view.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) expect(view.querySelector(lien.getAttribute("href")!)).toBeTruthy();
});


it("pilote les Rencontres depuis le dock contextuel, sans navigation dans le héros", async () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  const section = view.querySelector<HTMLElement>("#ed-rencontres")!;
  vi.spyOn(section, "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 1000 } as DOMRect);
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(view.querySelector(".ru .mm-sommaire")).toBeNull();
  expect(section.querySelector(".ed-slides-onglets")).toBeNull();
  const dock = view.querySelector('nav[aria-label="Actions de la page"]')!;
  act(() => [...dock.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Suivant")!.click());
  expect(section.querySelector('[data-slide]:not([hidden]) #or-lignes')).toBeTruthy();
  const choix = dock.querySelector<HTMLSelectElement>("select")!;
  act(() => { choix.value = "4"; choix.dispatchEvent(new Event("change", { bubbles: true })); });
  expect(section.querySelector('[data-slide]:not([hidden]) #or-plein')).toBeTruthy();
  act(() => [...dock.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Précédent")!.click());
  expect(section.querySelector('[data-slide]:not([hidden]) #or-couleurs')).toBeTruthy();
});


it("relie le dock du nuancier à la recherche et à la fiche du fil", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  const section = view.querySelector<HTMLElement>("#ed-fils")!;
  vi.spyOn(section, "getBoundingClientRect").mockReturnValue({ top: 0, bottom: 1000 } as DOMRect);
  act(() => window.dispatchEvent(new Event("scroll")));
  act(() => view.querySelector<HTMLButtonElement>('[data-nuancier="chercher"]')!.click());
  const champ = view.querySelector<HTMLInputElement>("#nuancier-dock-recherche")!;
  expect(champ).toBeTruthy();
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(champ, "310");
    champ.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const resultat = [...view.querySelectorAll<HTMLButtonElement>(".pz-recherche-fils li button")].find(b => b.textContent?.startsWith("DMC 310 ·"));
  expect(resultat).toBeTruthy();
  act(() => resultat!.click());
  expect(view.querySelector(".ed-fiche-code")!.textContent).toBe("DMC 310");
  expect(view.querySelector(".pz-recherche-fils")).toBeNull();
});
