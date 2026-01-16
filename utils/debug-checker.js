// debug-checker.js
// Tool untuk cek kenapa data kosong
import axios from "axios";

const UNIKOM_ID = "I4210117444";
const OPENALEX_BASE = "https://api.openalex.org";

async function debugCheck() {
  console.log("🔍 DEBUGGING UNIKOM DATA COLLECTION\n");
  
  // Test 1: Check institution exists
  console.log("TEST 1: Checking UNIKOM institution...");
  try {
    const { data: inst } = await axios.get(`${OPENALEX_BASE}/institutions/${UNIKOM_ID}`);
    console.log("✅ Institution found:");
    console.log(`   - Name: ${inst.display_name}`);
    console.log(`   - Works count: ${inst.works_count}`);
    console.log(`   - Cited by: ${inst.cited_by_count}`);
    console.log(`   - Authors count: ${inst.summary_stats?.['2yr_mean_citedness'] || 'N/A'}`);
  } catch (error) {
    console.log("❌ Institution not found!");
    console.log(`   Error: ${error.message}`);
    return;
  }

  // Test 2: Check authors with different filters
  console.log("\nTEST 2: Trying different author queries...");
  
  // Try 1: last_known_institutions
  console.log("\n  Method 1: last_known_institutions.id filter");
  try {
    const { data } = await axios.get(`${OPENALEX_BASE}/authors`, {
      params: {
        filter: `last_known_institutions.id:${UNIKOM_ID}`,
        "per-page": 5
      }
    });
    console.log(`  ✅ Found ${data.meta?.count || 0} authors`);
    if (data.results?.length > 0) {
      console.log(`  Sample: ${data.results[0].display_name}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Try 2: affiliations
  console.log("\n  Method 2: affiliations filter");
  try {
    const { data } = await axios.get(`${OPENALEX_BASE}/authors`, {
      params: {
        filter: `affiliations.institution.id:${UNIKOM_ID}`,
        "per-page": 5
      }
    });
    console.log(`  ✅ Found ${data.meta?.count || 0} authors`);
    if (data.results?.length > 0) {
      console.log(`  Sample: ${data.results[0].display_name}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Try 3: Search institution name
  console.log("\n  Method 3: Search by institution name");
  try {
    const { data } = await axios.get(`${OPENALEX_BASE}/authors`, {
      params: {
        search: "Universitas Komputer Indonesia",
        "per-page": 5
      }
    });
    console.log(`  ✅ Found ${data.results?.length || 0} authors`);
    if (data.results?.length > 0) {
      console.log(`  Sample: ${data.results[0].display_name}`);
      console.log(`  Institution: ${data.results[0].last_known_institutions?.[0]?.display_name || 'N/A'}`);
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }

  // Test 3: Check works from institution
  console.log("\nTEST 3: Checking works from UNIKOM...");
  try {
    const { data } = await axios.get(`${OPENALEX_BASE}/works`, {
      params: {
        filter: `institutions.id:${UNIKOM_ID}`,
        "per-page": 5
      }
    });
    console.log(`✅ Found ${data.meta?.count || 0} works`);
    if (data.results?.length > 0) {
      const work = data.results[0];
      console.log(`  Sample work: ${work.title}`);
      console.log(`  Year: ${work.publication_year}`);
      console.log(`  Authors: ${work.authorships?.length || 0}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 4: Alternative institution IDs
  console.log("\nTEST 4: Searching for UNIKOM alternative IDs...");
  try {
    const { data } = await axios.get(`${OPENALEX_BASE}/institutions`, {
      params: {
        search: "Komputer Indonesia",
        "per-page": 10
      }
    });
    console.log(`✅ Found ${data.results?.length || 0} institutions matching "Komputer Indonesia"`);
    data.results?.forEach((inst, i) => {
      console.log(`\n  ${i+1}. ${inst.display_name}`);
      console.log(`     ID: ${inst.id}`);
      console.log(`     Country: ${inst.country_code}`);
      console.log(`     Works: ${inst.works_count}`);
      console.log(`     Type: ${inst.type}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 5: Check ROR ID
  console.log("\nTEST 5: Checking alternative identifiers...");
  try {
    const { data: inst } = await axios.get(`${OPENALEX_BASE}/institutions/${UNIKOM_ID}`);
    console.log(`✅ Institution identifiers:`);
    console.log(`   - OpenAlex ID: ${inst.id}`);
    console.log(`   - ROR: ${inst.ror || 'N/A'}`);
    console.log(`   - Country: ${inst.country_code}`);
    console.log(`   - Type: ${inst.type}`);
    console.log(`   - Homepage: ${inst.homepage_url || 'N/A'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("DIAGNOSIS COMPLETE");
  console.log("=".repeat(60));
}

debugCheck().catch(console.error);