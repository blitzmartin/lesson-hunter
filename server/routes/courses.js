import { Router } from 'express';
import { listCourses, getCourse, saveCourse, deleteCourse, readConfig } from '../lib/store.js';
import { getSecret } from '../lib/secrets.js';
import { generateCourse } from '../lib/courseGenerator.js';

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

coursesRouter.post('/generate', async (req, res) => {
  const { topic, level, language, videoCountRange, notes } = req.body || {};
  if (!topic || !level || !language || !videoCountRange) {
    return res.status(400).json({ error: 'topic, level, language and videoCountRange are required' });
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
      videoCountRange,
      notes,
    });

    await saveCourse(course);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
