/**
 * Essai privé : le socle visuel AIME, Jour et Nuit — présenté avant toute généralisation (/essai-aime).
 * Tout ce qui est montré est construit avec design/aime.css et design/aime-composants.css : aucune couleur propre à cette page,
 * sauf le contenu éditorial (les photographies), posé sous un voile sombre.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import "../design/aime-composants.css";
import "./EssaiAime.css";
import { CHOIX_THEMES, useTheme, type Theme } from "../design/theme";

const IMG = import.meta.env.BASE_URL + "images/";
const TOKENS: [string, string][] = [
  ["fond", "Fond"], ["fond-2", "Fond 2"], ["surface", "Surface"], ["surface-2", "Surface 2"], ["texte", "Texte"], ["texte-2", "Texte secondaire"], ["texte-3", "Texte tertiaire"],
  ["bordure-champ", "Bordure de champ"], ["primaire", "Primaire"], ["selection", "Sélection"], ["focus", "Focus"], ["erreur", "Erreur"], ["succes", "Succès"], ["desactive", "Désactivé"],
];
const UNIVERS = ["neutre", "broderie", "mariage", "spectacle", "culture", "art"] as const;

/* un contraste mesuré dans la page, sur les couleurs réellement calculées par le navigateur */
const rgb = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
const lum = (c: number[]) => { const f = (x: number) => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

function Nuancier() {
  const hote = useRef<HTMLDivElement>(null), [mesures, setMesures] = useState<Record<string, number>>({});
  useEffect(() => {
    const el = hote.current; if (!el) return;
    const mesurer = () => { const cs = getComputedStyle(el), f = cs.getPropertyValue("--aime-fond").trim();
      const tmp = document.createElement("span"); el.appendChild(tmp); const lire = (v: string) => { tmp.style.color = v; return rgb(getComputedStyle(tmp).color); };
      const F = lire(f), out: Record<string, number> = {};
      for (const [k] of TOKENS) out[k] = ratio(lire(cs.getPropertyValue("--aime-" + k).trim()), F);
      tmp.remove(); setMesures(out); };
    mesurer(); const o = new MutationObserver(mesurer); o.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["data-aime"] });
    return () => o.disconnect();
  }, []);
  return <div ref={hote} className="ea-nuancier">{TOKENS.map(([k, nom]) => <div key={k} className="ea-teinte">
    <span className="ea-pastille" style={{ background: `var(--aime-${k})` }} aria-hidden="true" />
    <p><b>{nom}</b><br /><code>--aime-{k}</code></p>
    <p className="ea-ratio">{mesures[k] ? (/^(fond|surface)/.test(k) ? "—" : mesures[k].toFixed(1) + ":1") : ""}</p>
  </div>)}</div>;
}

