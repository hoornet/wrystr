# Wrystr — Next Steps Roadmap

---

## Vision note: more than a Nostr client

Wrystr is not just a great desktop Nostr client. **Long-form content is a first-class,
distinguishing feature of this project** — not an afterthought, not a checkbox NIP.

The article editor (NIP-23), the reading experience, the writing tools around it — these
set Wrystr apart from other clients and define its identity. Think of it as a publishing
platform that happens to live on Nostr, not a social feed that happens to support articles.

> **TODO — brainstorm needed:** What does "owning long-form on Nostr desktop" actually
> look like? Reading experience, discovery, editor features, monetization via zaps,
> cross-posting, author identity — all of this needs a dedicated design session.
> Leave this as an open thread until we sit down to work through it properly.

---

## Up next

### 1. OS Keychain via Rust (Tauri backend)
- Security-critical: private keys currently live in NDK signer memory only
- nsec sessions don't survive app restart — keychain fixes this permanently
- Tauri has keychain plugins ready (`tauri-plugin-keychain`)

### 2. SQLite note caching
- Notes disappear on every restart — no local persistence
- Would make the app feel dramatically more solid and fast
- Rust backend is the right place for this

### 3. About / Funding page
- Hardcoded in-app page with all support options
- Bitcoin on-chain address with scannable QR code
- Lightning address with scannable QR code
- Zap button (zap the developer's npub directly from within the app)
- Links: GitHub (hoornet), Ko-fi/Jure, and any other funding sources
- Lives in the sidebar footer or as a dedicated view — tasteful, never nagging
- Ties into the zap infrastructure already built

### 4. Mute / ignore user + anti-spam
- "Ignore this user" from profile or note context menu (NIP-51 mute list)
- Mute list persisted to Nostr so it follows you across clients
- Settings toggles for basic spam filters (e.g. hide notes from accounts < N days old,
  hide notes with no followers, hide pure bot patterns)
- Consider: Web of Trust (WOT) score as an optional feed filter — needs design session

### 5. Quote / Repost (NIP-18)
- "Quote" wraps a note in your own post with added commentary
- "Repost" is a plain re-broadcast (kind 6)
- Both are standard and expected by Nostr users
- Quote is more valuable — it drives conversation

### 6. Sidebar: collapsible to icon-only + auto-hide
- Toggle already exists (clicking WRYSTR collapses to w-12 icons), but it's not obvious
- Make the toggle affordance clearer — a visible ‹ / › button
- Auto-hide mode: sidebar expands on hover/click, collapses automatically after N seconds
  of activity in the main pane
- Most important: the icon-only state should be the default or easily reachable

### 7. Profile helpers for newcomers
- **NIP-05**: link to a guide or offer a basic self-hosted verification path
- **Avatar / banner image upload**: instead of pasting a URL, let users upload directly
  (NIP-96 file storage or a simple Blossom upload via Tauri)
- Newcomers fill in a URL field and have no idea what to put — this is a friction point

### 8. Search: improve full-text + people
- NIP-50 full-text (`bitcoin` query) returns zero results on most relays — the UI
  should detect this and suggest using `#hashtag` instead, or show which relays support it
- People search only works on NIP-50-capable relays; most don't support it
- Consider: local people search by scanning follows-of-follows graph

### 9. Direct Messages (NIP-44 / NIP-17)
- Significant complexity (encryption, key handling, inbox model)
- Major feature gap but non-trivial to implement well
- NIP-17 (private DMs) is the modern standard; NIP-44 is the encryption layer

---

## TODO — brainstorm sessions needed

### UI / look & feel
- After Windows playtest: full design review of native feel, spacing, typography
- The current UI is functional but has "amateur web app" feel on some surfaces
- Target bar remains Telegram Desktop — fast, keyboard-navigable, feels native not webby
- Specific surfaces to revisit: note cards, thread view, profile header, modals

### Web of Trust (WOT)
- Nostr has a concept of social graph distance for trust scoring
- Could power: feed ranking, spam filtering, people search, follow suggestions
- Worth exploring but needs a dedicated design session — not a simple feature add

### Long-form reading experience
- We write articles but there's no reader view
- Discovery, recommendations, reading history, estimated read time
- This is a major differentiator — needs its own design session

---

## What's already done

- **Onboarding**: key generation, nsec backup, plain-language UX, no extension required
- **Global + following feed**, compose, reply, thread view
- **Reactions** (NIP-25) with live network counts
- **Follow / Unfollow** (NIP-02), contact list publishing
- **Profile view + edit** (kind 0) — bug fix: own profile now updates immediately after save
- **Long-form article editor** (NIP-23) with draft auto-save
- **Zaps**: NWC wallet connect (NIP-47) + NIP-57 via NDKZapper, amount presets, comment
- **Search**: NIP-50 full-text, hashtag (#t filter), people with inline follow
- **Settings**: relay add/remove (live + persisted), NWC wallet setup, npub copy
- **Sidebar**: collapsible to icon-only (click WRYSTR to toggle)
- **Read-only mode**: npub login hides all write actions correctly
- Note rendering (images, video, mentions, hashtags)
- Relay connection status view
- NDK 3.x wrapper for all Nostr interactions
- GitHub Actions release: Linux AppImage, Windows exe/msi, macOS ARM dmg
