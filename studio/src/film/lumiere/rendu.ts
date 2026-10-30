/**
 * LUMIERE — le rendu. Un seul shader (WebGL2) pour les matières : cosmos, nuages, brume, perle nacrée, goutte transparente,
 * eau. Un calque 2D, par-dessus, pour la géométrie Ripple (anneaux, repères, positions) et le Disque .0NE.
 * Les deux lisent le MÊME contrat d'onde (lib/onde/contrat) : les fronts qui ondulent dans l'eau sont exactement ceux que le
 * calque dessine en lignes. Chaque image est une fonction pure du temps t : rendu exact, image par image.
 */
import { ANNEAUX_PRINCIPAUX, ANNEAU_HEURES, ANNEAU_PERSONNES, fronts, polarXY, reperes, versAnneaux } from "../../lib/onde/contrat";
import { geometrieDisque } from "../../lib/tambour/disque";
import { ONDE_FILM, REPERES, scene, type Scene } from "./partition";

const F = 1.6, D = 3.75, D0 = 1.9, SHIFT0 = -0.12, PHI0 = Math.atan(0.2 / F);
const MAX_FRONTS = 8;

const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT, uQ;
uniform float uEtoiles, uNuages, uDefil, uBrume;
uniform vec4 uPerle; uniform float uPerleVis, uGoutte, uEtire;
uniform float uD; uniform float uEau, uPhi, uShift, uDepuis, uGrille, uCarres, uBlanc, uLueur, uRepli;
uniform vec4 uFronts[${MAX_FRONTS}]; uniform float uEsp;

#define PI 3.14159265
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float bruit(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 6; i++){ if (float(i) >= uQ) break; s += a*bruit(p); p = m*p; a *= .5; } return s; }

/* la nacre : un blanc irisé (interférence de couche mince) */
vec3 nacre(float x){ vec3 film = .5 + .5*cos(6.2832*(vec3(0., .33, .67) + x));
  return mix(vec3(.97, .965, 1.), mix(vec3(.85, .9, 1.), film, .55), clamp(x*.9, 0., 1.)); }

/* la lumière de la perle sur le monde (elle éclaire nuages, brume et particules) */
float lumierePerle(vec2 p){ vec2 d = p - uPerle.xy; return uPerleVis * uPerle.w * exp(-length(d)*3.2); }

vec3 cosmos(vec2 p){
  vec3 c = mix(vec3(.004, .006, .018), vec3(.012, .01, .03), smoothstep(-.6, .7, p.y));
  /* étoiles : trois profondeurs, scintillement lent */
  float e = 0.;
  for (int k = 0; k < 3; k++){ float s = 70. + float(k)*55.; vec2 q = p*s + vec2(float(k)*17.3, uDefil*float(k+1)*6.);
    vec2 i = floor(q), f = fract(q) - .5; float r = h21(i); if (r > .965){ float b = (r - .965)/.035;
      float tw = .65 + .35*sin(uT*(1.2 + r*2.) + r*40.); e += b*tw*smoothstep(.09, 0., length(f))*(1. - float(k)*.28); } }
  c += vec3(.8, .85, 1.)*e*uEtoiles;
  /* une nébuleuse à peine visible : l'immensité, pas un décor */
  c += vec3(.05, .035, .09)*fbm(p*1.2 + vec2(0., uDefil*.4))*uEtoiles*.6;
  return c;
}

