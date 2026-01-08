import { useState, useCallback } from 'react';

export const useCommunityDialogs = () => {
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Open create post dialog
  const openCreatePostDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  // Close create post dialog
  const closeCreatePostDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // Toggle create post dialog
  const toggleCreatePostDialog = useCallback(() => {
    setDialogOpen(prev => !prev);
  }, []);

  return {
    // State
    dialogOpen,
    
    // Actions
    openCreatePostDialog,
    closeCreatePostDialog,
    toggleCreatePostDialog,
    
    // Direct setter for external control
    setDialogOpen,
  };
}; 