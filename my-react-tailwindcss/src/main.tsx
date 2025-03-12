import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import App from './App.tsx';
import { Layout } from './components/Layout';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* <Layout>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-2xl font-semibold text-gray-800">
          Welcome to the Dashboard
        </h2>
        <p className="text-gray-600">
          This is an example of using the Layout component with a collapsible
          sidebar. Try clicking the chevron icon in the sidebar to collapse or
          expand it.
        </p>
      </div>
    </Layout> */}
  </StrictMode>
);
