// services/scraper.service.js
import * as cheerio from "cheerio";
import { CONFIG, SINTA_RANKS } from "../config/constants.js";
import { delay, retryAsync } from "../utils/helpers.js";

export async function scrapeSintaJournal(issn) {
  if (!issn) return null;

  try {
    // SINTA API/scraping would go here
    // For now, return mock structure
    await delay(CONFIG.SCRAPER_DELAY);
    return {
      sinta_rank: null,
      accreditation: null,
      sinta_score: null
    };
  } catch (error) {
    return null;
  }
}

export async function scrapeScholarCitations(title) {
  if (!title) return 0;

  try {
    const query = encodeURIComponent(title.substring(0, 100));
    const url = `${CONFIG.SCHOLAR_BASE}/scholar?q=${query}`;
    
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: CONFIG.TIMEOUT
    });

    const $ = cheerio.load(data);
    const citationText = $('.gs_fl a:contains("Cited by")').text();
    const match = citationText.match(/Cited by (\d+)/);
    
    await delay(CONFIG.SCRAPER_DELAY);
    return match ? parseInt(match[1]) : 0;
  } catch (error) {
    return 0;
  }
}

export async function getJournalIndexing(journalName, issn, doi) {
  const indexing = new Set();

  try {
    // Check DOAJ
    if (issn) {
      const doajUrl = `https://doaj.org/api/search/journals/issn:${issn}`;
      try {
        const { data } = await axios.get(doajUrl, { timeout: 5000 });
        if (data.results?.length > 0) indexing.add("DOAJ");
      } catch {}
    }

    // Always add Crossref if DOI exists
    if (doi) indexing.add("Crossref");

    // Google Scholar is assumed for most
    indexing.add("Google Scholar");

    await delay(500);
  } catch (error) {
    indexing.add("Unknown");
  }

  return Array.from(indexing).join("; ");
}