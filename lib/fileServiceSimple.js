// Simple R2 File Service - Clean implementation for PDF uploads
"use client";

export const fileServiceSimple = {
  /**
   * Upload a file to R2 via API (supports both direct upload for large files and traditional upload for small files)
   * @param {File} file - The file to upload
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} The uploaded file data
   */
  async uploadFile(file, sessionId) {
    try {
      const fileSize = this.formatFileSize(file.size);
      console.log(`📤 Uploading ${file.name} (${fileSize}) to session ${sessionId}`);
      
      // For files larger than 4MB, try presigned URL upload first, fall back to traditional if CORS fails
      const UPLOAD_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB
      
      if (file.size > UPLOAD_SIZE_LIMIT) {
        console.log(`🔍 Large file detected - attempting direct upload method`);
        return await this.uploadLargeFile(file, sessionId);
      } else {
        console.log(`✅ Small file - using traditional upload method`);
        return await this.uploadSmallFile(file, sessionId);
      }

    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Σφάλμα κατά τη μεταφόρτωση του αρχείου');
    }
  },

  /**
   * Upload small files via traditional serverless function
   * @param {File} file - The file to upload
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} The uploaded file data
   */
  async uploadSmallFile(file, sessionId) {
    console.log(`📤 Using traditional upload for small file: ${file.name}`);

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
    console.log(`✅ Small file upload successful: ${result.name}`);
    
    return result;
  },

  /**
   * Upload large files directly to R2 using presigned URLs (with CORS fallback)
   * @param {File} file - The file to upload
   * @param {string} sessionId - The session ID
   * @returns {Promise<Object>} The uploaded file data
   */
  async uploadLargeFile(file, sessionId) {
    console.log(`📤 Attempting presigned URL upload for large file: ${file.name}`);

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch('/api/upload-presigned', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          sessionId: sessionId,
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.text();
        throw new Error(`Failed to get presigned URL: ${error}`);
      }

      const { presignedUrl, fileId, r2Key } = await presignedResponse.json();

      // Step 2: Upload directly to R2
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Direct upload to R2 failed: ${uploadResponse.statusText}`);
      }

      console.log(`✅ Direct upload to R2 successful: ${file.name}`);

      // Step 3: Finalize by saving metadata to database
      const finalizeResponse = await fetch('/api/upload-finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: fileId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          sessionId: sessionId,
          r2Key: r2Key,
        }),
      });

      if (!finalizeResponse.ok) {
        const error = await finalizeResponse.text();
        throw new Error(`Failed to finalize upload: ${error}`);
      }

      const result = await finalizeResponse.json();
      console.log(`✅ Large file upload finalized: ${result.name}`);
      
      return result;

    } catch (error) {
      // If direct upload fails (likely CORS issue), fall back to traditional upload
      console.log(`⚠️ Direct upload failed: ${error.message}`);
      console.log(`🔄 Falling back to traditional upload for: ${file.name}`);
      
      return await this.uploadSmallFile(file, sessionId);
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
   */
  async deleteFile(fileId) {
    try {
      const response = await fetch(`/api/delete-file/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete file: ${errorText}`);
      }

      console.log(`✅ File deleted: ${fileId}`);

    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Σφάλμα κατά τη διαγραφή του αρχείου');
    }
  },

  /**
   * Get file information by ID
   * @param {string} fileId - The file database ID
   * @returns {Promise<Object>} File information
   */
  async getFileInfo(fileId) {
    try {
      const response = await fetch(`/api/file-info/${fileId}`);
      
      if (!response.ok) {
        throw new Error('File not found');
      }

      return await response.json();

    } catch (error) {
      console.error('Error fetching file info:', error);
      throw error;
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
