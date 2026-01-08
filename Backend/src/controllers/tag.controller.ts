// src/controllers/tag.controller.ts
import { Request, Response } from 'express';
import { Post } from '../models/post'; // adjust path to your Post model

// your hard-coded default tags
const DEFAULT_TAGS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Low-Carb',
  'High-Protein',
  'Keto',
  'Paleo',
  'Dairy-Free',
];


export const getTrendingTags = async (_req: Request, res: Response) => {
  try {
    // unwind all post.recipe.tags, group & count
    const agg = await Post.aggregate([
      {
        $lookup: {
          from: 'recipes',
          localField: 'recipe',
          foreignField: '_id',
          as: 'recipe'
        }
      },
      { $unwind: '$recipe' },
      { $unwind: '$recipe.tags' },
      { $group: { _id: '$recipe.tags', count: { $sum: 1 } } },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
    // build a map of counts
    const countMap = new Map<string, number>();
    agg.forEach(({ tag, count }: any) => countMap.set(tag, count));

    // now ensure every default tag appears
    const fullList = DEFAULT_TAGS.map(tag => ({
      tag,
      count: countMap.get(tag) || 0
    }));

    // if you want to include any non-default tags too, append them:
    const others = agg
      .filter(({ tag }: any) => !DEFAULT_TAGS.includes(tag))
      .map(({ tag, count }: any) => ({ tag, count }));

    return res.json([...fullList, ...others]);
  } catch (err: any) {
    console.error('Error fetching trending tags', err);
    return res.status(500).json({ message: 'Server error' });
  }
};