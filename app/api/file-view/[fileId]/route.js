import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';

/**
 * Serve files from R2 for viewing (PDFs, images, etc.)
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

// Handle CORS preflight requests
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request, { params }) {
  try {
    const { fileId } = await params;
    
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

    // Check if this is a range request (required for video streaming on iOS)
    const range = request.headers.get('range');
    const isVideo = fileRecord.fileType === 'video' || fileRecord.fileName?.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm)$/);
    
    if (range && isVideo) {
      return await handleRangeRequest(r2Key, range, fileRecord);
    }
    
    const getCommand = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
    });

    const response = await r2Client.send(getCommand);
    const fileBuffer = Buffer.from(await response.Body.transformToByteArray());

    // Set appropriate headers with proper MIME types
    const getMimeType = (fileType, fileName) => {
      // Handle by file type from database
      if (fileType === 'pdf') return 'application/pdf';
      if (fileType === 'image') return 'image/jpeg';
      if (fileType === 'video') {
        // Use proper video MIME types with codecs for better iOS compatibility
        const ext = fileName?.toLowerCase().split('.').pop();
        if (ext === 'mp4') return 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';
        if (ext === 'mov') return 'video/quicktime';
        if (ext === 'webm') return 'video/webm; codecs="vp8,vorbis"';
        return 'video/mp4'; // Default fallback
      }
      if (fileType === 'audio') return 'audio/mpeg';
      
      // Fallback: detect by file extension
      const ext = fileName?.toLowerCase().split('.').pop();
      if (ext === 'pdf') return 'application/pdf';
      if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      if (['mp4', 'avi', 'mov'].includes(ext)) {
        if (ext === 'mp4') return 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';
        if (ext === 'mov') return 'video/quicktime';
        return `video/${ext}`;
      }
      if (['mp3', 'wav', 'm4a'].includes(ext)) return `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
      
      return 'application/pdf'; // Safe default
    };

    const headers = {
      'Content-Type': getMimeType(fileRecord.fileType, fileRecord.fileName),
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=3600',
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
      // Add CORS headers for video compatibility
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    };

    // For videos, ensure proper content length is set
    if (isVideo) {
      headers['Content-Length'] = fileBuffer.length.toString();
    }

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error('❌ Error serving file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

// Handle HTTP Range requests for video streaming (required for iOS Safari)
async function handleRangeRequest(r2Key, rangeHeader, fileRecord) {
  try {
    // Parse range header (e.g., "bytes=0-1023")
    const ranges = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(ranges[0], 10);
    const end = ranges[1] ? parseInt(ranges[1], 10) : undefined;

    // First, get file size from R2
    const headCommand = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
    });
    
    const headResponse = await r2Client.send(headCommand);
    const fileSize = headResponse.ContentLength;
    
    // Calculate actual end position
    const actualEnd = end !== undefined ? Math.min(end, fileSize - 1) : fileSize - 1;
    const contentLength = actualEnd - start + 1;

    // Get the requested range from R2
    const getCommand = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
      Range: `bytes=${start}-${actualEnd}`,
    });

    const response = await r2Client.send(getCommand);
    const fileBuffer = Buffer.from(await response.Body.transformToByteArray());

    // Determine MIME type
    const ext = fileRecord.fileName?.toLowerCase().split('.').pop();
    let contentType = 'video/mp4';
    if (ext === 'mp4') contentType = 'video/mp4; codecs="avc1.42E01E,mp4a.40.2"';
    else if (ext === 'mov') contentType = 'video/quicktime';
    else if (ext === 'webm') contentType = 'video/webm; codecs="vp8,vorbis"';

    const headers = {
      'Content-Type': contentType,
      'Content-Range': `bytes ${start}-${actualEnd}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength.toString(),
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'X-Content-Type-Options': 'nosniff',
    };

    return new NextResponse(fileBuffer, { 
      status: 206, // Partial Content
      headers 
    });

  } catch (error) {
    console.error('❌ Error handling range request:', error);
    // Fall back to full file if range request fails
    throw error;
  }
}
