#!/usr/bin/env node
import { startServer } from '../server/index.js';

startServer({ openBrowser: true }).catch((err) => {
  console.error('Failed to start LessonHunter:', err);
  process.exit(1);
});
