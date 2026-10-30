/**
 * LUMIERE — « La naissance du Point » : la première séquence expérimentale (44 s), branche privée lumiere-film.
 * Facultative : on peut la passer à tout instant ; le son ne démarre que sur un geste ; version silencieuse ; en mouvement
 * réduit, une représentation SANS animation (six images fixes, rendues par le même moteur) ; une version texte ; mobile.
 * À la fin, l'Orbe rejoint le VRAI composant de la Première rencontre (pas une image) : le Point nacré vole jusqu'à sa place.
 *
 * L'extrait sonore n'est jamais dans le dépôt ni dans le paquet : il est lu depuis un dossier privé local s'il existe,
 * ou choisi par la personne sur son appareil (l'extrait, ou le WAV original : on lit alors 03:04.25 → 03:48.25).
 */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { DUREE, EXTRAIT, IMAGES_PAR_SECONDE, REPERES, TABLEAUX, tableauA, scene, timeline } from "./partition";
import { Rendu } from "./rendu";
import { lireOne } from "../../lib/one/preferences";
import "../../design/aime.css";
import "./film.css";

const PremiereRencontre = lazy(() => import("../../one/PremiereRencontre"));
const URL_EXTRAIT = import.meta.env.BASE_URL + "lumiere-prive/fleur-du-ciel-0304-0348.wav";
type Etat = "accueil" | "film" | "fixe" | "texte" | "rencontre";
const mmss = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;

function mouvementReduit() {
  return lireOne().affichage.reduceMotion || document.documentElement.dataset.pzMotion === "reduce" || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
function webglDisponible() { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } }

