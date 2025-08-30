// Simple R2 File Service - Clean implementation for PDF uploads
"use client";

export const fileServiceSimple = {
  /**
   * Upload a file to R2 via API
   * @param {File} file - The file to upload
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} The uploaded file data
   */
  async uploadFile(file, sessionId) {
    try {
      console.log(`📤 Uploading ${file.name} to session ${sessionId}`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Upload failed: ${error}`);
      }

      const result = await response.json();
      console.log(`✅ Upload successful: ${result.name}`);
      
      return result;

    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Σφάλμα κατά τη μεταφόρτωση του αρχείου');
    }
  },

  /**
   * Get files for a session from database
   * @param {string} sessionId - The session ID
   * @returns {Promise<Array>} List of files
   */
  async getSessionFiles(sessionId) {
    try {
      const response = await fetch(`/api/session-files/${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const files = await response.json();
      return files;

    } catch (error) {
      console.error('Error fetching files:', error);
      return [];
    }
  },

  /**
   * Delete a file
   * @param {string} fileId - The file ID
   * @param {string} sessionId - The session ID
   */
  async deleteFile(fileId, sessionId) {
    try {
      const response = await fetch(`/api/delete-file/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      console.log(`✅ File deleted: ${fileId}`);

    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Σφάλμα κατά τη διαγραφή του αρχείου');
    }
  },

  /**
   * Get file view URL (for PDFs and videos)
   * @param {string} fileId - The file database ID
   * @returns {string} View URL
   */
  getFileViewUrl(fileId) {
    return `/api/file-view/${fileId}`;
  },

  /**
   * Get file download URL
   * @param {string} fileId - The file database ID
   * @returns {string} Download URL
   */
  getFileDownloadUrl(fileId) {
    return `/api/file-download/${fileId}`;
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
   * @returns {string} File category
   */
  getFileCategory(mimeType) {
    if (mimeType?.includes('pdf')) return 'pdf';
    if (mimeType?.includes('image')) return 'image';
    if (mimeType?.includes('video')) return 'video';
    return 'other';
  }
};

export default fileServiceSimple;
