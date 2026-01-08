import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Clock, ChefHat, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { IPost } from "@/types/post";
import { IComment } from '@/types/community-interfaces';
import { navigateToProfile } from '@/utils/browseUtils';

interface PostCardProps {
  post: IPost;
  currentUserId?: string;
  favorites: string[];
  commentBoxOpen: Record<string, boolean>;
  commentTexts: Record<string, string>;
  onToggleCommentBox: (postId: string) => void;
  onCommentChange: (postId: string, text: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onToggleFavorite: (recipeId: string) => void;
  onLike: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  isUserActive: (author: { isDeleted?: boolean } | undefined | null) => boolean;
  filterActiveComments: (comments: IComment[]) => IComment[];
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  favorites,
  commentBoxOpen,
  commentTexts,
  onToggleCommentBox,
  onCommentChange,
  onAddComment,
  onDeleteComment,
  onToggleFavorite,
  onLike,
  onDeletePost,
  isUserActive,
  filterActiveComments,
}) => {
  const navigate = useNavigate();

  return (
    <Card className="border-emerald-100 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar || undefined} />
              <AvatarFallback className="bg-emerald-100 text-emerald-600">
                {post.author?.username
                  ? post.author.username
                    .split(" ")
                    .map(n => n[0])
                    .join("")
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3
                  className="font-semibold text-gray-900 cursor-pointer hover:underline"
                  onClick={() => {
                    if (isUserActive(post.author) && post.author?._id) {
                      navigateToProfile(navigate, post.author._id, currentUserId);
                    }
                  }}
                >
                  {post.author?.username || "Unknown User"}
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>@{post.author?.username || "unknown"}</span>
                <span>•</span>
                <span>{new Date(post.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delete button for post owner */}
          {post.author?._id === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
              onClick={() => onDeletePost(post._id)}
              title="Delete post"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-gray-700 leading-relaxed">{post.content}</p>

        {post.image && (
          <div className="relative">
            <img
              src={post.image.startsWith('uploads/') 
                ? `http://localhost:8080/${post.image}` 
                : `http://localhost:8080/uploads/${post.image}`}
              alt="Post image"
              className="w-full h-64 object-cover rounded-lg bg-emerald-100"
            />
            {post.recipe?.name && (
              <div className="absolute bottom-3 left-3">
                <Badge className="bg-black/70 text-white hover:bg-black/70">
                  {post.recipe.name}
                </Badge>
              </div>
            )}
          </div>
        )}

        {post.recipe && (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="pt-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">{post.recipe.name}</h3>
                <div className="flex items-center space-x-4">
                  <ChefHat className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-semibold text-emerald-800">Recipe Details</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                {post.recipe.prepTimeMin != null && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>Prep: {post.recipe.prepTimeMin} min</span>
                  </div>
                )}
                {post.recipe.cookTimeMin != null && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    <span>Cook: {post.recipe.cookTimeMin} min</span>
                  </div>
                )}
                {post.recipe.servings != null && <div>Serves: {post.recipe.servings}</div>}
                {post.recipe.difficulty && (
                  <Badge variant="secondary" className="capitalize">
                    {post.recipe.difficulty}
                  </Badge>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {post.recipe.ingredients?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-emerald-800 mb-2">Ingredients:</h5>
                    <ul className="text-sm space-y-1">
                      {post.recipe.ingredients.slice(0, 3).map((ing, i) => (
                        <li key={i} className="flex items-start">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {`${ing.ingredient.name}: ${ing.amount} ${ing.unit}`}
                        </li>
                      ))}
                      {post.recipe.ingredients.length > 3 && (
                        <li className="text-emerald-600 font-medium">
                          +{post.recipe.ingredients.length - 3} more ingredients
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {post.recipe.instructions?.length > 0 && (
                  <div>
                    <h5 className="font-medium text-emerald-800 mb-2">Instructions:</h5>
                    <ol className="text-sm space-y-1">
                      {post.recipe.instructions.slice(0, 2).map((ins, i) => (
                        <li key={i} className="flex items-start">
                          <span className="bg-emerald-200 text-emerald-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                            {i + 1}
                          </span>
                          {ins}
                        </li>
                      ))}
                      {post.recipe.instructions.length > 2 && (
                        <li className="text-emerald-600 font-medium ml-7">
                          +{post.recipe.instructions.length - 2} more steps
                        </li>
                      )}
                    </ol>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          {post.recipe?.tags?.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            >
              #{tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-emerald-100">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post._id)}
              className={`flex items-center space-x-2 ${
                post.isLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-red-500"
              }`}
            >
              <Heart className={`h-5 w-5 ${post.isLiked ? "fill-current" : ""}`} />
              <span>{post.likes || 0}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleCommentBox(post._id)}
              className="flex items-center space-x-2 text-gray-500 hover:text-emerald-600"
            >
              <MessageCircle className="h-5 w-5" />
              <span>{filterActiveComments(post.comments || []).length}</span>
            </Button>
          </div>
          {post.recipe && (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate(`/recipes/${post.recipe!._id}`)}
            >
              View Full Recipe
            </Button>
          )}
        </div>

        {/* Add Comment Box */}
        {commentBoxOpen[post._id] && (
          <div className="flex items-center space-x-2 mt-2">
            <Input
              className="flex-1"
              placeholder="Add a comment…"
              value={commentTexts[post._id] || ''}
              onChange={e => onCommentChange(post._id, e.target.value)}
            />
            <Button
              size="sm"
              className="bg-emerald-600 text-white"
              onClick={() => onAddComment(post._id, commentTexts[post._id] || '')}
            >
              Post
            </Button>
          </div>
        )}

        {/* Existing Comments */}
        <div className="space-y-3 border-t border-emerald-100 pt-4">
          {filterActiveComments(post.comments || []).map(c => {
            const author =
              typeof c.author === 'object'
                ? c.author
                : { username: 'Unknown', _id: '', avatar: undefined };

            return (
              <div key={c._id} className="flex items-start space-x-3">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarImage src={author.avatar || undefined} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-600 text-xs">
                    {author.username
                      ? author.username
                          .split(" ")
                          .map(n => n[0])
                          .join("")
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span
                        className="font-medium text-sm cursor-pointer hover:underline"
                        onClick={() => {
                          if (isUserActive(author) && author._id) {
                            navigateToProfile(navigate, author._id, currentUserId);
                          }
                        }}
                      >
                        {author.username}
                      </span>
                      <span className="text-gray-700 text-sm ml-2">{c.content}</span>
                    </div>
                    {author._id === currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2 flex-shrink-0"
                        onClick={() => onDeleteComment(post._id, c._id)}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard; 