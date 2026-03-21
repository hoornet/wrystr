export interface PodcastShow {
  feedUrl: string;
  title: string;
  author: string;
  artworkUrl: string;
  description: string;
  podcastIndexId?: number;
}

export interface V4VRecipient {
  name?: string;
  type: string;
  address: string;
  split: number;
  customKey?: string;
  customValue?: string;
}

export interface PodcastEpisode {
  guid: string;
  title: string;
  enclosureUrl: string;
  pubDate: number;
  duration: number;
  description: string;
  artworkUrl?: string;
  showTitle: string;
  showArtworkUrl: string;
  podcastIndexId?: number;
  value?: V4VRecipient[];
}

export type PlaybackState = "idle" | "loading" | "playing" | "paused";
