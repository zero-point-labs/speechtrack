# 📁 Storage Setup Instructions

## Manual Appwrite Storage Setup

Since the automated script has project ID issues, please set up the storage buckets manually:

### 1. Create Storage Bucket in Appwrite Console

1. **Go to Appwrite Console** → Your Project → Storage
2. **Create Single Bucket:**
   - **Bucket ID:** `speechtrack-session-files`
   - **Name:** Session Files
   - **Permissions:** 
     - Read: `any`
     - Create: `any`  
     - Update: `any`
     - Delete: `any`
   - **Maximum file size:** 50MB
   - **Allowed file extensions:** `jpg,jpeg,png,gif,pdf,doc,docx,mp4,mov,avi,mp3,wav`
   - **Encryption:** Enabled
   - **Antivirus:** Enabled

### 2. Update .env.local

Add this line to your `.env.local` file:

```bash
# Storage Bucket
NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=speechtrack-session-files
```

✅ **You mentioned you already did this - perfect!**

### 3. File Preview System Ready!

Once the buckets are created and environment variables are added, the file management system will be fully functional with:

✅ **Drag & Drop Upload**
✅ **PDF Preview** with zoom and navigation
✅ **Image Gallery** with lightbox
✅ **Video Player** with controls
✅ **File Download** functionality
✅ **Beautiful Greek UI** integrated with existing design

## 🧪 Testing

After setup, test the file system by:
1. Going to Admin Panel → Edit any session
2. Scroll to "Υλικό Συνεδρίας" section
3. Upload files using drag & drop
4. Click "Προβολή" to preview files
5. Click "Λήψη" to download files

The system maintains your beautiful existing UI while adding powerful file management capabilities!
