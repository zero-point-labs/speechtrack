#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');
const sessionFolderService = require('../lib/sessionFolderService').default;

const { databases } = createServerClient();

async function testFolderStatsUpdate() {
  try {
    console.log('🧪 Testing folder stats update for Michalakis Kyriakou...\n');
    
    const studentId = '68b342b4ef3a466aabb6';
    const folderId = '68b34322000fc12304c2';
    
    console.log('📊 Before stats update:');
    
    // Get current folder data
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionFoldersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FOLDERS_COLLECTION_ID;
    
    const folderBefore = await databases.getDocument(
      databaseId,
      sessionFoldersCollectionId,
      folderId
    );
    
    console.log(`   totalSessions: ${folderBefore.totalSessions}`);
    console.log(`   completedSessions: ${folderBefore.completedSessions}`);
    
    // Update folder stats
    console.log('\n🔄 Updating folder statistics...');
    const updatedFolder = await sessionFolderService.updateFolderStats(folderId);
    
    console.log('\n📊 After stats update:');
    console.log(`   totalSessions: ${updatedFolder.totalSessions}`);
    console.log(`   completedSessions: ${updatedFolder.completedSessions}`);
    
    const sessionCountChanged = folderBefore.totalSessions !== updatedFolder.totalSessions;
    const completedCountChanged = folderBefore.completedSessions !== updatedFolder.completedSessions;
    
    if (sessionCountChanged || completedCountChanged) {
      console.log('\n✅ Stats were updated!');
      if (sessionCountChanged) {
        console.log(`   📈 Session count: ${folderBefore.totalSessions} → ${updatedFolder.totalSessions}`);
      }
      if (completedCountChanged) {
        console.log(`   📈 Completed count: ${folderBefore.completedSessions} → ${updatedFolder.completedSessions}`);
      }
    } else {
      console.log('\n ℹ️  Stats were already accurate (no changes)');
    }
    
    console.log('\n🎯 Next time you create a session, the stats should update automatically!');
    
  } catch (error) {
    console.error('❌ Error testing folder stats update:', error);
  }
}

testFolderStatsUpdate();