export default function Film() {
  const params = new URLSearchParams(window.location.search);
  const controle = params.has("controle"), capture = params.has("capture");
  const [etat, setEtat] = useState<Etat>(capture ? "film" : "accueil");
  const [t, setT] = useState(+(params.get("t") ?? 0) || 0);
  const [lecture, setLecture] = useState(false);
  const [sonActif, setSonActif] = useState(false);
  const [sousTitres, setSousTitres] = useState(true);
  const [annonce, setAnnonce] = useState("");
  const [sonEtat, setSonEtat] = useState<"absent" | "pret" | "manquant" | "choisi">("absent");
  /* la musique est-elle servie ici ? (en ligne : non, tant que les droits ne sont pas validés) — on vérifie le TYPE : une page HTML n'est pas un son */
  const [dispo, setDispo] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const fichier = useRef<HTMLInputElement>(null);
  const apresChoix = useRef(false);
  useEffect(() => {
    if (capture) return;
    fetch(URL_EXTRAIT, { method: "HEAD" }).then(r => setDispo(r.ok && /audio|wav|octet/.test(r.headers.get("content-type") ?? ""))).catch(() => setDispo(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!message) return; const k = window.setTimeout(() => setMessage(""), 7000); return () => window.clearTimeout(k); }, [message]);
  const [vol, setVol] = useState(false);
  const toile = useRef<HTMLCanvasElement>(null), calque = useRef<HTMLCanvasElement>(null), cadre = useRef<HTMLDivElement>(null);
  const rendu = useRef<Rendu | null>(null);
  const horloge = useRef<{ debut: number; t0: number; audio?: { ctx: AudioContext; src: AudioBufferSourceNode; gain: GainNode } } | null>(null);
  const tampon = useRef<{ buffer: AudioBuffer; decalage: number } | null>(null);
  const tRef = useRef(t), affiche = useRef(t);
  const reduit = useRef(mouvementReduit());
  const mobile = typeof window !== "undefined" && Math.min(window.innerWidth, window.innerHeight) < 600;

  /* — le moteur de rendu, créé quand le film s'affiche — */
  useEffect(() => {
    if (etat !== "film" || !toile.current || !calque.current) return;
    let r: Rendu;
    try { r = new Rendu(toile.current, calque.current, { qualite: mobile ? 4 : 6, echelle: capture ? 1 : mobile ? 0.6 : 0.8 }); }
    catch { setEtat("texte"); setAnnonce("Le rendu n’est pas disponible sur cet appareil : voici la version texte."); return; }
    rendu.current = r;
    const dim = () => { const b = cadre.current!.getBoundingClientRect(); r.taille(b.width, b.height, capture ? 1 : Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75)); r.rendre(tRef.current); };
    dim(); window.addEventListener("resize", dim);
    (window as unknown as { __lumiere: unknown }).__lumiere = { rendre: (x: number) => { tRef.current = x; return r.rendre(x); }, scene, timeline, DUREE };
    return () => { window.removeEventListener("resize", dim); r.detruire(); rendu.current = null; };
  }, [etat]); // eslint-disable-line react-hooks/exhaustive-deps

  /* — la boucle : l'horloge est celle du son quand il joue (la musique fixe le rythme), sinon celle de la page — */
  useEffect(() => {
    if (!lecture || etat !== "film") return;
    let raf = 0;
    const tour = () => {
      const h = horloge.current; if (!h) return;
      const x = h.audio ? h.t0 + (h.audio.ctx.currentTime - h.debut) : h.t0 + (performance.now() - h.debut) / 1000;
      tRef.current = Math.min(x, DUREE); rendu.current?.rendre(tRef.current);
      if (Math.abs(tRef.current - affiche.current) > 0.1 || x >= DUREE) { affiche.current = tRef.current; setT(tRef.current); }
      if (x >= DUREE) { arreterSon(); setLecture(false); setT(DUREE); if (!controle) versRencontre(true); return; }
      raf = requestAnimationFrame(tour);
    };
    raf = requestAnimationFrame(tour);
    return () => cancelAnimationFrame(raf);
  }, [lecture, etat]); // eslint-disable-line react-hooks/exhaustive-deps

  const arreterSon = () => { const a = horloge.current?.audio; if (a) { try { a.src.stop(); } catch { /* déjà arrêté */ } void a.ctx.close(); } if (horloge.current) horloge.current.audio = undefined; };

  /* — l'extrait : depuis le dossier privé local, ou choisi par la personne — */
  const chargerExtrait = useCallback(async (source?: File): Promise<boolean> => {
    if (tampon.current) return true;
    try {
      const donnees = source ? await source.arrayBuffer() : await fetch(URL_EXTRAIT).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); });
      const ctx = new AudioContext(); const buffer = await ctx.decodeAudioData(donnees); void ctx.close();
      /* le WAV complet (≈ 4:13) : on lit le même passage, 03:04.25 → 03:48.25 */
      const decalage = buffer.duration > DUREE + 5 ? EXTRAIT.debut : 0;
      tampon.current = { buffer, decalage }; setSonEtat(source ? "choisi" : "pret"); return true;
    } catch { setSonEtat("manquant"); return false; }
  }, []);

  const jouer = useCallback(async (depuis: number, avecSon: boolean) => {
    arreterSon();
    let audio: NonNullable<typeof horloge.current>["audio"];
    if (avecSon && (tampon.current || await chargerExtrait())) {
      const ctx = new AudioContext(), src = ctx.createBufferSource(), gain = ctx.createGain();
      src.buffer = tampon.current!.buffer; src.connect(gain).connect(ctx.destination);
      /* les fondus du film (entrée 2 s, sortie 2 s) : appliqués au moment de la lecture ; le fichier reste intact */
      const k = 64; const courbe = new Float32Array(k); const restant = DUREE - depuis;
      for (let i = 0; i < k; i++) courbe[i] = scene(depuis + (restant * i) / (k - 1)).son;
      gain.gain.setValueCurveAtTime(courbe, ctx.currentTime + 0.02, Math.max(0.05, restant));
      src.start(ctx.currentTime + 0.02, tampon.current!.decalage + depuis);
      audio = { ctx, src, gain };
      horloge.current = { debut: ctx.currentTime + 0.02, t0: depuis, audio };
    } else {
      horloge.current = { debut: performance.now(), t0: depuis };
      if (avecSon) { const m = "La musique n’est pas disponible ici : le film se joue en silence. Revenez à l’accueil du film pour la choisir sur votre appareil."; setAnnonce(m); setMessage(m); }
    }
    setLecture(true);
  }, [chargerExtrait]); // eslint-disable-line react-hooks/exhaustive-deps

  const commencer = async (avecSon: boolean) => {
    reduit.current = mouvementReduit();
    if (reduit.current) { setEtat("fixe"); setAnnonce("Mouvement réduit : le film est présenté en six images fixes."); return; }
    if (!webglDisponible()) { setEtat("texte"); return; }
    const depart = Math.min(DUREE - 0.5, Math.max(0, +(params.get("t") ?? 0) || 0));   /* ?t= : reprendre à un instant (contrôle, tests) */
    setSonActif(avecSon); setEtat("film"); tRef.current = depart; setT(depart);
    requestAnimationFrame(() => void jouer(depart, avecSon));
  };
  const pause = () => { if (lecture) { arreterSon(); setLecture(false); setT(tRef.current); } else void jouer(tRef.current >= DUREE ? 0 : tRef.current, sonActif); };
  const basculerSon = () => { const v = !sonActif; setSonActif(v); if (lecture) void jouer(tRef.current, v); };
  const aller = (x: number) => { tRef.current = x; setT(x); rendu.current?.rendre(x); if (lecture) void jouer(x, sonActif); };

  /* — la fin : la VRAIE Première rencontre ; le Point vole jusqu'à l'Orbe de sa marque — */
  const versRencontre = (avecVol: boolean) => { arreterSon(); setLecture(false); setVol(avecVol && !reduit.current); setEtat("rencontre"); };
  useEffect(() => {
    if (etat !== "rencontre" || !vol) return;
    let essais = 0, fini = false;
    const chercher = () => {
      const cible = document.querySelector<HTMLElement>(".one-marque .one-orbe"), orbe = document.querySelector<HTMLElement>(".lf-orbe");
      if (!cible || !orbe) { if (essais++ < 120) requestAnimationFrame(chercher); else setVol(false); return; }
      const a = orbe.getBoundingClientRect(), b = cible.getBoundingClientRect();
      const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2), k = b.width / a.width;
      cible.style.visibility = "hidden";
      const anim = orbe.animate([{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${dx}px, ${dy}px) scale(${k})` }], { duration: 1100, easing: "cubic-bezier(.5,0,.15,1)", fill: "forwards" });
      document.querySelector<HTMLElement>(".lf-voile")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 150, easing: "ease", fill: "forwards" });
      anim.onfinish = () => { if (fini) return; fini = true; cible.style.visibility = ""; setVol(false); };
    };
    requestAnimationFrame(chercher);
    return () => { fini = true; const c = document.querySelector<HTMLElement>(".one-marque .one-orbe"); if (c) c.style.visibility = ""; };
  }, [etat, vol]);

  /* — clavier : Espace (lecture/pause), Échap (passer), ← → (contrôle : une image) — */
  useEffect(() => {
    if (etat !== "film") return;
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,button,a")) return;
      if (e.key === " ") { e.preventDefault(); pause(); }
      else if (e.key === "Escape") versRencontre(false);
      else if (controle && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); aller(Math.max(0, Math.min(DUREE, tRef.current + (e.key === "ArrowRight" ? 1 : -1) / IMAGES_PAR_SECONDE * (e.shiftKey ? 24 : 1)))); }
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  });

  const tab = tableauA(t);

  if (etat === "rencontre") return <>
    <Suspense fallback={null}><PremiereRencontre /></Suspense>
    {vol && <div className="lf-voile" aria-hidden="true"><span className="lf-orbe" /></div>}
  </>;

  if (etat === "accueil") return <main className="lf lf-accueil" data-aime="nuit">
    <div className="lf-accueil-corps">
      <span className="lf-point" aria-hidden="true" />
      <p className="lf-sur">AIME — LUMIERE</p>
      <h1>La naissance du Point</h1>
      <p className="lf-chapeau">Une séquence expérimentale de 44 secondes, sur un passage de « {EXTRAIT.morceau} ». Elle est facultative.</p>
      <div className="lf-actions">
        <button type="button" className="lf-bouton lf-plein" onClick={() => { if (dispo === false && !tampon.current) { apresChoix.current = true; fichier.current?.click(); } else void commencer(true); }}>{dispo === false && !tampon.current ? "Regarder avec le son (choisir la musique)" : "Regarder avec le son"}</button>
        <button type="button" className="lf-bouton" onClick={() => void commencer(false)}>Regarder sans le son</button>
        <button type="button" className="lf-bouton" onClick={() => setEtat("texte")}>Lire la version texte</button>
        <button type="button" className="lf-lien" onClick={() => versRencontre(false)}>Passer et commencer la Première rencontre</button>
        <a className="lf-lien" href={import.meta.env.BASE_URL + "explorer"}>Explorer tous les prototypes</a>
      </div>
      {dispo === false && sonEtat !== "choisi" && <div className="lf-son-absent" role="note">
        <p><b>La musique n’est pas publiée sur cette version en ligne</b> (les droits ne sont pas encore validés).</p>
        <p>Pour l’entendre, choisissez « 12-La Fleur Du Ciel.wav » (le WAV original, ou l’extrait) sur cet appareil. Il est lu ici et n’est envoyé nulle part.</p>
      </div>}
      <label className={"lf-fichier" + (dispo === false ? " lf-fichier-visible" : "")}>{sonEtat === "choisi" ? "Changer de fichier" : "Choisir la musique sur cet appareil"}
        <input ref={fichier} type="file" accept="audio/wav,.wav,audio/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; tampon.current = null;
          void chargerExtrait(f).then(ok => { const m = ok ? "Musique prête : elle reste sur cet appareil." : "Ce fichier n’a pas pu être lu comme un son."; setAnnonce(m); setMessage(m);
            if (ok && apresChoix.current) { apresChoix.current = false; void commencer(true); } }); }} /></label>
      {sonEtat === "choisi" && <p className="lf-note lf-pret">✓ Musique prête, depuis cet appareil ; rien n’est envoyé.</p>}
      {message && <p className="lf-message" role="status">{message}</p>}
      <p className="lf-note">Prototype privé · le son ne démarre que si vous le choisissez · Échap pour passer à tout moment.</p>
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </div>
  </main>;

  if (etat === "texte") return <main className="lf lf-texte" data-aime="nuit">
    <div className="lf-texte-corps">
      <p className="lf-sur">AIME — LUMIERE · version texte</p>
      <h1>La naissance du Point</h1>
      <ol>{TABLEAUX.map(x => <li key={x.id}><h2>{x.nom}</h2><p>{x.texte}</p></li>)}</ol>
      <p className="lf-chapeau">Puis la Première rencontre de .0NE commence.</p>
      <div className="lf-actions"><button type="button" className="lf-bouton lf-plein" onClick={() => versRencontre(false)}>Commencer la Première rencontre</button>
        <button type="button" className="lf-lien" onClick={() => setEtat("accueil")}>Retour</button></div>
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </div>
  </main>;

  if (etat === "fixe") return <Fixe annonce={annonce} onFin={() => versRencontre(false)} onRetour={() => setEtat("accueil")} />;

  /* — le film — */
  return <main className="lf lf-film" data-aime="nuit" aria-label="LUMIERE, la naissance du Point">
    <div className="lf-cadre" ref={cadre}>
      <canvas ref={toile} className="lf-toile" aria-hidden="true" />
      <canvas ref={calque} className="lf-calque" aria-hidden="true" />
    </div>
    {!capture && <>
      <div className="lf-barre">
        <button type="button" className="lf-bouton" onClick={pause} aria-label={lecture ? "Pause" : "Lecture"}>{lecture ? "Pause" : "Lecture"}</button>
        <button type="button" className="lf-bouton" onClick={basculerSon} aria-pressed={sonActif}>{sonActif ? "Son activé" : "Son coupé"}</button>
        <button type="button" className="lf-bouton" onClick={() => setSousTitres(v => !v)} aria-pressed={sousTitres}>Description</button>
        <button type="button" className="lf-bouton lf-plein lf-passer" onClick={() => versRencontre(false)}>Passer</button>
      </div>
      {sousTitres && <p className="lf-sous-titre" aria-live="polite"><b>{tab.nom}</b> {tab.texte}</p>}
      {controle && <Controle t={t} aller={aller} />}
      {message && <p className="lf-message lf-message-film" role="status">{message}</p>}
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </>}
  </main>;
}

/** La représentation sans animation : six images fixes rendues par le même moteur, que l'on parcourt soi-même. */
function Fixe({ annonce, onFin, onRetour }: { annonce: string; onFin: () => void; onRetour: () => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [i, setI] = useState(0);
  const instants = [REPERES.lumiere.t + 2.5, REPERES.traversee.t + 4, REPERES.suspension.t + 0.2, REPERES.contact.t + 2.5, REPERES.atlas.t - 1, REPERES.disque.t + 2.6];
  useEffect(() => {
    if (!webglDisponible()) return;
    const a = document.createElement("canvas"), b = document.createElement("canvas");
    try {
      const r = new Rendu(a, b, { qualite: 5 }); r.taille(960, 540, 1);
      const sortie = document.createElement("canvas"); sortie.width = 960; sortie.height = 540; const c = sortie.getContext("2d")!;
      setImages(instants.map(x => { r.rendre(x); c.drawImage(a, 0, 0); c.drawImage(b, 0, 0); return sortie.toDataURL("image/jpeg", 0.88); }));
      r.detruire();
    } catch { /* la version texte suffit */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const x = TABLEAUX[i];
  return <main className="lf lf-fixe" data-aime="nuit">
    <div className="lf-texte-corps">
      <p className="lf-sur">AIME — LUMIERE · sans animation · {i + 1} / {TABLEAUX.length}</p>
      {images[i] ? <img src={images[i]} alt={x.texte} className="lf-image" /> : <div className="lf-image lf-image-vide" />}
      <h2>{x.nom}</h2><p>{x.texte}</p>
      <div className="lf-actions">
        <button type="button" className="lf-bouton" disabled={i === 0} onClick={() => setI(i - 1)}>Précédent</button>
        {i < TABLEAUX.length - 1 ? <button type="button" className="lf-bouton lf-plein" onClick={() => setI(i + 1)}>Suivant</button>
          : <button type="button" className="lf-bouton lf-plein" onClick={onFin}>Commencer la Première rencontre</button>}
        <button type="button" className="lf-lien" onClick={onFin}>Passer</button>
        <button type="button" className="lf-lien" onClick={onRetour}>Retour</button>
      </div>
      <p className="sr-only" aria-live="polite">{annonce}</p>
    </div>
  </main>;
}

/** Les contrôles de montage (?controle) : la timeline mesurée, image par image. */
function Controle({ t, aller }: { t: number; aller: (t: number) => void }) {
  const tl = timeline();
  return <section className="lf-controle" aria-label="Contrôles de montage">
    <p className="lf-mesure">t = {t.toFixed(3)} s · image {Math.round(t * IMAGES_PAR_SECONDE)} · musique {mmss(EXTRAIT.debut + t)} · {tableauA(t).nom}</p>
    <input type="range" min={0} max={DUREE} step={1 / IMAGES_PAR_SECONDE} value={t} onChange={e => aller(+e.target.value)} aria-label="Position dans le film" />
    <div className="lf-reperes">{tl.map(r => <button key={r.id} type="button" title={r.quoi} onClick={() => aller(Math.max(0, r.t - (r.id === "contact" ? 1.5 : 0)))} style={{ left: `${(r.t / DUREE) * 100}%` }}>{r.id}</button>)}</div>
  </section>;
}
