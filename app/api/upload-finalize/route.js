import { NextResponse } from 'next/server';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';
import { ID } from 'node-appwrite';

/**
 * Finalize file upload by saving metadata to database
 * Called after successful direct upload to R2
 */

export async function POST(request) {
  try {
    const { fileId, fileName, fileType, fileSize, sessionId, r2Key } = await request.json();

    if (!fileId || !fileName || !fileType || !sessionId || !r2Key) {
      return NextResponse.json({ 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    console.log(`💾 Finalizing upload metadata for ${fileName}`);

    // Determine file type category (must match enum in database)
    const getFileTypeCategory = (mimeType) => {
      if (mimeType?.includes('pdf')) return 'pdf';
      if (mimeType?.includes('image')) return 'image';
      if (mimeType?.includes('video')) return 'video';
      if (mimeType?.includes('audio')) return 'audio';
      return 'pdf'; // Default fallback
    };

    // Save metadata to Appwrite database
    const { databases } = createServerClient();
    const dbDocumentId = ID.unique(); // Separate ID for database document
    const fileRecord = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFiles,
      dbDocumentId,
      {
        fileId: fileId,        // The R2 file identifier  
        sessionId: sessionId,
        fileName: fileName,
        fileType: getFileTypeCategory(fileType), // Must be enum value
        fileSize: parseInt(fileSize) || 0,
        uploadedBy: 'admin',   // TODO: Get from auth session
        description: r2Key     // Store R2 key in description field
      }
    );

    console.log(`✅ Finalized upload: ${fileRecord.$id}`);

    return NextResponse.json({
      id: fileRecord.$id,
      name: fileName,
      type: fileType,
      size: parseInt(fileSize) || 0,
      uploadDate: fileRecord.$createdAt,
      sessionId: sessionId,
      url: `/api/file-view/${fileRecord.$id}`,
      downloadUrl: `/api/file-download/${fileRecord.$id}`,
    });

  } catch (error) {
    console.error('❌ Upload finalization error:', error);
    return NextResponse.json(
      { error: 'Upload finalization failed', details: error.message },
      { status: 500 }
    );
  }
}
