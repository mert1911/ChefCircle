import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { ChatMessage, Recipe } from '@/types/chatbot';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useAPIWithAuth } from '@/hooks/useAPIWithAuth';

interface ChatbotResponse {
  response: string;
  recipes?: Recipe[];
  hasRecipes?: boolean;
  suggestedRecipeIds?: string[];
  isFollowUp?: boolean;
}

interface UseChatbotProps {
  onMessagesChange?: (messages: ChatMessage[]) => void;
  onSuggestedRecipeIdsChange?: (ids: string[]) => void;
}

interface UseChatbotReturn {
  messages: ChatMessage[];
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  error: string | null;
  allSuggestedRecipeIds: string[];
  setAllSuggestedRecipeIds: Dispatch<SetStateAction<string[]>>;
  handleSendMessage: (message: string, allSuggestedRecipeIds: string[]) => Promise<void>;
  resetConversation: () => void;
  getInitialMessage: () => ChatMessage;
}

export const useChatbot = ({ onMessagesChange, onSuggestedRecipeIdsChange }: UseChatbotProps = {}): UseChatbotReturn => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useAPIWithAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allSuggestedRecipeIds, setAllSuggestedRecipeIds] = useState<string[]>([]);

  // Create personalized initial message
  const getInitialMessage = useCallback((): ChatMessage => {
    const userName = user?.firstName ? ` ${user.firstName}` : '';
    return {
      id: 1,
      type: "bot",
      content: `Hi${userName}! I'm your AI Chef Assistant. I can help you with cooking questions, recipe suggestions, ingredient substitutions, and meal planning advice. What would you like to know? 🍽️`,
      timestamp: "Just now"
    };
  }, [user?.firstName]);

  const [messages, setMessages] = useState<ChatMessage[]>([getInitialMessage()]);

  // Detect if the user is asking for follow-up recipes
  const isFollowUpRecipeRequest = useCallback((userMessage: string): boolean => {
    const followUpKeywords = [
      'other recipes', 'more recipes', 'different recipes', 'alternatives', 
      'more options', 'other options', 'what else', 'anything else',
      'more ideas', 'other ideas', 'different suggestions', 'more suggestions'
    ];
    
    const lowercaseMessage = userMessage.toLowerCase();
    return followUpKeywords.some(keyword => lowercaseMessage.includes(keyword));
  }, []);

  // Smart conversation history management to avoid token limits while preserving context
  const prepareConversationHistory = useCallback((messages: ChatMessage[]) => {
    // Filter out the initial welcome message 
    const relevantMessages = messages.filter(msg => 
      msg.type !== 'bot' || !msg.content.includes("I'm your AI Chef Assistant")
    );

    // Convert to OpenAI format, including recipe context for bot messages
    const conversationHistory = relevantMessages.map(msg => {
      let content = msg.content;
      
      // Include recipe information in conversation context
      if (msg.type === 'bot' && msg.hasRecipes && msg.recipes && msg.recipes.length > 0) {
        const recipeDetails = msg.recipes.map((recipe, index) => 
          `${index + 1}. "${recipe.title}" (ID: ${recipe.id}) - ${recipe.description || 'No description'} (${recipe.cuisine || 'Unknown cuisine'}, ${recipe.difficulty || 'Unknown difficulty'}, ${recipe.calories} cal)`
        ).join('\n');
        
        content = `${msg.content}\n\nRecipes I suggested:\n${recipeDetails}`;
      }
      
      return {
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: content
      };
    });

    // For very long conversations (>30 messages), keep recent messages and summarize older context
    if (conversationHistory.length > 30) {
      // Keep the last 20 messages for immediate context
      const recentMessages = conversationHistory.slice(-20);
      
      // Summarize older messages (messages 0 to -21)
      const olderMessages = conversationHistory.slice(0, -20);
      if (olderMessages.length > 0) {
        const contextSummary = {
          role: 'assistant' as const,
          content: `[Previous conversation context: We discussed ${olderMessages.length} topics including recipes, cooking techniques, and food-related questions. Continuing our conversation...]`
        };
        return [contextSummary, ...recentMessages];
      }
      return recentMessages;
    }

    // For shorter conversations, send entire history
    return conversationHistory;
  }, []);

  const handleSendMessage = useCallback(async (message: string, currentSuggestedRecipeIds: string[]) => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      type: "user",
      content: message,
      timestamp: "Just now"
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    onMessagesChange?.(newMessages);
    
    // Detect if this is a follow-up recipe request
    const isFollowUp = isFollowUpRecipeRequest(message);
    
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error("Please log in to use the AI chatbot");
      }

      // Prepare conversation history with smart context management
      const conversationHistory = prepareConversationHistory(newMessages);

      // Prepare request body with exclude_recipe_ids for follow-up requests
      const requestBody: any = {
        message: userMessage.content,
        conversationHistory: conversationHistory
      };

      // For follow-up requests, include previously suggested recipe IDs to exclude
      if (isFollowUp && currentSuggestedRecipeIds.length > 0) {
        console.log(`🔄 Follow-up request detected. Excluding ${currentSuggestedRecipeIds.length} previously suggested recipes:`, currentSuggestedRecipeIds);
        requestBody.excludeRecipeIds = currentSuggestedRecipeIds;
      }

      const { data } = await api.post<ChatbotResponse>('/api/chatbot/chat', requestBody);

      const aiResponse: ChatMessage = {
        id: messages.length + 2,
        type: "bot",
        content: data.response,
        timestamp: "Just now",
        recipes: data.recipes || [],
        hasRecipes: data.hasRecipes || false,
        suggestedRecipeIds: data.suggestedRecipeIds || [],
        isFollowUp: data.isFollowUp || false
      };

      const updatedMessages = [...newMessages, aiResponse];
      setMessages(updatedMessages);
      onMessagesChange?.(updatedMessages);

      // Update the accumulated suggested recipe IDs
      if (data.suggestedRecipeIds && data.suggestedRecipeIds.length > 0) {
        setAllSuggestedRecipeIds(prev => {
          const newIds = data.suggestedRecipeIds.filter((id: string) => !prev.includes(id));
          const updated = [...prev, ...newIds];
          console.log(`📝 Updated suggested recipe IDs. Total: ${updated.length}`, updated);
          onSuggestedRecipeIdsChange?.(updated);
          return updated;
        });
      }

    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Something went wrong. Please try again.';
      setError(errorMsg);
      
      const errorMessage: ChatMessage = {
        id: messages.length + 2,
        type: "bot",
        content: `Sorry, I encountered an error: ${errorMsg}. Please try again.`,
        timestamp: "Just now"
      };
      
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      onMessagesChange?.(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, user, api, isFollowUpRecipeRequest, prepareConversationHistory, onMessagesChange, onSuggestedRecipeIdsChange]);

  // Reset conversation and suggested recipe IDs
  const resetConversation = useCallback(() => {
    const initialMessage = getInitialMessage();
    setMessages([initialMessage]);
    setAllSuggestedRecipeIds([]);
    setError(null);
    onMessagesChange?.([initialMessage]);
    onSuggestedRecipeIdsChange?.([]);
    
    toast({
      title: "Conversation Reset",
      description: "Your conversation has been cleared",
      variant: "default"
    });
  }, [getInitialMessage, onMessagesChange, onSuggestedRecipeIdsChange, toast]);

  return {
    messages,
    setMessages,
    isLoading,
    error,
    allSuggestedRecipeIds,
    setAllSuggestedRecipeIds,
    handleSendMessage,
    resetConversation,
    getInitialMessage
  };
}; 