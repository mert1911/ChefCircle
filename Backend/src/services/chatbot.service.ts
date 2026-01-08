import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../config';
import { searchRecipesByQuery, formatRecipeSearchResults } from './recipe-search.service';
import { PromptBuilder, UserData } from './prompt.builder';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface ChatbotRequest {
  message: string;
  conversationHistory: ChatMessage[];
  excludeRecipeIds: string[];
  userData?: UserData;
}

export interface ChatbotResponse {
  success: boolean;
  response: string;
  intent: string;
  recipes?: any[];
  hasRecipes?: boolean;
  suggestedRecipeIds?: string[];
  isFollowUp?: boolean;
  timestamp: string;
}

export class ChatbotService {
  private openai: OpenAI;
  private readonly MAX_ITERATIONS = 5;

  private readonly availableTools: ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'search_recipes',
        description: 'Search for recipes based on query. Returns recipe summaries. Use this to find options for the user. You can call this multiple times with different queries if needed.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search keywords (ingredients, dish name, cuisine)' },
            ingredients: { type: 'array', items: { type: 'string' } },
            exclude_recipe_ids: { type: 'array', items: { type: 'string' } }
          },
          required: ['query']
        }
      }
    }
  ];

  constructor() {
    this.openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  async processMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
    console.log(`Processing message: "${request.message}"`);
    
    // 1. Initialize State
    let messages: ChatCompletionMessageParam[] = this.buildInitialMessages(request);
    let collectedRecipes: any[] = [];
    let iterations = 0;
    let finalResponse = '';

    try {
      // 2. The Agent Loop (ReAct Pattern)
      while (iterations < this.MAX_ITERATIONS) {
        iterations++;
        console.log(`🔄 Agent Loop Iteration ${iterations}`);

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: messages,
          tools: this.availableTools,
          tool_choice: 'auto',
          temperature: 0.7,
        });

        const choice = completion.choices[0];
        const responseMessage = choice.message;

        // Add assistant's thought/action to history
        messages.push(responseMessage);

        // Check if the model wants to call a tool
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          console.log(`🤖 Agent Action (Step ${iterations}):`, responseMessage.tool_calls[0].function.name);

          // Execute all requested tools in parallel
          for (const toolCall of responseMessage.tool_calls) {
            const result = await this.executeTool(toolCall, request, collectedRecipes);
            
            // Feed tool output back to LLM
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: result.llmOutput
            });
          }
        } else {
          // No tools called -> Final Answer reached
          console.log('🤖 Agent Final Answer Reached');
          finalResponse = responseMessage.content || "I couldn't generate a response.";
          break;
        }
      }

      if (iterations >= this.MAX_ITERATIONS && !finalResponse) {
        finalResponse = "I'm thinking too hard! Could you try asking more simply?";
      }

      return {
        success: true,
        response: finalResponse,
        intent: collectedRecipes.length > 0 ? 'search_recipes' : 'general_chat',
        recipes: collectedRecipes,
        hasRecipes: collectedRecipes.length > 0,
        suggestedRecipeIds: collectedRecipes.map(r => r.id),
        isFollowUp: request.excludeRecipeIds.length > 0,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('Agent Loop Error:', error);
      return this.createRetryErrorResponse('I encountered an issue while processing your request.');
    }
  }

  private async executeTool(
    toolCall: any, 
    request: ChatbotRequest, 
    collectedRecipes: any[]
  ): Promise<{ llmOutput: string }> {
    
    const fnName = toolCall.function.name;
    let args: any = {};
    try {
      args = JSON.parse(toolCall.function.arguments || '{}');
    } catch (e) {
      console.error("Failed to parse tool arguments", e);
      return { llmOutput: JSON.stringify({ error: 'Invalid arguments' }) };
    }

    if (fnName === 'search_recipes') {
      console.log(`🔍 Executing search: ${args.query}`);
      
      const excludeIds = [...(args.exclude_recipe_ids || []), ...request.excludeRecipeIds];
      
      try {
        const searchResults = await searchRecipesByQuery(
          args.query,
          3,
          0.3,
          excludeIds
        );

        // Process results
        const formatted = formatRecipeSearchResults(searchResults, request.userData);
        
        // Add full recipe objects to state for Frontend
        formatted.recipes.forEach(r => {
          if (!collectedRecipes.some(existing => existing.id === r.id)) {
            collectedRecipes.push(r);
          }
        });

        // Create a simplified summary for the LLM token efficiency
        const llmSummary = formatted.recipes.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          ingredients: r.ingredients.slice(0, 5) // Show top 5 ingredients
        }));

        return { 
          llmOutput: JSON.stringify({ 
            status: 'success', 
            count: llmSummary.length, 
            recipes: llmSummary 
          }) 
        };
      } catch (err) {
        console.error("Search failed", err);
        return { llmOutput: JSON.stringify({ error: 'Search failed' }) };
      }
    }

    return { llmOutput: JSON.stringify({ error: 'Unknown function' }) };
  }

  private buildInitialMessages(request: ChatbotRequest): ChatCompletionMessageParam[] {
    let systemPrompt = PromptBuilder.createSystemPrompt(request.userData, request.excludeRecipeIds);
    
    // Append Agentic instructions to the existing system prompt
    systemPrompt += `

AGENTIC BEHAVIOR INSTRUCTIONS:
You are now acting as an autonomous agent. 
1. THINK: Plan your steps.
2. ACT: Use 'search_recipes' to find data. You can search multiple times.
3. OBSERVE: Analyze results.
4. ANSWER: Provide a final helpful response.
`;

    // Map existing history to OpenAI format
    const history: ChatCompletionMessageParam[] = request.conversationHistory.map(msg => {
      // Filter out 'tool' roles from old history if they exist but don't match the structure, 
      // or just pass them through if they are valid.
      // For safety, we'll cast to any or map specific fields.
      const mapped: any = {
        role: msg.role,
        content: msg.content
      };
      if (msg.tool_call_id) mapped.tool_call_id = msg.tool_call_id;
      if (msg.tool_calls) mapped.tool_calls = msg.tool_calls;
      return mapped;
    });

    return [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: request.message }
    ];
  }

  private createRetryErrorResponse(message: string): ChatbotResponse {
    return {
      success: false,
      response: `${message}\n\n💡 **Tip**: You can simply send your message again, or try rephrasing your question.`,
      intent: 'error',
      timestamp: new Date().toISOString()
    };
  }
}
