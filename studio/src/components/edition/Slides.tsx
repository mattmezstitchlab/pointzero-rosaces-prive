import { useEffect, useRef, useState, type ReactNode } from "react";
import "./Slides.css";

export interface Slide { id: string; titre: string; contenu: ReactNode }
/** Les ancres historiques ouvrent aussi leur diapositive, sans perdre les choix déjà faits. */
export function revelerSlide(id: string) {
  window.dispatchEvent(new CustomEvent("pointzero:ouvrir-slide", { detail: id }));
}

export default function Slides({ id, titre, slides }: { id: string; titre: string; slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const hote = useRef<HTMLElement>(null);
  const debut = useRef<{ x: number; y: number } | null>(null);
  const ids = slides.map(s => s.id).join(",");
  useEffect(() => {
    const ouvrir = (cible: string) => {
      const n = ids.split(",").indexOf(cible);
      if (n >= 0) setActive(n);
    };
    const evenement = (e: Event) => ouvrir((e as CustomEvent<string>).detail);
    const ancre = () => ouvrir(window.location.hash.slice(1));
    ancre();
    window.addEventListener("pointzero:ouvrir-slide", evenement);
    window.addEventListener("hashchange", ancre);
    return () => { window.removeEventListener("pointzero:ouvrir-slide", evenement); window.removeEventListener("hashchange", ancre); };
  }, [ids]);
  useEffect(() => {
    // Les disques et loupes existants remesurent leur surface quand elle redevient visible.
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    return () => cancelAnimationFrame(frame);
  }, [active]);
  const choisir = (n: number) => {
    // Une commande située dans la diapositive ne doit pas garder le focus une fois masquée.
    if (hote.current?.querySelector('[data-slide]:not([hidden])')?.contains(document.activeElement)) {
      hote.current.querySelector<HTMLButtonElement>(".ed-slides-suivant")?.focus();
    }
    setActive(Math.max(0, Math.min(slides.length - 1, n)));
  };
  return <section ref={hote} id={id} className="ed-slides" aria-roledescription="carrousel" aria-label={titre}>
    <header className="ed-slides-tete">
      <h2>{titre}</h2>
      <p role="status" aria-live="polite" aria-atomic="true">{active + 1} / {slides.length} · {slides[active].titre}</p>
      <nav aria-label={`Diapositives : ${titre}`}>
        <button type="button" disabled={active === 0} onClick={() => choisir(active - 1)} aria-label={`${titre} : diapositive précédente`}>← Précédent</button>
        <button type="button" className="ed-slides-suivant" disabled={active === slides.length - 1} onClick={() => choisir(active + 1)} aria-label={`${titre} : diapositive suivante`}>Suivant →</button>
      </nav>
      <div className="ed-slides-onglets" role="group" aria-label={`Choisir une diapositive : ${titre}`}>
        {slides.map((s, n) => <button type="button" key={s.id} aria-pressed={n === active} aria-controls={`${id}-slide-${n}`} onClick={() => choisir(n)}>{n + 1} · {s.titre}</button>)}
      </div>
    </header>
    <div className="ed-slides-contenu" onTouchStart={e => {
      debut.current = null;
      // Ne pas intercepter les gestes des disques, champs ou autres outils interactifs.
      if ((e.target as Element).closest("button, input, textarea, select, a, canvas, [role=menu], [role=slider], [role=radiogroup]")) return;
      const t = e.touches[0]; debut.current = { x: t.clientX, y: t.clientY };
    }} onTouchEnd={e => {
      const p = debut.current; debut.current = null; const t = e.changedTouches[0];
      if (p && Math.abs(t.clientX - p.x) > 70 && Math.abs(t.clientX - p.x) > Math.abs(t.clientY - p.y) * 1.5) choisir(active + (t.clientX < p.x ? 1 : -1));
    }} onTouchCancel={() => { debut.current = null; }}>
      {slides.map((s, n) => <div key={s.id} id={`${id}-slide-${n}`} data-slide hidden={n !== active} role="group" aria-roledescription="diapositive" aria-label={`${n + 1} sur ${slides.length} : ${s.titre}`}>{s.contenu}</div>)}
    </div>
  </section>;
}
