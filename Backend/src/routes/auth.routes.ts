import express, { Request, Response, Router } from 'express';
import auth from '../middleware/auth';
import { AuthController } from '../controllers/auth.controller';
import { ProfileController } from '../controllers/profile.controller';
import { SocialController } from '../controllers/social.controller';

const router: Router = express.Router();

// ====================================================================
// AUTHENTICATION ROUTES
// ====================================================================

// Register new user
router.post('/register', AuthController.register);

// Login user
router.post('/login', AuthController.login);

// Refresh access token
router.post('/refresh', AuthController.refresh);

// Logout user
router.post('/logout', AuthController.logout);

// Forgot password
router.post('/forgot-password', AuthController.forgotPassword);

// Reset password
router.post('/reset-password', AuthController.resetPassword);

// ====================================================================
// USER PROFILE ROUTES
// ====================================================================

// Get current user profile
router.get('/user', auth, ProfileController.getProfile);

// Update user profile
router.put('/user/profile', auth, ProfileController.updateProfile);

// Change password
router.put('/user/change-password', auth, ProfileController.changePassword);

// Delete account (soft delete)
router.delete('/user/account', auth, ProfileController.deleteAccount);

// ====================================================================
// SOCIAL ROUTES
// ====================================================================

// Get user by ID (for public profiles)
router.get('/users/:id', SocialController.getUserById);

// Follow a user
router.post('/users/:id/follow', auth, SocialController.followUser);

// Unfollow a user
router.delete('/users/:id/follow', auth, SocialController.unfollowUser);

// Get user's following list
router.get('/users/:id/following', auth, SocialController.getFollowingList);

export default router;