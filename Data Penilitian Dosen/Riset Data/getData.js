import fs from "fs";

// =========================
// Helper fetch JSON
// =========================
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error("Fetch error:", url);
    return null;
  }
  return res.json();
}

// =========================
// Cari author OpenAlex
// =========================
async function getAuthorOpenAlex(name) {
  const url = `https://api.openalex.org/authors?search=${encodeURIComponent(name)}`;
  const data = await fetchJSON(url);
  if (!data || !data.results.length) return null;
  return data.results[0]; // best match
}

// =========================
// Ambil works OpenAlex
// =========================
async function getWorks(authorId) {
  const works = [];
  let url = `https://api.openalex.org/works?filter=author.id:${authorId}&per-page=200`;

  while (url) {
    const data = await fetchJSON(url);
    if (!data) break;

    works.push(...data.results);
    url = data.meta.next_cursor
      ? `https://api.openalex.org/works?filter=author.id:${authorId}&per-page=200&cursor=${data.meta.next_cursor}`
      : null;
  }
  return works;
}

// =========================
// Ambil detail Crossref
// =========================
async function getCrossref(doi) {
  const cleanDoi = doi.replace("https://doi.org/", "");
  const url = `https://api.crossref.org/works/${cleanDoi}`;
  const data = await fetchJSON(url);
  return data?.message || null;
}

// =========================
// Klasifikasi publikasi
// =========================
function classifyPublication(openalexType) {
  if (openalexType === "journal-article") return "journal";
  if (openalexType?.includes("book")) return "book";
  return "research";
}

// =========================
// MAIN
// =========================
async function main() {
  const lecturers = JSON.parse(fs.readFileSync("lecturers.json"));
  const rows = [];

  for (const lecturer of lecturers) {
    console.log(`🔍 Processing: ${lecturer.fullname}`);

    const author = await getAuthorOpenAlex(lecturer.fullname);
    if (!author) continue;

    const works = await getWorks(author.id);

    for (const work of works) {
      let publisher = "";
      let issn = "";

      if (work.doi) {
        const crossref = await getCrossref(work.doi);
        if (crossref) {
          publisher = crossref.publisher || "";
          issn = crossref.ISSN ? crossref.ISSN.join(";") : "";
        }
      }

      rows.push({
        nidn: lecturer.nidn,
        fullname: lecturer.fullname,
        title: work.title,
        year: work.publication_year,
        doi: work.doi || "",
        source_type: classifyPublication(work.type),
        citations: work.cited_by_count || 0,
        publisher,
        issn
      });
    }
  }

  // =========================
  // Convert to CSV
  // =========================
  const header = Object.keys(rows[0]).join(",");
  const csv = [
    header,
    ...rows.map(r =>
      Object.values(r)
        .map(v => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
  ].join("\n");

  fs.writeFileSync("output.csv", csv);
  console.log("✅ output.csv berhasil dibuat");
}

main();
