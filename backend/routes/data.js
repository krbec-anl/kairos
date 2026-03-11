const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/months – list available months
router.get('/months', (req, res) => {
  const months = db.prepare('SELECT id, name FROM months ORDER BY id').all();
  res.json(months);
});

// GET /api/summary/:month – summary for a given month
router.get('/summary/:month', (req, res) => {
  const monthName = req.params.month;
  const month = db.prepare('SELECT id FROM months WHERE name = ?').get(monthName);
  if (!month) return res.status(404).json({ error: 'Měsíc nenalezen' });

  const workplaces = db.prepare('SELECT * FROM workplaces WHERE month_id = ?').all(month.id);
  const totals = db.prepare('SELECT * FROM totals WHERE month_id = ?').get(month.id);
  const costs = db.prepare('SELECT * FROM costs WHERE month_id = ?').all(month.id);

  res.json({ month: monthName, workplaces, totals, costs });
});

// GET /api/workers/:month/:cdz – workers for a workplace and month
router.get('/workers/:month/:cdz', (req, res) => {
  const monthName = req.params.month;
  const cdz = req.params.cdz;
  const month = db.prepare('SELECT id FROM months WHERE name = ?').get(monthName);
  if (!month) return res.status(404).json({ error: 'Měsíc nenalezen' });

  const workers = db.prepare('SELECT * FROM workers WHERE month_id = ? AND workplace = ?').all(month.id, cdz);
  res.json(workers);
});

// GET /api/weekly/:month/:cdz – weekly data for a workplace
router.get('/weekly/:month/:cdz', (req, res) => {
  const monthName = req.params.month;
  const cdz = req.params.cdz;
  const month = db.prepare('SELECT id FROM months WHERE name = ?').get(monthName);
  if (!month) return res.status(404).json({ error: 'Měsíc nenalezen' });

  const wp = db.prepare('SELECT * FROM workplaces WHERE month_id = ? AND name = ?').get(month.id, cdz);
  if (!wp) return res.status(404).json({ error: 'Pracoviště nenalezeno' });

  const weekly = [
    { week: 'Týden 1', revenue: wp.week1_revenue, interventions: wp.week1_interventions },
    { week: 'Týden 2', revenue: wp.week2_revenue, interventions: wp.week2_interventions },
    { week: 'Týden 3', revenue: wp.week3_revenue, interventions: wp.week3_interventions },
    { week: 'Týden 4', revenue: wp.week4_revenue, interventions: wp.week4_interventions },
  ];

  res.json(weekly);
});

// GET /api/compare/:month1/:month2 – compare two months
router.get('/compare/:month1/:month2', (req, res) => {
  const m1 = db.prepare('SELECT id FROM months WHERE name = ?').get(req.params.month1);
  const m2 = db.prepare('SELECT id FROM months WHERE name = ?').get(req.params.month2);

  if (!m1 || !m2) return res.status(404).json({ error: 'Měsíc nenalezen' });

  const wp1 = db.prepare('SELECT * FROM workplaces WHERE month_id = ?').all(m1.id);
  const wp2 = db.prepare('SELECT * FROM workplaces WHERE month_id = ?').all(m2.id);

  const t1 = db.prepare('SELECT * FROM totals WHERE month_id = ?').get(m1.id);
  const t2 = db.prepare('SELECT * FROM totals WHERE month_id = ?').get(m2.id);

  const comparison = wp1.map((w1) => {
    const w2 = wp2.find((w) => w.name === w1.name) || {};
    return {
      name: w1.name,
      month1_reality: w1.reality || 0,
      month2_reality: w2.reality || 0,
      diff_reality: (w2.reality || 0) - (w1.reality || 0),
      month1_interventions: w1.interventions || 0,
      month2_interventions: w2.interventions || 0,
      diff_interventions: (w2.interventions || 0) - (w1.interventions || 0),
    };
  });

  res.json({
    month1: req.params.month1,
    month2: req.params.month2,
    workplaces: comparison,
    totals1: t1,
    totals2: t2,
  });
});

module.exports = router;
