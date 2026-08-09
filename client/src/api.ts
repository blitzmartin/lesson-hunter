export type LlmProvider = 'ollama' | 'openai' | 'anthropic' | 'deepseek' | 'gemini';

export interface Config {
  llmProvider: LlmProvider | null;
  ollamaEndpoint: string;
  ollamaModel: string | null;
  onboardingSeen: boolean;
  secretsAvailable: boolean;
  configured: Record<'youtube' | LlmProvider, boolean>;
}

export interface Video {
  youtubeId: string;
  title: string;
  channelName: string;
  durationSeconds: number;
  thumbnailUrl: string;
  viewCount: number;
  publishedAt: string;
  selectionRationale: string;
}

export interface SyllabusEntry {
  order: number;
  subTopicTitle: string;
  video: Video | null;
  userNotes: string;
  completed: boolean;
}

export interface Course {
  id: string;
  topic: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  languageCode: string;
  videoCountRange: string;
  notes: string;
  createdAt: string;
  syllabus: SyllabusEntry[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getConfig: () => request<Config>('/config'),
  updateConfig: (partial: Partial<Config>) =>
    request<Config>('/config', { method: 'PUT', body: JSON.stringify(partial) }),
  setSecret: (name: string, value: string) =>
    request<{ ok: true }>(`/config/secrets/${name}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  testProvider: (provider: string, model?: string) =>
    request<{ ok: boolean; message: string }>(`/config/test/${provider}`, {
      method: 'POST',
      body: JSON.stringify({ model }),
    }),
  ollamaModels: () => request<{ models: string[] }>('/config/ollama/models'),

  listCourses: () => request<Course[]>('/courses'),
  getCourse: (id: string) => request<Course>(`/courses/${id}`),
  deleteCourse: (id: string) => request<void>(`/courses/${id}`, { method: 'DELETE' }),
  updateSyllabusEntry: (courseId: string, order: number, patch: { userNotes?: string; completed?: boolean }) =>
    request<Course>(`/courses/${courseId}/syllabus/${order}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  generateCourse: (payload: {
    topic: string;
    level: string;
    language: string;
    languageCode: string;
    videoCountRange: string;
    notes?: string;
  }) => request<Course>('/courses/generate', { method: 'POST', body: JSON.stringify(payload) }),
};
