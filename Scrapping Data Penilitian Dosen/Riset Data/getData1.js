import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ================= PATH SETUP =================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= LOAD JSON =================
const lecturers = JSON.parse(
  fs.readFileSync(path.join(__dirname, "lecturers.json"), "utf8")
);

// ================= PREPARE OUTPUT =================
fs.mkdirSync(path.join(__dirname, "output"), { recursive: true });

const openalexAuthors = [];
const openalexWorks = [];
const crossrefWorks = [];

// ================= FETCH HELPER =================
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${url}`);
  return res.json();
}

// ================= MAIN PROCESS =================
async function run() {
  for (const lec of lecturers) {
    const name = lec.fullname;
    const nidn = lec.nidn;

    console.log(`Fetching: ${name}`);

    // ========== OPENALEX AUTHOR ==========
    const authorRes = await fetchJSON(
      `https://api.openalex.org/authors?search=${encodeURIComponent(name)}`
    );

    if (!authorRes.results.length) continue;
    const author = authorRes.results[0];

    openalexAuthors.push({
      nidn: nidn,
      name: author.display_name,
      openalex_id: author.id,
      works_count: author.works_count,
      cited_by_count: author.cited_by_count,
      h_index: author.h_index,
      i10_index: author.i10_index,
      institution: author.last_known_institution?.display_name || ""
    });

    // ========== OPENALEX WORKS ==========
    const worksRes = await fetchJSON(
      `https://api.openalex.org/works?filter=author.id:${author.id}&per-page=200`
    );

    for (const work of worksRes.results) {
      openalexWorks.push({
        nidn: nidn,
        author: name,
        title: work.title || "",
        year: work.publication_year || "",
        citations: work.cited_by_count || 0,
        type: work.type || "",
        journal: work.host_venue?.display_name || "",
        open_access: work.open_access?.is_oa ? "Yes" : "No"
      });
    }

    // ========== CROSSREF WORKS ==========
    const crossrefRes = await fetchJSON(
      `https://api.crossref.org/works?query.author=${encodeURIComponent(
        name
      )}&rows=20`
    );

    for (const item of crossrefRes.message.items) {
      crossrefWorks.push({
        nidn: nidn,
        author: name,
        title: item.title?.[0] || "",
        year: item.published?.["date-parts"]?.[0]?.[0] || "",
        journal: item["container-title"]?.[0] || "",
        citations: item["is-referenced-by-count"] || 0
      });
    }
  }

  // ================= EXPORT CSV =================
  exportCSV(
    "output/openalex_authors.csv",
    openalexAuthors,
    [
      "nidn",
      "name",
      "openalex_id",
      "works_count",
      "cited_by_count",
      "h_index",
      "i10_index",
      "institution"
    ]
  );

  exportCSV(
    "output/openalex_works.csv",
    openalexWorks,
    [
      "nidn",
      "author",
      "title",
      "year",
      "citations",
      "type",
      "journal",
      "open_access"
    ]
  );

  exportCSV(
    "output/crossref_works.csv",
    crossrefWorks,
    ["nidn", "author", "title", "year", "journal", "citations"]
  );

  console.log("✅ SEMUA CSV BERHASIL DIBUAT");
}

// ================= CSV HELPER =================
function exportCSV(file, data, headers) {
  const csv =
    headers.join(",") +
    "\n" +
    data
      .map(row =>
        headers
          .map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

  fs.writeFileSync(path.join(__dirname, file), csv);
}

// ================= RUN =================
run();
