import * as React from 'react';
import { useStorageState } from './useStorageState';

export const useSearch = (initialSearch: string = 'React') => {
  const [searchTerm, setSearchTerm] = useStorageState(
    'search',
    initialSearch
  );
  const [search, setSearch] = React.useState(searchTerm);

  const handleSearchInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    onSubmit?: () => void
  ) => {
    event.preventDefault();
    setSearch(searchTerm);
    onSubmit?.();
  };

  return {
    searchTerm,
    search,
    handleSearchInput,
    handleSearchSubmit,
  };
};
