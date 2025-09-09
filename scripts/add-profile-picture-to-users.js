#!/usr/bin/env node

/**
 * Migration Script: Add Profile Picture to Users Extended Collection
 * 
 * This script adds a profilePicture field to the users_extended collection
 * to store parent profile pictures that sync with their children's profiles.
 */

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '68ab99977aad1233b50c';
const USERS_EXTENDED_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_USERS_EXTENDED_ID || '68aef5f19770fc264f6d';

async function addProfilePictureAttribute() {
  try {
    console.log('🚀 Adding profilePicture attribute to users_extended collection...');

    // Add profilePicture string attribute
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        USERS_EXTENDED_COLLECTION_ID,
        'profilePicture',
        2000, // max size for URL
        false // not required
      );
      console.log('✅ Added profilePicture attribute to users_extended');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ profilePicture attribute already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('🎉 Profile picture attribute migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - profilePicture: String field for storing profile picture URLs');
    console.log('');
    console.log('✨ You can now add profile pictures to user accounts!');

  } catch (error) {
    console.error('❌ Error adding profilePicture attribute:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addProfilePictureAttribute()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addProfilePictureAttribute };
