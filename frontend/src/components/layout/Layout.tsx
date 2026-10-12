import React from 'react';
import { Sidebar, NavPage } from './Sidebar';
import { Navbar } from './Navbar';
import { NotificationToast, ToastMessage } from '../common/NotificationToast';

interface LayoutProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  backendConnected: boolean;
  toasts: ToastMessage[];
  onDismissToast: (id: string) => void;
  workspaceVersion?: number;
  onWorkspaceChange?: () => void;
  onToast?: (type: 'success' | 'error' | 'info', msg: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentPage,
  onNavigate,
  backendConnected,
  toasts,
  onDismissToast,
  workspaceVersion,
  onWorkspaceChange,
  onToast,
  children,
}) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          currentPage={currentPage}
          backendConnected={backendConnected}
          onNavigate={onNavigate}
          workspaceVersion={workspaceVersion}
          onWorkspaceChange={onWorkspaceChange}
          onToast={onToast}
        />

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notification Container */}
      <NotificationToast toasts={toasts} onDismiss={onDismissToast} />
    </div>
  );
};
