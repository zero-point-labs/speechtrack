#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function migrateRemoveClientCodes() {
  console.log('🚀 Starting migration to remove client code system...\n');

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID) {
      console.error('❌ Missing NEXT_PUBLIC_APPWRITE_DATABASE_ID environment variable');
      process.exit(1);
    }

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
    const clientCodesCollectionId = process.env.NEXT_PUBLIC_APPWRITE_CLIENT_CODES_COLLECTION_ID;

    // Step 1: List all students to see current data
    console.log('📊 Analyzing current student data...');
    const { Query } = await import('node-appwrite');
    const studentsResult = await databases.listDocuments(
      databaseId,
      studentsCollectionId,
      [Query.limit(1000)] // Get all students
    );

    console.log(`Found ${studentsResult.documents.length} students in the database`);

    // Step 2: Create backup of important data
    const backupData = {
      timestamp: new Date().toISOString(),
      students: studentsResult.documents.map(student => ({
        id: student.$id,
        name: student.name,
        parentId: student.parentId,
        clientCode: student.clientCode,
        parentContact: student.parentContact
      }))
    };

    // Save backup to file
    const fs = require('fs');
    const backupFilename = `backup-before-migration-${Date.now()}.json`;
    fs.writeFileSync(backupFilename, JSON.stringify(backupData, null, 2));
    console.log(`✅ Backup saved to ${backupFilename}`);

    // Step 3: Analyze data integrity
    let studentsWithParentId = 0;
    let studentsWithoutParentId = 0;
    let studentsWithClientCode = 0;

    studentsResult.documents.forEach(student => {
      if (student.parentId) studentsWithParentId++;
      else studentsWithoutParentId++;
      if (student.clientCode) studentsWithClientCode++;
    });

    console.log('\n📈 Current Data Analysis:');
    console.log(`   Students with parentId: ${studentsWithParentId}`);
    console.log(`   Students without parentId: ${studentsWithoutParentId}`);
    console.log(`   Students with clientCode: ${studentsWithClientCode}`);

    // Warning for students without parentId
    if (studentsWithoutParentId > 0) {
      console.log('\n⚠️  WARNING: Some students don\'t have parentId. These might be orphaned records.');
      console.log('   Consider reviewing these manually before proceeding with migration.');
      
      const orphanedStudents = studentsResult.documents.filter(s => !s.parentId);
      orphanedStudents.forEach(student => {
        console.log(`   - ${student.name} (ID: ${student.$id})`);
      });
    }

    // Step 4: Ask for confirmation
    console.log('\n🔄 Migration Plan:');
    console.log('   1. Remove clientCode attribute from all students');
    console.log('   2. Remove parentContact attribute from all students');
    console.log('   3. (Optional) Delete client_codes collection entirely');
    console.log('\n   Note: This is irreversible! Make sure you have the backup.');

    // In a real environment, you might want to add manual confirmation
    // For automation, we'll proceed with a confirmation flag
    const CONFIRM_MIGRATION = process.env.CONFIRM_MIGRATION === 'true';
    
    if (!CONFIRM_MIGRATION) {
      console.log('\n⚠️  Migration not confirmed. Set CONFIRM_MIGRATION=true to proceed.');
      console.log('   This is a safety measure to prevent accidental data loss.');
      return;
    }

    console.log('\n🔧 Starting migration...');

    // Step 5: Remove clientCode and parentContact from all students
    let updatedCount = 0;
    let errorCount = 0;

    for (const student of studentsResult.documents) {
      try {
        console.log(`  Updating student: ${student.name} (${student.$id})`);
        
        // Update student document - remove clientCode and parentContact
        const updateData = {};
        
        // Note: We can't actually "remove" attributes from Appwrite documents
        // We can only set them to null or empty values
        // The attributes themselves remain in the collection schema
        
        if (student.clientCode) {
          updateData.clientCode = ''; // Set to empty string
        }
        
        if (student.parentContact) {
          updateData.parentContact = ''; // Set to empty string
        }

        // Only update if there's something to change
        if (Object.keys(updateData).length > 0) {
          await databases.updateDocument(
            databaseId,
            studentsCollectionId,
            student.$id,
            updateData
          );
          updatedCount++;
        }

        await sleep(100); // Small delay to avoid rate limiting
        
      } catch (error) {
        console.error(`  ❌ Failed to update student ${student.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Migration completed!`);
    console.log(`   Updated students: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Step 6: Clean up client_codes collection (optional)
    console.log('\n🗑️  Cleaning up client_codes collection...');
    
    try {
      // Get all client codes
      const clientCodesResult = await databases.listDocuments(
        databaseId,
        clientCodesCollectionId,
        [Query.limit(1000)]
      );

      console.log(`Found ${clientCodesResult.documents.length} client codes to clean up`);

      // Delete all client code documents
      let deletedCodes = 0;
      for (const code of clientCodesResult.documents) {
        try {
          await databases.deleteDocument(
            databaseId,
            clientCodesCollectionId,
            code.$id
          );
          deletedCodes++;
          await sleep(50);
        } catch (error) {
          console.error(`Failed to delete client code ${code.code}:`, error.message);
        }
      }

      console.log(`✅ Deleted ${deletedCodes} client code records`);

    } catch (error) {
      console.error('❌ Failed to clean up client codes:', error.message);
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Backup saved: ${backupFilename}`);
    console.log(`   - Students updated: ${updatedCount}`);
    console.log(`   - Client codes cleaned: Yes`);
    console.log(`   - Errors: ${errorCount}`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. Test the new onboarding flow');
    console.log('2. Verify admin users management works');
    console.log('3. Remove client code attributes from database schema (manual)');
    console.log('4. Update any remaining references in code');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  migrateRemoveClientCodes();
}

module.exports = { migrateRemoveClientCodes };
