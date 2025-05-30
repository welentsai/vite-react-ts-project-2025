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
import { AllCommunityModule, ModuleRegistry, provideGlobalGridOptions } from 'ag-grid-community';
import ConfigOperation from './pages/config-operation';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Create a client
const queryClient = new QueryClient();

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ConfigOperation />
      </QueryClientProvider>
    </StrictMode>

    // <StrictMode>
    //   <ConfigOperation />
    //   {/* <DataGrid /> */}
    //   {/* <DataGridWithSheetJS /> */}
    //   {/* <AppGroupedGrid /> */}
    //   {/* <AppThree /> */}
    //   {/* <AppTwo /> */}
    //   {/* <Layout>
    //   </Layout> */}
    // </StrictMode>
  );
});
