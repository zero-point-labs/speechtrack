import { NextResponse } from 'next/server';
import sessionFolderService from '@/lib/sessionFolderService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId parameter is required' },
        { status: 400 }
      );
    }

    // Get all folders for the student
    const folders = await sessionFolderService.getFoldersForStudent(studentId);

    // Get folder statistics
    const stats = await sessionFolderService.getFolderStatsForStudent(studentId);

    return NextResponse.json({
      success: true,
      folders,
      stats
    });

  } catch (error) {
    console.error('❌ Error fetching session folders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch session folders' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { studentId, name, description, setActive = true } = body;

    // Validation
    if (!studentId || !name) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'studentId and name are required' 
        },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Folder name must be at least 2 characters long' 
        },
        { status: 400 }
      );
    }

    // Create the folder
    const folder = await sessionFolderService.createFolder(studentId, {
      name: name.trim(),
      description: description?.trim() || '',
      setActive
    });

    return NextResponse.json({
      success: true,
      folder,
      message: `Session folder "${folder.name}" created successfully`
    });

  } catch (error) {
    console.error('❌ Error creating session folder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create session folder' 
      },
      { status: 500 }
    );
  }
}
