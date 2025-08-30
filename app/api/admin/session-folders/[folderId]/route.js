import { NextResponse } from 'next/server';
import sessionFolderService from '@/lib/sessionFolderService';

export async function GET(request, { params }) {
  try {
    const { folderId } = await params;
    const { searchParams } = new URL(request.url);
    const includeSessions = searchParams.get('includeSessions') === 'true';
    const sessionsLimit = parseInt(searchParams.get('sessionsLimit')) || 100;

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId parameter is required' },
        { status: 400 }
      );
    }

    // Get the folder (we'll need to implement a getFolder method)
    // For now, let's get sessions and derive folder info
    const sessions = await sessionFolderService.getSessionsInFolder(folderId, {
      limit: sessionsLimit
    });

    let folder = null;
    if (sessions.length > 0) {
      // Get folder info by querying the sessions collection
      // This is a temporary solution until we implement getFolder method
      const { databases, appwriteConfig } = await import('@/lib/appwrite.client');
      folder = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessionFolders,
        folderId
      );
    }

    const response = { success: true };
    
    if (folder) {
      response.folder = folder;
    }

    if (includeSessions) {
      response.sessions = sessions;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error fetching session folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch session folder' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { folderId } = await params;
    const body = await request.json();
    const { name, description, status, endDate, setActive } = body;

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId parameter is required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {};
    
    if (name !== undefined) {
      if (!name.trim() || name.trim().length < 2) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Folder name must be at least 2 characters long' 
          },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description.trim();
    }

    if (status !== undefined) {
      if (!['active', 'completed', 'paused'].includes(status)) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Status must be one of: active, completed, paused' 
          },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (endDate !== undefined) {
      updateData.endDate = endDate;
    }

    // Handle setting as active folder
    if (setActive) {
      // First get the folder to find the studentId
      const { databases, appwriteConfig } = await import('@/lib/appwrite.client');
      const folder = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessionFolders,
        folderId
      );

      // Set this folder as active (will deactivate others)
      await sessionFolderService.setActiveFolder(folder.studentId, folderId);
    }

    // Update the folder
    const updatedFolder = await sessionFolderService.updateFolder(folderId, updateData);

    return NextResponse.json({
      success: true,
      folder: updatedFolder,
      message: 'Session folder updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating session folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update session folder' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { folderId } = await params;
    const { searchParams } = new URL(request.url);
    const cascadeDelete = searchParams.get('cascade') === 'true';

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId parameter is required' },
        { status: 400 }
      );
    }

    // Delete the folder
    await sessionFolderService.deleteFolder(folderId, cascadeDelete);

    return NextResponse.json({
      success: true,
      message: cascadeDelete 
        ? 'Session folder and all sessions deleted successfully'
        : 'Session folder deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting session folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete session folder' 
      },
      { status: 500 }
    );
  }
}
