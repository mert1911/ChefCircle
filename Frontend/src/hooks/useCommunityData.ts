import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useAPIWithAuth } from './useAPIWithAuth';
import { 
  ICommunityRecipe, 
  IChef, 
  ITrendingTag, 
  IPost,
  transformToCommunityRecipes,
  BaseRecipe 
} from '@/types/unified';

export const useCommunityData = () => {
  const { user } = useAuth();
  const api = useAPIWithAuth();
  const currentUserId = user?.id;
  
  // State management
  const [posts, setPosts] = useState<IPost[]>([]);
  const [topChefs, setTopChefs] = useState<IChef[]>([]);
  const [trendingTags, setTrendingTags] = useState<ITrendingTag[]>([]);
  const [tagSortBy, setTagSortBy] = useState<'total' | 'weekly'>('total');
  const [recipes, setRecipes] = useState<ICommunityRecipe[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  
  // Loading states
  const fetchingPostsRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to filter out content from deactivated users
  const isUserActive = useCallback((author: { isDeleted?: boolean } | undefined | null) => {
    return author && !author.isDeleted;
  }, []);

  // Data fetching functions
  const fetchRecipes = useCallback(async () => {
    try {
      const res = await api.get<BaseRecipe[]>("/recipes");
      const communityRecipes = transformToCommunityRecipes(res.data);
      setRecipes(communityRecipes);
    } catch (e) {
      console.error("Failed to fetch recipes", e);
      setError("Failed to fetch recipes");
    }
  }, [api]);

  const fetchPosts = useCallback(async () => {
    if (fetchingPostsRef.current) {
      console.log('Already fetching posts, skipping...');
      return;
    }
    
    fetchingPostsRef.current = true;
    
    try {
      const { data: allPosts } = await api.get<IPost[]>('/api/posts');
      
      console.log('=== POST FILTERING DEBUG ===');
      console.log('Current user ID:', currentUserId);
      console.log('Following array:', following);
      console.log('Total posts from API:', allPosts.length);
      
      // Filter posts based on community rules:
      // 1. ALWAYS show user's own posts
      // 2. Show posts from followed users if user follows anyone
      const filtered = allPosts.filter(p => {
        // Always include user's own posts
        if (p.author?._id === currentUserId) {
          console.log('✅ Including own post:', p._id);
          return true;
        }
        
        // Include posts from followed users
        if (p.author?._id && following.includes(p.author._id)) {
          console.log('✅ Including followed user post:', p._id, 'from', p.author._id);
          return true;
        }
        
        // Exclude all other posts
        console.log('❌ Excluding post:', p._id, 'from', p.author?._id);
        return false;
      });
      
      console.log('Filtered posts count:', filtered.length);
      console.log('=== END DEBUG ===');
      
      if (Array.isArray(filtered)) {
        setPosts(filtered);
      }
    } catch (e) {
      console.error("Failed to fetch posts", e);
      setError("Failed to fetch posts");
    } finally {
      fetchingPostsRef.current = false;
    }
  }, [api, currentUserId, following]);

  const fetchTopChefs = useCallback(async () => {
    try {
      const { data: rawChefs } = await api.get<IChef[]>('/api/chefs/top');
      setTopChefs(rawChefs);
    } catch (err) {
      console.error('Failed to fetch top chefs:', err);
      setError("Failed to fetch top chefs");
    }
  }, [api]);

  const fetchTrendingTags = useCallback(async () => {
    try {
      const res = await api.get<ITrendingTag[]>('/api/tags/trending');
      setTrendingTags(res.data);
    } catch (err) {
      console.error('Failed to fetch trending tags', err);
      setError("Failed to fetch trending tags");
    }
  }, [api]);

  // Load following list
  const loadFollowing = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      console.log('🔄 Loading following list for user:', currentUserId);
      const { data } = await api.get<string[]>(`/api/auth/users/${currentUserId}/following`);
      console.log('✅ Following list loaded:', data);
      setFollowing(data);
      fetchingPostsRef.current = false; // Reset to allow posts fetch
    } catch (err: any) {
      console.error("❌ Failed to load following list:", err);
      setError("Failed to load following list");
    }
  }, [api, currentUserId]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchRecipes(),
        fetchTrendingTags(),
        fetchTopChefs(),
      ]);
      
      if (currentUserId) {
        await loadFollowing();
      }
    } catch (err) {
      console.error('Failed to refresh community data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchRecipes, fetchTrendingTags, fetchTopChefs, loadFollowing, currentUserId]);

  // Effects
  useEffect(() => {
    refreshAllData();
  }, [currentUserId]);
  
  // Fetch posts when following changes
  useEffect(() => {
    if (!currentUserId) return;
    console.log('🔄 Following array changed, fetching posts with:', following);
    fetchPosts();
  }, [following, fetchPosts, currentUserId]);

  // Update posts function for external use
  const updatePosts = useCallback((updater: (posts: IPost[]) => IPost[]) => {
    setPosts(updater);
  }, []);

  // Add new post to the feed
  const addPost = useCallback((newPost: IPost) => {
    setPosts(prev => [newPost, ...prev]);
  }, []);

  // Remove post from the feed
  const removePost = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  }, []);

  return {
    // Data
    posts,
    topChefs,
    trendingTags,
    tagSortBy,
    recipes,
    following,
    
    // Loading states
    loading,
    error,
    
    // Setters
    setTopChefs,
    setTagSortBy,
    setRecipes,
    setFollowing,
    
    // Functions
    refreshAllData,
    fetchPosts,
    updatePosts,
    addPost,
    removePost,
    isUserActive,
    
    // Derived data
    activePosts: posts.filter(post => isUserActive(post.author)),
  };
}; 