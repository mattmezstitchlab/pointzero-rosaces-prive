# AIME .0NE — L'Orbe relationnelle

*Isolated proof on the Disque Terminal · private branch `one-terminal` · route `/one/terminal-orbe` (the classic Terminal stays at `/one/terminal`, unchanged). 30/10/2026.*

## 1. What it is

The Orbe is the centre of the Disque when it answers. It is not a character and it does not guess. It runs one cycle:

**Recevoir → Situer → (Demander) → Agir → Vérifier → Répondre**

- **Recevoir**: an intention (one colour **and** one word) or a command chosen in the crown.
- **Situer**: the Orbe says what it knows from the **authorised context**, and nothing more.
- **Demander**: if the request is ambiguous, it asks one question and offers choices. It does not act.
- **Agir**: the command goes through the Terminal engine that has already been validated. There is no second engine.
- **Vérifier**: the Orbe re-reads reality (folder, corbeille, Git log, index, metadata). This is the **only** source of "vérifié".
- **Répondre**: a light echo **and** a written echo. The proof is shown. "Pourquoi ce signal ?" says whether each step is data or illustration.

## 2. Presentation states

| State | When | What you see |
|---|---|---|
| Présence | at rest | calm nacre, nothing moves on its own |
| Réception | an intention has been received | an impulse reaches the Orbe |
| Contexte | it states what it knows | soft violet ring, one written sentence |
| Clarification | information is missing | orange ring + question + choices |
| Action | the engine is working | slow breathing; the Orbe **retreats** (shrinks) when the centre shows a file, a Git result or a waveform |
| Écho | the result | ring coloured by the **actual outcome**, never by an emotion |
| Preuve | after re-reading | "Preuve : …" written in green, only when verified |

A result that has been done but **not re-read** shows as "fait, non vérifié" (notification), never as "réussite".

A real event, such as new Git changes, appears **on a separate line**. It never covers the answer to the action the person just took. This was the fix for case B and test 6.

## 3. Relational points (second layer)

These sit on an orbit around the Orbe, distinct from the command points. Each one has an **identity** (a name, read out by screen readers) and a **state** from the existing indicators API: repos / guide / info / action / encours / reussite / erreur.

| Point | Lit when… |
|---|---|
| Opération | a command is running (pulse) or has ended (success/error) |
| Réponse | the echo is waiting for an agreement or has been verified |
| Événement | Git reports new changes |
| Projet | a working folder is open |

Shape varies as well as colour: the error point is a diamond and the action point has a double ring. **Colour is never the only signal.**

## 4. Intentions

| Intention | Colour | Deterministic behaviour |
|---|---|---|
| Explorer | blue | list, open, recent items |
| Comprendre | violet | audio → metadata/preview/duration; file → real diff; nothing selected → question "Que voulez-vous comprendre ?" |
| Créer | green | question "Créer quoi ?" (folder; a Git commit if there are changes) |
| Demander de l'aide | warm white | at most 3 useful commands in the current context |
| Signaler un problème | orange | free text, stored **locally** (`aime:terminal:signalements`), never sent |
| Plus simple | pink nacre | changes `guidage` in the single preference source ("Garder ce choix") |

## 5. Deterministic engine, no AI

`lib/orbe/relation.ts`, class `Orbe`, uses fixed rules: an intention table, permissions, then execution, then verification. The same inputs give the same answers. No network request is made (tests 9, unit and e2e).

The phrases it can say (`PHRASES`):

- « Je n'ai pas assez d'informations » — ambiguous request.
- « Je n'ai pas vérifié ce résultat » — done but not re-read.
- « J'ai besoin de votre accord » — destructive action (deleting goes to the corbeille, after agreement).
- « Cette action a échoué » — with the engine's actual message.
- « Je n’ai pas l’autorisation de faire cela ici » — no permission (e.g. Envoyer with no local bridge).

**No emotion inference.** No echo or point colour describes a mood. Colours come only from a real outcome (success / error / agreement / question / information).

## 6. Authorised context (privacy)

`ContexteAutorise` has a closed list of fields (`CHAMPS_CONTEXTE`):

- the universe;
- the last action;
- the selected element (type, name, extension, **`lu`: whether its content has really been read**);
- the repository (branch, number of changes);
- three preferences (guidage, presentation, reduced motion);
- the permissions (`dossier-de-travail:lire/ecrire`, `git:local`).

It **never** contains:

- first name, town, favourite universes or needs;
- the content of a file that has not been read;
- anything from another universe.

Test 10 checks this field by field.

## 7. Illustrative animation vs a signal based on real data

This is the core rule. Each step of an answer has a `signal`, either `{genre:"donnee", source}` or `{genre:"illustratif", raison}`. "Pourquoi ce signal ?" shows it as ● Donnée / ○ Illustratif.