function Composants() {
  const [onglet, setOnglet] = useState("Aperçu");
  return <div className="ea-composants">
    <div className="aime-carte ea-bloc"><p className="aime-sur">Boutons</p>
      <div className="ea-ligne">
        <button type="button" className="aime-btn aime-btn--primaire">Commencer <span className="aime-btn-fleche" aria-hidden="true">→</span></button>
        <button type="button" className="aime-btn aime-btn--secondaire">Voir la démo</button>
        <button type="button" className="aime-btn aime-btn--contour aime-btn--droit">Réserver</button>
        <button type="button" className="aime-btn aime-btn--primaire" disabled>Désactivé</button>
        <button type="button" className="aime-btn aime-btn--danger aime-btn--petit">Supprimer</button>
      </div></div>
    <div className="aime-carte ea-bloc"><p className="aime-sur">Navigation et onglets</p>
      <nav className="aime-nav" aria-label="Exemple de navigation"><a href="#socle" aria-current="page">Accueil</a><a href="#composants">Studio</a><a href="#cote">Bureau</a><a href="#univers">Réseau</a></nav>
      <div className="aime-onglets" role="group" aria-label="Exemple d’onglets">{["Aperçu", "Inspecteur", "Historique"].map(o => <button key={o} type="button" aria-pressed={onglet === o} onClick={() => setOnglet(o)}>{o}</button>)}</div>
      <div className="ea-ligne"><span className="aime-puce"><span className="aime-point" aria-hidden="true" />Le Point vous guide</span><span className="aime-etat aime-etat--ok">En direct</span><span className="aime-etat aime-etat--erreur">Refusé</span><span className="aime-etat">Brouillon</span></div>
    </div>
    <div className="aime-carte ea-bloc"><p className="aime-sur">Champs</p>
      <div className="aime-champ"><label htmlFor="ea-c1">Titre</label><input id="ea-c1" defaultValue="Garance & indigo" /><span className="aime-aide">16 / 140</span></div>
      <div className="aime-champ"><label htmlFor="ea-c2">Lien</label><input id="ea-c2" defaultValue="javascript:alert(1)" aria-invalid="true" aria-describedby="ea-c2-e" /><span className="aime-erreur" id="ea-c2-e">Lien https attendu</span></div>
      <div className="aime-champ"><label htmlFor="ea-c3">Identifiant</label><input id="ea-c3" defaultValue="Non modifiable" disabled /></div>
      <label className="aime-case"><input type="checkbox" defaultChecked /> Reconstitution générée</label>
    </div>
    <div className="aime-verre ea-bloc"><p className="aime-sur">Panneau flottant (verre)</p>
      <p className="ea-verre-titre">Version 9 · Publiée</p><p className="aime-chapo">Une version n’est jamais modifiée ni effacée. Restaurer republie une copie.</p>
      <div className="ea-ligne"><button type="button" className="aime-btn aime-btn--primaire aime-btn--petit">Publier</button><button type="button" className="aime-btn aime-btn--secondaire aime-btn--petit">Historique</button></div>
    </div>
  </div>;
}

/* une colonne d'un thème, pour la comparaison côte à côte */
function Colonne({ theme, children }: { theme: Theme; children: ReactNode }) {
  return <section data-aime={theme} className="ea-colonne aime-scene" aria-label={theme === "jour" ? "Thème Jour" : "Thème Nuit"}>
    <p className="aime-sur">{theme === "jour" ? "Jour" : "Nuit"}</p>{children}</section>;
}

