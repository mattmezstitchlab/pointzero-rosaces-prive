/**
 * Une image qui devient broderie, et une loupe qui voit à travers : sous la loupe, le patron (la grille, les symboles, le fil).
 * La conversion est celle du studio (asyncRasterToCells : moyenne par case, fil DMC le plus proche en CIELAB, réduction des fils,
 * anti-confetti). Au défilement, la broderie gagne l'image depuis le centre ; la loupe suit la souris, le doigt, ou les flèches
 * du clavier (une case par pression, dix avec Maj), et dit la case et son fil.
 */
import { useEffect, useRef, useState } from "react";
import { asyncRasterToCells } from "../../lib/convert";
import { FLOSS } from "../../lib/dmc";
import { drawSymbol } from "../../lib/symbols";
import { suivreScene } from "./defilement";

export interface Broderie { cols: number; rows: number; cross: Int16Array; palette: number[] }
const images = new Map<string, Promise<HTMLImageElement>>(), broderies = new Map<string, Promise<Broderie>>();
/* l'image d'abord (elle s'affiche aussitôt), la broderie ensuite (la conversion du studio, hors du fil principal quand c'est possible) */
function chargerImage(src: string) {
  let p = images.get(src);
  if (!p) { p = (async () => { const img = new Image(); img.decoding = "async"; img.src = src; await img.decode(); return img; })(); images.set(src, p); }
  return p;
}
function chargerBroderie(src: string, cols: number, maxFils: number) {
  const cle = `${src}@${cols}/${maxFils}`;
  let p = broderies.get(cle);
  if (!p) {
    p = chargerImage(src).then(async img => {
      const rows = Math.max(1, Math.round(cols * img.naturalHeight / img.naturalWidth));
      const { cross, palette } = await asyncRasterToCells(img, cols, rows, { maxColors: maxFils, dropWhite: false, confetti: true });
      return { cols, rows, cross, palette };
    });
    broderies.set(cle, p);
  }
  return p;
}

/** Les fils les plus présents d'une broderie, rangés : pour dire « le rouge de cette étoffe est proche de DMC … ». */
export function filsDominants(b: Broderie, n = 3) { return b.palette.slice(0, n); }

