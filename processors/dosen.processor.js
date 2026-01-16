// ============================================================
// PROCESSORS
// ============================================================

// processors/dosen.processor.js
import { generateId, normalizeInstitution } from "../utils/helpers.js";
import { FAKULTAS_MAP } from "../config/constants.js";

export function determineFakultas(concepts) {
  if (!concepts || concepts.length === 0) return "Fakultas Lainnya";
  
  const topConcept = concepts[0]?.display_name || "";
  
  for (const [key, faculty] of Object.entries(FAKULTAS_MAP)) {
    if (topConcept.includes(key)) return faculty;
  }
  
  return "Fakultas Lainnya";
}

export function determineProdi(concepts, fakultas) {
  if (!concepts || concepts.length === 0) return "Tidak Teridentifikasi";
  
  const topConcept = concepts[0]?.display_name || "";
  
  // Mapping berdasarkan fakultas
  if (fakultas.includes("Teknik dan Ilmu Komputer")) {
    if (topConcept.includes("Computer Science")) return "Teknik Informatika";
    if (topConcept.includes("Information Systems")) return "Sistem Informasi";
    if (topConcept.includes("Software")) return "Rekayasa Perangkat Lunak";
    if (topConcept.includes("Electrical")) return "Teknik Elektro";
  }
  
  if (fakultas.includes("Ekonomi")) {
    if (topConcept.includes("Management")) return "Manajemen";
    if (topConcept.includes("Accounting")) return "Akuntansi";
    if (topConcept.includes("Economics")) return "Ekonomi Pembangunan";
  }
  
  return "Tidak Teridentifikasi";
}

export function processDosen(author) {
  const fakultas = determineFakultas(author.x_concepts);
  const prodi = determineProdi(author.x_concepts, fakultas);
  
  return {
    dosen_id: generateId('DSN', author.id),
    nama: author.display_name,
    openalex_id: author.id,
    orcid: author.orcid || "",
    fakultas: fakultas,
    program_studi: prodi,
    institusi: CONFIG.UNIKOM_NAME,
    total_works: author.works_count || 0,
    total_citations: author.cited_by_count || 0,
    h_index: author.summary_stats?.h_index || 0,
    i10_index: author.summary_stats?.i10_index || 0
  };
}