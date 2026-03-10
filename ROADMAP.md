# Wrystr — Roadmap

---

## Vision: more than a Nostr client

Wrystr is not just a great desktop Nostr client. **Long-form content is a first-class,
distinguishing feature** — not an afterthought, not a checkbox NIP.

The article editor (NIP-23), the reading experience, the writing tools around it — these
set Wrystr apart from other clients and define its identity. Think of it as a publishing
platform that happens to live on Nostr, not a social feed that happens to support articles.

---

## Development process

Each phase is built, then thoroughly tested (especially on Windows) before the next begins.
Bugs found during testing are fixed before Phase N+1 starts. A release is cut between phases.

---

## Phase 1 — Complete the core experience
*Target: OpenSats application (April 1, 2026). Test on all platforms before Phase 2.*

### 1. Long-form article reader (NIP-23)
- We write articles but can't read them in-app — the single biggest gap given our positioning
- Click any `nostr:naddr1…` reference or article link → open in a clean reader view
- Render markdown, show title / author / published date / cover image
- Zap button on articles (zap the author)
- "Open in browser" fallback for unsupported content

### 2. Zap counts on notes
- Feed shows ♥ reaction counts but not ⚡ zap counts — a visible gap
- Fetch kind 9735 receipts per note, sum the amounts, show inline
- Existing zap infrastructure (NIP-47 + NIP-57) already built — display-layer only

### 3. Quoted note inline preview
- Quotes currently render `nostr:nevent1…` as plain linked text
- Should show an inline card: author avatar, name, truncated content — same as other clients
- Completes the NIP-18 quote/repost work already shipped

### 4. Auto-updater
- Users must manually download new releases — most will stay on old versions forever
- Tauri has a built-in updater plugin (`tauri-plugin-updater`)
- Needs a signed update manifest served from GitHub Releases
- Show an unobtrusive "update available" banner, not a blocking modal

---

## Phase 2 — Engagement & reach
*Test Phase 1 thoroughly first. Fix all reported issues before starting Phase 2.*

### 5. Notifications
- No way to see mentions, replies to own notes, or incoming DMs without manually checking
- Badge on the messages nav item for unread DMs
- Notifications view: mentions of your pubkey, replies to your notes, new DMs
- System notification (OS native) for DMs and mentions — Tauri has a notification plugin

### 6. NIP-65 outbox model (relay lists, kind 10002)
- Without NIP-65, we miss notes from people who publish to their own relay set
- On profile open: fetch their kind 10002 relay list, query those relays for their notes
- On publish: write to own relay list (configurable in settings)
- Dramatically improves note discovery and reach

### 7. Feed reply context
- In the feed, replies look identical to top-level posts — no visual distinction
- Show "↩ replying to @name" above the note content for kind-1 events with `e` tags
- Clicking the context navigates to the parent note thread

### 8. Keyboard shortcuts
- A writing-focused desktop app should be keyboard-navigable
- N — compose new note, R — reply to focused note, / — focus search
- J/K — navigate feed up/down, Escape — close modal/back
- Show shortcuts in a `?` help overlay

---

## Phase 3 — Polish & completeness
*Test Phase 2 thoroughly first. Fix all reported issues before starting Phase 3.*

### 9. NIP-17 DMs (gift wrap)
- Current DMs use NIP-04 (kind 4) — works but deprecated and leaks metadata
- NIP-17 wraps messages in gift wrap (kind 1059) for proper sender/recipient privacy
- Needs inbox relay support (kind 10050) and ephemeral key signing
- Not interoperable with NIP-04 — both should be supported during migration

### 10. Image lightbox
- Clicking an image in a note should open it full-size
- Click outside or Escape to close

### 11. Bookmark list (NIP-51, kind 10003)
- Standard feature expected by users — save notes for later
- Bookmark icon on NoteCard, synced to relays via NIP-51

### 12. Follow suggestions / discovery
- New users start with an empty Following feed and no guidance
- Suggest popular accounts and curated starter packs
- "People followed by people you follow" as a discovery surface

### 13. UI polish pass
- Full design review: note cards, thread view, profile header, modals
- Target bar: Telegram Desktop — fast, keyboard-navigable, feels native not webby
- Typography, spacing, colour contrast audit
- Needs a dedicated design session before implementation

---

## Brainstorm backlog (not yet scheduled)

### Web of Trust (WOT)
- Social graph distance for trust scoring
- Could power: feed ranking, spam filtering, people search, follow suggestions
- Needs dedicated design session

### Long-form features (NIP-23 depth)
- Discovery: browse articles from followed authors, trending articles
- Reading history, estimated read time, table of contents
- Editor improvements: image upload, word count, tag suggestions
- Cross-posting to other platforms

### NIP-46 remote signer
- Sign events via a remote signer (Nsecbunker, Amber, etc.)
- Would complete the multi-account story for users who don't want nsec in keychain

---

## What's already shipped

### v0.1.3
- **OS keychain** — nsec stored securely; sessions survive restarts
- **Multi-account switcher** — sidebar footer, instant switch, keychain-backed
- **SQLite note + profile cache** — feed loads from local cache on startup
- **Quote & Repost** (NIP-18) — one-click repost, compose modal for quotes
- **Mute users** (NIP-51) — mute list synced to relays, filtered from feed
- **NWC setup wizard** — guided wallet picker with per-wallet instructions + inline validation
- **System tray** — close hides to tray; Quit in tray menu exits
- **Zap history** — Received / Sent tabs with amounts, counterparts, comments
- **About / Support page** — in-app zap, Lightning + Bitcoin QR codes

### v0.1.4
- **Sidebar** — explicit ‹/› toggle, state persisted, collapsed mode completeness
- **Profile image upload** — uploads to nostr.build, auto-fills URL field
- **NIP-05 live verification** — real-time domain check with ✓/✗ status
- **Search improvements** — NIP-50 relay detection, hashtag fallback suggestion

### v0.1.x (unreleased — on main)
- **Direct Messages** (NIP-04) — conversation list, thread view, per-message decryption,
  new conversation by npub/hex, "✉ message" button on profiles

### Shipped earlier (v0.1.0 – v0.1.2)
- Onboarding (key generation, nsec backup, plain-language UX)
- Global + following feed, compose, inline replies, thread view
- Reactions (NIP-25) with live network counts
- Follow / unfollow (NIP-02), contact list publishing
- Profile view + edit (kind 0)
- Long-form article editor (NIP-23) with draft auto-save
- Zaps via NWC (NIP-47 + NIP-57), amount presets, comments
- Search: NIP-50 full-text, #hashtag, people with inline follow
- Relay management with live connection status
- Read-only (npub) login mode
- GitHub Actions release: Linux AppImage, Windows exe/msi, macOS ARM + Intel dmg
