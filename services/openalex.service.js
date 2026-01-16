// ============================================================
// SERVICES - OPENALEX
// ============================================================

// services/openalex.service.js
import axios from "axios";
import { CONFIG } from "../config/constants.js";
import { delay, retryAsync } from "../utils/helpers.js";

const cache = new Map();

export async function getUnikomAuthors(cursor = "*") {
  const cacheKey = `authors_${cursor}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const result = await retryAsync(async () => {
    const { data } = await axios.get(`${CONFIG.OPENALEX_BASE}/authors`, {
      params: {
        filter: `last_known_institutions.id:${CONFIG.UNIKOM_ID}`,
        "per-page": 200,
        cursor: cursor
      },
      timeout: CONFIG.TIMEOUT
    });
    return data;
  });

  cache.set(cacheKey, result);
  await delay(CONFIG.OPENALEX_DELAY);
  return result;
}

export async function getAllUnikomAuthors() {
  let allAuthors = [];
  let cursor = "*";
  let page = 1;

  while (cursor) {
    console.log(`  📥 Fetching authors page ${page}...`);
    const data = await getUnikomAuthors(cursor);
    allAuthors.push(...data.results);
    cursor = data.meta?.next_cursor || null;
    page++;
    if (page > 100) break; // Safety
  }

  return allAuthors;
}

export async function getWorksByAuthor(authorId) {
  const cacheKey = `works_${authorId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let allWorks = [];
  let cursor = "*";

  while (cursor) {
    const result = await retryAsync(async () => {
      const { data } = await axios.get(`${CONFIG.OPENALEX_BASE}/works`, {
        params: {
          filter: `author.id:${authorId}`,
          "per-page": 200,
          cursor: cursor
        },
        timeout: CONFIG.TIMEOUT
      });
      return data;
    });

    allWorks.push(...result.results);
    cursor = result.meta?.next_cursor || null;
    await delay(CONFIG.OPENALEX_DELAY);
  }

  cache.set(cacheKey, allWorks);
  return allWorks;
}