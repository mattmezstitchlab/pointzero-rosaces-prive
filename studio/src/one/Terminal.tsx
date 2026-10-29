/**
 * .0NE — le Disque Terminal. La ligne de commande devient une navigation radiale : la couronne porte les familles, chaque
 * famille remplace la couronne par ses actions, le centre garde le contexte (chemin, liste, sortie, progression, aperçu audio,
 * message). Il agit sur un VRAI dossier : l'espace d'essai de ce navigateur, ou un dossier de l'ordinateur que la personne ouvre.
 * La commande réelle équivalente se montre à la demande. Sur téléphone : le contenu étendu, le Point à la demande.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowUp, AudioLines, ChevronRight, Code2, Compass, Copy, Diff, Files, FolderInput, FolderOpen, FolderPlus, GitBranch, GitCommitHorizontal, GitCompare,
  History, Home, Layers, ListTree, Maximize2, Minimize2, Pause, Play, Plus, Redo2, Search, Settings2, Shield, Star, Tag, TerminalSquare, Trash2, Undo2, Upload, Download, UserRound, Waves, Weight, Clock3, CopyCheck as Doublons, Archive, RefreshCw, Folder, FileText } from "lucide-react";
import DisqueOne from "../components/one/DisqueOne";
import Point from "../components/point/Point";
import { COMMANDES, commande, FAMILLES, LUMIERES, type Lumiere, type VueCentre } from "../lib/terminal/contrat";
import { Moteur, preparerEspace, REGLAGES_DEFAUT, type Reglages, type Resultat } from "../lib/terminal/moteur";
import { dossierDisponible, espaceDisponible, joindre, ouvrirDossierOrdinateur, ouvrirEspaceEssai, type Fs } from "../lib/terminal/fs";
import { decorer, Indicateurs, type Indicateur } from "../lib/point/indicateurs";
import { appliquerOne, lireOne } from "../lib/one/preferences";
import type { ModePoint } from "../lib/point/modes";
import "../design/aime.css";
import "./one.css";
import "./mosaique.css";
import "./terminal.css";

const ICONES: Record<string, ReactNode> = {
  boussole: <Compass />, fichiers: <Files />, git: <GitBranch />, chercher: <Search />, audio: <AudioLines />, historique: <History />, executer: <TerminalSquare />, reglages: <Settings2 />,
  haut: <ArrowUp />, dossier: <FolderOpen />, etoile: <Star />, maison: <Home />, retour: <ArrowLeft />, liste: <ListTree />, copier: <Copy />, deplacer: <FolderInput />, renommer: <Tag />,
  corbeille: <Trash2 />, plus: <FolderPlus />, etat: <Layers />, valider: <GitCommitHorizontal />, envoyer: <Upload />, recuperer: <Download />, diff: <Diff />, branche: <GitCompare />,
  etiquette: <Tag />, poids: <Weight />, horloge: <Clock3 />, doublons: <Doublons />, lire: <Play />, onde: <Waves />, convertir: <RefreshCw />, ranger: <Archive />,
  annuler: <Undo2 />, retablir: <Redo2 />, code: <Code2 />, bouclier: <Shield />, personne: <UserRound />,
};
const ic = (n: string) => <span aria-hidden="true">{ICONES[n] ?? <Plus />}</span>;
const CLE_REGLAGES = "aime:terminal:reglages:v1";
const lireReglages = (): Reglages => { try { const r = JSON.parse(localStorage.getItem(CLE_REGLAGES) ?? "null"); if (r && typeof r === "object") return { ...REGLAGES_DEFAUT, ...r, favoris: Array.isArray(r.favoris) ? r.favoris.filter((x: unknown) => typeof x === "string").slice(0, 20) : [] }; } catch { /* rien */ } return { ...REGLAGES_DEFAUT }; };

