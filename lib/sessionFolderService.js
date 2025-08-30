import { databases, appwriteConfig, Query, ID } from './appwrite.client';

/**
 * Session Folder Service
 * Centralized service for managing session folders operations
 */
class SessionFolderService {
  constructor() {
    this.databaseId = appwriteConfig.databaseId;
    this.collectionsIds = {
      sessionFolders: appwriteConfig.collections.sessionFolders,
      sessions: appwriteConfig.collections.sessions,
      students: appwriteConfig.collections.students
    };
  }

  /**
   * Create a new session folder for a student
   * @param {string} studentId - The ID of the student
   * @param {Object} folderData - Folder information
   * @param {string} folderData.name - Name of the folder
   * @param {string} [folderData.description] - Optional description
   * @param {boolean} [folderData.setActive=true] - Whether to set this as the active folder
   * @returns {Promise<Object>} Created folder object
   */
  async createFolder(studentId, folderData) {
    try {
      const { name, description = '', setActive = true } = folderData;
      const now = new Date().toISOString();

      // If setting as active, deactivate other folders first
      if (setActive) {
        await this.deactivateAllFolders(studentId);
      }

      // Create the new folder
      const folder = await databases.createDocument(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        ID.unique(),
        {
          studentId,
          name,
          description,
          isActive: setActive,
          totalSessions: 0,
          completedSessions: 0,
          startDate: now,
          status: 'active',
          createdAt: now,
          updatedAt: now
        }
      );

      console.log(`✅ Created session folder: ${name} for student ${studentId}`);
      return folder;

    } catch (error) {
      console.error('❌ Error creating session folder:', error);
      throw new Error(`Failed to create session folder: ${error.message}`);
    }
  }

  /**
   * Get all folders for a specific student
   * @param {string} studentId - The ID of the student
   * @returns {Promise<Array>} Array of folder objects
   */
  async getFoldersForStudent(studentId) {
    try {
      const result = await databases.listDocuments(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        [
          Query.equal('studentId', studentId),
          Query.orderDesc('createdAt'),
          Query.limit(50) // Reasonable limit for folders per student
        ]
      );

      return result.documents;

    } catch (error) {
      console.error('❌ Error fetching folders for student:', error);
      throw new Error(`Failed to fetch folders: ${error.message}`);
    }
  }

  /**
   * Get the active folder for a student
   * @param {string} studentId - The ID of the student
   * @returns {Promise<Object|null>} Active folder object or null if none found
   */
  async getActiveFolderForStudent(studentId) {
    try {
      const result = await databases.listDocuments(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        [
          Query.equal('studentId', studentId),
          Query.equal('isActive', true),
          Query.limit(1)
        ]
      );

      return result.documents.length > 0 ? result.documents[0] : null;

    } catch (error) {
      console.error('❌ Error fetching active folder:', error);
      throw new Error(`Failed to fetch active folder: ${error.message}`);
    }
  }

  /**
   * Set a specific folder as active for a student
   * @param {string} studentId - The ID of the student
   * @param {string} folderId - The ID of the folder to set as active
   * @returns {Promise<Object>} Updated folder object
   */
  async setActiveFolder(studentId, folderId) {
    try {
      // First, deactivate all folders for this student
      await this.deactivateAllFolders(studentId);

      // Then activate the specified folder
      const now = new Date().toISOString();
      const updatedFolder = await databases.updateDocument(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        folderId,
        {
          isActive: true,
          updatedAt: now
        }
      );

      console.log(`✅ Set folder ${folderId} as active for student ${studentId}`);
      return updatedFolder;

    } catch (error) {
      console.error('❌ Error setting active folder:', error);
      throw new Error(`Failed to set active folder: ${error.message}`);
    }
  }

