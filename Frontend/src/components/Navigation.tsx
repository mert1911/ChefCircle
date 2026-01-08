import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import { ChefHat, Search, Settings, LogOut, Crown, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { searchUsers } from "@/lib/api";

interface SearchResult {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  profileImage?: string;
  bio?: string;
  subscriptionType: string;
  subscriptionStatus: string;
}

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, getAccessToken } = useAuth();
  
  // Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Check if user has premium access
  const isPremium = user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active';
  
  // Check if user has any subscription (active or past_due)
  const hasSubscription = user?.subscriptionType !== 'free' && (user?.subscriptionStatus === 'active' || user?.subscriptionStatus === 'past_due');

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Search functionality
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

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query);
  };

  // Handle search result click
  const handleSearchResultClick = (userId: string) => {
    // DONE: Insert link functionality - In the future, this should ideally go to /profile/username
    navigate(`/users/${userId}`);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Handle click outside search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials for search results
  const getUserInitials = (firstName?: string, username?: string) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const usernameInitial = username ? username.charAt(0).toUpperCase() : '';
    return firstInitial || usernameInitial || "U";
  };

  // Get user initials for current user (matches profile page implementation)
  const getCurrentUserInitials = () => {
    if (!user) return "U";
    
    const firstInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const usernameInitial = user.username ? user.username.charAt(0).toUpperCase() : '';
    
    return firstInitial || usernameInitial || "U";
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/community", label: "Community" },
    { path: "/my-week", label: "Meal Planning" },
    { path: "/browse", label: "Browse" },
    { path: "/ai-chatbot", label: "AI Chef" },
  ];

  return (
    <div ref={searchRef}>
      <nav className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-emerald-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Chef Circle
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-emerald-600 border-b-2 border-emerald-600 pb-1"
                      : "text-gray-600 hover:text-emerald-600"
                  }`}
                >
                  {item.label}
                  {item.path === "/ai-chatbot" && !isPremium && (
                    <sup className="text-xs text-emerald-600 ml-1">Premium</sup>
                  )}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-emerald-600"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Premium Badge - Only show if user doesn't have any subscription */}
              {!hasSubscription && (
                <Link to="/premium">
                  <Button variant="outline" size="sm" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    <Crown className="h-4 w-4 mr-1" />
                    Premium
                  </Button>
                </Link>
              )}

              {/* Profile Link */}
              <Link to="/profile" className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.profileImage || ''} 
                    alt={user?.firstName || 'User'} 
                  />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-sm font-medium flex items-center justify-center">
                    {getCurrentUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Profile</span>
              </Link>

              {/* Settings Link */}
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-emerald-600">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>

              {/* Logout Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar - Appears below navigation when search is open */}
      {isSearchOpen && (
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
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
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
      )}
    </div>
  );
};

export default Navigation;
