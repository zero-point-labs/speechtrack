import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ID } from 'node-appwrite';

/**
 * Generate pre-signed URL for direct upload to R2
 * This bypasses Vercel's 4.5MB serverless function limit
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
    const { fileName, fileType, fileSize, sessionId } = await request.json();

    if (!fileName || !fileType || !sessionId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: fileName, fileType, sessionId' 
      }, { status: 400 });
    }

    console.log(`🔗 Generating pre-signed URL for ${fileName} (${fileSize} bytes) to session ${sessionId}`);

    // Generate unique file ID and R2 key
    const fileId = ID.unique();
    const r2Key = `sessions/${sessionId}/${fileId}_${fileName}`;
    
    // Create the put command
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
      ContentType: fileType,
      Metadata: {
        'session-id': sessionId,
        'original-name': fileName,
        'file-id': fileId,
      }
    });

    // Generate pre-signed URL (valid for 10 minutes)
    const presignedUrl = await getSignedUrl(r2Client, command, { 
      expiresIn: 600 // 10 minutes
    });

    console.log(`✅ Pre-signed URL generated for: ${r2Key}`);

    return NextResponse.json({
      presignedUrl,
      fileId,
      r2Key,
      fields: {
        key: r2Key,
        'Content-Type': fileType,
      }
    });

  } catch (error) {
    console.error('❌ Error generating pre-signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate pre-signed URL', details: error.message },
      { status: 500 }
    );
  }
}
