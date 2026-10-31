import { describe, expect, it } from "vitest";
import { rythmeA, masque, RYTHME_AMOR } from "../film/lumiere/rythme";
import { FILM_AMOUR, FILM_FLEUR } from "../film/lumiere/montages";

describe("LUMIERE : les effets suivent le rythme d'« Amor amour 2 »", () => {
  it("chaque temps donne un coup d'accélérateur, qui retombe avant le temps suivant", () => {
    const t0 = RYTHME_AMOR.temps.find(t => t > 30)!;
    const sur = rythmeA(t0 + .01).vitesse, entre = rythmeA(t0 + .4).vitesse;
    expect(sur).toBeGreaterThan(entre + .25);
  });
  it("les ondes naissent sur les accents mesurés (âge 0 à l'accent) et s'éteignent après 3,5 s", () => {
    const [ta] = RYTHME_AMOR.accents.find(([t]) => t > 70 && t < 100)!;
    expect(rythmeA(ta + .001).ondes[0][0]).toBeCloseTo(0.001, 3);
    expect(rythmeA(ta - .001).ondes.every(([age]) => age > 0)).toBe(true);
  });
  it("la séquence validée de l'impact (02:00.440 → 02:20.440) reste sans aucun effet", () => {
    for (let t = 120.44; t <= 140.44; t += 0.05) {
      const r = rythmeA(t); expect(masque(t)).toBe(0); expect(r.vitesse).toBe(0); expect(r.ondes.every(([, f]) => f === 0)).toBe(true);
    }
  });
  it("le même rythme à chaque lecture ; la fuite avance toujours", () => {
    expect(rythmeA(77.3)).toEqual(rythmeA(77.3));
    let avant = -1; for (let t = 0; t < 204.9; t += 0.37) { const f = rythmeA(t).fuite; expect(f).toBeGreaterThanOrEqual(avant); avant = f; }
  });
  it("seule la version « Amor amour » a le rythme ; « La Fleur du Ciel » n'a aucun effet", () => {
    expect(FILM_AMOUR.musique.some(c => c.morceau === RYTHME_AMOR.morceau)).toBe(true);
    expect(FILM_FLEUR.musique.some(c => c.morceau === RYTHME_AMOR.morceau)).toBe(false);
  });
});
