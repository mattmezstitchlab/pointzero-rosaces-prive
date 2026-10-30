/**
 * LUMIERE — l'ouverture du site (« Découvrir AIME ») : du cinéma, pas un menu de cinéma.
 * À l'arrivée : le noir, puis une étoile au centre, qui devient la perle… Le film démarre seul, MUET (comme l'exigent les
 * navigateurs). Deux commandes discrètes : « Activer le son » (un coin) et « Passer » (le coin opposé). Rien d'autre.
 *  - Le son se cale sur la position actuelle du film (le lecteur lit le montage ; l'impact reste à 03:18.255 du morceau).
 *  - À la fin, la lumière blanchit et le Point rejoint le centre du VRAI Disque de la Première rencontre.
 *  - Passer : la Première rencontre, tout de suite (l'adresse devient la sienne : on ne revoit pas le film en rechargeant).
 *  - Mouvement réduit, ou rendu impossible : une image fixe, et l'accès direct à la Première rencontre.
 *  - La description du film existe pour les lecteurs d'écran ; elle ne s'impose pas à l'écran.
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { DUREE, EXTRAIT, IMAGES_PAR_SECONDE, REPERES, TABLEAUX, tableauA, scene, timeline } from "./partition";
import { ANIMATIQUE } from "./montages";
import { journal, Lecteur } from "./lecteur";
import { Rendu } from "./rendu";
import { verifier } from "../../lib/cinema/montage";
import { lireOne } from "../../lib/one/preferences";
import "../../design/aime.css";
import "./film.css";

const PremiereRencontre = lazy(() => import("../../one/PremiereRencontre"));
const BASE = import.meta.env.BASE_URL;
export const AUDIO_EXTRAIT = { url: BASE + "lumiere-prive/fleur-du-ciel-extrait.m4a", morceau: "fleur-du-ciel", debut: EXTRAIT.debut, fin: EXTRAIT.fin };
type Etat = "film" | "fixe" | "rencontre";
const mmss = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(3).padStart(6, "0")}`;

export function mouvementReduit() {
  return lireOne().affichage.reduceMotion || document.documentElement.dataset.pzMotion === "reduce" || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
export function webglDisponible() { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } }

export default function Film() {
  const params = new URLSearchParams(window.location.search);
  const controle = params.has("controle"), capture = params.has("capture");
  const depart = Math.min(DUREE - 0.5, Math.max(0, +(params.get("t") ?? 0) || 0));
  const [etat, setEtat] = useState<Etat>(() => capture ? "film" : (mouvementReduit() || !webglDisponible()) ? "fixe" : "film");
  const [son, setSon] = useState<"coupe" | "chargement" | "actif" | "absent">("coupe");
  const [t, setT] = useState(depart);
  const [vol, setVol] = useState(false);
  const toile = useRef<HTMLCanvasElement>(null), calque = useRef<HTMLCanvasElement>(null), video = useRef<HTMLVideoElement>(null), cadre = useRef<HTMLDivElement>(null);
  const lecteur = useRef<Lecteur | null>(null);
  const affiche = useRef(-1);
  const mobile = Math.min(window.innerWidth, window.innerHeight) < 600;

  useEffect(() => { document.title = "AIME — LUMIERE"; }, []);

  /* — le film démarre seul, muet — */
  useEffect(() => {
    if (etat !== "film" || !toile.current || !calque.current) return;
    const l = new Lecteur({
      montage: ANIMATIQUE, toile: toile.current, calque: calque.current, video: video.current, audio: AUDIO_EXTRAIT, mobile,
      surImage: x => { if (Math.abs(x - affiche.current) >= 0.25 || x >= DUREE) { affiche.current = x; setT(x); } },
      surFin: () => { if (!controle) versRencontre(true); },
      surEchec: () => { if (!capture) setEtat("fixe"); },
    });
    lecteur.current = l;
    if (l.statique) { setEtat("fixe"); return; }
    const dim = () => { const b = cadre.current!.getBoundingClientRect(); l.taille(b.width, b.height); };
    dim(); window.addEventListener("resize", dim);
    (window as unknown as { __lumiere: unknown }).__lumiere = { rendre: (x: number) => { l.aller(x); return scene(x); }, scene, timeline, DUREE, journal, lecteur: l, verifier: () => verifier(ANIMATIQUE) };
    let precharge = 0;
    if (!capture) {
      if (controle) l.aller(depart); else l.jouer(depart);
      /* la musique se prépare en silence (si elle existe ici) pour que « Activer le son » soit immédiat */
      precharge = window.setTimeout(() => void l.prechargerSon().then(b => { if (!b) setSon("absent"); }), 1200);
    }
    return () => { window.clearTimeout(precharge); window.removeEventListener("resize", dim); l.detruire(); lecteur.current = null; };
  }, [etat]); // eslint-disable-line react-hooks/exhaustive-deps

  const basculerSon = () => {
    const l = lecteur.current; if (!l) return;
    if (son === "actif") { l.couperSon(); setSon("coupe"); return; }
    setSon("chargement");
    void l.activerSon().then(ok => setSon(ok ? "actif" : "absent"));   /* créé dans le geste : l'iPhone l'accepte */
  };

  /* — la fin : la VRAIE Première rencontre ; le Point rejoint le centre de son Disque — */
  const versRencontre = (avecVol: boolean) => {
    lecteur.current?.detruire();
    try { history.replaceState(null, "", BASE + "one/premiere-rencontre"); } catch { /* adresse inchangée */ }
    setVol(avecVol && !mouvementReduit()); setEtat("rencontre");
  };
  useEffect(() => {
    if (etat !== "rencontre" || !vol) return;
    let essais = 0, fini = false;
    const chercher = () => {
      const cible = document.querySelector<HTMLElement>(".pzt-anneau") ?? document.querySelector<HTMLElement>(".one-marque .one-orbe");
      const orbe = document.querySelector<HTMLElement>(".lf-orbe");
      if (!cible || !orbe) { if (essais++ < 120) requestAnimationFrame(chercher); else setVol(false); return; }
      const a = orbe.getBoundingClientRect(), b = cible.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
      const anim = orbe.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(1.6)`, opacity: 1, offset: .75 }, { transform: `translate(${dx}px, ${dy}px) scale(2.4)`, opacity: 0 }],
        { duration: 1500, easing: "cubic-bezier(.5,0,.15,1)", fill: "forwards" });
      document.querySelector<HTMLElement>(".lf-voile")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1100, delay: 250, easing: "ease", fill: "forwards" });
      anim.onfinish = () => { if (!fini) { fini = true; setVol(false); } };
    };
    requestAnimationFrame(chercher);
    return () => { fini = true; };
  }, [etat, vol]);

  /* — clavier : Échap = passer ; contrôle : ← → une image, Espace lecture/pause — */
  useEffect(() => {
    if (etat !== "film") return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); versRencontre(false); return; }
      const l = lecteur.current; if (!controle || !l) return;
      if (e.key === " ") { e.preventDefault(); if (l.lecture) l.pause(); else l.jouer(); }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); l.aller(l.t + (e.key === "ArrowRight" ? 1 : -1) / IMAGES_PAR_SECONDE * (e.shiftKey ? 24 : 1)); setT(l.t); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  if (etat === "rencontre") return <>
    <Suspense fallback={null}><PremiereRencontre /></Suspense>
    {vol && <div className="lf-voile" aria-hidden="true"><span className="lf-orbe" /></div>}
  </>;

  if (etat === "fixe") return <Fixe onEntrer={() => versRencontre(false)} />;

  const tab = tableauA(t);
  return <main className="lf lf-film" data-aime="nuit" aria-label="LUMIERE, la naissance du Point : film d’ouverture de 44 secondes, facultatif">
    <div className="lf-cadre" ref={cadre}>
      <canvas ref={toile} className="lf-toile" aria-hidden="true" />
      <video ref={video} className="lf-video" hidden muted playsInline aria-hidden="true" />
      <canvas ref={calque} className="lf-calque" aria-hidden="true" />
    </div>
    {!capture && <>
      {son !== "absent" && <button type="button" className="lf-coin lf-coin-gauche" onClick={basculerSon} aria-pressed={son === "actif"} disabled={son === "chargement"}>
        <span aria-hidden="true" className="lf-icone">{son === "actif" ? "◖◗" : "◖"}</span>{son === "actif" ? "Couper le son" : son === "chargement" ? "Le son arrive…" : "Activer le son"}</button>}
      <button type="button" className="lf-coin lf-coin-droite" onClick={() => versRencontre(false)}>Passer<span aria-hidden="true" className="lf-fleche">→</span></button>
      {/* la description, pour les lecteurs d'écran seulement */}
      <p className="sr-only" aria-live="polite">{tab.nom}. {tab.texte}</p>
      {controle && <Controle t={t} aller={x => { lecteur.current?.aller(x); setT(x); }} />}
    </>}
  </main>;
}

/** Mouvement réduit, ou rendu impossible : une seule image fixe (la perle dans la lumière), et l'entrée dans .0NE. */
function Fixe({ onEntrer }: { onEntrer: () => void }) {
  const [image, setImage] = useState("");
  useEffect(() => {
    if (!webglDisponible()) return;
    const a = document.createElement("canvas"), b = document.createElement("canvas");
    try { const r = new Rendu(a, b, { qualite: 5 }); r.taille(1280, 720, 1); r.rendre(9.6); const c = document.createElement("canvas"); c.width = 1280; c.height = 720;
      const x = c.getContext("2d")!; x.drawImage(a, 0, 0); x.drawImage(b, 0, 0); setImage(c.toDataURL("image/jpeg", 0.9)); r.detruire(); } catch { /* le noir et le Point suffisent */ }
  }, []);
  return <main className="lf lf-fixe-plein" data-aime="nuit" aria-label="LUMIERE, image fixe">
    {image ? <img className="lf-fixe-image" src={image} alt="Dans l’obscurité, une perle de lumière nacrée traverse des nuages éclairés de l’intérieur." />
      : <span className="lf-point lf-point-seul" role="img" aria-label="Un point de lumière nacrée dans l’obscurité." />}
    <p className="sr-only">{TABLEAUX.map(x => `${x.nom}. ${x.texte}`).join(" ")}</p>
    <button type="button" className="lf-coin lf-coin-droite" onClick={onEntrer} autoFocus>Entrer<span aria-hidden="true" className="lf-fleche">→</span></button>
  </main>;
}

/** Les contrôles de montage (?controle) : la timeline mesurée, image par image, et la vérification des repères verrouillés. */
function Controle({ t, aller }: { t: number; aller: (t: number) => void }) {
  const tl = timeline(), v = verifier(ANIMATIQUE);
  return <section className="lf-controle" aria-label="Contrôles de montage">
    <p className="lf-mesure">t = {t.toFixed(3)} s · image {Math.round(t * IMAGES_PAR_SECONDE)} · morceau {mmss(EXTRAIT.debut + t)} · {tableauA(t).nom}
      {" · "}repères verrouillés : {v.synchro.map(s => `${s.repere.split(":")[1]} ${s.ecartMs === 0 ? "0 ms" : s.ecartMs + " ms"}`).join(", ")}</p>
    <input type="range" min={0} max={DUREE} step={1 / IMAGES_PAR_SECONDE} value={t} onChange={e => aller(+e.target.value)} aria-label="Position dans le film" />
    <div className="lf-reperes">{tl.map(r => <button key={r.id} type="button" title={r.quoi} onClick={() => aller(Math.max(0, r.t - (r.id === "contact" ? 1.5 : 0)))} style={{ left: `${(r.t / DUREE) * 100}%` }}>{r.id}</button>)}</div>
    <p className="lf-mesure">Contact : {mmss(REPERES.contact.musique)} du morceau = {REPERES.contact.t.toFixed(3)} s du film.</p>
  </section>;
}
