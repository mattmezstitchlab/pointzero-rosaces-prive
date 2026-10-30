# AIME — LUMIERE · The birth of the Point

*Experimental 44-second sequence. Private branch `lumiere-film`, route `/one/lumiere`. Artistic and technical proof, not the landing page. 30/10/2026.*

## 0. The founding event, measured

Matt confirmed that the impact around 03:18 in « La Fleur du Ciel » was composed on purpose. Millisecond-level analysis shows it is built in **three stages**, all on a 120 BPM grid:

| Musical time | What the signal shows | Film role |
|---|---|---|
| 03:16.275 → 03:16.750 | **the gap**: the sound drops below −30 dBFS (minimum −46.7 dBFS) for 0.47 s; the bass disappears | time stops: the drop hangs |
| 03:16.775 → 03:18.240 | **high frequencies with no bass**: brightness climbs from 2,000 to 3,850 Hz; the bass stays at −65 dB | the drop lets go and falls |
| **03:18.255** | **the contact**: the bass rises by **+53 dB in 20 ms** (half-way point at 03:18.245); overall level −22 → −16 dBFS; it falls **on a strong beat** | the drop meets the water |

The gap, the start of the high frequencies and the contact all fall on beats (03:16.25 / 03:16.75 / 03:18.25, to within ±25 ms).

**Limit, stated plainly:** my tools do not let me *listen*. "Perceptible attack" here means the moment the low end reaches half its rise (03:18.245–03:18.260), not a perceived attack. The 03:18 marker from the audit (a sustained energy jump) was confirmed. The exact image to sync on still needs **one listen by Matt**: the control mode lets you move ±1 frame.

## A. Timed storyboard

Film time `t` = musical time − 184.25 s. 24 frames per second, 1,056 frames.

| Tableau | t (s) | Frames | Music | Image | Transition |
|---|---|---|---|---|---|
| **I — Infinity** | 0 → 4 | 0–96 | 03:04.25 → 03:08.25 | Deep cosmos, slow stars. At **2.0 s**, when a dark section begins (brightness 1,290 → 770 Hz, the bass comes in), a tiny nacre light appears with its sparkle. | The light grows. |
| **II — The crossing** | 4 → 10 | 96–240 | → 03:14.25 | The light becomes a pearl and comes down. Three layers of clouds rise in parallax, lit from within by the pearl. The stars go out. Mist and particles appear close to the pearl. | The clouds part. |
| **III — Suspension** | 10 → 14.005 | 240–336 | → 03:18.255 | The pearl becomes a drop with a nacre heart, above calm water: horizon, mist, reflection, a trail of glints. At **12.025** (the gap) **everything freezes**. At **12.525** (high frequencies) the drop lets go and falls, accelerating. | Contact. |
| **IV — The impact** | 14.005 → 18 | 336–432 | → 03:22.25 | **The drop meets the water on the measured attack.** A brief soft light, no explosion. A first circle, then one circle per second (every 2 beats). The light has gone into the water, at the centre. | The camera begins to rise. |
| **V — RIPPLE** | 18 → 30 | 432–720 | → 03:34.25 | Seen from above, the waves are true circles. They **settle on the rings of the Ripple dial** (same radii as RIPPLECIRCLE). Then the 12 angular markers unfold clockwise, then 24 polar positions light up one by one. The Point stays at the centre. | — |
| **VI — ATLAS and .0NE** | 30 → 44 | 720–1056 | → 03:48.25 | A grid shows under the surface, uncovered by the circles. A few squares of light, sparse and soft. At **38 s**, the Disque forms on the outer Ripple ring, in the **proportions of the real .0NE Disque**. At **42 s** (the music eases: brightness 2,160 → 830 Hz) **the Disque folds into a single nacre Point**. White rises from the Point. | The Point flies to the real Première rencontre. |

## B. Music timeline (measured markers)

