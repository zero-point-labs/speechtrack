# Session Folders Implementation Plan

## Overview
Transform the flat session management system into an organized folder-based system where sessions are grouped into "Session Folders" or "Therapy Periods". This allows for better organization of long-term students who may attend therapy for multiple years.

## Current System Analysis

### Current Workflow:
1. **Admin**: Create student → Create session template → All sessions stored flat
2. **Parent**: View all sessions for child in dashboard
3. **Database**: Sessions linked only by `studentId`, no grouping

### Current Database Structure:
```javascript
sessions: {
  $id: string,
  studentId: string,
  sessionNumber: number,
  title: string,
  date: string,
  status: 'locked' | 'available' | 'completed' | 'cancelled',
  // ... other fields
}
```

### Problems:
- Long-term students have 100+ sessions in one flat list
- No organization by therapy periods/years
- Difficult to manage multi-year students
- No way to separate completed therapy periods from current ones

## Proposed Solution: Session Folders System

### Core Concept:
- **Session Folders**: Containers that group 10-50 related sessions
- **Therapy Periods**: Each folder represents one period of therapy (e.g., "2024 Therapy", "Advanced Speech Program")
- **Active Folder**: One folder per student is marked as "active" and visible to parents
- **Folder Management**: Admin can create, manage, and switch between folders

### New Workflow:
1. **Admin**: Create student → Create session folder → Create sessions within folder
2. **Parent**: View sessions from active folder only
3. **Database**: Sessions linked to both `studentId` and `folderId`

## Database Schema Changes

### 1. New Collection: `session_folders`
```javascript
session_folders: {
  $id: string,
  studentId: string,          // Links to student
  name: string,               // "2024 Therapy Program", "Advanced Speech"
  description?: string,       // Optional description
  isActive: boolean,          // Only one active folder per student
  totalSessions: number,      // Expected total sessions in this folder
  completedSessions: number,  // Completed sessions count
  startDate: string,          // When this therapy period started
  endDate?: string,           // When this therapy period ended (optional)
  status: 'active' | 'completed' | 'paused',
  createdAt: string,
  updatedAt: string
}
```

### 2. Update Collection: `sessions`
```javascript
sessions: {
  // ... existing fields
  folderId: string,           // NEW: Links to session folder
  // sessionNumber becomes relative to folder, not global
}
```

### 3. Database Indexes to Add:
```javascript
// session_folders collection
{ key: 'studentId_idx', type: 'key', attributes: ['studentId'] }
{ key: 'active_folder_idx', type: 'key', attributes: ['studentId', 'isActive'] }

// sessions collection  
{ key: 'folderId_idx', type: 'key', attributes: ['folderId'] }
{ key: 'folder_session_idx', type: 'unique', attributes: ['folderId', 'sessionNumber'] }
```

## Implementation Tasks

### Phase 1: Database & Backend Setup

#### Task 1.1: Create Database Migration Script
- **File**: `scripts/setup-session-folders.js`
- **Purpose**: Create `session_folders` collection with proper attributes and indexes
- **Actions**:
  - Create collection with schema above
  - Add indexes for performance
  - Add collection ID to appwrite.config.js

#### Task 1.2: Add Migration Script for Existing Data  
- **File**: `scripts/migrate-sessions-to-folders.js`
- **Purpose**: Create default folders for existing students and link their sessions
- **Actions**:
  - For each student with sessions:
    - Create a default folder "Existing Sessions"
    - Update all their sessions to include `folderId`
    - Mark folder as active

#### Task 1.3: Update Appwrite Configuration
- **File**: `lib/appwrite.config.js`
- **Actions**:
  - Add `sessionFolders` collection ID
  - Add environment variable for collection

### Phase 2: Admin Interface - New Unified Admin Page

#### Task 2.1: Create New Admin Test Page
- **File**: `app/admin/page-new.tsx` (test version)
- **Purpose**: Unified admin interface combining best elements from existing pages
- **Features**:
  - User list section (from `/admin/users`)
  - User details expansion (from `/admin/users/[userId]`)
  - Session folder management (new)
  - Session creation within folders (enhanced)

#### Task 2.2: Session Folder Management Components
- **File**: `components/admin/SessionFolderManager.tsx`
- **Purpose**: Manage folders for a specific student
- **Features**:
  - List existing folders for student
  - Create new folder button
  - Set active folder toggle
  - Delete folder (with confirmation)
  - Folder statistics (total/completed sessions)

