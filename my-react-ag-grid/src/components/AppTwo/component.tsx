import { useState } from 'react';
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import { DataGrid } from '@/components/DataGrid';

export function AppTwo() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="flex justify-center gap-8 mb-8"></div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Vite + React + TypeScript + Tailwind + AG Grid
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-6xl mb-8">
        <h2 className="text-xl font-semibold mb-4">Basic AG Grid Example</h2>
        <DataGrid />
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
