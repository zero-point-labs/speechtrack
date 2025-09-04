#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

async function forceUpdateAllFolderStats() {
  try {
    console.log('🔄 Force updating ALL folder statistics...\n');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionFoldersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FOLDERS_COLLECTION_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;
    
    // Get all folders
    const { Query } = await import('node-appwrite');
    const foldersResult = await databases.listDocuments(
      databaseId,
      sessionFoldersCollectionId,
      [Query.limit(1000)]
    );
    
    console.log(`📊 Found ${foldersResult.total} folders to update\n`);
    
    for (const folder of foldersResult.documents) {
      console.log(`📁 Updating folder: ${folder.name} (${folder.$id.substring(0,8)}...)`);
      
      // Get all sessions for this folder
      const sessionsResult = await databases.listDocuments(
        databaseId,
        sessionsCollectionId,
        [
          Query.equal('folderId', folder.$id),
          Query.limit(1000)
        ]
      );
      
      const sessions = sessionsResult.documents;
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(session => session.status === 'completed').length;
      
      console.log(`   Sessions: ${completedSessions}/${totalSessions} completed`);
      console.log(`   Old stats: ${folder.completedSessions}/${folder.totalSessions}`);
      
      // Update the folder with correct statistics
      const now = new Date().toISOString();
      await databases.updateDocument(
        databaseId,
        sessionFoldersCollectionId,
        folder.$id,
        {
          totalSessions,
          completedSessions,
          updatedAt: now
        }
      );
      
      if (folder.totalSessions !== totalSessions || folder.completedSessions !== completedSessions) {
        console.log(`   ✅ Updated: ${folder.completedSessions}/${folder.totalSessions} → ${completedSessions}/${totalSessions}`);
      } else {
        console.log(`   ℹ️  No change needed`);
      }
      console.log('');
    }
    
    console.log('🎉 All folder stats updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating folder stats:', error);
  }
}

forceUpdateAllFolderStats();
