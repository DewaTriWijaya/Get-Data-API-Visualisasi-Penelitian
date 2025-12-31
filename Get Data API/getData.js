import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

const lecturers = JSON.parse(fs.readFileSync("./lecturers.json", "utf-8"));

const authorRows = [];
const journalRows = [];
const indexRows = [];

/* ===================== OPENALEX ===================== */

async function getAuthorFromOpenAlex(name) {
  const url = `https://api.openalex.org/authors?search=${encodeURIComponent(name)}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results?.[0];
}

async function getWorksFromOpenAlex(authorId) {
  const url = `https://api.openalex.org/works?filter=author.id:${authorId}&per-page=25`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

/* ===================== CROSSREF ===================== */

async function getWorkFromCrossref(doi) {
  try {
    const cleanDoi = doi.replace("https://doi.org/", "");
    const url = `https://api.crossref.org/works/${cleanDoi}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.message;
  } catch {
    return null;
  }
}

/* ===================== MAIN ===================== */

async function run() {
  for (const lec of lecturers) {
    console.log(`Mengambil data: ${lec.fullname}`);

    const author = await getAuthorFromOpenAlex(lec.fullname);
    if (!author) continue;

    /* ---------- AUTHOR CSV ---------- */
    authorRows.push({
      author_id: author.id,
      name: author.display_name,
      orcid: author.orcid || "",
      institution: author.last_known_institution?.display_name || "",
      country: author.last_known_institution?.country_code || "",
      works_count: author.works_count,
      cited_by_count: author.cited_by_count,
      h_index: author.summary_stats?.h_index || 0,
      i10_index: author.summary_stats?.i10_index || 0
    });

    /* ---------- INDEX CSV ---------- */
    indexRows.push({
      author_id: author.id,
      total_publications: author.works_count,
      total_citations: author.cited_by_count,
      h_index: author.summary_stats?.h_index || 0,
      i10_index: author.summary_stats?.i10_index || 0,
      avg_citations:
        author.works_count > 0
          ? (author.cited_by_count / author.works_count).toFixed(2)
          : 0
    });

    /* ---------- WORKS CSV ---------- */
    const works = await getWorksFromOpenAlex(author.id);

    for (const w of works) {
      let publisher = "";
      let issn = "";
      let volume = "";
      let issue = "";
      let pages = "";
      let abstract = w.abstract_inverted_index
        ? Object.keys(w.abstract_inverted_index).join(" ")
        : "";

      if (w.doi) {
        const crossref = await getWorkFromCrossref(w.doi);
        if (crossref) {
          publisher = crossref.publisher || "";
          issn = crossref.ISSN?.join(";") || "";
          volume = crossref.volume || "";
          issue = crossref.issue || "";
          pages = crossref.page || "";
          abstract = abstract || crossref.abstract || "";
        }
      }

      journalRows.push({
        work_id: w.id,
        title: w.title,
        year: w.publication_year,
        journal: w.host_venue?.display_name || "",
        publisher,
        issn,
        volume,
        issue,
        pages,
        doi: w.doi || "",
        citation_count: w.cited_by_count || 0,
        abstract,
        author_id: author.id,
        source: w.doi ? "openalex+crossref" : "openalex"
      });
    }
  }

  await writeCSV();
}

/* ===================== CSV WRITER ===================== */

async function writeCSV() {
  const authorWriter = createObjectCsvWriter({
    path: "author.csv",
    header: Object.keys(authorRows[0]).map(k => ({ id: k, title: k }))
  });

  const journalWriter = createObjectCsvWriter({
    path: "jurnal_penelitian.csv",
    header: Object.keys(journalRows[0]).map(k => ({ id: k, title: k }))
  });

  const indexWriter = createObjectCsvWriter({
    path: "index_penelitian.csv",
    header: Object.keys(indexRows[0]).map(k => ({ id: k, title: k }))
  });

  await authorWriter.writeRecords(authorRows);
  await journalWriter.writeRecords(journalRows);
  await indexWriter.writeRecords(indexRows);

  console.log("✅ Semua CSV berhasil dibuat");
}

run();
