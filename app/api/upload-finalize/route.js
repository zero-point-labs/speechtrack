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
    // All document types (PDF, Word, Excel, etc.) are stored as 'pdf' for backwards compatibility
    const getFileTypeCategory = (mimeType, fileName) => {
      // Check for images first
      if (mimeType?.includes('image')) return 'image';
      
      // Check for videos
      if (mimeType?.includes('video')) return 'video';
      
      // Check for audio
      if (mimeType?.includes('audio')) return 'audio';
      
      // Document types - all stored as 'pdf' for backwards compatibility with existing data structure
      const documentMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      const documentExtensions = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'];
      
      if (documentMimeTypes.includes(mimeType)) return 'pdf';
      if (fileName && documentExtensions.some(ext => fileName.toLowerCase().endsWith(ext))) return 'pdf';
      
      return 'pdf'; // Default fallback for documents
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
        fileType: getFileTypeCategory(fileType, fileName), // Must be enum value
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
