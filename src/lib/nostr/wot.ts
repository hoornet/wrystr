import { getNDK, fetchWithTimeout, FEED_TIMEOUT } from "./core";

export async function buildWoTSet(myPubkey: string, directFollows: string[]): Promise<Set<string>> {
  const trusted = new Set<string>();
  trusted.add(myPubkey); // own notes always pass

  // Hop 1 — direct follows
  for (const pk of directFollows) trusted.add(pk);

  if (directFollows.length === 0) return trusted;

  // Hop 2 — fetch all their contact lists in one batch
  const ndk = getNDK();
  const events = await fetchWithTimeout(ndk, { kinds: [3], authors: directFollows }, FEED_TIMEOUT);
  for (const event of events) {
    for (const tag of event.tags) {
      if (tag[0] === "p" && tag[1]) trusted.add(tag[1]);
    }
  }

  return trusted;
}
