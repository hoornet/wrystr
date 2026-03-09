# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Wrystr is a cross-platform Nostr desktop client built with Tauri 2.0 (Rust) + React + TypeScript. It connects to Nostr relays via NDK (Nostr Dev Kit) and aims for Telegram Desktop-quality UX. Long-form content (NIP-23) is a first-class, distinguishing feature — not an afterthought.

## Commands

```bash
npm run tauri dev       # Run full app with hot reload (recommended for development)
npm run dev             # Vite-only dev server (no Tauri window)
npm run build           # TypeScript compile + Vite build
npm run tauri build     # Production binary
```

Prerequisites: Node.js 20+, Rust stable, `@tauri-apps/cli`

## Architecture

**Frontend** (`src/`): React 19 + TypeScript + Vite + Tailwind CSS 4

- `src/App.tsx` — root component; shows `OnboardingFlow` for new users, then view routing via UI store
- `src/stores/` — Zustand stores per domain: `feed.ts`, `user.ts`, `ui.ts`, `lightning.ts`
- `src/lib/nostr/` — NDK wrapper (`client.ts` + `index.ts`); all Nostr calls go through here
- `src/lib/lightning/` — NWC client (`nwc.ts`); Lightning payment logic
- `src/hooks/` — `useProfile.ts`, `useReactionCount.ts`
- `src/components/feed/` — Feed, NoteCard, NoteContent, ComposeBox
- `src/components/profile/` — ProfileView (own + others, edit form)
- `src/components/thread/` — ThreadView
- `src/components/search/` — SearchView (NIP-50, hashtag, people)
- `src/components/article/` — ArticleEditor (NIP-23)
- `src/components/zap/` — ZapModal
- `src/components/onboarding/` — OnboardingFlow (welcome, create key, backup, login)
- `src/components/shared/` — RelaysView, SettingsView (relay mgmt + NWC + identity)
- `src/components/sidebar/` — Sidebar navigation

**Backend** (`src-tauri/`): Rust + Tauri 2.0

- `src-tauri/src/lib.rs` — Tauri app init and command registration
- Rust commands must return `Result<T, String>`
- Future: OS keychain for key storage, SQLite, lightning node integration

## Key Conventions (from AGENTS.md)

- Functional React components only — no class components
- Never use `any` — define types in `src/types/`
- Tailwind classes only — no inline styles, except unavoidable WebkitUserSelect
- Private keys must never be exposed to JS; use OS keychain via Rust (not yet implemented — nsec currently lives in NDK signer memory only)
- New Zustand stores per domain when adding features
- NDK interactions only through `src/lib/nostr/` wrapper
- Lightning/NWC only through `src/lib/lightning/` wrapper

## NIP Priority Reference

- **P1 (core):** NIP-01, 02, 03, 10, 11, 19, 21, 25, 27, 50
- **P2 (monetization):** NIP-47 (NWC/Lightning), NIP-57 (zaps), NIP-65 (relay lists)
- **P3 (advanced):** NIP-04/44 (DMs), NIP-23 (articles), NIP-96 (file storage)

## Current State

**Implemented:**
- Onboarding: key generation, nsec backup flow, login with nsec/npub
- Global + following feed, compose, reply, thread view
- Reactions (NIP-25) with live network counts
- Follow/unfollow (NIP-02), contact list publishing
- Profile view + edit (kind 0)
- Long-form article editor (NIP-23) with draft auto-save
- Zaps: NWC wallet connect (NIP-47) + NIP-57 via NDKZapper
- Search: NIP-50 full-text, hashtag (#t filter), people
- Settings: relay add/remove (persisted to localStorage), NWC URI, npub copy
- Relay connection status view

**Not yet implemented:**
- OS keychain integration (Rust) — nsec lives in NDK memory only
- SQLite local note cache
- Direct messages (NIP-44/17)
- Reading long-form articles (NIP-23 reader view)
- Zap counts on notes
- NIP-65 outbox model
- GitHub Releases + auto-updater
