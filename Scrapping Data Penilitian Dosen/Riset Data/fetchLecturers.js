import axios from "axios";
import { db } from "./db.js";

const UNIKOM_ID = "I4210117444";

async function fetchLecturers() {
  const url = `https://api.openalex.org/authors?filter=last_known_institutions.id:${UNIKOM_ID}&per-page=25`;

  const res = await axios.get(url);
  const authors = res.data.results;

  for (const author of authors) {
    const name = author.display_name;
    const orcid = author.orcid || null;
    const openalexId = author.id;
    const worksCount = author.works_count || 0;
    const citedBy = author.cited_by_count || 0;

    await db.query(
      `INSERT IGNORE INTO lecturers
       (name, orcid, openalex_author_id, works_count, cited_by_count, institution_id)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [name, orcid, openalexId, worksCount, citedBy]
    );
  }

  console.log("✔ Data dosen berhasil diimport");
}

fetchLecturers();
