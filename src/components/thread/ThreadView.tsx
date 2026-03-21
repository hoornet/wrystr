import { useEffect, useRef, useState } from "react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useUIStore } from "../../stores/ui";
import { useUserStore } from "../../stores/user";
import { useMuteStore } from "../../stores/mute";
import { fetchNoteById, fetchThreadEvents, fetchAncestors, publishReply, getNDK } from "../../lib/nostr";
import { buildThreadTree, getRootEventId } from "../../lib/threadTree";
import type { ThreadNode } from "../../lib/threadTree";
import { useProfile } from "../../hooks/useProfile";
import { shortenPubkey } from "../../lib/utils";
import { AncestorChain } from "./AncestorChain";
import { ThreadNodeComponent } from "./ThreadNode";
import { NoteCard } from "../feed/NoteCard";
import { EmojiPicker } from "../shared/EmojiPicker";

function ReplyTargetBadge({ event, onClear }: { event: NDKEvent; onClear: () => void }) {
  const profile = useProfile(event.pubkey);
  const name = profile?.displayName || profile?.name || shortenPubkey(event.pubkey);
  return (
    <div className="flex items-center gap-2 mb-1.5 text-[11px]">
      <span className="text-text-dim">replying to</span>
      <span className="text-accent font-medium">@{name}</span>
      <button onClick={onClear} className="text-text-dim hover:text-text transition-colors">x</button>
    </div>
  );
}

