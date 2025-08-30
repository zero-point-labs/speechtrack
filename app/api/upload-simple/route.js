import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';
import { ID } from 'node-appwrite';

/**
 * Simple R2 Upload API
 * Uploads file to R2 and saves metadata to Appwrite database
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const sessionId = formData.get('sessionId');

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'Missing file or sessionId' }, { status: 400 });
    }

    console.log(`📤 Uploading ${file.name} (${file.size} bytes) to session ${sessionId}`);

    // Generate unique file ID and R2 key
    const fileId = ID.unique();
    const r2Key = `sessions/${sessionId}/${fileId}_${file.name}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'session-id': sessionId,
        'original-name': file.name,
      }
    });

    await r2Client.send(uploadCommand);
    console.log(`✅ Uploaded to R2: ${r2Key}`);

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
        fileName: file.name,
        fileType: getFileTypeCategory(file.type), // Must be enum value
        fileSize: file.size,
        uploadedBy: 'admin',   // TODO: Get from auth session
        description: r2Key     // Store R2 key in description field
      }
    );

    console.log(`✅ Saved to database: ${fileRecord.$id}`);

    return NextResponse.json({
      id: fileRecord.$id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadDate: fileRecord.uploadDate,
      sessionId: sessionId,
      url: `/api/file-view/${fileRecord.$id}`,
      downloadUrl: `/api/file-download/${fileRecord.$id}`,
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}
