#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

async function testConnection() {
  console.log('🔍 Testing Appwrite connection...\n');
  
  try {
    // Validate environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_APPWRITE_ENDPOINT',
      'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
      'APPWRITE_API_KEY'
    ];
    
    const missing = requiredEnvVars.filter(env => !process.env[env]);
    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing.join(', '));
      process.exit(1);
    }
    
    const { databases, storage } = createServerClient();
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const databaseList = await databases.list();
    console.log(`✅ Connected to Appwrite! Found ${databaseList.databases.length} database(s)`);
    
    // Test storage connection
    console.log('\n🪣 Testing storage connection...');
    const bucketList = await storage.listBuckets();
    console.log(`✅ Storage connected! Found ${bucketList.buckets.length} bucket(s)`);
    
    // If we have a database, test collections
    if (process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID) {
      console.log('\n📁 Testing collections...');
      const collections = await databases.listCollections(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
      console.log(`✅ Found ${collections.collections.length} collection(s):`);
      
      collections.collections.forEach(collection => {
        console.log(`   - ${collection.name} (${collection.$id})`);
      });
    }
    
    // Test basic CRUD operations
    if (process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID) {
      console.log('\n🧪 Testing basic operations...');
      
      // Try to list documents (should be empty initially)
      const students = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID
      );
      
      console.log(`✅ Students collection accessible. Found ${students.documents.length} student(s)`);
    }
    
    console.log('\n🎉 All tests passed! Your Appwrite setup is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    
    if (error.code === 401) {
      console.error('🔐 Authentication failed. Please check your API key.');
    } else if (error.code === 404) {
      console.error('🔍 Resource not found. Please check your project ID and database setup.');
    } else {
      console.error('Full error:', error);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };
