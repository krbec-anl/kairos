import React from 'react';

const fmt = (n) => Math.round(n || 0).toLocaleString('cs-CZ');
const fmtKc = (n) => fmt(n) + ' Kč';

function CDZCard({ workplace }) {
  const pct = workplace.plan ? ((workplace.reality / workplace.plan) * 100).toFixed(1) : '0.0';
  const isPositive = workplace.diff >= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <h4 className="font-semibold text-gray-800 mb-3">{workplace.name}</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Plán</span>
          <span>{fmtKc(workplace.plan)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Skutečnost</span>
          <span className="font-medium">{fmtKc(workplace.reality)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Plnění</span>
          <span className={`font-bold ${Number(pct) >= 100 ? 'text-accent' : Number(pct) >= 90 ? 'text-gray-700' : 'text-warning'}`}>
            {pct} %
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Intervence</span>
          <span>{fmt(workplace.interventions)}</span>
        </div>
      </div>
      <div className={`mt-3 pt-3 border-t text-center font-semibold text-sm ${isPositive ? 'text-accent' : 'text-warning'}`}>
        {isPositive ? '+' : ''}{fmtKc(workplace.diff)}
      </div>
    </div>
  );
}

export default CDZCard;
