import { useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadFromStorage, saveScrollPosition } from '@/utils/browseStorage';

export const useBrowseNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const tab = searchParams.get('tab') || 'recipes';

  // Set URL tab parameter from storage if no URL parameter exists
  useEffect(() => {
    if (!searchParams.get('tab')) {
      const storedTab = loadFromStorage('activeTab', 'recipes');
      setSearchParams({ tab: storedTab });
    }
  }, [searchParams, setSearchParams]);

  const handleTabClick = useCallback((key: string) => {
    setSearchParams({ tab: key });
  }, [setSearchParams]);

  const handleCreateRecipe = useCallback(() => {
    // Save current scroll position and visible recipe count before navigating
    saveScrollPosition(9); // Default count
    navigate('/recipes/create');
  }, [navigate]);

  const handleCreateMealPlan = useCallback(() => {
    // Save current scroll position and visible recipe count before navigating
    saveScrollPosition(9); // Default count
    navigate('/meal-plan/create');
  }, [navigate]);

  return {
    tab,
    handleTabClick,
    handleCreateRecipe,
    handleCreateMealPlan,
  };
}; 