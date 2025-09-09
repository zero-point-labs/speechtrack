#!/usr/bin/env node

/**
 * Fix Active Folders Data Integrity
 * 
 * This script ensures that each student has only one active folder.
 * It will find students with multiple active folders and fix the data.
 */

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

// Database configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '68ab99977aad1233b50c';
const SESSION_FOLDERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SESSION_FOLDERS_ID || '68b09e82cf5b50519fd1';

async function fixActiveFolders() {
  try {
    console.log('🔍 Checking for students with multiple active folders...');

    // Get all session folders
    const foldersResponse = await databases.listDocuments(
      DATABASE_ID,
      SESSION_FOLDERS_COLLECTION_ID,
      []
    );

    const folders = foldersResponse.documents;
    console.log(`📁 Found ${folders.length} total folders`);

    // Group folders by studentId
    const foldersByStudent = {};
    folders.forEach(folder => {
      if (!foldersByStudent[folder.studentId]) {
        foldersByStudent[folder.studentId] = [];
      }
      foldersByStudent[folder.studentId].push(folder);
    });

    let studentsWithMultipleActive = 0;
    let foldersFixed = 0;

    // Check each student
    for (const [studentId, studentFolders] of Object.entries(foldersByStudent)) {
      const activeFolders = studentFolders.filter(folder => folder.isActive);
      
      if (activeFolders.length > 1) {
        studentsWithMultipleActive++;
        console.log(`⚠️ Student ${studentId} has ${activeFolders.length} active folders:`);
        activeFolders.forEach(folder => {
          console.log(`   - ${folder.name} (${folder.$id}) - Created: ${new Date(folder.createdAt).toLocaleDateString()}`);
        });

        // Keep the most recently created folder as active, deactivate others
        activeFolders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const keepActive = activeFolders[0];
        const toDeactivate = activeFolders.slice(1);

        console.log(`✅ Keeping "${keepActive.name}" as active`);
        
        // Deactivate other folders
        for (const folder of toDeactivate) {
          try {
            await databases.updateDocument(
              DATABASE_ID,
              SESSION_FOLDERS_COLLECTION_ID,
              folder.$id,
              {
                isActive: false,
                updatedAt: new Date().toISOString()
              }
            );
            console.log(`   ✅ Deactivated "${folder.name}"`);
            foldersFixed++;
          } catch (error) {
            console.error(`   ❌ Failed to deactivate "${folder.name}":`, error.message);
          }
        }
        
        console.log('');
      } else if (activeFolders.length === 1) {
        console.log(`✅ Student ${studentId} has correct single active folder: "${activeFolders[0].name}"`);
      } else {
        console.log(`⚠️ Student ${studentId} has no active folders`);
      }
    }

    console.log('📊 Summary:');
    console.log(`   - Students checked: ${Object.keys(foldersByStudent).length}`);
    console.log(`   - Students with multiple active folders: ${studentsWithMultipleActive}`);
    console.log(`   - Folders fixed: ${foldersFixed}`);
    
    if (studentsWithMultipleActive === 0) {
      console.log('🎉 All students have correct folder status!');
    } else {
      console.log('✅ Active folder conflicts resolved!');
    }

  } catch (error) {
    console.error('❌ Error fixing active folders:', error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixActiveFolders()
    .then(() => {
      console.log('Fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixActiveFolders };
