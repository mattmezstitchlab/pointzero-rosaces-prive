import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { GlobalDock, ContextDock } from "./SiteDocks";
import TopDock from "./TopDock";
import UneFlorale from "./UneFlorale";
import TraineePoints from "./TraineePoints";
import "../design/aime.css";
import "./CrossStitchHome.css";
import { chapitresEdition, EditionEnLigne, type FonctionStudio } from "./edition/Edition";

/** L'édition (la nouvelle narration sous le héros) : en essai privé derrière ?edition, la page actuelle reste la même sans ce paramètre. */
/* le site Point Zéro (broderie seule) : l’édition en chapitres est sa landing, sans paramètre */
import { revelerSlide } from "./edition/Slides";
import { SITE_BRODERIE } from "../lib/site";
const HERO_SLIDES = [["accueil", "Nuancier DMC"], ["ed-rencontres", "Créer ma rosace"], ["ed-rosace", "Ma rosace"], ["ed-studio", "Dans le studio"]] as const;
const estEdition = () => { if (SITE_BRODERIE) return true; try { return new URLSearchParams(window.location.search).has("edition"); } catch { return false; } };

export type StitchEntry = "create" | "library" | "prepare" | "stitch";
interface Props {
  onStudio?: () => void;
  onFeature?: (fonction: FonctionStudio) => void;
  projectName: string;
  onOpen: (entry: StitchEntry) => void;
  onImport: (file: File) => void;
  onShare?: () => void;
  /** Mes ouvrages : l'atelier, le bloc des ouvrages ouvert dans le dock. À défaut, onOpen("library"). */
  onOuvrages?: () => void;
  /** ouvrir l'atelier avec la visite du Point */
  onVisite?: () => void;
}

/** Sélecteur de fichier : transmet le fichier une seule fois et permet de le choisir à nouveau. */
function pick(onImport: (file: File) => void) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onImport(file);
  };
}

function Imports({ onImport, hero = false }: { onImport: (file: File) => void; hero?: boolean }) {
  if (hero) return <div className="pzh-hero-import" role="group" aria-label="Importer dans Point Zéro">
    <label className="pzh-btn pzh-btn-clair pzh-import-pill">
      <span>Importer</span>
      <input id="pzh-import-unique" type="file" accept=".pdf,application/pdf,image/png,image/jpeg,image/webp,.json,application/json,.oxs" aria-label="Importer un PDF, une photo ou un projet" onChange={pick(onImport)} />
    </label>
  </div>;
  return <div>
        <div className="pzh-import">
          <div className="pzh-ways">
            <label className="pzh-way">
              <span><strong>Une photo</strong><span>Convertie en couleurs DMC, puis ajustée avant de broder.</span></span>
              <span aria-hidden="true">→</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Importer une photo pour la convertir en patron" onChange={pick(onImport)}/>
            </label>
            <label className="pzh-way">
              <span><strong>Le puzzle PDF</strong><span>Un patron en plusieurs pages : recomposez les pages sur le plateau magnétique, contrôlez les raccords et les symboles.</span></span>
              <span aria-hidden="true">→</span>
              <input type="file" accept=".pdf,application/pdf" aria-label="Importer un patron PDF multipage" onChange={pick(onImport)}/>
            </label>
            <label className="pzh-way">
              <span><strong>Un projet existant</strong><span>Rouvrez une sauvegarde JSON ou un fichier OXS.</span></span>
              <span aria-hidden="true">→</span>
              <input type="file" accept=".json,.oxs,application/json" aria-label="Ouvrir un projet JSON ou OXS" onChange={pick(onImport)}/>
            </label>
          </div>
          <label className="pzh-drop">
            <span className="pzh-drop-plus" aria-hidden="true">+</span>
            <strong>Choisir mon fichier</strong>
            <span>PNG, JPEG, WebP, PDF, JSON ou OXS</span>
            <input type="file" aria-label="Importer une image, un PDF ou un projet" accept="image/png,image/jpeg,image/webp,.pdf,.json,.oxs" onChange={pick(onImport)}/>
          </label>
        </div>
  </div>;
}

const IMG = import.meta.env.BASE_URL + "images/landing/";

/* Les chapitres : chacun montre, par l'image, une fonction du studio. Une phrase, pas plus. */
interface Chapitre { id: string; num: string; titre: string; phrase: string; detail: string; images: [string, string][]; teinte: string; cadrage: string }
export const CHAPITRES: Chapitre[] = [
  { id: "ch-zero", num: "I", titre: "Le point zéro", phrase: "Tout commence au centre de la grille.", detail: "Déposez une image, un patron PDF ou un projet : il s’ouvre là, en fils DMC.", images: [["ecran-point-zero.webp", "La grille vide de l’atelier, avec au centre le bouton rond d’import"]], teinte: "prune", cadrage: "20% 30%" },
  { id: "ch-docks", num: "II", titre: "Les docks", phrase: "Deux docks, et la grille entre eux.", detail: "Dessiner déplie tous les points et tous les outils ; choisir replie le dock.", images: [["ecran-dessiner.webp", "Le dock du haut déplié : la grille des points, des outils et des formes"]], teinte: "mousse", cadrage: "70% 60%" },
  { id: "ch-point", num: "III", titre: "Le Point", phrase: "L’orbe qui guide, et brode le geste.", detail: "À la première ouverture, il se pose sur chaque outil ; sur la croix, il la brode devant vous.", images: [["ecran-geste.webp", "Le Point, l’orbe nacrée, brode une croix sur le bouton Croix pendant la visite"]], teinte: "nuit", cadrage: "55% 20%" },
  { id: "ch-nuancier", num: "IV", titre: "Le nuancier", phrase: "Les fils scintillent là où ils sont brodés.", detail: "489 fils DMC, cherchés en français ; chaque pastille montre sa place sur la grille.", images: [["ecran-nuancier.webp", "Le nuancier DMC déplié dans le dock, les fils du motif en pastilles"]], teinte: "rose", cadrage: "62% 38%" },
  { id: "ch-loupe", num: "V", titre: "La loupe", phrase: "La grille, case par case, sous le pointeur.", detail: "Un dock sombre se déplie et suit la souris ou le doigt. Il ne modifie rien.", images: [["ecran-loupe.webp", "La loupe agrandit des pétales de rose, case par case"]], teinte: "ocre", cadrage: "40% 70%" },
  { id: "ch-lectures", num: "VI", titre: "Trois lectures", phrase: "La même grille, trois regards.", detail: "Réaliste comme une fois brodé, À plat pour les couleurs, Patron pour compter.", images: [["ecran-reel.webp", "Lecture réaliste"], ["ecran-lecture-a-plat.webp", "Lecture à plat"], ["ecran-lecture-patron.webp", "Lecture patron"]], teinte: "ardoise", cadrage: "75% 75%" },
  { id: "ch-broder", num: "VII", titre: "Broder", phrase: "Suivre le patron sans le redessiner.", detail: "Marquer une case, une ligne, un bloc ; la timeline suit chaque fil jusqu’au bout.", images: [["ecran-broder.webp", "Le mode Broder : des lignes marquées, la timeline de progression en bas"]], teinte: "vert", cadrage: "30% 80%" },
  { id: "ch-partager", num: "VIII", titre: "Partager", phrase: "Un PDF prêt à imprimer, ou en direct.", detail: "Le patron paginé, symboles et légende ; quelqu’un regarde l’ouvrage pendant que vous brodez.", images: [["ecran-exporter.webp", "Le panneau Exporter : le PDF paginé du patron de roses"]], teinte: "teal", cadrage: "50% 50%" },
];

