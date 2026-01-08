import { useState, useCallback } from 'react';
import { useAPIWithAuth } from './useAPIWithAuth';
import { useToast } from './use-toast';
import { IPost } from '@/types/unified';

export const usePostInteractions = () => {
  const api = useAPIWithAuth();
  const { toast } = useToast();
  
  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  // Handle like with optimistic updates
  const handleLike = useCallback(async (
    postId: string,
    updatePosts: (updater: (posts: IPost[]) => IPost[]) => void
  ) => {
    // Optimistically update local state
    updatePosts(prev =>
      prev.map(p =>
        p._id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? (p.likes || 1) - 1 : (p.likes || 0) + 1,
            }
          : p
      )
    );

    // Send request to server
    try {
      await api.post(`/api/posts/${postId}/like`);
    } catch (err) {
      console.error("Error syncing like:", err);
      // Rollback on failure
      updatePosts(prev =>
        prev.map(p =>
          p._id === postId
            ? {
                ...p,
                isLiked: !p.isLiked,
                likes: p.isLiked ? (p.likes || 1) - 1 : (p.likes || 0) + 1,
              }
            : p
        )
      );
      
      toast({
        title: "Failed to update like",
        description: "Please try again",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [api, toast]);

  // Handle delete post - opens dialog
  const handleDeletePost = useCallback((postId: string) => {
    setPostToDelete(postId);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm delete post - actual deletion
  const confirmDeletePost = useCallback(async (
    removePost: (postId: string) => void
  ) => {
    if (!postToDelete) return;
    
    try {
      await api.delete(`/api/posts/${postToDelete}`);
      removePost(postToDelete);
      toast({
        title: "Post deleted successfully",
        variant: "default",
        duration: 3000
      });
    } catch (err: any) {
      console.error("Failed to delete post:", err);
      toast({
        title: "Failed to delete post",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    }
  }, [api, toast, postToDelete]);

  // Cancel delete dialog
  const cancelDeletePost = useCallback(() => {
    setDeleteDialogOpen(false);
    setPostToDelete(null);
  }, []);

  // Note: Bookmark functionality for posts doesn't exist in the current implementation
  // Bookmarking is only available for recipes attached to posts via the favorites system

  // Share post
  const handleShare = useCallback(async (post: IPost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Recipe by ${post.author?.username || 'Unknown'}`,
          text: post.content,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard",
          variant: "default",
          duration: 3000
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
      toast({
        title: "Failed to share",
        description: "Please try again",
        variant: "destructive",
        duration: 3000
      });
    }
  }, [toast]);

  return {
    // Dialog state
    deleteDialogOpen,
    postToDelete,
    
    // Functions
    handleLike,
    handleDeletePost,
    confirmDeletePost,
    cancelDeletePost,
    handleShare,
    
    // Dialog controls
    setDeleteDialogOpen,
  };
}; 