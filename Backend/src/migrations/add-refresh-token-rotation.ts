import mongoose from 'mongoose';
import { User } from '../models';

/**
 * Migration: Add Refresh Token Rotation Support
 * 
 * This migration ensures existing users have the new refresh token fields
 * and clears any existing sessions to force re-authentication with the new system.
 */
export const addRefreshTokenRotationMigration = async () => {
  console.log('🔄 Starting refresh token rotation migration...');
  
  try {
    // Update all existing users to have null refresh token fields
    // This forces all existing sessions to re-authenticate with the new rotation system
    const result = await User.updateMany(
      { 
        $or: [
          { refreshToken: { $exists: false } },
          { refreshTokenExpires: { $exists: false } }
        ]
      },
      {
        $set: {
          refreshToken: null,
          refreshTokenExpires: null
        }
      }
    );

    console.log(`✅ Migration completed: Updated ${result.modifiedCount} users`);
    console.log('🔒 All existing sessions will require re-authentication for security');
    
    return {
      success: true,
      usersUpdated: result.modifiedCount,
      message: 'Refresh token rotation migration completed successfully'
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new Error(`Refresh token rotation migration failed: ${error}`);
  }
};

/**
 * Rollback migration (if needed for development)
 */
export const rollbackRefreshTokenRotationMigration = async () => {
  console.log('🔄 Rolling back refresh token rotation migration...');
  
  try {
    const result = await User.updateMany(
      {},
      {
        $unset: {
          refreshToken: "",
          refreshTokenExpires: ""
        }
      }
    );

    console.log(`✅ Rollback completed: Updated ${result.modifiedCount} users`);
    
    return {
      success: true,
      usersUpdated: result.modifiedCount,
      message: 'Refresh token rotation rollback completed successfully'
    };
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw new Error(`Refresh token rotation rollback failed: ${error}`);
  }
}; 