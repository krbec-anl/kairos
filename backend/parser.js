const XLSX = require('xlsx');
const db = require('./db');

function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function cellVal(sheet, col, row) {
  const cell = sheet[col + row];
  if (!cell) return null;
  return cell.v !== undefined ? cell.v : null;
}

// Detect column layout from row 2 headers
function detectLayout(sheet) {
  const b2 = String(cellVal(sheet, 'B', 2) || '').toLowerCase();

  if (b2.includes('plán')) {
    // Old format: A=name, B=plan, C=reality, D=diff, E=interventions, F=hours
    // Weekly: H/I (w1), K/L (w2), N/O (w3), Q/R (w4)
    return {
      type: 'old',
      plan: 'B', reality: 'C', diff: 'D', interventions: 'E', hours: 'F',
      workerName: null, workerUvazek: null,
      w1rev: 'H', w1int: 'I', w2rev: 'K', w2int: 'L',
      w3rev: 'N', w3int: 'O', w4rev: 'Q', w4int: 'R',
    };
  } else {
    // New format: A=position, B=name, C=uvazek, D=plan, E=reality, F=diff, G=interventions, H=hours
    // Weekly: J/K (w1), M/N (w2), P/Q (w3), S/T (w4)
    return {
      type: 'new',
      plan: 'D', reality: 'E', diff: 'F', interventions: 'G', hours: 'H',
      workerName: 'B', workerUvazek: 'C',
      w1rev: 'J', w1int: 'K', w2rev: 'M', w2int: 'N',
      w3rev: 'P', w3int: 'Q', w4rev: 'S', w4int: 'T',
    };
  }
}

function parseDataRow(sheet, row, layout) {
  return {
    plan: num(cellVal(sheet, layout.plan, row)),
    reality: num(cellVal(sheet, layout.reality, row)),
    diff: num(cellVal(sheet, layout.diff, row)),
    interventions: num(cellVal(sheet, layout.interventions, row)),
    hours: num(cellVal(sheet, layout.hours, row)),
    week1_revenue: num(cellVal(sheet, layout.w1rev, row)),
    week1_interventions: num(cellVal(sheet, layout.w1int, row)),
    week2_revenue: num(cellVal(sheet, layout.w2rev, row)),
    week2_interventions: num(cellVal(sheet, layout.w2int, row)),
    week3_revenue: num(cellVal(sheet, layout.w3rev, row)),
    week3_interventions: num(cellVal(sheet, layout.w3int, row)),
    week4_revenue: num(cellVal(sheet, layout.w4rev, row)),
    week4_interventions: num(cellVal(sheet, layout.w4int, row)),
  };
}

function extractWorkplaceName(raw) {
  return String(raw).replace(/^výnosy\s+/i, '').trim();
}

function parseWorkerInfo(sheet, row, layout) {
  const colA = String(cellVal(sheet, 'A', row) || '').trim();

  if (layout.type === 'new') {
    // New format: A=position, B=name, C=uvazek
    const name = cellVal(sheet, 'B', row);
    if (!name || String(name).trim() === '' || String(name).trim() === '0') {
      // No name in B - try extracting from A
      const dashIdx = colA.indexOf(' - ');
      if (dashIdx !== -1) {
        return {
          position: colA.substring(0, dashIdx).trim(),
          name: colA.substring(dashIdx + 3).trim(),
          uvazek: num(cellVal(sheet, 'C', row)),
        };
      }
      return { position: colA, name: colA, uvazek: num(cellVal(sheet, 'C', row)) };
    }
    return {
      position: colA,
      name: String(name).trim(),
      uvazek: num(cellVal(sheet, 'C', row)),
    };
  } else {
    // Old format: name embedded in A like "psych. s. 1 - NÁGLOVÁ"
    const dashIdx = colA.indexOf(' - ');
    let position, name, uvazek = 1.0;
    if (dashIdx !== -1) {
      position = colA.substring(0, dashIdx).trim();
      name = colA.substring(dashIdx + 3).trim();
    } else {
      position = colA;
      name = colA;
    }
    const uvMatch = colA.match(/(\d+[.,]\d+)\s*$/);
    if (uvMatch) {
      uvazek = parseFloat(uvMatch[1].replace(',', '.'));
    }
    return { position, name, uvazek };
  }
}

