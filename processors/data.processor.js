// processors/data.processor.js
import { scrapeDOIPage } from "../utils/scraper.js";
import { enrichWithCrossref } from "../services/crossref.service.js";
import { determineIndexing, estimateJournalQuality, extractISSN } from "../services/journal.service.js";

export async function processAuthor(author, institution) {
  const faculty = determineFaculty(author.x_concepts);
  
  return {
    author_id: author.id,
    openalex_id: author.id.replace('https://openalex.org/', ''),
    name: author.display_name,
    orcid: author.orcid || "",
    institution: institution?.display_name || "Universitas Komputer Indonesia",
    institution_id: institution?.id || "",
    faculty: faculty,
    department: "", // Could be enriched from other sources
    total_works: author.works_count || 0,
    total_citations: author.cited_by_count || 0,
    h_index: author.summary_stats?.h_index || 0,
    i10_index: author.summary_stats?.i10_index || 0,
    two_year_mean_citedness: author.summary_stats?.["2yr_mean_citedness"] || 0,
    research_areas: extractResearchAreas(author.x_concepts)
  };
}

export async function processPublication(work, authorNIDN, authorName, scrapeDOI = true) {
  // Enrich with Crossref
  const enrichedWork = await enrichWithCrossref(work);
  const crossref = enrichedWork.crossref_data;
  
  // Scrape DOI page if enabled
  let scrapedData = null;
  if (scrapeDOI && work.doi) {
    console.log(`🔍 Scraping DOI: ${work.doi}`);
    scrapedData = await scrapeDOIPage(work.doi);
  }
  
  const primaryLocation = work.primary_location || {};
  const source = primaryLocation.source || {};
  
  return {
    work_id: work.id,
    openalex_id: work.id?.replace('https://openalex.org/', '') || "",
    author_nidn: authorNIDN || "",
    author_name: authorName,
    title: work.title || "",
    publication_year: work.publication_year || "",
    publication_date: work.publication_date || "",
    type: work.type || "",
    
    // Journal info
    journal_name: source.display_name || "",
    journal_id: source.id || "",
    publisher: crossref?.publisher || source.host_organization_name || "",
    issn: extractISSN(crossref, source),
    
    // Volume/Issue info
    volume: crossref?.volume || work.biblio?.volume || "",
    issue: crossref?.issue || work.biblio?.issue || "",
    first_page: crossref?.page || work.biblio?.first_page || "",
    last_page: work.biblio?.last_page || "",
    
    // Identifiers
    doi: work.doi || "",
    doi_url: work.doi ? `https://doi.org/${work.doi}` : "",
    openalex_url: work.id || "",
    
    // Quality metrics
    indexing: determineIndexing(work.locations, primaryLocation),
    journal_quality: estimateJournalQuality(
      work.cited_by_count || 0,
      work.publication_year,
      work.open_access?.is_oa
    ),
    
    // Citation metrics
    cited_by_count: work.cited_by_count || 0,
    referenced_works_count: work.referenced_works_count || 0,
    
    // Open Access
    is_open_access: work.open_access?.is_oa ? "Yes" : "No",
    oa_status: work.open_access?.oa_status || "",
    oa_url: work.open_access?.oa_url || "",
    
    // Topics & Keywords
    topics: extractTopics(work.topics),
    keywords: work.keywords?.map(k => k.display_name).join("; ") || 
              scrapedData?.keywords || "",
    
    // Scraped data
    abstract: scrapedData?.abstract || "",
    article_type: scrapedData?.article_type || work.type || "",
    full_text_links: scrapedData?.full_text_links || "",
    
    // SDGs
    sdgs: extractSDGs(work.sustainable_development_goals),
    
    // Funding
    grants: extractGrants(work.grants)
  };
}

export function processMetrics(authorData, publications) {
  const totalCitations = publications.reduce((sum, p) => sum + (p.cited_by_count || 0), 0);
  const totalPublications = publications.length;
  
  const yearlyStats = {};
  publications.forEach(pub => {
    const year = pub.publication_year;
    if (!year) return;
    
    if (!yearlyStats[year]) {
      yearlyStats[year] = { count: 0, citations: 0 };
    }
    yearlyStats[year].count++;
    yearlyStats[year].citations += pub.cited_by_count || 0;
  });
  
  return {
    author_nidn: authorData.author_nidn || "",
    author_name: authorData.name,
    openalex_id: authorData.openalex_id,
    faculty: authorData.faculty,
    
    total_publications: totalPublications,
    total_citations: totalCitations,
    h_index: authorData.h_index,
    i10_index: authorData.i10_index,
    
    avg_citations_per_paper: totalPublications > 0 ? 
      (totalCitations / totalPublications).toFixed(2) : 0,
    
    publications_last_5_years: publications.filter(
      p => p.publication_year >= new Date().getFullYear() - 5
    ).length,
    
    citations_last_5_years: publications
      .filter(p => p.publication_year >= new Date().getFullYear() - 5)
      .reduce((sum, p) => sum + (p.cited_by_count || 0), 0),
    
    most_cited_paper: publications.length > 0 ?
      publications.reduce((max, p) => 
        (p.cited_by_count || 0) > (max.cited_by_count || 0) ? p : max
      ).title : "",
    
    most_cited_paper_citations: publications.length > 0 ?
      Math.max(...publications.map(p => p.cited_by_count || 0)) : 0,
    
    first_publication_year: publications.length > 0 ?
      Math.min(...publications.map(p => p.publication_year || 9999)) : "",
    
    latest_publication_year: publications.length > 0 ?
      Math.max(...publications.map(p => p.publication_year || 0)) : "",
    
    open_access_percentage: totalPublications > 0 ?
      ((publications.filter(p => p.is_open_access === "Yes").length / totalPublications) * 100).toFixed(1) : 0
  };
}

// Helper functions
function determineFaculty(concepts) {
  if (!concepts || concepts.length === 0) return "Unknown";
  
  const topConcept = concepts[0]?.display_name || "";
  
  const facultyMap = {
    "Computer Science": "Fakultas Teknik dan Ilmu Komputer",
    "Engineering": "Fakultas Teknik dan Ilmu Komputer",
    "Mathematics": "Fakultas Teknik dan Ilmu Komputer",
    "Business": "Fakultas Ekonomi dan Bisnis",
    "Economics": "Fakultas Ekonomi dan Bisnis",
    "Management": "Fakultas Ekonomi dan Bisnis",
    "Law": "Fakultas Hukum",
    "Communication": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "Political Science": "Fakultas Ilmu Sosial dan Ilmu Politik",
    "Design": "Fakultas Desain",
    "Art": "Fakultas Desain"
  };
  
  for (const [key, faculty] of Object.entries(facultyMap)) {
    if (topConcept.includes(key)) return faculty;
  }
  
  return "Fakultas Lainnya";
}

function extractResearchAreas(concepts) {
  if (!concepts || concepts.length === 0) return "";
  return concepts.slice(0, 5).map(c => c.display_name).join("; ");
}

function extractTopics(topics) {
  if (!topics || topics.length === 0) return "";
  return topics.slice(0, 3).map(t => t.display_name).join("; ");
}

function extractSDGs(sdgs) {
  if (!sdgs || sdgs.length === 0) return "";
  return sdgs.map(s => s.display_name).join("; ");
}

function extractGrants(grants) {
  if (!grants || grants.length === 0) return "";
  return grants.slice(0, 3).map(g => g.funder_display_name).join("; ");
}