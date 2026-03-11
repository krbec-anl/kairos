import React, { useState, useCallback } from 'react';

function Upload({ api, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${api}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        onUpload();
      } else {
        setError(data.error || 'Chyba při nahrávání');
      }
    } catch (err) {
      setError('Chyba připojení k serveru');
    } finally {
      setUploading(false);
    }
  }, [api, onUpload]);

  const handleFileChange = (e) => {
    handleUpload(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
      handleUpload(file);
    } else {
      setError('Pouze .xlsx soubory jsou povoleny');
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Nahrát data</h2>

      <div
        className={`bg-white rounded-xl shadow-sm p-12 border-2 border-dashed transition-colors text-center ${
          dragActive ? 'border-primary bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <div className="mb-6">
          <svg className="mx-auto w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-lg text-gray-600 mb-4">
          Přetáhněte Excel soubor sem nebo klikněte pro výběr
        </p>
        <label className="inline-block cursor-pointer bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Vybrat soubor (.xlsx)
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
          Zpracovávání souboru...
        </div>
      )}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4 text-warning">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-accent font-semibold mb-2">{result.message}</p>
          <p className="text-sm text-gray-600">
            Načteno měsíců: {result.months?.length || 0}
          </p>
          {result.months && (
            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
              {result.months.map((m, i) => (
                <li key={i}>{m.month}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default Upload;
