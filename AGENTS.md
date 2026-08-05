# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# GitHub Tracker

A macOS-only desktop app (Expo SDK 54 + react-native-macos 0.81, via expo-desktop) that tracks your GitHub PRs, reviews, mentions, and issues. It has a main window and a menu bar popover.

## Commands

- `bun run macos` builds and runs the app (Debug, DerivedData).
- `npx tsc --noEmit` typechecks. There are no tests.
- No Expo Router. Navigation is a `useState` switch in `App.tsx` (Settings vs Tracker).

## Architecture: two React roots, one JS runtime

`index.ts` registers both roots:

- `main` -> `App.tsx` (main window)
- `GitHubTrackerMenuBar` -> `src/screens/MenuBarApp.tsx` (menu bar popover)

Both trees run in the same JS runtime and bridge. Consequences:

- Module-scope code runs exactly once, no matter how often either root mounts. The `queryClient` singleton (`src/lib/queryClient.ts`) is shared, so fetched data and invalidations serve both surfaces. Its module-scope query-cache subscriber persists items to disk and drives the offline flag.
- React contexts are NOT shared. Each root mounts its own ThemeProvider/TokenProvider/HiddenProvider; a change in one surface reaches the other only through module-level state or a remount.

## Native side (macos/GitHubTracker-macOS/)

- `AppDelegate.mm` owns the `NSStatusItem` and a borderless `NSPanel` popover (glass effect on macOS 26+, `NSVisualEffectView` fallback). The panel hosts a second RN surface created from the same `rootViewFactory`.
- JS -> native goes through `modules/menubar` (Swift, Expo Modules API), which posts `NSNotificationCenter` names `GHTOpenMainWindow` / `GHTClosePopover`; `AppDelegate` observes them.
- Gotcha: any programmatically created `NSWindow` held in a strong property needs `releasedWhenClosed = NO`, or closing it leaves a dangling pointer and the next use crashes in `objc_retain`. This bit us once with `self.window`; the panel sets it too.
- `modules/keychain` (Swift) stores the GitHub token (service `dev.kadi.github-tracker`). Local Expo modules live in `modules/*/ios/` and are used for macOS as well.
- Versioning: `Info.plist` uses `$(MARKETING_VERSION)` / `$(CURRENT_PROJECT_VERSION)`; defaults live in `project.pbxproj`, and the release workflow overrides both on the `xcodebuild` command line (`MARKETING_VERSION` from the tag, `CURRENT_PROJECT_VERSION` from `GITHUB_RUN_NUMBER`). Do not run `expo prebuild`: the expo-desktop `Version` config plugin would rewrite the plist entries back to literal strings from `app.json`.

## Data layer

- `src/api/github.ts`: fetch-based client, `GET /search/issues` with four queries (`SECTION_QUERIES`: review, mentioned, issues, authored) and `GET /user`. HTTP errors throw `GitHubApiError` (has `status`, `rateLimited`); raw connectivity failures surface as fetch `TypeError`.
- `src/hooks/useTrackedItems.ts`: React Query v5, `queryKey: ['items', key]`, 60s `refetchInterval`, 30s `staleTime`, `retry: 1`, seeded from the disk cache via `initialData`.
- `TrackedItem` (`src/api/types.ts`) is plain JSON; `pull_request == null` means the item is an issue.

## Persistence pattern

Small synchronous JSON files in `Paths.document` via the expo-file-system `File` API, read once at module load so cold starts render without async hydration flash:

- `src/storage/settings.ts` -> `settings.json` (theme, hidden items; token field is legacy/migrated).
- `src/storage/itemsCache.ts` -> `items-cache.json` (versioned per-section item cache).
- Token itself lives in the Keychain (`src/storage/tokenStore.ts`).

## Offline support

- No connectivity library. Offline state is derived from query outcomes in `src/lib/connectivity.ts` (`useIsOffline`): a network-type error sets it, any success clears it. `GitHubApiError` counts as online (the server was reached).
- react-query's `onlineManager` is left at its always-online default on purpose: the 60s poll keeps probing while offline, and the next success is what detects recovery. Do not wire it up.
- `OfflineBanner` (`src/components/OfflineBanner.tsx`) renders in both surfaces. Section error UI shows only when `query.data === undefined`; a failed background refetch keeps showing cached rows.
- Clearing or replacing the token clears the item cache file first, then `removeQueries`, in that order (remounting queries must not re-seed from the deleted file).

## UI conventions

- Theme via `useTheme()` + `Palette` in `src/theme.ts`; `alpha(hex, opacity)` for tints. No SVG dependency; icons are hand-built Views in `src/components/icons.tsx`.
- Main window and popover do not share row/section components (`TrackerSection`/`ItemRow` vs the compact ones inside `MenuBarApp.tsx`). Shared layers are hooks, api, storage, lib, and theme.