| Marker | Music | t | Frame | Source |
|---|---|---|---|---|
| start | 03:04.250 | 0.000 | 0 | start of the excerpt (2 s sound fade-in, applied at playback) |
| light | 03:06.250 | 2.000 | 48 | the bass comes in, brightness drops (dark section) |
| crossing | 03:08.250 | 4.000 | 96 | bar −5 |
| drop | 03:14.250 | 10.000 | 240 | bar −2 |
| **suspension** | **03:16.275** | **12.025** | **289** | gap < −30 dBFS until 03:16.750 |
| **fall** | **03:16.775** | **12.525** | **301** | high frequencies with no bass |
| attack | 03:18.240 | 13.990 | 336 | the bass starts rising |
| **contact** | **03:18.255** | **14.005** | **336** | bass at peak −6 dB, on the beat |
| ripple | 03:22.250 | 18.000 | 432 | bar +2 |
| atlas | 03:34.250 | 30.000 | 720 | bar +8 |
| disque | 03:42.250 | 38.000 | 912 | bar +12 |
| fold | 03:46.250 | 42.000 | 1008 | the music eases (brightness ↓, level −15 → −21 dBFS) |
| end | 03:48.250 | 44.000 | 1056 | 2 s fade-out, then the Première rencontre |

The excerpt runs from 03:04.25 to 03:48.25. It is an **exact copy of the samples** (checked sample by sample). The master's SHA-256 `32ed627f…` is unchanged. The fades are applied at playback only; the file is never modified.

Figure: `timeline-musicale.png` (level, bass, brightness, markers, 120 BPM grid).

## C. The sequence: what exists, and its limits

- **What exists:** a real-time animated film (WebGL2), plus an MP4 animatic rendered frame by frame from the same engine (1280×720, 24 fps, with the excerpt). Every image is a **pure function of time**, so the render is exact and reproducible.
- **Materials:**
  - iridescent nacre (thin-film interference) that stays visible even at a few pixels, through its halo and sparkle;
  - three layers of volumetric clouds, lit by the pearl;
  - lit mist and particles;
  - a transparent drop that works as a lens, with a nacre heart and a caustic;
  - water: perspective plane, Fresnel reflection, a trail of glints, ripples from the contract, distant mist;
  - a soft grid under the surface.
- **Limit:** this is a **procedural animatic**, not a photorealistic pre-rendered video. Clouds and water are convincing in motion but do not match a volumetric 3D render. If Matt wants that level, the atmospheric scenes (I–III) can become a pre-rendered video, made with a 3D tool and free or licensed assets. The **geometric** part (IV–VI) and the end should stay in real time: they must coincide with the interactive Ripple Disque.
- **Controls** (`?controle`):
  - a timeline showing the 13 markers;
  - display of t / frame / musical time / tableau;
  - ← → moves one frame, Shift+← → moves one second;
  - `?t=` restarts at a given moment.

## D. Transition into the real .0NE

At the end, the Point stays at the centre: it is never removed. White rises from it. Then the **real `PremiereRencontre` component** is mounted (lazy loading). The Point flies (1.1 s) to the **Orbe of the .0NE mark** of that component and takes its place. The component is interactive straight away: "Commencer" moves to the next step, and this is tested.

In reduced motion there is no flight: direct arrival. The film's Disque (tableau VI) has the proportions of the Disque the person then finds in the Première rencontre: dark crown, light centre.

## E. One geometry for the film and the application

Contract `studio/src/lib/onde/contrat.ts`:

- **centre, radius, number of waves, spacing, amplitude, speed, damping, phase, colour, trigger, time progression**;
- `fronts(o, t)`, `hauteur(o, r, t)`: the **same formula** feeds the shader's water surface and the 2D lines;
- `versAnneaux()`: the wave fronts settle on the Ripple rings;
- `reperes()`: radial deployment of the markers;
- **polar geometry taken as is from RIPPLECIRCLE** (`polarXY`, `arcPathAt`, `normDeg`, `angularDist`) and the radii of its rings (dial of 1000, centre 500), as fractions.

**Decorative or transmitted:** a wave's `declencheur` is either `decoratif` (a reason, plus optionally a measured marker that *paces* it) or `evenement` (id, source, timestamp).

- `transmettre()` accepts only a causal wave, and refuses a decorative one **even if it has been force-cast** (runtime check).
- The film's wave is decorative, paced by the musical attack measured at 03:18.255: it notifies no one.
- The real Ripple will keep its causal, event-driven logic.

