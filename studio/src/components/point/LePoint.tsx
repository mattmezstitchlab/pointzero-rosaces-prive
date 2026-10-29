import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent as PE } from "react";
import { createPortal } from "react-dom";
import { anneau, hotePortail, nomAccessible, positionDe, secteurVise, tourner, type ModePoint } from "../../lib/point/modes";
import "./LePoint.css";

/**
 * Le Point, contrôleur universel : un seul bouton, un anneau de modes.
 * - Clic, Entrée ou Espace : l'anneau s'ouvre, le focus va sur Confort (toujours en haut, toujours premier).
 * - Dans l'anneau : flèches pour tourner, Début et Fin, Entrée pour ouvrir un mode, Échap pour refermer (le focus revient au Point).
 * - Poignée, facultative : tirer le Point vers un secteur ouvre ce mode directement. Jamais le seul chemin.
 * L'anneau s'ouvre au niveau de la page (portail) : aucun dock ne le rogne. Il reste juste après le Point dans l'ordre de lecture du lecteur d'écran grâce au focus géré.
 * L'anneau est un index : chaque mode ouvre ensuite un panneau ordinaire (formulaire, liste), lisible au clavier.
 */
const COTE = 264, RAYON = 80;

export default function LePoint({ modes, part = 0, teinte = "#FFFFFF", etiquette, guide = "cercle", annonceExterne, refBouton }: {
  modes: ModePoint[];
  /** pour rendre le focus au Point depuis l'extérieur (un panneau qui se ferme) */
  refBouton?: { current: HTMLButtonElement | null };
  /** l'Arc de remplissage : 0 à 1 (ici, l'avancement du patron) */
  part?: number;
  teinte?: string;
  /** ce que le Point dit de plus dans son nom (ex. « patron brodé à 40 % ») */
  etiquette?: string;
  guide?: string;
  /** une annonce venue d'un mode (ex. un réglage de confort) */
  annonceExterne?: string;
}) {
  const liste = anneau(modes);
  const [ouvert, setOuvert] = useState(false);
  const [focus, setFocus] = useState(0);
  const [onde, setOnde] = useState(0);
  const [annonce, setAnnonce] = useState("");
  const bouton = useRef<HTMLButtonElement>(null);
  const racine = useRef<HTMLDivElement>(null);
  const anneauRef = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLButtonElement | null)[]>([]);
  const tire = useRef<{ x: number; y: number; id: number } | null>(null);
  const tireTraite = useRef(false);
  const idMenu = useId();
  const n = liste.length;

  useEffect(() => { if (annonceExterne) setAnnonce(annonceExterne); }, [annonceExterne]);
  useEffect(() => { if (ouvert) items.current[focus]?.focus(); }, [ouvert, focus]);
  /* un clic ailleurs referme l'anneau, sans prendre le focus */
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e: PointerEvent) => { const t = e.target as Node; if (!racine.current?.contains(t) && !anneauRef.current?.contains(t)) setOuvert(false); };
    document.addEventListener("pointerdown", dehors);
    return () => document.removeEventListener("pointerdown", dehors);
  }, [ouvert]);

  const fermer = (rendre = true) => { setOuvert(false); if (rendre) requestAnimationFrame(() => bouton.current?.focus()); };
  const choisir = (i: number) => {
    const m = liste[i]; if (!m) return;
    setOuvert(false); setOnde(o => o + 1);
    if (!m.annonceEnPropre) setAnnonce(`Mode ${m.nom} ${m.actif ? "désactivé" : "activé"}.`);
    m.ouvrir();
  };
  const [pos, setPos] = useState({ left: 8, top: 8 });
  /* l'anneau s'ouvre au-dessus du Point, sans jamais sortir de l'écran (téléphone compris) */
  const placer = () => {
    const r = bouton.current?.getBoundingClientRect(); if (!r) return;
    const cx = r.left + r.width / 2, w = window.innerWidth || 1024;
    setPos({ left: Math.max(8, Math.min(cx - COTE / 2, w - COTE - 8)), top: Math.max(8, r.top - COTE - 10) });
  };
  const basculer = () => { if (ouvert) fermer(); else { placer(); setFocus(0); setOuvert(true); } };

  const onClick = () => { if (tireTraite.current) { tireTraite.current = false; return; } basculer(); };
  const onPointerDown = (e: PE<HTMLButtonElement>) => { if (e.button !== 0) return; tire.current = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* jsdom */ } };
  const onPointerUp = (e: PE<HTMLButtonElement>) => {
    const t = tire.current; tire.current = null; if (!t) return;
    const i = secteurVise(e.clientX - t.x, e.clientY - t.y, n);
    if (i !== null) { tireTraite.current = true; choisir(i); }
  };

  const onKeyMenu = (e: KeyboardEvent) => {
    /* les touches de l'anneau restent à l'anneau : le contexte (compositeur, grille) ne les reçoit pas */
    e.stopPropagation();
    const pas = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (pas) { e.preventDefault(); setFocus(f => tourner(f, n, pas)); return; }
    if (e.key === "Home") { e.preventDefault(); setFocus(0); }
    else if (e.key === "End") { e.preventDefault(); setFocus(n - 1); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); fermer(); }
    else if (e.key === "Tab") fermer(false);
  };

  const actifs = liste.filter(m => m.actif).map(m => m.nom);
  const nom = "Le Point : " + liste.map(m => m.nom).join(", ") + (actifs.length ? ". Actif : " + actifs.join(", ") : "") + (etiquette ? ". " + etiquette : "");
  const c = 2 * Math.PI * 11;
  const pt = (a: number) => { const t = a * Math.PI / 180; return (22 + 18 * Math.cos(t)).toFixed(2) + " " + (22 + 18 * Math.sin(t)).toFixed(2); };
  const arcs = Array.from({ length: 12 }, (_, k) => { const a0 = -90 + k * 30 + 5, a1 = a0 + 20; return "M " + pt(a0) + " A 18 18 0 0 1 " + pt(a1); });

  return <div className="lp" ref={racine}>
    <button ref={el => { bouton.current = el; if (refBouton) refBouton.current = el; }} type="button" data-guide={guide} className="pzs-cercle lp-point" aria-haspopup="menu" aria-expanded={ouvert} aria-controls={idMenu}
      aria-label={nom} title="Le Point : confort, loupe, guide…" onClick={onClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { tire.current = null; }}>
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden="true">
        {arcs.map((d, k) => <path key={k} d={d} fill="none" stroke={teinte} strokeOpacity={.55} strokeWidth={2} strokeLinecap="round" />)}
        <circle cx="22" cy="22" r="11" fill="none" stroke="#fff" strokeOpacity={.18} strokeWidth="2" />
        <circle cx="22" cy="22" r="11" fill="none" stroke={teinte} strokeWidth="2" strokeDasharray={`${(c * part).toFixed(1)} ${c.toFixed(1)}`} transform="rotate(-90 22 22)" />
        <circle cx="22" cy="22" r="5.5" fill="url(#lp-iris)" />
        {actifs.length > 0 && <circle cx="37" cy="7" r="3.5" fill="#fff" stroke="#0b0b0c" strokeWidth="1.5" />}
        <defs><radialGradient id="lp-iris" cx="35%" cy="32%" r="75%"><stop offset="0%" stopColor="#ffffff" /><stop offset="35%" stopColor="#d9e8ff" /><stop offset="60%" stopColor="#c9b8ff" /><stop offset="80%" stopColor="#ffd6ec" /><stop offset="100%" stopColor="#b9f0e4" /></radialGradient></defs>
      </svg>
      {onde > 0 && <span key={onde} className="lp-onde" aria-hidden="true" />}
    </button>
    {ouvert && createPortal(<div ref={anneauRef} id={idMenu} className="lp-anneau" role="menu" aria-label="Les modes du Point" aria-orientation="horizontal" onKeyDown={onKeyMenu} style={{ width: COTE, height: COTE, left: pos.left, top: pos.top }}>
      <svg className="lp-trace" width={COTE} height={COTE} aria-hidden="true">
        <circle cx={COTE / 2} cy={COTE / 2} r={RAYON} fill="none" />
        <line x1={COTE / 2} y1={COTE / 2 - RAYON - 30} x2={COTE / 2} y2={COTE / 2 - RAYON - 18} />
      </svg>
      <span className="lp-centre" aria-hidden="true" />
      {liste.map((m, i) => { const { x, y } = positionDe(i, n, RAYON, COTE);
        return <button key={m.id} ref={el => { items.current[i] = el; }} type="button" role="menuitem" tabIndex={i === focus ? 0 : -1}
          className={"lp-secteur lp-" + m.groupe} data-mode={m.id} aria-label={nomAccessible(m)} title={m.aide}
          style={{ left: x, top: y }} onClick={() => choisir(i)} onFocus={() => setFocus(i)}>
          {m.actif && <span className="lp-marque" aria-hidden="true" />}{m.nom}
        </button>; })}
    </div>, hotePortail(bouton.current))}
    <span className="lp-annonce" role="status" aria-live="polite">{annonce}</span>
  </div>;
}
