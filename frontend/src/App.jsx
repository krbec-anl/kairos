import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import MonthCompare from './components/MonthCompare';
import WeeklyChart from './components/WeeklyChart';
import WorkerTable from './components/WorkerTable';
import Upload from './components/Upload';

const API = '/api';

const navItems = [
  { to: '/', label: 'Přehled' },
  { to: '/compare', label: 'Srovnání měsíců' },
  { to: '/weekly', label: 'Týdenní trendy' },
  { to: '/workers', label: 'Pracovníci' },
  { to: '/upload', label: 'Nahrát data' },
];

function App() {
  const [months, setMonths] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchMonths = () => {
    fetch(`${API}/months`)
      .then((r) => r.json())
      .then(setMonths)
      .catch(() => {});
  };

  useEffect(() => {
    fetchMonths();
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        {/* Mobile menu button */}
        <button
          className="lg:hidden fixed top-4 left-4 z-50 bg-primary text-white p-2 rounded-md"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary text-white transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="p-6 border-b border-primary-light">
            <h1 className="text-xl font-bold">FOKUS LABE</h1>
            <p className="text-sm opacity-75 mt-1">Interní dashboard</p>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-light text-white' : 'text-white/80 hover:bg-primary-light/50 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          <Routes>
            <Route path="/" element={<Dashboard months={months} api={API} />} />
            <Route path="/compare" element={<MonthCompare months={months} api={API} />} />
            <Route path="/weekly" element={<WeeklyChart months={months} api={API} />} />
            <Route path="/workers" element={<WorkerTable months={months} api={API} />} />
            <Route path="/upload" element={<Upload api={API} onUpload={fetchMonths} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
