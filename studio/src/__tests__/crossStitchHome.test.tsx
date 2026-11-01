import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
const site = vi.hoisted(() => ({ broderie: false }));
vi.mock("../lib/site", () => ({ get SITE_BRODERIE() { return site.broderie; }, PROTOTYPES: false, GALERIE: false }));
import { creation, codeDeCreation } from "../components/edition/creation";
import { lireCode } from "../lib/motif5d/code";
import { generer, formatParDefaut } from "../lib/motif5d/generer";
import { FLOSS } from "../lib/dmc";
vi.mock("../components/edition/Brode", async original => {
  const reel = await original<typeof import("../components/edition/Brode")>();
  return { ...reel, default: (props: Parameters<typeof reel.default>[0]) => props.fixation
    ? <figure className="ed-brode"><button type="button" className="ed-brode-vue" onClick={() => props.fixation!.surFixer({ x: 300, y: 300 })}>Fixer le cercle de test</button></figure>
    : <reel.default {...props} /> };
});
import CrossStitchHome from "../components/CrossStitchHome";
import { entryStudio, publicPathFor } from "../lib/entryNavigation";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let host: HTMLDivElement | undefined;
afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = undefined;
  creation.oublier();
  localStorage.clear();
  site.broderie = false;
  vi.restoreAllMocks();
});
function mount(extra: { onOuvrages?: () => void; onShare?: () => void; onVisite?: () => void; onStudio?: () => void } = {}) {
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


it("pilote les Rencontres depuis le disque et garde un seul bouton dans le dock", async () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  const section = view.querySelector<HTMLElement>("#ed-rencontres")!;
  act(() => window.dispatchEvent(new CustomEvent("pointzero:ouvrir-slide", { detail: section.id })));
  expect(view.querySelector(".ru .mm-sommaire")).toBeNull();
  expect(section.querySelector(".ed-slides-onglets")).toBeNull();
  const dock = view.querySelector('nav[aria-label="Actions de la page"]')!;
  expect(dock.querySelectorAll("button")).toHaveLength(1);
  expect(dock.textContent).toBe("Créer ma rosace");
  expect(dock.querySelector("select")).toBeNull();
  const suivant = () => act(() => section.querySelector<HTMLButtonElement>('[data-mode="question-suivante"]')!.click());
  suivant();
  expect(section.querySelector('[data-mode="reponse-trace-0"]')).toBeTruthy();
  suivant(); suivant(); suivant();
  expect(section.querySelector('[data-mode="reponse-densite-0"]')).toBeTruthy();
  act(() => section.querySelector<HTMLButtonElement>('[data-mode="question-precedente"]')!.click());
  expect(section.querySelector('[data-mode="reponse-palette-0"]')).toBeTruthy();
});


it("le premier écran présente directement le grand disque DMC et conserve le fil choisi", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  expect(view.querySelector(".pz-photo-couronne")).toBeNull();
  expect(view.querySelector('#ed-fils [role="menu"]')).toBeTruthy();
  act(() => view.querySelector<HTMLButtonElement>('#ed-fils [data-mode="famille-bleus"]')!.click());
  const nuance = view.querySelector<HTMLButtonElement>('#ed-fils [data-mode^="dmc-"]')!;
  act(() => nuance.click());
  expect(view.querySelector("#ed-fils .ed-fiche-code")!.textContent).toBe("DMC " + nuance.dataset.mode!.slice(4));

});


it("déplace Reprendre dans le héros sans liens vers une section supprimée", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const onStudio = vi.fn();
  const { view, onOpen } = mount({ onStudio });
  expect(view.querySelector("#commencer")).toBeNull();
  expect(view.querySelector('[href="#commencer"]')).toBeNull();
  const reprendre = [...view.querySelectorAll<HTMLButtonElement>(".ru button")].find(b => b.textContent === "Reprendre");
  expect(reprendre).toBeTruthy();
  act(() => reprendre!.click());
  expect(onStudio).toHaveBeenCalledOnce();
  expect(onOpen).not.toHaveBeenCalled();
  expect(view.querySelector(".pzh-sauvegarde-aide")!.textContent).toContain("JSON");
});


