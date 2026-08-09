import { getProvider } from './providers.js';

const SYSTEM_PROMPT = `You are an expert curriculum designer. Given a topic, skill level, language, and a desired number of sub-topics, produce a JSON array (and nothing else — no markdown fences, no commentary) of sequential sub-topics that build on each other logically, from foundational to advanced within the requested level. Each item must be an object: { "title": string, "searchQuery": string, "why": string }. "searchQuery" is a concise YouTube search query likely to surface a good tutorial video for that sub-topic in the requested language. "why" is one sentence on why this sub-topic belongs at this point in the sequence.`;

// A loose "choose a count within the range" instruction lets the model judge
// how much a topic needs — which is the point of offering a range — but
// smaller models tend to default to a small habitual number regardless of
// what's asked. Keep the model's judgment call, just state the boundaries
// forcefully enough that "within range" isn't read as "somewhere near zero".
function parseCountRange(videoCountRange) {
  const match = /^(\d+)-(\d+)$/.exec(videoCountRange || '');
  if (!match) return { min: 6, max: 15 };
  return { min: Number(match[1]), max: Number(match[2]) };
}

function buildPrompt({ topic, level, language, min, max, notes }) {
  return [
    `Topic: ${topic}`,
    `Skill level: ${level}`,
    `Language: ${language}`,
    `Number of sub-topics: the JSON array's length MUST be between ${min} and ${max} (inclusive) — ` +
      `never fewer than ${min}. Choose how many within that range based on how much ground this topic ` +
      `genuinely needs to cover; use the higher end for broad topics, the lower end for narrow ones.`,
    notes ? `Additional notes from the user: ${notes}` : null,
    'Return ONLY the JSON array.',
  ]
    .filter(Boolean)
    .join('\n');
}

// V8 truncates JSON.parse's own SyntaxError to a short snippet around the
// failure — not enough to actually see what the model got wrong. Rethrow
// with the parse error plus a generous, readable chunk of the actual text.
function parseJsonOrExplain(candidate, kind) {
  try {
    return JSON.parse(candidate);
  } catch (err) {
    const preview = candidate.length > 400 ? `${candidate.slice(0, 400)}…` : candidate;
    throw new Error(`Model returned malformed JSON for the ${kind} (${err.message}). Raw output: ${preview}`);
  }
}

function extractJsonArray(text) {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) {
    const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    throw new Error(`Model did not return a JSON array. Raw output: ${preview || '(empty response)'}`);
  }
  return parseJsonOrExplain(text.slice(start, end + 1), 'syllabus');
}

const STRICT_JSON_REMINDER =
  'IMPORTANT: Reply with strictly valid JSON — every string value fully wrapped in double quotes, no trailing commas, no comments, no markdown fences.';

// Smaller/local models occasionally emit almost-valid JSON (a missing quote,
// a stray comma). Retry a couple of times with a stricter reminder before
// giving up, instead of failing the whole course generation on one hiccup.
const MAX_ATTEMPTS = 3;

function toSyllabus(items) {
  return items.map((item, index) => ({
    order: index + 1,
    subTopicTitle: item.title,
    searchQuery: item.searchQuery || item.title,
    why: item.why || '',
  }));
}

export async function generateSyllabus({ providerName, providerConfig, topic, level, language, videoCountRange, notes }) {
  const provider = getProvider(providerName);
  const { min, max } = parseCountRange(videoCountRange);
  const basePrompt = buildPrompt({ topic, level, language, min, max, notes });

  let lastError;
  let bestEffort; // last successfully parsed array, even out of range — better than failing outright
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const countReminder =
      attempt > 1 && bestEffort
        ? `\n\nYour last reply had ${bestEffort.length} items, which is outside the required ${min}-${max} range. Try again — the array length must be between ${min} and ${max}.`
        : '';
    const prompt = attempt === 1 ? basePrompt : `${basePrompt}${countReminder}\n\n${STRICT_JSON_REMINDER}`;
    const raw = await provider.complete({ ...providerConfig, system: SYSTEM_PROMPT, prompt });
    try {
      const items = extractJsonArray(raw);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error('LLM returned an empty syllabus');
      }
      bestEffort = items;
      if (items.length >= min && items.length <= max) {
        return toSyllabus(items);
      }
      throw new Error(`Expected ${min}-${max} sub-topics but got ${items.length}`);
    } catch (err) {
      console.error(`[syllabus] attempt ${attempt}/${MAX_ATTEMPTS} failed. Full raw output:\n${raw}`);
      lastError = err;
    }
  }

  // Every attempt produced valid JSON, just outside the requested range —
  // use the closest one we got rather than fail outright.
  if (bestEffort) {
    console.warn(`[syllabus] using best-effort result with ${bestEffort.length} items (requested range ${min}-${max})`);
    return toSyllabus(bestEffort);
  }

  throw new Error(
    `The AI model kept returning invalid JSON for the course syllabus after ${MAX_ATTEMPTS} attempts. ` +
      `This is common with smaller local Ollama models — a cloud provider (OpenAI/Anthropic/Gemini) tends to ` +
      `be more reliable here. Last error: ${lastError.message}`
  );
}

const RATIONALE_SYSTEM_PROMPT = `You are helping curate a video course. Given a sub-topic and a short list of YouTube video candidates (title, channel, duration in seconds, view count), pick the single best fit. Weigh relevance to the sub-topic first, then whether the duration suits the given skill level (shorter/introductory videos for beginners, longer/deep-dive videos acceptable for advanced), then recency, with view count only as a light secondary signal — do not simply pick the most-viewed video. Reply with ONLY a JSON object: { "index": <candidate index, 0-based>, "rationale": "<one sentence explaining the pick>" }.`;

function extractJsonObject(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    const preview = text.length > 400 ? `${text.slice(0, 400)}…` : text;
    throw new Error(`Model did not return a JSON object. Raw output: ${preview || '(empty response)'}`);
  }
  return parseJsonOrExplain(text.slice(start, end + 1), 'video pick');
}

export async function pickBestVideo({ providerName, providerConfig, subTopicTitle, level, candidates }) {
  const provider = getProvider(providerName);
  const basePrompt = [
    `Sub-topic: ${subTopicTitle}`,
    `Skill level: ${level}`,
    'Candidates:',
    ...candidates.map(
      (c, i) =>
        `${i}. "${c.title}" — channel: ${c.channelName}, duration: ${c.durationSeconds}s, views: ${c.viewCount}, published: ${c.publishedAt}`
    ),
    'Return ONLY the JSON object.',
  ].join('\n');

  // A malformed pick here isn't worth failing the whole course over — retry
  // once with a stricter reminder, then fall back to the first candidate.
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = attempt === 1 ? basePrompt : `${basePrompt}\n\n${STRICT_JSON_REMINDER}`;
    try {
      const raw = await provider.complete({ ...providerConfig, system: RATIONALE_SYSTEM_PROMPT, prompt });
      const parsed = extractJsonObject(raw);
      const index = Number.isInteger(parsed.index) && candidates[parsed.index] ? parsed.index : 0;
      return { index, rationale: parsed.rationale || 'Best available match for this sub-topic.' };
    } catch (err) {
      console.error(`[pickBestVideo] attempt ${attempt}/2 failed for "${subTopicTitle}": ${err.message}`);
    }
  }
  return { index: 0, rationale: 'Best available match for this sub-topic.' };
}
