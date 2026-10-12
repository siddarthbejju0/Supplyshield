import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Building2,
  Activity,
  ShieldCheck,
  Database,
  Shield
} from 'lucide-react';

export type NavPage =
  | 'data-explorer'
  | 'overview'
  | 'inventory'
  | 'suppliers'
  | 'simulator'
  | 'mitigation'
  | 'methodology';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate }) => {
  // Ordered strictly according to the natural 6-step project narrative flow
  const navItems: Array<{ id: NavPage; label: string; icon: React.ElementType }> = [
    { id: 'data-explorer', label: '1. Data & Import', icon: Database },
    { id: 'overview', label: '2. Overview', icon: LayoutDashboard },
    { id: 'inventory', label: '3. Inventory', icon: Boxes },
    { id: 'suppliers', label: '4. Suppliers', icon: Building2 },
    { id: 'simulator', label: '5. Disruption Simulator', icon: Activity },
    { id: 'mitigation', label: '6. Mitigation Planner', icon: ShieldCheck },
  ];

  return (
    <aside className="w-60 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-900/40">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-bold text-white tracking-tight">
              SupplyShield <span className="text-sky-400">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Risk Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Workflow
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-sky-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Clean Footer */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
        <p className="font-semibold text-slate-300">SupplyShield Enterprise</p>
        <p className="text-[10px] text-slate-500">v1.0 Production Edition</p>
      </div>
    </aside>
  );
};
