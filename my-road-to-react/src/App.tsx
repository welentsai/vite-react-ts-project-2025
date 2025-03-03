import * as React from 'react';
import './App.css';

type Story = {
  title: string;
  url: string;
  author: string;
  num_comments: number;
  points: number;
  objectID: number;
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

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <Search />

      <hr />

      <List list={stories} />
    </div>
  );
};

const Search = () => {
  console.log('Search renders...');

  // perform a task in between
  const [searchItem, setSearchItem] = React.useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // console.log(event);
    // console.log(event.target.value);
    setSearchItem(event.target.value);
  };

  return (
    <div>
      <label htmlFor="Search">Search: </label>
      <input type="text" id="Search" onChange={handleChange} />
      <p>
        Searching for <strong>{searchItem}</strong>.
      </p>
    </div>
  );
};

type ListProps = {
  list: Story[];
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
