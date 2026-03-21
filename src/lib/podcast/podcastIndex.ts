import type { PodcastShow, PodcastEpisode, V4VRecipient } from "../../types/podcast";

// Free-tier Podcast Index API credentials
const API_KEY = "VKWWTGY25NVCKYJWHSNY";
const API_SECRET = "ves3#2YKqSvp7ZdRSuRhSgdnCLtFP4tEbzFGxAtW";
const API_BASE = "https://api.podcastindex.org/api/1.0";

async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function apiHeaders(): Promise<Record<string, string>> {
  const apiHeaderTime = Math.floor(Date.now() / 1000).toString();
  const hash = await sha1(API_KEY + API_SECRET + apiHeaderTime);
  return {
    "X-Auth-Key": API_KEY,
    "X-Auth-Date": apiHeaderTime,
    "Authorization": hash,
    "User-Agent": "Wrystr/1.0",
  };
}

function mapShow(item: Record<string, unknown>): PodcastShow {
  return {
    feedUrl: (item.url as string) ?? "",
    title: (item.title as string) ?? "",
    author: (item.author as string) ?? "",
    artworkUrl: (item.artwork as string) || (item.image as string) || "",
    description: (item.description as string) ?? "",
    podcastIndexId: item.id as number,
  };
}

function extractV4V(value: Record<string, unknown> | undefined): V4VRecipient[] {
  if (!value) return [];
  const destinations = value.destinations as Record<string, unknown>[] | undefined;
  if (!Array.isArray(destinations)) return [];
  return destinations
    .filter((d) => d.address)
    .map((d) => ({
      name: d.name as string | undefined,
      type: (d.type as string) ?? "wallet",
      address: d.address as string,
      split: Number(d.split) || 0,
      customKey: d.customKey as string | undefined,
      customValue: d.customValue as string | undefined,
    }));
}

function mapEpisode(item: Record<string, unknown>, show?: PodcastShow): PodcastEpisode {
  return {
    guid: (item.guid as string) || String(item.id ?? ""),
    title: (item.title as string) ?? "",
    enclosureUrl: (item.enclosureUrl as string) ?? "",
    pubDate: (item.datePublished as number) ?? 0,
    duration: (item.duration as number) ?? 0,
    description: (item.description as string) ?? "",
    artworkUrl: (item.feedImage as string) || (item.image as string) || undefined,
    showTitle: show?.title ?? (item.feedTitle as string) ?? "",
    showArtworkUrl: show?.artworkUrl ?? (item.feedImage as string) ?? "",
    podcastIndexId: item.feedId as number | undefined,
    value: extractV4V(item.value as Record<string, unknown> | undefined),
  };
}

export async function searchPodcasts(query: string): Promise<PodcastShow[]> {
  const headers = await apiHeaders();
  const res = await fetch(`${API_BASE}/search/byterm?q=${encodeURIComponent(query)}`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.feeds as Record<string, unknown>[]) ?? []).map(mapShow);
}

export async function getEpisodes(feedId: number): Promise<PodcastEpisode[]> {
  const headers = await apiHeaders();
  const res = await fetch(`${API_BASE}/episodes/byfeedid?id=${feedId}&max=50`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.items as Record<string, unknown>[]) ?? []).map((item) => mapEpisode(item));
}

export async function getTrending(): Promise<PodcastShow[]> {
  const headers = await apiHeaders();
  const res = await fetch(`${API_BASE}/podcasts/trending?max=20&lang=en`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.feeds as Record<string, unknown>[]) ?? []).map(mapShow);
}

export async function getPodcastByFeedUrl(feedUrl: string): Promise<PodcastShow | null> {
  const headers = await apiHeaders();
  const res = await fetch(`${API_BASE}/podcasts/byfeedurl?url=${encodeURIComponent(feedUrl)}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.feed) return null;
  return mapShow(data.feed);
}
