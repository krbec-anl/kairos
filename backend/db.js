const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'fokus.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS months (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workplaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    plan REAL DEFAULT 0,
    reality REAL DEFAULT 0,
    diff REAL DEFAULT 0,
    interventions INTEGER DEFAULT 0,
    hours REAL DEFAULT 0,
    week1_revenue REAL DEFAULT 0,
    week1_interventions INTEGER DEFAULT 0,
    week2_revenue REAL DEFAULT 0,
    week2_interventions INTEGER DEFAULT 0,
    week3_revenue REAL DEFAULT 0,
    week3_interventions INTEGER DEFAULT 0,
    week4_revenue REAL DEFAULT 0,
    week4_interventions INTEGER DEFAULT 0,
    FOREIGN KEY (month_id) REFERENCES months(id),
    UNIQUE(month_id, name)
  );

  CREATE TABLE IF NOT EXISTS workers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL,
    workplace TEXT NOT NULL,
    position TEXT,
    name TEXT NOT NULL,
    uvazek REAL DEFAULT 0,
    plan REAL DEFAULT 0,
    reality REAL DEFAULT 0,
    diff REAL DEFAULT 0,
    interventions INTEGER DEFAULT 0,
    week1_revenue REAL DEFAULT 0,
    week1_interventions INTEGER DEFAULT 0,
    week2_revenue REAL DEFAULT 0,
    week2_interventions INTEGER DEFAULT 0,
    week3_revenue REAL DEFAULT 0,
    week3_interventions INTEGER DEFAULT 0,
    week4_revenue REAL DEFAULT 0,
    week4_interventions INTEGER DEFAULT 0,
    FOREIGN KEY (month_id) REFERENCES months(id)
  );

  CREATE TABLE IF NOT EXISTS totals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER UNIQUE NOT NULL,
    plan REAL DEFAULT 0,
    reality REAL DEFAULT 0,
    diff REAL DEFAULT 0,
    interventions INTEGER DEFAULT 0,
    hours REAL DEFAULT 0,
    week1_revenue REAL DEFAULT 0,
    week1_interventions INTEGER DEFAULT 0,
    week2_revenue REAL DEFAULT 0,
    week2_interventions INTEGER DEFAULT 0,
    week3_revenue REAL DEFAULT 0,
    week3_interventions INTEGER DEFAULT 0,
    week4_revenue REAL DEFAULT 0,
    week4_interventions INTEGER DEFAULT 0,
    FOREIGN KEY (month_id) REFERENCES months(id)
  );

  CREATE TABLE IF NOT EXISTS costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    month_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    plan REAL DEFAULT 0,
    reality REAL DEFAULT 0,
    diff REAL DEFAULT 0,
    FOREIGN KEY (month_id) REFERENCES months(id),
    UNIQUE(month_id, name)
  );
`);

module.exports = db;
