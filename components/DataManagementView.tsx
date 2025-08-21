

import React, { useState } from 'react';
import { Student, Rule, PointTransaction } from '../types';
import { supabase, supabaseProjectRef } from '../supabase/client';
import { DownloadIcon, UploadCloudIcon, ExternalLinkIcon, DatabaseIcon } from './icons';

interface DataManagementViewProps {
  students: Student[];
  rules: Rule[];
}

const DataManagementView: React.FC<DataManagementViewProps> = ({ students, rules }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const { data: transactions, error: txError } = await supabase.from('point_transactions').select('*');
      if (txError) throw txError;
      
      const exportData = {
        students,
        rules,
        transactions,
        exportedAt: new Date().toISOString(),
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
      const link = document.createElement("a");
      link.href = jsonString;
      link.download = `epoin_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (err: any) {
      setError(`Gagal mengekspor data: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Basic import handler (UI only for now)
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          setIsImporting(true);
          setError("Fungsi impor belum diimplementasikan sepenuhnya. Harap lakukan impor manual melalui Supabase Studio.");
          // In a full implementation, you'd read the file here:
          // const reader = new FileReader();
          // reader.onload = (e) => {
          //   const content = e.target.result;
          //   // process content...
          // };
          // reader.readAsText(file);
          setTimeout(() => setIsImporting(false), 3000);
      }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Manajemen Data</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <DownloadIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Ekspor Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Unduh semua data siswa, peraturan, dan riwayat poin sebagai file cadangan JSON. Simpan file ini di tempat yang aman.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
          >
            {isExporting ? 'Mengekspor...' : 'Ekspor Semua Data'}
          </button>
        </div>
        
        {/* Import Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <div className="flex items-center mb-4">
            <UploadCloudIcon className="h-8 w-8 text-green-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Impor Data</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Impor data dari file cadangan JSON. Fitur ini masih dalam pengembangan. Untuk saat ini, silakan gunakan Supabase Studio.
          </p>
          <label className="w-full cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
            {isImporting ? 'Memproses...' : 'Pilih File JSON...'}
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>
        </div>

      </div>

      {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
      
      <div className="mt-8 bg-blue-50 border border-blue-200 p-6 rounded-lg">
         <div className="flex items-center mb-3">
            <DatabaseIcon className="h-6 w-6 text-blue-700 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">Manajemen Lanjutan via Supabase</h3>
          </div>
          <p className="text-sm text-blue-800 mb-4">
            Untuk manajemen data yang lebih canggih, seperti impor massal atau menjalankan kueri SQL, Anda dapat langsung mengakses tabel data Anda di Supabase Studio.
          </p>
          <a
            href={`https://supabase.com/dashboard/project/${supabaseProjectRef}/editor`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Buka Supabase Table Editor <ExternalLinkIcon className="h-4 w-4 ml-2" />
          </a>
      </div>

    </div>
  );
};

export default DataManagementView;