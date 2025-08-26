const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Server API key needed for admin operations

const databases = new Databases(client);

async function addDateOfBirthAttribute() {
  try {
    console.log('🔄 Adding dateOfBirth attribute to students collection...');
    
    // Add dateOfBirth attribute (string type to store dates)
    await databases.createStringAttribute(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
      'dateOfBirth',
      255, // max length
      false, // not required (for backward compatibility)
      null // no default value
    );
    
    console.log('✅ Successfully added dateOfBirth attribute!');
    console.log('📝 Note: Existing students will have empty dateOfBirth - you can edit them to add dates.');
    
  } catch (error) {
    if (error.message.includes('Attribute already exists')) {
      console.log('ℹ️  dateOfBirth attribute already exists');
    } else {
      console.error('❌ Error adding dateOfBirth attribute:', error.message);
    }
  }
}

addDateOfBirthAttribute();
