const STORAGE_KEY = 'browse-page-state';

export const saveToStorage = (key: string, value: any) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    stored[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn('Failed to save browse state to localStorage:', error);
  }
};

export const loadFromStorage = (key: string, defaultValue: any) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return stored[key] !== undefined ? stored[key] : defaultValue;
  } catch (error) {
    console.warn('Failed to load browse state from localStorage:', error);
    return defaultValue;
  }
};

export const saveScrollPosition = (visibleRecipeCount: number) => {
  sessionStorage.setItem('browsePageScrollPosition', window.scrollY.toString());
  sessionStorage.setItem('browsePageVisibleRecipeCount', visibleRecipeCount.toString());
};

export const restoreScrollPosition = () => {
  const savedScrollPosition = sessionStorage.getItem('browsePageScrollPosition');
  const savedVisibleRecipeCount = sessionStorage.getItem('browsePageVisibleRecipeCount');
  
  if (savedVisibleRecipeCount) {
    const count = parseInt(savedVisibleRecipeCount, 10);
    setTimeout(() => {
      if (savedScrollPosition) {
        window.scrollTo(0, parseInt(savedScrollPosition, 10));
      }
      sessionStorage.removeItem('browsePageScrollPosition');
      sessionStorage.removeItem('browsePageVisibleRecipeCount');
    }, 300);
    return count;
  }
  return 9; // default value
}; 