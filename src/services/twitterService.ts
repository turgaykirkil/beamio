import { TwitterVideoResult, VideoVariant } from '../types/cast';

/**
 * Standart Tweet Video URL regexi (status linkleri)
 */
const TWEET_URL_REGEX = /(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/i;

/**
 * X / Twitter Canlı Yayın (Broadcasts) URL regexi:
 * Örnek: https://x.com/i/broadcasts/1qJVmyXYkeYGB
 * veya https://twitter.com/username/broadcasts/1qJVmyXYkeYGB
 */
const BROADCAST_URL_REGEX = /(?:twitter\.com|x\.com)\/(?:[a-zA-Z0-9_]+\/)?(?:i\/)?broadcasts\/([a-zA-Z0-9]+)/i;

/**
 * Twitter resmi genel web istemcisi bearer tokenı
 */
const TWITTER_PUBLIC_BEARER =
  'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

/**
 * Verilen metnin bir Twitter tweet veya canlı yayın bağlantısı olup olmadığını kontrol eder.
 */
export function isTwitterUrl(input: string): boolean {
  const clean = input.trim();
  return TWEET_URL_REGEX.test(clean) || BROADCAST_URL_REGEX.test(clean);
}

/**
 * Verilen metnin bir X / Twitter CANLI YAYINI (Broadcast) olup olmadığını denetler.
 */
export function isTwitterBroadcastUrl(input: string): boolean {
  return BROADCAST_URL_REGEX.test(input.trim());
}

/**
 * Metinden tweet ID'sini ayıklar.
 */
export function extractTweetId(input: string): string | null {
  const match = input.match(TWEET_URL_REGEX);
  return match && match[2] ? match[2] : null;
}

/**
 * Metinden Canlı Yayın Broadcast ID'sini ayıklar.
 */
export function extractBroadcastId(input: string): string | null {
  const match = input.match(BROADCAST_URL_REGEX);
  return match && match[1] ? match[1] : null;
}

const TWITTER_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

/**
 * Twitter genel ziyaretçi (guest) oturum belirteci alır.
 */
async function fetchTwitterGuestToken(): Promise<string> {
  const res = await fetch('https://api.twitter.com/1.1/guest/activate.json', {
    method: 'POST',
    headers: {
      Authorization: TWITTER_PUBLIC_BEARER,
      'User-Agent': TWITTER_USER_AGENT,
    },
  });

  if (!res.ok) {
    throw new Error('Twitter misafir tokenı alınamadı.');
  }

  const data = await res.json();
  if (!data.guest_token) {
    throw new Error('Geçerli bir guest_token üretilemedi.');
  }

  return data.guest_token;
}

/**
 * X Canlı Yayınını (Broadcast - örn: https://x.com/i/broadcasts/1qJVmyXYkeYGB)
 * çözerek doğrudan HLS .m3u8 akış adresine dönüştürür.
 */
export async function parseTwitterBroadcast(broadcastId: string): Promise<TwitterVideoResult> {
  // 1. Guest Token al
  const guestToken = await fetchTwitterGuestToken();

  // 2. Broadcast metadata ve media_key bilgisini sorgula
  const metaRes = await fetch(`https://api.twitter.com/1.1/broadcasts/show.json?ids=${broadcastId}`, {
    headers: {
      Authorization: TWITTER_PUBLIC_BEARER,
      'x-guest-token': guestToken,
      'User-Agent': TWITTER_USER_AGENT,
    },
  });

  if (!metaRes.ok) {
    throw new Error('X Canlı Yayın detayları alınamadı.');
  }

  const metaData = await metaRes.json();
  const broadcast = metaData.broadcasts?.[broadcastId];

  if (!broadcast) {
    throw new Error('Canlı yayın bulunamadı veya yayın sonlanmış.');
  }

  const mediaKey = broadcast.media_key;
  if (!mediaKey) {
    throw new Error('Bu canlı yayına ait medya anahtarı (media_key) bulunamadı.');
  }

  // 3. Canlı HLS (.m3u8) video akışını sorgula
  const streamRes = await fetch(`https://api.twitter.com/1.1/live_video_stream/status/${mediaKey}`, {
    headers: {
      Authorization: TWITTER_PUBLIC_BEARER,
      'x-guest-token': guestToken,
      'User-Agent': TWITTER_USER_AGENT,
    },
  });

  if (!streamRes.ok) {
    throw new Error('Canlı video akış adresi (HLS) çekilemedi.');
  }

  const streamData = await streamRes.json();
  const hlsUrl = streamData.source?.location || streamData.source?.noRedirectPlaybackUrl;

  if (!hlsUrl) {
    throw new Error('Canlı yayın için HLS (.m3u8) adresi üretilemedi.');
  }

  const liveVariant: VideoVariant = {
    url: hlsUrl,
    contentType: 'application/x-mpegURL',
    resolution: 'HLS Canlı Yayın (Master .m3u8)',
    bitrate: 5000000,
  };

  return {
    id: broadcastId,
    text: broadcast.status || 'X Canlı Yayını',
    authorName: broadcast.user_display_name || broadcast.username || 'X Yayıncısı',
    authorHandle: broadcast.username ? `@${broadcast.username}` : '',
    posterUrl: broadcast.image_url || broadcast.image_url_medium,
    isLive: true,
    variants: [liveVariant],
    selectedVariant: liveVariant,
  };
}

/**
 * Bitrate değerine göre tahmini çözünürlük etiketi üretir.
 */
function estimateResolution(bitrate?: number): string {
  if (!bitrate) return 'HD';
  if (bitrate >= 2000000) return '1080p Full HD';
  if (bitrate >= 1000000) return '720p HD';
  if (bitrate >= 500000) return '480p SD';
  return '360p';
}

/**
 * Twitter/X tweetinden veya Canlı Yayınından (Broadcast) ham video akışını (MP4 / HLS) çözer.
 */
export async function parseTwitterVideo(input: string): Promise<TwitterVideoResult> {
  const cleanInput = input.trim();

  // A. Eğer link bir X Canlı Yayını ise (https://x.com/i/broadcasts/...)
  if (isTwitterBroadcastUrl(cleanInput)) {
    const broadcastId = extractBroadcastId(cleanInput);
    if (!broadcastId) {
      throw new Error('Geçerli bir X Canlı Yayın (broadcast) kimliği bulunamadı.');
    }
    return await parseTwitterBroadcast(broadcastId);
  }

  // B. Eğer link standart bir tweet videosu ise
  const tweetId = extractTweetId(cleanInput);
  if (!tweetId) {
    throw new Error('Geçerli bir Twitter/X durum veya canlı yayın bağlantısı bulunamadı.');
  }

  // 1. Birincil Çözücü: api.fxtwitter.com
  try {
    const response = await fetch(`https://api.fxtwitter.com/status/${tweetId}`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; TVCast/1.0)',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const tweet = data.tweet;

      if (!tweet) {
        throw new Error('Tweet verisi alınamadı.');
      }

      const mediaVideos = tweet.media?.videos || (tweet.video ? [tweet.video] : []);

      if (!mediaVideos || mediaVideos.length === 0) {
        throw new Error('Bu tweette oynatılabilir bir video bulunamadı.');
      }

      const primaryVideo = mediaVideos[0];
      const rawVariants = primaryVideo.variants || [];
      const variants: VideoVariant[] = [];

      if (rawVariants && rawVariants.length > 0) {
        for (const v of rawVariants) {
          if (v.url) {
            const isM3u8 = v.url.includes('.m3u8') || v.content_type?.includes('mpegurl');
            variants.push({
              url: v.url,
              bitrate: v.bitrate || (isM3u8 ? 9999999 : 0),
              contentType: isM3u8 ? 'application/x-mpegURL' : v.content_type || 'video/mp4',
              resolution: isM3u8 ? 'HLS Canlı/Otomatik' : estimateResolution(v.bitrate),
            });
          }
        }
      }

      if (variants.length === 0 && primaryVideo.url) {
        const isM3u8 = primaryVideo.url.includes('.m3u8');
        variants.push({
          url: primaryVideo.url,
          bitrate: 1000000,
          contentType: isM3u8 ? 'application/x-mpegURL' : 'video/mp4',
          resolution: isM3u8 ? 'HLS Akış' : 'HD Video',
        });
      }

      variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

      const isLiveStream = variants.some((v) => v.contentType.includes('mpegurl') || v.url.includes('.m3u8'));

      return {
        id: tweetId,
        text: tweet.text || '',
        authorName: tweet.author?.name || 'X Kullanıcısı',
        authorHandle: tweet.author?.screen_name ? `@${tweet.author.screen_name}` : '',
        posterUrl: primaryVideo.thumbnail_url || tweet.author?.avatar_url,
        durationSeconds: primaryVideo.duration,
        isLive: isLiveStream && !primaryVideo.duration,
        variants,
        selectedVariant: variants[0],
      };
    }
  } catch (err: any) {
    console.warn('FxTwitter API denemesi başarısız, VxTwitter deneniyor:', err.message);
  }

  // 2. Yedek Çözücü: api.vxtwitter.com
  try {
    const fallbackResponse = await fetch(`https://api.vxtwitter.com/Twitter/status/${tweetId}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json();
      const mediaUrls = data.mediaURLs || (data.media_extended ? data.media_extended.map((m: any) => m.url) : []);
      const videoUrls = mediaUrls.filter((url: string) => url.includes('.mp4') || url.includes('.m3u8'));

      if (videoUrls.length > 0) {
        const variants: VideoVariant[] = videoUrls.map((url: string) => {
          const isM3u8 = url.includes('.m3u8');
          return {
            url,
            bitrate: 1000000,
            contentType: isM3u8 ? 'application/x-mpegURL' : 'video/mp4',
            resolution: isM3u8 ? 'HLS Akış' : 'HD (MP4)',
          };
        });

        return {
          id: tweetId,
          text: data.text || '',
          authorName: data.user_name || 'X Kullanıcısı',
          authorHandle: data.user_screen_name ? `@${data.user_screen_name}` : '',
          posterUrl: data.media_extended?.[0]?.thumbnail_url,
          variants,
          selectedVariant: variants[0],
        };
      }
    }
  } catch (fallbackErr: any) {
    console.error('Yedek Twitter API de başarısız oldu:', fallbackErr.message);
  }

  throw new Error('Twitter/X videosu çözümlenemedi. Tweet korumalı olabilir veya video içermiyor olabilir.');
}