#### Task 2.3: Enhanced Session Creation
- **File**: `app/admin/create-session/page.tsx` (modify existing)
- **Purpose**: Update session creation to work within folders
- **Changes**:
  - Add folder selection/creation
  - Session numbers relative to folder
  - Update session creation logic
  - Handle folder session counting

#### Task 2.4: Folder View Component
- **File**: `components/admin/FolderSessionView.tsx`  
- **Purpose**: Show all sessions within a specific folder
- **Features**:
  - Session list for folder
  - Edit/delete sessions
  - Add new sessions to folder
  - Session status management
  - Similar to current admin session view but folder-scoped

### Phase 3: Admin Interface - User Management Enhancement

#### Task 3.1: Enhanced User Detail View
- **File**: `app/admin/users/[userId]/page.tsx` (modify existing)
- **Purpose**: Add folder management to user detail page
- **Changes**:
  - Add folder list below each child card
  - "Create New Session Folder" button per child
  - Quick folder statistics
  - Link to detailed folder management

#### Task 3.2: Admin Navigation Updates
- **File**: `app/admin/layout.tsx` or relevant navigation files
- **Purpose**: Add navigation to new admin interfaces
- **Changes**:
  - Add link to new unified admin page
  - Update existing navigation as needed

### Phase 4: Parent Dashboard Updates

#### Task 4.1: Update Session Queries
- **Files**: 
  - `app/dashboard/page.tsx`
  - `app/dashboard/session/[sessionId]/page.tsx`
  - Any other dashboard components
- **Purpose**: Filter sessions by active folder instead of just studentId
- **Changes**:
  - Query active folder for student
  - Filter sessions by `folderId` instead of just `studentId`
  - Maintain existing UI/UX
  - Add folder name to session context (optional)

#### Task 4.2: Dashboard Session Components
- **Files**:
  - `components/SessionSnakeBoard.tsx`
  - `components/EnhancedProgressCard.tsx`
  - `components/HeroStepsProgress.tsx`
  - Any other session display components
- **Purpose**: Update to work with folder-based sessions
- **Changes**:
  - Update session data structure expectations
  - Handle folder-based session numbering
  - Maintain existing functionality

### Phase 5: Backend API Updates

#### Task 5.1: Session Management APIs
- **Files**: Create new API routes or update existing ones
- **Routes Needed**:
  - `POST /api/admin/session-folders` - Create new folder
  - `GET /api/admin/session-folders/[studentId]` - Get folders for student
  - `PUT /api/admin/session-folders/[folderId]` - Update folder (set active, etc.)
  - `DELETE /api/admin/session-folders/[folderId]` - Delete folder
  - `GET /api/admin/session-folders/[folderId]/sessions` - Get sessions in folder

#### Task 5.2: Update Session Creation APIs
- **Files**: Update existing session creation logic
- **Purpose**: Create sessions within folders
- **Changes**:
  - Accept `folderId` parameter
  - Update session numbering logic (relative to folder)
  - Update folder statistics when sessions are created/updated

### Phase 6: Helper Services & Utilities

#### Task 6.1: Session Folder Service
- **File**: `lib/sessionFolderService.js`
- **Purpose**: Centralized service for folder operations
- **Functions**:
  - `createFolder(studentId, folderData)`
  - `getActiveFolderForStudent(studentId)`
  - `setActiveFolder(studentId, folderId)`
  - `getFoldersForStudent(studentId)`
  - `deleteFolder(folderId)` (with cascade)
  - `updateFolderStats(folderId)`

#### Task 6.2: Migration Utilities
- **File**: `lib/migrationUtils.js`
- **Purpose**: Utilities for data migration and cleanup
- **Functions**:
  - `migrateStudentSessions(studentId)`
  - `validateFolderConsistency()`
  - `repairFolderData()`

### Phase 7: Testing & Validation

#### Task 7.1: Create Test Data Scripts
- **File**: `scripts/create-test-session-folders.js`
- **Purpose**: Create test data for development and testing
- **Actions**:
  - Create sample students with multiple folders
  - Create sessions in different folders
  - Test active/inactive folder scenarios

