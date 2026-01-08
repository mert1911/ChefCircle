import { useState, useCallback } from 'react';
import { useAPIWithAuth } from './useAPIWithAuth';
import { useToast } from './use-toast';
import { IComment } from '@/types/unified';

export const useComments = () => {
  const api = useAPIWithAuth();
  const { toast } = useToast();
  
  // Comment-related state
  const [commentBoxOpen, setCommentBoxOpen] = useState<Record<string, boolean>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  // Comment box management
  const toggleCommentBox = useCallback((postId: string) => {
    setCommentBoxOpen(prev => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  const handleCommentChange = useCallback((postId: string, text: string) => {
    setCommentTexts(prev => ({ ...prev, [postId]: text }));
  }, []);

  // Add comment
  const handleAddComment = useCallback(async (
    postId: string, 
    content: string,
    onSuccess?: (newComment: IComment) => void
  ) => {
    if (!content.trim()) return;
    
    try {
      const { data: newComments } = await api.post<IComment[]>(`/api/posts/${postId}/comments`, {
        content: content.trim(),
      });
      
      // Clear comment text and close box
      setCommentTexts(prev => ({ ...prev, [postId]: "" }));
      setCommentBoxOpen(prev => ({ ...prev, [postId]: false }));
      
      toast({
        title: "Comment added successfully",
        variant: "default",
        duration: 3000
      });
      
      return newComments;
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      toast({
        title: "Failed to add comment",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
        duration: 4000
      });
      throw err;
    }
  }, [api, toast]);

  // Delete comment
  const handleDeleteComment = useCallback(async (
    postId: string, 
    commentId: string,
    onSuccess?: () => void
  ) => {
    try {
      await api.delete(`/api/posts/${postId}/comments/${commentId}`);
      
      // Call success callback if provided
      onSuccess?.();
      
      toast({
        title: "Comment deleted successfully",
        variant: "default",
        duration: 3000
      });
    } catch (err: any) {
      console.error("Failed to delete comment:", err);
      toast({
        title: "Failed to delete comment",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
        duration: 4000
      });
      throw err;
    }
  }, [api, toast]);

  // Filter active comments helper
  const filterActiveComments = useCallback((
    comments: IComment[], 
    isUserActive: (author: { isDeleted?: boolean } | undefined | null) => boolean
  ) => {
    return comments.filter(comment => isUserActive(comment.author));
  }, []);

  // Clear comment state for a specific post
  const clearCommentState = useCallback((postId: string) => {
    setCommentTexts(prev => {
      const newState = { ...prev };
      delete newState[postId];
      return newState;
    });
    setCommentBoxOpen(prev => {
      const newState = { ...prev };
      delete newState[postId];
      return newState;
    });
  }, []);

  // Clear all comment state
  const clearAllCommentState = useCallback(() => {
    setCommentTexts({});
    setCommentBoxOpen({});
  }, []);

  return {
    // State
    commentBoxOpen,
    commentTexts,
    
    // Functions
    toggleCommentBox,
    handleCommentChange,
    handleAddComment,
    handleDeleteComment,
    filterActiveComments,
    clearCommentState,
    clearAllCommentState,
  };
}; 