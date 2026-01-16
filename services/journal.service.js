// services/journal.service.js
export function determineIndexing(locations, primaryLocation) {
  const indexing = new Set();
  
  // Check OpenAlex indexing
  if (primaryLocation?.source?.id) {
    const sourceId = primaryLocation.source.id;
    if (sourceId.includes('scopus')) indexing.add('Scopus');
    if (sourceId.includes('pubmed')) indexing.add('PubMed');
  }

  // Check all locations
  locations?.forEach(loc => {
    if (loc.source?.id) {
      const id = loc.source.id.toLowerCase();
      if (id.includes('scopus')) indexing.add('Scopus');
      if (id.includes('pubmed')) indexing.add('PubMed');
      if (id.includes('doaj')) indexing.add('DOAJ');
      if (id.includes('crossref')) indexing.add('Crossref');
    }
  });

  return Array.from(indexing).join("; ") || "None";
}

export function estimateJournalQuality(citedByCount, year, openAccess) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - (year || currentYear);
  
  // Normalize citations by age
  const normalizedCitations = age > 0 ? citedByCount / age : citedByCount;
  
  if (normalizedCitations > 20) return "Q1 (Estimated)";
  if (normalizedCitations > 10) return "Q2 (Estimated)";
  if (normalizedCitations > 5) return "Q3 (Estimated)";
  if (normalizedCitations > 0) return "Q4 (Estimated)";
  return "Unranked";
}

export function extractISSN(crossrefData, openAlexSource) {
  const issns = [];
  
  if (crossrefData?.ISSN) {
    issns.push(...crossrefData.ISSN);
  }
  
  if (openAlexSource?.issn) {
    issns.push(...openAlexSource.issn);
  }
  
  if (openAlexSource?.issn_l) {
    issns.push(openAlexSource.issn_l);
  }
  
  return [...new Set(issns)].join("; ");
}