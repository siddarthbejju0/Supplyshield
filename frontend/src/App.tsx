import React, { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { NavPage } from './components/layout/Sidebar';
import { ToastMessage } from './components/common/NotificationToast';
import { OverviewPage } from './pages/OverviewPage';
import { InventoryPage } from './pages/InventoryPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { MitigationPage } from './pages/MitigationPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { api } from './api/client';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [targetId, setTargetId] = useState<string | undefined>(undefined);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [workspaceVersion, setWorkspaceVersion] = useState<number>(0);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = () => {
    api.getHealth()
      .then((res) => {
        if (res.status === 'healthy') {
          setBackendConnected(true);
        }
      })
      .catch(() => {
        setBackendConnected(false);
      });
  };

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (page: NavPage, newTargetId?: string) => {
    setCurrentPage(page);
    setTargetId(newTargetId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWorkspaceChange = () => {
    setWorkspaceVersion((v) => v + 1);
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={handleNavigate}
      backendConnected={backendConnected}
      toasts={toasts}
      onDismissToast={dismissToast}
      workspaceVersion={workspaceVersion}
      onWorkspaceChange={handleWorkspaceChange}
      onToast={addToast}
    >
      {currentPage === 'overview' && (
        <OverviewPage
          key={workspaceVersion}
          onNavigate={handleNavigate}
          onToast={addToast}
          onWorkspaceChange={handleWorkspaceChange}
        />
      )}
      {currentPage === 'inventory' && (
        <InventoryPage
          key={workspaceVersion}
          initialProductId={targetId}
          onNavigate={handleNavigate}
          onToast={addToast}
        />
      )}
      {currentPage === 'suppliers' && (
        <SuppliersPage
          key={workspaceVersion}
          initialSupplierId={targetId}
          onNavigate={handleNavigate}
          onToast={addToast}
        />
      )}
      {currentPage === 'simulator' && (
        <SimulatorPage
          key={workspaceVersion}
          initialTargetId={targetId}
          onNavigate={handleNavigate}
          onToast={addToast}
        />
      )}
      {currentPage === 'mitigation' && (
        <MitigationPage
          key={workspaceVersion}
          initialProductId={targetId}
          onNavigate={handleNavigate}
          onToast={addToast}
        />
      )}
      {currentPage === 'data-explorer' && (
        <DataExplorerPage
          key={workspaceVersion}
          onToast={addToast}
          onWorkspaceChange={handleWorkspaceChange}
        />
      )}
      {currentPage === 'methodology' && <MethodologyPage />}
    </Layout>
  );
};

export default App;
