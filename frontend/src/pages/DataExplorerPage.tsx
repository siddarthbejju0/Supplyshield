import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DataExplorerResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Download,
  Search,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  Building2,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface Props {
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
  onWorkspaceChange?: () => void;
}

export const DataExplorerPage: React.FC<Props> = ({ onToast, onWorkspaceChange }) => {
  const [data, setData] = useState<DataExplorerResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('inventory.csv');
  const [loading, setLoading] = useState(true);
  const [previewSearch, setPreviewSearch] = useState('');

  // Upload state
  const [companyName, setCompanyName] = useState<string>('');
  const [uploadFileType, setUploadFileType] = useState<string>('inventory');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getDataQuality(), api.getCompanyInfo()])
      .then(([qualData, compInfo]) => {
        setData(qualData);
        setCompanyName(compInfo.company_name || 'Northstar Retail');
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        onToast('error', `Failed to load data: ${err.message}`);
      });
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/data-explorer/export/${filename}`, '_blank');
    onToast('success', `Downloading ${filename}`);
  };

  const handleClearWorkspace = async () => {
    try {
      await api.clearWorkspace(companyName || 'My Company');
      onToast('success', 'Workspace cleared! 0 items loaded. You are now in a fresh blank workspace.');
      loadData();
      onWorkspaceChange?.();
    } catch (err: any) {
      onToast('error', `Failed to clear workspace: ${err.message}`);
    }
  };

  const handleLoadSample = async () => {
    try {
      await api.resetDemoData();
      onToast('success', 'Loaded Northstar Retail sample datasets.');
      loadData();
      onWorkspaceChange?.();
    } catch (err: any) {
      onToast('error', `Failed to load sample: ${err.message}`);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFileObj) {
      onToast('error', 'Please select a CSV file to upload.');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadDataset(
        uploadFileType,
        selectedFileObj,
        companyName || undefined
      );
      setUploading(false);
      setSelectedFileObj(null);
      onToast('success', res.message || 'Data uploaded successfully! Live calculations refreshed.');
      loadData();
      onWorkspaceChange?.();
    } catch (err: any) {
      setUploading(false);
      onToast('error', `Upload failed: ${err.message}`);
    }
  };

  if (loading) return <LoadingSpinner message="Loading data explorer..." />;
  if (!data) return null;

  const currentDataset = data.datasets.find((d) => d.filename === selectedFile) || data.datasets[0];

  const filteredRecords = currentDataset.sample_records.filter((rec) => {
    if (!previewSearch) return true;
    const q = previewSearch.toLowerCase();
    return Object.values(rec).some((val) => String(val).toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      {/* Upload Your Company Data Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-600" />
              Upload & Ingest Company CSV
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Import your company's CSV files to automatically generate live risk intelligence and predictions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearWorkspace}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear to Empty Workspace
            </button>
            <button
              onClick={handleLoadSample}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Load Sample Company
            </button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Company Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Logistics Ltd"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Dataset Type</label>
            <select
              value={uploadFileType}
              onChange={(e) => setUploadFileType(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="inventory">Inventory & Stock (inventory.csv)</option>
              <option value="suppliers">Suppliers (suppliers.csv)</option>
              <option value="purchase_orders">Purchase Orders (purchase_orders.csv)</option>
              <option value="demand_history">Demand Timeseries (demand_history.csv)</option>
              <option value="supplier_product_options">Backup Sourcing (supplier_product_options.csv)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSelectedFileObj(e.target.files?.[0] || null)}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={uploading || !selectedFileObj}
              className="w-full py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-lg transition-colors shadow-2xs"
            >
              {uploading ? 'Processing...' : 'Upload & Calculate Live'}
            </button>
          </div>
        </form>
      </div>

      {/* Dataset Explorer Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Tab Selector */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 p-2 gap-1.5">
          {data.datasets.map((d) => (
            <button
              key={d.filename}
              onClick={() => setSelectedFile(d.filename)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedFile === d.filename
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>{d.dataset_name}</span>
              <span className="text-[10px] text-slate-400">({d.record_count})</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span><strong>File:</strong> {currentDataset.filename}</span>
            <span><strong>Records:</strong> {currentDataset.record_count}</span>
            <span><strong>Columns:</strong> {currentDataset.column_count}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search table..."
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={() => handleDownload(currentDataset.filename)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 text-[11px] font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                {currentDataset.columns.map((col) => (
                  <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  {currentDataset.columns.map((col) => (
                    <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
