// src/types/post.ts
import { IComment } from './community-interfaces';


export interface IPost {
  _id: string;
  content: string;
  image?: string;
  tags?: string[];

  author: {
    _id: string;
    username: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;
    isDeleted?: boolean;
  };

  createdAt: string;
  updatedAt: string;

  likes: number;
  isLiked: boolean;
  comments: IComment[];
  shares?: number;

  // This will now be a real recipe document
  recipe?: {
    _id: string;
    name: string;
    image?: string;
    prepTimeMin?: number;
    cookTimeMin?: number;
    servings?: number;
    difficulty?: string;
    ingredients?: Array<{
      ingredient: { name: string };
      amount?: number;
      unit?: string;
    }>;
    instructions?: string[];
    tags?:string[];
  };
}