export default function Terminal() {
  const prefs = useMemo(lireOne, []);
  const theme = prefs.affichage.theme === "system" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "nuit" : "jour") : prefs.affichage.theme === "dark" ? "nuit" : "jour";
  useEffect(() => { appliquerOne(prefs); }, [prefs]);
  const [moteur, setMoteur] = useState<Moteur | null>(null);
  const [centre, setCentre] = useState<VueCentre>({ genre: "message", ton: "encours", titre: "Ouverture de l’espace d’essai…" });
  const [derniere, setDerniere] = useState<{ commande: string; lumiere: Lumiere } | null>(null);
  const [, setVersion] = useState(0); const rafraichir = () => setVersion(v => v + 1);
  const [occupe, setOccupe] = useState(false);
  const [etenduChoisi, setEtendu] = useState<boolean | null>(null);
  const telephone = typeof window !== "undefined" && window.innerWidth < 720;
  const etendu = etenduChoisi ?? telephone;          /* téléphone : le contenu étendu d'abord (contrat .0NE) */
  const [annonce, setAnnonce] = useState("");
  const indicateurs = useMemo(() => new Indicateurs(), []);
  const [liste, setListe] = useState<Indicateur[]>([]);
  useEffect(() => indicateurs.abonner(setListe), [indicateurs]);
  /* envoyer et récupérer : un point orange permanent, dit en toutes lettres (pont local nécessaire) */

  const ouvrir = useCallback(async (fs: Fs, preparer: boolean) => {
    try { if (preparer) await preparerEspace(fs); } catch { /* l'espace existe déjà */ }
    const m = new Moteur(fs, lireReglages()); setMoteur(m); setCentre(await m.lister()); setDerniere(null);
    if (await m.git.existe()) { const e = await m.git.etat(); if (e.length) indicateurs.publier({ id: "git-sale", commande: "git-status", contexte: "terminal", etat: "info", libelle: `${e.length} changement${e.length > 1 ? "s" : ""} à voir`, annonce: false }); }
  }, [indicateurs]);
  useEffect(() => { if (espaceDisponible()) void ouvrirEspaceEssai().then(fs => ouvrir(fs, true)).catch(e => setCentre({ genre: "message", ton: "erreur", titre: "L’espace d’essai n’est pas disponible.", texte: String(e?.message ?? e) }));
    else setCentre({ genre: "message", ton: "attention", titre: "Ce navigateur ne permet pas d’ouvrir un dossier.", texte: "Le Disque Terminal demande un navigateur récent (Chrome, Edge, Safari 16 ou Firefox 111)." }); }, [ouvrir]);
  const enregistrer = (m: Moteur) => { try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(m.reglages)); } catch { /* rien */ } };

  /** exécuter : le point de la commande passe au bleu, puis au vert, à l'orange ou au rouge ; la suite conseillée s'allume en violet */
  const lancer = useCallback(async (id: string, args: Record<string, string> = {}) => {
    if (!moteur) return;
    const [base, variante] = id.split(":");
    if (variante === "init") args = { ...args, initialiser: "oui" };
    const c = commande(base);
    setOccupe(true); indicateurs.publier({ id: "ev-" + base, commande: base, contexte: "terminal", etat: "encours", libelle: (c?.nom ?? base) + " en cours", annonce: false });
    const r: Resultat = await moteur.executer(base, args);
    setOccupe(false); setCentre(r.centre); setDerniere({ commande: r.commande, lumiere: r.lumiere }); enregistrer(moteur);
    const l = LUMIERES[r.lumiere];
    if (r.lumiere === "disponible" || r.lumiere === "recommande") indicateurs.retirer("ev-" + base);
    else indicateurs.publier({ id: "ev-" + base, commande: base, contexte: "terminal", etat: l.etat, libelle: r.message ?? (r.centre.genre === "message" ? r.centre.titre : `${c?.nom} : ${l.mot}`), duree: r.lumiere === "erreur" ? undefined : 6000 });
    indicateurs.retirer("suite"); if (r.suite) indicateurs.publier({ id: "suite", commande: r.suite, contexte: "terminal", etat: "guide", libelle: `Recommandé ensuite : ${commande(r.suite)?.nom}`, annonce: false });
    if (base.startsWith("git") || base === "aud-ranger" || base.startsWith("fic") || base.startsWith("his")) {
      if (await moteur.git.existe()) { const e = await moteur.git.etat(); if (e.length) indicateurs.publier({ id: "git-sale", commande: "git-status", contexte: "terminal", etat: "info", libelle: `${e.length} changement${e.length > 1 ? "s" : ""} à voir`, annonce: false }); else indicateurs.retirer("git-sale"); }
    }
    setAnnonce(`${l.mot} : ${r.centre.genre === "message" ? r.centre.titre : r.message ?? c?.nom ?? ""}`);
    rafraichir();
  }, [moteur, indicateurs]);

  /* la couronne : les familles (racine), puis les actions d'une famille ; Confort est apporté par le Point */
  const modes: ModePoint[] = useMemo(() => {
    const familles = FAMILLES.map((f): ModePoint => ({ id: f.id, nom: f.nom, aide: f.aide, icone: ic(f.icone), groupe: "metier", ouvrir: () => {},   /* tous du même groupe : la couronne garde l’ordre voulu (Naviguer … Réglages, Retour) */
      enfants: () => [
        ...COMMANDES.filter(c => c.famille === f.id).map((c): ModePoint => ({ id: c.id, nom: c.nom, icone: ic(c.icone), groupe: c.risque === "destructif" ? "creation" : "metier",
          aide: c.aide + (moteur?.reglages.voirCommande ? ` — $ ${moteur.equivalent(c.id)}` : ""), resteOuvert: true,
          /* envoyer, récupérer : un point orange posé sur la commande seule (il ne colore pas toute la famille Git), dit en toutes lettres */
          ...(c.portee === "pont" ? { indicateur: { etat: "action" as const, mot: "attention", libelle: "pont local nécessaire", herite: false } } : {}),
          ouvrir: () => void lancer(c.id, c.id === "nav-favoris" ? {} : {}) })),
        ...(f.id === "naviguer" ? [{ id: "nav-favori-ajouter", nom: "Ajouter aux favoris", icone: ic("etoile"), aide: "ce dossier, dans vos favoris", groupe: "socle" as const, resteOuvert: true, ouvrir: () => void lancer("nav-favoris", { ajouter: "oui" }) } satisfies ModePoint] : []),
        ...(f.id === "reglages" ? [
          ...(espaceDisponible() ? [{ id: "src-espace", nom: "Espace d’essai", icone: ic("maison"), aide: "un vrai dossier privé, dans ce navigateur", groupe: "socle" as const, actif: moteur?.fs.nom === "Espace d’essai", ouvrir: () => void ouvrirEspaceEssai().then(fs => ouvrir(fs, true)) } satisfies ModePoint] : []),
          ...(dossierDisponible() ? [{ id: "src-dossier", nom: "Ouvrir un dossier", icone: ic("dossier"), aide: "un dossier de votre ordinateur (vous l’autorisez)", groupe: "socle" as const, ouvrir: () => void ouvrirDossierOrdinateur().then(fs => ouvrir(fs, false)).catch(() => setCentre({ genre: "message", ton: "disponible", titre: "Aucun dossier ouvert." })) } satisfies ModePoint] : []),
        ] : []),
      ] }));
    return [...familles, { id: "retour-one", nom: "Retour", icone: ic("retour"), aide: "revenir aux univers de .0NE", groupe: "metier", ouvrir: () => window.location.assign(import.meta.env.BASE_URL + "one/univers") }];
  }, [moteur, lancer, ouvrir, moteur?.reglages.voirCommande]); // eslint-disable-line react-hooks/exhaustive-deps
  const decores = useMemo(() => decorer(modes, liste, id => indicateurs.consulter(id)), [modes, liste, indicateurs]);

  const vue = <Centre centre={centre} moteur={moteur} occupe={occupe} lancer={lancer} rafraichir={rafraichir} derniere={derniere} etendu={etendu} basculer={() => setEtendu(!etendu)} />;
  return <div className="one ot" data-aime={theme} data-etendu={etendu ? "oui" : "non"}>
    <header className="one-tete">
      <a className="one-marque" href={import.meta.env.BASE_URL + "one/univers"}><span className="one-orbe" aria-hidden="true" />.0NE</a>
      <p className="ot-titre">Disque Terminal <span className="om-statut om-experimental">Expérimental</span></p>
      <p className="ot-source" title="Le dossier sur lequel agit le Disque">{ic("dossier")}{moteur?.fs.nom ?? "…"}</p>
    </header>
    {etendu
      ? <main className="ot-etendu">{vue}<div className="ot-point"><Point contexte="terminal-etendu" etiquette="Le Disque Terminal" modes={decores} /></div></main>
      : <main className="ot-scene"><DisqueOne contexte="terminal" etiquette="Le Disque Terminal : familles de commandes ; le centre montre le contexte" modes={decores} centre={vue} max={720} /></main>}
    <p className="sr-only" role="status" aria-live="polite">{annonce}</p>
  </div>;
}

