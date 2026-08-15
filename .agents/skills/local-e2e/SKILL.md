---
name: Local E2E testing for rss-sec-check
description: How to run the rss-sec-check web app against the Firebase Emulator Suite for authenticated end-to-end testing.
---

# Local E2E testing for rss-sec-check

Use this guide when you need to run the React+Vite SPA end-to-end against a local Firebase Emulator instead of a real Firebase project.

## Devin Secrets Needed

None for local emulator testing. All values can be dummy strings. Only `OWNER_EMAIL` / `VITE_OWNER_EMAIL` must match the test account.

## Environment setup

- Node 22 is required. Use nvm if the system default is older:
  ```bash
  export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 22
  ```
- Install workspace dependencies from the repo root:
  ```bash
  npm install
  ```
- Create a `.env` at the repo root with dummy Firebase values:
  ```
  VITE_FIREBASE_API_KEY=dummy-api-key
  VITE_FIREBASE_AUTH_DOMAIN=localhost
  VITE_FIREBASE_PROJECT_ID=rss-sec-check
  VITE_FIREBASE_STORAGE_BUCKET=
  VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
  VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
  VITE_OWNER_EMAIL=owner@example.com
  OWNER_EMAIL=owner@example.com
  FETCH_SCHEDULE_INTERVAL=30
  ```

## Start services

1. Start the Firebase emulators:
   ```bash
   npx firebase emulators:start --only auth,firestore --project rss-sec-check
   ```
   - Auth runs on `0.0.0.0:9099`
   - Firestore runs on `0.0.0.0:8080`
2. Start the web dev server:
   ```bash
   npm --prefix web run dev
   ```
   - App is reachable at `http://localhost:5173`

## Known workarounds

- The stock `firestore.rules` uses `get()` inside `isOwner()` which is called by `list` rules. Firestore does not support `get()` in collection-list rules, so `onSnapshot` queries fail with `permission-denied`. For local E2E testing, replace `firestore.rules` with a temporary version that hardcodes `owner@example.com` in `isOwner()`. Back up the original first and restore it before finishing.
- Seeded feeds and articles may not appear until `FIRESTORE_EMULATOR_HOST=localhost:8080` and `VITE_FIREBASE_PROJECT_ID=rss-sec-check` are set in the environment of the seeding script.

## Test data

- Use `npm --prefix scripts run seed` or a one-off `npx tsx scripts/seedFeeds.ts` plus a `scripts/seedArticles.ts` script to populate the emulator.
- The expected owner account is `owner@example.com`. Click the **Google サインイン** button on the login page; the app uses the auth emulator's mock credential path.

## UI automation notes

- The display is 1600×1200 but Devin tools use a 1024×768 scaled coordinate space. Add the browser chrome offset (≈87 px) and scale viewport coordinates by `1024/1600` (x) and `768/1200` (y). For reliable clicks, prefer reading `getBoundingClientRect()` and converting.
- The native `<select>` for source filtering can be driven with focus + `Return`, then arrow keys + `Return`.
- The clear-filters button (絞り込みを解除) is the most reliable way to reset both source and search filters.

## Verification helpers

- Use `npx tsx scripts/listAll.ts` (or a similar admin script) with `FIRESTORE_EMULATOR_HOST=localhost:8080` and `VITE_FIREBASE_PROJECT_ID=rss-sec-check` to inspect Firestore state after toggles.
- After the full flow, open DevTools Console and confirm no `TypeError` or `console.error` from `useArticles`, `useFeeds`, `useArticleActions`, `useFeedActions`, `toArticle`, `toFeed`, or `filterArticles`.

## Cleanup

- Restore the original `firestore.rules` from the backup.
- Remove any temporary `scripts/seedArticles.ts` or inspection scripts.
- Run `npm --prefix web run test` to confirm the Vitest unit tests still pass.
