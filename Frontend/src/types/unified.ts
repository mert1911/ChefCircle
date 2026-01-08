// Unified Types for Community Features
// This file resolves conflicts between different IRecipe interfaces and other type issues

import { IRecipe as BaseRecipe } from './recipe';
import { IPost } from './post';
import { IComment } from './community-interfaces';

// Author interface for when author is populated
export interface IAuthor {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// Unified Recipe interface that works with both filtering and community components
export interface ICommunityRecipe extends Omit<BaseRecipe, 'author'> {
  id: string; // Computed field for compatibility with filtering hooks
  author?: string | IAuthor; // Can be either string ID or populated object
}

// Unified Chef interface (replaces both IChef and RawChef)
export interface IChef {
  _id: string;
  name: string;
  avatar: string;
  followers: number;
  recipes: number;
  isFollowing: boolean;
}

// User profile interface for consistency
export interface IUserProfile {
  _id: string;
  username: string;
  avatar?: string;
  isDeleted?: boolean;
}

// Trending tags interface
export interface ITrendingTag {
  tag: string;
  count: number;
  weeklyCount?: number;
}

// Helper function to get author ID from either string or object
export const getAuthorId = (author: string | IAuthor | undefined): string | undefined => {
  if (!author) return undefined;
  if (typeof author === 'string') return author;
  return author._id;
};

// Helper function to transform base recipes to community recipes
export const transformToCommunityRecipe = (recipe: BaseRecipe): ICommunityRecipe => ({
  ...recipe,
  id: recipe._id
});

// Helper function to transform array of recipes
export const transformToCommunityRecipes = (recipes: BaseRecipe[]): ICommunityRecipe[] =>
  recipes.map(transformToCommunityRecipe);

// Re-export commonly used types for convenience
export type { IPost, IComment };
export type { IRecipe as BaseRecipe } from './recipe'; 