#### Task 7.2: Data Validation Scripts
- **File**: `scripts/validate-session-folders.js`
- **Purpose**: Validate data integrity after migration
- **Checks**:
  - Every session has valid folderId
  - Every student has exactly one active folder
  - Folder session counts are accurate
  - No orphaned sessions or folders

#### Task 7.3: Integration Testing
- **Purpose**: Test complete workflow
- **Scenarios**:
  - Create new student with folder
  - Migrate existing student data
  - Create multiple folders for student
  - Switch active folders
  - Parent dashboard shows correct sessions
  - Admin can manage folders properly

## Detailed Implementation Strategy

### Database Migration Strategy:
1. **Backwards Compatibility**: Keep existing sessions working during migration
2. **Gradual Migration**: Migrate students one by one, not all at once
3. **Rollback Plan**: Ability to revert if issues arise
4. **Data Validation**: Comprehensive checks after migration

### Admin Interface Strategy:
1. **Test Page First**: Create new admin page (`page-new.tsx`) without breaking existing
2. **Component Reuse**: Leverage existing components where possible
3. **Progressive Enhancement**: Add folder features to existing workflows
4. **User Training**: Clear UI that guides therapists through new folder concept

### Parent Dashboard Strategy:
1. **Transparent Changes**: Parents shouldn't notice major changes in UX
2. **Performance**: Ensure folder-based queries are fast
3. **Error Handling**: Graceful handling if no active folder exists
4. **Backwards Compatibility**: Handle edge cases during transition

## File Structure Changes

### New Files to Create:
```
/scripts/
  - setup-session-folders.js
  - migrate-sessions-to-folders.js
  - create-test-session-folders.js
  - validate-session-folders.js

/app/admin/
  - page-new.tsx (test version of unified admin)

/components/admin/
  - SessionFolderManager.tsx
  - FolderSessionView.tsx

/lib/
  - sessionFolderService.js
  - migrationUtils.js

/app/api/admin/session-folders/
  - route.js (CRUD operations)
  - [folderId]/route.js
  - [folderId]/sessions/route.js
```

### Files to Modify:
```
/lib/appwrite.config.js (add collection)
/app/admin/create-session/page.tsx (folder integration)
/app/admin/users/[userId]/page.tsx (add folder management)
/app/dashboard/page.tsx (filter by active folder)
/components/SessionSnakeBoard.tsx (folder-aware)
/components/EnhancedProgressCard.tsx (folder-aware)
/components/HeroStepsProgress.tsx (folder-aware)
```

## Implementation Timeline

### Week 1: Database & Backend Foundation
- Tasks 1.1, 1.2, 1.3 (Database setup and migration)
- Task 6.1 (Session folder service)
- Task 5.1 (Basic APIs)

### Week 2: Admin Interface Core
- Task 2.1 (New admin page)
- Task 2.2 (Folder manager component)
- Task 2.3 (Enhanced session creation)

### Week 3: Admin Interface Polish
- Task 2.4 (Folder view component)
- Task 3.1 (Enhanced user detail view)
- Task 3.2 (Navigation updates)

### Week 4: Parent Dashboard & Testing
- Task 4.1, 4.2 (Dashboard updates)
- Task 7.1, 7.2, 7.3 (Testing and validation)

## Risk Mitigation

### Data Loss Prevention:
- Complete database backup before migration
- Test migration on copy of production data
- Incremental migration with validation at each step

### User Experience:
- Maintain existing admin page during development
- Comprehensive testing of parent dashboard
- Clear documentation for therapists

### Performance:
- Proper database indexing for folder queries
- Optimize dashboard queries for active folder filtering
- Monitor query performance after implementation

## Success Criteria

### Functional Requirements:
- [ ] Therapists can create session folders for students
- [ ] Sessions are properly grouped within folders
- [ ] Only active folder sessions show in parent dashboard
- [ ] Therapists can switch active folders
- [ ] Multi-year students can be managed effectively

### Technical Requirements:
- [ ] Data integrity maintained during migration
- [ ] No performance degradation in dashboard
- [ ] All existing functionality preserved
- [ ] Clean, maintainable code structure

### User Experience Requirements:
- [ ] Intuitive folder management for therapists
- [ ] Seamless experience for parents
- [ ] Clear organization of long-term student data
- [ ] Easy switching between therapy periods

This comprehensive plan provides a structured approach to implementing the session folders system while maintaining system stability and user experience.
