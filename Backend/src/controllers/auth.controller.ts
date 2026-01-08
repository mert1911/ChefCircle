import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { JWT_SECRET, JWT_REFRESH_SECRET } from '../config';
import { IUser } from '../models/User';
import { validatePassword, getPasswordRequirementsText } from '../utils/password.validator';

// Helper function to generate tokens with rotation support
const generateTokens = async (user: any) => {
  const payload = {
    id: user._id || user.id, // Use _id if id is not available
    username: user.username,
    email: user.email,
    role: user.role || 'user', // Include role, default to 'user' if not set
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  // Store refresh token in database for rotation security
  user.refreshToken = refreshToken;
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await user.save();

  return { accessToken, refreshToken };
};

// Helper function to set refresh token cookie
const setRefreshTokenCookie = (res: Response, refreshToken: string) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/'
  });
};

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response) {
    try {
      const { username, email, password, firstName, lastName, bio, profileImage } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
      }

      // Validate password policy
      const passwordValidation = validatePassword(password, undefined, {
        username,
        email,
        firstName,
        lastName
      });

      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          msg: 'Password does not meet security requirements',
          errors: passwordValidation.errors,
          requirements: getPasswordRequirementsText(),
          passwordStrength: passwordValidation.strength
        });
      }

      // Check for existing user including deleted ones
      let user = await User.findOne({ email: email.toLowerCase() }).select('+isDeleted');
      if (user && !user.isDeleted) {
        return res.status(400).json({ msg: 'User already exists' });
      } else if (user && user.isDeleted) {
        return res.status(400).json({ 
          msg: 'An account with this email was previously deactivated. Please contact support to restore it or use a different email.',
          accountDeactivated: true 
        });
      }

      user = new User({
        username,
        email: email.toLowerCase(), // Normalize email for consistency
        password,
        firstName: firstName || username,
        lastName: lastName || '',
        bio: bio || '',
        profileImage
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const { accessToken, refreshToken } = await generateTokens(user);

      // Set refresh token as HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        profileImage: user.profileImage,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus
      };

      res.status(201).json({ token: accessToken, user: userData });
    } catch (err: any) {
      console.error('Registration error:', err.message);
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  }

  // Login user
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide both email and password' });
      }

      // Use consistent Mongoose query with proper field selection
      // +isDeleted includes the soft-deleted field for checking account status
      const user = await User.findOne({ email: email.toLowerCase() }).select('+isDeleted');
      
      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      // Check if account is deactivated
      if (user.isDeleted) {
        return res.status(403).json({ 
          msg: 'Your account has been deactivated. Please contact support to restore your account.',
          accountDeactivated: true 
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const { accessToken, refreshToken } = await generateTokens(user);

      // Set refresh token as HTTP-only cookie
      setRefreshTokenCookie(res, refreshToken);

      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        bio: user.bio,
        profileImage: user.profileImage,
        subscriptionType: user.subscriptionType,
        subscriptionStatus: user.subscriptionStatus,
        // Premium fitness/nutrition fields
        fitnessGoal: user.fitnessGoal,
        weight: user.weight,
        height: user.height,
        biologicalGender: user.biologicalGender,
        age: user.age,
        activityLevel: user.activityLevel,
        dailyCalories: user.dailyCalories,
        dailyProteins: user.dailyProteins,
        dailyCarbs: user.dailyCarbs,
        dailyFats: user.dailyFats,
        following: user.following,
        followers: user.followers,
      };

      res.json({ token: accessToken, user: userData });
    } catch (err: any) {
      console.error('Login error:', err.message);
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  }

  // Refresh access token with token rotation
  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        return res.status(401).json({ msg: 'Refresh token not provided' });
      }

      // Verify refresh token JWT signature first
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as any;
      
      // Find user to ensure they still exist and account is active
      const userId = decoded.id || decoded._id;
      const user = await User.findById(userId).select('+isDeleted');
      
      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }

      // Check if user is soft-deleted
      if (user.isDeleted) {
        return res.status(401).json({ msg: 'Account has been deactivated' });
      }

      // SECURITY: Verify the refresh token matches what's stored in database
      if (user.refreshToken !== refreshToken) {
        console.warn(`Token rotation security: Invalid refresh token for user ${user.id}`);
        return res.status(401).json({ msg: 'Invalid refresh token' });
      }

      // Check if refresh token is expired in database
      if (user.refreshTokenExpires && user.refreshTokenExpires < new Date()) {
        console.warn(`Token rotation security: Expired refresh token for user ${user.id}`);
        return res.status(401).json({ msg: 'Refresh token expired' });
      }

      // Generate new tokens (this will automatically store new refresh token)
      const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
      };

      const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      // ROTATION: Update refresh token in database (invalidates old token)
      user.refreshToken = newRefreshToken;
      user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await user.save();

      console.log(`Token rotation: New tokens issued for user ${user.id}`);

      // Set new refresh token cookie
      setRefreshTokenCookie(res, newRefreshToken);

      res.json({ token: newAccessToken });
    } catch (err: any) {
      console.error('Refresh token error:', err.message);
      return res.status(401).json({ msg: 'Invalid refresh token' });
    }
  }

  // Logout user with token rotation security
  static async logout(req: Request, res: Response) {
    try {
      // Clear refresh token from database if user is authenticated
      const { refreshToken } = req.cookies;
      
      if (refreshToken) {
        try {
          // Decode token to get user ID (don't verify expiration for logout)
          const decoded = jwt.decode(refreshToken) as any;
          if (decoded && decoded.id) {
            await User.findByIdAndUpdate(decoded.id, {
              refreshToken: null,
              refreshTokenExpires: null
            });
            console.log(`Token rotation: Refresh token cleared for user ${decoded.id} on logout`);
          }
        } catch (err) {
          // Continue with logout even if token clearing fails
          console.warn('Failed to clear refresh token from database during logout:', err);
        }
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.json({ msg: 'Logged out successfully' });
    } catch (err: any) {
      console.error('Logout error:', err.message);
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ msg: 'Email is required' });
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = require('crypto').randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetExpires;
      await user.save();

      // Send email (in development this will log to console)
      const { sendPasswordResetEmail } = require('../services/emailService');
      await sendPasswordResetEmail(email, resetToken);

      res.json({ msg: 'If an account with that email exists, a password reset link has been sent.' });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }

  // Reset password
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, email, newPassword } = req.body;

      if (!token || !email || !newPassword) {
        return res.status(400).json({ msg: 'Token, email, and new password are required' });
      }

      const user = await User.findOne({
        email: email.toLowerCase(),
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() } // Token must not be expired
      });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid or expired reset token' });
      }

      // Check if new password is the same as current password
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

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      // Clear reset token fields
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      
      await user.save();

      res.json({ 
        msg: 'Password has been reset successfully. You can now log in with your new password.',
        passwordStrength: passwordValidation.strength
      });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
} 