# Wrystr

A cross-platform desktop Nostr client built with Tauri 2.0 + React + TypeScript. Aimed at being the best Nostr desktop experience — polished UI, deep Lightning integration, and first-class support for long-form writing.

> Named as a nod to Nostr with a wry twist.

## Status

Early development. Core features working. Not yet ready for general release.

## Features

- **Onboarding** — key generation built-in, plain-language explanation, nsec backup flow; no browser extension required
- **Global & following feed** — live notes from relays, tab-switched to your network
- **Compose & post** — write and publish notes (kind 1), Ctrl+Enter to send
- **Replies** — inline reply composer on every note, full thread view
- **Reactions** — like notes (NIP-25) with live network counts
- **Follow / Unfollow** — follow and unfollow from any profile (NIP-02), updates contact list on-chain
- **Thread view** — click any note to see it with all its replies
- **Profile view** — click any name or avatar; edit your own profile (kind 0)
- **Long-form article editor** — write and publish markdown articles (NIP-23) with title, summary, tags, cover image, live preview, and auto-save drafts
- **Zaps** — send Lightning payments via NWC (NIP-47 + NIP-57); amount presets, custom amounts, optional comment
- **Search** — NIP-50 full-text search, `#hashtag` topic search, people search with inline follow
- **Settings** — relay add/remove (live, persisted), NWC wallet connection, npub copy
- **Login** — nsec (full access) or npub (read-only)

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2.0 (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| Nostr protocol | NDK 3.x (Nostr Dev Kit) |
| Styling | Tailwind CSS 4 |
| State | Zustand |

## Development

```bash
# Prerequisites: Node.js 20+, Rust stable, @tauri-apps/cli
npm install
npm run tauri dev       # full app with hot reload
npm run dev             # browser only (no Tauri window)
npm run tauri build     # production binary
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the full prioritised next steps.

Near-term:
- [ ] OS keychain for secure key storage (Rust backend)
- [ ] SQLite local note cache
- [ ] Direct messages (NIP-17/44)
- [ ] Read long-form articles in-app
- [ ] GitHub Releases + Tauri auto-updater

## License

MIT
