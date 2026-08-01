# GitHub Tracker

A personal macOS menu-style dashboard for the GitHub things you need to action, built with [Expo](https://expo.dev) + [react-native-macos](https://github.com/microsoft/react-native-macos) via the expo-desktop toolchain.

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

Prerequisites: [bun](https://bun.sh), Xcode (with macOS SDK), CocoaPods.

```sh
bun install
cd macos && RCT_NEW_ARCH_ENABLED=1 pod install && cd ..
bun start          # Metro dev server
bun run macos      # build + launch the app
```

On first launch the app asks for a **GitHub Personal Access Token**:

1. Create a **classic** token at github.com → Settings → Developer settings → Tokens (classic) with the `repo` scope.
2. If you need results from SSO-protected organizations, open the token's **Configure SSO** menu and authorize it for each org — otherwise those items silently won't appear in search results.
3. Paste it into the app's Settings screen and hit Save (the app validates it against `GET /user` before storing).

Builds are signed with an Apple Development certificate (`DEVELOPMENT_TEAM` is set in the Xcode project). Signing into Xcode (Settings → Accounts) is necessary but not sufficient on a fresh machine: `bun run macos` invokes `xcodebuild` *without* `-allowProvisioningUpdates`, so it can't mint a certificate and fails with `No signing certificate "Mac Development" found`. Run one build with the flag to get the certificate into your keychain:

```sh
cd macos && xcodebuild -workspace GitHubTracker.xcworkspace -scheme GitHubTracker-macOS -configuration Debug -allowProvisioningUpdates build
```

After that, `bun run macos` works on its own.

### Fresh-clone troubleshooting

- `Unable to open base configuration reference file '.../Pods-GitHubTracker-macOS.debug.xcconfig'` — the `macos/Pods` directory is generated, not committed. Run `pod install` in `macos/`.
- `No signing certificate "Mac Development" found` — no development certificate in the keychain yet; see the `-allowProvisioningUpdates` command above. Verify with `security find-identity -v -p codesigning`.

## Token storage & security

- The token is stored in the **macOS Keychain** (a generic-password item, service `dev.kadi.github-tracker`), via a small local Expo native module — see `modules/keychain/`. It is never written to disk in plaintext.
- Earlier versions kept the token in a plain `settings.json`; on first launch after upgrading, the app migrates it into the Keychain and scrubs the file. Only non-secrets (theme choice, hidden item IDs) live in `settings.json` inside the app's sandboxed container.
- Because builds share a stable signing identity, the Keychain access prompt appears once — "Always Allow" persists across rebuilds.
- The app is read-only in practice (only `GET` requests to `api.github.com` over HTTPS), but a classic `repo`-scope token itself grants write access — treat it accordingly, and revoke it in GitHub settings if you ever suspect exposure.

## Project layout

```
App.tsx                     Providers (query client, theme, token, hidden) + screen switcher
index.ts                    Entry point (registerRootComponent)
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
    useToken.tsx            Token context, backed by the Keychain
    useHidden.tsx           Hidden-items context, persisted to settings.json
    useTheme.tsx            Light/dark/system theme context; syncs native window appearance
  screens/
    TrackerScreen.tsx       Toolbar, summary cards, scrollable section list
    SettingsScreen.tsx      Token entry/validation, help text
  storage/
    settings.ts             Sandboxed settings.json read/write (non-secrets only)
    tokenStore.ts           Keychain-backed token load/save + legacy migration
  lib/                      Small utilities (focus manager wiring, relative time)
  theme.ts                  Light/dark palettes and design tokens
modules/
  keychain/                 Local Expo native module (Swift) wrapping Security.framework
macos/                      Xcode project, Podfile, app icon asset catalog (Pods/ is generated by pod install)
assets/                     App icon source images
```

The visual design lives in a Claude Design project (`GitHub Tracker.dc.html` / `App Icon.dc.html`) and the UI follows it: system font, per-section accent colors, card-based layout with light and dark token sets.
