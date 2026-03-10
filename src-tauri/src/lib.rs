use keyring::Entry;
use rusqlite::{params, Connection};
use std::sync::Mutex;
use tauri::Manager;

// ── OS keychain ─────────────────────────────────────────────────────────────

const KEYRING_SERVICE: &str = "wrystr";

/// Store an nsec in the OS keychain, keyed by pubkey (hex).
#[tauri::command]
fn store_nsec(pubkey: String, nsec: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &pubkey).map_err(|e| e.to_string())?;
    entry.set_password(&nsec).map_err(|e| e.to_string())
}

/// Load a stored nsec from the OS keychain. Returns None if no entry exists.
#[tauri::command]
fn load_nsec(pubkey: String) -> Result<Option<String>, String> {
    let entry = Entry::new(KEYRING_SERVICE, &pubkey).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(nsec) => Ok(Some(nsec)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Delete a stored nsec from the OS keychain.
#[tauri::command]
fn delete_nsec(pubkey: String) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, &pubkey).map_err(|e| e.to_string())?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // already gone — that's fine
        Err(e) => Err(e.to_string()),
    }
}

// ── SQLite note/profile cache ────────────────────────────────────────────────

struct DbState(Mutex<Connection>);

fn open_db(data_dir: std::path::PathBuf) -> rusqlite::Result<Connection> {
    std::fs::create_dir_all(&data_dir).ok();
    let path = data_dir.join("wrystr.db");
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         CREATE TABLE IF NOT EXISTS notes (
             id         TEXT PRIMARY KEY,
             pubkey     TEXT NOT NULL,
             created_at INTEGER NOT NULL,
             kind       INTEGER NOT NULL,
             raw        TEXT NOT NULL
         );
         CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at DESC);
         CREATE TABLE IF NOT EXISTS profiles (
             pubkey    TEXT PRIMARY KEY,
             content   TEXT NOT NULL,
             cached_at INTEGER NOT NULL
         );",
    )?;
    Ok(conn)
}

/// Upsert a batch of raw Nostr event JSON strings into the notes cache.
/// Prunes the kind-1 table to the most recent 500 entries after insert.
#[tauri::command]
fn db_save_notes(state: tauri::State<DbState>, notes: Vec<String>) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    for raw in &notes {
        let v: serde_json::Value = serde_json::from_str(raw).map_err(|e| e.to_string())?;
        let id = v["id"].as_str().unwrap_or_default();
        let pubkey = v["pubkey"].as_str().unwrap_or_default();
        let created_at = v["created_at"].as_i64().unwrap_or(0);
        let kind = v["kind"].as_i64().unwrap_or(0);
        conn.execute(
            "INSERT OR REPLACE INTO notes (id, pubkey, created_at, kind, raw) VALUES (?1,?2,?3,?4,?5)",
            params![id, pubkey, created_at, kind, raw],
        )
        .map_err(|e| e.to_string())?;
    }
    // Keep only the most recent 500 kind-1 notes
    conn.execute(
        "DELETE FROM notes WHERE kind=1 AND id NOT IN \
         (SELECT id FROM notes WHERE kind=1 ORDER BY created_at DESC LIMIT 500)",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Return up to `limit` recent kind-1 note JSONs, newest first.
#[tauri::command]
fn db_load_feed(state: tauri::State<DbState>, limit: u32) -> Result<Vec<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT raw FROM notes WHERE kind=1 ORDER BY created_at DESC LIMIT ?1")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([limit], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    Ok(result)
}

/// Cache a profile's JSON content (the NDKUserProfile object) keyed by pubkey.
#[tauri::command]
fn db_save_profile(state: tauri::State<DbState>, pubkey: String, content: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "INSERT OR REPLACE INTO profiles (pubkey, content, cached_at) VALUES (?1,?2,?3)",
        params![pubkey, content, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

/// Load a cached profile JSON for `pubkey`. Returns None if not cached.
#[tauri::command]
fn db_load_profile(state: tauri::State<DbState>, pubkey: String) -> Result<Option<String>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    match conn.query_row(
        "SELECT content FROM profiles WHERE pubkey=?1",
        [&pubkey],
        |row| row.get::<_, String>(0),
    ) {
        Ok(content) => Ok(Some(content)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

// ── App entry ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            // Fall back to in-memory DB if the on-disk open fails (e.g. permissions).
            let conn = open_db(data_dir)
                .unwrap_or_else(|_| Connection::open_in_memory().expect("in-memory SQLite"));
            app.manage(DbState(Mutex::new(conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            store_nsec,
            load_nsec,
            delete_nsec,
            db_save_notes,
            db_load_feed,
            db_save_profile,
            db_load_profile,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