/* ——— Le centre : le contexte actif ——— */
function Centre({ centre, moteur, occupe, lancer, rafraichir, derniere, etendu, basculer }: { centre: VueCentre; moteur: Moteur | null; occupe: boolean; lancer: (id: string, a?: Record<string, string>) => Promise<void>; rafraichir: () => void; derniere: { commande: string; lumiere: Lumiere } | null; etendu: boolean; basculer: () => void }) {
  const chemin = moteur ? "/" + moteur.cwd : "/";
  const morceaux = moteur?.cwd ? moteur.cwd.split("/") : [];
  const choisir = (e: { nom: string; chemin: string; genre: "dossier" | "fichier" }) => { if (!moteur) return; moteur.selection = moteur.selection?.chemin === e.chemin ? null : { nom: e.nom.split("/").pop()!, chemin: e.chemin, genre: e.genre, taille: 0, modifie: 0 }; rafraichir(); };
  return <section className={"ot-centre" + (occupe ? " ot-occupe" : "")} aria-label="Le contexte du Disque Terminal" aria-busy={occupe}>
    <nav className="ot-chemin" aria-label={"Dossier courant : " + chemin}>
      <button type="button" onClick={() => void lancer("nav-bureau")} aria-label="Racine du dossier de travail">{ic("maison")}</button>
      {morceaux.map((m, k) => <span key={k}><ChevronRight aria-hidden="true" /><button type="button" onClick={() => moteur && void moteur.executer("nav-favoris", { aller: morceaux.slice(0, k + 1).join("/") }).then(() => lancer("fic-lister"))}>{m}</button></span>)}
    </nav>
    {moteur?.selection && <p className="ot-selection"><span>Choisi :</span> <b>{moteur.selection.nom}</b><button type="button" aria-label="Ne plus rien choisir" onClick={() => { moteur.selection = null; rafraichir(); }}>×</button></p>}
    <div className="ot-corps">{corps(centre, moteur, lancer, choisir)}</div>
    {moteur?.reglages.voirCommande && derniere && <p className="ot-commande" aria-label="Commande réelle équivalente"><span aria-hidden="true">$</span> {derniere.commande}</p>}
    <button type="button" className="ot-etendre" onClick={basculer} aria-label={etendu ? "Revenir au Disque" : "Étendre le contenu"} title={etendu ? "Revenir au Disque" : "Étendre"}>{etendu ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
  </section>;
}

function corps(c: VueCentre, moteur: Moteur | null, lancer: (id: string, a?: Record<string, string>) => Promise<void>, choisir: (e: { nom: string; chemin: string; genre: "dossier" | "fichier" }) => void): ReactNode {
  if (c.genre === "liste") return <>{c.titre && <p className="ot-sur">{c.titre}</p>}
    {c.entrees.length ? <ul className="ot-liste">{c.entrees.map(e => <li key={e.chemin}>
      <button type="button" className="ot-entree" aria-pressed={moteur?.selection?.chemin === e.chemin} onClick={() => choisir(e)} onDoubleClick={() => { if (e.genre === "dossier") { choisir(e); void lancer("nav-ouvrir"); } }}>
        <span className="ot-ico" aria-hidden="true">{e.genre === "dossier" ? <Folder /> : /\.(wav|mp3|ogg|m4a|flac|aac)$/i.test(e.nom) ? <AudioLines /> : <FileText />}</span>
        <span className="ot-nom">{e.nom}</span><span className="ot-detail">{e.detail}</span></button>
      {e.genre === "dossier" && <button type="button" className="ot-ouvrir" aria-label={"Ouvrir " + e.nom} onClick={() => { choisir(e); void lancer("nav-ouvrir"); }}><ChevronRight aria-hidden="true" /></button>}
    </li>)}</ul> : <p className="ot-vide">{c.vide}</p>}</>;
  if (c.genre === "sortie") return <><p className="ot-sur">{c.titre}</p><pre className="ot-sortie">{c.lignes.map((l, k) => <span key={k} data-ton={l.ton ?? "neutre"}>{l.texte}{"\n"}</span>)}</pre></>;
  if (c.genre === "progression") return <div className="ot-progression"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" className="ot-piste" /><circle cx="50" cy="50" r="44" className="ot-arc" pathLength={100} strokeDasharray={`${Math.round(c.part * 100)} 100`} transform="rotate(-90 50 50)" /></svg>
    <p className="ot-msg-titre">{c.titre}</p><p className="ot-msg-texte">{c.etape}</p></div>;
  if (c.genre === "audio") return <Audio c={c} moteur={moteur} />;
  if (c.genre === "message") return <div className="ot-message" data-lumiere={c.ton}><span className="ot-lumiere" aria-hidden="true" /><p className="ot-msg-titre">{c.titre}</p>{c.texte && <p className="ot-msg-texte">{c.texte}</p>}
    {c.ton === "attention" && /dépôt Git/.test(c.titre) && <button type="button" className="one-bouton one-bouton-plein" onClick={() => void lancer("git-status:init")}>Initialiser un dépôt</button>}</div>;
  if (c.genre === "saisie") return <Saisie c={c} lancer={lancer} />;
  if (c.genre === "confirmation") return <div className="ot-message" data-lumiere="attention"><span className="ot-lumiere" aria-hidden="true" /><p className="ot-msg-titre">{c.titre}</p><p className="ot-msg-texte">{c.texte}</p>
    <div className="ot-boutons"><button type="button" className="one-bouton" onClick={() => void lancer("fic-lister")}>Annuler</button>
      <button type="button" className="one-bouton one-bouton-plein" onClick={() => void lancer(c.commande, { confirme: "oui" })}>Confirmer</button></div></div>;
  return <Destination c={c} moteur={moteur} lancer={lancer} />;
}

function Saisie({ c, lancer }: { c: Extract<VueCentre, { genre: "saisie" }>; lancer: (id: string, a?: Record<string, string>) => Promise<void> }) {
  const [v, setV] = useState(c.valeur), champ = useRef<HTMLInputElement>(null);
  useEffect(() => { champ.current?.focus(); champ.current?.select(); }, [c.commande]);
  const mono = c.commande === "exe-libre";
  return <form className="ot-saisie" onSubmit={e => { e.preventDefault(); if (v.trim() || c.commande === "git-branche") void lancer(c.commande, { texte: v.trim() }); }}>
    <p className="ot-msg-titre">{c.titre}</p>
    <label><span>{c.etiquette}</span><input ref={champ} className={mono ? "ot-mono" : ""} value={v} onChange={e => setV(e.target.value)} maxLength={mono ? 240 : 120} spellCheck={!mono} autoCapitalize="off" autoCorrect="off" /></label>
    {c.aide && <p className="ot-msg-texte">{c.aide}</p>}
    <div className="ot-boutons"><button type="button" className="one-bouton" onClick={() => void lancer("fic-lister")}>Annuler</button><button type="submit" className="one-bouton one-bouton-plein">Valider</button></div>
  </form>;
}

function Destination({ c, moteur, lancer }: { c: Extract<VueCentre, { genre: "destination" }>; moteur: Moteur | null; lancer: (id: string, a?: Record<string, string>) => Promise<void> }) {
  const [ici, setIci] = useState(moteur?.cwd ?? ""), [dossiers, setDossiers] = useState<string[]>([]);
  useEffect(() => { if (moteur) void moteur.fs.lister(ici).then(l => setDossiers(l.filter(e => e.genre === "dossier").map(e => e.nom))); }, [ici, moteur]);
  return <div className="ot-destination"><p className="ot-msg-titre">{c.titre}</p>
    <p className="ot-sur">/{ici}</p>
    <ul className="ot-liste">{ici && <li><button type="button" className="ot-entree" onClick={() => setIci(ici.split("/").slice(0, -1).join("/"))}><span className="ot-ico" aria-hidden="true"><ArrowUp /></span><span className="ot-nom">Dossier parent</span></button></li>}
      {dossiers.map(d => <li key={d}><button type="button" className="ot-entree" onClick={() => setIci(joindre(ici, d))}><span className="ot-ico" aria-hidden="true"><Folder /></span><span className="ot-nom">{d}</span><ChevronRight aria-hidden="true" /></button></li>)}</ul>
    <div className="ot-boutons"><button type="button" className="one-bouton" onClick={() => void lancer("fic-lister")}>Annuler</button><button type="button" className="one-bouton one-bouton-plein" onClick={() => void lancer(c.commande, { destination: ici })}>Ici : /{ici}</button></div>
  </div>;
}

/** l'aperçu audio : la forme d'onde en cercle ; le son ne part qu'au geste de la personne */
function Audio({ c, moteur }: { c: Extract<VueCentre, { genre: "audio" }>; moteur: Moteur | null }) {
  const [url, setUrl] = useState<string | null>(null), [lecture, setLecture] = useState(false), [part, setPart] = useState(0), son = useRef<HTMLAudioElement>(null);
  useEffect(() => { let u: string | null = null; if (moteur) void moteur.fs.lire(c.chemin).then(f => { u = URL.createObjectURL(f); setUrl(u); }); return () => { if (u) URL.revokeObjectURL(u); }; }, [c.chemin, moteur]);
  const n = c.cretes?.length ?? 0;
  return <div className="ot-audio">
    {n > 0 && <svg className="ot-onde" viewBox="-100 -100 200 200" aria-hidden="true">{c.cretes!.map((h, k) => { const a = (2 * Math.PI * k) / n - Math.PI / 2, r1 = 72, r2 = 72 + 24 * h;
      return <line key={k} x1={r1 * Math.cos(a)} y1={r1 * Math.sin(a)} x2={r2 * Math.cos(a)} y2={r2 * Math.sin(a)} data-joue={k / n <= part ? "oui" : "non"} />; })}</svg>}
    <div className="ot-audio-coeur">
      <p className="ot-msg-titre">{c.nom}</p>
      {url && <><audio ref={son} src={url} preload="metadata" onTimeUpdate={e => setPart(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)} onEnded={() => setLecture(false)} onPause={() => setLecture(false)} onPlay={() => setLecture(true)} />
        <button type="button" className="ot-lire" aria-label={lecture ? "Pause" : "Écouter " + c.nom} onClick={() => { const a = son.current; if (!a) return; if (a.paused) void a.play(); else a.pause(); }}>{lecture ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}</button></>}
      {c.meta && <dl className="ot-meta">{Object.entries(c.meta).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
    </div>
  </div>;
}