/* Tout le studio, en une liste : le nom, puis une ligne. */
const TOUT: [string, string][] = [
  ["Tous les points", "Croix, demi-point, quart, trois quarts, petite croix, point arrière, point lancé, nœud, perle."],
  ["Les outils", "Main, gomme, remplir, pipette, sélection, lasso, déplacer, ligne, rectangle, ellipse, symétrie."],
  ["Composer", "Motifs à glisser, calques, sujets déplaçables, lettres en croix, redimensionner, nettoyer."],
  ["Importer", "Photo convertie en fils DMC, puzzle PDF recomposé, projets JSON et OXS, glisser-déposer."],
  ["Les fils", "489 références DMC, recherche en français, fils mélangés, perles Miyuki Delica, remplacer au plus proche."],
  ["Le stock", "Votre stock de fils, les fils manquants, la liste de courses, les quantités estimées."],
  ["Broder", "Marquer case, bloc ou ligne ; parking des fils, notes, cases à défaire, journal des séances."],
  ["Se repérer", "Le cercle de progression, la timeline fil par fil, la loupe, symboles, tout voir."],
  ["Partager", "Inviter à regarder en direct, visibilité, PDF paginé, SVG, PNG, JSON."],
  ["Garder", SITE_BRODERIE ? "Sauvegarde automatique sur cet appareil, Mes ouvrages, le fichier du projet à télécharger, hors ligne." : "Sauvegarde automatique, Mes ouvrages dans le dock, compte AIME synchronisé, hors ligne."],
  ["Confort", "Débutante, confirmée, experte ; contraste élevé, texte plus grand, stylet, clavier, lecteur d’écran."],
  ["Le Point", "La visite guidée de bout en bout, au clavier, qui imite le geste de chaque point."],
];

const SECTIONS = [["chapitres", "Le studio"], ["ch-point", "Le Point"], ["tout", "Tout le studio"], ["commencer", "Commencer"]] as const;

/** Un chapitre : un grand fond peint (la toile de roses, floutée et teintée), une phrase, l'écran réel ; tout bouge un peu au défilement. */
function ChapitreVue({ c, n, onVoir }: { c: Chapitre; n: number; onVoir: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [vu, setVu] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setVu(true); return; }
    const o = new IntersectionObserver(es => { for (const e of es) { if (e.isIntersecting) { setVu(true); if (e.intersectionRatio > .35) onVoir(c.id); } } }, { threshold: [0, .15, .35, .6] });
    o.observe(el); return () => o.disconnect();
  }, [c.id, onVoir]);
  return <section ref={ref} id={c.id} className={"ch ch-" + c.teinte + (n % 2 ? " ch-inverse" : "") + (vu ? " vu" : "")} aria-labelledby={c.id + "-titre"} data-parallaxe="">
    <div className="ch-fond" aria-hidden="true" style={{ backgroundImage: `url(${IMG}peinture-roses.webp)`, backgroundPosition: c.cadrage }} data-vitesse=".22" />
    <div className="ch-voile" aria-hidden="true" />
    <div className="ch-corps">
      <div className="ch-texte">
        <p className="ch-num">{c.num}</p>
        <h2 id={c.id + "-titre"} tabIndex={-1}>{c.titre}</h2>
        <p className="ch-phrase">{c.phrase}</p>
        <p className="ch-detail">{c.detail}</p>
      </div>
      <div className={"ch-ecrans ch-ecrans-" + c.images.length} data-vitesse="-.06">
        {c.images.map(([fichier, alt], k) => <figure key={fichier} className="ch-ecran" style={{ transitionDelay: k * 120 + "ms" }}>
          <img src={IMG + fichier} alt={alt} loading="lazy" decoding="async" width={1600} height={1000} />
          {c.images.length > 1 && <figcaption>{alt.replace("Lecture ", "")}</figcaption>}
        </figure>)}
      </div>
    </div>
  </section>;
}