  /**
   * Deactivate all folders for a student
   * @param {string} studentId - The ID of the student
   * @returns {Promise<void>}
   */
  async deactivateAllFolders(studentId) {
    try {
      // Get all active folders for this student
      const activeFolders = await databases.listDocuments(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        [
          Query.equal('studentId', studentId),
          Query.equal('isActive', true),
          Query.limit(10) // Should be very few active folders
        ]
      );

      // Deactivate each folder
      const now = new Date().toISOString();
      for (const folder of activeFolders.documents) {
        await databases.updateDocument(
          this.databaseId,
          this.collectionsIds.sessionFolders,
          folder.$id,
          {
            isActive: false,
            updatedAt: now
          }
        );
      }

      if (activeFolders.documents.length > 0) {
        console.log(`✅ Deactivated ${activeFolders.documents.length} folders for student ${studentId}`);
      }

    } catch (error) {
      console.error('❌ Error deactivating folders:', error);
      throw new Error(`Failed to deactivate folders: ${error.message}`);
    }
  }

  /**
   * Update folder statistics (total and completed sessions)
   * @param {string} folderId - The ID of the folder to update
   * @returns {Promise<Object>} Updated folder object
   */
  async updateFolderStats(folderId) {
    try {
      // Get all sessions for this folder
      const sessionsResult = await databases.listDocuments(
        this.databaseId,
        this.collectionsIds.sessions,
        [
          Query.equal('folderId', folderId),
          Query.limit(1000) // Reasonable limit for sessions per folder
        ]
      );

      const sessions = sessionsResult.documents;
      const totalSessions = sessions.length;
      const completedSessions = sessions.filter(session => session.status === 'completed').length;

      // Update the folder with new statistics
      const now = new Date().toISOString();
      const updatedFolder = await databases.updateDocument(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        folderId,
        {
          totalSessions,
          completedSessions,
          updatedAt: now
        }
      );

      console.log(`✅ Updated stats for folder ${folderId}: ${completedSessions}/${totalSessions} sessions`);
      return updatedFolder;

    } catch (error) {
      console.error('❌ Error updating folder stats:', error);
      throw new Error(`Failed to update folder stats: ${error.message}`);
    }
  }

  /**
   * Get all sessions within a specific folder
   * @param {string} folderId - The ID of the folder
   * @param {Object} [options] - Query options
   * @param {number} [options.limit=100] - Maximum number of sessions to return
   * @param {string} [options.orderBy='sessionNumber'] - Field to order by
   * @param {string} [options.orderDirection='asc'] - Order direction (asc/desc)
   * @returns {Promise<Array>} Array of session objects
   */
  async getSessionsInFolder(folderId, options = {}) {
    try {
      const { limit = 100, orderBy = 'sessionNumber', orderDirection = 'asc' } = options;
      
      const queries = [
        Query.equal('folderId', folderId),
        Query.limit(limit)
      ];

      // Add ordering
      if (orderDirection === 'desc') {
        queries.push(Query.orderDesc(orderBy));
      } else {
        queries.push(Query.orderAsc(orderBy));
      }

      const result = await databases.listDocuments(
        this.databaseId,
        this.collectionsIds.sessions,
        queries
      );

      return result.documents;

    } catch (error) {
      console.error('❌ Error fetching sessions in folder:', error);
      throw new Error(`Failed to fetch sessions in folder: ${error.message}`);
    }
  }

  /**
   * Get sessions with display-friendly session numbers for frontend
   * @param {string} folderId - The ID of the folder
   * @param {Object} [options] - Query options
   * @returns {Promise<Array>} Array of session objects with displaySessionNumber added
   */
  async getSessionsForDisplay(folderId, options = {}) {
    try {
      const sessions = await this.getSessionsInFolder(folderId, options);
      
      // Add displaySessionNumber to each session and sort numerically
      const sessionsWithDisplay = sessions.map(session => ({
        ...session,
        displaySessionNumber: this.getSessionDisplayNumber(session.sessionNumber),
        originalSessionNumber: session.sessionNumber // Keep original for reference
      }));

      // Sort by numeric value of displaySessionNumber for proper 1, 2, 3... order
      sessionsWithDisplay.sort((a, b) => {
        const numA = typeof a.displaySessionNumber === 'number' ? a.displaySessionNumber : parseInt(a.displaySessionNumber) || 0;
        const numB = typeof b.displaySessionNumber === 'number' ? b.displaySessionNumber : parseInt(b.displaySessionNumber) || 0;
        return numA - numB;
      });

      return sessionsWithDisplay;

    } catch (error) {
      console.error('❌ Error fetching sessions for display:', error);
      throw new Error(`Failed to fetch sessions for display: ${error.message}`);
    }
  }