## F. Inventory: reuse, don't rebuild

| Element | Status | Use |
|---|---|---|
| RIPPLECIRCLE `src/utils/radial.ts` | ✅ reused (4 generic functions, commit 63fe103) | marker and position geometry |
| RIPPLECIRCLE `src/ripple/config.ts` (RINGS) | ✅ radii reused as fractions; their wedding meaning **is not** | rings of tableau V |
| RIPPLECIRCLE `Ripple.tsx` (1,899 lines) | ❌ not reused: tied to guests, tables, playlist, day schedule | — |
| RIPPLECIRCLE principle "audio wave measured, never on the simulated clock" | ✅ kept | the music sets the time |
| .0NE universal Disque (`geometrieDisque`) | ✅ | proportions of the Disque in tableau VI |
| Nacre Orbe (`--aime-nacre`, `.one-orbe`) | ✅ | the Point, the final target |
| Première rencontre | ✅ the real component | end of the film |
| AIME Design System (`aime.css`, white `#fbfbfd`) | ✅ | the final white |
| Landing crossing (`EssaiTraversee`) | ↔ same principle (optional, can be skipped), not reused: the film is linear | — |
| ATLAS grid | ⚠ not accessible here (separate local project) | generic grid; POINTZERO's `fragmentGrid` (fragments with span 1–4) is the future anchor point |
| Disque Terminal | ⛔ untouched | — |

## G. Accessibility and performance

- **Optional:** "Passer" is always visible, Esc skips, and nothing starts on its own.
- **Sound** only on a deliberate choice ("Regarder avec le son"), and it can be switched off at any time.
- **Silent version**: the image clock is used; the excerpt is never loaded.
- **Reduced motion**: **six still images** rendered by the same engine, each with a text alternative, browsed by the person.
- **Text version** (the 6 tableaux), and **WebGL fallback** to text.
- **Description** on screen (the current tableau, announced politely).
- **Mobile:** lighter rendering (0.6 scale, 4 noise octaves, DPR ≤ 1.5), wrapping buttons, no horizontal scrolling.
- **Lazy loading:** a 12.5 kB gzip chunk, loaded only on `/one/lumiere`. The audio loads only on the gesture.
- **Never blocks** the Première rencontre: `/one/premiere-rencontre` is unchanged, and "Passer" mounts it directly.

No accessibility conformity is claimed: there has been no manual VoiceOver/NVDA test.

## H. Security of the project

- The 22 WAV files stay on `album-original-2026`, untouched (hash checked).
- The excerpt **is in neither the repository nor the bundle**: `.gitignore` excludes `*.wav` and `public/lumiere-prive/`. It is copied only into a local build, or chosen by the person on their device (the excerpt or the full WAV, which is then read from 03:04.25).
- Dedicated branch `lumiere-film`; Disque Terminal untouched; production untouched; nothing published.
- The MP4 animatic contains the excerpt: it is a **private** working file, not to be published until rights are validated and Matt agrees.

## I. Tests (30/10/2026)

- **Unit** (`onde.contrat.test.ts`): 18/18. They cover Ripple geometry, fronts, damping, `versAnneaux`, the "decorative wave never transmits" rule even with a forced cast, an invalid timestamp, the score on the grid, the gap freeze, and fades and the final Point. Full suite: **480/480**.
- **E2E** (`tests/e2e/lumiere.py`): **28/28**. They cover:
  - welcome with nothing loaded;
  - silent playback (the excerpt is never requested);
  - description, Space and Esc;
  - sound loaded only on the gesture, with no outside requests;
  - the Point's flight and the real interactive Première rencontre;
  - reduced motion (six still images with text alternatives);
  - text version;
  - mobile 390×844;
  - no WebGL leads to the text version;
  - no audio file in the branch or the bundle.

## J. For Matt to decide

1. Listen to the contact at 03:18.255 (control mode, frame 336). Keep it, or shift it by ±1–2 frames?
2. The visual direction of I–III: keep it procedural (lighter, consistent) or move to pre-rendered 3D video?
3. The grid in VI: hook it up to ATLAS when that project is reachable (fragments spanning 1–4).
4. Rights to the excerpt before any publication.
