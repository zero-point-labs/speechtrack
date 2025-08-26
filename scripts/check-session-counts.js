const { Client, Databases, Query } = require('node-appwrite');

// Initialize Appwrite client
const client = new Client();
const databases = new Databases(client);

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const studentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_STUDENTS_ID;
const sessionsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COLLECTION_SESSIONS_ID;

async function checkSessionCounts() {
  try {
    console.log('🔍 Checking session counts for all students...\n');

    // Get all students
    const studentsResponse = await databases.listDocuments(
      databaseId,
      studentsCollectionId,
      [Query.limit(100)]
    );

    console.log(`Found ${studentsResponse.documents.length} students:\n`);

    for (const student of studentsResponse.documents) {
      // Get sessions for this student
      const sessionsResponse = await databases.listDocuments(
        databaseId,
        sessionsCollectionId,
        [
          Query.equal('studentId', student.$id),
          Query.limit(100)
        ]
      );

      const actualSessions = sessionsResponse.documents.length;
      const plannedSessions = student.totalSessions || 0;
      const completedSessions = sessionsResponse.documents.filter(s => s.status === 'completed').length;

      console.log(`👤 ${student.name}:`);
      console.log(`   📊 Planned sessions: ${plannedSessions}`);
      console.log(`   💾 Actual sessions in DB: ${actualSessions}`);
      console.log(`   ✅ Completed sessions: ${completedSessions}`);
      console.log(`   📈 Status: ${student.status}`);
      
      if (actualSessions < plannedSessions) {
        console.log(`   ⚠️  Missing ${plannedSessions - actualSessions} sessions!`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error checking session counts:', error);
  }
}

checkSessionCounts();
