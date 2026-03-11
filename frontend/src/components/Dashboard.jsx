import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CDZCard from './CDZCard';

const fmt = (n) => {
  if (n === null || n === undefined) return '0';
  return Math.round(n).toLocaleString('cs-CZ');
};

const fmtKc = (n) => fmt(n) + ' Kč';

function Dashboard({ months, api }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1].name);
    }
  }, [months, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth) return;
    fetch(`${api}/summary/${encodeURIComponent(selectedMonth)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [selectedMonth, api]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">
          {months.length === 0 ? 'Nejsou k dispozici žádná data. Nahrajte Excel soubor.' : 'Načítání...'}
        </p>
      </div>
    );
  }

  const { totals, workplaces } = data;
  const pctTotal = totals && totals.plan ? ((totals.reality / totals.plan) * 100).toFixed(1) : '0';
  const diffPct = totals ? (Number(pctTotal) - 100).toFixed(1) : '0';

  const chartData = workplaces.map((wp) => ({
    name: wp.name,
    Plán: wp.plan,
    Skutečnost: wp.reality,
  }));

  const sortedWp = [...workplaces].sort((a, b) => {
    const pctA = a.plan ? (a.reality / a.plan) * 100 : 0;
    const pctB = b.plan ? (b.reality / b.plan) * 100 : 0;
    return pctB - pctA;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Přehled organizace</h2>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {months.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-primary">
          <p className="text-sm text-gray-500 mb-1">Celkové výnosy</p>
          <p className="text-2xl font-bold">{fmtKc(totals?.reality)}</p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-gray-500">Plán: {fmtKc(totals?.plan)}</span>
            <span className={`font-semibold ${Number(diffPct) >= 0 ? 'text-accent' : 'text-warning'}`}>
              {Number(diffPct) >= 0 ? '+' : ''}{diffPct} %
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-accent">
          <p className="text-sm text-gray-500 mb-1">Celkové intervence</p>
          <p className="text-2xl font-bold">{fmt(totals?.interventions)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-warning">
          <p className="text-sm text-gray-500 mb-1">Odpracováno hodin</p>
          <p className="text-2xl font-bold">{fmt(totals?.hours)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Srovnání pracovišť – plán vs. skutečnost</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
            <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
            <Tooltip formatter={(v) => fmtKc(v)} />
            <Legend />
            <Bar dataKey="Plán" fill="#1a4f8a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Skutečnost" fill="#1b6e3a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Workplace table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Přehled pracovišť</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 text-left">
                <th className="py-3 px-2">Pracoviště</th>
                <th className="py-3 px-2 text-right">Plán</th>
                <th className="py-3 px-2 text-right">Skutečnost</th>
                <th className="py-3 px-2 text-right">Rozdíl</th>
                <th className="py-3 px-2 text-right">% plnění</th>
                <th className="py-3 px-2 text-right">Intervence</th>
              </tr>
            </thead>
            <tbody>
              {sortedWp.map((wp) => {
                const pct = wp.plan ? ((wp.reality / wp.plan) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={wp.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 font-medium">{wp.name}</td>
                    <td className="py-3 px-2 text-right">{fmtKc(wp.plan)}</td>
                    <td className="py-3 px-2 text-right">{fmtKc(wp.reality)}</td>
                    <td className={`py-3 px-2 text-right font-medium ${wp.diff >= 0 ? 'text-accent' : 'text-warning'}`}>
                      {wp.diff >= 0 ? '+' : ''}{fmtKc(wp.diff)}
                    </td>
                    <td className={`py-3 px-2 text-right font-bold ${Number(pct) >= 100 ? 'text-accent' : Number(pct) >= 90 ? 'text-gray-700' : 'text-warning'}`}>
                      {pct} %
                    </td>
                    <td className="py-3 px-2 text-right">{fmt(wp.interventions)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
