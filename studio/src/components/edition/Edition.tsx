/**
 * Point Zéro — l'édition : la narration verticale qui commence sous le héros existant (la Métamorphose).
 * L'histoire du textile, et en même temps celle de la création du visiteur : cinq rencontres avec l'Orbe nourrissent une recette 5D,
 * la rosace évolue à chaque choix, et le cadeau l'ouvre dans l'atelier. Le disque est LE Point du studio (présentation « scène ») ;
 * chaque commande déclenche une vraie action.
 * Le moteur 5D n'est pas modifié : on lit le motif qu'il produit. Aucun projet n'est écrit par la page.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BookOpen, ExternalLink, Grid2x2, Palette, Scaling, Shapes, Shuffle, Spline } from "lucide-react";
import Point from "../point/Point";
import type { ModePoint } from "../../lib/point/modes";
import { DIMENSIONS, type Choix } from "../../lib/motif5d/code";
import { RECETTES, recetteDe } from "../../lib/motif5d/recettes";
import { FLOSS } from "../../lib/dmc";
import { FAMILLES, filsParFamille, familleDe, hsl } from "../../lib/famillesFils";
import { etapeDe, lisse, mouvementReduit, suivreScene } from "./defilement";
import { dessinerRosace, ETAPES_ROSACE, rosaceDe, SEUILS_ROSACE } from "./rosace";
import { SITE_BRODERIE } from "../../lib/site";
import { revelerSlide } from "./Slides";
import Brode, { type Point as PositionLoupe } from "./Brode";
import Histoire, { CHAPITRES_HISTOIRE } from "./Histoire";
import { Apercu, Cadeau, MaRosace, Orbe, RencontreOrbe, useCommandesTrace, useRencontres } from "./Participation";
import { codeDeCreation, creation, indiennesDe, graineDe, nbChoix, reponseDe, signatureDe, useCreation } from "./creation";
import "./Participation.css";
import Appareil from "./Appareil";
import { adresse, ContexteContenus, ORIGINE, useContenus, type Contenus } from "./contenus";
import { useContenusPublies, useSelectionBureau } from "./useContenusPublies";
import "./Edition.css";
import "./Histoire.css";

export const CHAPITRES_EDITION = [
  ...CHAPITRES_HISTOIRE,
  { id: "ed-fils", num: "05", titre: "Aujourd’hui" },
  { id: "ed-rosace", num: "06", titre: "Créez maintenant" },
  { id: "ed-cadeau", num: "07", titre: "Le cadeau" },
] as const;
export const chapitresEdition = () => SITE_BRODERIE ? [
  { id: "ed-rencontres", num: "01", titre: "Composer une rosace" },
  { id: "ed-fils", num: "02", titre: "Nuancier DMC" },
  { id: "ed-rosace", num: "03", titre: "Ma rosace" },
  { id: "ed-studio", num: "04", titre: "Dans le studio" },
] : CHAPITRES_EDITION;

export type FonctionStudio = "dessiner" | "broder" | "fils" | "exporter" | "ouvrages" | "camera" | "partager";
interface Actions {
  fonction?: (fonction: FonctionStudio) => void;
  /** ouvrir l'atelier : un nouveau motif, la bibliothèque, broder */
  ouvrir: (entree: "create" | "library" | "stitch") => void;
  importer: (f: File) => void;
  visite: () => void;
}

/* ——— Le disque dans la page : le même Point, posé, ajusté à la largeur disponible ——— */
export function Disque({ contexte, modes, etiquette, children, max = 1 }: { contexte: string; modes: ModePoint[]; etiquette: string; children?: ReactNode; max?: number }) {
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
  const defiler = () => {
    const el = document.getElementById(id); if (!el) return;
    el.scrollIntoView?.({ behavior: mouvementReduit() ? "auto" : "smooth", block: "start" });
    el.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
  };
  if (SITE_BRODERIE) { revelerSlide(id); requestAnimationFrame(defiler); }
  else defiler();
};

