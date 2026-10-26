# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# GitHub Tracker

A macOS-only desktop app on [Legend Spark](https://legend.so/spark/) (Spark 0.0.1 on Expo Desktop, Expo SDK 54, react-native-macos 0.81) that tracks your GitHub PRs, reviews, mentions, and issues. It has a main window and a menu bar popover.

## Commands

- `bun run macos` starts the Spark dev session (Expo CLI + Metro) and opens the custom dev build. Native config changes (`desktop.config.json`) need `npx --no-install spark build --dev` first.
- `bun run build` makes a standalone, ad-hoc signed release app; `npx --no-install spark open` launches it. `bun run package` signs, notarizes and writes `dist/` (see Releases).
- Requires Node 24.19+, Xcode and CocoaPods. `bun run doctor` checks pins and tooling; keep React, React Native and Expo on Spark's exact pins.
- `npx tsc --noEmit` typechecks. There are no tests.
- No Expo Router. Navigation is a `useState` switch in `App.tsx` (Settings vs Tracker).

## Architecture: two React roots, one JS runtime

`index.ts` registers both roots:

- `main` -> `App.tsx` (main window, created by Spark's host)
- `GitHubTrackerMenuBar` -> `src/screens/MenuBarApp.tsx` (menu bar popover, a Spark window opened by `src/lib/menuBar.ts`)

Both trees run in the same JS runtime and bridge. Consequences:

- Module-scope code runs exactly once, no matter how often either root mounts. The `queryClient` singleton (`src/lib/queryClient.ts`) is shared, so fetched data and invalidations serve both surfaces. Its module-scope query-cache subscriber persists items to disk and drives the offline flag.
- React contexts are NOT shared. Each root mounts its own ThemeProvider/TokenProvider/HiddenProvider; a change in one surface reaches the other only through module-level state or a remount.

## Native side (owned by Spark)

- There is no committed `macos/` folder. Spark generates the native project from `desktop.config.json` into `macos/` (gitignored, disposable) and owns the AppDelegate. Native settings go in `desktop.config.json`, never in generated files. Keep its `projectId`: it scopes secure storage, the update key account and Spark's single-instance lock.
- App icon: neither Spark nor Expo Desktop builds a macOS icon set from `expo.icon`. `plugins/withMacosAppIcon.js` (in `expo.plugins`) copies `assets/AppIcon.appiconset` over the generated one; edit the PNGs there.
- `src/lib/menuBar.ts` owns the tray item (`@legendapp/spark/tray`, SF Symbol `arrow.triangle.pull`) and the popover window. The popover is `kind: 'overlay'` with `titleBarStyle: 'hidden'`: overlay keeps it visible while another app is active, and a titled window can become key, so `focusChanged false` hides it on an outside click. A borderless window never becomes key; a `panelStyle` panel hides itself whenever the app is inactive. Evidence: vault plan 005 `prototype.md`.
- The tray API gives no status item frame. The popover centres on the cursor at click time.
- The popover native window survives a JS reload; `menuBar.ts` finds it with `listWindows()` instead of keeping a flag.
- The main window hides on close (`macos.lifecycle.mainWindow.closeBehavior: "hide"`), so **Open GitHub Tracker** in the popover can `showWindow('main')` again.
- Popover glass: `GlassView` from `@legendapp/spark/ui/glass` on macOS 26+, with the window `transparent` and `backgroundColor: '#00000000'`. Older systems get `appBg`.
- The app is not sandboxed (Spark's default). Entitlements live in `desktop.config.json` under `macos.entitlements`.

## Data layer

- `src/api/github.ts`: fetch-based client, `GET /search/issues` with four queries (`SECTION_QUERIES`: review, mentioned, issues, authored) and `GET /user`. HTTP errors throw `GitHubApiError` (has `status`, `rateLimited`); raw connectivity failures surface as fetch `TypeError`.
- `src/hooks/useTrackedItems.ts`: React Query v5, `queryKey: ['items', key]`, 60s `refetchInterval`, 30s `staleTime`, `retry: 1`, seeded from the disk cache via `initialData`.
- `TrackedItem` (`src/api/types.ts`) is plain JSON; `pull_request == null` means the item is an issue.

## Persistence pattern

Small synchronous JSON files via the expo-file-system `File` API, read once at module load so cold starts render without async hydration flash. They live in `~/Library/Application Support/dev.kadi.github-tracker` (`src/storage/dataDirectory.ts`): without the sandbox, `Paths.document` is the user's `~/Documents`, so never write there.

- `src/storage/settings.ts` -> `settings.json` (theme, hidden items).
- `src/storage/itemsCache.ts` -> `items-cache.json` (versioned per-section item cache).
- The token lives in `@legendapp/spark/secure-storage` (`src/storage/tokenStore.ts`). It is async: `useToken()` reports `loaded`, and roots render nothing until it is true, so Settings does not flash. The token is module-scope state that both roots subscribe to (`useSyncExternalStore`): the popover root stays mounted while hidden, so a token saved in the main window must reach it.

## Offline support

- No connectivity library. Offline state is derived from query outcomes in `src/lib/connectivity.ts` (`useIsOffline`): a network-type error sets it, any success clears it. `GitHubApiError` counts as online (the server was reached).
- react-query's `onlineManager` is left at its always-online default on purpose: the 60s poll keeps probing while offline, and the next success is what detects recovery. Do not wire it up.
- `OfflineBanner` (`src/components/OfflineBanner.tsx`) renders in both surfaces. Section error UI shows only when `query.data === undefined`; a failed background refetch keeps showing cached rows.
- Clearing or replacing the token clears the item cache file first, then `removeQueries`, in that order (remounting queries must not re-seed from the deleted file).

## Auto-updates and releases

- `@legendapp/spark/updates` (Sparkle 2.9.6, Sparkle's own windows). `src/lib/updateStatus.ts` turns on automatic checks at module load and keeps module-scope status for both roots; Settings shows the version and **Check for updates**. Dev builds report updates as unavailable.
- Feed and public key are `updates` in `desktop.config.json`. The private key is in the login Keychain under `spark.<projectId>` (made by `spark updates init`) and in the `SPARKLE_ED_PRIVATE_KEY` secret for CI. Export it with Sparkle's `generate_keys --account spark.<projectId> -x <file>`.
- `.github/workflows/release.yml` runs on a `v*` tag: sets `version` from the tag and `macos.buildNumber` from `GITHUB_RUN_NUMBER` (must keep increasing), imports the Developer ID cert and a notarytool profile into a temporary keychain, imports the Sparkle key, then loops `spark package` (exit 2 means notarization is pending) and uploads `dist/updates/*.zip` and `appcast.xml`.
- Installed apps read `releases/latest/download/appcast.xml`; the appcast points at the archive in the same release.

## UI conventions

- Theme via `useTheme()` + `Palette` in `src/theme.ts`; `alpha(hex, opacity)` for tints. No SVG dependency; icons are hand-built Views in `src/components/icons.tsx`.
- Main window and popover do not share row/section components (`TrackerSection`/`ItemRow` vs the compact ones inside `MenuBarApp.tsx`). Shared layers are hooks, api, storage, lib, and theme.

<!-- spark:skill:start -->
From the app root, read [Spark's app development skill](node_modules/@legendapp/spark/skills/spark/SKILL.md) before working on this app.
The installed Spark version owns these instructions; do not copy them here.
<!-- spark:skill:end -->
