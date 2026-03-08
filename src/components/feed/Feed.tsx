import { useEffect } from "react";
import { useFeedStore } from "../../stores/feed";
import { NoteCard } from "./NoteCard";

export function Feed() {
  const { notes, loading, connected, error, connect, loadFeed } = useFeedStore();

  useEffect(() => {
    connect().then(() => loadFeed());
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0">
        <h1 className="text-text text-sm font-medium tracking-wide">Global Feed</h1>
        <div className="flex items-center gap-3">
          {connected && (
            <span className="text-success text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
              connected
            </span>
          )}
          <button
            onClick={loadFeed}
            disabled={loading}
            className="text-text-muted hover:text-text text-[11px] px-2 py-1 border border-border hover:border-text-dim transition-colors disabled:opacity-40"
          >
            {loading ? "loading…" : "refresh"}
          </button>
        </div>
      </header>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="px-4 py-3 text-danger text-[12px] border-b border-border bg-danger/5">
            {error}
          </div>
        )}

        {loading && notes.length === 0 && (
          <div className="px-4 py-8 text-text-dim text-[12px] text-center">
            Connecting to relays…
          </div>
        )}

        {!loading && notes.length === 0 && !error && (
          <div className="px-4 py-8 text-text-dim text-[12px] text-center">
            No notes yet.
          </div>
        )}

        {notes.map((event) => (
          <NoteCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
