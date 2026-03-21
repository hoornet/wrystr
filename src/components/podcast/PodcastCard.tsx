import type { PodcastShow } from "../../types/podcast";

interface PodcastCardProps {
  show: PodcastShow;
  onClick: () => void;
}

export function PodcastCard({ show, onClick }: PodcastCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-3 rounded-sm bg-bg-raised border border-border hover:bg-bg-hover transition-colors text-left w-full"
    >
      {show.artworkUrl ? (
        <img
          src={show.artworkUrl}
          alt=""
          className="w-16 h-16 rounded-sm object-cover shrink-0 bg-bg"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div className="w-16 h-16 rounded-sm bg-bg flex items-center justify-center shrink-0 text-2xl text-text-dim">
          P
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-text font-medium truncate">{show.title}</div>
        <div className="text-[11px] text-text-muted truncate">{show.author}</div>
        {show.description && (
          <div className="text-[11px] text-text-dim mt-1 line-clamp-2">
            {show.description.replace(/<[^>]+>/g, "").slice(0, 120)}
          </div>
        )}
      </div>
    </button>
  );
}
