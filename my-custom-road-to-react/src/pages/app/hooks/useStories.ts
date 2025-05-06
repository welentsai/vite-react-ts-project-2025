import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import axios from 'axios';
import { Story } from '../type';

// API service function to fetch stories
const fetchStories = async (url: string): Promise<Story[]> => {
  if (!url) return [];

  const response = await axios.get(url);
  return response.data.hits;
};

export const useStories = (apiUrl: string) => {
  const queryClient = useQueryClient();

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

  return {
    stories,
    isLoading,
    isError,
    refetch,
    handleRemoveStory,
  };
};
