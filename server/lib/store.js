import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { dataDir, coursesDir, configFile } from './paths.js';

const DEFAULT_CONFIG = {
  llmProvider: null, // 'ollama' | 'openai' | 'anthropic' | 'deepseek' | 'gemini'
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: null,
  lastPort: null,
  onboardingSeen: false,
};

async function ensureDirs() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(coursesDir, { recursive: true });
}

export async function readConfig() {
  await ensureDirs();
  try {
    const raw = await fs.readFile(configFile, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    if (err.code === 'ENOENT') return { ...DEFAULT_CONFIG };
    throw err;
  }
}

export async function writeConfig(partial) {
  await ensureDirs();
  const current = await readConfig();
  const next = { ...current, ...partial };
  await fs.writeFile(configFile, JSON.stringify(next, null, 2));
  return next;
}

export async function listCourses() {
  await ensureDirs();
  const files = await fs.readdir(coursesDir);
  const courses = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(coursesDir, file), 'utf-8');
    courses.push(JSON.parse(raw));
  }
  courses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return courses;
}

export async function getCourse(id) {
  await ensureDirs();
  try {
    const raw = await fs.readFile(path.join(coursesDir, `${id}.json`), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

export async function saveCourse(course) {
  await ensureDirs();
  const withId = course.id ? course : { ...course, id: crypto.randomUUID() };
  await fs.writeFile(
    path.join(coursesDir, `${withId.id}.json`),
    JSON.stringify(withId, null, 2)
  );
  return withId;
}

export async function deleteCourse(id) {
  await ensureDirs();
  try {
    await fs.unlink(path.join(coursesDir, `${id}.json`));
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') return false;
    throw err;
  }
}
