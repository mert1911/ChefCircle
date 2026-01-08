# Browse Page Custom Hooks

This document describes the custom hooks extracted from the Browse.tsx component to improve code organization and reusability.

## Hooks Overview

### 1. `useBrowseData` - Data Fetching and Interactions
**Purpose**: Manages all data fetching, state management, and user interactions for the browse page.

**Features**:
- Fetches recipes and mealplans
- Manages favorites and planned recipes
- Handles user interactions (toggle favorites, meal planning)
- Manages loading and error states
- Handles navigation with scroll position preservation

**Usage**:
```typescript
const {
  recipes,
  mealplans,
  loading,
  mealplansLoading,
  error,
  mealplansError,
  favorites,
  userPlannedRecipes,
  favoriteMealplans,
  previewDialogOpen,
  selectedMealPlan,
  isPremium,
  handleToggleFavorite,
  handleToggleMealplan,
  handleToggleFavoriteMealplan,
  handleRecipeNavigation,
  handleImportMealPlan,
  setPreviewDialogOpen,
  setSelectedMealPlan,
} = useBrowseData({ tab, visibleRecipeCount });
```

### 2. `useBrowseFilters` - Filtering Logic
**Purpose**: Handles all filtering logic for recipes and mealplans.

**Features**:
- Filters recipes by search query, cuisine, difficulty, time, tags, nutrition
- Filters mealplans by search query, difficulty, tags, nutrition (premium)
- Memoized filtering for performance
- Premium-only nutrition filtering for mealplans

**Usage**:
```typescript
const { filteredRecipes, filteredMealPlans } = useBrowseFilters({
  recipes,
  mealplans,
  recipeFilters,
  mealplanFilters,
  favorites,
  userPlannedRecipes,
  favoriteMealplans,
  isPremium,
});
```

### 3. `useBrowseNavigation` - Navigation and URL Management
**Purpose**: Manages tab navigation and URL state.

**Features**:
- Manages active tab state
- Handles tab switching
- Manages URL parameters
- Handles navigation to create pages

**Usage**:
```typescript
const {
  tab,
  handleTabClick,
  handleCreateRecipe,
  handleCreateMealPlan,
} = useBrowseNavigation();
```

### 4. `useBrowseState` - State Management (Enhanced)
**Purpose**: Manages UI state and persistence.

**Features**:
- Manages filter states
- Handles localStorage persistence
- Manages scroll position restoration
- Manages visible recipe count

**Usage**:
```typescript
const {
  recipeFilters,
  setRecipeFilters,
  mealplanFilters,
  setMealplanFilters,
  showRecipeFilters,
  setShowRecipeFilters,
  showMealplanFilters,
  setShowMealplanFilters,
  visibleRecipeCount,
  setVisibleRecipeCount,
} = useBrowseState();
```

## Utility Functions

### `browseStorage.ts`
**Purpose**: Centralized storage utilities for browse page state.

**Functions**:
- `saveToStorage(key, value)` - Save to localStorage
- `loadFromStorage(key, defaultValue)` - Load from localStorage
- `saveScrollPosition(count)` - Save scroll position and recipe count
- `restoreScrollPosition()` - Restore scroll position and return recipe count

## Refactored Browse.tsx Structure

The main Browse.tsx component can now be simplified to:

```typescript
export default function Browse() {
  const { tab, handleTabClick, handleCreateRecipe } = useBrowseNavigation();
  const { visibleRecipeCount, setVisibleRecipeCount, ...filterState } = useBrowseState();
  const { recipes, mealplans, loading, error, ...dataActions } = useBrowseData({ 
    tab, 
    visibleRecipeCount 
  });
  const { filteredRecipes, filteredMealPlans } = useBrowseFilters({
    recipes,
    mealplans,
    // ... other props
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BrowseHeader onCreateRecipe={handleCreateRecipe} />
        <BrowseTabs 
          tab={tab}
          onTabChange={handleTabClick}
          recipes={filteredRecipes}
          mealplans={filteredMealPlans}
          loading={loading}
          error={error}
          {...dataActions}
          visibleRecipeCount={visibleRecipeCount}
          onLoadMore={() => setVisibleRecipeCount(prev => prev + 9)}
        />
      </main>
    </div>
  );
}
```

## Benefits

1. **Separation of Concerns**: Each hook has a single responsibility
2. **Reusability**: Hooks can be reused in other components
3. **Testability**: Smaller, focused hooks are easier to test
4. **Maintainability**: Changes are isolated to specific files
5. **Performance**: Better memoization and fewer re-renders
6. **Readability**: Main component is much cleaner and easier to understand

## Migration Steps

1. ✅ Extract `useBrowseData` - Data fetching and interactions
2. ✅ Extract `useBrowseFilters` - Filtering logic
3. ✅ Extract `useBrowseNavigation` - Navigation and URL management
4. ✅ Enhance `useBrowseState` - State management
5. ✅ Create `browseStorage.ts` - Storage utilities
6. 🔄 Update Browse.tsx to use new hooks
7. 🔄 Extract components (BrowseHeader, BrowseTabs, etc.)
8. 🔄 Add error boundaries and loading states 