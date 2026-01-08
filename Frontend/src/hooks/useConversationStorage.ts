import { useEffect, useCallback } from 'react';
import { ChatMessage } from '@/types/chatbot';
import { 
  saveConversationData, 
  loadConversationData, 
  clearConversationData,
  hasConversationData 
} from '@/lib/conversation-storage';

interface UseConversationStorageProps {
  userId: string | null;
  messages: ChatMessage[];
  allSuggestedRecipeIds: string[];
  onMessagesLoaded?: (messages: ChatMessage[]) => void;
  onSuggestedRecipeIdsLoaded?: (ids: string[]) => void;
  getInitialMessage: () => ChatMessage;
}

interface UseConversationStorageReturn {
  conversationLoaded: boolean;
  saveConversation: () => void;
  clearConversation: () => void;
  hasExistingConversation: boolean;
}

export const useConversationStorage = ({
  userId,
  messages,
  allSuggestedRecipeIds,
  onMessagesLoaded,
  onSuggestedRecipeIdsLoaded,
  getInitialMessage
}: UseConversationStorageProps): UseConversationStorageReturn => {
  
  const conversationLoaded = Boolean(userId);
  const hasExistingConversation = userId ? hasConversationData(userId) : false;

  // Load conversation data when user is available
  useEffect(() => {
    if (userId && onMessagesLoaded && onSuggestedRecipeIdsLoaded) {
      console.log(`👤 Loading conversation for user: ${userId}`);
      
      if (hasConversationData(userId)) {
        const { messages: savedMessages, suggestedRecipeIds: savedRecipeIds } = loadConversationData(userId);
        
        if (savedMessages.length > 0) {
          onMessagesLoaded(savedMessages);
          onSuggestedRecipeIdsLoaded(savedRecipeIds);
        }
      } else {
        // No saved conversation, start with initial message
        onMessagesLoaded([getInitialMessage()]);
        onSuggestedRecipeIdsLoaded([]);
      }
    }
  }, [userId, onMessagesLoaded, onSuggestedRecipeIdsLoaded, getInitialMessage]);

  // Save conversation data whenever messages or suggested recipe IDs change
  useEffect(() => {
    if (userId && conversationLoaded && messages.length > 1) {
      // Only save if we have more than just the initial message
      saveConversationData(userId, messages, allSuggestedRecipeIds);
    }
  }, [messages, allSuggestedRecipeIds, userId, conversationLoaded]);

  const saveConversation = useCallback(() => {
    if (userId) {
      saveConversationData(userId, messages, allSuggestedRecipeIds);
      console.log(`💾 Manually saved conversation for user: ${userId}`);
    }
  }, [userId, messages, allSuggestedRecipeIds]);

  const clearConversation = useCallback(() => {
    if (userId) {
      clearConversationData(userId);
      console.log(`🗑️ Manually cleared conversation for user: ${userId}`);
    }
  }, [userId]);

  return {
    conversationLoaded,
    saveConversation,
    clearConversation,
    hasExistingConversation
  };
}; 