function parseSheet(sheet, monthName) {
  db.prepare('INSERT OR IGNORE INTO months (name) VALUES (?)').run(monthName);
  const month = db.prepare('SELECT id FROM months WHERE name = ?').get(monthName);
  const monthId = month.id;

  db.prepare('DELETE FROM workplaces WHERE month_id = ?').run(monthId);
  db.prepare('DELETE FROM workers WHERE month_id = ?').run(monthId);
  db.prepare('DELETE FROM totals WHERE month_id = ?').run(monthId);
  db.prepare('DELETE FROM costs WHERE month_id = ?').run(monthId);

  const layout = detectLayout(sheet);
  console.log(`  List "${monthName}": formát=${layout.type}, plán=col ${layout.plan}`);

  const insertWorkplace = db.prepare(`
    INSERT INTO workplaces (month_id, name, plan, reality, diff, interventions, hours,
      week1_revenue, week1_interventions, week2_revenue, week2_interventions,
      week3_revenue, week3_interventions, week4_revenue, week4_interventions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWorker = db.prepare(`
    INSERT INTO workers (month_id, workplace, position, name, uvazek, plan, reality, diff, interventions,
      week1_revenue, week1_interventions, week2_revenue, week2_interventions,
      week3_revenue, week3_interventions, week4_revenue, week4_interventions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCost = db.prepare('INSERT OR REPLACE INTO costs (month_id, name, plan, reality, diff) VALUES (?, ?, ?, ?, ?)');

  let currentWorkplace = null;
  let inCosts = false;

  for (let r = 1; r <= 200; r++) {
    const colA = cellVal(sheet, 'A', r);
    if (!colA) continue;
    const a = String(colA).trim();
    if (!a) continue;

    // VÝNOSY CELKEM
    if (/^VÝNOSY\s+CELKEM/i.test(a)) {
      const data = parseDataRow(sheet, r, layout);
      db.prepare(`
        INSERT INTO totals (month_id, plan, reality, diff, interventions, hours,
          week1_revenue, week1_interventions, week2_revenue, week2_interventions,
          week3_revenue, week3_interventions, week4_revenue, week4_interventions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        monthId, data.plan, data.reality, data.diff, data.interventions, data.hours,
        data.week1_revenue, data.week1_interventions, data.week2_revenue, data.week2_interventions,
        data.week3_revenue, data.week3_interventions, data.week4_revenue, data.week4_interventions
      );
      currentWorkplace = null;
      continue;
    }

    // Costs section
    if (/^NÁKLADY/i.test(a)) {
      inCosts = true;
      currentWorkplace = null;
      // If this is "NÁKLADY CELKEM", also save it
      if (/CELKEM/i.test(a)) {
        insertCost.run(monthId, a, num(cellVal(sheet, layout.plan, r)), num(cellVal(sheet, layout.reality, r)), num(cellVal(sheet, layout.diff, r)));
      }
      continue;
    }

    if (inCosts) {
      const plan = num(cellVal(sheet, layout.plan, r));
      const reality = num(cellVal(sheet, layout.reality, r));
      const diff = num(cellVal(sheet, layout.diff, r));
      if (plan !== 0 || reality !== 0) {
        insertCost.run(monthId, a, plan, reality, diff);
      }
      continue;
    }

    // Skip headers
    if (/^Středisko|^VÝNOSY$/i.test(a)) continue;

    // Workplace summary row
    if (/^výnosy\s+/i.test(a)) {
      const wpName = extractWorkplaceName(a);
      const data = parseDataRow(sheet, r, layout);
      insertWorkplace.run(
        monthId, wpName, data.plan, data.reality, data.diff, data.interventions, data.hours,
        data.week1_revenue, data.week1_interventions, data.week2_revenue, data.week2_interventions,
        data.week3_revenue, data.week3_interventions, data.week4_revenue, data.week4_interventions
      );
      currentWorkplace = wpName;
      continue;
    }

    // Worker row
    if (currentWorkplace) {
      const worker = parseWorkerInfo(sheet, r, layout);
      const data = parseDataRow(sheet, r, layout);
      insertWorker.run(
        monthId, currentWorkplace, worker.position, worker.name, worker.uvazek,
        data.plan, data.reality, data.diff, data.interventions,
        data.week1_revenue, data.week1_interventions,
        data.week2_revenue, data.week2_interventions,
        data.week3_revenue, data.week3_interventions,
        data.week4_revenue, data.week4_interventions
      );
    }
  }

  return monthId;
}

function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath, { cellFormula: false });
  const results = [];

  const transaction = db.transaction(() => {
    for (const sheetName of workbook.SheetNames) {
      const monthPattern = /^(leden|únor|březen|duben|květen|červen|červenec|srpen|září|říjen|listopad|prosinec)\s+\d{4}$/i;
      if (monthPattern.test(sheetName.trim())) {
        try {
          const sheet = workbook.Sheets[sheetName];
          const monthId = parseSheet(sheet, sheetName.trim());
          results.push({ month: sheetName.trim(), monthId });
        } catch (err) {
          console.error(`Chyba při parsování listu "${sheetName}":`, err.message);
          results.push({ month: sheetName.trim(), error: err.message });
        }
      }
    }
  });

  transaction();
  return results;
}

module.exports = { parseExcelFile };
