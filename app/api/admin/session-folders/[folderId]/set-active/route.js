import { NextResponse } from 'next/server';
import sessionFolderService from '@/lib/sessionFolderService';

export async function POST(request, { params }) {
  try {
    const { folderId } = await params;

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId parameter is required' },
        { status: 400 }
      );
    }

    // Get the folder to find the studentId
    const { databases, appwriteConfig } = await import('@/lib/appwrite.client');
    
    const folder = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFolders,
      folderId
    );

    if (!folder) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session folder not found' 
        },
        { status: 404 }
      );
    }

    // Set this folder as active
    const updatedFolder = await sessionFolderService.setActiveFolder(folder.studentId, folderId);

    return NextResponse.json({
      success: true,
      folder: updatedFolder,
      message: `Folder "${folder.name}" is now the active folder`
    });

  } catch (error) {
    console.error('❌ Error setting active folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to set active folder' 
      },
      { status: 500 }
    );
  }
}
