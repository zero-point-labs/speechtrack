import { NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';

/**
 * Delete file from both R2 and database
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export async function DELETE(request, { params }) {
  try {
    const { fileId } = params;
    
    // Get file metadata from database
    const { databases } = createServerClient();
    const fileRecord = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFiles,
      fileId
    );

    // Delete from R2 (R2 key stored in description field)
    const r2Key = fileRecord.description;
    if (r2Key) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: r2Key,
      });

      await r2Client.send(deleteCommand);
      console.log(`✅ Deleted from R2: ${r2Key}`);
    }

    // Mark as inactive in database (soft delete)
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFiles,
      fileId,
      { isActive: false }
    );

    console.log(`✅ Marked as deleted in database: ${fileId}`);

    return NextResponse.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