export default function EssaiAime() {
  const { choix, theme, choisir } = useTheme();
  return <div data-aime={theme} className="ea aime-scene">
    <header className="ea-entete">
      <p className="ea-marque"><span className="aime-point" aria-hidden="true" />AIME<sup>®</sup> <span>Socle visuel</span></p>
      <nav className="aime-nav" aria-label="Sections">
        <a href="#socle" aria-current="page">Socle</a><a href="#composants">Composants</a><a href="#univers">Univers</a><a href="#cote">Jour et Nuit</a>
      </nav>
      <div className="aime-onglets" role="group" aria-label="Thème">{CHOIX_THEMES.map(c => <button key={c.id} type="button" aria-pressed={choix === c.id} onClick={() => choisir(c.id)}>{c.nom}</button>)}</div>
    </header>

    {/* 1 · le cadre (référence « Lumière », troisième image) : la photographie dans un bord blanc, sur un fond flouté */}
    <section id="socle" className="ea-hero">
      <div className="aime-scene-flou" aria-hidden="true"><img src={IMG + "histoire/met-palampore-2010-337.webp"} alt="" /></div>
      <div className="aime-cadre ea-hero-cadre">
        <div className="aime-cadre-media ea-hero-media">
          <img src={IMG + "histoire/reconstitution-ouvrages.webp"} alt="Des ouvrages brodés ouverts et des écheveaux (reconstitution générée)" />
          <div className="aime-sur-photo">
            <div className="ea-hero-haut"><p className="ea-marque ea-marque-photo"><span className="aime-point" aria-hidden="true" />AIME<sup>®</sup></p>
              <nav className="aime-nav aime-nav--blanche" aria-label="Exemple sur photographie"><a href="#composants">Studio</a><a href="#univers">Univers</a><a href="#cote">Bureau</a><a href="#socle">Contact</a></nav></div>
            <div className="ea-hero-texte">
              <h1 className="aime-titre aime-titre--capitales">Un socle,<br />tous les univers.</h1>
              <p className="aime-chapo">Une interface neutre, en Jour et en Nuit. Les couleurs, les textures et les photographies appartiennent au contenu de chaque univers.</p>
              <div className="ea-ligne"><a className="aime-btn aime-btn--droit ea-blanc" href="#composants">Voir les composants</a><a className="aime-btn aime-btn--droit aime-btn--contour ea-contour-photo" href="#cote">Jour et Nuit</a></div>
            </div>
            <div className="ea-hero-bas">
              <p className="ea-legende-photo">Reconstitution générée, contenu éditorial de l’univers Broderie.</p>
              <div className="aime-verre ea-temoin"><span className="aime-point" aria-hidden="true" /><p><b>Le Point</b><br />La même sphère nacrée, dans les deux thèmes.</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* 2 · le titre qui s'estompe (référence « Consulting ») */}
    <section className="ea-section ea-centre">
      <span className="aime-puce"><span className="aime-point" aria-hidden="true" />Design system AIME · Jour et Nuit</span>
      <h2 className="aime-titre">Une seule interface, <span className="aime-fondu">pour tous les métiers et toutes les formes.</span></h2>
      <p className="aime-chapo">Noir doux, anthracite, blanc et gris très clair. Des titres moyens, des boutons pilules, des panneaux de verre, des médias posés dans un cadre.</p>
      <div className="ea-ligne ea-ligne-centre"><a className="aime-btn aime-btn--primaire" href="#composants">Explorer <span className="aime-btn-fleche" aria-hidden="true">→</span></a><a className="aime-btn aime-btn--secondaire" href="#univers">Les univers</a></div>
      <div className="aime-cadre aime-cadre--sombre ea-ecran"><div className="aime-cadre-media"><img src={IMG + "ecrans/atelier-ordinateur.webp"} alt="L’atelier Point Zéro sur ordinateur (capture)" /></div></div>
    </section>

    <section className="ea-section">
      <p className="aime-sur">Tokens sémantiques · contraste mesuré sur le fond du thème</p>
      <Nuancier />
    </section>

    <section id="composants" className="ea-section"><p className="aime-sur">Composants</p><Composants /></section>

    <section id="univers" className="ea-section">
      <p className="aime-sur">Univers : une ambiance éditoriale, la même interface</p>
      <div className="ea-univers">{UNIVERS.map(u => <article key={u} data-aime-univers={u} className="aime-carte ea-univers-carte">
        <div className="ea-univers-fond" aria-hidden="true" />
        <div className="ea-univers-corps"><p className="aime-sur">{u}</p><p className="ea-univers-nom">{u[0].toUpperCase() + u.slice(1)}</p>
          <button type="button" className="aime-btn aime-btn--primaire aime-btn--petit">Ouvrir</button></div>
      </article>)}</div>
      <p className="aime-chapo">La couleur d’un univers colore son contenu (photographies, illustrations, liserés). Les boutons, les textes et les champs restent ceux du socle.</p>
    </section>

    <section id="cote" className="ea-section">
      <p className="aime-sur">Jour et Nuit, côte à côte</p>
      <div className="ea-cote">
        {(["jour", "nuit"] as Theme[]).map(t => <Colonne key={t} theme={t}><Composants /></Colonne>)}
      </div>
    </section>
    <footer className="ea-pied"><p className="aime-chapo">Essai privé. Polices : Inter Tight (SIL OFL), auto-hébergée. Photographies : The Met (domaine public), reconstitutions générées annoncées, captures de l’atelier.</p></footer>
  </div>;
}
