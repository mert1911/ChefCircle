import { Request, Response } from "express";
import User from "../models/User";
import { Recipe } from "../models/recipe";

export const getTopChefs = async (req: Request, res: Response) => {
  try {
    // 1) Who am I?
    const meId = req.user!.id;

    // 2) Find everyone, sort by number of followers (i.e. array length), keep top 4
    const users = await User.find()
      .select("username profileImage followers")    // grab the raw followers array
      .lean()
      .sort({ "followers": -1 })                    // Mongoose will sort by array length
      .limit(4);

    // 3) Build your payload
    const topChefs = await Promise.all(
      users.map(async (u) => {
        const recipeCount = await Recipe.countDocuments({ author: u._id });
        const followerCount = Array.isArray(u.followers) ? u.followers.length : 0;
        const isFollowing   = Array.isArray(u.followers)
          ? u.followers.some(f => f.toString() === meId)
          : false;

        return {
          _id:         u._id,
          name:        u.username,
          avatar:      u.profileImage,
          followers:   followerCount,
          recipes:     recipeCount,
          isFollowing,                            // now honest true|false
        };
      })
    );

    return res.json(topChefs);
  } catch (err) {
    console.error("getTopChefs error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};