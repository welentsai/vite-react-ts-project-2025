import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { Button } from '@/components/ui/button';

function App() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    console.log('handle click !!');
  };

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold underline">Hello world!</h1>
        <div className="flex min-h-svh flex-col items-center justify-center">
          <Button onClick={handleClick}>Click me</Button>
        </div>
      </div>
    </>
  );
}

export default App;
