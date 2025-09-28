# Appwrite to Supabase Migration Plan

## Executive Summary

This is a **MAJOR MIGRATION** that will affect every aspect of the SpeechTrack application. The migration involves:
- 12 active database collections + 1 disabled collection
- Authentication system with role-based access
- File storage system (currently using Cloudflare R2)
- 14 API routes
- 4 major service layers
- Comprehensive user management system

**Estimated Time**: 4-6 weeks for complete migration and testing  
**Risk Level**: HIGH  
**Recommended Approach**: Phased migration with parallel systems  

---

## Current Appwrite Architecture Analysis

### Database Collections (12 Active)
1. **students** - Student profiles and basic info
2. **sessions** - Therapy sessions with complex status management
3. **sessionFiles** - File metadata and storage references
4. **sessionFeedback** - Session feedback from parents/therapists
5. **achievements** - Student achievements and milestones
6. **clientCodes** - Access codes for client onboarding
7. **usersExtended** - Extended user profile data
8. **achievementJourneys** - Custom achievement system
9. **journeyTemplates** - Achievement journey templates
10. **trophyLibrary** - Trophy/reward system
11. **sessionFolders** - Session organization system
12. **messages** - (DISABLED/REMOVED) - Communication system

### Authentication System
- **Email/password** authentication via Appwrite Auth
- **Role-based access**: Admin and Parent roles using labels
- **Extended user data** stored separately in database
- **Session management** with localStorage
- **User registration** with automatic extended data creation

### File Storage
- **Cloudflare R2** as storage backend
- **Appwrite Storage** as abstraction layer
- **Multi-tier upload** system (small/large file handling)
- **File types**: PDF, images, videos, audio
- **File organization**: By session ID

### API Layer (14 Routes)
1. `admin/delete-user/route.js` - CASCADE user deletion
2. `file-view/[fileId]/route.js` - File viewing
3. `file-info/[fileId]/route.js` - File metadata
4. `file-download/[fileId]/route.js` - File downloads
5. `delete-file/[fileId]/route.js` - File deletion
6. `session-files/[sessionId]/route.js` - Session file listing
7. `upload-finalize/route.js` - Upload completion
8. `upload-presigned/route.js` - Presigned URL generation
9. `upload-simple/route.js` - Simple file uploads
10. `file-proxy-hybrid/[fileId]/route.js` - Hybrid file proxy
11. `admin/session-folders/[folderId]/set-active/route.js` - Folder management
12. `admin/session-folders/[folderId]/route.js` - Folder operations
13. `admin/session-folders/[folderId]/sessions/route.js` - Folder sessions
14. `admin/session-folders/route.js` - Folder listing

### Service Layers (4 Major Services)
1. **Authentication Service** (`lib/auth.js`) - User management
2. **File Service** (`lib/fileServiceSimple.js`) - File operations
3. **Session Folder Service** (`lib/sessionFolderService.js`) - Session organization
4. **Achievement Service** (`lib/achievementService.js`) - Achievement system

---

## Migration Strategy: Phased Approach

### Phase 1: Foundation Setup (Week 1)
**Supabase Project Setup**
- [ ] Create new Supabase project
- [ ] Set up development and production environments
- [ ] Configure authentication settings
- [ ] Set up Row Level Security (RLS) policies

**Database Schema Migration**
- [ ] Create SQL schema for all collections
- [ ] Set up foreign key relationships
- [ ] Create database functions and triggers
- [ ] Set up database indexes for performance
- [ ] Create migration scripts for data transfer

### Phase 2: Authentication Migration (Week 1-2)
**Auth System Replacement**
- [ ] Replace Appwrite Auth with Supabase Auth
- [ ] Migrate user accounts (email/password)
- [ ] Implement role-based access with RLS
- [ ] Update authentication service layer
- [ ] Create user migration utilities

**User Data Migration**
- [ ] Migrate extended user data
- [ ] Update user profile management
- [ ] Test authentication flows

