import getPort from 'get-port';
import { readConfig, writeConfig } from './store.js';

const PREFERRED_RANGE = [4173, 4174, 4175, 4176];

export async function resolvePort() {
  const config = await readConfig();
  const candidates = config.lastPort ? [config.lastPort, ...PREFERRED_RANGE] : PREFERRED_RANGE;
  const port = await getPort({ port: candidates });
  if (port !== config.lastPort) {
    await writeConfig({ lastPort: port });
  }
  return port;
}
