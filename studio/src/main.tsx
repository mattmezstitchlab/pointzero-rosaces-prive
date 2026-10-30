import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./design/pointzero.css";
import { appliquerApercuAime } from "./design/aimeStudio";
import App from "./App";
import StorageRecoveryNotice from "./components/StorageRecoveryNotice";
import AccessibilityShell from "./components/AccessibilityShell";
const EssaiImage = lazy(() => import("./essais/EssaiImage"));
const Bureau = lazy(() => import("./bureau/Bureau"));
const EssaiCarte = lazy(() => import("./essais/EssaiCarte"));
const EssaiAime = lazy(() => import("./essais/EssaiAime"));
const Galerie = lazy(() => import("./galerie/Galerie"));
const Tambour = lazy(() => import("./tambour/Tambour"));
const EssaiTraversee = lazy(() => import("./essais/EssaiTraversee"));
const PremiereRencontre = lazy(() => import("./one/PremiereRencontre"));
const Mosaique = lazy(() => import("./one/Mosaique"));
const Terminal = lazy(() => import("./one/Terminal"));
const FilmLumiere = lazy(() => import("./film/lumiere/Film"));

/* essai privé : le bloc Image, piloté par le même Point (aucune autre application) */
const essaiImage = /\/essai-image\/?$/.test(window.location.pathname);
/* le Bureau éditorial : réservé à l'administration (vérifiée par le serveur) */
const bureau = /\/bureau\/?$/.test(window.location.pathname);
/* essai privé : la carte vivante (indépendante du studio) */
const essaiCarte = /\/essai-carte\/?$/.test(window.location.pathname);
/* essai privé : le socle visuel AIME, Jour et Nuit */
const essaiAime = /\/essai-aime\/?$/.test(window.location.pathname);
/* la Galerie des Vivants : lisible sans compte */
const galerie = /\/galerie\/?$/.test(window.location.pathname);
/* essai privé : le Tambour vivant (Caméra → Broderie) */
const tambour = /\/tambour\/?$/.test(window.location.pathname);
/* essai privé (phase E, une scène) : le Point traverse la page */
/* .0NE (branche privée one-universel) : la Première rencontre et la mosaïque des univers */
const onePremiere = /\/one\/premiere-rencontre\/?$/.test(window.location.pathname);
const oneTerminal = /\/one\/terminal\/?$/.test(window.location.pathname);
/* la preuve isolée de l'Orbe relationnelle, sur le Disque Terminal (le Terminal validé reste à /one/terminal) */
const oneTerminalOrbe = /\/one\/terminal-orbe\/?$/.test(window.location.pathname);
const oneUnivers = /\/one(\/univers)?\/?$/.test(window.location.pathname);
/* LUMIERE : la première séquence expérimentale (branche privée lumiere-film) */
const filmLumiere = /\/one\/lumiere\/?$/.test(window.location.pathname);
const essaiTraversee = /\/essai-traversee\/?$/.test(window.location.pathname);

appliquerApercuAime();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {bureau ? <Suspense fallback={null}><Bureau /></Suspense>
      : essaiCarte ? <Suspense fallback={null}><EssaiCarte /></Suspense>
      : essaiAime ? <Suspense fallback={null}><EssaiAime /></Suspense>
      : galerie ? <Suspense fallback={null}><Galerie /></Suspense>
      : tambour ? <AccessibilityShell><Suspense fallback={null}><Tambour /></Suspense></AccessibilityShell>
      : filmLumiere ? <AccessibilityShell><Suspense fallback={null}><FilmLumiere /></Suspense></AccessibilityShell>
      : onePremiere ? <AccessibilityShell><Suspense fallback={null}><PremiereRencontre /></Suspense></AccessibilityShell>
      : oneTerminalOrbe ? <AccessibilityShell><Suspense fallback={null}><Terminal relation /></Suspense></AccessibilityShell>
      : oneTerminal ? <AccessibilityShell><Suspense fallback={null}><Terminal /></Suspense></AccessibilityShell>
      : oneUnivers ? <AccessibilityShell><Suspense fallback={null}><Mosaique /></Suspense></AccessibilityShell>
      : essaiTraversee ? <AccessibilityShell><Suspense fallback={null}><EssaiTraversee /></Suspense></AccessibilityShell>
      : essaiImage ? <AccessibilityShell><Suspense fallback={null}><EssaiImage /></Suspense></AccessibilityShell>
      : <AccessibilityShell><StorageRecoveryNotice/><App /></AccessibilityShell>}
  </StrictMode>
);
