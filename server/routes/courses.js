import crypto from 'node:crypto';
import { Router } from 'express';
import { listCourses, getCourse, saveCourse, deleteCourse, readConfig } from '../lib/store.js';
import { getSecret } from '../lib/secrets.js';
import { generateCourse } from '../lib/courseGenerator.js';
import { extractVideoId } from '../lib/youtube.js';

export const coursesRouter = Router();

const SECRET_KEYS = { openai: 'openai-api-key', anthropic: 'anthropic-api-key', deepseek: 'deepseek-api-key', gemini: 'gemini-api-key' };

async function resolveProviderConfig() {
  const config = await readConfig();
  const providerName = config.llmProvider;
  if (!providerName) throw new Error('No LLM provider configured yet. Visit Setup.');

  if (providerName === 'ollama') {
    if (!config.ollamaModel) throw new Error('No Ollama model selected yet. Visit Setup.');
    return { providerName, providerConfig: { endpoint: config.ollamaEndpoint, model: config.ollamaModel } };
  }

  const apiKey = await getSecret(SECRET_KEYS[providerName]);
  if (!apiKey) throw new Error(`No API key saved for ${providerName}. Visit Setup.`);
  return { providerName, providerConfig: { apiKey } };
}

coursesRouter.get('/', async (req, res) => {
  res.json(await listCourses());
});

coursesRouter.get('/:id', async (req, res) => {
  const course = await getCourse(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

coursesRouter.delete('/:id', async (req, res) => {
  const ok = await deleteCourse(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Course not found' });
  res.status(204).end();
});

// Persist per-topic notes / completion toggles without regenerating the course.
coursesRouter.patch('/:id/syllabus/:order', async (req, res) => {
  const course = await getCourse(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const order = Number(req.params.order);
  const entry = course.syllabus.find((s) => s.order === order);
  if (!entry) return res.status(404).json({ error: 'Sub-topic not found' });
  const { userNotes, completed } = req.body || {};
  if (userNotes !== undefined) entry.userNotes = userNotes;
  if (completed !== undefined) entry.completed = completed;
  await saveCourse(course);
  res.json(course);
});

function buildManualVideo(entry) {
  const youtubeId = extractVideoId(entry?.youtubeUrl);
  if (!youtubeId) return null;
  const subTopicTitle = (entry?.subTopicTitle || '').trim();
  return {
    youtubeId,
    title: (entry?.videoTitle || '').trim() || subTopicTitle,
    channelName: (entry?.channelName || '').trim(),
    durationSeconds: 0,
    thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    viewCount: 0,
    publishedAt: null,
    selectionRationale: '',
  };
}

// Replaces the whole syllabus (order, titles, membership) in one shot — backs
// the course editor: reorder, rename, delete and add-by-link all resolve to
// "here is the syllabus as it should look now". Existing entries keep their
// video untouched; new entries (no `video`, only `youtubeUrl`) are resolved
// the same way manual creation resolves them, no LLM/YouTube search involved.
coursesRouter.put('/:id/syllabus', async (req, res) => {
  const course = await getCourse(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });

  const { syllabus } = req.body || {};
  if (!Array.isArray(syllabus) || syllabus.length === 0) {
    return res.status(400).json({ error: 'At least one sub-topic is required' });
  }

  const nextSyllabus = [];
  for (const [i, entry] of syllabus.entries()) {
    const subTopicTitle = (entry?.subTopicTitle || '').trim();
    if (!subTopicTitle) {
      return res.status(400).json({ error: `Sub-topic ${i + 1} is missing a title` });
    }

    let video = entry?.video ?? null;
    if (!video && entry?.youtubeUrl) {
      video = buildManualVideo({ ...entry, subTopicTitle });
      if (!video) {
        return res.status(400).json({ error: `Sub-topic ${i + 1}: not a valid YouTube link` });
      }
    }

    nextSyllabus.push({
      order: i + 1,
      subTopicTitle,
      video,
      userNotes: entry?.userNotes || '',
      completed: Boolean(entry?.completed),
    });
  }

  course.syllabus = nextSyllabus;
  await saveCourse(course);
  res.json(course);
});

coursesRouter.post('/generate', async (req, res) => {
  const { topic, level, language, languageCode, videoCountRange, notes } = req.body || {};
  if (!topic || !level || !language || !languageCode || !videoCountRange) {
    return res
      .status(400)
      .json({ error: 'topic, level, language, languageCode and videoCountRange are required' });
  }

  try {
    const { providerName, providerConfig } = await resolveProviderConfig();
    const youtubeApiKey = await getSecret('youtube-api-key');
    if (!youtubeApiKey) throw new Error('No YouTube API key saved yet. Visit Setup.');

    const course = await generateCourse({
      providerName,
      providerConfig,
      youtubeApiKey,
      topic,
      level,
      language,
      languageCode,
      videoCountRange,
      notes,
    });

    await saveCourse(course);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual course creation: no LLM, no YouTube search — the creator supplies the
// syllabus order, sub-topic titles and YouTube links themselves.
coursesRouter.post('/manual', async (req, res) => {
  const { topic, level, language, languageCode, notes, syllabus } = req.body || {};
  if (!topic || !level || !language || !languageCode) {
    return res.status(400).json({ error: 'topic, level, language and languageCode are required' });
  }
  if (!Array.isArray(syllabus) || syllabus.length === 0) {
    return res.status(400).json({ error: 'At least one sub-topic is required' });
  }

  const parsedSyllabus = [];
  for (const [i, entry] of syllabus.entries()) {
    const subTopicTitle = (entry?.subTopicTitle || '').trim();
    if (!subTopicTitle) {
      return res.status(400).json({ error: `Sub-topic ${i + 1} is missing a title` });
    }
    const video = buildManualVideo(entry);
    if (!video) {
      return res.status(400).json({ error: `Sub-topic ${i + 1}: not a valid YouTube link` });
    }
    parsedSyllabus.push({
      order: i + 1,
      subTopicTitle,
      video,
      userNotes: '',
      completed: false,
    });
  }

  const course = {
    id: crypto.randomUUID(),
    topic,
    level,
    language,
    languageCode,
    videoCountRange: 'manual',
    notes: notes || '',
    source: 'manual',
    createdAt: new Date().toISOString(),
    syllabus: parsedSyllabus,
  };

  await saveCourse(course);
  res.status(201).json(course);
});
