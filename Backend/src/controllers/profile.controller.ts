import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { validatePassword, getPasswordRequirementsText } from '../utils/password.validator';

export class ProfileController {
  // Get current user profile
  static async getProfile(req: Request, res: Response) {
    try {
      // req.user is set by the auth middleware with type DecodedToken
      const user = await User.findById(req.user!.id).select('-password'); // Use ! to assert non-null
      
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      res.json(user);
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        bio, 
        profileImage,
        // Premium fitness/nutrition fields
        fitnessGoal,
        weight,
        height,
        biologicalGender,
        age,
        activityLevel,
        dailyCalories,
        dailyProteins,
        dailyCarbs,
        dailyFats,
        following,
        followers
      } = req.body;
      
      // Check email uniqueness only if email is being changed
      if (email && email !== req.user!.email) { // Use ! to assert non-null
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: req.user!.id }
        });
        if (existingUser) {
          return res.status(400).json({ msg: 'Email already in use' });
        }
      }

      const updateData: any = { 
        firstName, 
        lastName, 
        email: email ? email.toLowerCase() : undefined,
        bio 
      };
      
      // Handle optional fields
      if (profileImage !== undefined) {
        updateData.profileImage = profileImage;
      }

      // Handle premium fitness/nutrition fields
      if (fitnessGoal !== undefined) updateData.fitnessGoal = fitnessGoal;
      if (weight !== undefined) updateData.weight = weight;
      if (height !== undefined) updateData.height = height;
      if (biologicalGender !== undefined) updateData.biologicalGender = biologicalGender;
      if (age !== undefined) updateData.age = age;
      if (activityLevel !== undefined) updateData.activityLevel = activityLevel;
      if (dailyCalories !== undefined) updateData.dailyCalories = dailyCalories;
      if (dailyProteins !== undefined) updateData.dailyProteins = dailyProteins;
      if (dailyCarbs !== undefined) updateData.dailyCarbs = dailyCarbs;
      if (dailyFats !== undefined) updateData.dailyFats = dailyFats;

      const updatedUser = await User.findByIdAndUpdate(
        req.user!.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!updatedUser) {
        return res.status(404).json({ msg: 'User not found' });
      }

      res.json(updatedUser);
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.code === 11000) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  }

  // Change user password
  static async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ msg: 'Please provide both current and new password' });
      }

      const user = await User.findById(req.user!.id); // Use ! to assert non-null
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Current password is incorrect' });
      }

      // Check if new password is same as current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({ msg: 'New password cannot be the same as your current password' });
      }

      // Validate new password policy
      const passwordValidation = validatePassword(newPassword, undefined, {
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      });

      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          msg: 'New password does not meet security requirements',
          errors: passwordValidation.errors,
          requirements: getPasswordRequirementsText(),
          passwordStrength: passwordValidation.strength
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      
      await user.save();

      res.json({ 
        msg: 'Password updated successfully',
        passwordStrength: passwordValidation.strength
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }

  // Delete user account (soft delete)
  static async deleteAccount(req: Request, res: Response) {
    try {
      const { password, reason } = req.body;

      if (!password) {
        return res.status(400).json({ msg: 'Password confirmation is required to delete account' });
      }

      const user = await User.findById(req.user!.id); // Use ! to assert non-null
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check if account is already deleted
      if (user.isDeleted) {
        return res.status(400).json({ msg: 'Account is already deactivated' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Incorrect password. Account deletion cancelled.' });
      }

      // Perform soft deletion instead of hard deletion
      const updatedUser = await User.findByIdAndUpdate(
        req.user!.id,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletionReason: reason || 'User requested account deletion',
          // Clear refresh tokens on account deletion for security
          refreshToken: null,
          refreshTokenExpires: null,
          // Temporarily disable anonymization for testing
          // email: `deleted_${Date.now()}@deleted.local`,
          // username: `deleted_user_${Date.now()}`,
        },
        { new: true }
      );
      
      if (!updatedUser) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Clear refresh token cookie on account deletion
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      res.json({ msg: 'Account deactivated successfully' });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
} 