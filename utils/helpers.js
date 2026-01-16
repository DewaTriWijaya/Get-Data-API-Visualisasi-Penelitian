// utils/helpers.js
import crypto from "crypto";

export function generateId(prefix, ...values) {
  const hash = crypto
    .createHash('md5')
    .update(values.join('|'))
    .digest('hex')
    .substring(0, 8);
  return `${prefix}_${hash}`;
}

export function cleanText(text) {
  if (!text) return "";
  return String(text)
    .replace(/\s+/g, ' ')
    .replace(/["\n\r]/g, '')
    .trim();
}

export function normalizeInstitution(inst) {
  if (!inst) return "";
  const normalized = inst.toLowerCase();
  return normalized.includes('komputer indonesia') || 
         normalized.includes('unikom') ? 'UNIKOM' : inst;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryAsync(fn, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`  ⚠️ Retry ${i + 1}/${maxRetries}...`);
      await delay(delayMs * (i + 1));
    }
  }
}