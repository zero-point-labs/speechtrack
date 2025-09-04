import { NextResponse } from 'next/server';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';

/**
 * Get file metadata for PDF viewer
 */

export async function GET(request, { params }) {
  try {
    const { fileId } = await params;
    
    console.log('📄 Getting file info for:', fileId);

    // Get file metadata from database using server client
    const { databases } = createServerClient();
    const fileRecord = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFiles,
      fileId
    );

    console.log('✅ File info loaded:', fileRecord.fileName);

    // Return formatted file data
    const fileData = {
      id: fileRecord.$id,
      name: fileRecord.fileName,
      type: fileRecord.fileType,
      size: fileRecord.fileSize,
      sessionId: fileRecord.sessionId,
      url: `/api/file-view/${fileRecord.$id}`,
      downloadUrl: `/api/file-download/${fileRecord.$id}`,
      uploadDate: fileRecord.$createdAt
    };

    return NextResponse.json(fileData);

  } catch (error) {
    console.error('❌ Error getting file info:', error);
    return NextResponse.json(
      { 
        error: 'File not found', 
        details: error.message,
        fileId: params.fileId
      },
      { status: 404 }
    );
  }
}
