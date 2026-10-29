/**
 * Point Zéro — l'édition : la narration verticale qui commence sous le héros existant (la Métamorphose).
 * Livraison A : trois scènes. Le disque est LE Point du studio (même noyau, présentation « scène ») ; ses commandes sont
 * celles de la page, et chacune déclenche une vraie action (ouvrir l'atelier, importer, ouvrir une rosace, choisir un fil).
 * Le moteur 5D n'est pas modifié : on lit le motif qu'il produit. Aucun projet n'est écrit par la page.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, ExternalLink, FileJson, FileText, FileUp, Folder, Grid2x2, Image as ImageIcon, Palette, PenLine, Scaling, Shapes, Shuffle, Sparkles, Spline, Spool, Compass } from "lucide-react";
import Point from "../point/Point";
import type { ModePoint } from "../../lib/point/modes";
import { DIMENSIONS, codeDe, VERSION, type Choix, type Signature } from "../../lib/motif5d/code";
import { RECETTES, recetteDe } from "../../lib/motif5d/recettes";
import { FLOSS } from "../../lib/dmc";
import { FAMILLES, filsParFamille, familleDe, hsl } from "../../lib/famillesFils";
import { etapeDe, lisse, mouvementReduit, suivreScene } from "./defilement";
import { dessinerRosace, ETAPES_ROSACE, rosaceDe, SEUILS_ROSACE } from "./rosace";
import "./Edition.css";

export const CHAPITRES_EDITION = [
  { id: "ed-origine", num: "01", titre: "L’origine" },
  { id: "ed-rosace", num: "02", titre: "Une rosace naît" },
  { id: "ed-fils", num: "04", titre: "Le nuage de fils" },
] as const;

interface Actions {
  /** ouvrir l'atelier : un nouveau motif, la bibliothèque, broder */
  ouvrir: (entree: "create" | "library" | "stitch") => void;
  importer: (f: File) => void;
  visite: () => void;
}

/* ——— Le disque dans la page : le même Point, posé, ajusté à la largeur disponible ——— */
function Disque({ contexte, modes, etiquette, children, max = 1 }: { contexte: string; modes: ModePoint[]; etiquette: string; children?: ReactNode; max?: number }) {
  const hote = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = hote.current; if (!el) return;
    const ajuster = () => {
      const a = el.querySelector<HTMLElement>(".lp-anneau, .lp-liste"); if (!a) return;
      /* la place : la largeur de la cellule qui accueille le disque, et la hauteur de l'écran (le disque doit tenir entier, cartouche compris) */
      const parent = el.parentElement, cs = parent ? getComputedStyle(parent) : null;
      const dispo = parent ? parent.clientWidth - parseFloat(cs!.paddingLeft) - parseFloat(cs!.paddingRight) : window.innerWidth, haut = window.innerHeight - 170, cote = a.offsetWidth || 1;
      el.style.setProperty("--ajuste", String(Math.max(0.5, Math.min(max, (dispo - 8) / cote, window.innerWidth > 820 ? haut / cote : 9))));
      el.style.setProperty("--cote", cote + "px");
    };
    ajuster();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(ajuster) : null;
    ro?.observe(el); if (el.parentElement) ro?.observe(el.parentElement);
    const mo = new MutationObserver(ajuster); mo.observe(el, { subtree: true, attributes: true, attributeFilter: ["style"], childList: true });
    window.addEventListener("resize", ajuster);
    return () => { ro?.disconnect(); mo.disconnect(); window.removeEventListener("resize", ajuster); };
  }, [max]);
  return <div className="ed-disque" ref={hote} aria-label={etiquette} role="group">
    {children}
    <div className="ed-disque-corps"><Point contexte={contexte} scene modes={modes} /></div>
  </div>;
}

