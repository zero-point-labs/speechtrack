#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

async function checkClientCodes() {
  console.log('🔍 Checking client codes...\n');
  
  try {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const collectionId = process.env.NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID;
    
    // List all client codes
    const result = await databases.listDocuments(databaseId, collectionId);
    
    console.log(`📋 Found ${result.documents.length} client code(s):`);
    
    result.documents.forEach((doc, index) => {
      console.log(`\n${index + 1}. Code: ${doc.code}`);
      console.log(`   ID: ${doc.$id}`);
      console.log(`   Student ID: ${doc.studentId}`);
      console.log(`   Is Used: ${doc.isUsed}`);
      console.log(`   Created: ${doc.$createdAt}`);
    });
    
    // Test specific code
    console.log('\n🧪 Testing TEST123 code validation...');
    
    const { Query } = require('node-appwrite');
    const testQuery = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal('code', 'TEST123'),
        Query.equal('isUsed', false)
      ]
    );
    
    console.log(`Found ${testQuery.documents.length} matching document(s) for TEST123`);
    
    if (testQuery.documents.length > 0) {
      console.log('✅ TEST123 should work for signup');
    } else {
      console.log('❌ TEST123 is not available (might be used or not exist)');
      
      // Check if it exists but is used
      const usedQuery = await databases.listDocuments(
        databaseId,
        collectionId,
        [Query.equal('code', 'TEST123')]
      );
      
      if (usedQuery.documents.length > 0) {
        console.log(`⚠️  TEST123 exists but isUsed=${usedQuery.documents[0].isUsed}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking client codes:', error.message);
  }
}

if (require.main === module) {
  checkClientCodes();
}

module.exports = { checkClientCodes };
