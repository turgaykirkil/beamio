import { MediaStreamType } from 'react-native-google-cast';
import type { RemoteMediaClient } from 'react-native-google-cast';
import { MediaPreset } from '../types/cast';

/**
 * URL'nin HLS akışı (.m3u8) olup olmadığını denetler.
 */
export function isHlsUrl(url: string): boolean {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.m3u8') || url.includes('/hls/') || url.includes('.m3u8?');
}

/**
 * URL'nin MP4 videosu olup olmadığını denetler.
 */
export function isMp4Url(url: string): boolean {
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || url.includes('.mp4?');
}

/**
 * Akış türünü ve MIME tipini belirler.
 */
export function determineMediaInfo(url: string, isLiveStream = false) {
  const isHls = isHlsUrl(url);
  const streamType = isLiveStream ? MediaStreamType.LIVE : MediaStreamType.BUFFERED;
  const contentType = isHls ? 'application/x-mpegURL' : 'video/mp4';

  return {
    isHls,
    streamType,
    contentType,
  };
}

/**
 * Medyayı bağlı Chromecast veya Android TV cihazına yükler ve oynatır.
 */
export async function loadMediaToCast(
  client: RemoteMediaClient,
  options: {
    contentUrl: string;
    title: string;
    subtitle?: string;
    posterUrl?: string;
    isLive?: boolean;
    autoplay?: boolean;
  }
) {
  const { isLive = false, autoplay = true } = options;
  const { contentType, streamType } = determineMediaInfo(options.contentUrl, isLive);

  console.log('loadMediaToCast -> contentUrl:', options.contentUrl, 'contentType:', contentType, 'streamType:', streamType);

  const images = options.posterUrl ? [{ url: options.posterUrl }] : [];

  await client.loadMedia({
    autoplay,
    mediaInfo: {
      contentUrl: options.contentUrl,
      contentType,
      streamType,
      metadata: {
        type: 'movie',
        title: options.title,
        subtitle: options.subtitle || (isLive ? 'Canlı Yayın (HLS)' : 'TV Aktarımı'),
        images,
      },
    },
  });
}

/**
 * İleri veya geri sarma (saniye cinsinden).
 */
export async function seekRelative(
  client: RemoteMediaClient,
  currentPosition: number,
  deltaSeconds: number,
  duration?: number
) {
  let target = currentPosition + deltaSeconds;
  if (target < 0) target = 0;
  if (duration && target > duration) target = duration;

  await client.seek({
    position: target,
  });
}

/**
 * Saniye formatlayıcı (00:00 veya 00:00:00).
 */
export function formatTime(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
  const totalSecs = Math.floor(seconds);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Kolay test yapılabilmesi için hazır demo medya presetleri.
 */
export const DEMO_PRESETS: MediaPreset[] = [
  {
    id: 'apple-hls',
    title: 'Apple HLS Canlı Test Akışı',
    subtitle: 'Canlı HLS .m3u8 Yayın Akışı',
    url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_4x3/bipbop_4x3_variant.m3u8',
    type: 'live',
    contentType: 'application/x-mpegURL',
    posterUrl: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&auto=format&fit=crop&q=80',
    badge: 'HLS CANLI',
  },
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny (1080p)',
    subtitle: 'Google Cast Resmi MP4 Test Dosyası',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
    type: 'buffered',
    contentType: 'video/mp4',
    posterUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/BigBuckBunny.jpg',
    badge: '1080p MP4',
  },
  {
    id: 'tears-of-steel',
    title: 'Tears of Steel (Sci-Fi)',
    subtitle: 'Cast Demo Video Akışı',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/TearsOfSteel.mp4',
    type: 'buffered',
    contentType: 'video/mp4',
    posterUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/images/480x270/TearsOfSteel.jpg',
    badge: 'MP4 VOD',
  },
];
