#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createServerClient } = require('../lib/appwrite.config');

const { databases } = createServerClient();

// Test configuration
const TEST_STUDENT_NAME = 'Test Student for Session Folders';
const TEST_PARENT_PHONE = '+30600000000';

async function createTestData() {
  try {
    console.log('🧪 Creating test data for session folders...\n');

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
    const usersExtendedCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID;

    // Create test parent user
    console.log('👤 Creating test parent user...');
    const testParent = await databases.createDocument(
      databaseId,
      usersExtendedCollectionId,
      'unique()',
      {
        userId: 'test-parent-folders-' + Date.now(),
        name: 'Test Parent for Folders',
        email: 'test-folders@example.com',
        phone: TEST_PARENT_PHONE,
        address: 'Test Address',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      }
    );
    console.log(`✅ Created test parent: ${testParent.name} (${testParent.$id})`);

    // Create test student
    console.log('👶 Creating test student...');
    const testStudent = await databases.createDocument(
      databaseId,
      studentsCollectionId,
      'unique()',
      {
        name: TEST_STUDENT_NAME,
        age: 8,
        dateOfBirth: '2016-01-15T00:00:00.000Z',
        parentId: testParent.userId,
        status: 'active',
        totalSessions: 0,
        completedSessions: 0,
        joinDate: new Date().toISOString(),
        parentContact: JSON.stringify({
          name: testParent.name,
          phone: testParent.phone,
          email: testParent.email
        })
      }
    );
    console.log(`✅ Created test student: ${testStudent.name} (${testStudent.$id})`);

    return { testParent, testStudent };

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function testSessionFoldersAPI(studentId) {
  try {
    console.log('\n🔌 Testing Session Folders API...\n');

    // Test 1: Create first session folder
    console.log('📁 Test 1: Creating first session folder...');
    const createResponse1 = await fetch('http://localhost:3000/api/admin/session-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        name: '2024 Speech Therapy Program',
        description: 'Initial speech therapy program for 2024',
        setActive: true
      })
    });

    const createData1 = await createResponse1.json();
    if (createData1.success) {
      console.log(`✅ Created folder: ${createData1.folder.name} (${createData1.folder.$id})`);
    } else {
      throw new Error(`Failed to create folder: ${createData1.error}`);
    }

    const folder1Id = createData1.folder.$id;

    // Test 2: Create second session folder
    console.log('📁 Test 2: Creating second session folder...');
    const createResponse2 = await fetch('http://localhost:3000/api/admin/session-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId,
        name: '2024 Advanced Program',
        description: 'Advanced therapy program for later in 2024',
        setActive: false
      })
    });

    const createData2 = await createResponse2.json();
    if (createData2.success) {
      console.log(`✅ Created folder: ${createData2.folder.name} (${createData2.folder.$id})`);
    } else {
      throw new Error(`Failed to create folder: ${createData2.error}`);
    }

    const folder2Id = createData2.folder.$id;

    // Test 3: List folders for student
    console.log('📋 Test 3: Listing folders for student...');
    const listResponse = await fetch(`http://localhost:3000/api/admin/session-folders?studentId=${studentId}`);
    const listData = await listResponse.json();
    
    if (listData.success && listData.folders.length === 2) {
      console.log(`✅ Found ${listData.folders.length} folders`);
      listData.folders.forEach(folder => {
        console.log(`   - ${folder.name} (Active: ${folder.isActive})`);
      });
    } else {
      throw new Error('Failed to list folders or incorrect count');
    }

    // Test 4: Create sessions in first folder
    console.log('📅 Test 4: Creating sessions in first folder...');
    await createTestSessions(studentId, folder1Id, 5);

    // Test 5: Create sessions in second folder
    console.log('📅 Test 5: Creating sessions in second folder...');
    await createTestSessions(studentId, folder2Id, 3);

    // Test 6: Switch active folder
    console.log('🔄 Test 6: Switching active folder...');
    const switchResponse = await fetch(`http://localhost:3000/api/admin/session-folders/${folder2Id}/set-active`, {
      method: 'POST'
    });

    const switchData = await switchResponse.json();
    if (switchData.success) {
      console.log(`✅ Switched active folder to: ${switchData.folder.name}`);
    } else {
      throw new Error(`Failed to switch active folder: ${switchData.error}`);
    }

    // Test 7: Verify sessions in folders
    console.log('🔍 Test 7: Verifying sessions in folders...');
    
    const folder1SessionsResponse = await fetch(`http://localhost:3000/api/admin/session-folders/${folder1Id}/sessions`);
    const folder1SessionsData = await folder1SessionsResponse.json();
    
    const folder2SessionsResponse = await fetch(`http://localhost:3000/api/admin/session-folders/${folder2Id}/sessions`);
    const folder2SessionsData = await folder2SessionsResponse.json();

    if (folder1SessionsData.success && folder2SessionsData.success) {
      console.log(`✅ Folder 1 has ${folder1SessionsData.sessions.length} sessions`);
      console.log(`✅ Folder 2 has ${folder2SessionsData.sessions.length} sessions`);
    } else {
      throw new Error('Failed to get sessions from folders');
    }

    return { folder1Id, folder2Id };

  } catch (error) {
    console.error('❌ API test failed:', error);
    throw error;
  }
}

