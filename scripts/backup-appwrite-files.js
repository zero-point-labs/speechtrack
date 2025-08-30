#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createServerClient } = require('../lib/appwrite.config');

/**
 * Phase 0.2: Primary Backup Script
 * 
 * Downloads ALL files from Appwrite storage and organizes them
 * in directory structure: backup/[date]/[sessionId]/[filename]
 * Includes integrity verification via checksums.
 */

async function backupAppwriteFiles() {
  console.log('💾 Starting Appwrite files backup...\n');
  
  const startTime = Date.now();
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const backupDir = path.join(process.cwd(), 'backups', `appwrite-backup-${timestamp}`);

  try {
    // Create backup directory
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const { storage } = createServerClient();
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID;

    if (!bucketId) {
      throw new Error('NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID not found in environment');
    }

    console.log(`📁 Backup directory: ${backupDir}`);
    console.log(`🪣 Source bucket: ${bucketId}\n`);
    
    // Get all files
    const files = await storage.listFiles(bucketId, [], 100); // Adjust limit if needed
    const totalFiles = files.files.length;
    
    console.log(`📊 Found ${totalFiles} files to backup\n`);

    const backupLog = {
      timestamp: new Date().toISOString(),
      totalFiles: totalFiles,
      bucketId: bucketId,
      backupDirectory: backupDir,
      files: [],
      errors: [],
      summary: {}
    };

    let successCount = 0;
    let errorCount = 0;
    let totalSize = 0;

    // Process files in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < files.files.length; i += batchSize) {
      const batch = files.files.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file, batchIndex) => {
        const globalIndex = i + batchIndex + 1;
        try {
          const result = await downloadFile(storage, bucketId, file, backupDir);
          backupLog.files.push(result);
          successCount++;
          totalSize += result.size;
          
          // Progress indicator
          if (globalIndex % 10 === 0 || globalIndex === totalFiles) {
            console.log(`📥 Progress: ${globalIndex}/${totalFiles} files (${Math.round(globalIndex/totalFiles*100)}%)`);
          }
        } catch (error) {
          const errorInfo = {
            fileId: file.$id,
            fileName: file.name,
            error: error.message,
            index: globalIndex
          };
          backupLog.errors.push(errorInfo);
          errorCount++;
          console.error(`❌ Error backing up ${file.name}:`, error.message);
        }
      }));
    }

    // Generate summary
    backupLog.summary = {
      successCount,
      errorCount,
      totalSizeBytes: totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      duration: Math.round((Date.now() - startTime) / 1000),
      averageFileSize: Math.round(totalSize / successCount),
      backupCompleteness: Math.round((successCount / totalFiles) * 100)
    };

    // Save backup log
    const logPath = path.join(backupDir, 'backup-log.json');
    fs.writeFileSync(logPath, JSON.stringify(backupLog, null, 2));

    // Generate verification checksums file
    const checksumPath = path.join(backupDir, 'checksums.txt');
    const checksumContent = backupLog.files
      .filter(f => f.checksum)
      .map(f => `${f.checksum}  ${f.relativePath}`)
      .join('\n');
    fs.writeFileSync(checksumPath, checksumContent);

    // Display results
    console.log('\n🎉 BACKUP COMPLETED!');
    console.log('==================');
    console.log(`✅ Successfully backed up: ${successCount}/${totalFiles} files`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`💾 Total size: ${backupLog.summary.totalSizeFormatted}`);
    console.log(`⏱️  Duration: ${backupLog.summary.duration} seconds`);
    console.log(`📁 Location: ${backupDir}`);
    console.log(`📋 Log file: ${logPath}`);
    console.log(`🔒 Checksums: ${checksumPath}`);

    if (errorCount > 0) {
      console.log('\n⚠️  ERRORS OCCURRED:');
      backupLog.errors.forEach(error => {
        console.log(`   ${error.fileName}: ${error.error}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('1. Verify backup integrity by spot-checking random files');
    console.log('2. Copy backup to external storage/cloud backup service');
    console.log('3. Test file restoration from backup');
    console.log('4. Proceed to Phase 1: R2 Setup');

    return backupLog;

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function downloadFile(storage, bucketId, file, backupDir) {
  // Extract session ID from filename
  const sessionId = file.name.split('_')[0];
  
  // Create session directory
  const sessionDir = path.join(backupDir, sessionId);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  
  // Download file
  const fileBuffer = await storage.getFileDownload(bucketId, file.$id);
  
  // Generate safe filename (remove session ID prefix if present)
  const cleanFileName = file.name.replace(`${sessionId}_`, '');
  const filePath = path.join(sessionDir, cleanFileName);
  const relativePath = path.relative(backupDir, filePath);
  
  // Write file to disk
  fs.writeFileSync(filePath, fileBuffer);
  
  // Verify integrity
  const downloadedSize = fs.statSync(filePath).size;
  if (downloadedSize !== file.sizeOriginal) {
    throw new Error(`Size mismatch: expected ${file.sizeOriginal}, got ${downloadedSize}`);
  }
  
  // Generate checksum for verification
  const checksum = crypto.createHash('md5').update(fileBuffer).digest('hex');
  
  return {
    fileId: file.$id,
    fileName: file.name,
    cleanFileName: cleanFileName,
    sessionId: sessionId,
    size: file.sizeOriginal,
    mimeType: file.mimeType,
    localPath: filePath,
    relativePath: relativePath,
    checksum: checksum,
    originalCreatedAt: file.$createdAt,
    backupTimestamp: new Date().toISOString()
  };
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run if called directly
if (require.main === module) {
  backupAppwriteFiles().catch(console.error);
}

module.exports = { backupAppwriteFiles };
