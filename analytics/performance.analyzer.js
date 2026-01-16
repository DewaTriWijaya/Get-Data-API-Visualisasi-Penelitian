// ============================================================
// ANALYTICS
// ============================================================

// analytics/performance.analyzer.js
export function analyzePerformance(dosens, publikasis, dosenPublikasis) {
  const currentYear = new Date().getFullYear();
  const last3Years = [currentYear - 2, currentYear - 1, currentYear];
  
  // Publications per year
  const pubsByYear = {};
  publikasis.forEach(pub => {
    const year = pub.tahun;
    pubsByYear[year] = (pubsByYear[year] || 0) + 1;
  });
  
  // Trend last 3 years
  const trend3Years = last3Years.map(year => ({
    year,
    count: pubsByYear[year] || 0
  }));
  
  // Distribution by faculty
  const byFaculty = {};
  dosens.forEach(dosen => {
    const faculty = dosen.fakultas;
    if (!byFaculty[faculty]) {
      byFaculty[faculty] = { count: 0, publications: 0, citations: 0 };
    }
    byFaculty[faculty].count++;
    byFaculty[faculty].publications += dosen.total_works;
    byFaculty[faculty].citations += dosen.total_citations;
  });
  
  // Low performers (< 2 pubs in last 3 years)
  const lowPerformers = dosens.filter(dosen => {
    const dosenPubs = dosenPublikasis.filter(dp => dp.dosen_id === dosen.dosen_id);
    const recentPubs = dosenPubs.filter(dp => {
      const pub = publikasis.find(p => p.publikasi_id === dp.publikasi_id);
      return pub && last3Years.includes(pub.tahun);
    });
    return recentPubs.length < 2;
  });
  
  // Zero publications
  const zeroPublications = dosens.filter(d => d.total_works === 0);
  
  // Average per faculty
  const avgByFaculty = {};
  Object.entries(byFaculty).forEach(([faculty, stats]) => {
    avgByFaculty[faculty] = {
      avg_publications: (stats.publications / stats.count).toFixed(2),
      avg_citations: (stats.citations / stats.count).toFixed(2)
    };
  });
  
  // Quality metrics
  const highQualityPubs = publikasis.filter(p => 
    p.indeksasi.includes("Scopus") || p.sitasi >= 10
  ).length;
  
  return {
    overview: {
      total_dosen: dosens.length,
      total_publikasi: publikasis.length,
      total_sitasi: publikasis.reduce((sum, p) => sum + p.sitasi, 0),
      avg_pub_per_dosen: (publikasis.length / dosens.length).toFixed(2),
      high_quality_percentage: ((highQualityPubs / publikasis.length) * 100).toFixed(1)
    },
    trend_3_years: trend3Years,
    by_faculty: byFaculty,
    avg_by_faculty: avgByFaculty,
    low_performers: lowPerformers.map(d => ({
      nama: d.nama,
      fakultas: d.fakultas,
      total_works: d.total_works
    })),
    zero_publications: zeroPublications.map(d => ({
      nama: d.nama,
      fakultas: d.fakultas
    })),
    quality_distribution: {
      scopus_indexed: publikasis.filter(p => p.indeksasi.includes("Scopus")).length,
      sinta_accredited: publikasis.filter(p => p.akreditasi?.includes("SINTA")).length,
      highly_cited: publikasis.filter(p => p.sitasi >= 20).length
    }
  };
}