| Visible signal | Type | Source |
|---|---|---|
| Impulse on Réception | **illustrative** | shows that the request has been received; it measures nothing |
| Violet Contexte ring | **illustrative** | marks the step; the sentence next to it is the data |
| Breathing during Action | **illustrative** | "the engine is running", with no fake progress percentage |
| Green echo + "Preuve : …" | **data** | re-read reality (folder present, corbeille not empty, last commit, index) |
| Red echo | **data** | the error returned by the engine |
| Orange echo (refusal / agreement) | **data** | the permission rule (`permis`) |
| "Événement" point + line | **data** | `git status` re-read: the number of changes went up |
| Waveform at the centre | **data** | `decodeAudioData` of the actual file |
| "N lignes lues dans le dépôt" | **data** | real `git diff` / `git log` output |
| Opération point pulsing | **data** | the engine's real state (`occupe`) |

Rule: **an illustrative animation never says "it worked."** Only a data signal can turn green. In reduced motion every illustrative animation is removed and the data signals stay, in writing.

## 8. Situations A–D (isolated prototype)

- **A — file selected.** The Orbe offers actions (Différences, Lister…) and states "contenu non lu". It **never** claims to know the content. `lu` becomes true only after a real read (diff or audio analysis).
- **B — Git changes.** Event point + impulse + "Un événement demande votre attention." on a separate line. "Voir les différences" shows the **real diff** at the centre (added or removed lines).
- **C — Envoyer.** No local bridge, so a refusal: "Le pont local n'existe pas encore : rien n'a été envoyé ni récupéré. Vos fichiers et votre dépôt restent tels quels." **Nothing is simulated.**
- **D — audio analysis finished.** Waveform at the centre, the Orbe retreats, and the echo shows the metadata re-read ("métadonnées lues : WAV PCM, 0:04, 48 kHz").

## 9. Test results (30/10/2026)

**Unit** (`orbe.relation.test.ts`, 9 tests, cases 1–10): all pass. Full suite: **462/462**.

**E2E** (`tests/e2e/orbe.py`): **25/25**, run twice in a row with no flakes.

| # | Case | Result |
|---|---|---|
| 1 | Simple request (Explorer) | ✓ proposes, executes nothing without a gesture |
| 2 | Ambiguous request (Comprendre, nothing selected) | ✓ question + choices + "pas assez d'informations" |
| 3 | Successful action | ✓ "vérifié" only after re-reading, proof displayed |
| 4 | Failed action | ✓ engine message, never green |
| 5 | Unauthorised action (Envoyer) | ✓ explained refusal, no Agir step |
| 6 | Awaiting confirmation (Supprimer) | ✓ "J'ai besoin de votre accord", then corbeille re-read; the Git event no longer covers the answer |
| 7 | Reduced motion | ✓ final state immediately, no animation, steps written out |
| 8 | List mode | ✓ intentions in a list (shared preference) |
| 9 | No AI | ✓ deterministic, no outside or API request (local `blob:` excepted) |
| 10 | No private disclosure | ✓ neither first name, town, favourites nor unread content |

Non-regression: Terminal e2e **26/26**.

Not tested yet (no claim made): manual VoiceOver/NVDA testing. **No accessibility conformity is claimed.**

## 10. Preferences: Première rencontre, no second profile

The Orbe reads `lireOne()`:

- presentation (list),
- reduced motion (shared Confort),
- `interaction.guidage` (`discret | standard | pas-a-pas`, new and optional, default `standard`).

"Plus simple → Garder ce choix" writes to that same source. There is no Orbe profile.

## 11. Film vs interface

They share a visual language: the nacre, the drop, the ripple, the white light.

The difference is deliberate:

- **In the film (LUMIERE)**, light is narrative and illustrative, and says so.
- **In the interface**, a light that changes state must be based on data. Otherwise it is marked "illustratif".

The same ripple that is a drop falling in act IV of the film means, in the Disque, "a real result has been re-read."

## 12. Future: the circle of people (not built)

Matt's Ripple mockup ("Mariage coordination", people/role points, causal propagation) is the right reference for a **second ring of people** around the Orbe, built on these same relational points. Conditions:

- **with consent only**: a person appears only if they have accepted it;
- point states = **facts** (invitation sent, reply received, task done, waiting), **never moods** and no colour for an emotion;
- propagation ("this delay affects…") is shown only if the dependency is **declared**, not inferred;
- data stays local until a server has actually confirmed synchronisation.

No new universe: it is a layer of the same Disque.

## 13. Files

- `studio/src/lib/orbe/relation.ts`: engine, intentions, phrases, signal types
- `studio/src/lib/terminal/relation.ts`: Terminal adapter (context, proposals, permissions, verification)
- `studio/src/components/one/OrbeRelation.tsx` + `.css`: Orbe, points, intentions, echo, separate event
- `studio/src/one/Terminal.tsx`: `relation` mode (opt-in through the route)
- Tests: `studio/src/__tests__/orbe.relation.test.ts`, `tests/e2e/orbe.py`
