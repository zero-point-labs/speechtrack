import { NextResponse } from 'next/server';
import { createServerClient, appwriteConfig } from '@/lib/appwrite.config';
import { Query } from 'node-appwrite';

/**
 * Optimized Dashboard Data API
 * Combines multiple queries into a single efficient endpoint
 * 
 * Returns:
 * - Student folders
 * - Session counts (total, completed)
 * - Paginated sessions with basic file counts
 * - Mystery completion status
 * 
 * This replaces 6-8 separate database calls with 3-4 optimized calls
 */

export async function GET(request, { params }) {
  try {
    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    
    console.log(`📊 Loading optimized dashboard data for student: ${studentId}, page: ${page}`);
    
    const { databases } = createServerClient();
    
    // ===== PARALLEL QUERY BATCH 1: Folders First =====
    const [foldersResponse] = await Promise.all([
      // Get session folders for this student
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessionFolders,
        [Query.equal('studentId', studentId)]
      )
    ]);
    
    // Find active folder
    const activeFolder = foldersResponse.documents.find(f => f.isActive);
    const activeFolderId = activeFolder?.$id;
    
    // Build base queries with optional folder filtering
    const baseSessionQueries = [Query.equal('studentId', studentId)];
    if (activeFolderId) {
      baseSessionQueries.push(Query.equal('folderId', activeFolderId));
    }
    
    // ===== PARALLEL QUERY BATCH 2: Session Counts with Folder Filtering =====
    const [totalSessionsResponse, completedSessionsResponse] = await Promise.all([
      // Get total sessions count (filtered by active folder if exists)
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          ...baseSessionQueries,
          Query.limit(1) // Just for count
        ]
      ),
      
      // Get completed sessions count (filtered by active folder if exists)
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          ...baseSessionQueries,
          Query.equal('status', 'completed'),
          Query.limit(1) // Just for count
        ]
      )
    ]);
    
    console.log(`📁 Found ${foldersResponse.documents.length} folders, active: ${activeFolder?.name || 'none'}`);
    
    // ===== PARALLEL QUERY BATCH 3: Sessions & Mystery Status =====
    
    const offset = (page - 1) * limit;
    
    const [paginatedSessionsResponse, mysterySessionsResponse] = await Promise.all([
      // Get paginated sessions for current page  
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          ...baseSessionQueries,
          // 🔧 REMOVED: Database ordering (doing numeric sort in JavaScript instead)
          Query.limit(limit),
          Query.offset(offset)
        ]
      ),
      
      // Get all completed sessions for mystery status calculation
      databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          Query.equal('studentId', studentId),
          Query.equal('status', 'completed')
        ]
      )
    ]);
    
    // ===== POST-PROCESS: Calculate Mystery Status =====
    const totalSessionsCount = activeFolderId ? 
      paginatedSessionsResponse.total : // If folder filtering, use filtered total
      totalSessionsResponse.total; // Otherwise use global total
    
    const getSessionNumber = (sessionNumber) => {
      if (!sessionNumber) return 0;
      const match = sessionNumber.toString().match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    const middleSessionNumber = Math.floor(totalSessionsCount / 2);
    const finalSessionNumber = totalSessionsCount;
    
    const middleCompleted = mysterySessionsResponse.documents.some(session => 
      getSessionNumber(session.sessionNumber) === middleSessionNumber
    );
    
    const finalCompleted = mysterySessionsResponse.documents.some(session => 
      getSessionNumber(session.sessionNumber) === finalSessionNumber
    );
    
    // ===== PARALLEL QUERY BATCH 4: File Counts for Sessions =====
    
    // Get file counts for all sessions on current page (if we have sessions)
    let sessionFileCountsMap = {};
    
    if (paginatedSessionsResponse.documents.length > 0) {
      const sessionIds = paginatedSessionsResponse.documents.map(s => s.$id);
      
      try {
        // Get all files for sessions on this page in one query
        const sessionFilesResponse = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.sessionFiles,
          [
            Query.equal('sessionId', sessionIds),
            Query.select(['sessionId', 'fileType']) // Only need these fields for counting
          ]
        );
        
        // Group files by session and type
        sessionFilesResponse.documents.forEach(file => {
          if (!sessionFileCountsMap[file.sessionId]) {
            sessionFileCountsMap[file.sessionId] = { pdfs: 0, images: 0, videos: 0, total: 0 };
          }
          
          sessionFileCountsMap[file.sessionId][file.fileType + 's'] = 
            (sessionFileCountsMap[file.sessionId][file.fileType + 's'] || 0) + 1;
          sessionFileCountsMap[file.sessionId].total += 1;
        });
        
        console.log(`📁 Loaded file counts for ${Object.keys(sessionFileCountsMap).length} sessions`);
      } catch (error) {
        console.warn('Could not load file counts:', error.message);
      }
    }
    
    // ===== FORMAT RESPONSE =====
    
    const formattedSessions = paginatedSessionsResponse.documents.map(session => {
      const fileCounts = sessionFileCountsMap[session.$id] || { pdfs: 0, images: 0, videos: 0, total: 0 };
      
      // Parse existing fields
      let achievement = null;
      let feedback = [];
      let gesyNote = '';
      
      try {
        if (session.achievement) {
          const achievementData = JSON.parse(session.achievement);
          gesyNote = achievementData.gesyNote || '';
          achievement = achievementData.achievement || null;
        }
      } catch (e) {
        gesyNote = session.achievement || '';
      }
      
      try {
        if (session.feedback) {
          feedback = JSON.parse(session.feedback);
        }
      } catch (e) {
        feedback = [];
      }
      
      return {
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
        // 🔧 FIX: Include missing payment and GESY fields
        isPaid: session.isPaid || false,
        isGESY: session.isGESY || false,
        // Add file counts without loading actual files
        materials: {
          pdfs: [], // Will be loaded separately when needed
          images: [],
          videos: []
        },
        fileCounts, // Quick access to file counts for UI
        $createdAt: session.$createdAt,
        $updatedAt: session.$updatedAt
      };
    });
    
    // 🔧 FIX: Sort sessions numerically instead of alphabetically
    // Extract numeric value from sessionNumber for proper sorting
    formattedSessions.sort((a, b) => {
      const getNumericSessionNumber = (sessionNumber) => {
        // Handle different formats: "1", "Συνεδρία 1", "1 - Title", etc.
        if (typeof sessionNumber === 'number') return sessionNumber;
        if (typeof sessionNumber === 'string') {
          const match = sessionNumber.match(/(\d+)/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      };
      
      const numA = getNumericSessionNumber(a.sessionNumber);
      const numB = getNumericSessionNumber(b.sessionNumber);
      
      return numA - numB;
    });
    
    console.log('📊 Sessions sorted numerically:', formattedSessions.map(s => s.sessionNumber));
    
    const response = {
      success: true,
      data: {
        // Folder information
        folders: foldersResponse.documents.map(folder => ({
          id: folder.$id,
          name: folder.name,
          isActive: folder.isActive,
          sessionCount: folder.sessionCount || 0
        })),
        activeFolder: activeFolder ? {
          id: activeFolder.$id,
          name: activeFolder.name,
          sessionCount: activeFolder.sessionCount || 0
        } : null,
        
        // Session counts
        totalSessions: totalSessionsCount,
        completedSessions: completedSessionsResponse.total,
        totalPages: Math.ceil(totalSessionsCount / limit),
        currentPage: page,
        
        // Mystery status
        mysteryStatus: {
          middleCompleted,
          finalCompleted,
          middleSessionNumber,
          finalSessionNumber
        },
        
        // Paginated sessions with file counts
        sessions: formattedSessions,
        
        // Metadata
        pagination: {
          page,
          limit,
          total: totalSessionsCount,
          pages: Math.ceil(totalSessionsCount / limit),
          hasNext: page < Math.ceil(totalSessionsCount / limit),
          hasPrev: page > 1
        }
      },
      meta: {
        queriesExecuted: paginatedSessionsResponse.documents.length > 0 ? 6 : 5, // vs 8-12 in old approach  
        loadTime: Date.now(),
        optimized: true,
        folderFiltered: activeFolderId ? true : false
      }
    };
    
    console.log(`✅ Dashboard data loaded in ${paginatedSessionsResponse.documents.length > 0 ? 6 : 5} optimized queries`);
    console.log(`📊 Stats: ${totalSessionsCount} total, ${completedSessionsResponse.total} completed, ${formattedSessions.length} on page`);
    console.log(`📁 Folder filtering: ${activeFolderId ? `Active folder: ${activeFolder.name}` : 'No folder filtering'}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Dashboard data API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load dashboard data',
      details: error.message,
      meta: {
        optimized: true,
        failed: true
      }
    }, { status: 500 });
  }
}
