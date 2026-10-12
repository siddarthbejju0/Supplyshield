import React, { useEffect, useState } from 'react';
import { NavPage } from './Sidebar';
import { ChevronRight, Building2, Upload, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../../api/client';

interface NavbarProps {
  currentPage: NavPage;
  backendConnected: boolean;
  onNavigate: (page: NavPage) => void;
  workspaceVersion?: number;
  onWorkspaceChange?: () => void;
  onToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  backendConnected,
  onNavigate,
  workspaceVersion,
  onWorkspaceChange,
  onToast,
}) => {
  const [companyInfo, setCompanyInfo] = useState<{
    company_name: string;
    inventory_count: number;
    suppliers_count: number;
  }>({
    company_name: 'My Company',
    inventory_count: 0,
    suppliers_count: 0,
  });
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (backendConnected) {
      api.getCompanyInfo()
        .then((res) => {
          setCompanyInfo({
            company_name: res.company_name || 'My Company',
            inventory_count: res.inventory_count || 0,
            suppliers_count: res.suppliers_count || 0,
          });
        })
        .catch(() => {});
    }
  }, [backendConnected, currentPage, workspaceVersion]);

  const handleLoadSample = async () => {
    setLoadingAction(true);
    try {
      await api.loadSampleData();
      if (onToast) onToast('success', 'Loaded Northstar Retail sample data. Analysis generated.');
      onWorkspaceChange?.();
    } catch (err: any) {
      if (onToast) onToast('error', `Failed to load sample data: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleClearWorkspace = async () => {
    setLoadingAction(true);
    try {
      await api.clearWorkspace();
      if (onToast) onToast('info', 'Workspace cleared to initial state (0 records).');
      onWorkspaceChange?.();
    } catch (err: any) {
      if (onToast) onToast('error', `Failed to clear workspace: ${err.message}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const pageTitles: Record<NavPage, { title: string; subtitle: string }> = {
    overview: {
      title: 'Operations Overview',
      subtitle: 'Key inventory metrics, supplier health, and critical risk alerts',
    },
    inventory: {
      title: 'Inventory Management',
      subtitle: 'Stock levels, days of cover, demand run-rates, and reorder points',
    },
    suppliers: {
      title: 'Supplier Performance',
      subtitle: 'Delivery reliability, lead times, and vendor risk ratings',
    },
    simulator: {
      title: 'Disruption Simulator',
      subtitle: 'Model supplier delays, stock depletion, and customer demand surges',
    },
    mitigation: {
      title: 'Mitigation Planner',
      subtitle: 'Compare express shipping, backup suppliers, and stock transfers',
    },
    'data-explorer': {
      title: 'Data & Import',
      subtitle: 'Manage company datasets, review records, and upload files',
    },
    methodology: {
      title: 'Formulas & Methodology',
      subtitle: 'How calculations, safety stock, and supplier scores are determined',
    },
  };

  const currentInfo = pageTitles[currentPage];
  const isEmpty = companyInfo.inventory_count === 0;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-10">
      {/* Title */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>SupplyShield</span>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="capitalize text-slate-800 font-semibold">{currentPage.replace('-', ' ')}</span>
        </div>
        <h1 className="text-base font-bold text-slate-900 leading-tight">
          {currentInfo.title}
        </h1>
      </div>

      {/* Workspace & Action */}
      <div className="flex items-center gap-2.5">
        {/* Company Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <Building2 className="w-4 h-4 text-slate-600" />
          <span className="text-slate-500 font-medium">Company:</span>
          <span className="font-semibold text-slate-800">{companyInfo.company_name}</span>
          {isEmpty && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
              Empty
            </span>
          )}
        </div>

        {/* Dynamic Action: Load Sample if empty, or Clear if populated */}
        {isEmpty ? (
          <button
            onClick={handleLoadSample}
            disabled={loadingAction}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-300" />
            {loadingAction ? 'Loading Analysis...' : 'Load Sample Data'}
          </button>
        ) : (
          <button
            onClick={handleClearWorkspace}
            disabled={loadingAction}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            Clear Workspace
          </button>
        )}

        <button
          onClick={() => onNavigate('data-explorer')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
        >
          <Upload className="w-3.5 h-3.5 text-slate-500" />
          Import CSV
        </button>
      </div>
    </header>
  );
};
