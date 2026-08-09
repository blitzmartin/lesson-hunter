import { useEffect, useState } from 'react';
import { api, type Config, type LlmProvider } from '../api';

const CLOUD_PROVIDERS: { id: LlmProvider; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'gemini', label: 'Gemini' },
];

function detectBrowser(): 'chromium' | 'safari' | 'firefox' | 'other' {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium')) return 'safari';
  if (ua.includes('Chrome') || ua.includes('Chromium') || ua.includes('Edg')) return 'chromium';
  return 'other';
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${ok ? 'bg-ink' : 'bg-line'}`}
      title={ok ? 'Configured' : 'Not configured'}
    />
  );
}

function TestResult({ result }: { result: { ok: boolean; message: string } | null }) {
  if (!result) return null;
  return (
    <p className={`font-mono text-xs mt-2 ${result.ok ? 'text-ink' : 'text-muted'}`}>
      {result.ok ? '✓ ' : '✕ '}
      {result.message}
    </p>
  );
}

export default function Setup() {
  const [config, setConfig] = useState<Config | null>(null);
  const [browser] = useState(detectBrowser());
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const refresh = () => api.getConfig().then(setConfig);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (config?.llmProvider === 'ollama') {
      api
        .ollamaModels()
        .then((r) => setOllamaModels(r.models))
        .catch(() => setOllamaModels([]));
    }
  }, [config?.llmProvider, config?.ollamaEndpoint]);

  if (!config) return <p className="font-mono text-sm text-muted-2">Loading…</p>;

  const selectProvider = async (provider: LlmProvider) => {
    const next = await api.updateConfig({ llmProvider: provider });
    setConfig(next);
  };

  const saveOllamaEndpoint = async (endpoint: string) => {
    const next = await api.updateConfig({ ollamaEndpoint: endpoint });
    setConfig(next);
  };

  const saveOllamaModel = async (model: string) => {
    const next = await api.updateConfig({ ollamaModel: model });
    setConfig(next);
  };

  const saveKey = async (name: string) => {
    const value = keyInputs[name];
    if (!value) return;
    setSaving(name);
    try {
      await api.setSecret(name, value);
      setKeyInputs((prev) => ({ ...prev, [name]: '' }));
      await refresh();
    } finally {
      setSaving(null);
    }
  };

  const testProvider = async (provider: string, model?: string) => {
    const result = await api.testProvider(provider, model);
    setTestResults((prev) => ({ ...prev, [provider]: result }));
  };

  return (
    <div className="max-w-2xl space-y-16">
      <div>
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6">
          01 — LLM provider
        </div>
        <p className="text-muted mt-4">
          Choose one provider to use across the whole app. Local models via Ollama need no API key but may be
          weaker at video-matching reasoning than cloud models.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {(['ollama', ...CLOUD_PROVIDERS.map((p) => p.id)] as LlmProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => selectProvider(p)}
              className={`font-mono uppercase tracking-wider text-sm rounded-full px-5 py-2.5 border-2 border-ink transition-colors ${
                config.llmProvider === p ? 'bg-ink text-paper' : 'text-ink hover:bg-ink hover:text-paper'
              }`}
            >
              {p === 'ollama' ? 'Ollama (local)' : CLOUD_PROVIDERS.find((c) => c.id === p)?.label}
            </button>
          ))}
        </div>

        {config.llmProvider === 'ollama' && (
          <div className="mt-8 bg-paper border border-line p-8 space-y-4">
            <label className="block">
              <span className="font-mono uppercase tracking-widest text-xs text-muted-2">Endpoint</span>
              <input
                className="mt-2 w-full border border-line bg-paper px-4 py-3 font-mono text-sm"
                defaultValue={config.ollamaEndpoint}
                onBlur={(e) => saveOllamaEndpoint(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="font-mono uppercase tracking-widest text-xs text-muted-2">Model</span>
              <select
                className="mt-2 w-full border border-line bg-paper px-4 py-3 font-mono text-sm"
                value={config.ollamaModel ?? ''}
                onChange={(e) => saveOllamaModel(e.target.value)}
              >
                <option value="" disabled>
                  {ollamaModels.length ? 'Select a model' : 'No models found'}
                </option>
                {ollamaModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => testProvider('ollama')}
              className="font-mono uppercase tracking-wider text-xs rounded-full border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
            >
              Test connection
            </button>
            <TestResult result={testResults.ollama} />
          </div>
        )}

        {config.llmProvider && CLOUD_PROVIDERS.some((c) => c.id === config.llmProvider) && (
          <div className="mt-8 bg-paper border border-line p-8 space-y-4">
            <div className="flex items-center gap-2">
              <StatusDot ok={config.configured[config.llmProvider]} />
              <span className="font-mono uppercase tracking-widest text-xs text-muted-2">API key</span>
            </div>
            <div className="flex gap-3">
              <input
                type="password"
                placeholder="Paste API key"
                className="flex-1 border border-line bg-paper px-4 py-3 font-mono text-sm"
                value={keyInputs[config.llmProvider] ?? ''}
                onChange={(e) =>
                  setKeyInputs((prev) => ({ ...prev, [config.llmProvider as string]: e.target.value }))
                }
              />
              <button
                onClick={() => saveKey(config.llmProvider as string)}
                disabled={saving === config.llmProvider}
                className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-5 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                Save
              </button>
            </div>
            <button
              onClick={() => testProvider(config.llmProvider as string)}
              className="font-mono uppercase tracking-wider text-xs rounded-full border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
            >
              Test connection
            </button>
            <TestResult result={testResults[config.llmProvider]} />
            {!config.secretsAvailable && (
              <p className="font-mono text-xs text-muted">
                Secure key storage isn't available on this system — keys can't be saved safely here.
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6">
          02 — YouTube Data API key
        </div>
        <div className="flex items-center gap-2 mt-4">
          <StatusDot ok={config.configured.youtube} />
          <span className="font-mono uppercase tracking-widest text-xs text-muted-2">
            {config.configured.youtube ? 'Configured' : 'Not configured'}
          </span>
        </div>
        <p className="text-muted mt-4">
          Search calls cost 100 quota units against a 10,000/day default budget — generating many or large
          courses in one day can hit that limit. That's expected, not a bug.{' '}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Generate your own key in Google Cloud Console →
          </a>
        </p>
        <div className="mt-6 bg-paper border border-line p-8 space-y-4">
          <div className="flex gap-3">
            <input
              type="password"
              placeholder="Paste YouTube Data API key"
              className="flex-1 border border-line bg-paper px-4 py-3 font-mono text-sm"
              value={keyInputs.youtube ?? ''}
              onChange={(e) => setKeyInputs((prev) => ({ ...prev, youtube: e.target.value }))}
            />
            <button
              onClick={() => saveKey('youtube')}
              disabled={saving === 'youtube'}
              className="font-mono uppercase tracking-wider text-sm rounded-full bg-ink text-paper px-5 py-2.5 hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              Save
            </button>
          </div>
          <button
            onClick={() => testProvider('youtube')}
            className="font-mono uppercase tracking-wider text-xs rounded-full border-2 border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
          >
            Test connection
          </button>
          <TestResult result={testResults.youtube} />
        </div>
      </div>

      <div>
        <div className="font-mono uppercase tracking-widest text-sm text-muted-2 border-t-2 border-ink pt-6">
          03 — Ad-free embedded playback
        </div>
        {browser === 'chromium' && (
          <p className="text-muted mt-4">
            You're on a Chromium-based browser. Ad-free playback for YouTube Premium works inside embedded
            videos here <strong>if third-party cookies are allowed</strong> for youtube.com — check
            chrome://settings/content/cookies if ads show up despite Premium.
          </p>
        )}
        {(browser === 'safari' || browser === 'firefox') && (
          <p className="text-muted mt-4">
            Your browser blocks third-party cookies by default (
            {browser === 'safari' ? 'Intelligent Tracking Prevention' : 'Enhanced Tracking Protection'}), so
            ad-free embedded playback is <strong>not supported</strong> here — embedded videos will show
            standard YouTube ads even with Premium.
          </p>
        )}
        {browser === 'other' && (
          <p className="text-muted mt-4">
            We couldn't confidently detect your browser. Ad-free embedded playback depends on your
            browser's third-party cookie policy for youtube.com.
          </p>
        )}
        <p className="text-muted mt-2">
          Every video also has an <strong>"Open on YouTube"</strong> button that opens the real
          youtube.com page in a new tab — this always guarantees ad-free Premium playback, at the cost of
          leaving the in-app experience.
        </p>
      </div>
    </div>
  );
}
