---
name: fill-8a0-lineup
description: "Local 8a0 project automation. Use when the user asks to run a local skill that opens the in-app Browser on this repository's game page and automatically fills all lineup positions with random valid players for quick manual testing."
---

# Fill 8a0 Lineup

Use this skill only inside the `8a0` repository. It automates the local `/play` page for quick testing by filling the current lineup through the visible UI.

## Workflow

1. Use the Browser plugin / in-app Browser, following its own `control-in-app-browser` skill first.
2. Use the existing in-app browser tab when it is already on `http://127.0.0.1:3000/play` or `http://localhost:3000/play`.
3. Otherwise navigate the in-app browser to `http://127.0.0.1:3000/play`.
4. Read `scripts/fill-lineup.js`.
5. Execute that script in the Node REPL with `{ tab }`; it uses read-only Playwright DOM inspection plus real in-app Browser coordinate clicks.
6. Report the returned status to the user.

## Expected Result

The script repeatedly:

- clicks the roll button;
- picks a random enabled player card;
- clicks a random compatible highlighted empty slot;
- rerolls when the drawn squad has no compatible player and rerolls are available;
- stops when the team sheet reaches `11/11` or when the UI cannot progress.

Do not start the campaign simulation. The user continues manually after the lineup is filled.

## Notes

- This skill is local to this repository because it lives under `.codex/skills`.
- Do not install it into `%USERPROFILE%\.codex\skills`.
- The automation intentionally uses UI clicks instead of mutating React state directly.
