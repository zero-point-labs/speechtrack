// File upload and management service for Appwrite Storage
import { storage, appwriteConfig } from './appwrite.client';
import { ID } from 'appwrite';

export const fileService = {
  /**
   * Upload a file to Appwrite Storage
   * @param {File} file - The file to upload
   * @param {string} sessionId - The session ID to associate with the file
   * @returns {Promise<Object>} The uploaded file data
   */
  async uploadFile(file, sessionId) {
    try {
      const fileId = ID.unique();
      
      // Create a new File object with session ID in the name for association
      const fileWithSessionId = new File([file], `${sessionId}_${file.name}`, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      const response = await storage.createFile(
        appwriteConfig.buckets.files,
        fileId,
        fileWithSessionId
      );

      // Return formatted file data
      return {
        id: response.$id,
        name: response.name,
        type: file.type,
        size: response.sizeOriginal,
        url: fileService.getFileViewUrl(response.$id),
        downloadUrl: fileService.getFileDownloadUrl(response.$id),
        uploadDate: response.$createdAt,
        sessionId: sessionId
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Σφάλμα κατά τη μεταφόρτωση του αρχείου');
    }
  },

  /**
   * Get file preview URL
   * @param {string} fileId - The file ID
   * @returns {string} Preview URL
   */
  getFilePreviewUrl(fileId) {
    try {
      // For image previews, we can still use direct Appwrite URLs as they usually work
      // But if needed, we can also proxy these
      const endpoint = appwriteConfig.endpoint;
      const projectId = appwriteConfig.projectId;
      const bucketId = appwriteConfig.buckets.files;
      
      return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/preview?project=${projectId}&width=2000&height=2000&gravity=center&quality=100&output=jpg`;
    } catch (error) {
      console.error('Error generating preview URL:', error);
      return '';
    }
  },

  /**
   * Get file download URL
   * @param {string} fileId - The file ID
   * @returns {string} Download URL
   */
  getFileDownloadUrl(fileId) {
    try {
      // Use our proxy API to avoid CORS issues
      const url = `/api/file-proxy/${fileId}?action=download`;
      console.log('Generated download URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating download URL:', error);
      return '';
    }
  },

  /**
   * Get file view URL (for PDFs and videos)
   * @param {string} fileId - The file ID
   * @returns {string} View URL
   */
  getFileViewUrl(fileId) {
    try {
      // Use our proxy API to avoid CORS issues
      const url = `/api/file-proxy/${fileId}?action=view`;
      console.log('Generated view URL:', url);
      return url;
    } catch (error) {
      console.error('Error generating view URL:', error);
      return '';
    }
  },

  /**
   * Delete a file from storage
   * @param {string} fileId - The file ID to delete
   */
  async deleteFile(fileId) {
    try {
      await storage.deleteFile(
        appwriteConfig.buckets.files,
        fileId
      );
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Σφάλμα κατά τη διαγραφή του αρχείου');
    }
  },

  /**
   * List files for a session
   * @param {string} sessionId - The session ID
   * @returns {Promise<Array>} List of files
   */
  async getSessionFiles(sessionId) {
    try {
      // In a real implementation, you might store session files in a database
      // and query by sessionId. For now, this is a placeholder.
      const files = await storage.listFiles(appwriteConfig.buckets.files);
      
      // Filter by session if you have a way to associate files with sessions
      return files.files.map(file => ({
        id: file.$id,
        name: file.name,
        type: file.mimeType,
        size: file.sizeOriginal,
        url: fileService.getFileViewUrl(file.$id),
        downloadUrl: fileService.getFileDownloadUrl(file.$id),
        uploadDate: file.$createdAt,
        sessionId: sessionId // This would need to be stored separately
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted size string
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file type category
   * @param {string} mimeType - The file MIME type
   * @returns {string} File category (pdf, image, video, other)
   */
  getFileCategory(mimeType) {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    return 'other';
  }
};

export default fileService;
