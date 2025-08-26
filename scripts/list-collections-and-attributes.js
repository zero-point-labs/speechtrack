// List all collections and their attributes
import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

async function listCollectionsAndAttributes() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  
  console.log('🔍 Listing all collections and their attributes...');
  console.log('Database ID:', databaseId);
  console.log('Sessions Collection ID from env:', process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID);

  try {
    // List all collections
    console.log('\n📋 All Collections:');
    const collections = await databases.listCollections(databaseId);
    
    collections.collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name} (ID: ${collection.$id})`);
    });

    // Check if sessions collection exists
    const sessionsCollection = collections.collections.find(
      col => col.$id === process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID || 
             col.name === 'sessions'
    );

    if (!sessionsCollection) {
      console.log('\n❌ Sessions collection not found!');
      console.log('Available collections:');
      collections.collections.forEach(col => {
        console.log(`- ${col.name} (${col.$id})`);
      });
      return;
    }

    console.log(`\n✅ Found sessions collection: ${sessionsCollection.name} (${sessionsCollection.$id})`);

    // List attributes for sessions collection
    console.log('\n📝 Sessions Collection Attributes:');
    const attributes = await databases.listAttributes(databaseId, sessionsCollection.$id);
    
    if (attributes.attributes.length === 0) {
      console.log('No attributes found');
    } else {
      attributes.attributes.forEach((attr, index) => {
        console.log(`${index + 1}. ${attr.key} (${attr.type}) - ${attr.required ? 'Required' : 'Optional'}`);
        if (attr.size) console.log(`   Max size: ${attr.size}`);
        if (attr.default !== null && attr.default !== undefined) {
          console.log(`   Default: ${attr.default}`);
        }
      });
    }

    // Check what attributes we need to add
    const existingKeys = attributes.attributes.map(attr => attr.key);
    const neededAttributes = ['sessionSummary', 'achievement', 'feedback'];
    const missingAttributes = neededAttributes.filter(attr => !existingKeys.includes(attr));

    if (missingAttributes.length > 0) {
      console.log(`\n⚠️  Missing attributes: ${missingAttributes.join(', ')}`);
    } else {
      console.log('\n✅ All required attributes exist!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listCollectionsAndAttributes();
