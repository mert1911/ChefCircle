import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Filter, Calendar, Crown } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface RecipeFilters {
  searchQuery: string;
  selectedCuisine: string;
  selectedPrepTime: string;
  selectedCookTime: string;
  selectedDifficulty: string;
  selectedTags: string[];
  showOnlyFavorites: boolean;
  showOnlyPlanned: boolean;
  caloriesRange: [string, string];
  fatRange: [string, string];
  proteinRange: [string, string];
  carbRange: [string, string];
}

interface RecipeSearchAndFiltersProps {
  filters: RecipeFilters;
  onFiltersChange: (filters: Partial<RecipeFilters>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  isPremium: boolean;
}

const predefinedCuisines = [
  "Mediterranean", "Middle Eastern", "Latin American", "Asian", "African",
  "European", "North American", "Fusion", "Other"
];

const predefinedTags = [
  "Vegan", "Vegetarian", "Gluten-Free", "Low-Carb",
  "High-Protein", "Keto", "Paleo", "Dairy-Free"
];

export default function RecipeSearchAndFilters({ 
  filters, 
  onFiltersChange, 
  showFilters, 
  onToggleFilters,
  isPremium 
}: RecipeSearchAndFiltersProps) {
  const navigate = useNavigate();

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag) 
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ selectedTags: newTags });
  };

  const isAnyFilterActive = useMemo(() => (
    filters.selectedCuisine !== "all" ||
    filters.selectedPrepTime !== "all" ||
    filters.selectedCookTime !== "all" ||
    filters.selectedDifficulty !== "all" ||
    filters.selectedTags.length > 0 ||
    filters.caloriesRange[0] !== "" || filters.caloriesRange[1] !== "" ||
    filters.fatRange[0] !== "" || filters.fatRange[1] !== "" ||
    filters.proteinRange[0] !== "" || filters.proteinRange[1] !== "" ||
    filters.carbRange[0] !== "" || filters.carbRange[1] !== ""
  ), [filters]);

  const resetFilters = () => {
    onFiltersChange({
      selectedCuisine: "all",
      selectedPrepTime: "all",
      selectedCookTime: "all",
      selectedDifficulty: "all",
      selectedTags: [],
      caloriesRange: ["", ""],
      fatRange: ["", ""],
      proteinRange: ["", ""],
      carbRange: ["", ""],
      showOnlyFavorites: false,
      showOnlyPlanned: false,
    });
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search recipes, ingredients..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="pl-10 border-emerald-200 focus:border-emerald-500 pr-10"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => onFiltersChange({ searchQuery: "" })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-emerald-100 bg-emerald-50/50">
          <CardContent className="p-6">
            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 w-full">
                <div className="grid grid-rows-2 gap-6 h-full">
                  <div className="flex flex-col h-full justify-center">
                    <div className="flex gap-6 w-full">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine</label>
                        <Select value={filters.selectedCuisine} onValueChange={(value) => onFiltersChange({ selectedCuisine: value })}>
                          <SelectTrigger className="border-emerald-200 focus:border-emerald-500 w-full">
                            <SelectValue placeholder="Any cuisine" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {predefinedCuisines.map(cuisine => (
                              <SelectItem key={cuisine} value={cuisine}>
                                {cuisine}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                        <Select value={filters.selectedDifficulty} onValueChange={(value) => onFiltersChange({ selectedDifficulty: value })}>
                          <SelectTrigger className="border-emerald-200 focus:border-emerald-500 w-full">
                            <SelectValue placeholder="Any level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any level</SelectItem>
                            <SelectItem value="easy">Easy/Beginner</SelectItem>
                            <SelectItem value="medium">Medium/Intermediate</SelectItem>
                            <SelectItem value="hard">Hard/Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col h-full justify-center">
                    <div className="flex gap-6 w-full">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prep Time</label>
                        <Select value={filters.selectedPrepTime} onValueChange={(value) => onFiltersChange({ selectedPrepTime: value })}>
                          <SelectTrigger className="border-emerald-200 focus:border-emerald-500 w-full">
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any time</SelectItem>
                            <SelectItem value="quick">Under 15 min</SelectItem>
                            <SelectItem value="medium">15-30 min</SelectItem>
                            <SelectItem value="long">30+ min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cook Time</label>
                        <Select value={filters.selectedCookTime} onValueChange={(value) => onFiltersChange({ selectedCookTime: value })}>
                          <SelectTrigger className="border-emerald-200 focus:border-emerald-500 w-full">
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any time</SelectItem>
                            <SelectItem value="quick">Under 15 min</SelectItem>
                            <SelectItem value="medium">15-30 min</SelectItem>
                            <SelectItem value="long">30+ min</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-rows-2 gap-6 h-full">
                  <div className="flex flex-col h-full justify-center items-start">
                    <div className="flex flex-col gap-2 w-full items-start">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                      <div className="flex gap-2 w-full justify-start">
                        <Button
                          variant={filters.showOnlyFavorites ? 'default' : 'outline'}
                          className={filters.showOnlyFavorites ? 'bg-red-100 text-red-600 border-red-300' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => onFiltersChange({ showOnlyFavorites: !filters.showOnlyFavorites })}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Favorites
                        </Button>
                        <Button
                          variant={filters.showOnlyPlanned ? 'default' : 'outline'}
                          className={filters.showOnlyPlanned ? 'bg-blue-100 text-blue-600 border-blue-300' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'}
                          onClick={() => onFiltersChange({ showOnlyPlanned: !filters.showOnlyPlanned })}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Planned
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col h-full justify-center items-start">
                    <label className="block text-sm font-medium text-gray-700 mb-2 w-full">Tags</label>
                    <div className="flex flex-wrap gap-2 w-full justify-start">
                      {predefinedTags.map(tag => (
                        <Badge
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`cursor-pointer transition-colors duration-200 ${
                            filters.selectedTags.includes(tag) 
                              ? "bg-emerald-600 text-white" 
                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          }`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {(isAnyFilterActive || filters.showOnlyFavorites || filters.showOnlyPlanned) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-0 right-0 border-gray-300 text-gray-600 hover:bg-gray-100"
                    onClick={resetFilters}
                    title="Reset all filters"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
            
            {/* Nutrition Filters - Premium Only */}
            {isPremium ? (
              <div className="w-full border border-emerald-100 rounded-xl p-4 mt-6 bg-white/0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg p-4 bg-emerald-50 flex flex-col items-center border-2 border-emerald-200">
                    <label className="block text-base font-semibold text-emerald-700 mb-1">Calories</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={5000} 
                        value={filters.caloriesRange[0]} 
                        onChange={e => onFiltersChange({ caloriesRange: [e.target.value, filters.caloriesRange[1]] })} 
                        className="w-20 text-emerald-700 border-emerald-200" 
                      />
                      <span className="text-emerald-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={5000} 
                        value={filters.caloriesRange[1]} 
                        onChange={e => onFiltersChange({ caloriesRange: [filters.caloriesRange[0], e.target.value] })} 
                        className="w-20 text-emerald-700 border-emerald-200" 
                      />
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 flex flex-col items-center border-2 border-violet-200">
                    <label className="block text-base font-semibold text-violet-700 mb-1">Protein (g)</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={200} 
                        value={filters.proteinRange[0]} 
                        onChange={e => onFiltersChange({ proteinRange: [e.target.value, filters.proteinRange[1]] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                      />
                      <span className="text-violet-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={200} 
                        value={filters.proteinRange[1]} 
                        onChange={e => onFiltersChange({ proteinRange: [filters.proteinRange[0], e.target.value] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                      />
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-orange-50 flex flex-col items-center border-2 border-orange-200">
                    <label className="block text-base font-semibold text-orange-700 mb-1">Carbohydrates (g)</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={300} 
                        value={filters.carbRange[0]} 
                        onChange={e => onFiltersChange({ carbRange: [e.target.value, filters.carbRange[1]] })} 
                        className="w-20 text-orange-700 border-orange-200" 
                      />
                      <span className="text-orange-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={300} 
                        value={filters.carbRange[1]} 
                        onChange={e => onFiltersChange({ carbRange: [filters.carbRange[0], e.target.value] })} 
                        className="w-20 text-orange-700 border-orange-200" 
                      />
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 flex flex-col items-center border-2 border-violet-200">
                    <label className="block text-base font-semibold text-violet-700 mb-1">Fats (g)</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        value={filters.fatRange[0]} 
                        onChange={e => onFiltersChange({ fatRange: [e.target.value, filters.fatRange[1]] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                      />
                      <span className="text-violet-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        value={filters.fatRange[1]} 
                        onChange={e => onFiltersChange({ fatRange: [filters.fatRange[0], e.target.value] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full border border-amber-200 rounded-xl p-6 mt-6 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-amber-600" />
                      <h3 className="text-lg font-semibold text-amber-800">Advanced Nutrition Filters</h3>
                    </div>
                    <p className="text-amber-700 mb-4">
                      Filter recipes by calories, protein, carbs, and fats with Premium
                    </p>
                    <Button 
                      onClick={() => navigate('/premium')}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 