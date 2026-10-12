export type StreamKind = 'mp4' | 'hls' | 'twitter' | 'unknown';

export interface VideoVariant {
  url: string;
  bitrate?: number;
  resolution?: string;
  contentType: string;
}

export interface TwitterVideoResult {
  id: string;
  text: string;
  authorName: string;
  authorHandle: string;
  posterUrl?: string;
  durationSeconds?: number;
  variants: VideoVariant[];
  selectedVariant?: VideoVariant;
  isLive?: boolean;
}

export interface MediaPreset {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  type: 'buffered' | 'live';
  contentType: string;
  posterUrl: string;
  badge: string;
}