export function ThreadView() {
  const { selectedNote, goBack } = useUIStore();
  const { loggedIn } = useUserStore();
  const { mutedPubkeys, contentMatchesMutedKeyword } = useMuteStore();
  if (!selectedNote) { goBack(); return null; }
  const focusedEvent = selectedNote;

  const [rootEvent, setRootEvent] = useState<NDKEvent | null>(null);
  const [ancestors, setAncestors] = useState<NDKEvent[]>([]);
  const [tree, setTree] = useState<ThreadNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState<NDKEvent | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replySent, setReplySent] = useState(false);
  const [showReplyEmoji, setShowReplyEmoji] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadThread() {
      setLoading(true);
      setTree(null);
      setAncestors([]);
      setRootEvent(null);
      setReplyTarget(null);

      try {
        // Determine root
        const rootId = getRootEventId(focusedEvent);
        let root: NDKEvent;

        if (!rootId || rootId === focusedEvent.id) {
          // This IS the root
          root = focusedEvent;
        } else {
          // Fetch the root event
          const fetched = await fetchNoteById(rootId);
          if (fetched) {
            root = fetched;
            // Fetch ancestors between root and focused
            const anc = await fetchAncestors(focusedEvent);
            if (!cancelled) setAncestors(anc.filter((a) => a.id !== root.id));
          } else {
            // Root not found, treat focused as root
            root = focusedEvent;
          }
        }

        if (cancelled) return;
        setRootEvent(root);

        // Fetch all thread events and build tree
        const events = await fetchThreadEvents(root.id);
        if (cancelled) return;

        // Include root in the event set
        const allEvents = [root, ...events.filter((e) => e.id !== root.id)];
        const built = buildThreadTree(root.id, allEvents);
        setTree(built);
      } catch (err) {
        console.error("Failed to load thread:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadThread();
    return () => { cancelled = true; };
  }, [focusedEvent.id]);

  // Scroll to focused note after tree renders (if not root)
  useEffect(() => {
    if (!loading && rootEvent && focusedEvent.id !== rootEvent.id) {
      // Small delay to allow DOM to render
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-note-id="${focusedEvent.id}"]`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, rootEvent?.id, focusedEvent.id]);

  const handleReplyInThread = (event: NDKEvent) => {
    setReplyTarget(event);
    setTimeout(() => replyRef.current?.focus(), 50);
  };

  const effectiveReplyTarget = replyTarget ?? rootEvent;

  const handleReply = async () => {
    if (!replyText.trim() || replying || !rootEvent) return;
    setReplying(true);
    try {
      const target = effectiveReplyTarget ?? rootEvent;
      const rootArg = target.id !== rootEvent.id
        ? { id: rootEvent.id, pubkey: rootEvent.pubkey }
        : undefined;

      const replyEvent = await publishReply(
        replyText.trim(),
        { id: target.id, pubkey: target.pubkey },
        rootArg,
      );
      setReplyText("");
      setReplySent(true);
      setReplyTarget(null);

      // Optimistically insert into tree
      if (tree) {
        const allEvents = collectEvents(tree);
        allEvents.push(replyEvent);
        const rebuilt = buildThreadTree(rootEvent.id, allEvents);
        setTree(rebuilt);
      }

      setTimeout(() => setReplySent(false), 2000);
    } finally {
      setReplying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleReply();
    if (e.key === "Escape") replyRef.current?.blur();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-2.5 flex items-center gap-3 shrink-0">
        <button
          onClick={goBack}
          className="text-text-dim hover:text-text text-[11px] transition-colors"
        >
          ← back
        </button>
        <h1 className="text-text text-sm font-medium">Thread</h1>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Loading shimmer */}
        {loading && (
          <div className="px-4 py-6 space-y-4">
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-bg-raised rounded" />
              <div className="h-24 bg-bg-raised rounded" />
              <div className="h-16 bg-bg-raised rounded ml-4" />
              <div className="h-16 bg-bg-raised rounded ml-4" />
            </div>
          </div>
        )}

        {!loading && tree && rootEvent && (
          <>
            {/* Ancestors (when opening a deep reply) */}
            <AncestorChain ancestors={ancestors} />

            {/* Root note rendered via tree */}
            <div data-note-id={tree.event.id}>
              <NoteCard
                event={tree.event}
                focused={tree.event.id === focusedEvent.id}
                onReplyInThread={handleReplyInThread}
              />
            </div>

            {/* Reply composer */}
            {loggedIn && !!getNDK().signer && (
              <div className="border-b border-border px-4 py-3">
                {replyTarget && replyTarget.id !== rootEvent.id && (
                  <ReplyTargetBadge event={replyTarget} onClear={() => setReplyTarget(null)} />
                )}
                <textarea
                  ref={replyRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full bg-transparent text-text text-[13px] placeholder:text-text-dim resize-none focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className="relative">
                    <button
                      onClick={() => setShowReplyEmoji((v) => !v)}
                      title="Insert emoji"
                      className="text-text-dim hover:text-text text-[12px] transition-colors"
                    >
                      ☺
                    </button>
                    {showReplyEmoji && (
                      <EmojiPicker
                        onSelect={(emoji) => {
                          const ta = replyRef.current;
                          if (ta) {
                            const start = ta.selectionStart ?? replyText.length;
                            const end = ta.selectionEnd ?? replyText.length;
                            setReplyText(replyText.slice(0, start) + emoji + replyText.slice(end));
                            setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + emoji.length; ta.focus(); }, 0);
                          } else {
                            setReplyText((t) => t + emoji);
                          }
                        }}
                        onClose={() => setShowReplyEmoji(false)}
                      />
                    )}
                  </div>
                  <span className="text-text-dim text-[10px]">Ctrl+Enter</span>
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replying}
                    className="px-3 py-1 text-[11px] bg-accent hover:bg-accent-hover text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {replySent ? "replied ✓" : replying ? "posting..." : "reply"}
                  </button>
                </div>
              </div>
            )}

            {/* Thread tree (children of root) */}
            {tree.children.length === 0 && (
              <div className="px-4 py-6 text-text-dim text-[12px] text-center">
                No replies yet.
              </div>
            )}

            {tree.children
              .filter((c) => !mutedPubkeys.includes(c.event.pubkey) && !contentMatchesMutedKeyword(c.event.content))
              .map((child) => (
                <ThreadNodeComponent
                  key={child.event.id}
                  node={child}
                  onReplyInThread={handleReplyInThread}
                  focusedId={focusedEvent.id}
                  mutedPubkeys={mutedPubkeys}
                  contentMatchesMutedKeyword={contentMatchesMutedKeyword}
                />
              ))}
          </>
        )}

        {!loading && !tree && (
          <div className="px-4 py-6 text-text-dim text-[12px] text-center">
            Could not load thread.
          </div>
        )}
      </div>
    </div>
  );
}

/** Collect all events from a tree into a flat array. */
function collectEvents(node: ThreadNode): NDKEvent[] {
  const result: NDKEvent[] = [node.event];
  for (const child of node.children) {
    result.push(...collectEvents(child));
  }
  return result;
}
