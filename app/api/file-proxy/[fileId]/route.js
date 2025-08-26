import { NextResponse } from 'next/server';
import { Client, Storage } from 'node-appwrite';

// Initialize Appwrite client for server-side
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const storage = new Storage(client);

export async function GET(request, { params }) {
  try {
    const { fileId } = params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'view'; // 'view' or 'download'

    // Get file from Appwrite storage
    const fileBuffer = action === 'download' 
      ? await storage.getFileDownload(process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID, fileId)
      : await storage.getFileView(process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID, fileId);

    // Get file info for proper headers
    const fileInfo = await storage.getFile(process.env.NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID, fileId);
    
    // Set appropriate headers
    const headers = {
      'Content-Type': fileInfo.mimeType || 'application/pdf',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Accept-Ranges': 'bytes', // Important for PDF streaming
      'X-Content-Type-Options': 'nosniff', // Security header
    };

    // Add download headers if requested
    if (action === 'download') {
      headers['Content-Disposition'] = `attachment; filename="${fileInfo.name.replace(`${fileInfo.bucketId}_`, '')}"`;
    } else {
      // For inline viewing (especially PDFs) - force inline display
      headers['Content-Disposition'] = `inline`;
      // Ensure PDF content type for PDFs
      if (fileInfo.mimeType === 'application/pdf' || fileInfo.name.toLowerCase().endsWith('.pdf')) {
        headers['Content-Type'] = 'application/pdf';
      }
    }

    return new NextResponse(fileBuffer, { headers });

  } catch (error) {
    console.error('File proxy error:', error);
    return NextResponse.json(
      { error: 'File not found or access denied' },
      { status: 404 }
    );
  }
}
