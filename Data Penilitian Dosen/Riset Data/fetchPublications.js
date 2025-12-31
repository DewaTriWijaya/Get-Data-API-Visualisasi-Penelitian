import axios from "axios";
import { db } from "./db.js";

async function fetchPublications() {
  const [lecturers] = await db.query(
    "SELECT id, openalex_author_id FROM lecturers"
  );

  for (const lecturer of lecturers) {
    const url = `https://api.openalex.org/works?filter=author.id:${lecturer.openalex_author_id}&per-page=25`;
    const res = await axios.get(url);

    for (const work of res.data.results) {
      const title = work.title;
      const year = work.publication_year;
      const doi = work.doi;
      const citations = work.cited_by_count || 0;

      if (!title || !year) continue;

      await db.query(
        `INSERT IGNORE INTO publications
         (title, publication_year, doi, citations, lecturer_id)
         VALUES (?, ?, ?, ?, ?)`,
        [title, year, doi, citations, lecturer.id]
      );
    }
  }

  console.log("✔ Publikasi berhasil diimport");
}

fetchPublications();
