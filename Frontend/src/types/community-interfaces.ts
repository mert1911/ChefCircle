
// src/types/tag.ts
export interface ITag {
  /** The tag text (e.g. "HealthyEating") */
  tag: string;
  /** How many posts use this tag */
  posts: number;
}
export interface IComment {
  _id: string;
  author: { _id: string; username: string; avatar?: string; isDeleted?: boolean };
  content: string;
  createdAt: string;
}