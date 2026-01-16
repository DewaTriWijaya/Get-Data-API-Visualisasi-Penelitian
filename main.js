// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

// main.js
import { CONFIG } from "./config/constants.js";
import { getAllUnikomAuthors, getWorksByAuthor } from "./services/openalex.service.js";
import { processDosen } from "./processors/dosen.processor.js";
import { processPublikasi, processDosenPublikasi, processJurnal } from "./processors/publikasi.processor.js";
import { analyzePerformance } from "./analytics/performance.analyzer.js";
import { exportCSV, exportJSON } from "./exporters/csv.exporter.js";

export async function scrapeUnikomResearch(options = {}) {
  const {
    maxAuthors = null,
    outputDir = "output",
    includeAnalytics = true
  } = options;

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  UNIKOM RESEARCH DATA COLLECTION & ANALYTICS SYSTEM          ║
║  ${CONFIG.UNIKOM_NAME}                                        ║
╚═══════════════════════════════════════════════════════════════╝
`);

  const startTime = Date.now();
  
  // Data containers
  const dosens = [];
  const publikasis = [];
  const dosenPublikasis = [];
  const jurnalMap = new Map();

  // 1. Fetch all authors
  console.log("\n📥 PHASE 1: Fetching UNIKOM Authors...");
  let authors = await getAllUnikomAuthors();
  console.log(`✓ Found ${authors.length} authors`);
  
  if (maxAuthors) {
    authors = authors.slice(0, maxAuthors);
    console.log(`⚠️ Limited to ${maxAuthors} for testing\n`);
  }

  // 2. Process each author
  console.log("\n📚 PHASE 2: Processing Publications...");
  for (let i = 0; i < authors.length; i++) {
    const author = authors[i];
    console.log(`\n[${i + 1}/${authors.length}] ${author.display_name}`);

    try {
      // Process dosen
      const dosen = processDosen(author);
      dosens.push(dosen);

      // Get works
      console.log(`  📖 Fetching publications...`);
      const works = await getWorksByAuthor(author.id);
      console.log(`  ✓ ${works.length} publications found`);

      // Process each publication
      for (const work of works) {
        const pub = await processPublikasi(work, dosen.dosen_id);
        publikasis.push(pub);

        const dosenPub = processDosenPublikasi(work, dosen.dosen_id, author.display_name);
        if (dosenPub) dosenPublikasis.push(dosenPub);

        // Track journal
        const jurnalKey = pub.jurnal_id;
        if (!jurnalMap.has(jurnalKey)) {
          jurnalMap.set(jurnalKey, []);
        }
        jurnalMap.get(jurnalKey).push(pub);
      }

      // Auto-save progress
      if ((i + 1) % CONFIG.SAVE_INTERVAL === 0) {
        console.log(`\n💾 Auto-saving progress...`);
        saveProgress(outputDir, dosens, publikasis, dosenPublikasis);
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      continue;
    }
  }

  // 3. Process journals
  console.log("\n📰 PHASE 3: Processing Journals...");
  const jurnals = [];
  for (const [jurnalId, pubs] of jurnalMap.entries()) {
    const firstPub = pubs[0];
    const jurnal = processJurnal(firstPub.journal_name, firstPub.issn, pubs);
    jurnals.push(jurnal);
  }
  console.log(`✓ Processed ${jurnals.length} unique journals`);

  // 4. Analytics
  let analytics = null;
  if (includeAnalytics) {
    console.log("\n📊 PHASE 4: Generating Analytics...");
    analytics = analyzePerformance(dosens, publikasis, dosenPublikasis);
    console.log(`✓ Analytics generated`);
  }

  // 5. Export all data
  console.log("\n💾 PHASE 5: Exporting Data...");
  exportAll(outputDir, dosens, publikasis, dosenPublikasis, jurnals, analytics);

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  COLLECTION COMPLETE                                         ║
╠═══════════════════════════════════════════════════════════════╣
║  Duration: ${duration} minutes
║  Dosen: ${dosens.length}
║  Publications: ${publikasis.length}
║  Journals: ${jurnals.length}
║  Output: ${outputDir}/
╚═══════════════════════════════════════════════════════════════╝
  `);
}

function saveProgress(dir, dosens, pubs, dosenPubs) {
  exportCSV(`${dir}/1_DOSEN.csv`, dosens);
  exportCSV(`${dir}/2_PUBLIKASI.csv`, pubs);
  exportCSV(`${dir}/3_DOSEN_PUBLIKASI.csv`, dosenPubs);
}

function exportAll(dir, dosens, pubs, dosenPubs, jurnals, analytics) {
  // Main tables
  exportCSV(`${dir}/1_DOSEN.csv`, dosens);
  exportCSV(`${dir}/2_PUBLIKASI.csv`, pubs);
  exportCSV(`${dir}/3_DOSEN_PUBLIKASI.csv`, dosenPubs);
  exportCSV(`${dir}/4_JURNAL.csv`, jurnals);
  
  // Analytics
  if (analytics) {
    exportJSON(`${dir}/5_ANALYTICS.json`, analytics);
    
    // Export specific analytics as CSV
    exportCSV(`${dir}/6_LOW_PERFORMERS.csv`, analytics.low_performers);
    exportCSV(`${dir}/7_ZERO_PUBLICATIONS.csv`, analytics.zero_publications);
  }
  
  console.log(`\n✅ All data exported to ${dir}/`);
}