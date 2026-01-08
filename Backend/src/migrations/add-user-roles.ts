// Migration script to add role field to existing users
import mongoose from 'mongoose';
import User from '../models/User';
import { MONGO_URI } from '../config';

async function addRolesToExistingUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB for migration');

    // Update all users who don't have a role field
    const result = await User.updateMany(
      { role: { $exists: false } }, // Find users without role field
      { $set: { role: 'user' } }    // Set default role to 'user'
    );

    console.log(`✅ Migration completed: Updated ${result.modifiedCount} users with default role`);

    // Optionally, create an admin user if it doesn't exist
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log(`ℹ️  No admin user found with email: ${adminEmail}`);
      console.log('💡 To create an admin user, run:');
      console.log(`   db.users.updateOne({email: "${adminEmail}"}, {$set: {role: "admin"}})`);
    } else {
      // Update existing admin user to have admin role
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log(`👑 Updated ${adminEmail} to admin role`);
      } else {
        console.log(`👑 Admin user ${adminEmail} already has admin role`);
      }
    }

    // Display statistics
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });

    console.log('\n📊 User Role Statistics:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    console.log(`   Regular Users: ${regularUsers}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addRolesToExistingUsers()
    .then(() => {
      console.log('🎉 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

export default addRolesToExistingUsers; 