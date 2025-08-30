// API route for CASCADE deletion of users and all their data
import { NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/appwrite.config';

export async function DELETE(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Use server-side Appwrite client (has admin access)
    const { databases, storage, users } = createServerClient();
    const { Query } = await import('node-appwrite');

    console.log(`Starting CASCADE deletion for user: ${userId}`);

    // Step 1: Get all children (students) for this parent
    const studentsResult = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
      [Query.equal('parentId', userId)]
    );

    const studentIds = studentsResult.documents.map(student => student.$id);
    console.log(`Found ${studentIds.length} children to delete`);

    // Step 2: Get all sessions for these students
    let sessionIds = [];
    if (studentIds.length > 0) {
      const sessionsResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID,
        [Query.equal('studentId', studentIds)]
      );
      sessionIds = sessionsResult.documents.map(session => session.$id);
      console.log(`Found ${sessionIds.length} sessions to delete`);
    }

    // Step 3: Get all session files for these sessions
    let sessionFileIds = [];
    if (sessionIds.length > 0) {
      const sessionFilesResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_COLLECTION_ID,
        [Query.equal('sessionId', sessionIds)]
      );
      sessionFileIds = sessionFilesResult.documents.map(file => file.$id);
      console.log(`Found ${sessionFileIds.length} session files to delete`);

      // Delete actual files from storage
      for (const fileDoc of sessionFilesResult.documents) {
        try {
          await storage.deleteFile(
            process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID,
            fileDoc.fileId
          );
          console.log(`Deleted storage file: ${fileDoc.fileId}`);
        } catch (error) {
          console.error(`Failed to delete storage file ${fileDoc.fileId}:`, error.message);
          // Continue with other deletions even if file deletion fails
        }
      }
    }

    // Step 4: Delete session feedback
    if (sessionIds.length > 0) {
      const sessionFeedbackResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SESSION_FEEDBACK_COLLECTION_ID,
        [Query.equal('sessionId', sessionIds)]
      );

      for (const feedback of sessionFeedbackResult.documents) {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_SESSION_FEEDBACK_COLLECTION_ID,
          feedback.$id
        );
      }
      console.log(`Deleted ${sessionFeedbackResult.documents.length} session feedback records`);
    }

    // Step 5: Messages functionality disabled - collection was removed
    console.log('Skipping messages deletion - collection was removed');

    // Step 6: Delete achievements for these students
    let achievementsResult = { documents: [] };
    if (studentIds.length > 0) {
      achievementsResult = await databases.listDocuments(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID,
        [Query.equal('studentId', studentIds)]
      );

      for (const achievement of achievementsResult.documents) {
        await databases.deleteDocument(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
          process.env.NEXT_PUBLIC_APPWRITE_ACHIEVEMENTS_COLLECTION_ID,
          achievement.$id
        );
      }
      console.log(`Deleted ${achievementsResult.documents.length} achievements`);
    } else {
      console.log(`Deleted 0 achievements`);
    }

    // Step 7: Delete session files records
    for (const fileId of sessionFileIds) {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_COLLECTION_ID,
        fileId
      );
    }
    console.log(`Deleted ${sessionFileIds.length} session file records`);

    // Step 8: Delete sessions
    for (const sessionId of sessionIds) {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_SESSIONS_COLLECTION_ID,
        sessionId
      );
    }
    console.log(`Deleted ${sessionIds.length} sessions`);

    // Step 9: Delete students (children)
    for (const studentId of studentIds) {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_STUDENTS_COLLECTION_ID,
        studentId
      );
    }
    console.log(`Deleted ${studentIds.length} students`);

    // Step 10: Delete user extended data
    const userExtendedResult = await databases.listDocuments(
      process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
      process.env.NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );

    for (const extendedData of userExtendedResult.documents) {
      await databases.deleteDocument(
        process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_EXTENDED_COLLECTION_ID,
        extendedData.$id
      );
    }
    console.log(`Deleted ${userExtendedResult.documents.length} user extended records`);

    // Step 11: Delete user account from Appwrite Auth
    try {
      await users.delete(userId);
      console.log(`Deleted user account: ${userId}`);
    } catch (error) {
      console.error(`Failed to delete user account ${userId}:`, error.message);
      // Note: This might fail if the user doesn't exist in Auth anymore
      // Continue anyway since we've cleaned up all the data
    }

    console.log(`CASCADE deletion completed for user: ${userId}`);

    return NextResponse.json({
      success: true,
      deletedItems: {
        students: studentIds.length,
        sessions: sessionIds.length,
        sessionFiles: sessionFileIds.length,
        // messages: 0, // DISABLED - Collection removed
        achievements: achievementsResult?.documents?.length || 0,
        userExtended: userExtendedResult.documents.length
      }
    });

  } catch (error) {
    console.error('CASCADE deletion error:', error);
    return NextResponse.json(
      { success: false, error: `Deletion failed: ${error.message}` },
      { status: 500 }
    );
  }
}
