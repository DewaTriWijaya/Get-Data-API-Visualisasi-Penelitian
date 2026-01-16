import fs from "fs";
import { searchAuthorByName, getWorksByAuthor } from "../services/openalex.service.js";
import { getCrossrefByDOI } from "../services/crossref.service.js";
import { exportCSV } from "../exporters/csv.exporter.js";

const lecturers = JSON.parse(fs.readFileSync("lecturers_updated.json"));

export async function buildUnifiedDataset() {
  const authors = [];
  const publications = [];
  const metrics = [];

  for (const lec of lecturers) {
    const author = await searchAuthorByName(lec.fullname);
    if (!author) continue;

    const works = await getWorksByAuthor(author.id);
    let totalCitations = 0;

    authors.push({
      nidn: lec.nidn,
      name: author.display_name,
      openalex_id: author.id,
      institution: author.last_known_institution?.display_name || "",
      works_count: author.works_count,
      cited_by_count: author.cited_by_count,
      h_index: author.summary_stats?.h_index || 0,
      i10_index: author.summary_stats?.i10_index || 0
    });

    for (const w of works) {
      const cr = w.doi ? await getCrossrefByDOI(w.doi) : null;

      totalCitations += w.cited_by_count || 0;

      publications.push({
        nidn: lec.nidn,
        author: lec.fullname,
        title: w.title,
        year: w.publication_year,
        journal: w.host_venue?.display_name || "",
        doi: w.doi || "",
        citations: w.cited_by_count || 0,
        publisher: cr?.publisher || "",
        issn: cr?.ISSN?.join(";") || ""
      });
    }

    metrics.push({
      nidn: lec.nidn,
      author: lec.fullname,
      total_publications: works.length,
      total_citations: totalCitations,
      avg_citations:
        works.length ? (totalCitations / works.length).toFixed(2) : 0
    });
  }

  exportCSV("output/authors.csv", authors);
  exportCSV("output/publications.csv", publications);
  exportCSV("output/metrics.csv", metrics);

  console.log("✅ DATA TERPADU BERHASIL DIBUAT");
}
