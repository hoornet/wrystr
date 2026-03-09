# Wrystr — Next Steps Roadmap

_Generated 2026-03-09 based on codebase analysis._

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

## Quick wins (high impact, low effort)

### 1. Settings View
- Currently 100% stubbed with placeholder text
- Add relay management: add/remove relay URLs
- Appearance toggles (theme, etc.)
- Key export/management UI

### 2. Follow/Unfollow from UI (NIP-02 — P1)
- Follow list is already fetched in the user store and used for the following feed
- Just needs a Follow/Unfollow button on ProfileView
- Data layer is already there — this is mostly UI work

### 3. Reaction counts from network
- Likes are currently tracked in localStorage only
- Reaction counts from the network are never fetched or displayed
- Would make notes feel much more alive socially

---

## Medium effort, high value

### 4. Zaps (NIP-57 + NIP-47 — P2)
- lud16 (Lightning address) is already shown on profile pages
- Needs: zap modal, amount picker, NWC wallet connection (NIP-47)
- Big UX differentiator vs other clients

### 5. Search (NIP-50 — P1)
- Not started at all
- Easiest entry point: hashtag search (hashtags are already highlighted in NoteContent)
- Then: full-text note search, user search

### 6. OS Keychain via Rust (Tauri backend)
- Security-critical: private keys currently only live in memory
- Rust backend (`src-tauri/src/lib.rs`) only has a placeholder `greet()` command
- Tauri has keychain plugins ready to use

---

## Longer term

### 7. Onboarding flow
- Nostr onboarding is notoriously bad across most clients; Wrystr should be the exception
- Key generation built-in (no "go get a browser extension first")
- Human-readable explanation of what a key is, without crypto jargon
- One-click backup flow (show nsec, prompt to save)
- New users should see interesting content immediately, not a blank feed
- Optional: custodial key service path for non-technical users, with a clear path to self-custody later

### 8. SQLite note caching
- Notes disappear on every refresh — no persistence
- Would make the app feel dramatically more solid and fast
- Rust backend is the right place for this

### 9. Direct Messages (NIP-44 — P3)
- Significant complexity (encryption, key handling)
- Major feature gap but non-trivial to implement well

---

### 10. Project funding & support UI

> **TODO — brainstorm needed:** Users should have an easy, visible way to support the
> project financially. This should feel native to the Nostr/Bitcoin ecosystem, not like
> a generic donate button.
>
> Options to design around:
> - **Bitcoin on-chain** — static address or xpub-derived address
> - **Lightning** — LNURL-pay / Lightning address (instant, low-fee)
> - **Zaps** — zap the developer's Nostr profile directly from within the app
> - **Recurring** — Lightning recurring payments (NIP-47 or similar)
>
> UI ideas: a small persistent icon (⚡ or ₿) in the sidebar footer, an About modal,
> or a dedicated Support page. Should be tasteful and opt-in, never nagging.
> Ties directly into the zap infrastructure we'll build for NIP-57 anyway.

---

## What's already done (for reference)

- Global + following feed
- Note rendering (images, video, mentions, hashtags)
- Compose + reply
- Reactions (like button + network counts)
- Follow / unfollow (NIP-02)
- Profile view + edit
- Thread view
- Article editor (NIP-23, with draft auto-save)
- Search: NIP-50 full-text, hashtag (#t filter), people
- Settings: relay add/remove (persisted), npub copy
- Login (nsec + read-only pubkey)
- Relay connection status view
- NDK wrapper for all Nostr interactions
