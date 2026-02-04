import Redis from 'ioredis';

export async function scanKeys(redis: Redis, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  const stream = redis.scanStream({ match: pattern, count: 100 });

  return new Promise((resolve, reject) => {
    stream.on('data', (batch: string[]) => keys.push(...batch));
    stream.on('end', () => resolve(keys));
    stream.on('error', reject);
  });
}
