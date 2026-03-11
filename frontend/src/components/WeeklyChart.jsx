import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const WORKPLACES = [
  'CDZ Ústí', 'CDZ Chomutov', 'CDZ Žatec', 'CDZ Litoměřice',
  'TDZ Děčín', 'TDZ Most', 'TDZ Teplice', 'TDZ pro děti',
];

const fmtKc = (n) => Math.round(n || 0).toLocaleString('cs-CZ') + ' Kč';

function WeeklyChart({ months, api }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWp, setSelectedWp] = useState(WORKPLACES[0]);
  const [data, setData] = useState([]);

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1].name);
    }
  }, [months, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth || !selectedWp) return;
    fetch(`${api}/weekly/${encodeURIComponent(selectedMonth)}/${encodeURIComponent(selectedWp)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [selectedMonth, selectedWp, api]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Týdenní trendy</h2>

      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {months.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <select
          value={selectedWp}
          onChange={(e) => setSelectedWp(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {WORKPLACES.map((wp) => (
            <option key={wp} value={wp}>{wp}</option>
          ))}
        </select>
      </div>

      {data.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Výkony po týdnech</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v) => fmtKc(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Výkony" stroke="#1a4f8a" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Intervence po týdnech</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="interventions" name="Intervence" stroke="#1b6e3a" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-12">
          {months.length === 0 ? 'Nejsou k dispozici žádná data.' : 'Načítání...'}
        </p>
      )}
    </div>
  );
}

export default WeeklyChart;
