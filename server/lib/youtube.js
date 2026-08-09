// Thin client for the YouTube Data API v3. search.list costs 100 quota units
// per call against a 10,000/day default budget — see CLAUDE.md §4. Callers
// should keep search calls to one per sub-topic.

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

export async function searchAndDetail({ apiKey, query, language, maxResults = 8 }) {
  const searchJson = await get(
    'search',
    {
      part: 'snippet',
      type: 'video',
      maxResults,
      q: query,
      relevanceLanguage: language,
      safeSearch: 'moderate',
    },
    apiKey
  );

  const ids = (searchJson.items || []).map((i) => i.id.videoId).filter(Boolean);
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

export async function testConnection(apiKey) {
  try {
    await get('search', { part: 'snippet', type: 'video', maxResults: 1, q: 'test' }, apiKey);
    return { ok: true, message: 'Connected to YouTube Data API.' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}
