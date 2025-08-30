#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases, Query } = createServerClient();

// Migration configuration
const BATCH_SIZE = 10; // Process students in batches
const DEFAULT_FOLDER_NAME = 'Existing Sessions';
const DEFAULT_FOLDER_DESCRIPTION = 'Migrated sessions from the previous system';

async function migrateSingleStudent(studentId, studentName, databaseId, collectionsIds) {
  try {
    console.log(`\n📋 Processing student: ${studentName} (${studentId})`);
    
    // Get all sessions for this student
    const sessionsResult = await databases.listDocuments(
      databaseId,
      collectionsIds.sessions,
      [
        Query.equal('studentId', studentId),
        Query.orderAsc('sessionNumber'),
        Query.limit(1000) // Increase limit for students with many sessions
      ]
    );

    const sessions = sessionsResult.documents;
    console.log(`  Found ${sessions.length} sessions`);

    if (sessions.length === 0) {
      console.log(`  ⚠️  No sessions found for ${studentName}, skipping...`);
      return { success: true, folderId: null, sessionCount: 0 };
    }

    // Check if student already has a session folder
    const existingFoldersResult = await databases.listDocuments(
      databaseId,
      collectionsIds.sessionFolders,
      [Query.equal('studentId', studentId)]
    );

    let folder;
    if (existingFoldersResult.documents.length > 0) {
      folder = existingFoldersResult.documents[0];
      console.log(`  📁 Using existing folder: ${folder.name} (${folder.$id})`);
    } else {
      // Create default folder for this student
      const now = new Date().toISOString();
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      
      console.log(`  📁 Creating default folder...`);
      folder = await databases.createDocument(
        databaseId,
        collectionsIds.sessionFolders,
        'unique()',
        {
          studentId: studentId,
          name: DEFAULT_FOLDER_NAME,
          description: DEFAULT_FOLDER_DESCRIPTION,
          isActive: true, // This will be the active folder
          totalSessions: sessions.length,
          completedSessions: completedSessions,
          startDate: sessions[0]?.date || now, // Use first session date or now
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
      );
      console.log(`  ✅ Created folder: ${folder.name} (${folder.$id})`);
    }

    // Update all sessions to include folderId
    let updatedCount = 0;
    let skippedCount = 0;

    for (const session of sessions) {
      try {
        // Check if session already has folderId
        if (session.folderId) {
          console.log(`    ⚠️  Session ${session.sessionNumber} already has folderId, skipping...`);
          skippedCount++;
          continue;
        }

        // Update session with folderId
        await databases.updateDocument(
          databaseId,
          collectionsIds.sessions,
          session.$id,
          { folderId: folder.$id }
        );
        
        updatedCount++;
        
        // Small delay to avoid rate limiting
        if (updatedCount % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`    ❌ Error updating session ${session.sessionNumber}:`, error.message);
        throw error;
      }
    }

    console.log(`  ✅ Updated ${updatedCount} sessions, skipped ${skippedCount}`);
    
    // Update folder statistics if needed
    if (updatedCount > 0) {
      const now = new Date().toISOString();
      await databases.updateDocument(
        databaseId,
        collectionsIds.sessionFolders,
        folder.$id,
        {
          totalSessions: sessions.length,
          completedSessions: sessions.filter(s => s.status === 'completed').length,
          updatedAt: now
        }
      );
      console.log(`  📊 Updated folder statistics`);
    }

    return {
      success: true,
      folderId: folder.$id,
      sessionCount: updatedCount,
      skippedCount: skippedCount
    };

  } catch (error) {
    console.error(`❌ Error migrating student ${studentName}:`, error);
    return {
      success: false,
      error: error.message,
      sessionCount: 0
    };
  }
}

async function migrateSessionsToFolders() {
  try {
    console.log('🚀 Starting migration of sessions to folders...\n');
    
    // Get configuration
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionFoldersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FOLDERS_COLLECTION_ID;
    const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;

    if (!databaseId || !sessionFoldersCollectionId || !studentsCollectionId || !sessionsCollectionId) {
      throw new Error('Missing required environment variables. Please ensure all collection IDs are set.');
    }

    const collectionsIds = {
      sessionFolders: sessionFoldersCollectionId,
      students: studentsCollectionId,
      sessions: sessionsCollectionId
    };

    console.log('📋 Configuration:');
    console.log(`  Database ID: ${databaseId}`);
    console.log(`  Session Folders Collection: ${sessionFoldersCollectionId}`);
    console.log(`  Students Collection: ${studentsCollectionId}`);
    console.log(`  Sessions Collection: ${sessionsCollectionId}`);

    // Get all students
    console.log('\n📚 Fetching all students...');
    const studentsResult = await databases.listDocuments(
      databaseId,
      studentsCollectionId,
      [Query.limit(1000)] // Adjust if you have more than 1000 students
    );

    const students = studentsResult.documents;
    console.log(`Found ${students.length} students to process`);

    if (students.length === 0) {
      console.log('⚠️  No students found, nothing to migrate');
      return;
    }

    // Process students in batches
    const results = {
      successful: 0,
      failed: 0,
      totalSessions: 0,
      skippedSessions: 0,
      errors: []
    };

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)} (${batch.length} students)`);

      for (const student of batch) {
        const result = await migrateSingleStudent(
          student.$id,
          student.name,
          databaseId,
          collectionsIds
        );

        if (result.success) {
          results.successful++;
          results.totalSessions += result.sessionCount;
          results.skippedSessions += result.skippedCount || 0;
        } else {
          results.failed++;
          results.errors.push({
            studentId: student.$id,
            studentName: student.name,
            error: result.error
          });
        }
      }

      // Pause between batches to avoid rate limiting
      if (i + BATCH_SIZE < students.length) {
        console.log('⏳ Pausing between batches...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Final summary
    console.log('\n🎉 Migration completed!');
    console.log('\n📊 Summary:');
    console.log(`✅ Successfully migrated: ${results.successful} students`);
    console.log(`❌ Failed migrations: ${results.failed} students`);
    console.log(`📋 Total sessions updated: ${results.totalSessions}`);
    console.log(`⚠️  Sessions skipped (already had folderId): ${results.skippedSessions}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => {
        console.log(`  - ${error.studentName} (${error.studentId}): ${error.error}`);
      });
    }

    // Validation check
    console.log('\n🔍 Running validation check...');
    await validateMigration(databaseId, collectionsIds);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function validateMigration(databaseId, collectionsIds) {
  try {
    // Count sessions without folderId
    const sessionsWithoutFolderResult = await databases.listDocuments(
      databaseId,
      collectionsIds.sessions,
      [
        Query.isNull('folderId'),
        Query.limit(1)
      ]
    );

    const sessionsWithoutFolder = sessionsWithoutFolderResult.total;
    
    // Count total sessions
    const totalSessionsResult = await databases.listDocuments(
      databaseId,
      collectionsIds.sessions,
      [Query.limit(1)]
    );
    const totalSessions = totalSessionsResult.total;

    // Count total folders
    const totalFoldersResult = await databases.listDocuments(
      databaseId,
      collectionsIds.sessionFolders,
      [Query.limit(1)]
    );
    const totalFolders = totalFoldersResult.total;

    console.log('📊 Validation Results:');
    console.log(`  Total sessions: ${totalSessions}`);
    console.log(`  Sessions without folderId: ${sessionsWithoutFolder}`);
    console.log(`  Total session folders: ${totalFolders}`);

    if (sessionsWithoutFolder === 0) {
      console.log('✅ All sessions have been assigned to folders!');
    } else {
      console.log(`⚠️  ${sessionsWithoutFolder} sessions still need migration`);
    }

    // Check for students with multiple active folders
    const activeFoldersResult = await databases.listDocuments(
      databaseId,
      collectionsIds.sessionFolders,
      [
        Query.equal('isActive', true),
        Query.limit(1000)
      ]
    );

    const activeFolders = activeFoldersResult.documents;
    const studentFolderCounts = {};
    
    activeFolders.forEach(folder => {
      studentFolderCounts[folder.studentId] = (studentFolderCounts[folder.studentId] || 0) + 1;
    });

    const studentsWithMultipleActiveFolders = Object.entries(studentFolderCounts)
      .filter(([_, count]) => count > 1);

    if (studentsWithMultipleActiveFolders.length > 0) {
      console.log(`⚠️  Found ${studentsWithMultipleActiveFolders.length} students with multiple active folders:`);
      studentsWithMultipleActiveFolders.forEach(([studentId, count]) => {
        console.log(`    - Student ${studentId}: ${count} active folders`);
      });
    } else {
      console.log('✅ Each student has exactly one active folder');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

// Utility function to fix students with multiple active folders
async function fixMultipleActiveFolders() {
  try {
    console.log('🔧 Fixing students with multiple active folders...');
    
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionFoldersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FOLDERS_COLLECTION_ID;

    // Get all active folders
    const activeFoldersResult = await databases.listDocuments(
      databaseId,
      sessionFoldersCollectionId,
      [
        Query.equal('isActive', true),
        Query.limit(1000)
      ]
    );

    const activeFolders = activeFoldersResult.documents;
    const studentFolders = {};

    // Group folders by student
    activeFolders.forEach(folder => {
      if (!studentFolders[folder.studentId]) {
        studentFolders[folder.studentId] = [];
      }
      studentFolders[folder.studentId].push(folder);
    });

    // Fix students with multiple active folders
    for (const [studentId, folders] of Object.entries(studentFolders)) {
      if (folders.length > 1) {
        console.log(`  Fixing student ${studentId} with ${folders.length} active folders`);
        
        // Keep the most recent folder active, deactivate others
        folders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        for (let i = 1; i < folders.length; i++) {
          await databases.updateDocument(
            databaseId,
            sessionFoldersCollectionId,
            folders[i].$id,
            { isActive: false }
          );
          console.log(`    Deactivated folder: ${folders[i].name}`);
        }
        
        console.log(`    Kept active folder: ${folders[0].name}`);
      }
    }

    console.log('✅ Fixed multiple active folders issue');

  } catch (error) {
    console.error('❌ Error fixing multiple active folders:', error);
  }
}

// Main execution
async function main() {
  try {
    await migrateSessionsToFolders();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  migrateSessionsToFolders,
  migrateSingleStudent,
  validateMigration,
  fixMultipleActiveFolders,
  main
};
