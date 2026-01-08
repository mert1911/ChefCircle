import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Crown, Search } from "lucide-react";
import { searchUsers } from "@/lib/api";
import { SearchResult } from "./types";
import { getUserInitials } from "./constants";

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchBar = ({ isOpen, onClose }: SearchBarProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleSearchResultClick = (userId: string) => {
    navigate(`/users/${userId}`);
    onClose();
    setSearchQuery("");
    setSearchResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border-b border-emerald-100 shadow-sm sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative">
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="flex-1 border-emerald-200 focus:border-emerald-500"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-600 hover:text-emerald-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Results */}
          {(searchResults.length > 0 || isSearching) && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  Searching...
                </div>
              ) : (
                <div>
                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      onClick={() => handleSearchResultClick(result._id)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={result.profileImage || ''} 
                            alt={result.firstName || result.username} 
                          />
                          <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm font-medium">
                            {getUserInitials(result.firstName, result.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {result.firstName} {result.lastName}
                            </span>
                            {result.subscriptionType !== 'free' && result.subscriptionStatus === 'active' && (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">@{result.username}</p>
                          {result.bio && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {result.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 