it("réunit les quatre sections dans le héros sans perdre choix, fil ni accès à l’import", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  const choisir = (id: string) => act(() => {
    window.dispatchEvent(new CustomEvent("pointzero:ouvrir-slide", { detail: id }));
  });
  const visibles = () => [...view.querySelectorAll<HTMLElement>("[data-hero-slide]")].filter(el => !el.hidden).map(el => el.dataset.heroSlide);
  expect(visibles()).toEqual(["accueil"]);
  expect(view.querySelectorAll("[data-hero-slide]")).toHaveLength(4);
  choisir("ed-rencontres");
  expect(visibles()).toEqual(["ed-rencontres"]);
  act(() => view.querySelector<HTMLButtonElement>('[data-mode="reponse-structure-1"]')!.click());
  choisir("accueil");
  expect(visibles()).toEqual(["accueil"]);
  act(() => view.querySelector<HTMLButtonElement>('#ed-fils [data-mode="famille-bleus"]')!.click());
  const fil = view.querySelector<HTMLButtonElement>('#ed-fils [data-mode^="dmc-"]')!;
  act(() => fil.click());
  const code = view.querySelector("#ed-fils .ed-fiche-code")!.textContent;
  choisir("ed-rosace"); choisir("ed-studio");
  expect(visibles()).toEqual(["ed-studio"]);
  choisir("accueil"); expect(view.querySelector("#ed-fils .ed-fiche-code")!.textContent).toBe(code);
  choisir("ed-rencontres");
  expect(view.querySelector('[data-mode="reponse-structure-1"]')!.getAttribute("aria-label")).toContain("actif");
  act(() => window.dispatchEvent(new CustomEvent("pointzero:ouvrir-slide", { detail: "ed-rosace" })));
  expect(visibles()).toEqual(["ed-rosace"]);
  const importer = vi.spyOn(view.querySelector<HTMLInputElement>("#pzh-import-unique")!, "click");
  const haut = view.querySelector('nav[aria-label="Navigation Point Zéro"]')!;
  act(() => [...haut.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Importer")!.click());
  expect(importer).toHaveBeenCalledOnce();
  act(() => [...haut.querySelectorAll<HTMLButtonElement>("button")].find(b => b.textContent === "Point Zéro")!.click());
  expect(visibles()).toEqual(["accueil"]);
  expect(view.querySelector(".tp-traine")).toBeTruthy();
});


it("offre une rosace indiennes dès l’arrivée, modifiable, réinitialisable sans toucher aux ouvrages", () => {
  site.broderie = true;
  creation.oublier();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  localStorage.setItem("ouvrage-existant", "ne pas toucher");
  const { view } = mount();
  act(() => window.dispatchEvent(new CustomEvent("pointzero:ouvrir-slide", { detail: "ed-rencontres" })));
  expect(view.querySelector('[data-hero-slide="ed-rencontres"] #ed-rencontres [data-mode="reponse-structure-0"]')).toBeTruthy();
  expect(view.querySelector(".pzh-rosace-fond canvas")).toBeTruthy();
  expect(creation.lire().choix).toEqual({}); // aucune réponse personnelle inventée
  const origine = codeDeCreation(creation.lire());
  expect(origine).toContain(".indiennes");
  const recette = lireCode(origine)!;
  const [w, h] = formatParDefaut(recette.signature);
  const p = generer({ ...recette, w, h }).pattern;
  expect(p.palette.map(i => FLOSS[i].code).sort()).toEqual(["321", "823"]);
  act(() => view.querySelector<HTMLButtonElement>('[data-mode="reponse-structure-1"]')!.click());
  expect(codeDeCreation(creation.lire())).not.toBe(origine);
  expect(codeDeCreation(creation.lire())).toContain(".g59.v0.1.indiennes");
  for (let n = 0; n < 3; n++) act(() => view.querySelector<HTMLButtonElement>('#ed-rencontres [data-mode="question-suivante"]')!.click());
  act(() => view.querySelector<HTMLButtonElement>('[data-mode="reponse-palette-2"]')!.click());
  expect(codeDeCreation(creation.lire())).not.toContain(".indiennes");
  act(() => view.querySelector<HTMLButtonElement>(".pzh-origine")!.click());
  expect(codeDeCreation(creation.lire())).toBe(origine);
  expect(localStorage.getItem("ouvrage-existant")).toBe("ne pas toucher");
});

it("fait passer au disque suivant au défilement et permet le retour par la navigation verticale", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  const stage = view.querySelector<HTMLElement>(".pzh-hero-stage")!;
  act(() => stage.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, bubbles: true })));
  expect(view.querySelector(".cross-stitch-home")!.getAttribute("data-contexte")).toBe("ed-rencontres");
  const nav = view.querySelector('nav[aria-label="Disques de découverte"]')!;
  expect(nav.querySelectorAll("button")).toHaveLength(4);
  act(() => nav.querySelector<HTMLButtonElement>('button[aria-label="Nuancier DMC"]')!.click());
  expect(view.querySelector(".cross-stitch-home")!.getAttribute("data-contexte")).toBe("accueil");
});


it("garde le même grand diamètre dans tous les disques et leurs nuances", () => {
  site.broderie = true;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  const { view } = mount();
  const taille = () => [...view.querySelectorAll<HTMLElement>(".ed-disque .lp-anneau")].map(el => el.style.width);
  expect(taille()).toEqual(["540px", "540px", "540px", "540px"]);
  act(() => view.querySelector<HTMLButtonElement>('#ed-fils [data-mode="famille-bleus"]')!.click());
  expect(taille()).toEqual(["540px", "540px", "540px", "540px"]);
  expect(view.querySelector<HTMLElement>('#ed-fils [data-mode^="dmc-"]')!.style.left).not.toBe("");
  const dock = view.querySelector('nav[aria-label="Actions de la page"]')!;
  act(() => dock.querySelector<HTMLButtonElement>("button")!.click());
  expect(view.querySelector(".cross-stitch-home")!.getAttribute("data-contexte")).toBe("ed-rencontres");
  expect(dock.querySelectorAll("button")).toHaveLength(1);
});
