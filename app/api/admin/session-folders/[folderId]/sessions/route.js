import { NextResponse } from 'next/server';
import sessionFolderService from '@/lib/sessionFolderService';
import { databases, appwriteConfig, Query, ID } from '@/lib/appwrite.client';

export async function GET(request, { params }) {
  try {
    const { folderId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limit = parseInt(searchParams.get('limit')) || 100;
    const orderBy = searchParams.get('orderBy') || 'sessionNumber';
    const orderDirection = searchParams.get('orderDirection') || 'asc';
    const status = searchParams.get('status'); // Optional filter by status

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId parameter is required' },
        { status: 400 }
      );
    }

    // Get sessions in the folder with display-friendly session numbers
    const sessions = await sessionFolderService.getSessionsForDisplay(folderId, {
      limit,
      orderBy,
      orderDirection
    });

    // Filter by status if provided
    let filteredSessions = sessions;
    if (status) {
      filteredSessions = sessions.filter(session => session.status === status);
    }

    // Update folder statistics after fetching sessions
    await sessionFolderService.updateFolderStats(folderId);

    return NextResponse.json({
      success: true,
      sessions: filteredSessions,
      totalSessions: sessions.length,
      folderId
    });

  } catch (error) {
    console.error('❌ Error fetching sessions in folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch sessions in folder' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { folderId } = await params;
    const body = await request.json();
    
    // Extract session data from request body
    const {
      studentId,
      title,
      description = '',
      date,
      duration = '45 λεπτά',
      status = 'locked',
      isPaid = false,
      sessionNumber
    } = body;

    if (!folderId || !studentId || !title || !date) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'folderId, studentId, title, and date are required' 
        },
        { status: 400 }
      );
    }

    // Get folder information to create unique sessionNumber with folder name
    const folder = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessionFolders,
      folderId
    );
    
    // Get existing sessions in this specific folder
    const folderSessions = await sessionFolderService.getSessionsInFolder(folderId);
    
    // Create folder-specific sessionNumber as string: "1 - FolderName"
    const nextSessionNum = sessionNumber || (folderSessions.length + 1);
    const nextSessionNumber = `${nextSessionNum} - ${folder.name}`;
    
    console.log(`📊 Creating session "${nextSessionNumber}" in folder "${folder.name}"`);

    // Using folder-specific sessionNumbers like "1 - FolderName" to ensure uniqueness
    // This solves the (studentId, sessionNumber) unique constraint while keeping clean numbering
    
    let newSession;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        
        // Create the document - let Appwrite handle ID generation
        console.log(`🔍 Creating session ${nextSessionNumber} with Appwrite ID.unique()`);
        
        newSession = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.sessions,
          ID.unique(),
          {
            studentId,
            folderId,
            sessionNumber: nextSessionNumber,
            title,
            description,
            date,
            duration,
            status,
            isPaid,
            therapistNotes: null
          }
        );
        
        console.log(`✅ Session ${nextSessionNumber} created successfully on attempt ${attempts}`);
        break; // Success, exit loop
        
      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed for session ${nextSessionNumber}:`, error.message);
        
        if (attempts >= maxAttempts) {
          console.error(`❌ All ${maxAttempts} attempts failed for session ${nextSessionNumber}`);
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update folder statistics
    await sessionFolderService.updateFolderStats(folderId);

    return NextResponse.json({
      success: true,
      session: newSession,
      message: `Session "${title}" created successfully in folder`
    });

  } catch (error) {
    console.error('❌ Error creating session in folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create session in folder' 
      },
      { status: 500 }
    );
  }
}
