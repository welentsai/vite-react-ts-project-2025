import reactLogo from '@/assets/react.svg';
import { useState } from 'react';
// import viteLogo from '@/assets/vite.svg'
import { CustomDataGrid } from '@/components/CustomDataGrid';
import { DataGrid } from '@/components/DataGrid';

function AppThree() {
  const [count, setCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'basic' | 'custom'>('basic');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="flex justify-center gap-8 mb-6">
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img
            src={reactLogo}
            className="h-16 animate-spin-slow hover:drop-shadow-xl transition-all"
            alt="React logo"
          />
        </a>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Vite + React + TypeScript + Tailwind + AG Grid
      </h1>

      <div className="w-full max-w-6xl mb-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'basic'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Grid
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'custom'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Custom Styled Grid
            </button>
          </div>

          <div className="p-6">{activeTab === 'basic' ? <DataGrid /> : <CustomDataGrid />}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md max-w-md w-full text-center">
        <button
          onClick={() => setCount(count => count + 1)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          Count is {count}
        </button>
      </div>
    </div>
  );
}

export default AppThree;
