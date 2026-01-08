import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { useAPIWithAuth } from "@/hooks/useAPIWithAuth";
import { ICommunityRecipe, IChef, ITrendingTag, IPost, getAuthorId } from "@/types/unified";
import { navigateToProfile } from '@/utils/browseUtils';

interface SocialSidebarProps {
  topChefs: IChef[];
  setTopChefs: React.Dispatch<React.SetStateAction<IChef[]>>;
  trendingTags: ITrendingTag[];
  tagSortBy: 'total' | 'weekly';
  onTagSortChange: (value: 'total' | 'weekly') => void;
  posts: IPost[];
  recipes: ICommunityRecipe[];
  following: string[];
  setFollowing: React.Dispatch<React.SetStateAction<string[]>>;
}

const SocialSidebar: React.FC<SocialSidebarProps> = ({
  topChefs,
  setTopChefs,
  trendingTags,
  tagSortBy,
  onTagSortChange,
  posts,
  recipes,
  following,
  setFollowing
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const api = useAPIWithAuth();
  const currentUserId = user?.id;

  // Helper function to check if user is active - for chefs, assume they're always active unless specified
  const isUserActive = (chef: IChef | { isDeleted?: boolean } | undefined | null): boolean => {
    if (!chef) return false;
    
    // If it's a chef object (doesn't have isDeleted), assume active
    if ('recipes' in chef) return true;
    
    // If it has isDeleted property, check it
    return !chef.isDeleted;
  };

  // Follow/unfollow functionality
  const toggleFollow = async (chefId: string) => {
    const chef = topChefs.find(c => c._id === chefId);
    
    // Don't allow following/unfollowing deactivated users
    if (!chef || !isUserActive(chef)) {
      return;
    }
    
    const wasFollowing = chef.isFollowing;

    // Optimistic UI update
    setTopChefs(prev =>
      prev.map(c =>
        c._id !== chefId
          ? c
          : {
              ...c,
              isFollowing: !wasFollowing,
              followers: c.followers + (wasFollowing ? -1 : +1),
            }
      )
    );

    try {
      // API calls for follow/unfollow
      if (wasFollowing) {
        await api.delete(`/api/auth/users/${chefId}/follow`);
      } else {
        await api.post(`/api/auth/users/${chefId}/follow`);
      }
      
      // Reload following list to ensure it's up to date
      console.log('🔄 Reloading following list after follow/unfollow');
      try {
        const { data } = await api.get<string[]>(`/api/auth/users/${currentUserId}/following`);
        console.log('✅ Updated following list:', data);
        setFollowing(data);
      } catch (followingErr) {
        console.error('❌ Failed to reload following list:', followingErr);
      }
      
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
      // Rollback on failure
      setTopChefs(prev =>
        prev.map(c =>
          c._id !== chefId
            ? c
            : {
                ...c,
                isFollowing: wasFollowing,
                followers: c.followers + (wasFollowing ? +1 : -1),
              }
        )
      );
    }
  };

  // Calculate weekly post count for each tag
  const calculateWeeklyCount = (tagName: string): number => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return posts.filter(post => {
      // Check if post is from this week
      const postDate = new Date(post.createdAt);
      const isThisWeek = postDate >= oneWeekAgo;
      
      // Check if post has recipe with this tag
      const hasTag = post.recipe?.tags?.some(tag => 
        tag.toLowerCase() === tagName.toLowerCase()
      );
      
      return isThisWeek && hasTag;
    }).length;
  };

  // Sort trending tags based on selected criteria
  const getSortedTrendingTags = () => {
    const tagsWithWeeklyCount = trendingTags.map(tag => ({
      ...tag,
      weeklyCount: calculateWeeklyCount(tag.tag)
    }));

    if (tagSortBy === 'weekly') {
      return tagsWithWeeklyCount.sort((a, b) => b.weeklyCount - a.weeklyCount);
    } else {
      return tagsWithWeeklyCount.sort((a, b) => b.count - a.count);
    }
  };

  return (
    <aside className="lg:col-span-1 space-y-6">
      {/* Top Chefs */}
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <span>Top Chefs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(() => {
              // Filter out deactivated chefs
              const activeTopChefs = topChefs.filter(chef => isUserActive(chef));
              
              // Find logged-in user in activeTopChefs
              const userChef = activeTopChefs.find(c => c._id === currentUserId);
              
              // If user is not in top chefs from backend, add them with their actual recipe count
              const allChefs = userChef
                ? activeTopChefs
                : [
                    ...activeTopChefs,
                    {
                      _id: currentUserId || "",
                      name: user?.username || "You",
                      avatar: user?.profileImage || "",
                      followers: 0,
                      recipes: recipes.filter(recipe => getAuthorId(recipe.author) === currentUserId).length,
                      isFollowing: false,
                    },
                  ];
              
              // Sort by recipes descending, then take top 5
              return [...allChefs]
                .sort((a, b) => b.recipes - a.recipes)
                .slice(0, 5)
                .map((chef) => (
                  <div
                    key={chef._id}
                    className="block hover:bg-emerald-50 rounded transition cursor-pointer"
                    onClick={() => {
                      if (isUserActive(chef) && chef._id) {
                        navigateToProfile(navigate, chef._id, user?.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between p-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          {chef.avatar ? (
                            <AvatarImage src={chef.avatar} alt={chef.name} />
                          ) : (
                            <AvatarFallback className="bg-emerald-100 text-emerald-600">
                              {chef.name
                                .split(' ')
                                .map((w) => w[0].toUpperCase())
                                .join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {chef._id === currentUserId ? `${chef.name} (You)` : chef.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {chef.recipes} recipes
                          </p>
                        </div>
                      </div>
                      {/* Follow Button - only show for other users */}
                      {chef._id !== currentUserId && (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFollow(chef._id);
                          }}
                          variant={chef.isFollowing ? 'outline' : 'default'}
                          size="sm"
                          className={
                            chef.isFollowing
                              ? 'border-emerald-600 text-emerald-600 hover:bg-emerald-50'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }
                        >
                          {chef.isFollowing ? 'Following' : 'Follow'}
                        </Button>
                      )}
                    </div>
                  </div>
                ));
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Trending Tags */}
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Trending</span>
            </div>
            <Select value={tagSortBy} onValueChange={onTagSortChange}>
              <SelectTrigger className="w-20 h-7 text-xs border-emerald-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getSortedTrendingTags().slice(0, 10).map((tag, i) => (
              <Link
                key={tag.tag}
                to={`/community/tag/${encodeURIComponent(tag.tag)}`}
                className="flex items-center justify-between cursor-pointer hover:bg-emerald-50 p-2 rounded-lg transition-colors"
              >
                <span className="font-medium text-emerald-600">#{tag.tag}</span>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{tag.count} posts</div>
                  <div className="text-xs text-emerald-600">{tag.weeklyCount} this week</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
};

export default SocialSidebar; 