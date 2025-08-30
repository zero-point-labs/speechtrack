#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createServerClient } = require('../lib/appwrite.config');

/**
 * Phase 0.1: Create File Inventory Script
 * 
 * This script inventories all files in Appwrite storage and creates
 * a CSV report for migration planning and verification.
 */

async function inventoryFiles() {
  console.log('📋 Starting file inventory analysis...\n');

  try {
    const { storage } = createServerClient();
    const bucketId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID;

    if (!bucketId) {
      throw new Error('NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID not found in environment');
    }

    console.log(`🔍 Scanning bucket: ${bucketId}`);
    
    // Get all files from Appwrite storage
    const files = await storage.listFiles(bucketId, [], 100); // Adjust limit if needed
    
    console.log(`📊 Found ${files.files.length} files total`);

    // Prepare inventory data
    const inventory = [];
    let totalSize = 0;
    const fileTypes = {};
    const sessionCounts = {};

    for (const file of files.files) {
      totalSize += file.sizeOriginal;
      
      // Extract session ID from filename (format: sessionId_filename)
      const sessionId = file.name.split('_')[0];
      sessionCounts[sessionId] = (sessionCounts[sessionId] || 0) + 1;
      
      // Count file types
      const fileType = file.mimeType || 'unknown';
      fileTypes[fileType] = (fileTypes[fileType] || 0) + 1;

      inventory.push({
        fileId: file.$id,
        fileName: file.name,
        mimeType: file.mimeType,
        size: file.sizeOriginal,
        sizeFormatted: formatFileSize(file.sizeOriginal),
        sessionId: sessionId,
        createdAt: file.$createdAt,
        updatedAt: file.$updatedAt,
        bucketId: file.bucketId,
        permissions: JSON.stringify(file.$permissions || [])
      });
    }

    // Sort by creation date (oldest first)
    inventory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Generate CSV content
    const csvHeader = 'FileID,FileName,MimeType,Size,SizeFormatted,SessionID,CreatedAt,UpdatedAt,BucketID,Permissions\n';
    const csvRows = inventory.map(item => 
      `"${item.fileId}","${item.fileName}","${item.mimeType}",${item.size},"${item.sizeFormatted}","${item.sessionId}","${item.createdAt}","${item.updatedAt}","${item.bucketId}","${item.permissions}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    // Save inventory to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const inventoryPath = path.join(process.cwd(), `file-inventory-${timestamp}.csv`);
    
    fs.writeFileSync(inventoryPath, csvContent);

    // Generate summary report
    const summary = {
      totalFiles: files.files.length,
      totalSizeBytes: totalSize,
      totalSizeFormatted: formatFileSize(totalSize),
      uniqueSessions: Object.keys(sessionCounts).length,
      fileTypes: fileTypes,
      topSessions: Object.entries(sessionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([sessionId, count]) => ({ sessionId, fileCount: count })),
      oldestFile: inventory[0]?.createdAt,
      newestFile: inventory[inventory.length - 1]?.createdAt,
      averageFileSize: Math.round(totalSize / files.files.length),
      inventoryFile: inventoryPath
    };

    // Save summary as JSON
    const summaryPath = path.join(process.cwd(), `file-inventory-summary-${timestamp}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Display results
    console.log('\n📊 INVENTORY SUMMARY');
    console.log('===================');
    console.log(`📁 Total Files: ${summary.totalFiles}`);
    console.log(`💾 Total Size: ${summary.totalSizeFormatted} (${summary.totalSizeBytes} bytes)`);
    console.log(`🎯 Unique Sessions: ${summary.uniqueSessions}`);
    console.log(`📊 Average File Size: ${formatFileSize(summary.averageFileSize)}`);
    console.log(`📅 Date Range: ${new Date(summary.oldestFile).toLocaleDateString()} to ${new Date(summary.newestFile).toLocaleDateString()}`);

    console.log('\n🗂️ FILE TYPES:');
    Object.entries(summary.fileTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} files`);
    });

    console.log('\n🔥 TOP SESSIONS (by file count):');
    summary.topSessions.forEach((session, index) => {
      console.log(`   ${index + 1}. ${session.sessionId}: ${session.fileCount} files`);
    });

    console.log('\n📋 FILES CREATED:');
    console.log(`📄 Detailed inventory: ${inventoryPath}`);
    console.log(`📊 Summary report: ${summaryPath}`);

    console.log('\n✅ File inventory completed successfully!');
    console.log('\n📋 MIGRATION PLANNING NOTES:');
    console.log('1. Review file types - ensure R2 supports all MIME types');
    console.log('2. Plan batch sizes based on total file count');
    console.log('3. Prioritize recent sessions for Phase 3B migration');
    console.log('4. Use this inventory to verify migration completeness');

    return summary;

  } catch (error) {
    console.error('❌ Error during inventory:', error);
    throw error;
  }
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
  inventoryFiles().catch(console.error);
}

module.exports = { inventoryFiles };
