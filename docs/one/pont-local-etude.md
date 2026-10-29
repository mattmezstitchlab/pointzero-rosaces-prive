# AIME .0NE — Pont local: architecture study

*Study only. Nothing has been installed. No server, daemon or extension exists. No system command can be executed from a web page. 30/10/2026.*

Matt's decision: « Je valide l'étude de son architecture, mais pas encore l'installation ou l'exécution de commandes système. » Implementation will require a new explicit go-ahead **after** this study has been read.

## 1. Why a bridge

Today the Disque Terminal works in the browser:

- a folder chosen through File System Access, or the "Espace d'essai" (OPFS);
- local Git through isomorphic-git (init, status, add, commit, log, diff, branches);
- audio analysis through decodeAudioData.

What the browser **cannot** do, and what is refused today with an explanation (situation C):

- Envoyer / Récupérer (git push/pull to a remote, which needs network credentials);
- open a file in a Mac application;
- read a folder **without** the person choosing it again each time;
- long operations (heavy builds, audio conversions beyond what the browser can do).

## 2. Founding principle: a list of functions, never a shell

The bridge would be a small native program that the **person** installs and launches themselves. It would expose **named, typed functions**, each with its own validator. It would **not** have an endpoint like `exec(cmd)`. No character string coming from the page is ever passed to a shell.

| Function (example) | Parameters (validated) | Implementation |
|---|---|---|
| `git.push` | authorised folder, remote name chosen from the configured remotes, branch present locally | `git` library call with an argument array, `--force` impossible |
| `git.pull` | authorised folder, remote, branch | fast-forward only; conflict → stop and explain |
| `fichier.ouvrirAvec` | path inside an authorised folder, app chosen from a fixed list | macOS `open -a` with an argument array |
| `dossier.surveiller` | authorised folder | file system events, read-only |
| `audio.convertir` | source file and destination inside an authorised folder, format from a list | binary with fixed arguments, time limit |

Each function declares: risk (`lecture | ecriture | reseau | destructif`), whether it is reversible, and how its result is checked.

## 3. Permission model

1. **Pairing.** On first launch the bridge shows a 6-character code **in its own window**. The person types it into the Disque. The bridge then gives a **token** tied to the exact page origin.
2. **Origin.** Only allowed origins: the private essai on `localhost:<port>` and, later, a validated domain. Every request is checked for `Origin` + token. No `*`.
3. **Listening.** `127.0.0.1` only, never `0.0.0.0`. A random port, published in the pairing.
4. **Capabilities.** The person ticks capabilities in the bridge window ("Envoyer vers GitHub", "Ouvrir dans une app"…). Everything is off by default.
5. **Expiry.** The token expires (e.g. after 12 h of inactivity) and can be revoked with one click.

## 4. Folder limits

- A list of **authorised folders**, chosen in the bridge window (not by the page).
- Every path is canonicalised (`realpath`, symbolic links resolved). Anything outside the list is refused, as is any `..`.
- Excluded even inside an authorised folder: `~/.ssh`, `~/.aws`, `~/Library/Keychains`, `.env*` files, `.git/config` (read-only access through the library only).
- No access to the home folder as a whole.

## 5. Confirmations and irreversible operations

| Category | Confirmation |
|---|---|
| Reading | none (authorised folder) |
| Reversible writing | the Orbe's "J'ai besoin de votre accord" |
| Network (push/pull) | Orbe agreement **plus** a confirmation **in the bridge window** showing the exact remote, branch and number of commits |
| Irreversible (deleting outside the corbeille, overwriting) | **not offered** in v1. Deleting stays "move to the corbeille" |

A double confirmation (web page **and** native window) protects against a compromised page: a script alone cannot validate the native window.

## 6. Guarantees against arbitrary execution

- No shell, no `eval`, no `child_process.exec` with a string. Only `execFile`/`spawn` with a fixed binary and an argument array.
- Every parameter is validated by a schema (type, length, list of values). Unknown fields are refused.
- Remote names and branches are checked against the local repository, so they cannot inject options (`--upload-pack=…` is refused because it starts with `-`).
- Maximum duration per function, a single operation at a time per folder.
- The bridge has no update, plug-in or remote-code download mechanism.

## 7. Logging

- A local log (`~/Library/Logs/AIME/pont.log`), one line per call: date, function, folder, result, duration. **Never** file contents, tokens or credentials.
- The person can see it from the Disque ("Historique du pont") and in the bridge window.
- Retention: 30 days, or until the person clears it.

## 8. Deactivation

- Quitting the bridge = no access at all. The Disque returns to situation C (explained refusal).
- "Tout révoquer" button: tokens, origins and capabilities are reset.
- Uninstalling: a single application to delete, with no service launched at startup (unless the person opts in).

## 9. What the Orbe would say

- Bridge absent → « Le pont local n'existe pas encore : rien n'a été envoyé ni récupéré. » (current behaviour)
- Bridge present, capability off → « Je n'ai pas l'autorisation de faire cela ici. » + how to switch it on in the bridge.
- Push done → « vérifié » only after re-reading `git ls-remote` (the remote really contains the commit). Otherwise: « Je n'ai pas vérifié ce résultat. »

## 10. Open questions (before any implementation)

- Technology: a signed native binary (Swift) or a signed Node process (simpler, less integrated)? Apple signing and notarisation will be needed.
- Git credentials: macOS Keychain through the system `git` credential helper. The bridge never sees the password.
- Would a browser extension (native messaging) be preferable to a local HTTP port? It removes the open port but ties the bridge to a single browser.

**Nothing here has been coded.** Next step, if validated: a non-network prototype (`fichier.ouvrirAvec` alone, read-only) to test pairing and folder limits.