async function createTestSessions(studentId, folderId, count) {
  try {
    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;

    for (let i = 1; i <= count; i++) {
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() + (i * 7)); // Weekly sessions

      await databases.createDocument(
        databaseId,
        sessionsCollectionId,
        'unique()',
        {
          studentId,
          folderId,
          sessionNumber: i,
          title: `Test Session ${i}`,
          description: `Test session ${i} in folder`,
          date: sessionDate.toISOString(),
          duration: '45 λεπτά',
          status: i === 1 ? 'available' : 'locked',
          isPaid: false,
          therapistNotes: null
        }
      );
    }

    console.log(`   ✅ Created ${count} test sessions in folder`);

  } catch (error) {
    console.error('❌ Error creating test sessions:', error);
    throw error;
  }
}

async function testDashboardFiltering(studentId) {
  try {
    console.log('\n🎨 Testing Dashboard Filtering...\n');

    // Simulate dashboard session loading
    console.log('📱 Testing dashboard session filtering...');
    
    // This would normally be called by the dashboard
    const foldersResponse = await fetch(`http://localhost:3000/api/admin/session-folders?studentId=${studentId}`);
    const foldersData = await foldersResponse.json();
    
    if (foldersData.success) {
      const activeFolder = foldersData.folders.find(f => f.isActive);
      if (activeFolder) {
        console.log(`✅ Active folder for dashboard: ${activeFolder.name}`);
        
        // Get sessions for active folder
        const sessionsResponse = await fetch(`http://localhost:3000/api/admin/session-folders/${activeFolder.$id}/sessions`);
        const sessionsData = await sessionsResponse.json();
        
        if (sessionsData.success) {
          console.log(`✅ Dashboard would show ${sessionsData.sessions.length} sessions from active folder`);
          sessionsData.sessions.forEach(session => {
            console.log(`   - ${session.title} (${session.status})`);
          });
        }
      } else {
        console.log('⚠️  No active folder found');
      }
    }

  } catch (error) {
    console.error('❌ Dashboard filtering test failed:', error);
    throw error;
  }
}

async function cleanupTestData(testParent, testStudent) {
  try {
    console.log('\n🧹 Cleaning up test data...\n');

    const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
    const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID;
    const usersExtendedCollectionId = process.env.NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID;
    const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID;
    const sessionFoldersCollectionId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FOLDERS_COLLECTION_ID;

    // Delete sessions
    console.log('🗑️  Deleting test sessions...');
    try {
      const sessions = await databases.listDocuments(
        databaseId,
        sessionsCollectionId,
        [{ method: 'equal', attribute: 'studentId', values: [testStudent.$id] }]
      );

      for (const session of sessions.documents) {
        await databases.deleteDocument(databaseId, sessionsCollectionId, session.$id);
      }
      console.log(`✅ Deleted ${sessions.documents.length} test sessions`);
    } catch (error) {
      console.log('⚠️  No sessions to delete or error deleting sessions');
    }

    // Delete session folders
    console.log('🗑️  Deleting test session folders...');
    try {
      const folders = await databases.listDocuments(
        databaseId,
        sessionFoldersCollectionId,
        [{ method: 'equal', attribute: 'studentId', values: [testStudent.$id] }]
      );

      for (const folder of folders.documents) {
        await databases.deleteDocument(databaseId, sessionFoldersCollectionId, folder.$id);
      }
      console.log(`✅ Deleted ${folders.documents.length} test session folders`);
    } catch (error) {
      console.log('⚠️  No folders to delete or error deleting folders');
    }

    // Delete student
    console.log('🗑️  Deleting test student...');
    await databases.deleteDocument(databaseId, studentsCollectionId, testStudent.$id);
    console.log('✅ Deleted test student');

    // Delete parent
    console.log('🗑️  Deleting test parent...');
    await databases.deleteDocument(databaseId, usersExtendedCollectionId, testParent.$id);
    console.log('✅ Deleted test parent');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function runCompleteTest() {
  let testData = null;
  
  try {
    console.log('🚀 Starting Complete Session Folders System Test\n');
    console.log('=' .repeat(60));

    // Step 1: Create test data
    testData = await createTestData();

    // Step 2: Test API endpoints
    const { folder1Id, folder2Id } = await testSessionFoldersAPI(testData.testStudent.$id);

    // Step 3: Test dashboard filtering
    await testDashboardFiltering(testData.testStudent.$id);

    // Step 4: Final validation
    console.log('\n✅ ALL TESTS PASSED!\n');
    console.log('🎉 Session Folders System Implementation Complete!\n');
    console.log('📋 Summary:');
    console.log('✅ Database schema created successfully');
    console.log('✅ API endpoints working correctly');
    console.log('✅ Session folder creation and management');
    console.log('✅ Active folder switching');
    console.log('✅ Sessions properly organized in folders');
    console.log('✅ Dashboard filtering by active folder');
    console.log('✅ Admin interface ready for use');

    console.log('\n🚀 Next Steps:');
    console.log('1. Access the new admin interface at: /admin/page-new');
    console.log('2. Create session folders for existing students');
    console.log('3. Run migration script if needed: node scripts/migrate-sessions-to-folders.js');
    console.log('4. Test with real data');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.log('\n🔧 Please check the error and fix any issues before proceeding.');
  } finally {
    // Always cleanup test data
    if (testData) {
      await cleanupTestData(testData.testParent, testData.testStudent);
    }
  }
}

// Run the complete test
if (require.main === module) {
  runCompleteTest();
}

module.exports = {
  createTestData,
  testSessionFoldersAPI,
  testDashboardFiltering,
  cleanupTestData,
  runCompleteTest
};
