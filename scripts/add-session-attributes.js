// Add missing attributes to sessions collection
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

async function addSessionAttributes() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;

  console.log('Adding missing attributes to sessions collection...');
  console.log('Database ID:', databaseId);
  console.log('Sessions Collection ID:', sessionsCollectionId);

  try {
    // Add sessionSummary attribute (string, optional)
    console.log('\n1. Adding sessionSummary attribute...');
    await databases.createStringAttribute(
      databaseId,
      sessionsCollectionId,
      'sessionSummary',
      2000, // Max length 2000 characters
      false, // Not required
      null // No default value
    );
    console.log('✅ sessionSummary attribute added');

    // Add achievement attribute (string for JSON, optional)
    console.log('\n2. Adding achievement attribute...');
    await databases.createStringAttribute(
      databaseId,
      sessionsCollectionId,
      'achievement',
      1000, // Max length 1000 characters for JSON
      false, // Not required
      null // No default value
    );
    console.log('✅ achievement attribute added');

    // Add feedback attribute (string for JSON array, optional)
    console.log('\n3. Adding feedback attribute...');
    await databases.createStringAttribute(
      databaseId,
      sessionsCollectionId,
      'feedback',
      5000, // Max length 5000 characters for JSON array
      false, // Not required
      '[]' // Default to empty array
    );
    console.log('✅ feedback attribute added');

    console.log('\n🎉 All attributes added successfully!');
    console.log('\nYou can now save sessions with:');
    console.log('- sessionSummary: Session description text');
    console.log('- achievement: JSON string for achievement object');
    console.log('- feedback: JSON string for comments array');

  } catch (error) {
    console.error('❌ Error adding attributes:', error.message);
    
    if (error.code === 409) {
      console.log('\nℹ️  Some attributes may already exist. This is normal.');
    }
  }
}

addSessionAttributes();