/** Un seul écouteur pour le parallaxe : chaque élément [data-vitesse] glisse selon sa place dans l'écran. */
function useParallaxe() {
  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let image = 0;
    const pas = () => {
      image = 0; const H = window.innerHeight;
      document.querySelectorAll<HTMLElement>("[data-vitesse]").forEach(el => {
        const box = (el.closest("[data-parallaxe]") ?? el).getBoundingClientRect();
        if (box.bottom < -200 || box.top > H + 200) return;
        const centre = box.top + box.height / 2 - H / 2, v = parseFloat(el.dataset.vitesse || "0");
        el.style.transform = `translate3d(0, ${(centre * v).toFixed(1)}px, 0)`;
      });
    };
    const demander = () => { if (!image) image = requestAnimationFrame(pas); };
    window.addEventListener("scroll", demander, { passive: true }); window.addEventListener("resize", demander); demander();
    return () => { if (image) cancelAnimationFrame(image); window.removeEventListener("scroll", demander); window.removeEventListener("resize", demander); };
  }, []);
}

/** Un écran d'accueil seulement : l'ouvrir ne crée aucun patron et ne réécrit aucun projet. */
export default function CrossStitchHome({ projectName, onOpen, onImport, onShare, onOuvrages, onVisite, onStudio, onFeature }: Props) {
  const [current, setCurrent] = useState<string | null>(null);
  const [chapitre, setChapitre] = useState<string | null>(null);
  const enter = () => (onOuvrages ? onOuvrages() : onOpen("library"));
  const visite = () => (onVisite ? onVisite() : onOpen("create"));
  const [edition] = useState(estEdition);
  const [rencontre, setRencontre] = useState({ active: 0, titres: ["La forme", "Les lignes", "La finesse", "Les couleurs", "Le plein"] });
  const [contexte, setContexte] = useState("accueil");
  useEffect(() => {
    if (!SITE_BRODERIE) return;
    const etat = (e: Event) => setRencontre((e as CustomEvent<typeof rencontre>).detail);
    const ouvrir = (id: string) => {
      const cible = document.getElementById(id);
      const parent = cible?.closest<HTMLElement>("[data-hero-slide]")?.dataset.heroSlide;
      const slide = HERO_SLIDES.find(([cle]) => cle === id || cle === parent)?.[0];
      if (id === "ed-fils") setContexte("accueil");
      else if (slide) setContexte(slide);
    };
    const evenement = (e: Event) => ouvrir((e as CustomEvent<string>).detail);
    const ancre = () => ouvrir(window.location.hash.slice(1));
    window.addEventListener("pointzero:rencontres-etat", etat);
    window.dispatchEvent(new Event("pointzero:rencontres-demande"));
    window.addEventListener("pointzero:ouvrir-slide", evenement);
    window.addEventListener("hashchange", ancre); ancre();
    return () => { window.removeEventListener("pointzero:rencontres-etat", etat); window.removeEventListener("pointzero:ouvrir-slide", evenement); window.removeEventListener("hashchange", ancre); };
  }, []);
  const stage = useRef<HTMLDivElement>(null);
  const dernierDefilement = useRef(0);
  const toucher = useRef<{ x: number; y: number } | null>(null);
  const indexSlide = HERO_SLIDES.findIndex(([id]) => id === contexte);
  const choisirSlide = (id: string) => revelerSlide(id);
  useEffect(() => {
    if (!SITE_BRODERIE) return;
    if (stage.current) stage.current.scrollTop = 0;
    const frame = requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      // Ne pas laisser le focus dans une diapositive devenue invisible.
      if (document.activeElement?.closest("[hidden]")) document.getElementById("dock-section")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [contexte]);
  const changerRencontre = (n: number) => window.dispatchEvent(new CustomEvent("pointzero:rencontres-choisir", { detail: n }));
  const importer = () => document.getElementById("pzh-import-unique")?.click();
  const sections = SITE_BRODERIE
    ? [["ed-rencontres", "Composer"], ["ed-fils", "Nuancier"], ["ed-rosace", "Ma rosace"], ["ed-studio", "Outils"]] as const
    : SECTIONS;
  useParallaxe();

  // Repère : la section visible est mise en évidence dans le dock du bas.
  useEffect(() => {
    if (typeof window === "undefined" || SITE_BRODERIE) return;
    let frame = 0;
    const compute = () => {
      frame = 0;
      const line = window.innerHeight * 0.4;
      let found: string | null = null;
      const marks: [string, string | null][] = SITE_BRODERIE
        ? [["ed-rencontres", "ed-rencontres"], ["ed-fils", "ed-fils"], ["ed-rosace", "ed-rosace"]]
        : [["chapitres", "chapitres"], ["ch-point", "ch-point"], ["ch-nuancier", "chapitres"], ["tout", "tout"], ["csh-import", null], ["commencer", "commencer"]];
      for (const [id, key] of marks) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) found = key;
      }
      setCurrent(found);
      const premier = document.getElementById("chapitres"), tout = document.getElementById("tout");
      if (premier && tout && (premier.getBoundingClientRect().top > line || tout.getBoundingClientRect().top < line)) setChapitre(null);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame?.(compute) ?? 0; };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame?.(frame);
    };
  }, []);

  const go = (id: string) => (event: { preventDefault: () => void }) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const defiler = () => {
      el.scrollIntoView?.({ behavior: reduce ? "auto" : "smooth", block: "start" });
      window.history?.replaceState?.(null, "", window.location.pathname + window.location.search);
      (el.querySelector<HTMLElement>("h2") ?? el).focus?.({ preventScroll: true });
    };
    if (SITE_BRODERIE) { revelerSlide(id); }
    else defiler();
  };

  return <div className="cross-stitch-home" data-site={SITE_BRODERIE ? "broderie" : undefined} data-contexte={SITE_BRODERIE ? contexte : undefined}>
    <a className="csh-skip" href="#csh-main">Aller au contenu</a>
    <TraineePoints />

    {SITE_BRODERIE && <GlobalDock accueil={() => choisirSlide("accueil")} studio={onStudio ?? (() => onOpen("stitch"))} importer={importer} ouvrages={enter} visite={visite} />}
    {!SITE_BRODERIE && <TopDock label="Navigation point de croix" idBloc="pzh-menu"
      menu={[...(SITE_BRODERIE ? [{ label: "Importer", faire: importer }] : []), { label: "Mes ouvrages", faire: SITE_BRODERIE ? enter : () => onOpen("library") }, { label: "Ouvrir le studio", faire: () => onOpen("stitch") }, { label: "Faire la visite avec Le Point", faire: visite }]}
      droite={<button type="button" className="pzs-tool pzs-noir pzh-entrer" onClick={enter} aria-label={SITE_BRODERIE ? "Mes ouvrages" : "Entrer dans Point Zéro"}>{SITE_BRODERIE ? "Mes ouvrages" : <><span aria-hidden="true">+</span> Entrer</>}</button>}>
      {SITE_BRODERIE ? <button type="button" className="pzs-tool" onClick={() => onOpen("stitch")}>Ouvrir le studio</button> : <a className="pzs-tool" href="#chapitres" onClick={go("chapitres")}>Le studio</a>}
      <a className="pzs-tool" href={SITE_BRODERIE ? "#ed-fils" : edition ? "#ed-origine" : "#ch-point"} onClick={go(SITE_BRODERIE ? "ed-fils" : edition ? "ed-origine" : "ch-point")}>{SITE_BRODERIE ? "Nuancier" : "Le Point"}</a>
      {!SITE_BRODERIE && <a className="pzs-tool" href="#tout" onClick={go("tout")}>Tout le studio</a>}
      {SITE_BRODERIE ? <button type="button" className="pzs-tool" onClick={importer}>Importer</button> : <a className="pzs-tool" href="#csh-import" onClick={go("csh-import")}>Importer</a>}
    </TopDock>}

    {/* l'index des chapitres, à gauche, comme une table des matières qui suit la lecture */}
    {!edition && <nav className={"ix" + (chapitre ? " ix-on" : "")} aria-label="Chapitres">
      <p className="ix-tete">Point Zéro<span>Édition point de croix</span></p>
      <ol>{(SITE_BRODERIE ? chapitresEdition() : CHAPITRES).map(c => <li key={c.id}><a href={"#" + c.id} onClick={go(c.id)} aria-current={chapitre === c.id ? "true" : undefined}><span className="ix-nom">{c.titre}</span><span className="ix-points" aria-hidden="true" /><span className="ix-num">{c.num}</span></a></li>)}</ol>
    </nav>}

    <div ref={stage} className={SITE_BRODERIE ? "pzh-hero-stage" : undefined} onWheel={e => {
      if (!SITE_BRODERIE || Math.abs(e.deltaY) < 25 || (e.target as Element).closest('input, select, [role="menu"], .ed-fiche, .pz-photo-fiche')) return;
      const el = e.currentTarget, bas = el.scrollTop + el.clientHeight >= el.scrollHeight - 3;
      if ((e.deltaY > 0 && bas) || (e.deltaY < 0 && el.scrollTop <= 0)) {
        const maintenant = Date.now(); if (maintenant - dernierDefilement.current < 900) return;
        const suivant = Math.max(0, Math.min(HERO_SLIDES.length - 1, indexSlide + (e.deltaY > 0 ? 1 : -1)));
        if (suivant !== indexSlide) { dernierDefilement.current = maintenant; choisirSlide(HERO_SLIDES[suivant][0]); }
      }
    }}>
    <main id="csh-main" aria-roledescription={SITE_BRODERIE ? "carrousel" : undefined} aria-label={SITE_BRODERIE ? "Découvrir Point Zéro" : undefined}
      onTouchStart={e => {
        toucher.current = null;
        if (!SITE_BRODERIE || (e.target as Element).closest('button, input, textarea, select, a, label, canvas, [role="menu"], [role="slider"], [role="application"]')) return;
        const t = e.touches[0]; toucher.current = { x: t.clientX, y: t.clientY };
      }} onTouchEnd={e => {
        const p = toucher.current; toucher.current = null; const t = e.changedTouches[0];
        if (p && Math.abs(t.clientX - p.x) > 80 && Math.abs(t.clientX - p.x) > Math.abs(t.clientY - p.y) * 1.5) choisirSlide(HERO_SLIDES[Math.max(0, Math.min(HERO_SLIDES.length - 1, indexSlide + (t.clientX < p.x ? 1 : -1)))][0]);
      }} onTouchCancel={() => { toucher.current = null; }}>
      {!SITE_BRODERIE && <UneFlorale titre="Point Zéro">
        <p className="mm-sous">Du tableau à la dernière croix.</p>
        <ol className="mm-sommaire">{(edition ? chapitresEdition() : CHAPITRES).map(c => <li key={c.id}><a href={"#" + c.id} onClick={go(c.id)}>{c.titre}</a><span>{c.num}</span></li>)}</ol>
        <div className="mm-actions">
          <button className="pzh-btn pzh-btn-clair" onClick={() => onOpen("create")}>Créer mon patron</button>
          <button className="pzh-btn mm-btn-point" onClick={visite}><span className="pzh-dot" aria-hidden="true" />Faire la visite avec Le Point</button>
        </div>
      </UneFlorale>}

      {edition
        ? <div id="chapitres"><EditionEnLigne heroEntree={SITE_BRODERIE ? <div id="hero-import" className="pzh-hero-entree" tabIndex={-1}>
          <h2 className="sr-only">Importer mon patron</h2><div className="mm-actions">
          <Imports onImport={onImport} hero />
          <button type="button" className="pzh-btn" onClick={onStudio ?? (() => onOpen("stitch"))} title={"Reprendre « " + projectName + " »"}>Reprendre</button>
          <button type="button" className="pzh-btn" onClick={visite}><span className="pzh-dot" aria-hidden="true" />Faire la visite avec Le Point</button>
          </div><p className="pzh-hero-note">PDF, photo, JSON ou OXS · Vos fichiers restent sur votre appareil.<br />Un calage du PDF peut être nécessaire.</p>
        </div> : undefined} heroSlide={SITE_BRODERIE ? contexte : undefined} actions={{ fonction: onFeature, ouvrir: e => onOpen(e), importer: onImport, visite }} /></div>
        : <div id="chapitres" className="chapitres">
        {CHAPITRES.map((c, n) => <ChapitreVue key={c.id} c={c} n={n} onVoir={setChapitre} />)}
      </div>}

      {!SITE_BRODERIE && <section className="pzh-section tout" id="tout" aria-labelledby="tout-titre">
        <div className="tout-tete">
          <p className="pzh-kicker">Tout ce que fait le studio</p>
          <h2 id="tout-titre" tabIndex={-1}>Tout le studio</h2>
        </div>
        <dl className="tout-liste">{TOUT.map(([nom, ligne]) => <div key={nom}><dt>{nom}</dt><dd>{ligne}</dd></div>)}</dl>
        <p className="pzh-fine">Bientôt : les SAL à plusieurs, et les commentaires posés sur la grille.</p>
      </section>}

      {!SITE_BRODERIE && <section className="pzh-section" id="csh-import" aria-labelledby="csh-import-title">
        <div className="pzh-intro">
          <div>
            <p className="pzh-kicker">Partez de ce que vous aimez</p>
            <h2 id="csh-import-title" tabIndex={-1}>Importer</h2>
          </div>
          <p>Une photo, un patron, un projet à retrouver.</p>
        </div>
        <Imports onImport={onImport} />
        <p className="pzh-fine">Vérifiez les détails et les couleurs avant de broder. L’import PDF dépend du document ; un calage peut être nécessaire. Respectez les droits de l’auteur.</p>
      </section>}

      {!SITE_BRODERIE && <section className="pzh-section" id="commencer" aria-labelledby="pzh-resume-title">
        <div className="pzh-resume">
          <div>
            <p className="pzh-kicker">Projet actif sur cet appareil</p>
            <h2 id="pzh-resume-title" tabIndex={-1}>{projectName}</h2>
            <p>Reprenez là où vous vous êtes arrêtée, ou invitez quelqu’un à suivre votre ouvrage en lecture.</p>
          </div>
          <div className="pzh-actions">
            <button className="pzh-btn pzh-btn-primary" onClick={() => onOpen("stitch")}>Continuer à broder</button>
            <button className="pzh-btn pzh-btn-secondary" onClick={() => onOpen("library")}>Mes ouvrages</button>
            {onShare && <button className="pzh-btn pzh-btn-secondary" onClick={onShare}>Inviter à regarder</button>}
          </div>
        </div>
        <aside className="pzh-safety" aria-labelledby="csh-safety-title">
          <h3 id="csh-safety-title">Votre ouvrage mérite une vraie sauvegarde.</h3>
          <p>Le stockage du navigateur n’est pas une sauvegarde permanente : son effacement supprime les projets locaux. Dans le studio, téléchargez régulièrement votre projet JSON depuis Exporter. Les couleurs à l’écran sont indicatives et les quantités de fil estimées.</p>
        </aside>
      </section>}
    </main>

    <footer className="pzh-foot" hidden={SITE_BRODERIE && contexte !== "ed-studio"}>
      <p className="pzh-foot-brand"><span className="pzh-x" aria-hidden="true">×</span> Point Zéro</p>
      <nav aria-label="Plan du site Point Zéro" className="pzh-foot-cols">
        <div>
          <h2>Studio</h2>
          <ul>
            <li><button type="button" onClick={() => onOpen("create")}>Créer un patron</button></li>
            <li><button type="button" onClick={() => onOpen("prepare")}>Préparer</button></li>
            <li><button type="button" onClick={() => onOpen("stitch")}>Broder</button></li>
            <li><button type="button" onClick={() => onOpen("library")}>Mes ouvrages</button></li>
          </ul>
        </div>
        <div>
          <h2>Découvrir</h2>
          <ul>
            {(SITE_BRODERIE ? chapitresEdition() : CHAPITRES).map(c => <li key={c.id}><a href={"#" + c.id} onClick={go(c.id)}>{c.num}. {c.titre}</a></li>)}
            {!SITE_BRODERIE && <li><a href="#tout" onClick={go("tout")}>Tout le studio</a></li>}
          </ul>
        </div>
        <div>
          <h2>Aide</h2>
          <ul>
            <li><button type="button" onClick={visite}>Faire la visite avec Le Point</button></li>
            <li>{SITE_BRODERIE ? <button type="button" onClick={importer}>Importer</button> : <a href="#csh-import" onClick={go("csh-import")}>Importer un patron</a>}</li>
            <li>{SITE_BRODERIE ? <details className="pzh-sauvegarde-aide"><summary>Sauvegarde : ce qu’il faut savoir</summary><p>Vos ouvrages restent sur cet appareil. Effacer les données du navigateur peut les supprimer. Téléchargez régulièrement votre projet JSON depuis l’atelier pour le conserver.</p></details> : <a href="#commencer" onClick={go("commencer")}>Sauvegarder mon ouvrage</a>}</li>
          </ul>
        </div>
      </nav>
      <div className="pzh-dots" aria-hidden="true" />
      <p className="pzh-foot-line">Un studio AIME<sup>®</sup> · Point de croix</p>
    </footer>
    </div>

    {SITE_BRODERIE && <nav className="pz-disques-navigation" aria-label="Disques de découverte">{HERO_SLIDES.map(([id, titre], n) => <button key={id} type="button" onClick={() => choisirSlide(id)} aria-label={titre} aria-current={contexte === id ? "location" : undefined} title={titre}><span aria-hidden="true" className={"pz-mini-disque pz-mini-" + n} /></button>)}</nav>}
    {SITE_BRODERIE && <ContextDock label="Actions de la page">
      <div className="pzh-slide-navigation">
        <button type="button" aria-label="Section précédente" disabled={indexSlide === 0} onClick={() => choisirSlide(HERO_SLIDES[indexSlide - 1][0])}>←</button>
        <label className="sr-only" htmlFor="dock-section">Section du héros</label>
        <select id="dock-section" value={contexte} onChange={e => choisirSlide(e.target.value)}>{HERO_SLIDES.map(([id, titre], n) => <option key={id} value={id}>{n + 1}/{HERO_SLIDES.length} · {titre}</option>)}</select>
        <button type="button" aria-label="Section suivante" disabled={indexSlide === HERO_SLIDES.length - 1} onClick={() => choisirSlide(HERO_SLIDES[indexSlide + 1][0])}>→</button>
      </div>
      <div className="pzh-slide-actions">
      {contexte === "ed-rencontres" ? <>
        <button type="button" disabled={rencontre.active === 0} onClick={() => changerRencontre(rencontre.active - 1)}>Précédent</button>
        <label className="sr-only" htmlFor="dock-rencontre">Rencontre</label>
        <select id="dock-rencontre" value={rencontre.active} onChange={e => changerRencontre(Number(e.target.value))}>{rencontre.titres.map((t, n) => <option key={t} value={n}>{n + 1}/5 · {t}</option>)}</select>
        <button type="button" disabled={rencontre.active === 4} onClick={() => changerRencontre(rencontre.active + 1)}>Suivant</button>
      </> : contexte === "accueil" ? <>
        <button type="button" onClick={importer}>Importer</button>
        <button type="button" onClick={onStudio ?? (() => onOpen("stitch"))}>Reprendre</button>
        <button type="button" onClick={() => choisirSlide("ed-rencontres")}>Créer ma rosace</button>
      </> : null}
      </div>
    </ContextDock>}
    {!SITE_BRODERIE && <nav className="pzh-bottom" aria-label="Sections de la page">
      <button type="button" className="pzh-bottom-orb" aria-label="Le Point : faire la visite du studio" title="Le Point : faire la visite" onClick={visite} />
      {sections.map(([id0, label]) => [edition && id0 === "ch-point" ? (SITE_BRODERIE ? "ed-rencontres" : "ed-origine") : id0, label] as const).map(([id, label]) => <a key={id} href={"#" + id} onClick={go(id)} aria-current={current === id ? "location" : undefined} className={current === id ? "is-on" : undefined}>{label}</a>)}
    </nav>}
  </div>;
}