vec3 nuages(vec2 p, vec3 c){
  if (uNuages <= 0.001 && uBrume <= 0.001) return c;
  float L = lumierePerle(p);
  /* trois couches qui défilent vers le haut quand la perle descend (parallaxe) */
  for (int k = 0; k < 3; k++){ float fk = float(k), z = 1. + fk*.7;
    vec2 q = p*z*1.4 + vec2(fk*7.1, -uDefil*(2.2 + fk*1.6) - uT*.01*(fk+1.));
    q += .35*vec2(fbm(q*.7 + 3.), fbm(q*.7 - 2.));                       /* déformation : volume */
    float d = smoothstep(.42 - fk*.04, .85, fbm(q));
    float bord = smoothstep(.0, .25, d) - smoothstep(.35, .9, d);
    vec3 ombre = vec3(.03, .028, .065), lumi = mix(vec3(.78, .76, .95), nacre(.15 + fbm(q*2.)*.35), .3)*1.05;
    vec3 col = ombre + lumi*(.16 + 1.9*L)*(.4 + bord) + vec3(.06, .05, .1)*.4;
    c = mix(c, col, d*uNuages*(.55 + fk*.15));
  }
  /* la brume : un voile éclairé de l'intérieur ; les particules en suspension se révèlent près de la perle */
  float b = fbm(p*2.2 + vec2(uT*.03, -uDefil*1.5));
  c = mix(c, vec3(.15, .14, .23) + vec3(.85, .83, 1.)*L*.8, uBrume*.55*smoothstep(.2, .9, b));
  float part = 0.;
  for (int k = 0; k < 2; k++){ vec2 q = p*(38. + float(k)*30.) + vec2(uT*.08, -uDefil*20. + uT*.05*float(k+1));
    vec2 i = floor(q), f = fract(q) - .5 + .3*vec2(h21(i+1.) - .5, h21(i+2.) - .5);
    float r = h21(i); if (r > .9) part += smoothstep(.06, .0, length(f))*(r - .9)*10.; }
  c += nacre(.5)*part*(.04 + 2.4*L)*max(uBrume, uNuages*.6);
  return c;
}

/* la surface : la somme des fronts du contrat (même formule que hauteur()) */
float hauteurEau(float r){
  float h = 0.;
  for (int k = 0; k < ${MAX_FRONTS}; k++){ vec4 f = uFronts[k]; if (f.w < .5) continue;
    float d = r - f.x, w = uEsp*.5; h += f.y*exp(-(d*d)/(2.*w*w))*cos(d/uEsp*2.*PI + f.z*2.*PI); }
  return h;
}
float lueurFronts(float r){
  float g = 0.;
  for (int k = 0; k < ${MAX_FRONTS}; k++){ vec4 f = uFronts[k]; if (f.w < .5) continue;
    float d = r - f.x; g += f.y*exp(-(d*d)/(2.*pow(uEsp*.16, 2.))); }
  return g;
}

/* le ciel au-dessus de l'eau (et le ciel réfléchi) */
vec3 cielEau(vec3 rd, vec2 pPerle){
  float y = max(rd.y, 0.);
  vec3 c = mix(vec3(.11, .1, .17), vec3(.012, .012, .035), pow(y, .45));
  c += vec3(.13, .12, .2)*exp(-y*5.)*.55 + vec3(.1, .09, .15)*exp(-y*28.)*.25;                                  /* la brume sur l'horizon */
  return c;
}

