import { Router } from 'express';
import { readConfig, writeConfig } from '../lib/store.js';
import { getSecret, setSecret, secretsAvailable } from '../lib/secrets.js';
import { getProvider, PROVIDERS } from '../lib/llm/providers.js';
import { testConnection as testYoutube } from '../lib/youtube.js';

export const configRouter = Router();

const CLOUD_PROVIDERS = ['openai', 'anthropic', 'deepseek', 'gemini'];
const SECRET_KEYS = { youtube: 'youtube-api-key', openai: 'openai-api-key', anthropic: 'anthropic-api-key', deepseek: 'deepseek-api-key', gemini: 'gemini-api-key' };

// GET /api/config — current settings + whether each secret is set (never returns key values)
configRouter.get('/', async (req, res) => {
  const config = await readConfig();
  const status = {};
  for (const [name, secretKey] of Object.entries(SECRET_KEYS)) {
    status[name] = Boolean(await getSecret(secretKey));
  }
  res.json({ ...config, secretsAvailable: secretsAvailable(), configured: status });
});

configRouter.put('/', async (req, res) => {
  const { llmProvider, ollamaEndpoint, ollamaModel, onboardingSeen } = req.body || {};
  const next = await writeConfig({
    ...(llmProvider !== undefined ? { llmProvider } : {}),
    ...(ollamaEndpoint !== undefined ? { ollamaEndpoint } : {}),
    ...(ollamaModel !== undefined ? { ollamaModel } : {}),
    ...(onboardingSeen !== undefined ? { onboardingSeen } : {}),
  });
  res.json(next);
});

// PUT /api/config/secrets/:name  { value }
configRouter.put('/secrets/:name', async (req, res) => {
  const { name } = req.params;
  const { value } = req.body || {};
  const secretKey = SECRET_KEYS[name];
  if (!secretKey) return res.status(400).json({ error: `Unknown secret: ${name}` });
  if (!value) return res.status(400).json({ error: 'Missing value' });
  try {
    await setSecret(secretKey, value);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/test/:provider — test-connection ping for an LLM provider or 'youtube'
configRouter.post('/test/:provider', async (req, res) => {
  const { provider } = req.params;
  try {
    if (provider === 'youtube') {
      const apiKey = await getSecret(SECRET_KEYS.youtube);
      if (!apiKey) return res.json({ ok: false, message: 'No YouTube API key saved yet.' });
      return res.json(await testYoutube(apiKey));
    }

    if (provider === 'ollama') {
      const config = await readConfig();
      const result = await getProvider('ollama').testConnection({ endpoint: config.ollamaEndpoint });
      return res.json(result);
    }

    if (!CLOUD_PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }

    const apiKey = await getSecret(SECRET_KEYS[provider]);
    if (!apiKey) return res.json({ ok: false, message: `No API key saved for ${provider} yet.` });
    const model = req.body?.model;
    const result = await getProvider(provider).testConnection({ apiKey, model });
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

configRouter.get('/ollama/models', async (req, res) => {
  try {
    const config = await readConfig();
    const models = await PROVIDERS.ollama.listModels({ endpoint: config.ollamaEndpoint });
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
