/**
 * .0NE → ATLAS — le contrat de référence. Le lien entre les deux systèmes, pas leur fusion.
 *
 * Une création ATLAS se désigne par une RÉFÉRENCE (un type et un identifiant), jamais par une adresse :
 *   - la destination est fixe : l'origine d'ATLAS_URL (lib/destinations), et aucune autre ;
 *   - le chemin vient d'une table fermée tenue ici, celle des références qu'ATLAS a réellement publiées ;
 *   - aucune adresse fournie par la personne, aucun paramètre ajouté : ni préférences, ni prénom, ni contexte du Disque ;
 *   - l'ouverture se fait dans un nouvel onglet, sans référent (rel="noopener noreferrer", referrerPolicy="no-referrer").
 * Une référence inconnue ou pas encore publiée ne s'ouvre pas : on le dit clairement.
 * .0NE ne lit ni ne recopie rien d'ATLAS (pas de lecteur de composition ici) : il ouvre sa version publique.
 */
import { ATLAS_URL } from "../destinations";

/** l'origine d'ATLAS, seule destination possible */
export const ORIGINE_ATLAS = new URL(ATLAS_URL).origin;

/** les types qu'ATLAS publie : une entrée de sa chronologie ; une composition (route pas encore confirmée par ATLAS) */
export type TypeReferenceAtlas = "entree" | "composition";
export const TYPES_ATLAS: readonly TypeReferenceAtlas[] = ["entree", "composition"];
export interface ReferenceAtlas { type: TypeReferenceAtlas; id: string }

/** une référence publiée par ATLAS : son titre et son chemin public (lecture seule) */
export interface PublicationAtlas { titre: string; phrase: string; periode?: string; chemin: string; verifiee: string }

/**
 * Les références réellement publiées. Une ligne n'est ajoutée qu'après vérification sur la version publique d'ATLAS.
 * « entree:e-cube-grille » : data/chronologie.js d'ATLAS (publicationStatus « publie », visibility « public ») ;
 * l'adresse /#e-cube-grille est servie aujourd'hui, et ATLAS la renvoie vers /chronologie#e-cube-grille après sa refonte des adresses.
 */
const PUBLIEES: Record<string, PublicationAtlas> = {
  "entree:e-cube-grille": {
    titre: "Du cube à la grille", periode: "2002 – 2026", chemin: "/#e-cube-grille", verifiee: "2026-10-30",
    phrase: "Le carré, le cube, la mosaïque pendant les études ; aujourd’hui, ATLAS retrouve la grille et .0NE développe le cercle et le Point.",
  },
};

/** pourquoi une référence ne s'ouvre pas : chaque cas a sa phrase, sans jargon */
export type RefusAtlas = "invalide" | "non-publiee" | "route-a-confirmer";
export const MESSAGES_ATLAS: Record<RefusAtlas, string> = {
  invalide: "Cette référence ATLAS n’est pas valide : rien n’a été ouvert.",
  "non-publiee": "Cette création n’est pas encore publiée dans ATLAS : elle s’ouvrira quand ATLAS l’aura rendue publique.",
  "route-a-confirmer": "Les compositions d’ATLAS n’ont pas encore d’adresse publique confirmée : rien n’est ouvert pour l’instant.",
};

export type ResolutionAtlas =
  | { ok: true; reference: ReferenceAtlas; adresse: string; publication: PublicationAtlas }
  | { ok: false; refus: RefusAtlas; message: string };

const ID = /^[a-z][a-z0-9-]{1,63}$/;
const cle = (r: ReferenceAtlas) => r.type + ":" + r.id;

/** lire une référence venue d'ailleurs (adresse, favori, donnée) : seuls un type connu et un identifiant simple passent */
export function lireReference(v: unknown): ReferenceAtlas | null {
  if (!v || typeof v !== "object") return null;
  const { type, id } = v as Record<string, unknown>;
  if (typeof type !== "string" || !(TYPES_ATLAS as readonly string[]).includes(type)) return null;
  if (typeof id !== "string" || !ID.test(id)) return null;
  return { type: type as TypeReferenceAtlas, id };
}

/** résoudre une référence en adresse publique d'ATLAS ; jamais une autre origine, jamais de paramètre ajouté */
export function resoudreAtlas(v: unknown): ResolutionAtlas {
  const r = lireReference(v);
  if (!r) return { ok: false, refus: "invalide", message: MESSAGES_ATLAS.invalide };
  if (r.type === "composition") return { ok: false, refus: "route-a-confirmer", message: MESSAGES_ATLAS["route-a-confirmer"] };
  const p = PUBLIEES[cle(r)];
  if (!p) return { ok: false, refus: "non-publiee", message: MESSAGES_ATLAS["non-publiee"] };
  const u = new URL(p.chemin, ORIGINE_ATLAS);
  if (u.origin !== ORIGINE_ATLAS || u.search || u.username || u.password) return { ok: false, refus: "invalide", message: MESSAGES_ATLAS.invalide };
  return { ok: true, reference: r, adresse: u.href, publication: p };
}

/** les références publiées, pour la carte ATLAS du Disque */
export function referencesPubliees(): { reference: ReferenceAtlas; publication: PublicationAtlas }[] {
  return Object.entries(PUBLIEES).map(([k, publication]) => { const [type, id] = k.split(":"); return { reference: { type: type as TypeReferenceAtlas, id }, publication }; });
}

/** la première référence : l'entrée publique « Du cube à la grille » */
export const REFERENCE_CUBE_GRILLE: ReferenceAtlas = { type: "entree", id: "e-cube-grille" };

/** les attributs d'un lien sortant vers ATLAS : nouvel onglet, sans référent ni accès à cette page */
export const LIEN_SORTANT = { target: "_blank", rel: "noopener noreferrer", referrerPolicy: "no-referrer" } as const;
