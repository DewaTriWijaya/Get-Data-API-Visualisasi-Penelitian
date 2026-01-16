// utils/scraper.js
import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeDOIPage(doi) {
  if (!doi) return null;
  
  try {
    const url = `https://doi.org/${doi}`;
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    const $ = cheerio.load(data);
    
    return {
      abstract: extractAbstract($),
      keywords: extractKeywords($),
      references_count: extractReferencesCount($),
      full_text_links: extractFullTextLinks($),
      article_type: extractArticleType($),
      page_range: extractPageRange($),
      volume_issue: extractVolumeIssue($)
    };
  } catch (error) {
    console.log(`⚠️ Failed to scrape DOI: ${doi}`);
    return null;
  }
}

function extractAbstract($) {
  const selectors = [
    'meta[name="description"]',
    'meta[name="dc.description"]',
    'meta[property="og:description"]',
    '.abstract',
    '#abstract',
    'section[class*="abstract"]'
  ];
  
  for (const sel of selectors) {
    const text = $(sel).attr('content') || $(sel).text();
    if (text && text.length > 50) return text.trim().substring(0, 1000);
  }
  return "";
}

function extractKeywords($) {
  const selectors = [
    'meta[name="keywords"]',
    'meta[name="dc.subject"]',
    '.keywords',
    '#keywords'
  ];
  
  for (const sel of selectors) {
    const text = $(sel).attr('content') || $(sel).text();
    if (text) return text.trim();
  }
  return "";
}

function extractReferencesCount($) {
  const refs = $('section[class*="references"] li, .references li, #references li');
  return refs.length || 0;
}

function extractFullTextLinks($) {
  const links = [];
  $('a[href*=".pdf"], a:contains("PDF"), a:contains("Full Text")').each((i, el) => {
    const href = $(el).attr('href');
    if (href) links.push(href);
  });
  return links.join("; ");
}

function extractArticleType($) {
  const type = $('meta[name="dc.type"]').attr('content') || 
               $('meta[property="og:type"]').attr('content') || "";
  return type;
}

function extractPageRange($) {
  const pages = $('meta[name="citation_firstpage"]').attr('content');
  const lastPage = $('meta[name="citation_lastpage"]').attr('content');
  if (pages && lastPage) return `${pages}-${lastPage}`;
  return "";
}

function extractVolumeIssue($) {
  const volume = $('meta[name="citation_volume"]').attr('content') || "";
  const issue = $('meta[name="citation_issue"]').attr('content') || "";
  return volume && issue ? `Vol ${volume}, No ${issue}` : "";
}