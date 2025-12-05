import { NextResponse } from 'next/server';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';
import { Query } from 'node-appwrite';

/**
 * Optimized Session Complete Data API
 * 
 * Combines session data + files into a single efficient call
 * 
 * Returns:
 * - Complete session information
 * - All session files categorized by type
 * - Properly formatted for UI consumption
 * 
 * This replaces 2-3 separate database calls with 2 parallel calls
 */

export async function GET(request, { params }) {
  try {
    const { sessionId } = await params;
    
    console.log(`📋 Loading optimized session data for: ${sessionId}`);
    
    const { databases } = createServerClient();
    
    // ===== PARALLEL QUERY: Session + Files =====
    const [sessionResponse, filesResponse] = await Promise.all([
      // Get session details
      databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        sessionId
      ),
      
      // Get all files for this session
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessionFiles,
        [Query.equal('sessionId', sessionId)]
      )
    ]);
    
    const session = sessionResponse;
    
    // ===== PROCESS SESSION DATA =====
    
    // Parse JSON fields and ΓεΣΥ note from achievement field
    let achievement = null;
    let feedback = [];
    let gesyNote = '';
    
    // Extract ΓεΣΥ note from achievement field (repurposed for ΓεΣΥ note storage)
    try {
      if (session.achievement) {
        const achievementData = JSON.parse(session.achievement);
        if (achievementData.gesyNote) {
          gesyNote = achievementData.gesyNote;
        }
        if (achievementData.achievement) {
          achievement = achievementData.achievement;
        }
      }
    } catch (e) {
      // If parsing fails, treat the whole field as the ΓεΣΥ note
      gesyNote = session.achievement || '';
    }
    
    // Parse feedback
    try {
      if (session.feedback) {
        feedback = JSON.parse(session.feedback);
        if (!Array.isArray(feedback)) {
          feedback = [];
        }
      }
    } catch (e) {
      feedback = [];
    }
    
    // ===== PROCESS FILES DATA =====
    
    const materials = { pdfs: [], videos: [], images: [] };
    
    filesResponse.documents.forEach((file) => {
      const fileData = {
        id: file.$id,
        name: file.fileName,
        url: `/api/file-view/${file.$id}`,
        downloadUrl: `/api/file-download/${file.$id}`,
        type: file.fileType,
        size: file.fileSize,
        uploadDate: file.$createdAt ? new Date(file.$createdAt).toLocaleDateString('el-GR') : 'Σήμερα',
        uploadDateRaw: file.$createdAt,
        // Additional metadata for different file types
        sessionId: file.sessionId,
        uploadedBy: file.uploadedBy || 'admin'
      };
      
      // Categorize files by type
      if (file.fileType === 'pdf') {
        materials.pdfs.push(fileData);
      } else if (file.fileType === 'image') {
        materials.images.push(fileData);
      } else if (file.fileType === 'video') {
        materials.videos.push({
          ...fileData,
          thumbnail: fileData.url, // Use the same URL for thumbnail for now
          duration: "N/A" // Duration not available from metadata yet
        });
      }
    });
    
    console.log(`📁 Found ${filesResponse.documents.length} files: ${materials.pdfs.length} documents (PDF/Word/etc), ${materials.images.length} images, ${materials.videos.length} videos`);
    
    // ===== FORMAT COMPLETE SESSION RESPONSE =====
    
    const completeSessionData = {
      id: session.$id,
      sessionNumber: session.sessionNumber,
      title: session.title,
      status: session.status,
      date: session.date,
      duration: session.duration,
      goals: session.goals,
      activities: session.activities,
      notes: session.notes,
      achievement,
      feedback,
      gesyNote,
      folderId: session.folderId,
      studentId: session.studentId,
      // 🔧 FIX: Include missing payment and GESY fields
      isPaid: session.isPaid || false,
      isGESY: session.isGESY || false,
      
      // Complete materials with all file data
      materials,
      
      // File counts for quick reference
      fileCounts: {
        pdfs: materials.pdfs.length,
        images: materials.images.length,
        videos: materials.videos.length,
        total: materials.pdfs.length + materials.images.length + materials.videos.length
      },
      
      // Metadata
      $createdAt: session.$createdAt,
      $updatedAt: session.$updatedAt
    };
    
    const response = {
      success: true,
      data: completeSessionData,
      meta: {
        queriesExecuted: 2, // vs 3-4 in old approach
        filesLoaded: filesResponse.documents.length,
        loadTime: Date.now(),
        optimized: true
      }
    };
    
    console.log(`✅ Session complete data loaded in 2 optimized queries`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Session complete data API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load session data',
      details: error.message,
      sessionId: params?.sessionId,
      meta: {
        optimized: true,
        failed: true
      }
    }, { status: 500 });
  }
}

/**
 * Update session data (keeping existing PATCH functionality if needed)
 */
export async function PATCH(request, { params }) {
  try {
    const { sessionId } = await params;
    const updates = await request.json();
    
    console.log(`📝 Updating session: ${sessionId}`);
    
    const { databases } = createServerClient();
    
    // Update session document
    const updatedSession = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.collections.sessions,
      sessionId,
      updates
    );
    
    console.log(`✅ Session updated: ${sessionId}`);
    
    return NextResponse.json({
      success: true,
      data: updatedSession,
      meta: {
        updated: true,
        optimized: true
      }
    });
    
  } catch (error) {
    console.error('❌ Session update error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update session',
      details: error.message,
      sessionId: params?.sessionId
    }, { status: 500 });
  }
}
