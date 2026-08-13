// Thin client for the YouTube Data API v3. search.list costs 100 quota units
// per call against a 10,000/day default budget — see CLAUDE.md §4.
// searchAndDetail issues two search.list calls per sub-topic (relevance +
// viewCount, merged) to widen the candidate pool, so budget 200 units per
// sub-topic when estimating how many courses fit in a day's quota.

const BASE = 'https://www.googleapis.com/youtube/v3';

async function get(path, params, apiKey) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('key', apiKey);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || res.statusText;
    throw new Error(`YouTube API error: ${message}`);
  }
  return json;
}

function parseIsoDuration(iso) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

// relevanceLanguage requires an ISO 639-1 code (e.g. "en") — passing YouTube
// free text like "English" fails with "Request contains an invalid argument".
const LANGUAGE_NAME_TO_ISO = {
  english: 'en',
  italian: 'it',
  italiano: 'it',
  spanish: 'es',
  español: 'es',
  french: 'fr',
  français: 'fr',
  german: 'de',
  deutsch: 'de',
  portuguese: 'pt',
  português: 'pt',
  dutch: 'nl',
  russian: 'ru',
  japanese: 'ja',
  chinese: 'zh',
  korean: 'ko',
  arabic: 'ar',
  hindi: 'hi',
  polish: 'pl',
  turkish: 'tr',
};

function toIsoLanguage(language) {
  if (!language) return undefined;
  const trimmed = language.trim();
  if (/^[a-zA-Z]{2}$/.test(trimmed)) return trimmed.toLowerCase();
  return LANGUAGE_NAME_TO_ISO[trimmed.toLowerCase()];
}

// Two search passes over the same query, merged: "relevance" (YouTube's
// default, weighs text match) alone can miss well-known, heavily-watched
// tutorials whose title doesn't match closely. Adding a "viewCount" pass
// widens the candidate pool with popular results — order still filters by
// the query, it only re-ranks matches, so this doesn't pull in unrelated
// viral videos. Doubles search.list quota cost per sub-topic (see header).
async function searchOnce({ apiKey, query, relevanceLanguage, order, maxResults }) {
  const searchJson = await get(
    'search',
    {
      part: 'snippet',
      type: 'video',
      maxResults,
      q: query,
      order,
      ...(relevanceLanguage ? { relevanceLanguage } : {}),
      safeSearch: 'moderate',
    },
    apiKey
  );
  return (searchJson.items || []).map((i) => i.id.videoId).filter(Boolean);
}

export async function searchAndDetail({ apiKey, query, language, maxResults = 8 }) {
  const relevanceLanguage = toIsoLanguage(language);
  const [relevanceIds, popularIds] = await Promise.all([
    searchOnce({ apiKey, query, relevanceLanguage, order: 'relevance', maxResults }),
    searchOnce({ apiKey, query, relevanceLanguage, order: 'viewCount', maxResults }),
  ]);

  const ids = [...new Set([...relevanceIds, ...popularIds])];
  if (ids.length === 0) return [];

  const detailsJson = await get(
    'videos',
    { part: 'snippet,contentDetails,statistics', id: ids.join(',') },
    apiKey
  );

  return (detailsJson.items || []).map((v) => ({
    youtubeId: v.id,
    title: v.snippet.title,
    channelName: v.snippet.channelTitle,
    durationSeconds: parseIsoDuration(v.contentDetails.duration),
    thumbnailUrl:
      v.snippet.thumbnails?.high?.url ||
      v.snippet.thumbnails?.medium?.url ||
      v.snippet.thumbnails?.default?.url,
    viewCount: Number(v.statistics?.viewCount || 0),
    publishedAt: v.snippet.publishedAt,
  }));
}

// Accepts watch?v=, youtu.be/, embed/, and shorts/ URL forms, or a bare 11-char ID.
export function extractVideoId(input) {
  const trimmed = (input || '').trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0] || null;
    if (url.hostname.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      const match = /\/(embed|shorts)\/([\w-]{11})/.exec(url.pathname);
      if (match) return match[2];
    }
    return null;
  } catch {
    return null;
  }
}

export async function testConnection(apiKey) {
  try {
    await get('search', { part: 'snippet', type: 'video', maxResults: 1, q: 'test' }, apiKey);
    return { ok: true, message: 'Connected to YouTube Data API.' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}
