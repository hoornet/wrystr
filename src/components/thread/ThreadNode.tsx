import { useState } from "react";
import { NDKEvent } from "@nostr-dev-kit/ndk";
import type { ThreadNode as ThreadNodeType } from "../../lib/threadTree";
import { NoteCard } from "../feed/NoteCard";

interface ThreadNodeProps {
  node: ThreadNodeType;
  onReplyInThread: (event: NDKEvent) => void;
  focusedId?: string;
  mutedPubkeys: string[];
  contentMatchesMutedKeyword: (content: string) => boolean;
}

const MAX_VISIBLE_CHILDREN = 3;
const MAX_INDENT_DEPTH = 4;

export function ThreadNodeComponent({ node, onReplyInThread, focusedId, mutedPubkeys, contentMatchesMutedKeyword }: ThreadNodeProps) {
  const [expanded, setExpanded] = useState(false);

  // Filter out muted children
  const visibleChildren = node.children.filter(
    (c) => !mutedPubkeys.includes(c.event.pubkey) && !contentMatchesMutedKeyword(c.event.content)
  );

  const hiddenCount = node.children.length - visibleChildren.length;
  const shouldCollapse = visibleChildren.length > MAX_VISIBLE_CHILDREN && !expanded;
  const shownChildren = shouldCollapse ? visibleChildren.slice(0, 2) : visibleChildren;
  const remainingCount = visibleChildren.length - shownChildren.length;

  const indent = Math.min(node.depth, MAX_INDENT_DEPTH);
  const isFocused = node.event.id === focusedId;

  return (
    <div
      className={indent > 0 ? "border-l-2 border-border" : ""}
      style={indent > 0 ? { marginLeft: `${indent * 16}px` } : undefined}
    >
      <NoteCard
        event={node.event}
        focused={isFocused}
        onReplyInThread={onReplyInThread}
      />

      {shownChildren.map((child) => (
        <ThreadNodeComponent
          key={child.event.id}
          node={child}
          onReplyInThread={onReplyInThread}
          focusedId={focusedId}
          mutedPubkeys={mutedPubkeys}
          contentMatchesMutedKeyword={contentMatchesMutedKeyword}
        />
      ))}

      {remainingCount > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-accent hover:text-accent-hover text-[11px] py-1.5 transition-colors"
          style={{ marginLeft: `${(indent + 1) * 16}px` }}
        >
          show {remainingCount} more {remainingCount === 1 ? "reply" : "replies"}
        </button>
      )}

      {hiddenCount > 0 && (
        <div
          className="text-text-dim text-[10px] py-1 italic"
          style={{ marginLeft: `${(indent + 1) * 16}px` }}
        >
          {hiddenCount} {hiddenCount === 1 ? "reply" : "replies"} hidden (muted)
        </div>
      )}
    </div>
  );
}
