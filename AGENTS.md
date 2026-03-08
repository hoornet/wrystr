# AGENTS.md — Wrystr

This file guides AI coding agents (Claude Code, Copilot, etc.) working on this codebase.
Read it fully before making changes. Follow the conventions here strictly.

---

## What is Wrystr?

Wrystr is a cross-platform desktop Nostr client built for Mac, Windows, and Linux.
The goal is to be the best Nostr desktop experience — polished UI, deep Lightning
integration, full NIP coverage, and performance that feels native, not webby.

Named as a nod to Nostr with a wry twist. The `-str` suffix is intentional.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2.0 (Rust backend) |
| Frontend | React + TypeScript (Vite) |
| Nostr protocol | NDK (Nostr Dev Kit for JS) |
| Lightning | Nostr Wallet Connect (NIP-47) primary; LND/CLN gRPC optional |
| Styling | Tailwind CSS |
| State management | Zustand |
| Local storage | SQLite via Tauri plugin (tauri-plugin-sql) |
| Key storage | OS keychain via Tauri plugin (tauri-plugin-keychain) |

Rust is used for: key management, secure storage, native node connections, system tray,
OS notifications. TypeScript/React handles all UI and Nostr logic via NDK.

---

## Project Structure

```
wrystr/
├── src-tauri/          # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/   # Tauri commands exposed to frontend
│   │   ├── keys/       # Key management, signing
│   │   ├── lightning/  # LND/CLN direct node connections
│   │   └── storage/    # SQLite, keychain wrappers
│   └── Cargo.toml
├── src/                # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/     # Reusable UI components
│   │   ├── feed/
│   │   ├── notes/
│   │   ├── profile/
│   │   ├── lightning/
│   │   └── shared/
│   ├── views/          # Full page/screen views
│   ├── stores/         # Zustand state stores
│   ├── hooks/          # Custom React hooks
│   ├── lib/
│   │   ├── nostr/      # NDK setup, relay management, NIP helpers
│   │   └── lightning/  # NWC client, zap flows, LNURL
│   └── types/          # Shared TypeScript types
├── AGENTS.md
├── README.md
└── package.json
```

---

## Nostr Protocol Coverage

### Priority 1 — Core (must be solid before anything else)
- NIP-01 Basic protocol (events, subscriptions, relay communication)
- NIP-02 Follow lists
- NIP-03 OpenTimestamps (optional but nice)
- NIP-10 Reply threading
- NIP-11 Relay metadata (used for relay health display)
- NIP-19 bech32 encoding (npub, nsec, note, nprofile, nevent)
- NIP-21 `nostr:` URI scheme
- NIP-25 Reactions
- NIP-27 Text note references
- NIP-50 Full-text search

### Priority 2 — Lightning & Social
- NIP-47 Nostr Wallet Connect (primary Lightning integration)
- NIP-57 Lightning Zaps
- NIP-65 Relay list metadata (outbox model)

### Priority 3 — Rich features
- NIP-04 Legacy encrypted DMs (keep for compatibility)
- NIP-44 Encrypted payloads (new DM standard)
- NIP-17 Private Direct Messages
- NIP-23 Long-form content (articles)
- NIP-36 Sensitive content warnings
- NIP-51 Lists (mute lists, bookmarks, etc.)
- NIP-72 Moderated communities
- NIP-94 File metadata
- NIP-96 File storage (media uploads)
- NIP-98 HTTP Auth

---

## Lightning Integration

**Primary path: NWC (NIP-47)**
- Widest wallet compatibility (Alby, Mutiny-compatible, etc.)
- Handles: pay invoice, make invoice, get balance, list transactions
- UI: inline zap buttons that feel instant, not modal-heavy

**Secondary path: Direct node connection**
- LND via gRPC (Rust backend)
- Core Lightning via REST
- Handled entirely in `src-tauri/src/lightning/`
- Never expose node credentials to the frontend layer

**LNURL support**
- lnurl-pay, lnurl-auth, lightning address resolution
- Lightning address shown on profiles when available

**Zap flow UX goal:**
Zapping should feel as fast and frictionless as a like button.
No unnecessary confirmation dialogs for small amounts.
Custom amounts and messages available but not forced.

---

## Key Management

- **nsec** stored encrypted in OS keychain (never in localStorage or SQLite)
- Support multiple accounts
- NIP-07 browser extension passthrough for users who prefer that flow
- Hardware signer support (NIP-07-compatible) — future
- Key generation uses Rust (cryptographically secure)
- Signing can be delegated to Rust backend via Tauri commands to avoid
  exposing private keys to the JS layer

---

## UI / UX Principles

- Target quality bar: **Telegram Desktop**. Fast, keyboard-navigable, no loading spinners
  where possible, snappy transitions.
- Feels like a native app, not a web page in a frame.
- NOT a "crypto app" — no unnecessary blockchain/wallet jargon in the UI.
  Use plain language: "Send tip" not "Broadcast zap transaction".
- Dark mode by default. Light mode supported.
- Responsive within desktop constraints (min window ~900px wide).
- Keyboard shortcuts for all primary actions.

---

## Coding Conventions

### TypeScript / React
- Functional components only, no class components
- Hooks for all logic — no business logic directly in components
- Zustand stores per domain (feed, profile, relays, lightning, ui)
- Types defined in `src/types/` — never use `any`
- NDK interactions go through `src/lib/nostr/` — not called directly in components
- Use `async/await` over `.then()` chains
- Error boundaries around major UI sections

### Rust
- All Tauri commands in `src-tauri/src/commands/`
- Return `Result<T, String>` from Tauri commands for consistent error handling on the JS side
- Sensitive operations (key access, node credentials) must never log to console in production
- Use `serde` for all JSON serialization

### General
- No secrets, keys, or credentials ever committed to git
- `.env` for dev config, `.env.example` committed as template
- Prefer explicit over clever — this codebase should be readable by someone new

---

## Relay Management

- Connect to multiple relays simultaneously
- Display relay health (latency, NIP support from NIP-11)
- Outbox model (NIP-65): write to user's own relays, read from followed users' relays
- Default relay list for new users
- Relay list persisted locally and synced to Nostr (NIP-65 events)

---

## Development Setup

```bash
# Prerequisites: Node.js 20+, Rust stable, Tauri CLI
npm install
npm run tauri dev       # starts dev build with hot reload
npm run tauri build     # production build
```

---

## What to Avoid

- Do NOT add new dependencies without checking if something in the existing stack covers it
- Do NOT store private keys anywhere except the OS keychain via Tauri plugin
- Do NOT add paywalls or restrictions to core social/protocol features
- Do NOT expose Lightning node credentials to the frontend/JS layer
- Do NOT break the single-shot zap flow with unnecessary confirmation modals
- Do NOT use inline styles — use Tailwind classes

---

## Monetization Context

Wrystr will support monetization through:
- Built-in developer Lightning address (tip jar, visible in About)
- Optional paid relay tier (run separately)
- One-time purchase / sponsorship tier for power features

Keep core social features fully free and open. Monetization lives at the edges.
