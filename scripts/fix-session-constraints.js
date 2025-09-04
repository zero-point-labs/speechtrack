#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

async function fixSessionConstraints() {
  try {
    console.log('🔧 Fixing session numbering constraints...\n');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;
    
    console.log('📊 Current situation:');
    console.log('❌ Old constraint: (studentId + sessionNumber) - prevents per-folder numbering');
    console.log('✅ New constraint: (studentId + folderId + sessionNumber) - allows per-folder numbering');
    console.log();
    
    // Step 1: Remove the problematic unique constraint
    console.log('🗑️  Step 1: Removing old unique constraint...');
    try {
      await databases.deleteIndex(
        databaseId,
        sessionsCollectionId,
        'student_session_idx'
      );
      console.log('✅ Removed old constraint: student_session_idx');
    } catch (error) {
      if (error.message && error.message.includes('Index not found')) {
        console.log('⚠️  Old constraint already removed or not found');
      } else {
        throw error;
      }
    }
    
    // Step 2: Create new unique constraint including folderId
    console.log('\n🔧 Step 2: Creating new unique constraint...');
    try {
      await databases.createIndex(
        databaseId,
        sessionsCollectionId,
        'student_folder_session_idx',
        'unique',
        ['studentId', 'folderId', 'sessionNumber']
      );
      console.log('✅ Created new constraint: student_folder_session_idx (studentId + folderId + sessionNumber)');
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  New constraint already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 Constraint fixes completed!');
    console.log('\n💡 What this enables:');
    console.log('✅ Each folder can have sessions numbered 1, 2, 3...');
    console.log('✅ Same student can have Session 1 in Folder A and Session 1 in Folder B');
    console.log('✅ Still prevents true duplicates within the same folder');
    console.log('\n⚠️  Next steps:');
    console.log('1. Fix session number format in the create session logic');
    console.log('2. Test creating a new session in the folder');
    
  } catch (error) {
    console.error('❌ Error fixing session constraints:', error);
    
    console.log('\n🔍 Troubleshooting:');
    console.log('- Check that all sessions have valid folderId values');
    console.log('- Check for any NULL folderId values that might cause conflicts');
    console.log('- Consider cleaning up session data format first');
  }
}

fixSessionConstraints();
