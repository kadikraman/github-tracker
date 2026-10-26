# GitHub Tracker

A personal macOS menu-style dashboard for the GitHub things you need to action, built with [Legend Spark](https://legend.so/spark/) on [Expo](https://expo.dev) + [react-native-macos](https://github.com/microsoft/react-native-macos).

<img width="1178" height="798" alt="Screenshot 2026-07-23 at 13 42 01" src="https://github.com/user-attachments/assets/389e6062-ab7f-4b60-a046-f132691840e8" />

It shows four auto-updating sections, each backed by a GitHub search query:

| Section | Query |
| --- | --- |
| **Review requested** | open PRs where your review is requested (including team requests) |
| **My open PRs** | open PRs you authored |
| **Mentioned** | open PRs/issues that mention you (excluding your own) |
| **Issues on my repos** | open issues on repositories you own |

Every row opens the PR/issue in your browser. Summary cards at the top show live counts and jump to their section. Rows can be **hidden** (eye icon) when you've decided they need no action — hidden items collapse into a per-section "n hidden" list and can be unhidden any time; the hidden state survives restarts.

Data refreshes automatically: every 60 seconds, plus immediately whenever the app regains focus (so actioned items disappear as soon as you cmd-tab back), plus a manual refresh button. Four search queries per minute sits well below GitHub's 30/min authenticated search limit.

The theme toggle in the toolbar offers **light / dark / follow-system**, and the choice also drives the native window chrome.

## Getting started

Prerequisites: [bun](https://bun.sh), Node 24.19 or later, Xcode (with the macOS SDK), CocoaPods, macOS 14+ on Apple Silicon.

```sh
bun install
npx --no-install spark build --dev   # once, and after native config changes
bun run macos                        # Spark dev session: Metro + the dev build
```

On first launch the app asks for a **GitHub Personal Access Token**:

1. Create a **classic** token at github.com → Settings → Developer settings → Tokens (classic) with the `repo` scope.
2. If you need results from SSO-protected organizations, open the token's **Configure SSO** menu and authorize it for each org — otherwise those items silently won't appear in search results.
3. Paste it into the app's Settings screen and hit Save (the app validates it against `GET /user` before storing).

To try a standalone release build locally: `bun run build`, then `npx --no-install spark open`. `bun run package` signs it with your Developer ID, notarizes it and writes the archive to `dist/`; the first run asks for the signing certificate and a notarytool profile.

## Token storage & security

- The token is stored in the **macOS Keychain** through Spark's secure storage (`@legendapp/spark/secure-storage`). It is never written to disk in plaintext.
- Version 2.0 moved to Spark, so a token saved by 1.x is not read: enter it once again. Only non-secrets (theme choice, hidden item IDs) live in `settings.json`, in `~/Library/Application Support/dev.kadi.github-tracker`.
- The app is read-only in practice (only `GET` requests to `api.github.com` over HTTPS), but a classic `repo`-scope token itself grants write access — treat it accordingly, and revoke it in GitHub settings if you ever suspect exposure.

## Project layout

```
App.tsx                     Providers (query client, theme, token, hidden) + screen switcher
index.ts                    Entry point: registers the main and popover roots, starts the menu bar item
desktop.config.json         Spark app config: identity, window, entitlements, updates feed
spark-packages/             Spark's vendored release packages (committed)
src/
  api/
    github.ts               GitHub REST client: search queries per section, error types, token validation
    types.ts                Shared API types (TrackedItem, search response)
  components/
    TrackerSection.tsx      One section: header, card of rows, empty/error states, hidden-items area
    ItemRow.tsx             A single PR/issue row + the hidden-row variant
    icons.tsx               Hand-drawn View/Text-based icons (no SVG dependency)
  hooks/
    useTrackedItems.ts      react-query wrapper: polling, focus refetch, caching per section
    useToken.tsx            Token context, backed by Spark secure storage
    useHidden.tsx           Hidden-items context, persisted to settings.json
    useTheme.tsx            Light/dark/system theme context; syncs native window appearance
  lib/
    menuBar.ts              Menu bar item and popover window
    updateStatus.ts         Sparkle update status via @legendapp/spark/updates
  screens/
    TrackerScreen.tsx       Toolbar, summary cards, scrollable section list
    SettingsScreen.tsx      Token entry/validation, updates
    MenuBarApp.tsx          Popover content
  storage/
    dataDirectory.ts        ~/Library/Application Support/dev.kadi.github-tracker
    settings.ts             settings.json read/write (non-secrets only)
    itemsCache.ts           Per-section item cache for fast cold starts
    tokenStore.ts           Secure-storage token load/save
```
