#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases, storage } = createServerClient();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fixMissingAttributes() {
  console.log('🔧 Fixing missing attributes...\n');
  
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  
  try {
    // Fix students collection - add status attribute
    console.log('📝 Adding status attribute to students collection...');
    try {
      await databases.createEnumAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        'status',
        ['active', 'inactive', 'completed'],
        true, // required
        null  // no default
      );
      console.log('✅ Status attribute added to students');
      await sleep(2000);
      
      // Create index for status
      await databases.createIndex(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        'status_idx',
        'key',
        ['status']
      );
      console.log('✅ Status index created for students');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠️  Status attribute already exists in students');
      } else {
        console.error('❌ Error adding status to students:', error.message);
      }
    }
    
    await sleep(1000);
    
    // Fix sessions collection - add status attribute
    console.log('📝 Adding status attribute to sessions collection...');
    try {
      await databases.createEnumAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID,
        'status',
        ['locked', 'available', 'completed', 'cancelled'],
        true, // required
        null  // no default
      );
      console.log('✅ Status attribute added to sessions');
      await sleep(2000);
      
      // Create index for status
      await databases.createIndex(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID,
        'status_idx',
        'key',
        ['status']
      );
      console.log('✅ Status index created for sessions');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠️  Status attribute already exists in sessions');
      } else {
        console.error('❌ Error adding status to sessions:', error.message);
      }
    }
    
    await sleep(1000);
    
    // Fix messages collection - add messageType attribute
    console.log('📝 Adding messageType attribute to messages collection...');
    try {
      await databases.createEnumAttribute(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
        'messageType',
        ['text', 'file'],
        true, // required
        null  // no default
      );
      console.log('✅ MessageType attribute added to messages');
    } catch (error) {
      if (error.code === 409) {
        console.log('⚠️  MessageType attribute already exists in messages');
      } else {
        console.error('❌ Error adding messageType to messages:', error.message);
      }
    }
    
    console.log('\n✅ Attribute fixes completed!');
    
  } catch (error) {
    console.error('❌ Error fixing attributes:', error.message);
    throw error;
  }
}

async function createRemainingBucket() {
  console.log('🪣 Creating storage bucket...\n');
  
  try {
    const bucket = await storage.createBucket(
      'unique()',
      'speechtrack-files',
      ['read("any")', 'write("any")'],
      false, // fileSecurity
      true,  // enabled
      50000000, // 50MB max
      ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp4', 'mp3', 'wav'],
      'gzip',
      true,  // encryption
      true   // antivirus
    );
    
    console.log(`✅ Storage bucket created: ${bucket.$id}`);
    return bucket.$id;
    
  } catch (error) {
    if (error.code === 409) {
      console.log('⚠️  Storage bucket already exists');
      const buckets = await storage.listBuckets();
      const existing = buckets.buckets.find(b => b.name === 'speechtrack-files');
      return existing ? existing.$id : null;
    } else if (error.code === 403) {
      console.log('⚠️  Storage bucket limit reached. Using existing bucket...');
      const buckets = await storage.listBuckets();
      if (buckets.buckets.length > 0) {
        console.log(`✅ Using existing bucket: ${buckets.buckets[0].$id}`);
        return buckets.buckets[0].$id;
      }
    }
    throw error;
  }
}

async function updateEnvFile(bucketId) {
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found.');
    return;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update bucket IDs
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=.*/, `NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=${bucketId}`);
  envContent = envContent.replace(/NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID=.*/, `NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID=${bucketId}`);
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with bucket ID');
}

async function main() {
  console.log('🔧 Fixing Appwrite setup issues...\n');
  
  try {
    // Fix missing attributes
    await fixMissingAttributes();
    
    // Create storage bucket
    const bucketId = await createRemainingBucket();
    
    if (bucketId) {
      await updateEnvFile(bucketId);
    }
    
    console.log('\n🎉 Setup fixes completed successfully!');
    console.log('\n🔧 Next step: Run node scripts/test-connection.js');
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
