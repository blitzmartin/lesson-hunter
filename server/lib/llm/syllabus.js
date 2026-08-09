import { getProvider } from './providers.js';

const SYSTEM_PROMPT = `You are an expert curriculum designer. Given a topic, skill level, language, and a desired number of sub-topics, produce a JSON array (and nothing else — no markdown fences, no commentary) of sequential sub-topics that build on each other logically, from foundational to advanced within the requested level. Each item must be an object: { "title": string, "searchQuery": string, "why": string }. "searchQuery" is a concise YouTube search query likely to surface a good tutorial video for that sub-topic in the requested language. "why" is one sentence on why this sub-topic belongs at this point in the sequence.`;

function buildPrompt({ topic, level, language, videoCountRange, notes }) {
  return [
    `Topic: ${topic}`,
    `Skill level: ${level}`,
    `Language: ${language}`,
    `Number of sub-topics: choose a count within the range ${videoCountRange} that best fits how much ground this topic needs to cover.`,
    notes ? `Additional notes from the user: ${notes}` : null,
    'Return ONLY the JSON array.',
  ]
    .filter(Boolean)
    .join('\n');
}

function extractJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('LLM did not return a JSON array');
  return JSON.parse(text.slice(start, end + 1));
}

export async function generateSyllabus({ providerName, providerConfig, topic, level, language, videoCountRange, notes }) {
  const provider = getProvider(providerName);
  const prompt = buildPrompt({ topic, level, language, videoCountRange, notes });
  const raw = await provider.complete({ ...providerConfig, system: SYSTEM_PROMPT, prompt });
  const items = extractJsonArray(raw);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('LLM returned an empty syllabus');
  }
  return items.map((item, index) => ({
    order: index + 1,
    subTopicTitle: item.title,
    searchQuery: item.searchQuery || item.title,
    why: item.why || '',
  }));
}

const RATIONALE_SYSTEM_PROMPT = `You are helping curate a video course. Given a sub-topic and a short list of YouTube video candidates (title, channel, duration in seconds, view count), pick the single best fit. Weigh relevance to the sub-topic first, then whether the duration suits the given skill level (shorter/introductory videos for beginners, longer/deep-dive videos acceptable for advanced), then recency, with view count only as a light secondary signal — do not simply pick the most-viewed video. Reply with ONLY a JSON object: { "index": <candidate index, 0-based>, "rationale": "<one sentence explaining the pick>" }.`;

export async function pickBestVideo({ providerName, providerConfig, subTopicTitle, level, candidates }) {
  const provider = getProvider(providerName);
  const prompt = [
    `Sub-topic: ${subTopicTitle}`,
    `Skill level: ${level}`,
    'Candidates:',
    ...candidates.map(
      (c, i) =>
        `${i}. "${c.title}" — channel: ${c.channelName}, duration: ${c.durationSeconds}s, views: ${c.viewCount}, published: ${c.publishedAt}`
    ),
    'Return ONLY the JSON object.',
  ].join('\n');
  const raw = await provider.complete({ ...providerConfig, system: RATIONALE_SYSTEM_PROMPT, prompt });
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM did not return a JSON object');
  const parsed = JSON.parse(raw.slice(start, end + 1));
  const index = Number.isInteger(parsed.index) && candidates[parsed.index] ? parsed.index : 0;
  return { index, rationale: parsed.rationale || 'Best available match for this sub-topic.' };
}
