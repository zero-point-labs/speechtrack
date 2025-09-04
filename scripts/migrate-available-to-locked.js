#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

async function migrateAvailableToLocked() {
  try {
    console.log('🔄 Migrating all "available" sessions to "locked" status...\n');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;
    
    // Get all sessions with "available" status
    const { Query } = await import('node-appwrite');
    const availableSessions = await databases.listDocuments(
      databaseId,
      sessionsCollectionId,
      [
        Query.equal('status', 'available'),
        Query.limit(1000)
      ]
    );
    
    console.log(`📊 Found ${availableSessions.total} sessions with "available" status`);
    
    if (availableSessions.total === 0) {
      console.log('✅ No sessions to migrate - all good!');
      return;
    }
    
    console.log('\n🔄 Migrating sessions...');
    let migratedCount = 0;
    
    for (const session of availableSessions.documents) {
      try {
        await databases.updateDocument(
          databaseId,
          sessionsCollectionId,
          session.$id,
          { status: 'locked' }
        );
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`   Migrated ${migratedCount}/${availableSessions.total} sessions...`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate session ${session.$id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Migration completed! ${migratedCount}/${availableSessions.total} sessions migrated`);
    console.log('\n🎯 Result:');
    console.log('   ❌ "available" status eliminated');  
    console.log('   ✅ All sessions now use: locked, completed, cancelled');
    
  } catch (error) {
    console.error('❌ Error migrating sessions:', error);
  }
}

migrateAvailableToLocked();
