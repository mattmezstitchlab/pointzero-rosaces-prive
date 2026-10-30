/**
 * « Explorer les prototypes » : une seule page pour tout ouvrir, même ce qui est encore expérimental.
 * Chaque accès porte son statut, en mots (jamais la couleur seule).
 */
import { ACCES, AIDE_STATUTS, GROUPES, NOMS_STATUTS, type Statut } from "./acces";
import "../design/aime.css";
import "./convergence.css";

const VERSION = import.meta.env.VITE_CONVERGENCE_VERSION ?? "version candidate";

export default function Explorer() {
  return <main className="cv-explorer" data-aime="jour">
    <header className="cv-tete">
      <a className="cv-marque" href={import.meta.env.BASE_URL + "one/univers"}><span className="cv-orbe" aria-hidden="true" />.0NE</a>
      <span className="cv-version">{VERSION} · privée</span>
    </header>
    <section className="cv-intro">
      <p className="cv-sur">AIME — LUMIERE — ATLAS — RIPPLE — .0NE</p>
      <h1>Explorer les prototypes</h1>
      <p>Tout ce qui a été construit, au même endroit. Certaines interfaces sont expérimentales : chacune dit où elle en est.</p>
      <div className="cv-actions">
        <a className="cv-bouton cv-plein" href={import.meta.env.BASE_URL + "one/lumiere"}>Commencer par le film</a>
        <a className="cv-bouton" href={import.meta.env.BASE_URL + "one/premiere-rencontre"}>Aller à la Première rencontre</a>
        <a className="cv-bouton" href={import.meta.env.BASE_URL + "one/univers"}>Entrer dans .0NE</a>
      </div>
      <dl className="cv-legende">{(Object.keys(NOMS_STATUTS) as Statut[]).map(s => <div key={s}><dt><span className="cv-statut" data-statut={s}>{NOMS_STATUTS[s]}</span></dt><dd>{AIDE_STATUTS[s]}</dd></div>)}</dl>
    </section>
    {GROUPES.map(g => <section key={g.id} className="cv-groupe" aria-labelledby={"cv-" + g.id}>
      <h2 id={"cv-" + g.id}>{g.nom}</h2>
      <ul className="cv-grille">{ACCES.filter(a => a.groupe === g.id).map(a => {
        const externe = a.statut === "externe";
        const corps = <><span className="cv-statut" data-statut={a.statut}>{NOMS_STATUTS[a.statut]}</span>
          <b className="cv-nom">{a.nom}</b><span className="cv-phrase">{a.phrase}</span>
          {a.preuve && <span className="cv-preuve">{a.preuve}</span>}
          {externe && <span className="cv-preuve">S’ouvre dans un nouvel onglet ↗</span>}</>;
        return <li key={a.id} data-acces={a.id}>{a.chemin
          ? <a className="cv-carte" href={a.chemin} {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{corps}</a>
          : <div className="cv-carte cv-inerte">{corps}</div>}</li>;
      })}</ul>
    </section>)}
    <footer className="cv-pied">
      <p>Version candidate privée : rien ici ne remplace encore le site public. Les réglages restent sur votre appareil. Aucun fichier audio original n’est en ligne.</p>
    </footer>
  </main>;
}
