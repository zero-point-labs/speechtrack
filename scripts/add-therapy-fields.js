#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { Client, Databases } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY); // Server API key needed for admin operations

const databases = new Databases(client);

async function addTherapyFields() {
  try {
    console.log('🎯 Adding therapy-related fields to students collection...');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
    
    // Add therapyGoals attribute
    try {
      console.log('📝 Adding therapyGoals attribute...');
      await databases.createStringAttribute(
        databaseId,
        studentsCollectionId,
        'therapyGoals',
        5000, // max length for detailed therapy goals
        false, // not required (optional field)
        null // no default value
      );
      console.log('✅ Successfully added therapyGoals attribute!');
    } catch (error) {
      if (error.message.includes('Attribute already exists')) {
        console.log('ℹ️  therapyGoals attribute already exists');
      } else {
        console.error('❌ Error adding therapyGoals attribute:', error.message);
      }
    }
    
    // Add idNumber attribute
    try {
      console.log('🆔 Adding idNumber attribute...');
      await databases.createStringAttribute(
        databaseId,
        studentsCollectionId,
        'idNumber',
        50, // max length for ID numbers
        false, // not required (optional field)
        null // no default value
      );
      console.log('✅ Successfully added idNumber attribute!');
    } catch (error) {
      if (error.message.includes('Attribute already exists')) {
        console.log('ℹ️  idNumber attribute already exists');
      } else {
        console.error('❌ Error adding idNumber attribute:', error.message);
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('📋 Summary of changes:');
    console.log('   • therapyGoals: Optional field for admin-set therapy goals (max 5000 chars)');
    console.log('   • idNumber: Optional field for student ID numbers (max 50 chars)');
    console.log('');
    console.log('🚀 The application is now ready to use these new features:');
    console.log('   • Parents can add ID numbers during signup');
    console.log('   • Admins can set therapy goals via the admin panel');
    console.log('   • Therapy goals display in the dashboard profile cards');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Check if environment variables are loaded
if (!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || !process.env.APPWRITE_API_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('Make sure .env.local contains:');
  console.error('  - NEXT_PUBLIC_APPWRITE_ENDPOINT');
  console.error('  - NEXT_PUBLIC_APPWRITE_PROJECT_ID'); 
  console.error('  - NEXT_PUBLIC_APPWRITE_DATABASE_ID');
  console.error('  - NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID');
  console.error('  - APPWRITE_API_KEY');
  process.exit(1);
}

addTherapyFields();
