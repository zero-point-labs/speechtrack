import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';

/**
 * Serve files from R2 for download
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    
    // Get file metadata from database
    const { databases } = createServerClient();
    const fileRecord = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFiles,
      fileId
    );

    console.log('📁 File record:', JSON.stringify(fileRecord, null, 2));

    // Get file from R2 (R2 key stored in description field)
    const r2Key = fileRecord.description;
    if (!r2Key) {
      return NextResponse.json({ error: 'File location not found' }, { status: 404 });
    }
    
    const getCommand = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
    });

    const response = await r2Client.send(getCommand);
    const fileBuffer = Buffer.from(await response.Body.transformToByteArray());

    // Set download headers with proper MIME types
    const getMimeType = (fileType, fileName) => {
      if (fileType === 'pdf') return 'application/pdf';
      if (fileType === 'image') return 'image/jpeg';
      if (fileType === 'video') return 'video/mp4';
      if (fileType === 'audio') return 'audio/mpeg';
      
      // Fallback: detect by file extension
      const ext = fileName?.toLowerCase().split('.').pop();
      if (ext === 'pdf') return 'application/pdf';
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      if (['mp4', 'avi', 'mov'].includes(ext)) return `video/${ext}`;
      if (['mp3', 'wav', 'm4a'].includes(ext)) return `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
      
      return 'application/octet-stream'; // Safe default for downloads
    };

    const headers = {
      'Content-Type': getMimeType(fileRecord.fileType, fileRecord.fileName),
      'Content-Disposition': `attachment; filename="${fileRecord.fileName}"`,
      'Content-Length': fileRecord.fileSize.toString(),
    };

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error('❌ Error downloading file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