export default function Brode({ src, cols: colsBase = 110, maxFils = 14, alt, legende, depart = 0.12, fin = 0.7, surFils, loupeDemandee }: {
  src: string; cols?: number; maxFils?: number;
  /** ce que montre l'image (lu par le lecteur d'écran) */
  alt: string;
  /** la légende visible : provenance, droits, « reconstitution » quand c'en est une */
  legende: string;
  /** la broderie gagne l'image entre ces deux progressions de la scène */
  depart?: number; fin?: number;
  /** quand la broderie est prête : ses fils (pour une fiche à côté) */
  surFils?: (b: Broderie) => void;
  /** un geste ailleurs (le disque) pose la loupe au centre ; le nombre change à chaque demande */
  loupeDemandee?: number;
}) {
  /* la finesse suit l'écran : des points plus nombreux sur un grand écran, moins sur un téléphone (même taille de croix à l'œil) */
  const [cols] = useState(() => Math.round(colsBase * Math.min(1.6, Math.max(0.7, (typeof window !== "undefined" ? window.innerWidth : 1280) / 1280))));
  const fig = useRef<HTMLElement>(null), toile = useRef<HTMLCanvasElement>(null), verre = useRef<HTMLCanvasElement>(null);
  const etat = useRef<{ b?: Broderie; patron?: HTMLCanvasElement; loupe: { x: number; y: number } | null; W: number; H: number; s: number; ox: number; oy: number; dpr: number }>({ loupe: null, W: 0, H: 0, s: 1, ox: 0, oy: 0, dpr: 1 });
  const [pret, setPret] = useState(false);
  const [dit, setDit] = useState("");
  const image = useRef(0);
  const surFilsRef = useRef(surFils); surFilsRef.current = surFils;

  /*
   * Trois couches, pour que le défilement ne coûte rien : la photographie (une image, cadrée en CSS),
   * la broderie (un canevas dessiné une fois par taille, découvert depuis le centre par un clip-path piloté en CSS par --p),
   * et la loupe (un canevas redessiné seulement quand elle bouge, qui montre le patron : grille, symboles, couleur pâle).
   */
  const preparer = () => {
    const e = etat.current, cv = toile.current, vr = verre.current; if (!cv || !vr || !e.b) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth || 600, H = cv.clientHeight || 400;
    e.W = W; e.H = H; e.dpr = dpr;
    for (const c of [cv, vr]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    const { cols, rows, cross } = e.b, s = Math.max(W / cols, H / rows);
    e.s = s; e.ox = (W - cols * s) / 2; e.oy = (H - rows * s) / 2;
    const bx = cv.getContext("2d"); if (!bx) return;
    bx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bx.fillStyle = "#eeebe3"; bx.fillRect(0, 0, W, H);
    bx.strokeStyle = "rgba(40,30,20,.08)"; bx.lineWidth = 1; bx.beginPath();
    for (let k = 0; k <= cols; k++) { const v = Math.round(e.ox + k * s) + .5; bx.moveTo(v, 0); bx.lineTo(v, H); }
    for (let k = 0; k <= rows; k++) { const v = Math.round(e.oy + k * s) + .5; bx.moveTo(0, v); bx.lineTo(W, v); }
    bx.stroke();
    const parFil = new Map<number, Path2D>(), ombre = new Path2D(), m = s * .16;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const f = cross[y * cols + x]; if (f < 0) continue;
      const X = e.ox + x * s, Y = e.oy + y * s;
      let p = parFil.get(f); if (!p) parFil.set(f, (p = new Path2D()));
      p.moveTo(X + m, Y + m); p.lineTo(X + s - m, Y + s - m); p.moveTo(X + s - m, Y + m); p.lineTo(X + m, Y + s - m);
      ombre.moveTo(X + m, Y + m + 1); ombre.lineTo(X + s - m, Y + s - m + 1);
    }
    bx.lineCap = "round"; bx.lineWidth = s * .32; bx.strokeStyle = "rgba(0,0,0,.18)"; bx.stroke(ombre);
    for (const [f, p] of parFil) { bx.lineWidth = s * .32; bx.strokeStyle = FLOSS[f]?.hex ?? "#888"; bx.stroke(p); bx.lineWidth = s * .08; bx.strokeStyle = "rgba(255,255,255,.28)"; bx.stroke(p); }
    e.patron = undefined;
  };
  /* le patron, vu à travers la loupe (deux fois plus grand) : fait au repos, ou au premier usage de la loupe */
  const preparerPatron = () => {
    const e = etat.current, cv = toile.current; if (!cv || !e.b || e.patron) return;
    const { cols, rows, cross, palette } = e.b, { s, W, H, dpr } = e;
    const pt = document.createElement("canvas"); pt.width = cv.width; pt.height = cv.height;
    const px = pt.getContext("2d"); if (!px) return;
    px.setTransform(dpr, 0, 0, dpr, 0, 0);
    px.fillStyle = "#fbfaf7"; px.fillRect(0, 0, W, H);
    const symbole = new Map(palette.map((f, k) => [f, k] as const));
    px.globalAlpha = .38;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const f = cross[y * cols + x]; if (f < 0) continue;
      px.fillStyle = FLOSS[f]?.hex ?? "#888"; px.fillRect(e.ox + x * s, e.oy + y * s, s, s);
    }
    px.globalAlpha = 1;
    px.beginPath(); px.strokeStyle = "rgba(20,20,24,.22)"; px.lineWidth = .5;
    for (let k = 0; k <= cols; k++) { const v = e.ox + k * s; px.moveTo(v, 0); px.lineTo(v, H); }
    for (let k = 0; k <= rows; k++) { const v = e.oy + k * s; px.moveTo(0, v); px.lineTo(W, v); }
    px.stroke();
    px.beginPath(); px.strokeStyle = "rgba(20,20,24,.6)"; px.lineWidth = 1;
    for (let k = 0; k <= cols; k += 10) { const v = e.ox + k * s; px.moveTo(v, 0); px.lineTo(v, H); }
    for (let k = 0; k <= rows; k += 10) { const v = e.oy + k * s; px.moveTo(0, v); px.lineTo(W, v); }
    px.stroke();
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const f = cross[y * cols + x]; if (f < 0) continue;
      drawSymbol(px, symbole.get(f) ?? 0, e.ox + x * s + s / 2, e.oy + y * s + s / 2, s * .32, "#141210");
    }
    e.patron = pt;
  };

  /* la loupe seule : redessinée quand elle bouge, jamais au défilement */
  const dessiner = () => {
    image.current = 0;
    const e = etat.current, vr = verre.current, ctx = vr?.getContext?.("2d"); if (!vr || !ctx) return;
    const dpr = e.dpr, { W, H } = e;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, vr.width, vr.height);
    if (!e.loupe) return;
    if (!e.patron) preparerPatron();
    if (!e.patron) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { x, y } = e.loupe, R = Math.max(54, Math.min(W, H) * .17);
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
    ctx.setTransform(dpr * 2, 0, 0, dpr * 2, -x * dpr, -y * dpr);
    ctx.drawImage(e.patron, 0, 0, vr.width / dpr, vr.height / dpr);
    ctx.restore();
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, R + 6, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.strokeStyle = "rgba(11,11,12,.55)"; ctx.stroke(); ctx.setLineDash([]);
  };
  const demander = () => { if (!image.current) image.current = requestAnimationFrame(dessiner); };

  useEffect(() => {
    let vivant = true;
    /* chargement paresseux : la conversion commence quand la scène approche (un écran et demi avant), pas au chargement de la page */
    const lancer = () => chargerBroderie(src, cols, maxFils).then(b => { if (!vivant) return; etat.current.b = b; preparer(); setPret(true); surFilsRef.current?.(b); demander();
      const repos = (window as unknown as { requestIdleCallback?: (f: () => void) => number }).requestIdleCallback; if (repos) repos(() => { if (vivant) preparerPatron(); }); }).catch(() => { /* l'image manque : la légende reste, rien ne casse */ });
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined" || !fig.current) void lancer();
    else { io = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { io?.disconnect(); io = null; void lancer(); } }, { rootMargin: "150% 0px 150% 0px" }); io.observe(fig.current); }
    const scene = fig.current?.closest<HTMLElement>(".ed-scene");
    const fin_ = scene ? suivreScene(scene) : undefined; // --p sur la scène : le CSS fait le reste
    let attente = 0;
    const r = () => { window.clearTimeout(attente); attente = window.setTimeout(() => { if (etat.current.b) { preparer(); demander(); } }, 150); };
    window.addEventListener("resize", r);
    return () => { vivant = false; io?.disconnect(); fin_?.(); window.clearTimeout(attente); window.removeEventListener("resize", r); if (image.current) cancelAnimationFrame(image.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, cols, maxFils]);

  const caseDe = (x: number, y: number) => { const e = etat.current; if (!e.b) return null; const c = Math.floor((x - e.ox) / e.s), r = Math.floor((y - e.oy) / e.s);
    if (c < 0 || r < 0 || c >= e.b.cols || r >= e.b.rows) return null; return { c, r, f: e.b.cross[r * e.b.cols + c] }; };
  const dire = (x: number, y: number) => { const k = caseDe(x, y); if (!k) return; const f = FLOSS[k.f];
    setDit(f ? `Colonne ${k.c + 1}, rang ${k.r + 1} : DMC ${f.code}, ${f.name}` : `Colonne ${k.c + 1}, rang ${k.r + 1} : toile nue`); };
  const poser = (x: number, y: number) => { etat.current.loupe = { x, y }; dire(x, y); demander(); };
  useEffect(() => { if (loupeDemandee) { const e = etat.current; poser(e.W / 2 || 300, e.H / 2 || 200); toile.current?.parentElement?.focus({ preventScroll: true }); } }, [loupeDemandee]); // eslint-disable-line react-hooks/exhaustive-deps
  const local = (ev: { clientX: number; clientY: number }) => { const r = toile.current!.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };

  const k = etat.current.loupe ? caseDe(etat.current.loupe.x, etat.current.loupe.y) : null;
  const fil = k && k.f >= 0 ? FLOSS[k.f] : null;
  return <figure ref={fig} className="ed-brode" data-pret={pret ? "oui" : "non"} style={{ ["--d" as string]: depart, ["--f" as string]: fin }}>
    <div className="ed-brode-vue" tabIndex={0} role="application" aria-roledescription="loupe sur la broderie"
      aria-label={`${alt}. Loupe : flèches pour la déplacer d’une case, Maj et flèches pour dix cases, Échap pour la retirer.`}
      onPointerMove={ev => { if (ev.pointerType === "mouse" || ev.buttons) { const { x, y } = local(ev); poser(x, y); } }}
      onPointerDown={ev => { const { x, y } = local(ev); poser(x, y); }}
      onPointerLeave={ev => { if (ev.pointerType === "mouse") { etat.current.loupe = null; demander(); } }}
      onFocus={() => { if (!etat.current.loupe) { const e = etat.current; poser(e.W / 2, e.H / 2); } }}
      onBlur={() => { etat.current.loupe = null; demander(); }}
      onKeyDown={ev => {
        const pas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
        const e = etat.current;
        if (ev.key === "Escape") { e.loupe = null; demander(); setDit("Loupe retirée."); return; }
        if (!pas) return; ev.preventDefault();
        const n = ev.shiftKey ? 10 : 1, l = e.loupe ?? { x: e.W / 2, y: e.H / 2 };
        poser(Math.max(0, Math.min(e.W - 1, l.x + pas[0] * n * e.s)), Math.max(0, Math.min(e.H - 1, l.y + pas[1] * n * e.s)));
      }}>
      <img className="ed-brode-photo" src={src} alt="" aria-hidden="true" decoding="async" loading="lazy" />
      <canvas ref={toile} className="ed-brode-toile" aria-hidden="true" />
      <canvas ref={verre} className="ed-brode-verre" aria-hidden="true" />
      {fil && etat.current.loupe && <span className="ed-brode-fil" aria-hidden="true" style={{ left: etat.current.loupe.x, top: etat.current.loupe.y }}><i style={{ background: fil.hex }} />DMC {fil.code}</span>}
    </div>
    <figcaption>{legende}</figcaption>
    <span className="ed-cache" role="status" aria-live="polite">{dit}</span>
  </figure>;
}
