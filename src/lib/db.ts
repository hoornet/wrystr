import { invoke } from "@tauri-apps/api/core";

/** Upsert a batch of raw Nostr event JSON strings into the SQLite note cache. */
export function dbSaveNotes(notes: string[]): void {
  if (notes.length === 0) return;
  invoke("db_save_notes", { notes }).catch(() => {});
}

/** Load up to `limit` recent kind-1 note JSONs from cache (newest first). */
export async function dbLoadFeed(limit = 200): Promise<string[]> {
  return invoke<string[]>("db_load_feed", { limit }).catch(() => []);
}

/** Cache a profile object (NDKUserProfile) for `pubkey`. Fire-and-forget. */
export function dbSaveProfile(pubkey: string, content: string): void {
  invoke("db_save_profile", { pubkey, content }).catch(() => {});
}

/** Load a cached profile JSON for `pubkey`. Returns null if not cached. */
export async function dbLoadProfile(pubkey: string): Promise<string | null> {
  return invoke<string | null>("db_load_profile", { pubkey }).catch(() => null);
}
