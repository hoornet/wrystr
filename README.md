# Wrystr

A cross-platform desktop Nostr client built with Tauri 2.0 + React + TypeScript. Aimed at being the best Nostr desktop experience — polished UI, deep Lightning integration, and first-class support for long-form writing.

> Named as a nod to Nostr with a wry twist.

## Status

Early development. Core features working. Not yet ready for general release.

## Features

- **Global & following feed** — live notes from relays, filtered to your network
- **Compose & post** — write and publish notes (kind 1)
- **Replies** — inline reply composer on every note, opens in thread view
- **Reactions** — like notes (NIP-25), persisted locally
- **Thread view** — click any note to see it with its replies
- **Profile view** — click any name or avatar to view their profile and notes
- **Editable own profile** — update your display name, bio, picture, NIP-05, Lightning address and more (kind 0)
- **Long-form article editor** — write and publish markdown articles (NIP-23) with title, summary, tags, cover image, live preview, and auto-save drafts
- **Login** — nsec (private key) or npub (read-only), with browser password manager support

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2.0 (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| Nostr protocol | NDK (Nostr Dev Kit) |
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

- [ ] Key generation + onboarding flow
- [ ] OS keychain for secure key storage
- [ ] SQLite local cache
- [ ] Zaps (NIP-57) + Lightning Wallet Connect (NIP-47)
- [ ] Follow/unfollow
- [ ] Search (NIP-50)
- [ ] Direct messages (NIP-17/44)
- [ ] Read long-form articles in-app
- [ ] Relay management UI

## License

MIT