  /**
   * Delete a folder and all its sessions
   * @param {string} folderId - The ID of the folder to delete
   * @param {boolean} [cascadeDelete=false] - Whether to delete associated sessions
   * @returns {Promise<void>}
   */
  async deleteFolder(folderId, cascadeDelete = false) {
    try {
      // If cascade delete, remove all sessions in this folder
      if (cascadeDelete) {
        const sessions = await this.getSessionsInFolder(folderId, { limit: 1000 });
        
        console.log(`🗑️  Deleting ${sessions.length} sessions in folder ${folderId}`);
        for (const session of sessions) {
          await databases.deleteDocument(
            this.databaseId,
            this.collectionsIds.sessions,
            session.$id
          );
        }
      } else {
        // Check if folder has sessions
        const sessions = await this.getSessionsInFolder(folderId, { limit: 1 });
        if (sessions.length > 0) {
          throw new Error('Cannot delete folder with existing sessions. Use cascadeDelete=true to delete sessions as well.');
        }
      }

      // Delete the folder
      await databases.deleteDocument(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        folderId
      );

      console.log(`✅ Deleted folder ${folderId}`);

    } catch (error) {
      console.error('❌ Error deleting folder:', error);
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }

  /**
   * Update a folder's basic information
   * @param {string} folderId - The ID of the folder to update
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.name] - New name for the folder
   * @param {string} [updateData.description] - New description for the folder
   * @param {string} [updateData.status] - New status (active, completed, paused)
   * @param {string} [updateData.endDate] - End date for the folder
   * @returns {Promise<Object>} Updated folder object
   */
  async updateFolder(folderId, updateData) {
    try {
      const now = new Date().toISOString();
      const updatedFolder = await databases.updateDocument(
        this.databaseId,
        this.collectionsIds.sessionFolders,
        folderId,
        {
          ...updateData,
          updatedAt: now
        }
      );

      console.log(`✅ Updated folder ${folderId}`);
      return updatedFolder;

    } catch (error) {
      console.error('❌ Error updating folder:', error);
      throw new Error(`Failed to update folder: ${error.message}`);
    }
  }

  /**
   * Extract display number from sessionNumber (e.g., "3 - Winter Therapy" → 3)
   * @param {string} sessionNumber - The full sessionNumber from database
   * @returns {number} The numeric part for display
   */
  getSessionDisplayNumber(sessionNumber) {
    if (typeof sessionNumber === 'string' && sessionNumber.includes(' - ')) {
      const num = parseInt(sessionNumber.split(' - ')[0]);
      return isNaN(num) ? sessionNumber : num;
    }
    return sessionNumber; // Return as-is if no folder format
  }

  /**
   * Get folder statistics for a student
   * @param {string} studentId - The ID of the student
   * @returns {Promise<Object>} Statistics object
   */
  async getFolderStatsForStudent(studentId) {
    try {
      const folders = await this.getFoldersForStudent(studentId);
      
      const stats = {
        totalFolders: folders.length,
        activeFolders: folders.filter(f => f.isActive).length,
        completedFolders: folders.filter(f => f.status === 'completed').length,
        totalSessions: folders.reduce((sum, f) => sum + f.totalSessions, 0),
        completedSessions: folders.reduce((sum, f) => sum + f.completedSessions, 0)
      };

      return stats;

    } catch (error) {
      console.error('❌ Error fetching folder stats:', error);
      throw new Error(`Failed to fetch folder stats: ${error.message}`);
    }
  }
}

// Export singleton instance
const sessionFolderService = new SessionFolderService();
export default sessionFolderService;

// Export class for testing
export { SessionFolderService };
