import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fmt = (n) => Math.round(n || 0).toLocaleString('cs-CZ');
const fmtKc = (n) => fmt(n) + ' Kč';

function MonthCompare({ months, api }) {
  const [month1, setMonth1] = useState('');
  const [month2, setMonth2] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (months.length >= 2) {
      setMonth1(months[months.length - 2].name);
      setMonth2(months[months.length - 1].name);
    } else if (months.length === 1) {
      setMonth1(months[0].name);
      setMonth2(months[0].name);
    }
  }, [months]);

  useEffect(() => {
    if (!month1 || !month2) return;
    fetch(`${api}/compare/${encodeURIComponent(month1)}/${encodeURIComponent(month2)}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [month1, month2, api]);

  if (months.length < 2) {
    return <p className="text-gray-500 text-center py-12">Je potřeba alespoň 2 měsíce dat pro srovnání.</p>;
  }

  const chartData = data?.workplaces?.map((wp) => ({
    name: wp.name,
    [month1]: wp.month1_reality,
    [month2]: wp.month2_reality,
  })) || [];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Srovnání měsíců</h2>

      <div className="flex flex-wrap gap-4 mb-8">
        <select
          value={month1}
          onChange={(e) => setMonth1(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {months.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
        <span className="self-center text-gray-400 font-medium">vs.</span>
        <select
          value={month2}
          onChange={(e) => setMonth2(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {months.map((m) => (
            <option key={m.id} value={m.name}>{m.name}</option>
          ))}
        </select>
      </div>

      {data && (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Výnosy pracovišť</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 60, left: 20 }}>
                <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v) => fmtKc(v)} />
                <Legend />
                <Bar dataKey={month1} fill="#1a4f8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey={month2} fill="#1b6e3a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Detailní srovnání</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-left">
                    <th className="py-3 px-2">Pracoviště</th>
                    <th className="py-3 px-2 text-right">{month1}</th>
                    <th className="py-3 px-2 text-right">{month2}</th>
                    <th className="py-3 px-2 text-right">+/- Výnosy</th>
                    <th className="py-3 px-2 text-right">+/- Intervence</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workplaces.map((wp) => (
                    <tr key={wp.name} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">{wp.name}</td>
                      <td className="py-3 px-2 text-right">{fmtKc(wp.month1_reality)}</td>
                      <td className="py-3 px-2 text-right">{fmtKc(wp.month2_reality)}</td>
                      <td className={`py-3 px-2 text-right font-medium ${wp.diff_reality >= 0 ? 'text-accent' : 'text-warning'}`}>
                        {wp.diff_reality >= 0 ? '+' : ''}{fmtKc(wp.diff_reality)}
                      </td>
                      <td className={`py-3 px-2 text-right font-medium ${wp.diff_interventions >= 0 ? 'text-accent' : 'text-warning'}`}>
                        {wp.diff_interventions >= 0 ? '+' : ''}{fmt(wp.diff_interventions)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MonthCompare;
