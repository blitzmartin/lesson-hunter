// Provider-agnostic LLM layer. Each provider implements:
//   complete({ apiKey, model, endpoint, system, prompt }) -> Promise<string>
//   testConnection({ apiKey, model, endpoint }) -> Promise<{ ok, message, models? }>
// Cloud providers require apiKey (from OS keychain, see secrets.js). Ollama
// requires only a reachable local endpoint.

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const message = json?.error?.message || json?.error || json?.message || res.statusText;
    throw new Error(`${res.status} ${message}`);
  }
  return json;
}

const ollama = {
  async listModels({ endpoint }) {
    const json = await fetchJson(`${endpoint.replace(/\/$/, '')}/api/tags`);
    return (json.models || []).map((m) => m.name);
  },
  async complete({ endpoint, model, system, prompt }) {
    const json = await fetchJson(`${endpoint.replace(/\/$/, '')}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
      }),
    });
    return json.response;
  },
  async testConnection({ endpoint }) {
    try {
      const models = await ollama.listModels({ endpoint });
      return { ok: true, message: `Connected. ${models.length} model(s) installed.`, models };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },
};

const openai = {
  async complete({ apiKey, model, system, prompt }) {
    const json = await fetchJson('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    return json.choices?.[0]?.message?.content ?? '';
  },
  async testConnection({ apiKey, model }) {
    try {
      const reply = await openai.complete({
        apiKey,
        model,
        system: 'Reply with the single word: ok',
        prompt: 'ping',
      });
      return { ok: true, message: `Connected. Model replied: "${reply.trim().slice(0, 40)}"` };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },
};

const anthropic = {
  async complete({ apiKey, model, system, prompt }) {
    const json = await fetchJson('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-5',
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    return json.content?.map((c) => c.text).join('') ?? '';
  },
  async testConnection({ apiKey, model }) {
    try {
      const reply = await anthropic.complete({
        apiKey,
        model,
        system: 'Reply with the single word: ok',
        prompt: 'ping',
      });
      return { ok: true, message: `Connected. Model replied: "${reply.trim().slice(0, 40)}"` };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },
};

const deepseek = {
  async complete({ apiKey, model, system, prompt }) {
    const json = await fetchJson('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'deepseek-chat',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    return json.choices?.[0]?.message?.content ?? '';
  },
  async testConnection({ apiKey, model }) {
    try {
      const reply = await deepseek.complete({
        apiKey,
        model,
        system: 'Reply with the single word: ok',
        prompt: 'ping',
      });
      return { ok: true, message: `Connected. Model replied: "${reply.trim().slice(0, 40)}"` };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },
};

const gemini = {
  async complete({ apiKey, model, system, prompt }) {
    const m = model || 'gemini-2.0-flash';
    const json = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    );
    return json.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  },
  async testConnection({ apiKey, model }) {
    try {
      const reply = await gemini.complete({
        apiKey,
        model,
        system: 'Reply with the single word: ok',
        prompt: 'ping',
      });
      return { ok: true, message: `Connected. Model replied: "${reply.trim().slice(0, 40)}"` };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  },
};

export const PROVIDERS = { ollama, openai, anthropic, deepseek, gemini };

export function getProvider(name) {
  const provider = PROVIDERS[name];
  if (!provider) throw new Error(`Unknown LLM provider: ${name}`);
  return provider;
}
