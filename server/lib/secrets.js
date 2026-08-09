// Secure storage for API keys via the OS keychain (keytar). Never persisted in
// plain-text JSON, per CLAUDE.md §4. Falls back to a warning if keytar is
// unavailable (e.g. missing native bindings on an unsupported platform) rather
// than silently writing keys to disk.

const SERVICE = 'lessonhunter';

let keytar;
let keytarLoadError = null;
try {
  keytar = (await import('keytar')).default;
} catch (err) {
  keytarLoadError = err;
}

export function secretsAvailable() {
  return Boolean(keytar);
}

export async function getSecret(name) {
  if (!keytar) return null;
  return keytar.getPassword(SERVICE, name);
}

export async function setSecret(name, value) {
  if (!keytar) {
    throw new Error(
      `Secure key storage unavailable on this system (${keytarLoadError?.message ?? 'keytar failed to load'}). ` +
        'Cannot store API keys safely.'
    );
  }
  return keytar.setPassword(SERVICE, name, value);
}

export async function deleteSecret(name) {
  if (!keytar) return false;
  return keytar.deletePassword(SERVICE, name);
}
