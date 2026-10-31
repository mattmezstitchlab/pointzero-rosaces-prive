import { describe, expect, it } from "vitest";
import { verifier, placer, plansA, dureeMontage } from "../lib/cinema/montage";
import { versMontage } from "../lib/cinema/film";
import { FILM_AMOUR, FILM_FLEUR, FILM_FLEUR_DONNEES, FLEUR_DU_CIEL, VERSIONS } from "../film/lumiere/montages";
import { AMOR_AMOUR, CARTE_AMOR, versAmor } from "../film/lumiere/amor";

const recit = (t: number) => { const a = plansA(FILM_AMOUR, t).at(-1)!; return a.tNarratif!; };

describe("LUMIERE sur « Amor amour 2 » : le même film, remonté", () => {
  it("le montage est valide : chaque repère tombe sur son plan, aucun trou, 3 min 25", () => {
    const v = verifier(FILM_AMOUR);
    expect(v.ok).toBe(true);
    expect(v.trous).toEqual([]);
    expect(v.synchro.length).toBeGreaterThanOrEqual(9);
    expect(v.synchro.every(s => s.ok)).toBe(true);
    expect(dureeMontage(FILM_AMOUR)).toBeCloseTo(204.92, 3);
    expect(FILM_AMOUR.plans.map(p => p.id)).toEqual(FILM_FLEUR.plans.map(p => p.id));   // les 31 mêmes plans, dans le même ordre
  });
  it("l'impact est à 02:12.445 et la séquence validée (eau → goutte → creux → chute → impact → arc → Terre) garde sa vitesse exacte", () => {
    expect(AMOR_AMOUR.reperes.impact.temps).toBe(132.445);
    expect(versAmor(198.255)).toBeCloseTo(132.445, 6);
    for (let t = 120.44; t <= 140.44; t += 0.25) expect(recit(t)).toBeCloseTo(t + (198.255 - 132.445), 6);
    const p23 = placer(FILM_AMOUR).find(p => p.id === "P23")!;
    expect(p23.debutFilm).toBeCloseTo(132.44, 6);
  });
  it("le récit avance toujours (jamais de retour en arrière) et finit avec le film", () => {
    let avant = -1;
    for (let t = 0; t < 204.9; t += 0.1) { const n = recit(t); expect(n).toBeGreaterThanOrEqual(avant - 1e-9); avant = n; }
    expect(recit(204.9)).toBeGreaterThan(252.9);
    for (let i = 1; i < CARTE_AMOR.length; i++) { expect(CARTE_AMOR[i][0]).toBeGreaterThan(CARTE_AMOR[i - 1][0]); expect(CARTE_AMOR[i][1]).toBeGreaterThan(CARTE_AMOR[i - 1][1]); }
  });
  it("la version « La Fleur du Ciel » n'est pas modifiée, et l'ouverture est la première version listée", () => {
    expect(FILM_FLEUR).toEqual(versMontage(FILM_FLEUR_DONNEES, FLEUR_DU_CIEL, { id: "lumiere-film", titre: "La Fleur du Ciel — le film (séquencier, prévisualisation)" }));
    expect(verifier(FILM_FLEUR).ok).toBe(true);
    expect(VERSIONS[0].id).toBe("lumiere-film-amor");
    expect(FILM_AMOUR.musique).toEqual([{ id: "m1", morceau: "amor-amour", debut: 0, fin: 204.92, position: 0, fondus: { sortie: 1.5 } }]);
  });
});
