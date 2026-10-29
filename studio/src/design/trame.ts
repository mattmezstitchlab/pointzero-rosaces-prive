/**
 * La trame : une image redessinée en points, comme une toile à broder (référence « dither » de Matt, 29 octobre).
 * Purement visuel et local (canvas) : aucun envoi, aucun lien avec le moteur 5D ni avec les patrons.
 *  - « croix » : une petite croix par case, de la couleur de la case (le point de croix) ;
 *  - « bayer » : un tramage ordonné 4×4 par canal, des carrés pleins ou vides ;
 *  - « points » : une demi-teinte, des disques dont la taille suit la lumière.
 */
export type ModeTrame = "croix" | "bayer" | "points";
export interface OptionsTrame { mode: ModeTrame; pas: number; luminosite: number; niveaux: number; fond?: string }

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);

/** dessine `source` (déjà chargée) dans `cible`, à la taille affichée de la cible ; `pas` en pixels CSS */
export function tramer(source: CanvasImageSource & { width: number; height: number }, cible: HTMLCanvasElement, o: OptionsTrame) {
  const r = Math.min(2, window.devicePixelRatio || 1), W = Math.max(1, Math.round(cible.clientWidth * r)), H = Math.max(1, Math.round(cible.clientHeight * r));
  cible.width = W; cible.height = H;
  const pas = Math.max(2, Math.round(o.pas * r)), cols = Math.ceil(W / pas), lignes = Math.ceil(H / pas);
  /* l'image réduite à une valeur par case, cadrée comme object-fit: cover */
  const petit = document.createElement("canvas"); petit.width = cols; petit.height = lignes;
  const p = petit.getContext("2d", { willReadFrequently: true })!, sw = source.width, sh = source.height, e = Math.max(cols / sw, lignes / sh);
  p.drawImage(source, (cols - sw * e) / 2, (lignes - sh * e) / 2, sw * e, sh * e);
  const px = p.getImageData(0, 0, cols, lignes).data, c = cible.getContext("2d")!;
  c.fillStyle = o.fond ?? "#050506"; c.fillRect(0, 0, W, H);
  const lum = 1 + o.luminosite / 100, n = Math.max(2, o.niveaux), q = (v: number, seuil = .5) => Math.min(1, Math.floor(v * (n - 1) + seuil) / (n - 1));
  for (let y = 0; y < lignes; y++) for (let x = 0; x < cols; x++) {
    const i = (y * cols + x) * 4, R = Math.min(1, px[i] / 255 * lum), G = Math.min(1, px[i + 1] / 255 * lum), B = Math.min(1, px[i + 2] / 255 * lum);
    const X = x * pas, Y = y * pas;
    if (o.mode === "bayer") {
      const s = BAYER[(y % 4) * 4 + (x % 4)], l = .2126 * R + .7152 * G + .0722 * B;
      if (l < .08) continue;                                   /* le noir reste noir */
      /* dans les ombres, des points gris (pas de grésillement coloré) ; la couleur revient avec la lumière */
      const [r, g, b] = l < .24 ? [l, l, l] : [R, G, B];
      c.fillStyle = `rgb(${q(r, s) * 255},${q(g, s) * 255},${q(b, s) * 255})`; c.fillRect(X, Y, pas - (pas > 3 ? 1 : 0), pas - (pas > 3 ? 1 : 0));
    } else if (o.mode === "points") {
      const l = .2126 * R + .7152 * G + .0722 * B, rayon = (pas / 2) * Math.sqrt(q(l));
      if (rayon < .3) continue;
      c.fillStyle = `rgb(${R * 255},${G * 255},${B * 255})`; c.beginPath(); c.arc(X + pas / 2, Y + pas / 2, rayon, 0, 7); c.fill();
    } else {
      const l = .2126 * R + .7152 * G + .0722 * B; if (l < .06) continue;
      c.strokeStyle = `rgb(${q(R) * 255},${q(G) * 255},${q(B) * 255})`; c.lineWidth = Math.max(1, pas * .22); c.lineCap = "round";
      const m = pas * .2; c.beginPath(); c.moveTo(X + m, Y + m); c.lineTo(X + pas - m, Y + pas - m); c.moveTo(X + pas - m, Y + m); c.lineTo(X + m, Y + pas - m); c.stroke();
    }
  }
}

/** charge une image (même origine ou fichier local) */
export function chargerImage(src: string) {
  return new Promise<HTMLImageElement>((ok, ko) => { const i = new Image(); i.decoding = "async"; i.onload = () => ok(i); i.onerror = ko; i.src = src; });
}