### Phase 3: Database Migration (Week 2-3)
**Collection-by-Collection Migration**
- [ ] Students collection → students table
- [ ] Sessions collection → sessions table  
- [ ] Session files collection → session_files table
- [ ] Session feedback → session_feedback table
- [ ] Achievements → achievements table
- [ ] Client codes → client_codes table
- [ ] Achievement journeys → achievement_journeys table
- [ ] Journey templates → journey_templates table
- [ ] Trophy library → trophy_library table
- [ ] Session folders → session_folders table

**Data Validation**
- [ ] Data integrity checks
- [ ] Relationship validation
- [ ] Performance testing

### Phase 4: Storage Integration (Week 3-4)
**File Storage Strategy: R2 + Supabase Database** ✅ **SELECTED**
- Keep all files in Cloudflare R2 (optimal performance & cost)
- Use Supabase for file metadata storage only
- Maintain existing R2 bucket structure and organization

**Implementation Tasks:**
- [ ] Update file service to use Supabase database instead of Appwrite
- [ ] Keep existing R2 upload/download logic
- [ ] Update file metadata storage to use `session_files` table
- [ ] Test file operations with new database backend
- [ ] **NO file migration needed** - all files stay in R2 ✅

### Phase 5: API Layer Migration (Week 4-5)
**API Route Conversion**
- [ ] Convert 14 API routes to Supabase-compatible versions
- [ ] Implement proper error handling
- [ ] Add logging and monitoring
- [ ] Update client-side API calls

**Service Layer Updates**
- [ ] Refactor authentication service
- [ ] Update file service
- [ ] Migrate session folder service
- [ ] Update achievement service

### Phase 6: Testing & Deployment (Week 5-6)
**Comprehensive Testing**
- [ ] Unit tests for all services
- [ ] Integration tests for API routes
- [ ] End-to-end testing
- [ ] Performance benchmarking
- [ ] Security testing

**Deployment Strategy**
- [ ] Blue-green deployment setup
- [ ] Database migration scripts
- [ ] Rollback procedures
- [ ] Monitoring setup

---

## Detailed Migration Mapping

### Database Schema Conversion

#### Appwrite Collections → Supabase Tables

**students → students**
```sql
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  age INTEGER NOT NULL,
  date_of_birth TIMESTAMP,
  profile_picture TEXT,
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'inactive', 'completed')),
  parent_id UUID REFERENCES auth.users(id),
  client_code VARCHAR(20) NOT NULL UNIQUE,
  join_date TIMESTAMP NOT NULL,
  next_session TIMESTAMP,
  parent_contact JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**sessions → sessions**
```sql
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  duration VARCHAR(50) NOT NULL,
  status TEXT CHECK (status IN ('locked', 'available', 'completed', 'cancelled')),
  is_paid BOOLEAN DEFAULT FALSE,
  is_gesy BOOLEAN DEFAULT FALSE,
  gesy_note TEXT,
  therapist_notes TEXT,
  original_date TIMESTAMP,
  folder_id UUID REFERENCES session_folders(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, session_number)
);
```

**sessionFiles → session_files**
```sql
CREATE TABLE session_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_id VARCHAR(100) NOT NULL,
  file_type TEXT CHECK (file_type IN ('pdf', 'image', 'video', 'audio')),
  file_size BIGINT NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**sessionFeedback → session_feedback**
```sql
CREATE TABLE session_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  author_type TEXT CHECK (author_type IN ('parent', 'therapist')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**achievements → achievements**
```sql
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('milestone', 'skill', 'breakthrough')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon TEXT CHECK (icon IN ('star', 'zap', 'trophy', 'award')),
  earned_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**clientCodes → client_codes**
