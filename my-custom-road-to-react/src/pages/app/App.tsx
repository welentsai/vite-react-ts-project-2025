import './App.css';
import { useConfigContext } from '../../context/ConfigProvider';
import { SearchForm } from '../../components/search-form';
import { List } from '../../components/list';
import { useSearch } from './hooks/useSearch';
import { useStories } from './hooks/useStories';

const App = () => {
  console.log('App renders...');

  const {
    config,
    loading: configLoading,
    error: configError,
  } = useConfigContext();

  const {
    searchTerm,
    search,
    handleSearchInput,
    handleSearchSubmit,
  } = useSearch();

  // Construct the API URL
  const apiUrl = config?.apiUrl ? `${config.apiUrl}${search}` : '';

  const { stories, isLoading, isError, refetch, handleRemoveStory } =
    useStories(apiUrl);

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
        onSearchSubmit={e => handleSearchSubmit(e, refetch)}
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
