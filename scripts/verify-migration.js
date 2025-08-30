#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createServerClient } = require('../lib/appwrite.config');
const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

/**
 * Migration Verification Script
 * 
 * Verifies that files have been successfully migrated from Appwrite to R2
 * by comparing file counts, sizes, and checksums.
 */

async function verifyMigration() {
  console.log('🔍 Starting migration verification...\n');
  
  try {
    validateEnvironment();
    
    const { storage: appwriteStorage } = createServerClient();
    const r2Client = createR2Client();
    
    const appwriteBucket = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID;
    const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
    
    console.log(`🔍 Comparing Appwrite bucket ${appwriteBucket} with R2 bucket ${r2Bucket}\n`);

    // Get files from both sources
    const [appwriteFiles, r2Files] = await Promise.all([
      appwriteStorage.listFiles(appwriteBucket, [], 100),
      listAllR2Files(r2Client, r2Bucket)
    ]);

    console.log(`📊 Appwrite files: ${appwriteFiles.files.length}`);
    console.log(`📊 R2 files: ${r2Files.length}\n`);

    // Create verification report
    const verification = {
      timestamp: new Date().toISOString(),
      appwriteCount: appwriteFiles.files.length,
      r2Count: r2Files.length,
      verified: [],
      missing: [],
      errors: [],
      sizeMismatches: [],
      summary: {}
    };

    // Create R2 file lookup by expected key
    const r2FileMap = new Map();
    r2Files.forEach(file => {
      r2FileMap.set(file.Key, file);
    });

    // Sample files for checksum verification (verify 20% randomly)
    const sampleSize = Math.max(1, Math.floor(appwriteFiles.files.length * 0.2));
    const sampleIndices = [];
    while (sampleIndices.length < sampleSize) {
      const index = Math.floor(Math.random() * appwriteFiles.files.length);
      if (!sampleIndices.includes(index)) {
        sampleIndices.push(index);
      }
    }

    // Verify each Appwrite file exists in R2
    let verifiedCount = 0;
    let checksumVerifiedCount = 0;
    
    for (let i = 0; i < appwriteFiles.files.length; i++) {
      const file = appwriteFiles.files[i];
      const shouldVerifyChecksum = sampleIndices.includes(i);
      
      try {
        const result = await verifyFile(
          appwriteStorage, 
          r2Client, 
          file, 
          r2FileMap, 
          appwriteBucket, 
          r2Bucket,
          shouldVerifyChecksum
        );
        
        if (result.verified) {
          verification.verified.push(result);
          verifiedCount++;
          
          if (result.checksumVerified) {
            checksumVerifiedCount++;
          }
        } else {
          verification.missing.push(result);
        }
        
        if (result.sizeMismatch) {
          verification.sizeMismatches.push(result);
        }
        
        // Progress update
        if ((i + 1) % 20 === 0 || i === appwriteFiles.files.length - 1) {
          console.log(`🔍 Verified: ${i + 1}/${appwriteFiles.files.length} files`);
        }
        
      } catch (error) {
        verification.errors.push({
          fileId: file.$id,
          fileName: file.name,
          error: error.message
        });
        console.error(`❌ Error verifying ${file.name}:`, error.message);
      }
    }

    // Generate summary
    verification.summary = {
      totalFiles: appwriteFiles.files.length,
      verifiedFiles: verifiedCount,
      missingFiles: verification.missing.length,
      errorFiles: verification.errors.length,
      sizeMismatchFiles: verification.sizeMismatches.length,
      checksumSampleSize: sampleSize,
      checksumVerified: checksumVerifiedCount,
      verificationRate: Math.round((verifiedCount / appwriteFiles.files.length) * 100),
      checksumSuccessRate: sampleSize > 0 ? Math.round((checksumVerifiedCount / sampleSize) * 100) : 0
    };

    // Save verification report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(process.cwd(), `verification-report-${timestamp}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(verification, null, 2));

    // Display results
    console.log('\n📊 VERIFICATION RESULTS');
    console.log('========================');
    console.log(`✅ Verified files: ${verifiedCount}/${appwriteFiles.files.length} (${verification.summary.verificationRate}%)`);
    console.log(`❌ Missing files: ${verification.missing.length}`);
    console.log(`🔍 Checksum verified: ${checksumVerifiedCount}/${sampleSize} sample files (${verification.summary.checksumSuccessRate}%)`);
    console.log(`⚠️  Size mismatches: ${verification.sizeMismatches.length}`);
    console.log(`💥 Errors: ${verification.errors.length}`);
    console.log(`📄 Report saved: ${reportPath}`);

    if (verification.missing.length > 0) {
      console.log('\n❌ MISSING FILES IN R2:');
      verification.missing.forEach(missing => {
        console.log(`   ${missing.fileName} (${missing.expectedR2Key})`);
      });
    }

    if (verification.sizeMismatches.length > 0) {
      console.log('\n⚠️  SIZE MISMATCHES:');
      verification.sizeMismatches.forEach(mismatch => {
        console.log(`   ${mismatch.fileName}: Appwrite ${mismatch.appwriteSize} vs R2 ${mismatch.r2Size}`);
      });
    }

    if (verification.errors.length > 0) {
      console.log('\n💥 VERIFICATION ERRORS:');
      verification.errors.forEach(error => {
        console.log(`   ${error.fileName}: ${error.error}`);
      });
    }

    // Final assessment
    const isSuccess = verification.summary.verificationRate >= 95 && 
                     verification.summary.checksumSuccessRate >= 95 &&
                     verification.sizeMismatches.length === 0;
    
    if (isSuccess) {
      console.log('\n🎉 MIGRATION VERIFICATION SUCCESSFUL!');
      console.log('✅ Your migration is complete and verified.');
      console.log('\n📋 Next steps:');
      console.log('1. Enable R2 storage: USE_R2_STORAGE=true');
      console.log('2. Test file uploads and downloads');
      console.log('3. Monitor application for any issues');
      console.log('4. Plan cleanup of Appwrite files after testing period');
    } else {
      console.log('\n⚠️  MIGRATION VERIFICATION INCOMPLETE');
      console.log('❌ Some files are missing or have issues.');
      console.log('\n🔧 Recommended actions:');
      console.log('1. Re-run migration for missing files: npm run r2-migrate');
      console.log('2. Investigate size mismatches');
      console.log('3. Check R2 bucket configuration');
    }

    return verification;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function verifyFile(appwriteStorage, r2Client, file, r2FileMap, appwriteBucket, r2Bucket, verifyChecksum = false) {
  // Generate expected R2 key
  const sessionId = file.name.split('_')[0];
  const cleanFileName = file.name.replace(`${sessionId}_`, '');
  
  // Find R2 files that match this session and filename pattern
  const possibleKeys = [];
  for (const [key, r2File] of r2FileMap) {
    if (key.startsWith(`${sessionId}/`) && key.includes(cleanFileName)) {
      possibleKeys.push({ key, file: r2File });
    }
  }

  if (possibleKeys.length === 0) {
    return {
      fileId: file.$id,
      fileName: file.name,
      expectedR2Key: `${sessionId}/[fileId]_${cleanFileName}`,
      verified: false,
      reason: 'File not found in R2'
    };
  }

  // Use the first matching file (should only be one)
  const r2Match = possibleKeys[0];
  const sizeMismatch = file.sizeOriginal !== r2Match.file.Size;

  const result = {
    fileId: file.$id,
    fileName: file.name,
    r2Key: r2Match.key,
    verified: true,
    appwriteSize: file.sizeOriginal,
    r2Size: r2Match.file.Size,
    sizeMismatch: sizeMismatch,
    checksumVerified: false
  };

  // Checksum verification (for sample files)
  if (verifyChecksum && !sizeMismatch) {
    try {
      const [appwriteBuffer, r2Buffer] = await Promise.all([
        appwriteStorage.getFileDownload(appwriteBucket, file.$id),
        getR2File(r2Client, r2Bucket, r2Match.key)
      ]);

      const appwriteChecksum = crypto.createHash('md5').update(appwriteBuffer).digest('hex');
      const r2Checksum = crypto.createHash('md5').update(r2Buffer).digest('hex');
      
      result.checksumVerified = appwriteChecksum === r2Checksum;
      result.appwriteChecksum = appwriteChecksum;
      result.r2Checksum = r2Checksum;
    } catch (error) {
      result.checksumError = error.message;
    }
  }

  return result;
}

async function listAllR2Files(client, bucket) {
  const files = [];
  let continuationToken = undefined;
  
  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 1000,
      ContinuationToken: continuationToken
    });
    
    const response = await client.send(command);
    
    if (response.Contents) {
      files.push(...response.Contents);
    }
    
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);
  
  return files;
}

async function getR2File(client, bucket, key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key
  });
  
  const response = await client.send(command);
  return Buffer.from(await response.Body.transformToByteArray());
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

// Run if called directly
if (require.main === module) {
  verifyMigration().catch(console.error);
}

module.exports = { verifyMigration };
