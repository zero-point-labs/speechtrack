#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { S3Client, ListBucketsCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

/**
 * Cloudflare R2 Setup and Testing Script
 * 
 * This script helps set up and test your Cloudflare R2 configuration
 * before starting the migration process.
 */

async function setupR2() {
  console.log('🚀 Cloudflare R2 Setup and Testing\n');
  
  try {
    // Check environment variables
    console.log('1️⃣ Checking R2 Configuration...');
    const config = checkR2Config();
    
    if (!config.isComplete) {
      console.log('\n❌ R2 Configuration incomplete!');
      console.log('Missing environment variables:', config.missing.join(', '));
      console.log('\n📋 Required environment variables:');
      console.log('CLOUDFLARE_R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com');
      console.log('CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key-id');
      console.log('CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-access-key');
      console.log('CLOUDFLARE_R2_BUCKET_NAME=speechtrack-session-files');
      console.log('\n🔧 Please update your .env.local file and run this script again.');
      return;
    }
    
    console.log('✅ All R2 environment variables found\n');
    
    // Test R2 connection
    console.log('2️⃣ Testing R2 Connection...');
    const client = createR2Client();
    
    try {
      // Skip ListBuckets (requires admin permissions) and test direct bucket access
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await client.send(headCommand);
      console.log('✅ Successfully connected to Cloudflare R2');
      console.log(`✅ Can access bucket: ${bucketName}\n`);
    } catch (error) {
      console.log('❌ Failed to connect to R2:', error.message);
      console.log('\n🔧 Please check your R2 credentials and endpoint URL');
      return;
    }
    
    // Bucket access already tested above in step 2
    
    // Check current storage status
    console.log('3️⃣ Checking Current Storage Status...');
    const currentStorage = getCurrentStorageStatus();
    console.log(`Current storage: ${currentStorage.primary}`);
    console.log(`Mixed mode: ${currentStorage.mixedMode ? 'enabled' : 'disabled'}`);
    
    if (currentStorage.primary === 'r2') {
      console.log('✅ Already using R2 as primary storage');
    } else {
      console.log('📝 Currently using Appwrite as primary storage');
    }
    
    console.log('\n4️⃣ Migration Readiness Check...');
    
    // Check if backup exists
    const backupsExist = checkBackupsExist();
    console.log(`Backups available: ${backupsExist ? '✅ Yes' : '❌ No'}`);
    
    // Check dependencies
    const depsInstalled = checkDependencies();
    console.log(`AWS SDK installed: ${depsInstalled ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n🎉 R2 SETUP COMPLETE!');
    console.log('==================');
    
    if (backupsExist && depsInstalled) {
      console.log('✅ Your system is ready for migration!');
      console.log('\n📋 Next steps:');
      console.log('1. Run inventory: npm run r2-inventory');
      console.log('2. Create backup: npm run r2-backup');
      console.log('3. Start migration: npm run r2-migrate');
      console.log('4. Verify migration: npm run r2-verify');
      console.log('5. Enable R2: Set USE_R2_STORAGE=true in .env.local');
    } else {
      console.log('⚠️  Setup needed before migration:');
      if (!backupsExist) {
        console.log('   - Create backups: npm run r2-backup');
      }
      if (!depsInstalled) {
        console.log('   - Install dependencies: npm install');
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

function checkR2Config() {
  const required = [
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME'
  ];
  
  const missing = required.filter(env => !process.env[env]);
  
  return {
    isComplete: missing.length === 0,
    missing: missing,
    present: required.filter(env => process.env[env])
  };
}

function getCurrentStorageStatus() {
  return {
    primary: process.env.USE_R2_STORAGE === 'true' ? 'r2' : 'appwrite',
    mixedMode: process.env.ENABLE_MIXED_STORAGE_MODE === 'true'
  };
}

function checkBackupsExist() {
  const backupsDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupsDir)) return false;
  
  const files = fs.readdirSync(backupsDir);
  return files.some(file => file.includes('appwrite-backup'));
}

function checkDependencies() {
  try {
    require('@aws-sdk/client-s3');
    require('@aws-sdk/s3-request-presigner');
    return true;
  } catch {
    return false;
  }
}

function createR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
}

// Run if called directly
if (require.main === module) {
  setupR2().catch(console.error);
}

module.exports = { setupR2 };
