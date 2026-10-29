/**
 * Les contenus que la landing affiche : la version publiée (/api/contenus), revalidée ici ; sinon le texte d'origine.
 * Avec ?apercu=ID : la version ID, pour l'administration seulement (le serveur vérifie la session), annoncée comme un aperçu.
 *
 * Pour éviter qu'un texte publié ne remplace le texte d'origine sous les yeux d'une personne qui revient,
 * la dernière version publiée reçue est gardée dans ce navigateur et montrée d'abord ; le serveur a toujours le dernier mot.
 */
import { useEffect, useState } from "react";
import { ORIGINE, validerContenus, type Contenus } from "./contenus";

const CLE = "pointzero:contenus-publies:v1";
export interface Apercu { id: string; ecarts: number }

/* L'API existe quand le studio est servi par le site, sous /studio/ (comme en production et sur l'aperçu privé).
   Servi seul, à la racine (essais locaux), il n'y a pas d'API : on n'appelle rien, la page garde ses textes d'origine. */
export const apiContenus = () => import.meta.env.BASE_URL !== "/";
const apercuDemande = () => { try { const v = new URLSearchParams(window.location.search).get("apercu"); return v && /^[1-9]\d{0,15}$/.test(v) ? v : null; } catch { return null; } };
function garde(): Contenus {
  try { const s = localStorage.getItem(CLE); return s ? validerContenus(JSON.parse(s)).contenus : ORIGINE; } catch { return ORIGINE; }
}

export function useContenusPublies(): { contenus: Contenus; apercu: Apercu | null; refus: string | null } {
  const [etat, setEtat] = useState<{ contenus: Contenus; apercu: Apercu | null; refus: string | null }>(() => ({ contenus: apercuDemande() ? ORIGINE : garde(), apercu: null, refus: null }));
  useEffect(() => {
    if (!apiContenus()) return;
    const id = apercuDemande(), ctrl = new AbortController();
    const url = "/api/contenus" + (id ? "?version=" + id : "");
    fetch(url, { credentials: "same-origin", signal: ctrl.signal, headers: { Accept: "application/json" } })
      .then(async r => { const j = await r.json().catch(() => null); return { r, j }; })
      .then(({ r, j }) => {
        if (id) {
          if (r.ok && j?.contenus) { const v = validerContenus(j.contenus); setEtat({ contenus: v.contenus, apercu: { id, ecarts: v.ecarts.length }, refus: null }); }
          else setEtat(e => ({ ...e, refus: r.status === 401 ? "Connectez-vous avec le compte d’administration pour voir cet aperçu." : r.status === 403 ? "Cet aperçu est réservé à l’administration du site." : "Aperçu introuvable." }));
          return;
        }
        if (!r.ok || !j || !("contenus" in j)) return; /* pas d'API (site statique, essai local) : on garde ce qu'on a */
        if (j.contenus === null) { try { localStorage.removeItem(CLE); } catch { /* rien */ } setEtat(e => ({ ...e, contenus: ORIGINE })); return; }
        const { contenus } = validerContenus(j.contenus);
        try { localStorage.setItem(CLE, JSON.stringify(contenus)); } catch { /* rien */ }
        setEtat(e => ({ ...e, contenus }));
      })
      .catch(() => { /* hors ligne, ou API absente : le texte d'origine (ou le dernier publié reçu) reste */ });
    return () => ctrl.abort();
  }, []);
  return etat;
}
