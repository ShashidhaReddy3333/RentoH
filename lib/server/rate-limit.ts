const WINDOW_MS = 60_000;
const MAX = 60;

type RateRecord = { n: number; t: number };

const buckets = new Map<string, RateRecord>();

export function rateLimit(key: string) {
  const now = Date.now();
  const record = buckets.get(key);

  if (!record || now - record.t > WINDOW_MS) {
    buckets.set(key, { n: 1, t: now });
    return true;
  }

  if (record.n >= MAX) {
    return false;
  }

  record.n += 1;
  return true;
}
