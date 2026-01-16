// ============================================================
// EXPORTERS
// ============================================================

// exporters/csv.exporter.js
import fs from "fs";
import path from "path";

export function exportCSV(filename, data) {
  if (!data || data.length === 0) {
    console.log(`  ⚠️ No data for ${filename}`);
    return;
  }

  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      let cell = row[h] ?? "";
      cell = String(cell).replace(/"/g, '""');
      return `"${cell}"`;
    }).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  fs.writeFileSync(filename, csv, "utf8");
  console.log(`  ✅ ${filename} (${data.length} rows)`);
}

export function exportJSON(filename, data) {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filename, JSON.stringify(data, null, 2), "utf8");
  console.log(`  ✅ ${filename}`);
}