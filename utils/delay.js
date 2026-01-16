// utils/delay.js
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function rateLimitedCall(fn, delayMs = 1000) {
  await delay(delayMs);
  return await fn();
}