```sql
CREATE TABLE client_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**usersExtended → users_extended**
```sql
CREATE TABLE users_extended (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  last_login_at TIMESTAMP,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**achievementJourneys → achievement_journeys**
```sql
CREATE TABLE achievement_journeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  template_id UUID REFERENCES journey_templates(id),
  current_step INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**journeyTemplates → journey_templates**
```sql
CREATE TABLE journey_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_steps INTEGER NOT NULL,
  steps JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**trophyLibrary → trophy_library**
```sql
CREATE TABLE trophy_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  requirements JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**sessionFolders → session_folders**
```sql
CREATE TABLE session_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  total_sessions INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

**Key Security Requirements:**
- Parents can only access their children's data
- Admins have full access
- Users can only modify their own profiles
- Files are protected by session access

---

## R2 + Supabase Integration Details

### Architecture Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App  │───▶│  Supabase Auth   │    │  Cloudflare R2  │
│                 │    │  + Database      │    │  File Storage   │
│   File Service  │───▶│                  │    │                 │
│   API Routes    │    │  File Metadata   │───▶│  Actual Files   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Updated File Service Implementation
```javascript
// lib/supabase-file.js
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
})

export const fileService = {
  async uploadFile(file, sessionId) {
    // 1. Upload to R2 (NO CHANGES to existing logic)
    const fileId = generateUniqueId()
    const r2Key = `sessions/${sessionId}/${fileId}_${file.name}`
    
    // Upload to R2 using existing logic
    await this.uploadToR2(file, r2Key)
    
    // 2. Save metadata to Supabase (UPDATED: was Appwrite)
    const { data, error } = await supabase
      .from('session_files')
      .insert({
        session_id: sessionId,
        file_name: file.name,
        file_id: fileId,
        file_type: this.getFileCategory(file.type),
        file_size: file.size,
        description: r2Key, // Store R2 key
        uploaded_by: userId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getFileInfo(fileId) {
    // Query Supabase instead of Appwrite
    const { data, error } = await supabase
      .from('session_files')
      .select('*')
      .eq('id', fileId)
      .single()
    
    if (error) throw error
    return data
  },

  // Keep ALL existing R2 methods unchanged
  async uploadToR2(file, r2Key) { /* existing R2 logic */ },
  getPresignedUrl(r2Key) { /* existing R2 logic */ },
  // ... etc
}
```

### API Routes Updates
```javascript
// app/api/upload-simple/route.js (Updated for Supabase)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  // 1. Upload to R2 (SAME as before)
  const r2Upload = await uploadToR2(file, r2Key)
  
  // 2. Save to Supabase DB (CHANGED from Appwrite)
  const { data, error } = await supabase
    .from('session_files')
    .insert({
      session_id: sessionId,
      file_name: file.name,
      file_id: fileId,
      file_type: getFileTypeCategory(file.type),
      file_size: file.size,
      description: r2Key,
      uploaded_by: 'admin'
    })
  
  if (error) throw error
  return NextResponse.json(data)
}
```

### Benefits of R2 + Supabase Approach
✅ **No file migration needed** - all files stay exactly where they are  
✅ **Keep existing R2 performance** - presigned URLs, CORS, CDN  
✅ **Minimal code changes** - only database calls change  
✅ **Cost effective** - R2 is cheaper than most alternatives  
✅ **Proven reliability** - your current R2 setup already works  

---

## Service Layer Migration

### Authentication Service Updates
```javascript
// From: lib/auth.js (Appwrite)
// To: lib/supabase-auth.js (Supabase)

// Key changes:
- Replace account.create() with supabase.auth.signUp()
- Replace account.createEmailPasswordSession() with supabase.auth.signIn()
- Replace account.get() with supabase.auth.getUser()
- Update role management to use RLS policies
- Migrate extended user data to users_extended table
```

### File Service Updates
```javascript
// From: lib/fileServiceSimple.js (R2 + Appwrite)
// To: lib/supabase-file.js (R2 + Supabase Database)

// Key changes:
- Replace Appwrite database calls with Supabase queries
- Keep ALL existing R2 upload/download logic (no changes needed)
- Update file metadata storage to use session_files table
- Update authentication context to use Supabase Auth
- Maintain presigned URL generation for large files
- Keep existing CORS fallback system
```

### API Routes Migration
- Convert from Appwrite server SDK to Supabase server client
- Update database queries to use SQL
- Implement proper RLS policy checks
- Update error handling patterns

---

## Data Migration Strategy

### Migration Scripts Required

1. **User Migration**
   - Export users from Appwrite Auth
   - Import to Supabase Auth
   - Migrate extended user data

2. **Database Migration**
   - Export all collections from Appwrite
   - Transform data to match new schema
   - Import to Supabase with relationship integrity

3. **File System Integration** (R2 + Supabase)
   - **NO file migration needed** - all files stay in R2 ✅
   - Update file metadata from Appwrite DB to Supabase DB
   - Test file upload/download with new database backend

### Migration Validation
- Data integrity checks
- Relationship validation
- File accessibility verification
- Authentication flow testing

---

## Risk Assessment & Mitigation

### HIGH RISKS
1. **Data Loss During Migration**
   - Mitigation: Complete backups, staged migration, validation scripts

2. **Authentication Disruption**
   - Mitigation: Parallel auth systems, gradual user migration

3. **File Storage Disruption** ⚠️ **RISK ELIMINATED** with R2 retention
   - Mitigation: Keep R2 unchanged - zero file migration risk

4. **Extended Downtime**
   - Mitigation: Blue-green deployment, rollback procedures

### MEDIUM RISKS
1. **Performance Degradation**
   - Mitigation: Load testing, index optimization

2. **Feature Compatibility**
   - Mitigation: Comprehensive testing, feature flagging

---

## Environment Variables Migration

### New Supabase Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Keep R2 if not migrating storage
CLOUDFLARE_R2_ENDPOINT=existing_r2_endpoint
CLOUDFLARE_R2_ACCESS_KEY_ID=existing_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=existing_secret_key
CLOUDFLARE_R2_BUCKET_NAME=existing_bucket_name
```

### Remove Appwrite Variables
```bash
# Remove these after migration:
NEXT_PUBLIC_APPWRITE_ENDPOINT
NEXT_PUBLIC_APPWRITE_PROJECT_ID
APPWRITE_API_KEY
NEXT_PUBLIC_APPWRITE_DATABASE_ID
# ... all collection IDs
# ... all bucket IDs
```

---

## Timeline & Resource Requirements

### Timeline Breakdown ⚡ **REDUCED COMPLEXITY** with R2 retention
- **Week 1**: Foundation setup, schema design
- **Week 2**: Authentication migration
- **Week 3**: Database migration (all collections)
- **Week 4**: API migration + R2 integration (simplified - no file moves)
- **Week 5**: Testing and validation
- **Week 6**: Deployment and monitoring

**Time Savings**: ~1 week saved by not migrating files 🎉

### Required Resources
- **Development Time**: 4-6 weeks full-time
- **Testing Environment**: Parallel Supabase project
- **Backup Infrastructure**: Complete data backups
- **Monitoring Tools**: Migration progress tracking

### Success Metrics
- **Zero data loss**
- **Authentication success rate > 99.9%**
- **File accessibility rate > 99.9%**
- **Performance within 10% of current**
- **Zero critical bugs in first week post-migration**

---

## Post-Migration Cleanup

### Immediate (Week 1)
- [ ] Verify all functionality
- [ ] Monitor performance metrics
- [ ] Address any critical issues
- [ ] Update documentation

### Short-term (Weeks 2-4)
- [ ] Remove Appwrite dependencies
- [ ] Clean up environment variables
- [ ] Archive migration scripts
- [ ] Optimize Supabase configuration

### Long-term (Months 1-2)
- [ ] Performance optimization
- [ ] Cost optimization
- [ ] Feature enhancements using Supabase features
- [ ] Team training on Supabase

---

## Conclusion

This migration is a significant undertaking that will touch every part of your application. The phased approach minimizes risk while ensuring a thorough migration. The key to success is careful planning, comprehensive testing, and having robust rollback procedures in place.

**Recommendation**: Consider starting with a development environment migration first to validate the entire process before touching production data.

Would you like to proceed with any specific phase, or do you need more details about any particular aspect of this migration plan?
