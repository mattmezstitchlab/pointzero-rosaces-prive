# .0NE — The contextual Disque (convergence of design and navigation)

*`convergence` branch, version candidate 3, 30/10/2026.*

**Rule:**
- A universe is not another application to open: it is a context in which the same Disque becomes another tool.
- The centre presents the content; the crown provides the actions; the Point keeps continuity; the grid lets you find the universes again.

## What changes

- **`/studio/one/univers` is the Disque**, the main interface.
  - There is a single `DisqueOne` component, so no copy per page.
  - The old mosaic, with its presentation windows, is kept at `/studio/one/mosaique` for comparison.
- **Click a universe → the Disque changes context → real content in the centre.** The intermediate "Présentation / Ouvrir" step is gone. "À propos" stays available as a secondary command.
- **Context registry** (`lib/one/contextes.ts`): each connected universe is a component that does three things:
  - it renders the centre;
  - it publishes its commands, including second-level rings via `enfants` (the same language as the workshop);
  - it declares its permissions.
- **The address and history follow the context**: `?u=galerie&o=givre&f.palette=1`. The browser's Back button returns to the previous context.
- **Reserved zone** under the Disque, at a fixed height. It holds the names and help text of commands, the status line, and a question (Rechercher). **Hovering no longer moves anything** (tested: the Disque's position does not change).
- **Agrandir**: the Disque folds into a Point and the content fills the screen. The Point unfolds it again with the context intact.
- **Full screen** (workshop, Terminal, Carte): the context is remembered, and **"Revenir à .0NE · Bureau"** brings you back in one click to the same universe and the same object.
- **AIME white by default**: warm white `#fbfaf7`, matte black Disque, sand ring as an accent, nacre Orbe.
  - Night applies only if the person has chosen it ("Jour / Nuit / Selon l'appareil" in the Première rencontre).
  - Before, a Mac in dark mode made all of .0NE dark.
- **Phone**: the content takes the full width, and the **same commands appear as a list** (same names, sub-levels, immediate Back). No large circle around unreadable content.

## Connected contexts

| Universe | Centre | Crown |
|---|---|---|
| Galerie | the real rosaces of the 5D engine (the 12 recipes from the editions) | Parcourir (2nd ring), Précédente/Suivante, Filtrer (2nd ring: structure, stroke, density, scale, palette, favourites), Rechercher, Agrandir, Informations, Favori, Partager (public recipes), Broder (the workshop, return kept) |
| Bureau | the **real works** on the device (Mes ouvrages) | Ouvrir (in Broderie), Précédent/Suivant, Créer, Rechercher, Organiser (2nd ring: date, name, progress); on an empty device, a "test work" **labelled as a demonstration** (a real recipe) |
| Broderie | the canvas in progress and its threads | Continuer (the workshop), Mes ouvrages, Rosaces, Tambour |
| Terminal, Carte vivante | these are already full-screen Disques | Ouvrir (return kept) |
| Others | their **real status** and their presentation | nothing is simulated |

## The required demonstration (tested)

The 13 steps:

1. Open .0NE.
2. Check the white background.
3. Open the universes.
4. Choose Galerie.
5. A real rosace appears.
6. Filter with the crown.
7. Choose "Givre".
8. Enlarge it.
9. Come back.
10. Choose Bureau.
11. A work appears.
12. Open it in Broderie.
13. "Revenir à .0NE · Bureau" returns to the same work.

Also checked: the Disque does not move on hover, browser history works, and there is no horizontal scroll.

**74/74** across WebKit (Safari) and Chromium, desktop and phone (iPhone 14 emulated) (`tests/e2e/disque_demo.py`).

## Still to do (not blocking)

- **Musique** in the centre: the waveform, energy graph and timeline of "La Fleur du Ciel", separating measured events from artistic annotations. The data and markers already exist (LUMIERE editing engine).
- **Carte vivante in the centre** (today a full-screen deployment). The Carte page is still dark: it should follow the AIME white.
- **Galerie des Vivants** (works exhibited by people): needs a server. It will join the Galerie centre when a test database is connected to the preview.
- **RIPPLE**: events and their relations once the engine is integrated. Today it is a geometry demo only.
- **Contrast**: a design review across all panels, dialogs, media and states in white and in night mode. Night mode has not been reviewed this time.
- **Manual testing on a real iPhone and Mac** (my tests run on WebKit/Chromium engines, not on the devices themselves).