vec3 eau(vec2 p, vec2 q, out float masque){
  float s = sin(uPhi), co = cos(uPhi);
  vec3 ro = vec3(0., uD*s, -uD*co), fw = normalize(-ro), rt = vec3(1., 0., 0.), up = cross(fw, rt);
  vec3 rd = normalize(fw*${F.toFixed(2)} + rt*q.x + up*q.y);
  if (rd.y > -.0005){ masque = 0.; return cielEau(rd, uPerle.xy); }
  masque = 1.;
  float t = -ro.y/rd.y; vec3 hit = ro + rd*t; vec2 xz = hit.xz; float r = length(xz);
  /* la normale : dérivée radiale de la hauteur + une micro-agitation infime (l'eau vit, sans bouger avant l'impact) */
  float e = .002, dh = (hauteurEau(r + e) - hauteurEau(r - e))/(2.*e);
  vec2 dir = r > 1e-4 ? xz/r : vec2(0.);
  float micro = (fbm(xz*9. + uT*.15) - .5)*.0016;
  vec3 n = normalize(vec3(-dh*dir.x*.12 + micro*2.2, 1., -dh*dir.y*.12 + micro*1.6));
  vec3 rf = reflect(rd, n);
  float fres = .02 + .98*pow(1. - max(dot(-rd, n), 0.), 5.);
  vec3 refl = cielEau(rf, uPerle.xy);
  /* le reflet de la goutte : miroir de sa position par rapport au point de contact (avant l'impact) */
  vec2 m = vec2(p.x, 2.*uShift - p.y) + n.xz*.5;
  vec2 dp = m - uPerle.xy; float rr = uPerle.z*(1. + .6*uGoutte);
  refl += nacre(.4)*uPerleVis*uPerle.w*(exp(-length(dp)/(rr*1.1))*.7 + exp(-length(dp)*12.)*.12)*(1. - uEtire*.3);
  /* sous la surface : l'eau profonde ; la lumière entrée dans l'eau au centre ; la grille d'ATLAS */
  /* le chemin de lumière : la perle (au-dessus du point de contact) se reflète en scintillant */
  vec3 Lp = vec3(0., .55*uD/3.75, 0.);
  float sc = pow(max(dot(rf, normalize(Lp - hit)), 0.), 380.);
  refl += vec3(.92, .9, 1.)*sc*uPerleVis*uPerle.w*2.2 + vec3(.6, .58, .8)*pow(max(dot(rf, normalize(Lp - hit)), 0.), 30.)*uPerleVis*.05;
  vec2 sous = xz + n.xz*.35;
  vec3 prof = vec3(.006, .012, .028);
  float entree = smoothstep(0., .08, uDepuis)*exp(-max(uDepuis, 0.)*.08);
  prof += nacre(.35)*entree*exp(-length(sous)*9.)*.9;
  float cellule = .125;
  vec2 g = sous/cellule, gi = floor(g), gf = abs(fract(g) - .5);
  float lignes = smoothstep(.49, .5, max(gf.x, gf.y));
  float carre = step(.86 - uCarres*.22, h21(gi + 3.))*smoothstep(.48, .3, max(gf.x, gf.y));
  float revele = smoothstep(.0, .35, uGrille)*smoothstep(1.15, .15, length(gi*cellule)/(.2 + uGrille*1.1));
  vec3 grille = mix(vec3(.82, .84, 1.), nacre(.2 + h21(gi)*.5), .35)*(lignes*.16*uGrille + carre*.3*uCarres*(.7 + .3*sin(uT*1.2 + h21(gi)*12.)))*revele;
  vec3 col = mix(prof + grille, refl, fres);
  /* la lumière des fronts (la ligne de l'onde) ; elle s'affirme quand la caméra s'élève */
  float lu = lueurFronts(r);
  col += mix(vec3(.85, .85, 1.), nacre(.3 + r*.4), .4)*lu*(.22 + .45*uLueur)*smoothstep(4., .2, r);
  /* une lumière douce et brève au contact (pas d'explosion) */
  float flash = exp(-max(uDepuis, 0.)*5.)*step(0., uDepuis);
  col += vec3(.95, .93, 1.)*flash*(exp(-r*18.)*1.8 + exp(-r*4.)*.25);
  /* la brume au loin */
  col = mix(col, cielEau(vec3(rd.x, 0.002, rd.z), uPerle.xy), smoothstep(5., 26., t)*.85);
  return col;
}

/* la perle, puis la goutte (même objet) ; sa lumière doit exister même sur quelques pixels */
vec4 perle(vec2 p, vec3 fond){
  if (uPerleVis <= .001) return vec4(0.);
  vec2 q = p - uPerle.xy; float r = uPerle.z;
  q.y /= (1. + uEtire*.18);                                          /* l'étirement de la chute */
  /* la forme : une sphère qui devient goutte (pointe vers le haut) */
  float haut = r*(1. + 1.25*uGoutte);
  float larg = q.y <= 0. ? r*sqrt(max(0., 1. - (q.y*q.y)/(r*r))) : r*pow(max(0., 1. - q.y/haut), 1.25 + .4*uGoutte)*(1. - .02*uGoutte);
  float dedans = (q.y > -r && q.y < haut && larg > 0.) ? smoothstep(1.5/uRes.y, -1.5/uRes.y, abs(q.x) - larg) : 0.;
  float d = length(q);
  vec3 c = vec3(0.); float a = 0.;
  /* le halo et l'éclat (lisibles quand la perle n'occupe que quelques pixels) */
  float halo = exp(-max(d - r, 0.)/(r*1.6 + .004))*.55 + exp(-d*18.)*.18;
  float tw = .8 + .2*sin(uT*2.1);
  float etoile = (exp(-abs(q.x)*900.)*exp(-abs(q.y)*60.) + exp(-abs(q.y)*900.)*exp(-abs(q.x)*60.))*smoothstep(.02, .004, r)*tw;
  c += nacre(.35)*(halo + etoile*.8)*uPerle.w; a = 0.;
  if (dedans > 0.){
    vec2 u = vec2(q.x/max(larg, 1e-5), q.y <= 0. ? q.y/r : q.y/haut);
    vec3 n = normalize(vec3(u.x, u.y*.8, sqrt(max(.02, 1. - dot(u, u)*.7))));
    vec3 L = normalize(vec3(-.45, .6, .65));
    float dif = max(dot(n, L), 0.), spec = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.), 70.), bord = pow(1. - n.z, 2.2);
    /* perle : nacre opaque, irisée sur les bords */
    vec3 nac = nacre(.15 + bord*1.1 + .08*sin(uT*.7))*(.42 + .62*dif) + spec*1.2 + nacre(.8)*bord*.25;
    /* goutte : transparente ; elle réfracte le fond (décalé) et garde un cœur nacré */
    /* une goutte est une lentille : elle montre le monde inversé (la brume de l'horizon passe en bas) */
    vec3 refr = mix(vec3(.05, .05, .09), vec3(.42, .4, .58), smoothstep(.4, -.6, u.y))*.9 + fond*.25;
    float dc = length(q - vec2(0., -r*.12))/r;
    vec3 coeur = nacre(.25 + .2*sin(uT))*(smoothstep(.62, .12, dc)*1.15 + smoothstep(1., .3, dc)*.18);
    float caus = smoothstep(.35, 0., length(q - vec2(r*.1, -r*.62))/r)*.9;
    vec3 gtt = refr + coeur + spec*1.6 + bord*vec3(.62, .64, .82)*1.1 + vec3(.95, .93, 1.)*caus;
    c = mix(c, mix(nac, gtt, uGoutte), dedans); a = dedans;
  }
  return vec4(c*uPerleVis, a*uPerleVis);
}

