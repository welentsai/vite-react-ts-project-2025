import * as React from 'react';
import './App.css';

type Story = {
  objectID: number;
  url: string;
  title: string;
  author: string;
  num_comments: number;
  points: number;
};

const useStorageState = (key: string, initialState: string) => {
  const [value, setValue] = React.useState(localStorage.getItem(key) || initialState);

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};

const App = () => {
  console.log('App renders...');

  const stories: Array<Story> = [
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

  const [searchItem, setSearchItem] = useStorageState('search', 'React');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // console.log('App component', 'handleChange', event.target.value);
    setSearchItem(event.target.value);
  };

  const searchedStories = stories.filter(story =>
    story.title.toLowerCase().includes(searchItem.toLowerCase())
  );

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <Search onSearch={handleChange} searchItem={searchItem} />

      <hr />

      <List list={searchedStories} />
    </div>
  );
};

type SearchProps = {
  searchItem: string;
  onSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const Search = ({ onSearch, searchItem }: SearchProps) => {
  console.log('Search renders...');

  return (
    <div>
      <label htmlFor="Search">Search: </label>
      <input id="Search" type="text" value={searchItem} onChange={onSearch} />
      <p>
        Searching for <strong>{searchItem}</strong>.
      </p>
    </div>
  );
};

type ListProps = {
  list: Array<Story>;
};

const List = ({ list }: ListProps) => {
  console.log('List renders...');

  return (
    <ul>
      {list.map(item => (
        <Item key={item.objectID} item={item} />
      ))}
    </ul>
  );
};

type ItemProps = {
  item: Story;
};

const Item = ({ item }: ItemProps) => (
  <li>
    <span>
      <a href={item.url}>{item.title}</a>
    </span>
    <span>{item.author}</span>
    <span>{item.num_comments}</span>
    <span>{item.points}</span>
    {item.title}
  </li>
);

export default App;
