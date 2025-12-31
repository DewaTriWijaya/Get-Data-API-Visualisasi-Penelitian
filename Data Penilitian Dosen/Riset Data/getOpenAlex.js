import fs from "fs";

const lecturers = JSON.parse(fs.readFileSync("lecture.json"));

async function fetchJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function run() {
  const results = [];

  for (const lec of lecturers.lecturers) {
    const authorRes = await fetchJSON(
      `https://api.openalex.org/authors?search=${encodeURIComponent(lec.name)}`
    );

    const author = authorRes.results[0];
    if (!author) continue;

    const worksRes = await fetchJSON(
      `https://api.openalex.org/works?filter=author.id:${author.id}`
    );

    for (const work of worksRes.results) {
      results.push({
        lecturer: lec.name,
        title: work.title,
        year: work.publication_year,
        citations: work.cited_by_count,
        type: work.type,
        journal: work.host_venue?.display_name || ""
      });
    }
  }

  fs.writeFileSync(
    "openalex_works.csv",
    "lecturer,title,year,citations,type,journal\n" +
      results.map(r =>
        `"${r.lecturer}","${r.title}",${r.year},${r.citations},${r.type},"${r.journal}"`
      ).join("\n")
  );
}

run();
