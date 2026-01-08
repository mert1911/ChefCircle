import React from "react";

interface UserStatsProps {
  recipeCount: number;
  followersCount: number;
  followingCount: number;
  onFollowersClick: () => void;
  onFollowingClick: () => void;
}

const UserStats = ({
  recipeCount,
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick
}: UserStatsProps) => {
  return (
    <div className="flex gap-6 mb-4">
      <div className="text-center">
        <p className="text-xl font-bold text-gray-900">{recipeCount}</p>
        <p className="text-sm text-gray-600">Recipes</p>
      </div>
      {/* Followers - clickable */}
      <div 
        className="text-center cursor-pointer hover:bg-emerald-50 rounded px-2 py-1 transition"
        onClick={onFollowersClick}
      >
        <p className="text-xl font-bold text-gray-900">{followersCount}</p>
        <p className="text-sm text-gray-600">Followers</p>
      </div>
      {/* Following - clickable */}
      <div 
        className="text-center cursor-pointer hover:bg-emerald-50 rounded px-2 py-1 transition"
        onClick={onFollowingClick}
      >
        <p className="text-xl font-bold text-gray-900">{followingCount}</p>
        <p className="text-sm text-gray-600">Following</p>
      </div>
    </div>
  );
};

export default UserStats; 