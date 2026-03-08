import { NDKEvent } from "@nostr-dev-kit/ndk";
import { useProfile } from "../../hooks/useProfile";
import { timeAgo, shortenPubkey } from "../../lib/utils";

interface NoteCardProps {
  event: NDKEvent;
}

export function NoteCard({ event }: NoteCardProps) {
  const profile = useProfile(event.pubkey);
  const name = profile?.displayName || profile?.name || shortenPubkey(event.pubkey);
  const avatar = profile?.picture;
  const time = event.created_at ? timeAgo(event.created_at) : "";

  return (
    <article className="border-b border-border px-4 py-3 hover:bg-bg-hover transition-colors duration-100">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="w-9 h-9 rounded-sm object-cover bg-bg-raised"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-sm bg-bg-raised border border-border flex items-center justify-center text-text-dim text-xs">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-text font-medium truncate text-[13px]">
              {name}
            </span>
            <span className="text-text-dim text-[11px] shrink-0">{time}</span>
          </div>
          <div className="note-content text-text text-[13px] break-words whitespace-pre-wrap">
            {event.content}
          </div>
        </div>
      </div>
    </article>
  );
}
