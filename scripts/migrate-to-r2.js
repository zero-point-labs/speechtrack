#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createServerClient } = require('../lib/appwrite.config');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

/**
 * Phase 3: File Migration Script
 * 
 * Migrates files from Appwrite Storage to Cloudflare R2
 * with progress tracking, error handling, and verification.
 */

async function migrateToR2() {
  console.log('🚀 Starting migration from Appwrite to Cloudflare R2...\n');
  
  const startTime = Date.now();
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    // Validate environment
    validateEnvironment();
    
    // Initialize clients
    const { storage: appwriteStorage } = createServerClient();
    const r2Client = createR2Client();
    
    const appwriteBucket = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    
    console.log(`📤 Source: Appwrite bucket ${appwriteBucket}`);
    console.log(`📥 Target: R2 bucket ${r2Bucket}\n`);

    // Get files to migrate
    const files = await appwriteStorage.listFiles(appwriteBucket, [], 100);
    const totalFiles = files.files.length;
    
    if (totalFiles === 0) {
      console.log('✅ No files to migrate!');
      return;
    }
    
    console.log(`📊 Found ${totalFiles} files to migrate\n`);

    // Initialize migration log
    const migrationLog = {
      timestamp: new Date().toISOString(),
      totalFiles,
      successful: [],
      failed: [],
      skipped: [],
      summary: {}
    };

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // Check which files already exist in R2 (resume capability)
    const existingFiles = await listR2Files(r2Client, r2Bucket);
    const existingKeys = new Set(existingFiles.map(f => f.Key));
    
    // Process files in batches
    const batchSize = 3; // Conservative to avoid rate limiting
    for (let i = 0; i < files.files.length; i += batchSize) {
      const batch = files.files.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file, batchIndex) => {
        const globalIndex = i + batchIndex + 1;
        
        try {
          const result = await migrateFile(
            appwriteStorage, 
            r2Client, 
            file, 
            appwriteBucket, 
            r2Bucket,
            existingKeys
          );
          
          if (result.skipped) {
            migrationLog.skipped.push(result);
            skippedCount++;
          } else {
            migrationLog.successful.push(result);
            successCount++;
          }
          
          // Progress update
          if (globalIndex % 5 === 0 || globalIndex === totalFiles) {
            const percent = Math.round((globalIndex / totalFiles) * 100);
            console.log(`🔄 Progress: ${globalIndex}/${totalFiles} (${percent}%) - Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);
          }
          
        } catch (error) {
          const errorInfo = {
            fileId: file.$id,
            fileName: file.name,
            error: error.message,
            timestamp: new Date().toISOString()
          };
          migrationLog.failed.push(errorInfo);
          errorCount++;
          console.error(`❌ Error migrating ${file.name}:`, error.message);
        }
      }));
    }

    // Generate final summary
    const duration = Math.round((Date.now() - startTime) / 1000);
    migrationLog.summary = {
      duration,
      successCount,
      errorCount,
      skippedCount,
      successRate: Math.round((successCount / totalFiles) * 100),
      totalSizeMigrated: migrationLog.successful.reduce((sum, f) => sum + f.size, 0)
    };

    // Save migration log
    const logPath = path.join(process.cwd(), `migration-log-${timestamp}.json`);
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));

    // Display results
    console.log('\n🎉 MIGRATION COMPLETED!');
    console.log('=====================');
    console.log(`✅ Successfully migrated: ${successCount}/${totalFiles} files`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Success rate: ${migrationLog.summary.successRate}%`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📄 Log file: ${logPath}`);

    if (errorCount > 0) {
      console.log('\n⚠️  FILES WITH ERRORS:');
      migrationLog.failed.forEach(error => {
        console.log(`   ${error.fileName}: ${error.error}`);
      });
      console.log('\n🔄 You can re-run this script to retry failed files');
    }

    if (successCount === totalFiles - skippedCount && errorCount === 0) {
      console.log('\n✨ MIGRATION COMPLETE! Next steps:');
      console.log('1. Run verification script: npm run r2-verify');
      console.log('2. Update database URLs if needed');
      console.log('3. Enable R2 storage: USE_R2_STORAGE=true');
      console.log('4. Test file access in the application');
    }

    return migrationLog;

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function migrateFile(appwriteStorage, r2Client, file, appwriteBucket, r2Bucket, existingKeys) {
  // Generate R2 key: sessionId/fileId_filename
  const sessionId = file.name.split('_')[0];
  const fileId = generateFileId();
  const cleanFileName = file.name.replace(`${sessionId}_`, '');
  const r2Key = `${sessionId}/${fileId}_${cleanFileName}`;

  // Check if file already exists in R2
  if (existingKeys.has(r2Key)) {
    return {
      fileId: file.$id,
      fileName: file.name,
      r2Key: r2Key,
      skipped: true,
      reason: 'File already exists in R2'
    };
  }

  // Download file from Appwrite
  const fileBuffer = await appwriteStorage.getFileDownload(appwriteBucket, file.$id);
  
  // Upload to R2
  const uploadCommand = new PutObjectCommand({
    Bucket: r2Bucket,
    Key: r2Key,
    Body: fileBuffer,
    ContentType: file.mimeType,
    ContentLength: file.sizeOriginal,
    Metadata: {
      'original-name': cleanFileName,
      'session-id': sessionId,
      'appwrite-id': file.$id,
      'migrated-at': new Date().toISOString(),
    }
  });

  await r2Client.send(uploadCommand);

  return {
    fileId: file.$id,
    fileName: file.name,
    r2Key: r2Key,
    size: file.sizeOriginal,
    mimeType: file.mimeType,
    sessionId: sessionId,
    migratedAt: new Date().toISOString(),
    skipped: false
  };
}

async function listR2Files(client, bucket) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1000 // Adjust as needed
    });
    
    const response = await client.send(command);
    return response.Contents || [];
  } catch (error) {
    console.warn('Warning: Could not list existing R2 files:', error.message);
    return [];
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

function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID',
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_BUCKET_NAME'
  ];

  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }
}

function generateFileId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Run if called directly
if (require.main === module) {
  migrateToR2().catch(console.error);
}

module.exports = { migrateToR2 };
