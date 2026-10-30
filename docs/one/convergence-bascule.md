# Convergence — one address, then the switchover to lemondeaime.com

*Branch `convergence` (private repo `pointzero-rosaces-prive`), 30/10/2026.*

## 1. The address

**https://preview.lemondeaime.com**

- It is protected by **Vercel Authentication**: you sign in with Matt's Vercel account, on Mac and on phone.
- It always follows the latest version of the `convergence` branch.
- It is **separate** from production: a different Vercel project (`pointzero-rosaces-prive`), separate data, no production base.

The journey:

- `/` → **LUMIERE film** (optional; *Passer* button; sound only on a deliberate choice);
- then the **real Première rencontre**;
- then **.0NE**: the universe mosaic and the universal Disque;
- then each universe.

`/explorer` (or `/studio/explorer`): **Explore the prototypes**, with direct access to everything and an honest status on each entry.

A **permanent navigation** sits bottom right on every page: .0NE, Explorer, the film, comfort settings, back.

- It moves to the left if the person has put their Point on the right.
- If an experience fails, a safety net offers **"Revenir à .0NE"** instead of a blank screen.

## 2. How it was assembled (no blind merge)

- Every private application branch is already an **ancestor** of `lumiere-film`: bureau-contenus, cartes-vivantes, design-aime, disque-indicateurs, edition-landing, one-universel, one-terminal, point, radial-universel, rosaces, tambour-vivant. **No merge was needed, nothing is lost.**
- `lumiere-film` contains all of public production (`origin/main` 2243b1a): 0 commits missing.
- `album-original-2026` (the WAV masters) is **deliberately left out**.
- RIPPLECIRCLE, OpenAIME and ATLAS are **separate** Vercel projects:
  - they are linked as such, labelled "Separate project", and open in a new tab;
  - RIPPLECIRCLE's generic geometry is already integrated (the wave contract);
  - its full engine is not, because it is tied to the wedding demo.

## 3. Statuses (Explorer)

| Status | Meaning | Examples |
|---|---|---|
| Public | already online for everyone on lemondeaime.com | Broderie workshop (POINT ZÉRO), the AIME site pages (Réseau, BurO…) |
| Tested · not public | built, covered by automated tests, visible only here | film, Première rencontre, .0NE, Disque Terminal, relational Orbe, Tambour, Carte vivante, Galerie |
| Prototype | experimental | crossing, AIME base layer, Image block, editorial Bureau, RIPPLE demo (the film's geometry) |
| Separate project | another deployment, not integrated | RIPPLECIRCLE, OpenAIME |
| Not connected | role described, engine not connected | ATLAS |

## 4. Checks done before deployment

- **Environment variables** (preview project):
  - no production base;
  - `DATABASE_URL` / auth secrets exist **only** for the `bureau-contenus` branch (a Neon test branch);
  - on `convergence`, accounts and sign-in are **disabled server-side**: `pret()` returns false without a base, so no email is sent;
  - variables added, limited to `convergence`: `VITE_POINTZERO_NAV0=1` (the .0 navigation) and `VITE_CONVERGENCE_VERSION`. No secrets.
- **Private routes**: the editorial Bureau checks admin rights server-side; with no base it reports itself unavailable.
- **Audio**: no audio file in the repository or in the build (checked). The film plays silently online. The excerpt can be chosen on the device; nothing is sent.
- **Personal data**: no personal address or secret in the code (scan). The root archive `AIME PROJETS.zip` is outside the published folder, so it is never served.
- **Access**: Vercel Authentication on every address of the preview project, `preview.lemondeaime.com` included (checked: 302 to Vercel sign-in).
- **Production**: untouched (`lemondeaime` project, deployment `dpl_HD4Zer1kWNfkdNVRX8ZwafDEY3Um`, commit 2243b1a).

## 5. Tests

- **Journey** (`tests/e2e/convergence.py`), run on the build identical to the deployed one (same commit, same variables, same `vercel.json` rules): **46/46**. It covers:
  - root → film;
  - *Passer* → Première rencontre → .0NE;
  - the navigation (and Escape);
  - **each internal Explorer entry opens without error and keeps the back navigation** (16 entries);
  - unknown address;
  - phone (no horizontal scroll, 44 px targets).
- **Unit**: 480/480. **Server**: 62/62 (the "the home page is the studio" rule is updated: the candidate's home page is the film).
- **Online limit**: my Vercel connection cannot open the protected pages (sharing refused for this project). Online I have only checked that the address answers and is protected. **The first visual check online is Matt's.**

## 6. Switchover to lemondeaime.com: proposal (not done)

**Recommended path**: same Vercel production project (`lemondeaime`), new code. That way the domain, DNS and production variables stay as they are.

1. Matt reviews the journey at `preview.lemondeaime.com`.
2. Decide what goes into the **public** repository LEMONDEAIME. Today `convergence` contains:
   - the internal docs `docs/one/*`, which should not be published;
   - the essays and prototypes, to keep or to hide behind Explorer.
3. **Production base**: 3 additive migrations, each with its `.retour.sql`: `contenus`, `preferences`, `galerie`. They are applied first to a **Neon branch copied from production**, then to production, **with Matt's explicit agreement**.
4. Production variables: choose whether `VITE_POINTZERO_NAV0=1` (the .0 navigation) becomes the public default.
5. PR `convergence` → `main` on LEMONDEAIME (a review, no automatic merge), then production deploy.
6. Check online: the same test, `BASE=https://www.lemondeaime.com python3 tests/e2e/convergence.py`.

**Rollback** (under a minute):

- **Vercel Instant Rollback** to `dpl_HD4Zer1kWNfkdNVRX8ZwafDEY3Um`, the current production, marked *rollback candidate*. The domain points back to the previous version immediately, with no rebuild.
- Then `git revert` the PR on `main`, so that the next deploy does not bring the candidate back.
- If migrations were applied: the `.retour.sql` scripts, in reverse order. The migrations are additive, so the old version works even without them.

**Nothing is switched without Matt's last go-ahead.**

## 7. What is still experimental or missing (not blocking)

- **Editorial Bureau and Galerie**: they need a server and a base, so on this preview they report themselves unavailable or empty. A Neon test branch can be connected to `convergence` if needed.
- **RIPPLE**: the full causal engine is not integrated (geometry demo plus a separate project).
- **ATLAS**: not connected.
- **Online film**: silent (the excerpt is never published). Sound only by choosing the file on your device.
