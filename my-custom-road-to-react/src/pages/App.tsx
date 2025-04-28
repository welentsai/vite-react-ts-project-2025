import * as React from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import './App.css';
import { useConfigContext } from '../context/ConfigProvider';
import { SearchForm } from '../components/search-form';
import { List } from '../components/list';

type Story = {
  objectID: number;
  url: string;
  title: string;
  author: string;
  num_comments: number;
  points: number;
};

const useStorageState = (key: string, initialState: string) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [key, value]);

  return [value, setValue] as const;
};

// API service function to fetch stories
const fetchStories = async (url: string): Promise<Story[]> => {
  if (!url) return [];

  const response = await axios.get(url);
  return response.data.hits;
};

const App = () => {
  console.log('App renders...');
  const {
    config,
    loading: configLoading,
    error: configError,
  } = useConfigContext();

  const [searchTerm, setSearchTerm] = useStorageState(
    'search',
    'React'
  );

  const [search, setSearch] = React.useState(searchTerm);

  // Initialize the query client
  const queryClient = useQueryClient();

  // Construct the API URL
  const apiUrl = config?.apiUrl ? `${config.apiUrl}${search}` : '';

  // Fetch stories with React Query
  const {
    data: stories = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['stories', apiUrl],
    queryFn: () => fetchStories(apiUrl),
    enabled: !!apiUrl, // Only run the query if we have a valid URL
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  // Remove story mutation
  const removeStoryMutation = useMutation({
    mutationFn: (item: Story) => Promise.resolve(item), // No actual API call needed for removal
    onSuccess: removedStory => {
      // Update the cache by filtering out the removed story
      queryClient.setQueryData(
        ['stories', apiUrl],
        (oldData: Story[] | undefined) =>
          oldData
            ? oldData.filter(
                story => story.objectID !== removedStory.objectID
              )
            : []
      );
    },
  });

  const handleRemoveStory = (item: Story) => {
    removeStoryMutation.mutate(item);
  };

  const handleSearchInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSearch(searchTerm);
    refetch(); // Explicitly refetch data with the new search term
  };

  // Show loading state while config is loading
  if (configLoading) {
    return <div>Loading application configuration...</div>;
  }

  // Show error if config couldn't be loaded
  if (configError) {
    return (
      <div className="error">
        <h2>Configuration Error</h2>
        <p>{configError.message}</p>
        <button onClick={() => window.location.reload()}>
          Reload App
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>My Hacker Stories</h1>

      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <hr />

      {isError && <p>Something went wrong</p>}

      {isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List list={stories} onRemoveItem={handleRemoveStory} />
      )}
    </div>
  );
};

export default App;
