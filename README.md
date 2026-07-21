# Loon Lakes

A mobile-first prototype for a Minnesota-themed logic placement game inspired by the one-per-row, one-per-column, one-per-region puzzle family.

## Rules

Place exactly one loon in every row, column, and colored region. Two loons may not touch horizontally, vertically, or diagonally.

## Run locally

Serve this folder with any static web server and open it on a phone or desktop browser. It works offline after the first load.

## Prototype scope

- Thirty-five unique, solver-verified puzzles across seven lake journeys
- Five difficulty tiers per lake: Easy, Breezy, Tricky, Oh Fer Tough, and North Star
- Lake of the Woods as the first weekly drop and the first 8×8 race board
- Sequential unlocking, anchored training ripples, and resumable unfinished boards
- Live timer, mistake logger, hint counter, par time, and one-to-five feather scoring
- Banked feather currency and a three-feather hint-token shop
- Point-the-way and reveal-and-lock hint choices
- Per-puzzle race cards and full-lake totals with native sharing and copy fallback
- Minnesota lake campaign trail with sourced lake lore
- Loon and “rule out” tools
- Guided tutorial, conflict feedback, hints, reset, saved progress, and sound preference
- Anonymous on-device playtest analytics, feedback checkpoints, issue reports, and JSON/CSV exports
- Private playtest dashboard measuring tutorial completion, first-puzzle conversion, solve time, hints, resets, and quit hotspots
- Responsive layout and installable web manifest

## Weekly lake release workflow

1. Add one sourced lake record to `BASE_LAKES` in `puzzles.js`, including a unique region map, solution, release date, and original silhouette.
2. Mark the current release with `weekly: true`; remove that flag from the prior release.
3. Add the fact source to `ATTRIBUTIONS.md`.
4. Run `npm test` and `npm run build`. Every generated orientation must have exactly one solution.
5. Publish the updated static files. Returning players keep their feather bank, hints, results, and unfinished boards.

The next product milestone is user testing of the race loop. Automated email or push announcements will need an opt-in subscriber service when the project moves beyond this static playtest. If the interaction performs well, package it with Capacitor for Android/iOS or port the validated design to Unity for publisher SDK compatibility.
