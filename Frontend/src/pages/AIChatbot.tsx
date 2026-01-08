
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Bot, 
  Send, 
  Crown, 
  ChefHat, 
  Clock,
  Users,
  AlertCircle,
  BookmarkPlus,
  Heart,
  Calendar
} from "lucide-react";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useChatbot } from "@/hooks/useChatbot";
import { useConversationStorage } from "@/hooks/useConversationStorage";
import { useRecipeActions } from "@/hooks/useRecipeActions";
import { useFavorites } from "@/hooks/useFavorites";
import { useAPIWithAuth } from "@/hooks/useAPIWithAuth";
import { toast } from "sonner";

const AIChatbot = () => {
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  
  // Use custom hooks for separated concerns
  const {
    messages,
    setMessages,
    isLoading,
    error,
    allSuggestedRecipeIds,
    setAllSuggestedRecipeIds,
    handleSendMessage,
    resetConversation: resetChatbotConversation,
    getInitialMessage
  } = useChatbot({
    onMessagesChange: (newMessages) => {
      // Additional side effects can be handled here if needed
    },
    onSuggestedRecipeIdsChange: (newIds) => {
      // Additional side effects can be handled here if needed
    }
  });

  const {
    conversationLoaded,
    clearConversation
  } = useConversationStorage({
    userId: user?.id || null,
    messages,
    allSuggestedRecipeIds,
    onMessagesLoaded: setMessages,
    onSuggestedRecipeIdsLoaded: setAllSuggestedRecipeIds,
    getInitialMessage
  });

  const { saveRecipe } = useRecipeActions();
  const { favorites, handleToggleFavorite, isFavorite } = useFavorites();
  const api = useAPIWithAuth();

  // State for mealplan management (similar to Browse page)
  const [userPlannedRecipes, setUserPlannedRecipes] = useState<string[]>([]);

  // Update initial message when user data becomes available
  useEffect(() => {
    if (user?.firstName && messages.length === 1 && messages[0].id === 1 && conversationLoaded) {
      // Only update if we have the default initial message and conversation is loaded
      setMessages([getInitialMessage()]);
    }
  }, [user?.firstName, conversationLoaded, getInitialMessage]);

  // Fetch user planned recipes
  useEffect(() => {
    const fetchUserPlannedRecipes = async () => {
      if (!user) return;
      try {
        const res = await api.get<{ plannedRecipes: Array<string | { _id: string }> }>('/user/planned-recipes');
        setUserPlannedRecipes((res.data.plannedRecipes || []).map((r: any) => 
          typeof r === 'string' ? r : r._id
        ));
      } catch (err) {
        console.error('Failed to fetch user planned recipes', err);
      }
    };
    fetchUserPlannedRecipes();
  }, [user, api]);

  // Handle mealplan toggle (same as Browse page)
  const handleToggleMealplan = async (e: React.MouseEvent, recipeId: string, isInPlanned: boolean) => {
    e.stopPropagation();
    if (!user) {
      toast.info('You must be logged in to add recipes to your mealplan.');
      return;
    }
    
    try {
      if (!isInPlanned) {
        await api.post('/user/planned-recipes', { recipeId });
        setUserPlannedRecipes(prev => [...prev, recipeId]);
        toast.success("Added to mealplan recipes!");
      } else {
        await api.delete(`/user/planned-recipes/${recipeId}`);
        setUserPlannedRecipes(prev => prev.filter(id => id !== recipeId));
        toast.info("Removed from mealplan recipes!");
      }
    } catch (err) {
      console.error('Failed to toggle mealplan', err);
      toast.error('Failed to update mealplan.');
    }
  };

  // Reset conversation function that combines both hooks
  const resetConversation = () => {
    resetChatbotConversation();
    clearConversation();
  };

  // Handle sending message
  const onSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    await handleSendMessage(message, allSuggestedRecipeIds);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              Premium AI Feature
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Bot className="h-8 w-8 text-emerald-600 mr-3" />
            AI Chef Assistant
          </h1>
          <p className="text-gray-600">Get personalized recipe suggestions based on your ingredients and macro targets</p>
        </div>

        {/* Chat Interface - Full Width */}
        <Card className="border-emerald-100 h-[600px] flex flex-col">
          
          {/* Messages */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {!conversationLoaded && user?.id ? (
              /* Loading conversation */
              <div className="flex justify-center items-center h-full">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                  <span className="text-sm">Loading conversation...</span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.type === 'user' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {/* Follow-up indicator for bot messages */}
                      {msg.type === 'bot' && msg.isFollowUp && (
                        <div className="mb-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md inline-block">
                          🔄 Alternative suggestions
                        </div>
                      )}
                      
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">{msg.timestamp}</span>
                      
                      {/* Recipe Cards */}
                      {msg.hasRecipes && msg.recipes && msg.recipes.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {msg.recipes.map((recipe, index) => (
                            <Card key={recipe.id} className="bg-white border-emerald-200">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg text-emerald-700 flex items-center">
                                    <ChefHat className="h-5 w-5 mr-2" />
                                    {recipe.title}
                                  </CardTitle>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => handleToggleFavorite(e, recipe.id, isFavorite(recipe.id))}
                                      className={`backdrop-blur-sm ${
                                        isFavorite(recipe.id)
                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                          : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                      }`}
                                    >
                                      <Heart className={`h-4 w-4 ${isFavorite(recipe.id) ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => handleToggleMealplan(e, recipe.id, userPlannedRecipes.includes(recipe.id))}
                                      className={`backdrop-blur-sm ${
                                        userPlannedRecipes.includes(recipe.id)
                                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                          : 'bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                                      }`}
                                      title={userPlannedRecipes.includes(recipe.id) ? 'Remove from Mealplan Recipes' : 'Add to Mealplan Recipes'}
                                    >
                                      <Calendar className={`h-4 w-4 ${userPlannedRecipes.includes(recipe.id) ? 'fill-current' : ''}`} />
                                    </Button>
                                  </div>
                                </div>
                                {recipe.description && (
                                  <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
                                )}
                              </CardHeader>
                              <CardContent className="pt-0">
                                {/* Recipe Stats */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Clock className="h-4 w-4 mr-1" />
                                    {recipe.prepTime}
                                    {recipe.cookTime && ` + ${recipe.cookTime}`}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600">
                                    <Users className="h-4 w-4 mr-1" />
                                    {recipe.servings} servings
                                  </div>
                                </div>
                                
                                {/* Additional info */}
                                {(recipe.difficulty || recipe.cuisine) && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {recipe.difficulty && (
                                      <Badge variant="outline" className="text-xs">
                                        {recipe.difficulty}
                                      </Badge>
                                    )}
                                    {recipe.cuisine && (
                                      <Badge variant="outline" className="text-xs">
                                        {recipe.cuisine}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                
                                {/* Macros */}
                                <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                                  <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="text-center">
                                      <div className="font-semibold text-emerald-700">{recipe.calories}</div>
                                      <div className="text-gray-600">kcal</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-blue-700">{recipe.protein}</div>
                                      <div className="text-gray-600">protein</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-orange-700">{recipe.carbs}</div>
                                      <div className="text-gray-600">carbs</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="font-semibold text-purple-700">{recipe.fat}</div>
                                      <div className="text-gray-600">fat</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Ingredients */}
                                <div className="mb-3">
                                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Ingredients:</h4>
                                  <ul className="text-xs text-gray-700 space-y-1">
                                    {recipe.ingredients.map((ingredient: string, index: number) => (
                                      <li key={index}>• {ingredient}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {/* Instructions */}
                                <div>
                                  <h4 className="font-semibold text-sm text-gray-900 mb-2">Instructions:</h4>
                                  <ol className="text-xs text-gray-700 space-y-1">
                                    {recipe.instructions.map((step: string, index: number) => (
                                      <li key={index}>{index + 1}. {step}</li>
                                    ))}
                                  </ol>
                                </div>
                                
                                {/* Author info */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <p className="text-xs text-gray-500">
                                    Created by {recipe.author}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-900">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Error display */}
                {error && (
                  <div className="flex justify-center">
                    <div className="max-w-[80%] p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center space-x-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">{error}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
          
          {/* Input Area */}
          <div className="border-t border-emerald-100 p-4">
            {/* Reset Button */}
            {(messages.length > 1 || allSuggestedRecipeIds.length > 0) && (
              <div className="mb-3 flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConversation}
                  className="text-gray-600 hover:text-gray-800"
                >
                  🔄 New Conversation
                </Button>

              </div>
            )}
            
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask me about recipes, ingredients, cooking tips, or say 'other recipes' for alternatives..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isLoading}
                className="flex-1 min-h-[40px] max-h-[100px] resize-none border-emerald-200 focus:border-emerald-500 disabled:opacity-50"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    onSendMessage();
                  }
                }}
              />
              <Button 
                onClick={onSendMessage}
                disabled={isLoading || !message.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default AIChatbot;