/* ——— 02 · Une rosace naît : le vrai moteur 5D, révélé au défilement, réglé par le disque ——— */
const ICONES_DIM: Record<string, ReactNode> = { structure: <Shapes aria-hidden="true" />, trace: <Spline aria-hidden="true" />, densite: <Grid2x2 aria-hidden="true" />, echelle: <Scaling aria-hidden="true" />, palette: <Palette aria-hidden="true" /> };
function RosaceNait() {
  const scene = useRef<HTMLElement>(null), toile = useRef<HTMLCanvasElement>(null), pRef = useRef(mouvementReduit() ? 1 : 0);
  const c = useCreation(), sig = signatureDe(c), graine = graineDe(c);
  const [etape, setEtape] = useState(0);
  const rosace = useMemo(() => rosaceDe(sig, graine, indiennesDe(c)), [indiennesDe(c), sig.structure, sig.trace, sig.densite, sig.echelle, sig.palette, graine]); // eslint-disable-line react-hooks/exhaustive-deps
  const code = codeDeCreation(c);
  const nom = RECETTES.find(r => r.code === code)?.nom;
  const T = useContenus().rosace;

  const dessiner = useRef(() => {});
  dessiner.current = () => {
    const cv = toile.current, ctx = cv?.getContext?.("2d"); if (!cv || !ctx) return;
    const cote = cv.clientWidth || 600, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(cote * dpr)) { cv.width = Math.round(cote * dpr); cv.height = Math.round(cote * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dessinerRosace(ctx, rosace, cote, SITE_BRODERIE ? 1 : pRef.current);
  };
  useEffect(() => scene.current ? suivreScene(scene.current, p => { pRef.current = p; dessiner.current(); setEtape(e => { const n = etapeDe(p, SEUILS_ROSACE); return n === e ? e : n; }); }) : undefined, []);
  useEffect(() => { dessiner.current(); }, [rosace]);
  useEffect(() => { const r = () => dessiner.current(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, []);

  /* le disque du compositeur règle la MÊME création que les rencontres : on peut revenir sur chaque choix */
  const modes: ModePoint[] = [
    ...DIMENSIONS.map((d): ModePoint => ({
      id: d.cle, nom: d.nom, icone: ICONES_DIM[d.cle], aide: `${d.question} ${c.choix[d.cle] === undefined ? "pas encore choisi" : d.reponses[sig[d.cle]][0]}`, groupe: "metier", ouvrir: () => {},
      enfants: () => d.reponses.map(([n, phrase], k): ModePoint => ({ id: `${d.cle}-${k}`, nom: n, aide: phrase, groupe: "metier", actif: c.choix[d.cle] === k, resteOuvert: true,
        ouvrir: () => creation.choisir(d.cle, k as Choix) })),
    })),
    { id: "recettes", nom: "Recettes", icone: <BookOpen aria-hidden="true" />, aide: "partir d’une des douze rosaces nommées", groupe: "creation", ouvrir: () => {},
      enfants: () => RECETTES.map((r): ModePoint => ({ id: "recette-" + r.code.slice(3, 8), nom: r.nom, aide: r.code, groupe: "creation", actif: r.code === code, resteOuvert: true,
        ouvrir: () => { const x = recetteDe(r.code); creation.recette(x.signature, x.graine); } })) },
    { id: "variation", nom: "Variation", icone: <Shuffle aria-hidden="true" />, aide: "la même recette, une autre graine", groupe: "creation", resteOuvert: true, ouvrir: () => creation.varier() },
    { id: "studio", nom: "Dans l’atelier", icone: <ExternalLink aria-hidden="true" />, aide: "regarder cette rosace dans le compositeur de l’atelier", groupe: "creation",
      ouvrir: () => { window.location.assign(import.meta.env.BASE_URL + "atelier?rosace=" + encodeURIComponent(code)); } },
  ];
  if (SITE_BRODERIE) return <section ref={scene} id="ed-rosace" className="ed-scene ed-fils ed-rosace-reference" aria-labelledby="ed-rosace-titre" data-etape={etape}>
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num">03 · Ma rosace</p>
        <h2 id="ed-rosace-titre" tabIndex={-1}>Votre rosace,<br />à votre main.</h2>
        <p className="ed-chapeau">Choisissez une forme, un tracé ou une palette dans le disque. L’aperçu et la fiche suivent vos choix.</p>
        <ol className="ed-phrases">{DIMENSIONS.map(d => <li key={d.cle} aria-current={c.choix[d.cle] !== undefined ? "step" : undefined}>{d.nom}</li>)}</ol>
      </div>
      <div className="ed-scene-disque ed-nuancier">
        <Disque max={1.1} contexte="edition-rosace" modes={modes} etiquette="Le Point du compositeur : revenir sur chaque choix de votre rosace" />
      </div>
      <aside className="ed-fiche ed-fiche-rosace" tabIndex={-1} aria-label="Votre rosace et sa recette">
        <p className="ed-fiche-code">{nom ?? (nbChoix(c) ? "Ma rosace" : "Aperçu")}</p>
        <p className="ed-fiche-nom">{nbChoix(c)} choix sur 5{nbChoix(c) < 5 ? " · choix restants provisoires" : " · recette complète"}</p>
        <figure className="ed-apercu-rosace">
          <canvas ref={toile} role="img" aria-label={`Votre rosace : ${DIMENSIONS.map(d => d.reponses[sig[d.cle]][0].toLowerCase()).join(", ")}. ${rosace.fils} fils DMC.`} />
          <figcaption>{T.legende}</figcaption>
        </figure>
        <dl className="ed-fiche-valeurs">
          <div><dt>Format</dt><dd>{rosace.w} × {rosace.h} points</dd></div>
          <div><dt>Fils</dt><dd>{rosace.fils} références DMC</dd></div>
          {DIMENSIONS.map(d => <div key={d.cle}><dt>{d.nom}</dt><dd>{d.reponses[sig[d.cle]][0]}{c.choix[d.cle] === undefined ? " (provisoire)" : ""}</dd></div>)}
        </dl>
        <details className="ed-recette-details"><summary>Code de la recette</summary><p className="ed-recette"><code>{code}</code></p></details>
        <button type="button" className="ed-cta" onClick={() => window.location.assign(import.meta.env.BASE_URL + "atelier?rosace=" + encodeURIComponent(code))}>Ouvrir dans l’atelier</button>
      </aside>
    </div>
  </section>;
  return <section ref={scene} id="ed-rosace" className="ed-scene ed-rosace" aria-labelledby="ed-rosace-titre" data-etape={etape}>
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num">{SITE_BRODERIE ? "03 · Ma rosace" : T.kicker}</p>
        <h2 id="ed-rosace-titre" tabIndex={-1}>{nbChoix(c) ? T.titreApres : T.titreAvant}</h2>
        <ol className="ed-phrases ed-phrases-5">{ETAPES_ROSACE.map((t, k) => <li key={t} aria-current={k === etape ? "step" : undefined}>{t}</li>)}</ol>
        <p className="ed-recette"><b>{nom ?? (nbChoix(c) ? "Ma rosace" : "Aperçu")}</b> <code>{code}</code> · {rosace.fils} fils DMC · {rosace.w} × {rosace.h} points{nbChoix(c) < 5 && <> · <i>{5 - nbChoix(c)} choix encore provisoires</i></>}</p>
      </div>
      <figure className="ed-toile-rosace">
        <canvas ref={toile} role="img" aria-label={`Votre rosace, par le moteur 5D : ${DIMENSIONS.map(d => (c.choix[d.cle] === undefined ? "provisoire " : "") + d.reponses[sig[d.cle]][0].toLowerCase()).join(", ")}. ${rosace.fils} fils.`} />
        <figcaption>{T.legende}</figcaption>
        {!SITE_BRODERIE && <RencontreOrbe cle="densite" variante="curseur" sombre compacte />}
      </figure>
      <div className="ed-scene-disque">
        <Disque contexte="edition-rosace" modes={modes} etiquette="Le Point du compositeur : revenir sur chaque choix de votre rosace" />
      </div>
    </div>
  </section>;
}


/** Cinq questions facultatives : le même état et le même moteur que Ma rosace. */
function Rencontres5D({ heroEntree }: { heroEntree?: ReactNode }) {
  const rencontres = useRencontres(), c = useCreation();
  const [active, setActive] = useState(0);
  const r = rencontres[active], dim = DIMENSIONS.find(d => d.cle === r.cle)!;
  const sig = signatureDe(c), graine = graineDe(c);
  const ro = useMemo(() => rosaceDe(sig, graine, indiennesDe(c)), [indiennesDe(c), sig.structure, sig.trace, sig.densite, sig.echelle, sig.palette, graine]);
  useEffect(() => {
    const publier = () => window.dispatchEvent(new CustomEvent("pointzero:rencontres-etat", { detail: { active, titres: rencontres.map(x => x.titre) } }));
    const choisir = (e: Event) => { const n = Number((e as CustomEvent<number>).detail); if (Number.isInteger(n)) setActive(Math.max(0, Math.min(4, n))); };
    const ancre = (e: Event) => { const n = rencontres.findIndex(x => x.id === (e as CustomEvent<string>).detail); if (n >= 0) setActive(n); };
    publier(); window.addEventListener("pointzero:rencontres-demande", publier); window.addEventListener("pointzero:rencontres-choisir", choisir); window.addEventListener("pointzero:ouvrir-slide", ancre);
    return () => { window.removeEventListener("pointzero:rencontres-demande", publier); window.removeEventListener("pointzero:rencontres-choisir", choisir); window.removeEventListener("pointzero:ouvrir-slide", ancre); };
  }, [active, rencontres]);
  const modes: ModePoint[] = dim.reponses.map(([nom, aide], n) => ({ id: `reponse-${r.cle}-${n}`, nom, aide, groupe: "metier", actif: c.choix[r.cle] === n, resteOuvert: true, ouvrir: () => creation.choisir(r.cle, n as Choix) }));
  if (heroEntree) return <section id="ed-rencontres" className="ru pzh-rosace-vivante" aria-label="Créer ma rosace personnelle">
    <div className="pzh-rosace-fond"><Apercu r={ro} fond="#f2eee5" label="Rosace personnelle en direct, calculée par le moteur 5D" /></div>
    <div className="pzh-rosace-accueil">
      <h1>Point Zéro</h1>
      <p className="pzh-hommage">Une première rosace, inspirée des indiennes. À vous de la transformer.</p>
      <p className="pzh-teintes" title="Évocation en fils DMC 321 et 823 ; teintes écran indicatives, pas une reproduction mesurée des pigments historiques.">{indiennesDe(c) ? "Rouge garance · bleu indigo · toile écrue" : "Votre palette personnelle"}</p>
      {heroEntree}
      <button type="button" className="pzh-origine" onClick={() => { creation.oublier(); setActive(0); }}>Retrouver la rosace d’origine</button>
    </div>
    <div className="pzh-guide-rosace">
      <div className="pzh-guide-question" role="status" aria-live="polite"><Orbe taille={32} /><div><p>Rencontre {active + 1} sur 5 · {r.titre}</p><h2 tabIndex={-1}>{dim.question}</h2></div></div>
      <div className="ed-scene-disque" data-rencontre={r.cle}><Disque contexte={`rencontre-5d-${r.cle}`} modes={modes} etiquette={`Réponses : ${dim.question}`} max={1.1} /></div>
      <p className="pzh-guide-reponse" role="status">{c.choix[r.cle] === undefined ? "Choisissez dans le disque. Explorez librement, sans questionnaire obligatoire." : `${dim.reponses[c.choix[r.cle]!][0]} · votre rosace évolue en direct.`}</p>
      <button type="button" className="pzh-btn pzh-btn-clair" onClick={() => window.location.assign(import.meta.env.BASE_URL + "atelier?rosace=" + encodeURIComponent(codeDeCreation(c)))}>Broder ma rosace</button>
      <div className="sr-only">{rencontres.map(x => <span id={x.id} key={x.id} />)}</div>
    </div>
  </section>;
  return <section id="ed-rencontres" className="ed-scene ed-fils ed-rencontre-reference" aria-label="Composer ma rosace personnelle">
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num" role="status" aria-live="polite">Rencontre {active + 1} sur 5 · {r.titre}</p>
        <h2 tabIndex={-1}>{dim.question}</h2>
        <p className="ed-chapeau">Cinq choix pour composer votre rosace personnelle. Choisissez une réponse dans le disque, puis continuez dans le dock du bas.</p>
        <p className="ed-aide">Ce parcours est facultatif. Vous pouvez importer votre patron ou ouvrir le studio à tout moment.</p>
        <ol className="ed-phrases">{rencontres.map((x, n) => <li key={x.id} aria-current={n === active ? "step" : undefined}>{x.titre}{c.choix[x.cle] !== undefined ? " ✓" : ""}</li>)}</ol>
        <div className="sr-only">{rencontres.map(x => <span id={x.id} key={x.id} />)}</div>
      </div>
      <div className="ed-scene-disque ed-nuancier" data-rencontre={r.cle}>
        <Disque contexte={`rencontre-5d-${r.cle}`} modes={modes} etiquette={`Réponses : ${dim.question}`} max={1.1} />
      </div>
      <aside className="ed-fiche ed-fiche-personnelle" aria-label="Ma rosace personnelle" tabIndex={-1}>
        <p className="ed-fiche-code">Ma rosace</p>
        <p className="ed-fiche-nom" role="status">{nbChoix(c)} choix sur 5{nbChoix(c) < 5 ? " · aperçu provisoire" : " · recette complète"}</p>
        <figure className="ed-apercu-rosace"><Apercu r={ro} label="Aperçu de ma rosace personnelle, calculé par le moteur 5D" /><figcaption>Le même motif que dans le studio, avec vos choix.</figcaption></figure>
        <dl className="ed-fiche-valeurs">{rencontres.map(x => <div key={x.cle}><dt>{x.titre}</dt><dd>{c.choix[x.cle] === undefined ? "À choisir" : DIMENSIONS.find(d => d.cle === x.cle)!.reponses[c.choix[x.cle]!][0]}</dd></div>)}<div><dt>Format</dt><dd>{ro.w} × {ro.h} points · {ro.fils} fils DMC</dd></div></dl>
        <p className="ed-aide">{c.choix[r.cle] === undefined ? "Aucune réponse choisie pour cette question." : `${dim.reponses[c.choix[r.cle]!][0]} : ce choix est retenu dans votre rosace.`}</p>
        {nbChoix(c) === 5 && <button type="button" className="ed-cta" onClick={() => aller("ed-rosace")}>Voir ma rosace</button>}
      </aside>
    </div>
  </section>;
}

const USAGES = [
 { id: "pdf", titre: "Importer un patron", phrase: "Votre PDF devient une grille de travail.", details: "PDF multipage : analyse, calage et assemblage avant l’ouverture dans l’atelier.", limite: "Selon la structure du PDF, des corrections sont nécessaires. Vérifiez les symboles, les couleurs et les dimensions.", action: "Importer mon patron PDF", accept: ".pdf,application/pdf", points: ["Analyse des pages", "Calage et montage", "Patron à vérifier"] },
 { id: "photo", titre: "Photo et dessin", phrase: "Une image, convertie en fils DMC.", details: "Importez une photo, puis ajustez son cadre, ses couleurs et ses réglages dans l’atelier.", limite: "La conversion est une interprétation de l’image, pas une lecture exacte de patron.", action: "Importer une image", accept: "image/png,image/jpeg,image/webp", points: ["Image sur votre appareil", "Palette DMC", "Cadre et réglages"] },
 { id: "dessiner", titre: "Créer dans le Cadre", phrase: "Dessiner, composer et ajuster le format.", details: "Croix, fractions, contours, motifs, calques et symétrie dans la même grille.", limite: "Redimensionner le motif change ses points ; agrandir la toile est une action différente.", action: "Ouvrir le dessin", fonction: "dessiner", points: ["Points et formes", "Cadre et toile", "Motifs et calques"] },
 { id: "broder", titre: "Suivre ma broderie", phrase: "Marquer les points sans redessiner le patron.", details: "Marquer, bloc 10 × 10, rangée, parking et suivi des couleurs. Loupe, symboles et lectures Patron, À plat ou Réaliste aident à se repérer.", limite: "Le suivi est manuel : l’application ne détecte pas les points cousus physiquement.", action: "Ouvrir le suivi", fonction: "broder", points: ["Fil actif", "Points réalisés", "Progression et rappels"] },
 { id: "fils", titre: "Fils et fournitures", phrase: "Préparer la toile, les brins et le stock.", details: "Références DMC, stock, quantités estimées et liste des fils à prévoir pour votre ouvrage.", limite: "Les teintes écran et les quantités de fil restent indicatives.", action: "Préparer les fils", fonction: "fils", points: ["Toile et brins", "Stock de fils", "Quantités estimées"] },
 { id: "ouvrages", titre: "Garder mes ouvrages", phrase: "Retrouver son travail sur cet appareil.", details: "Bibliothèque locale, dossiers et versions. Téléchargez le projet JSON pour disposer d’une copie portable.", limite: "Pas de sauvegarde cloud autonome. Effacer les données du navigateur peut supprimer les ouvrages locaux.", action: "Mes ouvrages", fonction: "ouvrages", points: ["Sauvegarde locale", "Bibliothèque et versions", "Copie JSON"] },
 { id: "exporter", titre: "Exporter et imprimer", phrase: "Un patron prêt à consulter ou à emporter.", details: "Export PDF paginé, symboles et légende ; formats JSON, SVG, PNG, OXS et listes CSV disponibles dans l’export.", limite: "Les formats n’emportent pas tous les mêmes informations. Utilisez le JSON pour reprendre le projet complet.", action: "Ouvrir les exports", fonction: "exporter", points: ["PDF et légende", "Images et formats ouverts", "Projet complet JSON"] },
 { id: "partager", titre: "Inviter à regarder", phrase: "Présenter son ouvrage en lecture partagée.", details: "L’hôte garde la main et transmet une lecture de son patron à une autre personne par échange de codes de connexion.", limite: "Pas d’édition simultanée ni de stockage cloud. Certains réseaux bloquent cette connexion ; chaque personne doit avoir le droit de consulter le patron.", action: "Ouvrir le partage", fonction: "partager", points: ["Un hôte écrit", "Une invitée suit", "Connexion directe"] },
 { id: "camera", titre: "Sur ma toile", phrase: "Superposer un patron sur l’image de la caméra.", details: "Choisissez un ouvrage et alignez manuellement ses quatre coins sur la toile filmée ; ajustez l’opacité et l’affichage.", limite: "Fonction expérimentale : permission caméra et téléphone immobile nécessaires. Superposition à l’écran, pas projection physique.", action: "Découvrir Sur ma toile", fonction: "camera", points: ["Caméra ou photo", "Quatre coins", "Superposition à l’écran"] },
] as const;
function StudioDecouverte({ actions }: { actions: Actions }) {
  const [index, setIndex] = useState(0), fichier = useFichier(actions.importer), usage = USAGES[index];
  const modes: ModePoint[] = USAGES.map((u, n) => ({ id: "usage-" + u.id, nom: u.titre, aide: u.phrase, groupe: "metier", actif: n === index, resteOuvert: true, ouvrir: () => setIndex(n) }));
  const ouvrir = () => { if ("accept" in usage) fichier.choisir(usage.accept); else if (actions.fonction) actions.fonction(usage.fonction); else actions.ouvrir(usage.fonction === "ouvrages" ? "library" : usage.fonction === "dessiner" ? "create" : "stitch"); };
  return <section id="ed-studio" className="ed-scene ed-fils ed-studio-reference" aria-labelledby="ed-studio-titre"><div className="ed-plateau">
    <div className="ed-texte"><p className="ed-num">04 · Dans le studio</p><h2 id="ed-studio-titre" tabIndex={-1}>Du patron<br />à l’ouvrage.</h2><p className="ed-chapeau">Explorez les outils déjà présents dans Point Zéro. Choisissez un usage dans le disque pour ouvrir le bon espace.</p><ol className="ed-phrases">{usage.points.map(t => <li key={t}>{t}</li>)}</ol></div>
    <div className="ed-scene-disque ed-nuancier"><Disque contexte="studio-decouverte" modes={modes} etiquette="Découvrir les fonctions du studio" max={1.1} /></div>
    <aside className="ed-fiche" aria-label="La fonction choisie" tabIndex={-1}><p className="ed-fiche-code">{usage.titre}</p><p className="ed-fiche-nom">{usage.phrase}</p><p>{usage.details}</p><p className="ed-aide">{usage.limite}</p><button type="button" className="ed-cta" onClick={ouvrir}>{usage.action}</button></aside>
  </div>{fichier.champ}</section>;
}

/* ——— Rencontre 2 · Les lignes : dans le disque, le même Point ——— */
function RencontreDisque() {
  const c = useCreation(), r = useRencontres()[1], modes = useCommandesTrace(), choisi = c.choix.trace;
  return <section id={r.id} className="or-rencontre or-sombre or-disque" aria-labelledby="or-lignes-titre" data-rencontre="trace">
    <div className="or-tete">
      <Orbe taille={64} parle={choisi === undefined} />
      <div><p className="or-kicker" id="or-lignes-titre">Rencontre {r.num} sur 5 · {r.titre}</p><p className="or-question">{r.question}</p>
        <p className="or-aide-disque">Touchez un secteur du disque, ou Tab puis les flèches et Entrée.</p></div>
    </div>
    <div className="or-disque-hote"><Disque contexte="edition-lignes" modes={modes} etiquette="Le Point : quatre lignes pour votre rosace" max={1.15} /></div>
    <p className="or-reaction" role="status" aria-live="polite">{choisi !== undefined ? r.reaction(reponseDe("trace", choisi)[0]) : ""}</p>
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
function NuageFils({ immersif = false }: { immersif?: boolean }) {
  const [fixe, setFixe] = useState<PositionLoupe | null>(null);
  const [liberation, setLiberation] = useState(0);
  const [rechercheDock, setRechercheDock] = useState(false);
  const [texteDock, setTexteDock] = useState("");
  const champDock = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!SITE_BRODERIE) return;
    const commande = (e: Event) => {
      const action = (e as CustomEvent<string>).detail;
      if (action === "chercher") { setRechercheDock(true); requestAnimationFrame(() => champDock.current?.focus()); }
      if (action === "familles") document.querySelector<HTMLElement>('#ed-fils [data-mode^="famille-"]')?.focus();
      if (action === "fiche") document.querySelector<HTMLElement>('#ed-fils .ed-fiche')?.focus();
    };
    window.addEventListener("pointzero:nuancier-dock", commande);
    return () => window.removeEventListener("pointzero:nuancier-dock", commande);
  }, []);
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
  const T = useContenus().fils, etapes = T.etapes;
  if (immersif) return <section ref={scene} id="ed-fils" className="pz-photo-dmc" aria-label="Explorer les couleurs du palampore">
    <Brode src={import.meta.env.BASE_URL + "images/histoire/met-palampore-2010-337.webp"} cols={120} maxFils={18}
      alt="Palampore rouge garance et bleu indigo : le cercle révèle les points de croix."
      legende="Palampore, côte de Coromandel, XVIIIᵉ siècle · The Met, 2010.337 · domaine public. Conversion en fils DMC indicative."
      cadrage={{ ordinateur: { x: 50, y: 40 }, mobile: { x: 55, y: 35 } }}
      fixation={{ rayon: 64, marge: 170, liberation, surFixer: setFixe }} />
    <header className="pz-photo-titre"><h1>Point Zéro</h1><p role="status">{fixe ? "Cercle fixé · explorez les fils autour." : "Déplacez le cercle, puis cliquez pour ouvrir le disque DMC."}</p></header>
    {fixe && <>
      <div className="pz-photo-couronne" style={{ left: fixe.x, top: fixe.y }} onKeyDown={e => { if (e.key === "Escape" && !e.defaultPrevented) { e.stopPropagation(); setLiberation(n => n + 1); } }}>
        <Point contexte="photo-dmc" scene tambour={{ rayon: 120, cote: 340, parPage: 8 }} modes={modes} etiquette="Nuancier autour du cercle fixé" />
        <button type="button" className="pz-photo-liberer" onClick={() => setLiberation(n => n + 1)} aria-label="Libérer le cercle et déplacer la loupe">Déplacer</button>
      </div>
      <aside className="ed-fiche pz-photo-fiche" tabIndex={-1} aria-label="Le fil choisi" aria-live="polite">
        <details open={typeof window === "undefined" || window.innerWidth > 820}><summary><span className="ed-pastille" style={{ background: F.hex }} /> <span className="ed-fiche-code">DMC {F.code}</span></summary>
          <p className="ed-fiche-nom">{F.name}</p><p className="ed-fiche-famille">{famille?.nom}</p>
          <Echeveau hex={F.hex} />
          <label className="pz-photo-recherche">Chercher un fil DMC<input type="search" value={texteDock} onChange={e => setTexteDock(e.target.value)} placeholder="Référence ou nom" /></label>
          {texteDock.trim() && <ul className="pz-photo-resultats">{FLOSS.map((f, i) => ({ f, i })).filter(({ f }) => (f.code + " " + f.name).toLowerCase().includes(texteDock.trim().toLowerCase())).slice(0, 12).map(({ f, i }) => <li key={f.code}><button type="button" onClick={() => { setFil(i); setTexteDock(""); }}>DMC {f.code} · {f.name}</button></li>)}</ul>}
          <p className="pz-photo-precision"><code>{F.hex.toUpperCase()}</code> · sRGB indicatif. Écheveau simulé.</p><p className="pz-photo-precision">Teinte écran indicative. Le choix consulte la fiche : il ne recolore ni la photo ni votre rosace.</p>
        </details>
      </aside>
    </>}
  </section>;
  return <section ref={scene} id="ed-fils" className="ed-scene ed-fils" aria-labelledby="ed-fils-titre" data-etape={etape}>
    <div className="ed-plateau">
      <div className="ed-texte">
        <p className="ed-num">{SITE_BRODERIE ? "02 · Nuancier DMC" : T.kicker}</p>
        <h2 id="ed-fils-titre" tabIndex={-1}>{T.titre}</h2>
        <p className="ed-chapeau">{T.chapeau}</p>
        {SITE_BRODERIE && rechercheDock && <div className="pz-recherche-fils">
          <label htmlFor="nuancier-dock-recherche">Rechercher un fil DMC</label>
          <input id="nuancier-dock-recherche" ref={champDock} type="search" value={texteDock} onChange={e => setTexteDock(e.target.value)} placeholder="Référence ou nom du fil" />
          <button type="button" onClick={() => { setRechercheDock(false); document.querySelector<HTMLElement>('[data-nuancier="chercher"]')?.focus(); }}>Fermer la recherche</button>
          <ul>{texteDock.trim() && FLOSS.map((f, i) => ({ f, i })).filter(({ f }) => (f.code + " " + f.name).toLowerCase().includes(texteDock.trim().toLowerCase())).slice(0, 20).map(({ f, i }) => <li key={f.code}><button type="button" onClick={() => { setFil(i); setRechercheDock(false); document.querySelector<HTMLElement>('#ed-fils .ed-fiche')?.focus(); }}>DMC {f.code} · {f.name}</button></li>)}</ul>
        </div>}
        <ol className="ed-phrases">{etapes.map((t, k) => <li key={t} aria-current={k === etape ? "step" : undefined}>{t}</li>)}</ol>
      </div>
      <div className="ed-scene-disque ed-nuancier">
        <Disque max={1.1} contexte="edition-fils" modes={modes} etiquette="Le Point en nuancier : familles de couleurs, puis nuances DMC"><canvas ref={nuage} className="ed-nuage" aria-hidden="true" /></Disque>
      </div>
      <aside className="ed-fiche" tabIndex={-1} aria-live="polite" aria-label="Le fil choisi">
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

/** L'édition en ligne : la version publiée (ou l'aperçu d'une version, pour l'administration), sinon les textes d'origine. */
export function EditionEnLigne({ actions, heroSlide, heroEntree }: { actions: Actions; heroSlide?: string; heroEntree?: ReactNode }) {
  const { contenus, apercu, refus, bureau } = useContenusPublies();
  useSelectionBureau(bureau);
  return <>
    {(apercu || refus) && <p className="ed-apercu" role="status">{apercu
      ? <>Aperçu de la version {apercu.id} : elle n’est pas publiée.{apercu.ecarts ? ` ${apercu.ecarts} champ(s) refusé(s) par la validation montrent le texte d’origine.` : ""}</>
      : refus}</p>}
    <Edition actions={actions} contenus={contenus} heroSlide={heroSlide} heroEntree={heroEntree} />
  </>;
}

/** L'édition. contenus : la version publiée, déjà validée (validerContenus) ; sans elle, les textes d'origine. */
export default function Edition({ actions, contenus = ORIGINE, heroSlide, heroEntree }: { actions: Actions; contenus?: Contenus; heroSlide?: string; heroEntree?: ReactNode }) {
  return <ContexteContenus.Provider value={contenus}><Corps actions={actions} heroSlide={heroSlide} heroEntree={heroEntree} /></ContexteContenus.Provider>;
}

function Corps({ actions, heroSlide, heroEntree }: { actions: Actions; heroSlide?: string; heroEntree?: ReactNode }) {
  const slide = (id: string, titre: string, contenu: ReactNode) => heroSlide === undefined ? contenu : <div data-hero-slide={id} hidden={heroSlide !== id} role="group" aria-roledescription="diapositive" aria-label={titre}>{contenu}</div>;
  const fichier = useFichier(actions.importer), A = useContenus().appareils;
  return <div className="ed" data-edition="c">
    {SITE_BRODERIE && slide("ed-rencontres", "Créer ma rosace", <Rencontres5D heroEntree={heroEntree} />)}
    {!SITE_BRODERIE && <Histoire slides={false} Disque={Disque} actions={{ ouvrir: actions.ouvrir, visite: actions.visite, choisirFichier: fichier.choisir, aller }}
      objet={<div className="hi-objet"><Appareil type="ipad" src={adresse(A.ipad.src)} alt={A.ipad.alt} /></div>} entre={{
      "hi-indiennes": <RencontreOrbe cle="structure" variante="cartes" />,
      "hi-mulhouse": <RencontreDisque />,
      "hi-brodeuses": <RencontreOrbe cle="echelle" variante="loupes" />,
    }} />}
    {slide(heroEntree ? "accueil" : "ed-fils", "Nuancier DMC", <NuageFils />)}
    {!SITE_BRODERIE && <RencontreOrbe cle="palette" variante="echeveaux" />}
    {slide("ed-rosace", "Ma rosace", <RosaceNait />)}
    {SITE_BRODERIE && slide("ed-studio", "Dans le studio", <StudioDecouverte actions={actions} />)}
    {!SITE_BRODERIE && <Cadeau aller={aller} appareils={<div className="cd-appareils">
      <Appareil type="ordinateur" src={adresse(A.ordinateur.src)} alt={A.ordinateur.alt} />
      <Appareil type="iphone" src={adresse(A.iphone.src)} alt={A.iphone.alt} className="cd-iphone" />
      <p className="cd-appareils-legende">{A.legende}</p>
    </div>} />}
    <MaRosace aller={aller} guide={actions.visite} />
    {fichier.champ}
  </div>;
}
