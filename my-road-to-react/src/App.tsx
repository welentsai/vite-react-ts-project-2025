import './App.css';

const list = [
  {
    title: 'React',
    url: 'https://reactjs.org/',
    author: 'Jordan Walke',
    num_comments: 3,
    points: 4,
    objectID: 0,
  },
  {
    title: 'Redux',
    url: 'https://redux.js.org/',
    author: 'Dan Abramov, Andrew Clark',
    num_comments: 2,
    points: 5,
    objectID: 1,
  },
];

function App() {
  // const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <h1>My Hacker Stories</h1>

        <label htmlFor="Search">Search: </label>
        <input type="text" id="Search" />

        <hr />

        <ul>
          {list.map(item => (
            // JSX to return
            <li key={item.objectID}>
              <span>
                <a href={item.url}>{item.title}</a>
              </span>
              <span>{item.author}</span>
              <span>{item.num_comments}</span>
              <span>{item.points}</span>
              {item.title}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