/* ——— Un sélecteur de fichier caché, réglé sur un genre ——— */
function useFichier(importer: (f: File) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const champ = <input ref={ref} type="file" className="ed-cache" tabIndex={-1} aria-hidden="true" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importer(f); }} />;
  const choisir = (accept: string) => { const el = ref.current; if (!el) return; el.accept = accept; el.click(); };
  return { champ, choisir };
}

const aller = (id: string) => {
  const el = document.getElementById(id); if (!el) return;
  el.scrollIntoView({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
  el.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
};

/* ——— 01 · L'origine : un point, puis tout ce qu'il ouvre ——— */
function Origine({ actions }: { actions: Actions }) {
  const scene = useRef<HTMLElement>(null);
  const [etape, setEtape] = useState(0);
  const fichier = useFichier(actions.importer);
  useEffect(() => scene.current ? suivreScene(scene.current, p => setEtape(e => { const n = etapeDe(p, [0, 0.28, 0.6]); return n === e ? e : n; })) : undefined, []);
  const modes: ModePoint[] = [
    { id: "creer", nom: "Créer", icone: <PenLine aria-hidden="true" />, aide: "un nouveau motif, ou une rosace", groupe: "metier", ouvrir: () => {}, enfants: () => [
      { id: "creer-motif", nom: "Nouveau motif", icone: <PenLine aria-hidden="true" />, aide: "ouvrir l’atelier sur une grille vierge", groupe: "metier", ouvrir: () => actions.ouvrir("create") },
      { id: "creer-rosace", nom: "Une rosace", icone: <Sparkles aria-hidden="true" />, aide: "voir naître une rosace, plus bas", groupe: "metier", ouvrir: () => aller("ed-rosace") },
      { id: "creer-image", nom: "Depuis une image", icone: <ImageIcon aria-hidden="true" />, aide: "une photo convertie en fils DMC", groupe: "metier", ouvrir: () => fichier.choisir("image/png,image/jpeg,image/webp") },
    ] },
    { id: "fils", nom: "Fils DMC", icone: <Palette aria-hidden="true" />, aide: "le nuancier, plus bas", groupe: "metier", ouvrir: () => aller("ed-fils") },
    { id: "importer", nom: "Importer", icone: <FileUp aria-hidden="true" />, aide: "une image, un patron PDF, un projet", groupe: "creation", ouvrir: () => {}, enfants: () => [
      { id: "imp-image", nom: "Image", icone: <ImageIcon aria-hidden="true" />, aide: "PNG, JPEG, WebP", groupe: "creation", ouvrir: () => fichier.choisir("image/png,image/jpeg,image/webp") },
      { id: "imp-pdf", nom: "Patron PDF", icone: <FileText aria-hidden="true" />, aide: "un patron sur plusieurs pages, recomposé", groupe: "creation", ouvrir: () => fichier.choisir(".pdf,application/pdf") },
      { id: "imp-projet", nom: "Projet", icone: <FileJson aria-hidden="true" />, aide: "une sauvegarde JSON ou un fichier OXS", groupe: "creation", ouvrir: () => fichier.choisir(".json,.oxs,application/json") },
    ] },
    { id: "ouvrages", nom: "Mes ouvrages", icone: <Folder aria-hidden="true" />, aide: "les ouvrages rangés sur cet appareil", groupe: "creation", ouvrir: () => actions.ouvrir("library") },
    { id: "broder", nom: "Broder", icone: <Spool aria-hidden="true" />, aide: "reprendre l’ouvrage en cours", groupe: "metier", ouvrir: () => actions.ouvrir("stitch") },
    { id: "visite", nom: "Visite", icone: <Compass aria-hidden="true" />, aide: "la visite de l’atelier avec le Point", groupe: "socle", ouvrir: actions.visite },
  ];
  const phrases = ["Un point.", "Un seul centre, et autour, tout l’atelier.", "Choisissez : le disque devient l’outil."];
  return <section ref={scene} id="ed-origine" className="ed-scene ed-origine" aria-labelledby="ed-origine-titre" data-etape={etape}>
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num">01 · L’origine</p>
        <h2 id="ed-origine-titre" tabIndex={-1}>Tout part d’un point.</h2>
        <ol className="ed-phrases">{phrases.map((t, k) => <li key={k} aria-current={k === etape ? "step" : undefined}>{t}</li>)}</ol>
        <p className="ed-aide">Le disque est celui de l’atelier. Touchez une famille pour l’ouvrir ; Retour, ou Échap, pour revenir. Au clavier : Tab, puis les flèches et Entrée.</p>
      </div>
      <div className="ed-scene-disque ed-grandit">
        <Disque max={1.3} contexte="edition-origine" modes={modes} etiquette="Le Point de Point Zéro : l’atelier en un disque" />
      </div>
    </div>
    {fichier.champ}
  </section>;
}

/* ——— 02 · Une rosace naît : le vrai moteur 5D, révélé au défilement, réglé par le disque ——— */
const ICONES_DIM: Record<string, ReactNode> = { structure: <Shapes aria-hidden="true" />, trace: <Spline aria-hidden="true" />, densite: <Grid2x2 aria-hidden="true" />, echelle: <Scaling aria-hidden="true" />, palette: <Palette aria-hidden="true" /> };
function RosaceNait() {
  const scene = useRef<HTMLElement>(null), toile = useRef<HTMLCanvasElement>(null), pRef = useRef(mouvementReduit() ? 1 : 0);
  const depart = recetteDe(RECETTES.find(r => r.nom === "Kaléidoscope")!.code);
  const [sig, setSig] = useState<Signature>(depart.signature);
  const [graine, setGraine] = useState(depart.graine);
  const [etape, setEtape] = useState(0);
  const rosace = useMemo(() => rosaceDe(sig, graine, 81), [sig, graine]);
  const code = codeDe({ signature: sig, graine, version: VERSION });
  const nom = RECETTES.find(r => r.code === code)?.nom;

  const dessiner = useRef(() => {});
  dessiner.current = () => {
    const cv = toile.current, ctx = cv?.getContext?.("2d"); if (!cv || !ctx) return;
    const cote = cv.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(cote * dpr)) { cv.width = Math.round(cote * dpr); cv.height = Math.round(cote * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dessinerRosace(ctx, rosace, cote, pRef.current);
  };
  useEffect(() => scene.current ? suivreScene(scene.current, p => { pRef.current = p; dessiner.current(); setEtape(e => { const n = etapeDe(p, SEUILS_ROSACE); return n === e ? e : n; }); }) : undefined, []);
  useEffect(() => { dessiner.current(); }, [rosace]);
  useEffect(() => { const r = () => dessiner.current(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);

  const modes: ModePoint[] = [
    ...DIMENSIONS.map((d): ModePoint => ({
      id: d.cle, nom: d.nom, icone: ICONES_DIM[d.cle], aide: `${d.question} ${d.reponses[sig[d.cle]][0]}`, groupe: "metier", ouvrir: () => {},
      enfants: () => d.reponses.map(([n, phrase], k): ModePoint => ({ id: `${d.cle}-${k}`, nom: n, aide: phrase, groupe: "metier", actif: sig[d.cle] === k, resteOuvert: true,
        ouvrir: () => setSig(s => ({ ...s, [d.cle]: k as Choix })) })),
    })),
    { id: "recettes", nom: "Recettes", icone: <BookOpen aria-hidden="true" />, aide: "douze rosaces nommées", groupe: "creation", ouvrir: () => {},
      enfants: () => RECETTES.map((r): ModePoint => ({ id: "recette-" + r.code.slice(3, 8), nom: r.nom, aide: r.code, groupe: "creation", actif: r.code === code, resteOuvert: true,
        ouvrir: () => { const x = recetteDe(r.code); setSig(x.signature); setGraine(x.graine); } })) },
    { id: "variation", nom: "Variation", icone: <Shuffle aria-hidden="true" />, aide: "la même recette, une autre graine", groupe: "creation", resteOuvert: true, ouvrir: () => setGraine(g => (g % 99999) + 1) },
    { id: "studio", nom: "Dans l’atelier", icone: <ExternalLink aria-hidden="true" />, aide: "ouvrir cette rosace dans le compositeur", groupe: "creation",
      ouvrir: () => { window.location.assign(import.meta.env.BASE_URL + "atelier?rosace=" + encodeURIComponent(code)); } },
  ];
  return <section ref={scene} id="ed-rosace" className="ed-scene ed-rosace" aria-labelledby="ed-rosace-titre" data-etape={etape}>
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num">02 · Une rosace naît</p>
        <h2 id="ed-rosace-titre" tabIndex={-1}>Cinq choix, une rosace.</h2>
        <ol className="ed-phrases ed-phrases-5">{ETAPES_ROSACE.map((t, k) => <li key={t} aria-current={k === etape ? "step" : undefined}>{t}</li>)}</ol>
        <p className="ed-recette"><b>{nom ?? "Rosace"}</b> <code>{code}</code> · {rosace.fils} fils DMC · {rosace.w} × {rosace.h} points</p>
      </div>
      <figure className="ed-toile-rosace">
        <canvas ref={toile} role="img" aria-label={`La rosace ${nom ?? code} du moteur 5D : ${DIMENSIONS.map(d => d.reponses[sig[d.cle]][0].toLowerCase()).join(", ")}. ${rosace.fils} fils.`} />
        <figcaption>Motif réel du moteur 5D, rendu à l’écran (simulation de broderie).</figcaption>
      </figure>
      <div className="ed-scene-disque">
        <Disque contexte="edition-rosace" modes={modes} etiquette="Le Point du compositeur : structure, tracé, densité, échelle, palette" />
      </div>
    </div>
  </section>;
}

/* ——— 04 · Le nuage de fils : le disque devient nuancier ——— */
function Echeveau({ hex }: { hex: string }) {
  const { l } = hsl(hex);
  const ombre = `hsl(0 0% ${l > 0.6 ? 0 : 100}% / .22)`;
  return <svg className="ed-echeveau" viewBox="0 0 240 120" role="img" aria-label="Écheveau simulé">
    <defs><linearGradient id="ed-brin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".38" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".28" /></linearGradient></defs>
    {Array.from({ length: 9 }, (_, k) => <path key={k} d={`M 14 ${44 + k * 4} C 70 ${20 + k * 7}, 170 ${100 - k * 7}, 226 ${44 + k * 4}`} fill="none" stroke={hex} strokeWidth="9" strokeLinecap="round" />)}
    {Array.from({ length: 9 }, (_, k) => <path key={"r" + k} d={`M 14 ${44 + k * 4} C 70 ${20 + k * 7}, 170 ${100 - k * 7}, 226 ${44 + k * 4}`} fill="none" stroke="url(#ed-brin)" strokeWidth="9" strokeLinecap="round" />)}
    <rect x="96" y="30" width="48" height="60" rx="6" fill="#f4f2ee" stroke={ombre} />
    <text x="120" y="66" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0b0b0c">DMC</text>
  </svg>;
}
function NuageFils() {
  const scene = useRef<HTMLElement>(null), nuage = useRef<HTMLCanvasElement>(null), pRef = useRef(mouvementReduit() ? 1 : 0);
  const [fil, setFil] = useState(() => Math.max(0, FLOSS.findIndex(f => f.code === "321")));
  const [etape, setEtape] = useState(0);
  const ordre = useMemo(() => { const m = filsParFamille(); return FAMILLES.flatMap(f => m.get(f.id) ?? []); }, []);
  const dessiner = useRef(() => {});
  dessiner.current = () => {
    const cv = nuage.current, ctx = cv?.getContext?.("2d"); if (!cv || !ctx) return;
    const W = cv.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(W * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, W);
    const c = W / 2, montre = lisse(0.02, 0.55, pRef.current), n = ordre.length;
    ordre.forEach((idx, j) => {
      if (j / n > montre) return;
      const a = (j / n) * Math.PI * 2 - Math.PI / 2, anneauN = j % 5, R = W * (0.405 + anneauN * 0.017);
      const x = c + R * Math.cos(a), y = c + R * Math.sin(a), choisi = idx === fil;
      ctx.beginPath(); ctx.arc(x, y, choisi ? W * 0.013 : W * 0.0065, 0, Math.PI * 2); ctx.fillStyle = FLOSS[idx].hex; ctx.fill();
      if (choisi) { ctx.lineWidth = 2; ctx.strokeStyle = "#fff"; ctx.stroke(); }
    });
  };
  useEffect(() => scene.current ? suivreScene(scene.current, p => { pRef.current = p; dessiner.current(); setEtape(e => { const k = etapeDe(p, [0, 0.3, 0.55, 0.8]); return k === e ? e : k; }); }) : undefined, []);
  useEffect(() => { dessiner.current(); }, [fil]);
  useEffect(() => { const r = () => dessiner.current(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);
  const parFamille = filsParFamille();
  const modes: ModePoint[] = FAMILLES.map((f): ModePoint => ({
    id: "famille-" + f.id, nom: f.nom, couleur: f.hex, aide: `${parFamille.get(f.id)?.length ?? 0} nuances DMC, du plus clair au plus foncé`, groupe: "metier", ouvrir: () => {},
    enfants: () => (parFamille.get(f.id) ?? []).map((i): ModePoint => ({ id: "dmc-" + FLOSS[i].code, nom: "DMC " + FLOSS[i].code, aide: FLOSS[i].name, couleur: FLOSS[i].hex, groupe: "metier", actif: i === fil, resteOuvert: true, ouvrir: () => setFil(i) })),
  }));
  const F = FLOSS[fil], famille = FAMILLES.find(x => x.id === familleDe(F.hex));
  const etapes = ["Les fils apparaissent autour du centre", "Une famille de couleurs", "Ses nuances, du clair au foncé", "Un numéro DMC"];
  return <section ref={scene} id="ed-fils" className="ed-scene ed-fils" aria-labelledby="ed-fils-titre" data-etape={etape}>
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num">04 · Le nuage de fils</p>
        <h2 id="ed-fils-titre" tabIndex={-1}>489 fils, un seul geste.</h2>
        <ol className="ed-phrases">{etapes.map((t, k) => <li key={t} aria-current={k === etape ? "step" : undefined}>{t}</li>)}</ol>
      </div>
      <div className="ed-scene-disque ed-nuancier">
        <Disque max={1.1} contexte="edition-fils" modes={modes} etiquette="Le Point en nuancier : familles de couleurs, puis nuances DMC"><canvas ref={nuage} className="ed-nuage" aria-hidden="true" /></Disque>
      </div>
      <aside className="ed-fiche" aria-live="polite" aria-label="Le fil choisi">
        <span className="ed-pastille" style={{ background: F.hex }} aria-hidden="true" />
        <p className="ed-fiche-code">DMC {F.code}</p>
        <p className="ed-fiche-nom">{F.name}</p>
        <p className="ed-fiche-famille">{famille?.nom}</p>
        <Echeveau hex={F.hex} />
        <dl className="ed-fiche-valeurs">
          <div><dt>Écran</dt><dd><code>{F.hex.toUpperCase()}</code> · référence numérique sRGB, indicative</dd></div>
          <div><dt>Fil réel</dt><dd>photographie calibrée à venir ; l’écheveau ci-dessus est une simulation</dd></div>
        </dl>
      </aside>
    </div>
  </section>;
}

export default function Edition({ actions }: { actions: Actions }) {
  return <div className="ed" data-edition="a">
    <Origine actions={actions} />
    <RosaceNait />
    <NuageFils />
  </div>;
}
