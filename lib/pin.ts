// Parent-gate PIN helpers.
//
// This is a family-friendliness gate — it stops a kid from poking at parent
// settings on an already-signed-in device. It is NOT high-security: the
// account itself is protected by Supabase auth + RLS, and the PIN lives in
// localStorage on this device only. We still hash it (SHA-256 + a per-user
// random salt) so the raw PIN is never stored in plain text.

export interface PinRecord {
  hash: string;
  salt: string;
}

const keyFor = (userId: string) => `lello:pin:${userId}`;

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getStoredPin(userId: string): PinRecord | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.hash === 'string' && typeof parsed.salt === 'string') {
      return parsed as PinRecord;
    }
    return null;
  } catch {
    return null;
  }
}

export function storePin(userId: string, hash: string, salt: string): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify({ hash, salt }));
  } catch {
    /* ignore */
  }
}

export function clearStoredPin(userId: string): void {
  try {
    localStorage.removeItem(keyFor(userId));
  } catch {
    /* ignore */
  }
}
