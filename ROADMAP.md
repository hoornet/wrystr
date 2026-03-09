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

## Up next

### 1. OS Keychain via Rust (Tauri backend)
- Security-critical: private keys currently live in NDK signer memory only
- Rust backend (`src-tauri/src/lib.rs`) only has a placeholder `greet()` command
- Tauri has keychain plugins ready to use (`tauri-plugin-keychain`)

### 2. SQLite note caching
- Notes disappear on every refresh — no persistence
- Would make the app feel dramatically more solid and fast
- Rust backend is the right place for this

### 3. Direct Messages (NIP-44 — P3)
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

- **Onboarding**: key generation, nsec backup flow, plain-language UX, no extension required
- **Global + following feed**, compose, reply, thread view
- **Reactions** (NIP-25) with live network counts
- **Follow / Unfollow** (NIP-02), contact list publishing
- **Profile view + edit** (kind 0)
- **Long-form article editor** (NIP-23) with draft auto-save
- **Zaps**: NWC wallet connect (NIP-47) + NIP-57 via NDKZapper, amount presets, comment
- **Search**: NIP-50 full-text, hashtag (#t filter), people with inline follow
- **Settings**: relay add/remove (live + persisted), NWC wallet setup, npub copy
- Note rendering (images, video, mentions, hashtags)
- Relay connection status view
- NDK 3.x wrapper for all Nostr interactions
