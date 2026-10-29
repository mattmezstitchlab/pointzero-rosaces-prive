/**
 * La rosace qui naît : le vrai motif du moteur 5D (generer), révélé dans l'ordre où l'œil la comprend.
 * Le moteur n'est pas modifié : on lit seulement pattern.cross (un fil DMC par case) et on choisit quelles cases montrer.
 * 1. le point central · 2. un premier secteur (la symétrie) · 3. les huit secteurs · 4. les anneaux jusqu'au bord · 5. la composition complète.
 */
import { FLOSS } from "../../lib/dmc";
import { generer } from "../../lib/motif5d/generer";
import { codeDe, VERSION, type Signature } from "../../lib/motif5d/code";
import { lisse } from "./defilement";

export interface CaseRosace { x: number; y: number; f: number; d: number; secteur: number }
export interface Rosace { w: number; h: number; cases: CaseRosace[]; code: string; fils: number }

const cacheRosaces = new Map<string, Rosace>();
/** Le motif réel, à une taille donnée ; même demande → même motif (le moteur est déterministe). */
export function rosaceDe(signature: Signature, graine: number, cote = 81): Rosace {
  const code = codeDe({ signature, graine, version: VERSION });
  const cle = code + "@" + cote;
  const deja = cacheRosaces.get(cle); if (deja) return deja;
  const { pattern, controle } = generer({ signature, graine, version: VERSION, w: cote, h: cote });
  const cx = (pattern.w - 1) / 2, cy = (pattern.h - 1) / 2, dmax = Math.hypot(cx, cy) || 1;
  const cases: CaseRosace[] = [];
  for (let y = 0; y < pattern.h; y++) for (let x = 0; x < pattern.w; x++) {
    const f = pattern.cross[y * pattern.w + x]; if (f < 0) continue;
    const dx = x - cx, dy = y - cy, a = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    cases.push({ x, y, f, d: Math.hypot(dx, dy) / dmax, secteur: Math.floor(((a + 22.5) % 360) / 45) });
  }
  const r: Rosace = { w: pattern.w, h: pattern.h, cases, code, fils: controle.fils };
  cacheRosaces.set(cle, r);
  return r;
}

export const ETAPES_ROSACE = ["Le point central", "Une première symétrie", "Huit fois le même geste", "Les anneaux", "La composition complète"] as const;
export const SEUILS_ROSACE = [0, 0.08, 0.3, 0.45, 0.82];

/** Une case est-elle déjà née, à la progression p ? (et son opacité, pour une apparition douce) */
export function visibilite(c: CaseRosace, p: number): number {
  if (p >= 0.82) return 1;
  if (c.d <= 0.05) return lisse(0, 0.05, p);
  const rA = 0.05 + 0.4 * lisse(0.08, 0.3, p);
  if (c.d <= 0.45) {
    if (c.secteur === 0) return c.d <= rA ? 1 : 0;
    const debut = 0.3 + c.secteur * 0.018;
    return lisse(debut, debut + 0.03, p);
  }
  const rC = 0.45 + 0.6 * lisse(0.45, 0.82, p);
  return c.d <= rC ? Math.min(1, (rC - c.d) / 0.04) : 0;
}

/** Dessine la toile Aida et les croix visibles. `cote` : la taille CSS du carré ; le contexte est déjà mis à l'échelle de l'écran. */
export function dessinerRosace(ctx: CanvasRenderingContext2D, r: Rosace, cote: number, p: number) {
  const s = cote / r.w;
  ctx.clearRect(0, 0, cote, cote);
  ctx.fillStyle = "#f2eee5"; ctx.fillRect(0, 0, cote, cote);
  ctx.lineWidth = 1; ctx.strokeStyle = "rgba(60,50,40,.07)"; ctx.beginPath();
  for (let k = 0; k <= r.w; k++) { const v = Math.round(k * s) + 0.5; ctx.moveTo(v, 0); ctx.lineTo(v, cote); ctx.moveTo(0, v); ctx.lineTo(cote, v); }
  ctx.stroke();
  const parFil = new Map<string, Path2D>(), ombre = new Path2D(), m = s * 0.17;
  for (const c of r.cases) {
    const a = visibilite(c, p); if (a <= 0.02) continue;
    const cle = c.f + "|" + (a >= 0.99 ? 1 : Math.round(a * 4) / 4);
    let path = parFil.get(cle); if (!path) parFil.set(cle, (path = new Path2D()));
    const X = c.x * s, Y = c.y * s;
    path.moveTo(X + m, Y + m); path.lineTo(X + s - m, Y + s - m); path.moveTo(X + s - m, Y + m); path.lineTo(X + m, Y + s - m);
    ombre.moveTo(X + m, Y + m + 1); ombre.lineTo(X + s - m, Y + s - m + 1);
  }
  ctx.lineCap = "round";
  ctx.lineWidth = s * 0.32; ctx.strokeStyle = "rgba(0,0,0,.16)"; ctx.stroke(ombre);
  for (const [cle, path] of parFil) {
    const [f, a] = cle.split("|"); ctx.globalAlpha = Number(a);
    ctx.lineWidth = s * 0.32; ctx.strokeStyle = FLOSS[Number(f)]?.hex ?? "#888"; ctx.stroke(path);
    ctx.lineWidth = s * 0.08; ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.stroke(path);
  }
  ctx.globalAlpha = 1;
  /* le point central : la lueur du Point Zéro, tant que la rosace n'est pas née */
  if (p < 0.3) {
    const c = cote / 2, R = s * 3 * (1 - lisse(0.1, 0.3, p));
    const g = ctx.createRadialGradient(c, c, 0, c, c, R * 2.4); g.addColorStop(0, "rgba(201,184,255,.85)"); g.addColorStop(1, "rgba(201,184,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c, c, R * 2.4, 0, Math.PI * 2); ctx.fill();
  }
}
