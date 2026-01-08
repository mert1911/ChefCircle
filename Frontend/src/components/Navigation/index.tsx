import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChefHat, Search, Settings, LogOut, Crown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NAV_ITEMS, getUserInitials } from "./constants";
import { SearchBar } from "./SearchBar";
import { UserSubscriptionStatus } from "./types";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const userSubscription: UserSubscriptionStatus = {
    isPremium: user?.subscriptionType !== 'free' && user?.subscriptionStatus === 'active',
    hasAnySubscription: user?.subscriptionType !== 'free' && 
      ['active', 'past_due'].includes(user?.subscriptionStatus || '')
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div>
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
              {NAV_ITEMS.map((item) => (
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
                  {item.path === "/ai-chatbot" && !userSubscription.isPremium && (
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
              {!userSubscription.hasAnySubscription && (
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
                    {getUserInitials(user?.firstName, user?.username)}
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

      {/* Search Bar Component */}
      <SearchBar 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </div>
  );
};

export default Navigation; 