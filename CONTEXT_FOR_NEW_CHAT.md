# Context for New Chat - File Management Issues

## Current Project State

This is a Next.js 14 speech therapy management application with:
- **Frontend**: Next.js 14 with App Router, shadcn/ui, Tailwind CSS
- **Backend**: Appwrite (Database, Authentication, Storage)
- **File Management**: react-pdf, react-photo-view, react-player, react-dropzone

## Authentication & Database
- ✅ **Working**: User authentication with admin/parent roles using Appwrite labels
- ✅ **Working**: Database with collections (students, sessions, client_codes, etc.)
- ✅ **Working**: Session CRUD operations (create, read, update, delete)

## Current File Management Problems

### 🚨 CRITICAL ISSUES TO FIX:

1. **Dashboard Still Shows Mock Data**
   - Location: `app/dashboard/page.tsx` 
   - Problem: Despite file loading logic, dashboard shows Greek mock file names instead of real uploaded files
   - Expected: Should show actual files uploaded via admin panel

2. **Admin Preview Not Working**
   - Location: `app/admin/edit/[sessionId]/page.tsx`
   - Problem: Clicking "Προβολή" (Preview) button doesn't open file preview modal
   - Expected: Should open FilePreview component with PDF/image/video preview

3. **Admin Doesn't Show Existing Files**
   - Location: `app/admin/edit/[sessionId]/page.tsx`
   - Problem: When editing a session that has uploaded files, the files don't appear in the materials sections
   - Expected: Should show previously uploaded files when editing a session

## Current File Management Implementation

### File Upload Process:
```javascript
// In admin edit session page
const uploadedFile = await fileService.uploadFile(file, sessionData.id);
```

### File Storage Structure:
- **Bucket**: `speechtrack-session-files` (single bucket due to plan limitations)
- **File Naming**: Files uploaded with `sessionId_filename` prefix for association
- **Environment**: `NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID`

### Key Files & Components:

1. **`lib/fileService.js`** - File upload/download service
2. **`components/FilePreview.tsx`** - Modal for previewing files
3. **`components/FileUpload.tsx`** - Drag & drop upload component  
4. **`app/admin/edit/[sessionId]/page.tsx`** - Admin session editing with file upload
5. **`app/dashboard/page.tsx`** - Parent dashboard with file viewing

## Recent Changes Made (That Didn't Work):

1. **Modified `fileService.uploadFile`** to prefix filenames with sessionId
2. **Updated dashboard file loading** to filter by `file.name.startsWith(sessionId_)`
3. **Added file loading to admin edit page** in `loadSessionData` function
4. **Fixed PDF preview URLs** to use `getFileDownload` instead of `getFileView`

## File Management UI Structure:

### Admin Edit Session (`app/admin/edit/[sessionId]/page.tsx`):
```jsx
// Three separate upload sections:
- PDF Files: Red "Προσθήκη PDF" button
- Videos: Purple "Προσθήκη Βίντεο" button  
- Images: Blue "Προσθήκη Εικόνων" button

// Each file shows:
- Preview button ("Προβολή" / "Αναπαραγωγή")
- Download button ("Λήψη")
- Delete button ("Διαγραφή")
```

### Dashboard Session Modal (`app/dashboard/page.tsx`):
```jsx
// File sections in session modal:
- PDFs: "Έγγραφα PDF" with preview/download buttons
- Videos: "Βίντεο" with play button
- Images: "Συλλογή Εικόνων" with gallery view
```

## Appwrite Configuration:

### Storage:
- Single bucket: `speechtrack-session-files`
- Files uploaded with session association via filename prefix

### Collections:
- `students`: Student profiles
- `sessions`: Session data (linked to students)
- `client_codes`: Parent-student linking codes

## Environment Variables Needed:
```bash
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=
NEXT_PUBLIC_APPWRITE_SESSION_FILES_BUCKET_ID=
# ... other collection IDs
```

## Expected File Flow:

1. **Admin uploads file** → File stored in Appwrite with `sessionId_filename`
2. **Admin edits same session** → Shows previously uploaded files
3. **Admin previews file** → Opens FilePreview modal
4. **Parent views dashboard** → Shows real files from that session
5. **Parent previews file** → Opens FilePreview modal

## Current Status:
- ✅ File upload works (files reach Appwrite Storage)
- ❌ Dashboard shows mock data instead of real files
- ❌ Admin preview buttons don't work
- ❌ Admin doesn't show existing files when editing sessions

## Debug Information Needed:

1. **Check Appwrite Storage**: Are files actually being uploaded with correct names?
2. **Check file association logic**: Is the `sessionId_` prefix working?
3. **Check FilePreview component**: Is it receiving correct file URLs?
4. **Check console errors**: Any JavaScript errors when clicking preview?

## Next Steps:
The new assistant should focus on debugging and fixing these three core issues:
1. Make dashboard load real files instead of mock data
2. Fix admin file preview functionality  
3. Make admin show existing files when editing sessions

The file management infrastructure is mostly in place, but the data loading and preview functionality needs debugging and fixes.
