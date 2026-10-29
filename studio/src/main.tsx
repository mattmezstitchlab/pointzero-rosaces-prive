import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./design/pointzero.css";
import App from "./App";
import StorageRecoveryNotice from "./components/StorageRecoveryNotice";
import AccessibilityShell from "./components/AccessibilityShell";
const EssaiImage = lazy(() => import("./essais/EssaiImage"));
const EssaiCarte = lazy(() => import("./essais/EssaiCarte"));

/* essai privé : le bloc Image, piloté par le même Point (aucune autre application) */
const essaiImage = /\/essai-image\/?$/.test(window.location.pathname);
/* essai privé : la carte vivante (indépendante du studio) */
const essaiCarte = /\/essai-carte\/?$/.test(window.location.pathname);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {essaiCarte ? <Suspense fallback={null}><EssaiCarte /></Suspense> : essaiImage ? <AccessibilityShell><Suspense fallback={null}><EssaiImage /></Suspense></AccessibilityShell> : <AccessibilityShell><StorageRecoveryNotice/><App /></AccessibilityShell>}
  </StrictMode>
);
