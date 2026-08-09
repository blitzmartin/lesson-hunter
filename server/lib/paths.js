import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

export const serverRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const repoRoot = path.dirname(serverRoot);
export const clientDist = path.join(repoRoot, 'client', 'dist');

// Local data directory: OS-appropriate app data location, not inside the repo,
// so config/course data survives `git clean` and works when installed elsewhere.
export const dataDir = path.join(os.homedir(), '.lessonhunter');
export const coursesDir = path.join(dataDir, 'courses');
export const configFile = path.join(dataDir, 'config.json');
