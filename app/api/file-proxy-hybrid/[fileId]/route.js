import { NextResponse } from 'next/server';
import { Client, Storage } from 'node-appwrite';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

/**
 * Hybrid File Proxy API Route
 * 
 * Serves files from both Appwrite and Cloudflare R2 storage
 * based on the file identifier format and storage configuration.
 */

// Initialize Appwrite client
const createAppwriteClient = () => {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);
  
  return new Storage(client);
};

// Initialize R2 client
const createR2Client = () => {
  if (!process.env.CLOUDFLARE_R2_ENDPOINT) {
    return null; // R2 not configured
  }
  
  return new S3Client({
    region: 'auto',
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    },
  });
};

export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'view'; // 'view' or 'download'
    const storageType = searchParams.get('storage') || 'auto'; // 'appwrite', 'r2', or 'auto'

    console.log(`📁 File request: ${fileId}, action: ${action}, storage: ${storageType}`);

    // Determine storage type if auto-detection
    const useR2 = determineStorageType(fileId, storageType);
    
    if (useR2) {
      return await serveFromR2(fileId, action);
    } else {
      return await serveFromAppwrite(fileId, action);
    }

  } catch (error) {
    console.error('File proxy error:', error);
    return NextResponse.json(
      { error: 'File not found or access denied', details: error.message },
      { status: 404 }
    );
  }
}

async function serveFromR2(fileKey, action) {
  const r2Client = createR2Client();
  
  if (!r2Client) {
    throw new Error('R2 not configured');
  }

  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  
  // Get file from R2
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey
  });

  const response = await r2Client.send(command);
  const fileBuffer = Buffer.from(await response.Body.transformToByteArray());
  
  // Extract filename from key
  const fileName = fileKey.split('/').pop().replace(/^[^_]+_/, '');
  const contentType = response.ContentType || 'application/octet-stream';
  
  // Set response headers
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'X-Storage-Source': 'r2'
  };

  if (action === 'download') {
    headers['Content-Disposition'] = `attachment; filename="${fileName}"`;
  } else {
    headers['Content-Disposition'] = 'inline';
    if (contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      headers['Content-Type'] = 'application/pdf';
    }
  }

  return new NextResponse(fileBuffer, { headers });
}

async function serveFromAppwrite(fileId, action) {
  const storage = createAppwriteClient();
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID;

  // Get file from Appwrite storage
  const fileBuffer = action === 'download' 
    ? await storage.getFileDownload(bucketId, fileId)
    : await storage.getFileView(bucketId, fileId);

  // Get file info for proper headers
  const fileInfo = await storage.getFile(bucketId, fileId);
  
  // Set response headers
  const headers = {
    'Content-Type': fileInfo.mimeType || 'application/pdf',
    'Cache-Control': 'public, max-age=31536000',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
    'X-Storage-Source': 'appwrite'
  };

  if (action === 'download') {
    headers['Content-Disposition'] = `attachment; filename="${fileInfo.name.replace(`${fileInfo.bucketId}_`, '')}"`;
  } else {
    headers['Content-Disposition'] = 'inline';
    if (fileInfo.mimeType === 'application/pdf' || fileInfo.name.toLowerCase().endsWith('.pdf')) {
      headers['Content-Type'] = 'application/pdf';
    }
  }

  return new NextResponse(fileBuffer, { headers });
}

function determineStorageType(fileId, storageTypeParam) {
  // Explicit storage type parameter
  if (storageTypeParam === 'r2') return true;
  if (storageTypeParam === 'appwrite') return false;
  
  // Auto-detection based on file ID format
  // R2 file keys contain '/' (e.g., "sessionId/fileId_filename")
  // Appwrite IDs are simple strings
  if (fileId.includes('/')) {
    return true; // R2
  }
  
  // Check environment configuration
  if (process.env.USE_R2_STORAGE === 'true') {
    return true;
  }
  
  return false; // Default to Appwrite
}
