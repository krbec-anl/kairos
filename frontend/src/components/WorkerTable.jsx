import React, { useState, useEffect } from 'react';

const WORKPLACES = [
  'CDZ Ústí', 'CDZ Chomutov', 'CDZ Žatec', 'CDZ Litoměřice',
  'TDZ Děčín', 'TDZ Most', 'TDZ Teplice', 'TDZ pro děti',
];

const fmt = (n) => Math.round(n || 0).toLocaleString('cs-CZ');
const fmtKc = (n) => fmt(n) + ' Kč';

function WorkerTable({ months, api }) {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWp, setSelectedWp] = useState(WORKPLACES[0]);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    if (months.length > 0 && !selectedMonth) {
      setSelectedMonth(months[months.length - 1].name);
    }
  }, [months, selectedMonth]);

  useEffect(() => {
    if (!selectedMonth || !selectedWp) return;
    fetch(`${api}/workers/${encodeURIComponent(selectedMonth)}/${encodeURIComponent(selectedWp)}`)
      .then((r) => r.json())
      .then(setWorkers)
      .catch(console.error);
  }, [selectedMonth, selectedWp, api]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Přehled pracovníků</h2>

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

      <div className="bg-white rounded-xl shadow-sm p-6">
        {workers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200 text-left">
                  <th className="py-3 px-2">Jméno</th>
                  <th className="py-3 px-2">Pozice</th>
                  <th className="py-3 px-2 text-right">Úvazek</th>
                  <th className="py-3 px-2 text-right">Plán</th>
                  <th className="py-3 px-2 text-right">Skutečnost</th>
                  <th className="py-3 px-2 text-right">Rozdíl</th>
                  <th className="py-3 px-2 text-right">Intervence</th>
                  <th className="py-3 px-2 text-right">% plnění</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w, i) => {
                  const pct = w.plan ? ((w.reality / w.plan) * 100).toFixed(1) : '—';
                  const pctNum = w.plan ? (w.reality / w.plan) * 100 : 0;
                  let rowColor = '';
                  if (w.plan > 0) {
                    if (pctNum >= 100) rowColor = 'bg-green-50';
                    else if (pctNum < 90) rowColor = 'bg-orange-50';
                  }
                  return (
                    <tr key={i} className={`border-b border-gray-100 hover:bg-gray-50 ${rowColor}`}>
                      <td className="py-3 px-2 font-medium">{w.name}</td>
                      <td className="py-3 px-2 text-gray-600">{w.position}</td>
                      <td className="py-3 px-2 text-right">{w.uvazek?.toLocaleString('cs-CZ')}</td>
                      <td className="py-3 px-2 text-right">{fmtKc(w.plan)}</td>
                      <td className="py-3 px-2 text-right">{fmtKc(w.reality)}</td>
                      <td className={`py-3 px-2 text-right font-medium ${w.diff >= 0 ? 'text-accent' : 'text-warning'}`}>
                        {w.diff >= 0 ? '+' : ''}{fmtKc(w.diff)}
                      </td>
                      <td className="py-3 px-2 text-right">{fmt(w.interventions)}</td>
                      <td className={`py-3 px-2 text-right font-bold ${pctNum >= 100 ? 'text-accent' : pctNum >= 90 ? 'text-gray-700' : 'text-warning'}`}>
                        {pct}{pct !== '—' ? ' %' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            {months.length === 0 ? 'Nejsou k dispozici žádná data.' : 'Žádní pracovníci pro vybrané pracoviště.'}
          </p>
        )}
      </div>
    </div>
  );
}

export default WorkerTable;
