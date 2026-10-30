/**
 * .0NE → ATLAS : une référence (type + identifiant), une destination fixe, rien de personnel transmis.
 */
import { describe, expect, it } from "vitest";
import { ATLAS_URL } from "../lib/destinations";
import { lireReference, MESSAGES_ATLAS, ORIGINE_ATLAS, referencesPubliees, REFERENCE_CUBE_GRILLE, resoudreAtlas } from "../lib/one/atlas";
import { universPublics, verifierUnivers } from "../lib/one/contrat";
import { UNIVERS } from "../lib/one/univers";

describe("le contrat de référence ATLAS", () => {
  it("ouvre l'entrée publique « Du cube à la grille » sur la version publique d'ATLAS, sans paramètre", () => {
    const r = resoudreAtlas(REFERENCE_CUBE_GRILLE);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.adresse).toBe("https://atlas-de-pique-de-coeur.vercel.app/#e-cube-grille");
    expect(new URL(r.adresse).origin).toBe(new URL(ATLAS_URL).origin);
    expect(new URL(r.adresse).search).toBe("");
    expect(r.publication.titre).toBe("Du cube à la grille");
  });

  it("n'accepte aucune adresse fournie : seuls un type connu et un identifiant simple passent", () => {
    for (const v of [null, "https://exemple.org", { type: "url", id: "x" }, { type: "entree", id: "https://exemple.org/#x" },
      { type: "entree", id: "//exemple.org" }, { type: "entree", id: "../admin" }, { type: "entree", id: "E-MAJ" }, { type: "entree" }, { id: "e-cube-grille" }]) {
      expect(lireReference(v)).toBeNull();
      const r = resoudreAtlas(v);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.refus).toBe("invalide");
    }
  });

  it("ne garde de la référence que son type et son identifiant (rien d'autre ne voyage)", () => {
    expect(lireReference({ type: "entree", id: "e-cube-grille", prenom: "Camille", preferences: { theme: "nuit" } })).toEqual({ type: "entree", id: "e-cube-grille" });
  });

  it("dit clairement qu'une référence n'est pas encore publiée", () => {
    const r = resoudreAtlas({ type: "entree", id: "e-pas-encore" });
    expect(r).toEqual({ ok: false, refus: "non-publiee", message: MESSAGES_ATLAS["non-publiee"] });
  });

  it("n'ouvre aucune composition tant qu'ATLAS n'a pas confirmé leur adresse", () => {
    const r = resoudreAtlas({ type: "composition", id: "du-cube-a-la-grille" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.refus).toBe("route-a-confirmer");
  });

  it("toutes les références publiées pointent vers la seule origine d'ATLAS", () => {
    for (const { reference } of referencesPubliees()) {
      const r = resoudreAtlas(reference);
      expect(r.ok).toBe(true);
      if (r.ok) expect(new URL(r.adresse).origin).toBe(ORIGINE_ATLAS);
    }
  });
});

describe("la carte ATLAS dans le registre des univers", () => {
  const atlas = UNIVERS.find(u => u.id === "atlas")!;
  it("est conforme au contrat et publiée dans la mosaïque", () => {
    expect(verifierUnivers(atlas)).toEqual([]);
    expect(universPublics(UNIVERS).map(u => u.id)).toContain("atlas");
  });
  it("est refusée si sa référence n'est pas publiée", () => {
    expect(verifierUnivers({ ...atlas, ouverture: { type: "atlas", reference: { type: "entree", id: "e-pas-encore" } } })).toContain("la référence ATLAS n’est pas publiée");
  });
});
