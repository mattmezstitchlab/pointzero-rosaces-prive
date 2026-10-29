/**
 * L'aperçu du studio sur le socle AIME : activé seulement à la demande (?aime=jour | ?aime=nuit, retenu sur l'appareil ; ?aime=off pour revenir).
 * Rien ne change par défaut. Voir design/aime-studio.css.
 */
import "./aime-studio.css";

const CLE = "aime:studio";
export function appliquerApercuAime() {
  try {
    const q = new URLSearchParams(window.location.search).get("aime");
    if (q === "off") localStorage.removeItem(CLE);
    else if (q === "jour" || q === "nuit") localStorage.setItem(CLE, q);
    const v = localStorage.getItem(CLE);
    if (v === "jour" || v === "nuit") document.documentElement.dataset.aimeStudio = v;
    else delete document.documentElement.dataset.aimeStudio;
  } catch { /* stockage indisponible : aucun aperçu, rien ne change */ }
}
