import { NDKEvent } from "@nostr-dev-kit/ndk";

export interface ThreadNode {
  event: NDKEvent;
  children: ThreadNode[];
  depth: number;
}

/**
 * Extract the parent event ID from an event's e-tags.
 * Priority: "reply" marker > "root" marker > last e-tag (deprecated positional).
 */
export function getParentEventId(event: NDKEvent): string | null {
  const eTags = event.tags.filter((t) => t[0] === "e");
  if (eTags.length === 0) return null;
  return eTags.find((t) => t[3] === "reply")?.[1]
    ?? eTags.find((t) => t[3] === "root")?.[1]
    ?? eTags[eTags.length - 1][1];
}

/**
 * Extract the root event ID from an event's e-tags.
 */
export function getRootEventId(event: NDKEvent): string | null {
  const eTags = event.tags.filter((t) => t[0] === "e");
  if (eTags.length === 0) return null;
  const root = eTags.find((t) => t[3] === "root");
  if (root) return root[1];
  // If only one e-tag with no marker, it's the root
  if (eTags.length === 1 && !eTags[0][3]) return eTags[0][1];
  // Deprecated positional: first e-tag is root
  return eTags[0][1];
}

/**
 * Build a tree structure from a flat list of events.
 * Returns the root node, or null if rootId not found in events.
 */
export function buildThreadTree(rootId: string, events: NDKEvent[]): ThreadNode | null {
  const eventMap = new Map<string, NDKEvent>();
  for (const e of events) {
    eventMap.set(e.id, e);
  }

  const rootEvent = eventMap.get(rootId);
  if (!rootEvent) return null;

  const nodeMap = new Map<string, ThreadNode>();
  for (const e of events) {
    nodeMap.set(e.id, { event: e, children: [], depth: 0 });
  }

  const rootNode = nodeMap.get(rootId)!;

  // Link children to parents
  for (const e of events) {
    if (e.id === rootId) continue;
    const parentId = getParentId(e, rootId);
    const parentNode = parentId ? nodeMap.get(parentId) : null;
    const childNode = nodeMap.get(e.id)!;
    if (parentNode) {
      parentNode.children.push(childNode);
    } else {
      // Orphan — attach to root
      rootNode.children.push(childNode);
    }
  }

  // Set depths and sort children by created_at
  setDepths(rootNode, 0);

  return rootNode;
}

function getParentId(event: NDKEvent, rootId: string): string | null {
  const eTags = event.tags.filter((t) => t[0] === "e");
  if (eTags.length === 0) return rootId;

  // Prefer "reply" marker
  const reply = eTags.find((t) => t[3] === "reply");
  if (reply) return reply[1];

  // If there's a "root" marker and it's the only e-tag, parent is the root
  const root = eTags.find((t) => t[3] === "root");
  if (root && eTags.length === 1) return root[1];

  // If there's a root marker and other e-tags without markers, use the last non-root e-tag
  if (root) {
    const nonRoot = eTags.filter((t) => t[3] !== "root");
    if (nonRoot.length > 0) return nonRoot[nonRoot.length - 1][1];
    return root[1];
  }

  // Deprecated positional: last e-tag is the reply target
  return eTags[eTags.length - 1][1];
}

function setDepths(node: ThreadNode, depth: number) {
  node.depth = depth;
  node.children.sort((a, b) => (a.event.created_at ?? 0) - (b.event.created_at ?? 0));
  for (const child of node.children) {
    setDepths(child, depth + 1);
  }
}
