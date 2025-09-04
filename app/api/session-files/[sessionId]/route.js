import { NextResponse } from 'next/server';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';
import { Query } from 'node-appwrite';

/**
 * Get all files for a session from database
 */
export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    
    console.log(`📁 Fetching files for session: ${sessionId}`);

    // Get files from database
    const { databases } = createServerClient();
    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFiles,
      [
        Query.equal('sessionId', sessionId),
        Query.orderDesc('$createdAt') // Use Appwrite's built-in timestamp
      ]
    );

    // Format files for frontend
    const formattedFiles = files.documents.map(file => ({
      id: file.$id,
      name: file.fileName,
      type: file.fileType,
      size: file.fileSize,
      uploadDate: file.$createdAt, // Use Appwrite's created timestamp
      sessionId: file.sessionId,
      url: `/api/file-view/${file.$id}`,
      downloadUrl: `/api/file-download/${file.$id}`,
    }));

    console.log(`✅ Found ${formattedFiles.length} files for session ${sessionId}`);

    return NextResponse.json(formattedFiles);

  } catch (error) {
    console.error('❌ Error fetching session files:', error);
    console.error('Full error details:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch files', details: error.message },
      { status: 500 }
    );
  }
}