void main(){
  vec2 p = (gl_FragCoord.xy - .5*uRes)/uRes.y;
  vec3 col = cosmos(p);
  col = nuages(p, col);
  if (uEau > .001){
    float m; vec3 w = eau(p, p - vec2(0., uShift), m);
    col = mix(col, w, uEau);
  }
  vec4 pe = perle(p, col);
  col = col*(1. - pe.a) + pe.rgb;
  /* le Point au centre, pendant RIPPLE et ATLAS : la lumière entrée dans l'eau, qui ne s'éteint jamais */
  vec2 centre = vec2(0., uShift);
  float rc = length(p - centre);
  col += nacre(.3)*uLueur*(exp(-rc*60.)*.9 + exp(-rc*10.)*.08)*(1. - uRepli*.0);
  /* le blanc AIME : il naît du Point et s'étend */
  float front = uBlanc*1.9;
  float bl = max(smoothstep(front, front - .35, rc), pow(uBlanc, 3.));
  col = mix(col, vec3(.984, .984, .992), bl);
  /* le Point nacré, repris par le Disque replié : il ne disparaît jamais (même taille que l'Orbe de la marque .0NE) */
  float rp = 11./720.;
  vec2 qp = (p - centre)/rp; float dpt = length(qp);
  if (uRepli > 0.){ vec3 n3 = normalize(vec3(qp, sqrt(max(0., 1. - dpt*dpt))));
    vec3 pt = nacre(.15 + pow(1. - n3.z, 2.)*1.1)*(.75 + .3*max(dot(n3, normalize(vec3(-.4, .6, .7))), 0.));
    float m = smoothstep(1.04, .96, dpt)*uRepli;
    col = mix(col, pt, m);
    col = mix(col, col*.86 + vec3(.79, .72, 1.)*.14, smoothstep(2.6, 1., dpt)*(1. - smoothstep(1., .96, dpt))*uRepli*bl); }
  /* grain très léger et vignette (cinéma) */
  col *= mix(1., .82 + .18*smoothstep(1.1, .2, length(p)), 1. - bl);
  col += (h21(gl_FragCoord.xy + uT*60.) - .5)*.012*(1. - bl);
  o = vec4(pow(max(col, 0.), vec3(1./1.08)), 1.);
}`;

export interface OptionsRendu { qualite?: number; echelle?: number; /** prévenu quand le contexte graphique est perdu (GPU surchargé, veille…) */ surPerte?: () => void }

export class Rendu {
  gl: WebGL2RenderingContext;
  prog!: WebGLProgram;
  u: Record<string, WebGLUniformLocation | null> = {};
  ctx: CanvasRenderingContext2D;
  derniere: Scene | null = null;
  perdu = false;
  /** une destruction voulue (fin du film) n'est pas une panne */
  detruit = false;
  constructor(public toile: HTMLCanvasElement, public calque: HTMLCanvasElement, public opts: OptionsRendu = {}) {
    const gl = toile.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL2 indisponible");
    this.gl = gl;
    /* le contexte peut être perdu (GPU surchargé, mise en veille) : on le dit, on attend sa restauration, on reprend */
    toile.addEventListener("webglcontextlost", e => { e.preventDefault(); this.perdu = true; if (!this.detruit) this.opts.surPerte?.(); });
    toile.addEventListener("webglcontextrestored", () => { try { this.initialiser(); this.perdu = false; } catch { /* le lecteur recrée un rendu */ } });
    this.initialiser();
    this.ctx = calque.getContext("2d")!;
  }

  private initialiser() {
    const gl = this.gl;
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader"); return s; };
    const p = gl.createProgram()!; gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "programme");
    this.prog = p; gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(p, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uRes", "uT", "uQ", "uEtoiles", "uNuages", "uDefil", "uBrume", "uPerle", "uPerleVis", "uGoutte", "uEtire", "uD", "uEau", "uPhi", "uShift", "uDepuis", "uGrille", "uCarres", "uBlanc", "uLueur", "uRepli", "uFronts", "uEsp"]) this.u[n] = gl.getUniformLocation(p, n);
  }

  /** dimensionner les deux toiles (la toile WebGL peut être rendue plus petite : `echelle`) */
  taille(l: number, h: number, dpr: number) {
    const e = this.opts.echelle ?? 1;
    this.toile.width = Math.round(l * dpr * e); this.toile.height = Math.round(h * dpr * e);
    this.calque.width = Math.round(l * dpr); this.calque.height = Math.round(h * dpr);
  }

  /** la géométrie de l'onde à l'instant t : les fronts du contrat ; en V, ils rejoignent les anneaux Ripple */
  geometrie(s: Scene) {
    const fs = fronts(ONDE_FILM, s.t).slice(0, MAX_FRONTS);
    const poses = versAnneaux(fs.map(f => f.rayon), s.ripple);
    const parRayon = [...fs].sort((a, b) => a.rayon - b.rayon);
    return parRayon.map((f, i) => ({ ...f, rayon: poses[i], intensite: s.ripple > 0 ? Math.max(f.intensite, .35 * s.ripple) : f.intensite }));
  }

  /** Rendre une image. `t` : le temps du RÉCIT (ce que décrit la partition) ; `reel` : le temps du film, qui anime les
      matières (nuages qui dérivent, étoiles qui scintillent) même quand le récit avance lentement (chapitre complet). */
  rendre(t: number, reel: number = t) {
    const s = scene(t); this.derniere = s;
    if (this.perdu || this.gl.isContextLost()) return s;
    const gl = this.gl, W = this.toile.width, H = this.toile.height, u = this.u;
    gl.viewport(0, 0, W, H);
    const asp = W / H;
    const shift = SHIFT0 * (1 - s.plongee), phi = PHI0 + (Math.PI / 2 - PHI0) * s.plongee;
    gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uT, s.gel ? reel - (t - REPERES.suspension.t) : reel);   /* pendant le creux, les matières se figent */ gl.uniform1f(u.uQ, this.opts.qualite ?? 6);
    gl.uniform1f(u.uEtoiles, s.etoiles); gl.uniform1f(u.uNuages, s.nuages); gl.uniform1f(u.uDefil, s.defilement); gl.uniform1f(u.uBrume, s.brume);
    const chute = t >= REPERES.chute.t && t < REPERES.contact.t ? (t - REPERES.chute.t) / (REPERES.contact.t - REPERES.chute.t) : 0;
    gl.uniform4f(u.uPerle, (s.perle.x - 0.5) * asp, 0.5 - s.perle.y, s.perle.r, s.perle.eclat);
    gl.uniform1f(u.uPerleVis, s.perle.visible); gl.uniform1f(u.uGoutte, s.goutte); gl.uniform1f(u.uEtire, chute * chute);
    gl.uniform1f(u.uD, D0 + (D - D0) * s.plongee); gl.uniform1f(u.uEau, s.eau); gl.uniform1f(u.uPhi, phi); gl.uniform1f(u.uShift, shift); gl.uniform1f(u.uDepuis, s.depuisContact);
    gl.uniform1f(u.uGrille, s.grille); gl.uniform1f(u.uCarres, s.carres); gl.uniform1f(u.uBlanc, s.blanc);
    gl.uniform1f(u.uLueur, s.depuisContact > 0 ? Math.min(1, s.plongee * 1.2 + 0.15) * (1 - s.repli) : 0); gl.uniform1f(u.uRepli, s.repli);
    const g = this.geometrie(s), arr = new Float32Array(MAX_FRONTS * 4);
    g.forEach((f, i) => { arr.set([f.rayon, f.intensite, f.phase, 1], i * 4); });
    gl.uniform4fv(u.uFronts, arr); gl.uniform1f(u.uEsp, ONDE_FILM.espacement);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.dessinerCalque(s, g);
    return s;
  }

  /** le calque géométrique : seulement quand la caméra est verticale (les anneaux sont alors de vrais cercles) */
  dessinerCalque(s: Scene, g: { rayon: number; intensite: number }[]) {
    const c = this.ctx, W = this.calque.width, H = this.calque.height;
    c.clearRect(0, 0, W, H);
    const vue = Math.pow(s.plongee, 4) * (1 - s.blanc);
    const cx = W / 2, cy = H / 2, echelle = (F / D) * H;          // 1 unité du cadran → pixels (caméra verticale)
    const ligne = Math.max(1, H / 900);
    if (vue > 0.01 && s.ripple > 0.01) {
      const visibles = 1 - s.disque * 0.85;
      c.lineWidth = ligne;
      for (const f of g) { c.strokeStyle = `rgba(244,241,255,${(0.1 + 0.42 * s.ripple) * vue * visibles})`; c.beginPath(); c.arc(cx, cy, f.rayon * echelle, 0, Math.PI * 2); c.stroke(); }
      /* les repères angulaires (12), déployés dans le sens horaire */
      for (const r of reperes(12, s.reperes)) if (r.visible > 0) {
        const a = polarXY(cx, cy, ANNEAU_HEURES * echelle - 7 * ligne, r.angle), b = polarXY(cx, cy, ANNEAU_HEURES * echelle + 7 * ligne, r.angle);
        c.strokeStyle = `rgba(255,255,255,${0.75 * r.visible * vue * visibles})`; c.lineWidth = ligne * (r.angle % 90 === 0 ? 2 : 1.2);
        c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      }
      /* les positions polaires : des points sur l'anneau des personnes (aucune personne réelle : la géométrie seule) */
      const n = 24;
      for (let i = 0; i < n; i++) { const v = Math.min(1, Math.max(0, s.positions * n - i)); if (v <= 0) continue;
        const q = polarXY(cx, cy, ANNEAU_PERSONNES * echelle, (360 * i) / n + 7.5);
        c.fillStyle = `rgba(244,241,255,${0.85 * v * vue * visibles})`; c.beginPath(); c.arc(q.x, q.y, 2.4 * ligne, 0, Math.PI * 2); c.fill(); }
    }
    /* le Disque .0NE : la même géométrie que le Disque réel (geometrieDisque), puis son repli en Point */
    if (s.disque > 0.01 && s.blanc < 0.999) {
      const dq = geometrieDisque(800, 800, 0, { bas: 0, cote: 0, toileMin: 96 });
      /* le Disque naît SUR l'anneau extérieur du cadran Ripple : une seule géométrie */
      const z = (1 - s.repli) * (0.82 + 0.18 * s.disque) + 0.0001, Rmax = ANNEAUX_PRINCIPAUX[0] * echelle * z;
      const Ro = Rmax, ri = Rmax * dq.ri / dq.Ro, r = Rmax * dq.r / dq.Ro;
      c.save(); c.globalAlpha = s.disque * (1 - s.blanc);
      const grd = c.createRadialGradient(cx, cy, ri, cx, cy, Ro);
      grd.addColorStop(0, "rgba(10,10,14,.92)"); grd.addColorStop(1, "rgba(18,18,24,.92)");
      c.fillStyle = grd; c.beginPath(); c.arc(cx, cy, Ro, 0, Math.PI * 2); c.arc(cx, cy, ri, 0, Math.PI * 2, true); c.fill("evenodd");
      c.strokeStyle = "rgba(201,184,255,.55)"; c.lineWidth = ligne; c.beginPath(); c.arc(cx, cy, Ro, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "rgba(201,184,255,.35)"; c.beginPath(); c.arc(cx, cy, ri, 0, Math.PI * 2); c.stroke();
      const toile = c.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy, r);
      toile.addColorStop(0, "rgba(255,255,255,.97)"); toile.addColorStop(0.7, "rgba(246,244,252,.96)"); toile.addColorStop(1, "rgba(232,228,246,.96)");
      c.fillStyle = toile; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      c.restore();
    }
  }

  detruire() { this.detruit = true; this.gl.getExtension("WEBGL_lose_context")?.loseContext(); }
}
