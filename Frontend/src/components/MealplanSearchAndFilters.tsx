import React, { useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Search, Filter, Crown } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface MealplanFilters {
  searchQuery: string;
  selectedDifficulty: string;
  selectedTags: string[];
  showOnlyFavorites: boolean;
  dailyCaloriesRange: [string, string];
  dailyProteinRange: [string, string];
  dailyCarbRange: [string, string];
  dailyFatRange: [string, string];
}

interface MealplanSearchAndFiltersProps {
  filters: MealplanFilters;
  onFiltersChange: (filters: Partial<MealplanFilters>) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  isPremium: boolean;
}

// Use the same tags as recipes - split into two rows
const mealplanTagsRow1 = [
  "Vegan", "Vegetarian", "Gluten-Free", "Low-Carb", "High-Protein"
];
const mealplanTagsRow2 = [
  "Keto", "Paleo", "Dairy-Free"
];

export default function MealplanSearchAndFilters({ 
  filters, 
  onFiltersChange, 
  showFilters, 
  onToggleFilters,
  isPremium 
}: MealplanSearchAndFiltersProps) {
  const navigate = useNavigate();

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag) 
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];
    onFiltersChange({ selectedTags: newTags });
  };

  const isAnyFilterActive = useMemo(() => (
    filters.selectedDifficulty !== "all" ||
    filters.selectedTags.length > 0 ||
    filters.dailyCaloriesRange[0] !== "" || filters.dailyCaloriesRange[1] !== "" ||
    filters.dailyProteinRange[0] !== "" || filters.dailyProteinRange[1] !== "" ||
    filters.dailyCarbRange[0] !== "" || filters.dailyCarbRange[1] !== "" ||
    filters.dailyFatRange[0] !== "" || filters.dailyFatRange[1] !== ""
  ), [filters]);

  const resetFilters = () => {
    onFiltersChange({
      selectedDifficulty: "all",
      selectedTags: [],
      showOnlyFavorites: false,
      dailyCaloriesRange: ["", ""],
      dailyProteinRange: ["", ""],
      dailyCarbRange: ["", ""],
      dailyFatRange: ["", ""],
    });
  };

  return (
    <div className="mb-8 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Search meal plans..."
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
                <div className="flex gap-6 w-full items-end">
                  {/* Difficulty Filter */}
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

                  {/* Quick Filter */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                    <div className="flex gap-2">
                      <Button
                        variant={filters.showOnlyFavorites ? 'default' : 'outline'}
                        className={filters.showOnlyFavorites ? 'bg-red-100 text-red-600 border-red-300' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'}
                        onClick={() => onFiltersChange({ showOnlyFavorites: !filters.showOnlyFavorites })}
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Favorites
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags Section */}
                <div className="flex flex-col justify-start">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {mealplanTagsRow1.map(tag => (
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
                    <div className="flex flex-wrap gap-2">
                      {mealplanTagsRow2.map(tag => (
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

                {(isAnyFilterActive || filters.showOnlyFavorites) && (
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
            
            {/* Daily Nutrition Filters - Premium Only */}
            {isPremium ? (
              <div className="w-full border border-emerald-100 rounded-xl p-4 mt-6 bg-white/0">
                <h3 className="text-lg font-semibold text-emerald-700 mb-4 text-center">Daily Nutrition Targets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg p-4 bg-emerald-50 flex flex-col items-center border-2 border-emerald-200">
                    <label className="block text-base font-semibold text-emerald-700 mb-1">Calories/day</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={5000} 
                        value={filters.dailyCaloriesRange[0]} 
                        onChange={e => onFiltersChange({ dailyCaloriesRange: [e.target.value, filters.dailyCaloriesRange[1]] })} 
                        className="w-20 text-emerald-700 border-emerald-200" 
                        placeholder="Min"
                      />
                      <span className="text-emerald-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={5000} 
                        value={filters.dailyCaloriesRange[1]} 
                        onChange={e => onFiltersChange({ dailyCaloriesRange: [filters.dailyCaloriesRange[0], e.target.value] })} 
                        className="w-20 text-emerald-700 border-emerald-200" 
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 flex flex-col items-center border-2 border-violet-200">
                    <label className="block text-base font-semibold text-violet-700 mb-1">Protein/day (g)</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={300} 
                        value={filters.dailyProteinRange[0]} 
                        onChange={e => onFiltersChange({ dailyProteinRange: [e.target.value, filters.dailyProteinRange[1]] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                        placeholder="Min"
                      />
                      <span className="text-violet-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={300} 
                        value={filters.dailyProteinRange[1]} 
                        onChange={e => onFiltersChange({ dailyProteinRange: [filters.dailyProteinRange[0], e.target.value] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-orange-50 flex flex-col items-center border-2 border-orange-200">
                    <label className="block text-base font-semibold text-orange-700 mb-1">Carbs/day (g)</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={500} 
                        value={filters.dailyCarbRange[0]} 
                        onChange={e => onFiltersChange({ dailyCarbRange: [e.target.value, filters.dailyCarbRange[1]] })} 
                        className="w-20 text-orange-700 border-orange-200" 
                        placeholder="Min"
                      />
                      <span className="text-orange-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={500} 
                        value={filters.dailyCarbRange[1]} 
                        onChange={e => onFiltersChange({ dailyCarbRange: [filters.dailyCarbRange[0], e.target.value] })} 
                        className="w-20 text-orange-700 border-orange-200" 
                        placeholder="Max"
                      />
                    </div>
                  </div>
                  <div className="rounded-lg p-4 bg-violet-50 flex flex-col items-center border-2 border-violet-200">
                    <label className="block text-base font-semibold text-violet-700 mb-1">Fats/day (g)</label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        type="number" 
                        min={0} 
                        max={200} 
                        value={filters.dailyFatRange[0]} 
                        onChange={e => onFiltersChange({ dailyFatRange: [e.target.value, filters.dailyFatRange[1]] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                        placeholder="Min"
                      />
                      <span className="text-violet-700 font-bold">-</span>
                      <Input 
                        type="number" 
                        min={0} 
                        max={200} 
                        value={filters.dailyFatRange[1]} 
                        onChange={e => onFiltersChange({ dailyFatRange: [filters.dailyFatRange[0], e.target.value] })} 
                        className="w-20 text-violet-700 border-violet-200" 
                        placeholder="Max"
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
                      <Crown className="h-6 w-6 text-amber-500" />
                      <h3 className="text-lg font-semibold text-amber-700">Premium Daily Nutrition Filters</h3>
                    </div>
                    <p className="text-amber-600 mb-4">Set daily nutrition targets to find meal plans that match your health goals</p>
                    <Button 
                      onClick={() => navigate('/premium')}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    >
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