// import { AppTwo } from '@/components/AppTwo';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
// import App from './App.tsx';
// import { Layout } from './components/Layout';

// Import AG Grid styles
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
// import AppThree from './components/AppThree/component';
// import { AppGroupedGrid } from '@/components/AppGroupedGrid';
// import { AppTwo } from '@/components/AppTwo';

// import { DataGridWithSheetJS } from '@/components/DataGridWithSheetJs';
import { DataGrid } from '@/components/DataGrid';
import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);
// Mark all grids as using legacy themes
provideGlobalGridOptions({ theme: 'legacy' });

// always enable mocking
async function enableMocking() {
  const { worker } = await import('./mocks/browser');

  // Start the worker
  return worker.start({
    onUnhandledRequest: 'warn',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <DataGrid />
      {/* <DataGridWithSheetJS /> */}
      {/* <AppGroupedGrid /> */}
      {/* <AppThree /> */}
      {/* <AppTwo /> */}
      {/* <Layout>
      </Layout> */}
    </StrictMode>
  );
});
