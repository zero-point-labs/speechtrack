#!/usr/bin/env node

// Test script to verify file service and Appwrite storage functionality
const { Client, Storage, Databases, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);
const databases = new Databases(client);

async function testFileService() {
  console.log('🔧 Testing File Service and Storage...\n');

  try {
    // Test 1: List files in storage
    console.log('1. Testing file listing...');
    const files = await storage.listFiles(process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID);
    console.log(`   ✅ Found ${files.files.length} files in storage`);
    
    if (files.files.length > 0) {
      console.log('   📁 Sample files:');
      files.files.slice(0, 3).forEach(file => {
        console.log(`      - ${file.name} (${Math.round(file.sizeOriginal / 1024)} KB)`);
      });
    }

    // Test 2: Check for session-associated files
    console.log('\n2. Testing session file association...');
    const sessionFiles = files.files.filter(file => file.name.includes('_'));
    console.log(`   📊 Found ${sessionFiles.length} session-associated files`);
    
    if (sessionFiles.length > 0) {
      const sessionIds = [...new Set(sessionFiles.map(file => file.name.split('_')[0]))];
      console.log(`   🎯 Associated with ${sessionIds.length} different sessions:`);
      sessionIds.slice(0, 3).forEach(id => {
        const count = sessionFiles.filter(f => f.name.startsWith(id + '_')).length;
        console.log(`      - Session ${id}: ${count} files`);
      });
    }

    // Test 3: Test file URLs
    console.log('\n3. Testing file URL generation...');
    if (files.files.length > 0) {
      const testFile = files.files[0];
      console.log(`   📎 Testing URLs for: ${testFile.name}`);
      
      const viewUrl = storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID, testFile.$id);
      const downloadUrl = storage.getFileDownload(process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID, testFile.$id);
      
      console.log(`   🔗 View URL: ${viewUrl?.href || 'undefined'}`);
      console.log(`   💾 Download URL: ${downloadUrl?.href || 'undefined'}`);
      
      // Debug the URL objects
      console.log(`   🔍 View URL object:`, typeof viewUrl, viewUrl);
      console.log(`   🔍 Download URL object:`, typeof downloadUrl, downloadUrl);
    }

    // Test 4: Check sessions with files
    console.log('\n4. Testing session-file relationship...');
    const sessions = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID
    );
    
    console.log(`   📚 Found ${sessions.documents.length} sessions in database`);
    
    const sessionsWithFiles = sessions.documents.filter(session => {
      return files.files.some(file => file.name.startsWith(session.$id + '_'));
    });
    
    console.log(`   🎯 ${sessionsWithFiles.length} sessions have associated files`);
    
    if (sessionsWithFiles.length > 0) {
      console.log('   📋 Sessions with files:');
      sessionsWithFiles.slice(0, 3).forEach(session => {
        const fileCount = files.files.filter(f => f.name.startsWith(session.$id + '_')).length;
        console.log(`      - "${session.title}" (${fileCount} files)`);
      });
    }

    console.log('\n✅ File service test completed successfully!');
    console.log('\n💡 Summary:');
    console.log(`   • Total files: ${files.files.length}`);
    console.log(`   • Session-associated files: ${sessionFiles.length}`);
    console.log(`   • Sessions with files: ${sessionsWithFiles.length}`);
    
    if (sessionFiles.length === 0) {
      console.log('\n⚠️  No session-associated files found. This could mean:');
      console.log('   • No files have been uploaded yet');
      console.log('   • Files were uploaded without session ID prefix');
      console.log('   • File upload process needs debugging');
    }

  } catch (error) {
    console.error('❌ Error testing file service:', error);
    
    if (error.code === 404) {
      console.log('\n💡 This might mean:');
      console.log('   • Storage bucket doesn\'t exist');
      console.log('   • Wrong bucket ID in environment variables');
      console.log('   • API key doesn\'t have storage permissions');
    }
  }
}

// Run the test
testFileService().catch(console.error);
