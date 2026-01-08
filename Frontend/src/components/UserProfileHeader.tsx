import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, ChefHat } from "lucide-react";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImage?: string;
  subscriptionType: 'free' | 'premium';
}

interface UserProfileHeaderProps {
  user: User;
}

const UserProfileHeader = ({ user }: UserProfileHeaderProps) => {
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const firstInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const usernameInitial = user.username ? user.username.charAt(0).toUpperCase() : '';
    
    return firstInitial || usernameInitial || "U";
  };

  return (
    <Card className="border-emerald-100 mb-8">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Picture */}
          <div className="relative">
            <Avatar className="h-32 w-32 border-4 border-emerald-100">
              <AvatarImage src={user.profileImage || ''} alt={user.firstName || user.username || 'User'} />
              <AvatarFallback className="bg-emerald-100 text-emerald-600 text-2xl">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 rounded-full p-2">
              <ChefHat className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.username || 'User'}
                </h1>
                <p className="text-emerald-600 font-medium">@{user.username}</p>
                {user.subscriptionType !== 'free' && (
                  <Badge className="mt-1 bg-emerald-600 text-white">
                    <ChefHat className="h-3 w-3 mr-1" />
                    Premium Chef
                  </Badge>
                )}
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 mb-3">{user.bio}</p>
            )}
            
            {/* Join Date */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Joined recently
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileHeader; 