import { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import {Post} from '../models/post';

// Helper function to transform profileImage to avatar for API responses
const transformPostForAPI = (post: any) => {
  if (!post) return post;
  
  // Convert to plain object if it's a mongoose document
  const plainPost = post.toObject ? post.toObject() : post;
  
  // Transform author field
  if (plainPost.author && plainPost.author.profileImage) {
    plainPost.author.avatar = plainPost.author.profileImage;
  }
  
  // Transform comments authors
  if (plainPost.comments && Array.isArray(plainPost.comments)) {
    plainPost.comments = plainPost.comments.map((comment: any) => {
      if (comment.author && comment.author.profileImage) {
        comment.author.avatar = comment.author.profileImage;
      }
      return comment;
    });
  }
  
  return plainPost;
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const { content, recipe } = req.body;  // Remove 'author' from destructuring
    if (!content) return res.status(400).json({ message: "Content is required" });
    
    // Get author from authenticated user (like recipe controller does)
    const authorId = req.user?.id;
    if (!authorId) {
      return res.status(401).json({ message: 'User not authenticated.' });
    }

    // Build & save the new Post
    const newPost = new Post({
      content,
      author: authorId,  // Use authenticated user's ID
      recipe: recipe || undefined,
      image: req.file?.filename,
    });
    const saved = await newPost.save();

    // Fetch it back with .populate() via a query
    const populated = await Post.findById(saved._id)
      .populate("author", "username profileImage")
      .populate({
        path: "recipe",
        select: "name image prepTimeMin cookTimeMin servings difficulty ingredients instructions tags",
        populate: {
          path: "ingredients.ingredient",
          select: "name"
        }
      })
      .exec();

    return res.status(201).json(transformPostForAPI(populated));
  } catch (err) {
    console.error("createPost error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// Get all posts (with author & recipe populated)
export const getAllPosts = async (_req: Request, res: Response) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "username profileImage")
      .populate('comments.author', 'username profileImage')
      .populate({
      path: "recipe",
      select: "name image prepTimeMin cookTimeMin servings difficulty ingredients instructions tags",
      populate: {
        path: "ingredients.ingredient",
        select: "name"
      }
    })
      .exec();

    return res.json(posts.map(transformPostForAPI));
  } catch (err) {
    console.error("getAllPosts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// Get a single post by id
export const getPostById = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profileImage')
      .populate('recipe', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(transformPostForAPI(post));
  } catch (err: any) {
    console.error('getPostById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a post
export const deletePost = async (req: Request, res: Response) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted' });
  } catch (err: any) {
    console.error('deletePost error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
export const likePost = async (req: Request, res: Response) => {
  try {
    const postId = req.params.id;
    const userId = req.user!.id;               // <-- this is a string
    const userObjId = new Types.ObjectId(userId);  // <-- convert it

    const post = await Post.findById(postId);
    if (!post) return res.status(404).send({ message: 'Post not found.' });

    // toggle
    const idx = post.likedBy.findIndex(id => id.equals(userObjId));
    if (idx >= 0) {
      // already liked → unlike
      post.likedBy.splice(idx, 1);
    } else {
      // not yet liked → like
      post.likedBy.push(userObjId);
    }
    post.likes = post.likedBy.length;

    await post.save();
    return res.json({ likes: post.likes });
  } catch (err) {
    console.error(err);
    return res.status(500).end();
  }
};

// POST /api/posts/:postId/comments
export const addComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;  // from your auth middleware
    const { content } = req.body;
    const postId = req.params.postId;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Comment content is required.' });
    }

    // 1) Find the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // 2) Push a new comment sub-document
    post.comments.push({
      author: new mongoose.Types.ObjectId(userId),
      content: content.trim(),
      // `createdAt` will be set automatically by your schema default
    });

    // 3) Save
    await post.save();

    // 4) Re-populate the newly added comments' authors
    await post.populate('comments.author', 'username profileImage');

    // 5) Return the transformed comments (with avatar field)
    const transformedComments = post.comments.map((comment: any) => {
      const plainComment = comment.toObject ? comment.toObject() : comment;
      if (plainComment.author && plainComment.author.profileImage) {
        plainComment.author.avatar = plainComment.author.profileImage;
      }
      return plainComment;
    });

    return res.status(201).json(transformedComments);
  } catch (err: any) {
    console.error('addComment error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { postId, commentId } = req.params;

    // 1) Load the post
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // 2) Locate the comment sub-doc
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    // 3) Only the author may delete
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this comment.' });
    }

    // 4) Remove the comment via deleteOne()
    await comment.deleteOne();      // <-- replaces the old `comment.remove()`
    await post.save();              // persist the change

    // 5) Re-populate authors on remaining comments
    await post.populate('comments.author', 'username profileImage');

    // 6) Transform and send back the updated comments array
    const transformedComments = post.comments.map((comment: any) => {
      const plainComment = comment.toObject ? comment.toObject() : comment;
      if (plainComment.author && plainComment.author.profileImage) {
        plainComment.author.avatar = plainComment.author.profileImage;
      }
      return plainComment;
    });

    return res.json(transformedComments);
  } catch (err: any) {
    console.error('deleteComment error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};