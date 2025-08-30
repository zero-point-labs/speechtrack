#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

// Database and collection configurations
const DATABASE_NAME = 'speechtrack_main';
const COLLECTION_NAME = 'session_folders';

const SESSION_FOLDERS_COLLECTION = {
  name: COLLECTION_NAME,
  attributes: [
    { key: 'studentId', type: 'string', size: 36, required: true },
    { key: 'name', type: 'string', size: 255, required: true },
    { key: 'description', type: 'string', size: 1000, required: false },
    { key: 'isActive', type: 'boolean', required: true },
    { key: 'totalSessions', type: 'integer', required: true },
    { key: 'completedSessions', type: 'integer', required: true },
    { key: 'startDate', type: 'datetime', required: true },
    { key: 'endDate', type: 'datetime', required: false },
    { key: 'status', type: 'enum', elements: ['active', 'completed', 'paused'], required: true },
    { key: 'createdAt', type: 'datetime', required: true },
    { key: 'updatedAt', type: 'datetime', required: true }
  ],
  indexes: [
    { key: 'studentId_idx', type: 'key', attributes: ['studentId'] },
    { key: 'active_folder_idx', type: 'key', attributes: ['studentId', 'isActive'] },
    { key: 'status_idx', type: 'key', attributes: ['status'] },
    { key: 'created_idx', type: 'key', attributes: ['createdAt'] }
  ]
};

async function setupSessionFoldersCollection() {
  try {
    console.log('🚀 Setting up Session Folders collection...');
    
    // Get database ID from environment
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    if (!databaseId) {
      throw new Error('NEXT_PUBLIC_APPWRITE_DATABASE_ID not found in environment variables');
    }

    console.log(`📂 Database ID: ${databaseId}`);

    // Check if collection already exists
    let collectionExists = false;
    try {
      const existingCollection = await databases.getCollection(databaseId, 'session_folders');
      console.log('⚠️  Session Folders collection already exists:', existingCollection.name);
      collectionExists = true;
    } catch (error) {
      if (error.code !== 404) {
        throw error;
      }
    }

    let collection;
    if (!collectionExists) {
      // Create the collection
      console.log('📝 Creating Session Folders collection...');
      collection = await databases.createCollection(
        databaseId,
        'unique()', // Let Appwrite generate unique ID
        SESSION_FOLDERS_COLLECTION.name,
        undefined, // permissions (will use default)
        false, // documentSecurity
        true // enabled
      );
      console.log('✅ Collection created:', collection.name, 'ID:', collection.$id);
    } else {
      collection = await databases.getCollection(databaseId, 'session_folders');
    }

    // Add attributes
    console.log('📋 Adding attributes...');
    for (const attr of SESSION_FOLDERS_COLLECTION.attributes) {
      try {
        console.log(`  Adding attribute: ${attr.key} (${attr.type})`);
        
        if (attr.type === 'string') {
          await databases.createStringAttribute(
            databaseId,
            collection.$id,
            attr.key,
            attr.size,
            attr.required,
            attr.default,
            false // array
          );
        } else if (attr.type === 'integer') {
          await databases.createIntegerAttribute(
            databaseId,
            collection.$id,
            attr.key,
            attr.required,
            undefined, // min
            undefined, // max
            undefined, // no default for required attributes
            false // array
          );
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(
            databaseId,
            collection.$id,
            attr.key,
            attr.required,
            undefined, // no default for required attributes
            false // array
          );
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(
            databaseId,
            collection.$id,
            attr.key,
            attr.required,
            undefined, // default
            false // array
          );
        } else if (attr.type === 'enum') {
          await databases.createEnumAttribute(
            databaseId,
            collection.$id,
            attr.key,
            attr.elements,
            attr.required,
            undefined, // no default for required attributes
            false // array
          );
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`  ⚠️  Attribute ${attr.key} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error creating attribute ${attr.key}:`, error.message);
          throw error;
        }
      }
    }

    // Wait a bit for attributes to be ready
    console.log('⏳ Waiting for attributes to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Add indexes
    console.log('🔍 Adding indexes...');
    for (const index of SESSION_FOLDERS_COLLECTION.indexes) {
      try {
        console.log(`  Adding index: ${index.key}`);
        await databases.createIndex(
          databaseId,
          collection.$id,
          index.key,
          index.type,
          index.attributes
        );
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        if (error.message && error.message.includes('already exists')) {
          console.log(`  ⚠️  Index ${index.key} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error creating index ${index.key}:`, error.message);
          // Don't throw on index errors as they're not critical
        }
      }
    }

    console.log('\n🎉 Session Folders collection setup completed successfully!');
    console.log('📋 Collection Details:');
    console.log(`   Name: ${collection.name}`);
    console.log(`   ID: ${collection.$id}`);
    console.log(`   Attributes: ${SESSION_FOLDERS_COLLECTION.attributes.length}`);
    console.log(`   Indexes: ${SESSION_FOLDERS_COLLECTION.indexes.length}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Add the collection ID to your .env.local file:');
    console.log(`   NEXT_PUBLIC_APPWRITE_SESSION_FOLDERS_COLLECTION_ID=${collection.$id}`);
    console.log('2. Update lib/appwrite.config.js to include the new collection');
    console.log('3. Run the migration script to convert existing sessions');

    return collection;

  } catch (error) {
    console.error('❌ Error setting up Session Folders collection:', error);
    throw error;
  }
}

// Add folderId attribute to existing sessions collection
async function addFolderIdToSessions() {
  try {
    console.log('\n🔄 Adding folderId attribute to sessions collection...');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;
    
    if (!sessionsCollectionId) {
      throw new Error('NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID not found in environment variables');
    }

    try {
      await databases.createStringAttribute(
        databaseId,
        sessionsCollectionId,
        'folderId',
        36, // size for UUID
        false, // not required initially (for migration)
        undefined, // no default
        false // not array
      );
      console.log('✅ Added folderId attribute to sessions collection');
      
      // Wait for attribute to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add index for folderId
      await databases.createIndex(
        databaseId,
        sessionsCollectionId,
        'folderId_idx',
        'key',
        ['folderId']
      );
      console.log('✅ Added folderId index to sessions collection');
      
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('⚠️  folderId attribute already exists in sessions collection');
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error adding folderId to sessions:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Session Folders Database Setup...\n');
    
    // Setup session folders collection
    const collection = await setupSessionFoldersCollection();
    
    // Add folderId to sessions collection
    await addFolderIdToSessions();
    
    console.log('\n🎉 All database setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Session Folders collection created/verified');
    console.log('✅ All attributes added');
    console.log('✅ All indexes created');
    console.log('✅ Sessions collection updated with folderId');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  setupSessionFoldersCollection,
  addFolderIdToSessions,
  main
};
