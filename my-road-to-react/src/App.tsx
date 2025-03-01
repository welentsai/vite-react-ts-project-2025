// import { useState } from 'react';
// import reactLogo from './assets/react.svg';
// import viteLogo from '/vite.svg';
import './App.css';

const a = ['a', 'b', 'c', 'd', 'e'];

const welcome = {
  greeting: 'Hey',
  title: 'React',
};

function getTitle(title: string) {
  return title;
}

function App() {
  // const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <h1>Hello {getTitle(welcome.title)}</h1>
        <h1>
          {welcome.greeting} {welcome.title}
        </h1>
        <label htmlFor="search">Search: </label>
        <input id="search" type="text" />

        {a.map((item, index) => (
          <div key={index}>{item}</div>
        ))}
      </div>
    </>
  );
}

export default App;
