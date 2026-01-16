// index.js
import { scrapeUnikomResearch } from './main.js';

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'test';

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   UNIKOM RESEARCH ANALYTICS SYSTEM                       ║
║   Scraping + Analysis + Monitoring                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Mode: ${mode.toUpperCase()}
Start: ${new Date().toLocaleString('id-ID')}
  `);

  try {
    if (mode === 'test') {
      // Test mode - 10 dosen pertama
      await scrapeUnikomResearch({
        maxAuthors: 10,
        outputDir: "output_test",
        includeAnalytics: true
      });
    } 
    else if (mode === 'production') {
      // Production - semua dosen
      await scrapeUnikomResearch({
        maxAuthors: null,
        outputDir: "output",
        includeAnalytics: true
      });
    }
    else if (mode === 'sample') {
      // Sample - 50 dosen
      await scrapeUnikomResearch({
        maxAuthors: 50,
        outputDir: "output_sample",
        includeAnalytics: true
      });
    }
    else {
      console.log(`
Usage:
  node index.js test        # Test mode (10 dosen)
  node index.js sample      # Sample mode (50 dosen)
  node index.js production  # Production (semua dosen)
      `);
      process.exit(0);
    }

    console.log(`\n✅ SELESAI - ${new Date().toLocaleString('id-ID')}`);

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();