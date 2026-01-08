// models/post.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

//
// 1) The JSON‐DTO types your frontend uses.
//    — these use only strings & nested objects, no Mongoose Document magic
//

export interface IComment {
  _id: string;         // your frontend will receive hex string IDs
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;   // ISO string
}

export interface IPost {
  _id: string;
  content: string;
  image?: string;
  author: {
    _id: string;
    username: string;
    avatar?: string;
  };
  recipe?: {
    _id: string;
    name: string;
    image?: string;
    prepTimeMin?: number;
    cookTimeMin?: number;
    servings?: number;
    difficulty?: string;
  };
  tags?: string[];
  likes: number;
  isLiked: boolean;     // if you’re returning this field
  shares: number;
  comments: IComment[];
  createdAt: string;
  updatedAt: string;
}

//
// 2) The internal Mongoose document types.
//    — these extend Document and use ObjectId & Date
//

export interface ICommentDoc extends Document<Types.ObjectId> {
  author: Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IPostDoc extends Document<Types.ObjectId> {
  content: string;
  image?: string;
  author: Types.ObjectId;
  recipe?: Types.ObjectId;
  tags?: string[];
  likedBy: Types.ObjectId[];
  likes: number;
  shares: number;
  comments: Types.DocumentArray<ICommentDoc>;
  createdAt: Date;
  updatedAt: Date;
}

//
// 3) Define the Mongoose schemas & model
//

const CommentSchema = new Schema<ICommentDoc>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: true }   // keep an _id on each sub‐document
);

const PostSchema = new Schema<IPostDoc>(
  {
    content:  { type: String, required: true },
    image:    { type: String },
    author:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipe:   { type: Schema.Types.ObjectId, ref: 'Recipe' },
    tags:     [{ type: String }],
    likedBy:  [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likes:    { type: Number, default: 0 },
    shares:   { type: Number, default: 0 },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

export const Post = mongoose.model<IPostDoc>('Post', PostSchema);
