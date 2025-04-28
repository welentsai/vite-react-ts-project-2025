import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { ConfigProvider } from './context/ConfigProvider.tsx';
import App from './pages/App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </StrictMode>
);
