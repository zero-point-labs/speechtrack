#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createUsersExtendedCollection() {
  console.log('🚀 Creating users_extended collection...\n');

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID) {
      console.error('❌ Missing NEXT_PUBLIC_APPWRITE_DATABASE_ID environment variable');
      process.exit(1);
    }

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

    // Create users_extended collection
    console.log('📁 Creating users_extended collection...');
    const collection = await databases.createCollection(
      databaseId,
      'unique()',
      'users_extended'
    );
    
    console.log(`✅ Collection created: ${collection.$id}`);
    await sleep(2000); // Wait for collection to be ready

    // Define attributes for users_extended
    const attributes = [
      { key: 'userId', type: 'string', size: 36, required: true },
      { key: 'phone', type: 'string', size: 20, required: true },
      { key: 'address', type: 'string', size: 500, required: false },
      { key: 'createdAt', type: 'datetime', required: true },
      { key: 'lastLoginAt', type: 'datetime', required: false }
    ];

    // Add attributes
    console.log('\n📝 Adding attributes...');
    for (const attr of attributes) {
      try {
        console.log(`  Adding ${attr.key} (${attr.type})`);
        
        switch (attr.type) {
          case 'string':
            await databases.createStringAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.size,
              attr.required
            );
            break;
          case 'datetime':
            await databases.createDatetimeAttribute(
              databaseId,
              collection.$id,
              attr.key,
              attr.required
            );
            break;
        }
        
        await sleep(1000); // Wait between attributes
        console.log(`  ✅ ${attr.key} added`);
      } catch (error) {
        console.error(`  ❌ Failed to add ${attr.key}:`, error.message);
      }
    }

    // Create indexes
    console.log('\n🔍 Creating indexes...');
    
    try {
      console.log('  Creating userId unique index...');
      await databases.createIndex(
        databaseId,
        collection.$id,
        'userId_idx',
        'unique',
        ['userId']
      );
      console.log('  ✅ userId_idx created');
      await sleep(1000);
    } catch (error) {
      console.error('  ❌ Failed to create userId index:', error.message);
    }

    try {
      console.log('  Creating phone index...');
      await databases.createIndex(
        databaseId,
        collection.$id,
        'phone_idx',
        'key',
        ['phone']
      );
      console.log('  ✅ phone_idx created');
    } catch (error) {
      console.error('  ❌ Failed to create phone index:', error.message);
    }

    console.log('\n🎉 users_extended collection created successfully!');
    console.log(`Collection ID: ${collection.$id}`);
    
    console.log('\n📝 Next steps:');
    console.log('1. Add this collection ID to your .env.local file as NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID');
    console.log('2. Update lib/appwrite.config.js to include this collection');
    console.log('3. Run the main restructure implementation');
    
    return collection.$id;

  } catch (error) {
    console.error('\n❌ Failed to create users_extended collection:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  createUsersExtendedCollection();
}

module.exports = { createUsersExtendedCollection };
