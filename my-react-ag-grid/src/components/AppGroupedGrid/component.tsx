// src/App.tsx
import reactLogo from '@/assets/react.svg';
import { CustomGroupingGrid } from '@/components/GroupedDataGrid';
import { useState } from 'react';

export function AppGroupedGrid() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center gap-6 mb-6">
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img
              src={reactLogo}
              className="h-12 animate-spin-slow hover:drop-shadow-xl transition-all"
              alt="React logo"
            />
          </a>
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          AG Grid Row Grouping Example
        </h1>

        <div className="mb-8">
          <CustomGroupingGrid />
        </div>

        <div className="flex justify-center mt-8">
          <div className="bg-white p-4 rounded-xl shadow-md max-w-md w-full text-center">
            <button
              onClick={() => setCount(count => count + 1)}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              Count is {count}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
