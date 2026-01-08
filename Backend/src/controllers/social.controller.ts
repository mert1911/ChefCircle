import { Request, Response } from 'express';
import { User } from '../models';
import { Types } from 'mongoose';

export class SocialController {
  // Get user by ID (for public profiles)
  static async getUserById(req: Request, res: Response) {
    try {
      const user = await User.findById(req.params.id)
        .select('-password');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      // Send back exactly the shape your front-end expects:
      res.json({
        id:             user.id,
        username:       user.username,
        firstName:      user.firstName,
        lastName:       user.lastName,
        bio:            user.bio,
        profileImage:   user.profileImage,
        subscriptionType: user.subscriptionType,
        followers:      user.followers || [],
        following:      user.following || [],
        joinedAt:       user.createdAt,     // or however you track join date
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  }

  // Follow a user
  static async followUser(req: Request, res: Response) {
    try {
      const currentUserId = req.user!.id;
      const targetUserId  = req.params.id;

      console.log(`FOLLOW: ${currentUserId} → ${targetUserId}`);

      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId),
      ]);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Ensure arrays exist
      if (!Array.isArray(currentUser.following)) {
        currentUser.following = [];
      }
      if (!Array.isArray(targetUser.followers)) {
        targetUser.followers = [];
      }

      // Prevent duplicate
      if (currentUser.following.includes(targetUserId)) {
        return res.status(400).json({ msg: 'Already following' });
      }

      // Perform follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);

      await Promise.all([currentUser.save(), targetUser.save()]);

      console.log('FOLLOW SUCCESS', {
        followingCount: currentUser.following.length,
        followersCount: targetUser.followers.length,
      });

      return res.json({
        followingCount: currentUser.following.length,
        followersCount: targetUser.followers.length,
      });
    } catch (err: any) {
      console.error('Error in POST /users/:id/follow:', err);
      return res.status(500).json({ msg: 'Server Error' });
    }
  }

  // Unfollow a user
  static async unfollowUser(req: Request, res: Response) {
    try {
      const currentUserId = req.user!.id;
      const targetUserId  = req.params.id;

      const [currentUser, targetUser] = await Promise.all([
        User.findById(currentUserId),
        User.findById(targetUserId),
      ]);

      if (!currentUser || !targetUser) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Ensure arrays exist
      currentUser.following = Array.isArray(currentUser.following)
        ? currentUser.following
        : [];
      targetUser.followers = Array.isArray(targetUser.followers)
        ? targetUser.followers
        : [];

      // Now filter with a typed `uid`
      currentUser.following = currentUser.following.filter(
        (uid: Types.ObjectId) => uid.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (uid: Types.ObjectId) => uid.toString() !== currentUserId
      );

      await Promise.all([currentUser.save(), targetUser.save()]);

      return res.json({
        followingCount: currentUser.following.length,
        followersCount: targetUser.followers.length,
      });
    } catch (err: any) {
      console.error('Error in DELETE /users/:id/follow:', err);
      return res.status(500).json({ msg: 'Server Error' });
    }
  }

  // Get user's following list
  static async getFollowingList(req: Request, res: Response) {
    try {
      const { id } = req.params

      // only allow the authenticated user to fetch their own list:
      if (req.user!.id !== id) {
        return res.status(403).json({ msg: 'Forbidden' })
      }

      // ← fetch exactly one document, not an array
      const me = await User.findById(id)
        .select('following')
        .lean<{ following?: Array<{ toString(): string }> }>()

      if (!me) {
        return res.status(404).json({ msg: 'User not found' })
      }

      // ensure we always return an array of strings
      const followingList: string[] = Array.isArray(me.following)
        ? me.following.map((objId) => objId.toString())
        : []

      return res.json(followingList)
    } catch (err) {
      console.error('GET /users/:id/following error:', err)
      return res.status(500).json({ msg: 'Server error' })
    }
  }
} 