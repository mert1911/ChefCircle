// src/pages/Community.tsx
import React from "react"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from '@/hooks/useFavorites';
import PostCard from "@/components/PostCard";

// Import new components
import CreatePostDialog from "@/components/CreatePostDialog";
import SocialSidebar from "@/components/SocialSidebar";

// Import new custom hooks
import { useCommunityData } from "@/hooks/useCommunityData";
import { useComments } from "@/hooks/useComments";
import { usePostInteractions } from "@/hooks/usePostInteractions";
import { useCommunityDialogs } from "@/hooks/useCommunityDialogs";

// Import types
import { IComment } from "@/types/unified";

const Community: React.FC = () => {
  const { user } = useAuth();
  const { favorites, toggleFavorite } = useFavorites();
  const currentUserId = user?.id;
  
  // Use custom hooks
  const {
    posts,
    topChefs,
    trendingTags,
    tagSortBy,
    recipes,
    following,
    loading,
    error,
    setTopChefs,
    setTagSortBy,
    setRecipes,
    setFollowing,
    updatePosts,
    removePost,
    isUserActive,
    activePosts,
    fetchPosts
  } = useCommunityData();

  const {
    commentBoxOpen,
    commentTexts,
    toggleCommentBox,
    handleCommentChange,
    handleAddComment,
    handleDeleteComment,
    filterActiveComments
  } = useComments();

  const {
    deleteDialogOpen,
    postToDelete,
    handleLike,
    handleDeletePost,
    confirmDeletePost,
    cancelDeletePost,
    handleShare,
    setDeleteDialogOpen
  } = usePostInteractions();

  const {
    dialogOpen,
    openCreatePostDialog,
    closeCreatePostDialog
  } = useCommunityDialogs();

  // Wrapper function for toggleFavorite to match PostCard interface
  const handleToggleFavoriteWrapper = async (recipeId: string) => {
    await toggleFavorite(recipeId);
  };

  // Enhanced comment handlers that update posts state
  const enhancedHandleAddComment = async (postId: string, content: string) => {
    try {
      const newComment = await handleAddComment(postId, content);
      
      // Update the posts with the new comment immediately
      if (newComment) {
        updatePosts(prev => prev.map(p => 
          p._id === postId 
            ? { ...p, comments: Array.isArray(newComment) ? newComment : [...(p.comments || []), newComment] }
            : p
        ));
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const enhancedHandleDeleteComment = async (postId: string, commentId: string) => {
    await handleDeleteComment(postId, commentId, () => {
      // Update the posts by removing the deleted comment
      updatePosts(prev => prev.map(p => 
        p._id === postId 
          ? { ...p, comments: (p.comments || []).filter(c => c._id !== commentId) }
          : p
      ));
    });
  };

  // Enhanced post interaction handlers
  const enhancedHandleLike = (postId: string) => {
    handleLike(postId, updatePosts);
  };

  const enhancedConfirmDeletePost = () => {
    confirmDeletePost(removePost);
  };

  // Create a properly typed filterActiveComments function
  const enhancedFilterActiveComments = (comments: IComment[]) => {
    return filterActiveComments(comments, isUserActive);
  };

  const handlePostCreated = () => {
    fetchPosts(); // Refresh the feed
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading community...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Community</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
          <p className="text-gray-600">You need to be logged in to access the community.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
          <p className="text-gray-600 mb-4">Share your culinary creations and get inspired by fellow chefs</p>
          
          {/* Create Post Button */}
          <Button
            size="lg"
            className="bg-emerald-600 text-white"
            onClick={openCreatePostDialog}
          >
            <Plus className="mr-2" /> Create Post
          </Button>
        </div>

        {/* Main grid: feed (3 cols) + sidebar (1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Posts Feed (3/4) */}
          {/* ------------------ */}
          <div className="lg:col-span-3 space-y-6">
            {activePosts?.map(post => (
              <PostCard
                key={post._id}
                post={post}
                currentUserId={currentUserId}
                favorites={favorites}
                commentBoxOpen={commentBoxOpen}
                commentTexts={commentTexts}
                onToggleCommentBox={toggleCommentBox}
                onCommentChange={handleCommentChange}
                onAddComment={enhancedHandleAddComment}
                onDeleteComment={enhancedHandleDeleteComment}
                onToggleFavorite={handleToggleFavoriteWrapper}
                onLike={(postId: string) => handleLike(postId, updatePosts)}
                onDeletePost={handleDeletePost}
                isUserActive={isUserActive}
                filterActiveComments={(comments: IComment[]) => filterActiveComments(comments, isUserActive)}
              />
            ))}
          </div>

          {/* Sidebar (1/4) */}
          <SocialSidebar
            topChefs={topChefs}
            setTopChefs={setTopChefs}
            trendingTags={trendingTags}
            tagSortBy={tagSortBy}
            onTagSortChange={setTagSortBy}
            posts={posts}
            recipes={recipes}
            following={following}
            setFollowing={setFollowing}
          />
        </div>
      </main>

      {/* Create Post Dialog */}
      <CreatePostDialog
        isOpen={dialogOpen}
        onClose={closeCreatePostDialog}
        onPostCreated={handlePostCreated}
        recipes={recipes}
        setRecipes={setRecipes}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={cancelDeletePost}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={enhancedConfirmDeletePost}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Community;
