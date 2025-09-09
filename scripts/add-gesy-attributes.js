#!/usr/bin/env node

/**
 * Migration Script: Add ΓεΣΥ (GESY) attributes to sessions collection
 * 
 * This script adds the new isGESY and gesyNote attributes to the existing sessions collection.
 * It's safe to run multiple times - it will skip if attributes already exist.
 */

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '68ab99977aad1233b50c';
const SESSIONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SESSIONS_ID || '68ab99a82b7fbc5dd564';

async function addGesyAttributes() {
  try {
    console.log('🚀 Starting ΓεΣΥ attributes migration...');

    // Add isGESY boolean attribute
    try {
      await databases.createBooleanAttribute(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        'isGESY',
        false // not required, so we can set default
      );
      console.log('✅ Added isGESY boolean attribute');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ isGESY attribute already exists, skipping...');
      } else {
        throw error;
      }
    }

    // Wait a bit for the first attribute to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add gesyNote string attribute
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        SESSIONS_COLLECTION_ID,
        'gesyNote',
        500, // max size
        false // not required
      );
      console.log('✅ Added gesyNote string attribute');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ gesyNote attribute already exists, skipping...');
      } else {
        throw error;
      }
    }

    console.log('🎉 ΓεΣΥ attributes migration completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - isGESY: Boolean field to track ΓεΣΥ status');
    console.log('   - gesyNote: Optional text field for ΓεΣΥ-related notes');
    console.log('');
    console.log('✨ You can now use ΓεΣΥ features in your sessions!');

  } catch (error) {
    console.error('❌ Error adding ΓεΣΥ attributes:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  addGesyAttributes()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addGesyAttributes };
