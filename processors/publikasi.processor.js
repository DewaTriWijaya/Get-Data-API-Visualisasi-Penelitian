// processors/publikasi.processor.js
import { generateId, cleanText } from "../utils/helpers.js";
import { getCrossrefByDOI } from "../services/crossref.service.js";
import { getJournalIndexing } from "../services/scraper.service.js";

export async function processPublikasi(work, dosenId) {
  const crossref = work.doi ? await getCrossrefByDOI(work.doi) : null;
  const primaryLocation = work.primary_location || {};
  const source = primaryLocation.source || {};
  
  const journalName = source.display_name || crossref?.["container-title"]?.[0] || "Unknown";
  const issn = extractISSN(crossref, source);
  const indexing = await getJournalIndexing(journalName, issn, work.doi);
  
  const publikasiId = generateId('PUB', work.id);
  const jurnalId = generateId('JRN', journalName, issn);
  
  return {
    publikasi_id: publikasiId,
    jurnal_id: jurnalId,
    openalex_id: work.id,
    judul: cleanText(work.title),
    tahun: work.publication_year || "",
    doi: work.doi || "",
    sitasi: work.cited_by_count || 0,
    jumlah_penulis: work.authorships?.length || 0,
    indeksasi: indexing,
    
    // Additional metadata
    type: work.type || "",
    open_access: work.open_access?.is_oa ? "Yes" : "No",
    publisher: crossref?.publisher || source.host_organization_name || "",
    
    // Journal details
    journal_name: journalName,
    issn: issn,
    volume: crossref?.volume || work.biblio?.volume || "",
    issue: crossref?.issue || work.biblio?.issue || "",
    pages: extractPages(crossref, work.biblio)
  };
}

export function processDosenPublikasi(work, dosenId, authorName) {
  const authorships = work.authorships || [];
  const dosenAuthorship = authorships.find(a => 
    a.author?.display_name?.toLowerCase() === authorName.toLowerCase()
  );
  
  if (!dosenAuthorship) return null;
  
  const position = dosenAuthorship.author_position || "";
  let peran = "ko-penulis";
  if (position === "first") peran = "penulis utama";
  else if (position === "last") peran = "corresponding author";
  
  return {
    dosen_id: dosenId,
    publikasi_id: generateId('PUB', work.id),
    peran: peran,
    author_position: position,
    institutions: dosenAuthorship.institutions?.map(i => i.display_name).join("; ") || ""
  };
}

export function processJurnal(journalName, issn, publications) {
  const jurnalId = generateId('JRN', journalName, issn);
  
  // Determine accreditation based on indexing and source
  let akreditasi = "Non-akreditasi";
  const allIndexing = publications.map(p => p.indeksasi).join(" ");
  
  if (allIndexing.includes("Scopus") || allIndexing.includes("WoS")) {
    akreditasi = "Internasional (Bereputasi)";
  } else if (allIndexing.includes("DOAJ")) {
    akreditasi = "Internasional";
  } else if (issn && issn.match(/^\d{4}-\d{3}[\dX]$/)) {
    // Indonesian ISSN pattern check (rough)
    akreditasi = "SINTA";
  }
  
  const avgCitations = publications.length > 0 ?
    publications.reduce((sum, p) => sum + p.sitasi, 0) / publications.length : 0;
  
  return {
    jurnal_id: jurnalId,
    nama_jurnal: journalName,
    issn: issn,
    akreditasi: akreditasi,
    sinta_rank: null, // Would need SINTA scraping
    total_publications: publications.length,
    avg_citations: avgCitations.toFixed(2),
    indexing: publications[0]?.indeksasi || ""
  };
}

function extractISSN(crossref, source) {
  const issns = [];
  if (crossref?.ISSN) issns.push(...crossref.ISSN);
  if (source?.issn) issns.push(...source.issn);
  if (source?.issn_l) issns.push(source.issn_l);
  return [...new Set(issns)].join("; ");
}

function extractPages(crossref, biblio) {
  if (crossref?.page) return crossref.page;
  if (biblio?.first_page && biblio?.last_page) {
    return `${biblio.first_page}-${biblio.last_page}`;
  }
  return "";
}