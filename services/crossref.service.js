// ============================================================
// SERVICES - CROSSREF
// ============================================================

// services/crossref.service.js
import { CONFIG } from "../config/constants.js";
import { delay, retryAsync } from "../utils/helpers.js";

const crossrefCache = new Map();

export async function getCrossrefByDOI(doi) {
  if (!doi) return null;
  
  const clean = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
  if (crossrefCache.has(clean)) return crossrefCache.get(clean);

  try {
    const result = await retryAsync(async () => {
      const { data } = await axios.get(`${CONFIG.CROSSREF_BASE}/${clean}`, {
        timeout: CONFIG.TIMEOUT
      });
      return data.message;
    });

    crossrefCache.set(clean, result);
    await delay(CONFIG.CROSSREF_DELAY);
    return result;
  } catch (error) {
    return null;
  }
}