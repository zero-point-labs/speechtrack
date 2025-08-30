# Parent Onboarding Restructure Plan

## Overview
This document outlines the plan to restructure the parent-student relationship flow from a client-code-based system to a parent-initiated onboarding system.

## Current System Analysis

### Current Flow:
1. **Admin/Therapist Side:**
   - Creates a student profile with all details (name, age, parent contact)
   - System generates a unique client code
   - Therapist gives this code to the parent
   - Creates sessions automatically based on templates

2. **Parent Side:**
   - Signs up with email/password
   - Redirected to `/link-client-code` page
   - Must enter client code to proceed
   - Once linked, can access dashboard with pre-created student data

### Current Database Structure:
- **students collection:** Contains parentId, clientCode, parentContact (JSON)
- **client_codes collection:** Tracks code usage and linking
- **sessions collection:** Pre-created by admin
- **messages collection:** Links to studentId

## New System Design

### New Flow:
1. **Parent Side:**
   - Signs up with email, phone, password
   - Redirected to onboarding flow (`/onboarding`)
   - Creates child profile (name, date of birth, etc.)
   - Completes onboarding and accesses dashboard
   - Sessions area shows "No sessions scheduled yet"

2. **Admin/Therapist Side:**
   - Views "Users" tab showing all parents
   - Clicks on a parent to see their children
   - Can generate session templates for any child
   - Can delete users (CASCADE deletes all their data)
   - Sessions become visible to parents immediately after creation

### Database Changes Required:

#### 1. Remove/Deprecate:
- `client_codes` collection (entire collection)
- `clientCode` attribute from `students` collection
- `parentContact` attribute from `students` collection (redundant with parent user)

#### 2. Add New Collections:
- **users_extended** (or modify Appwrite auth to store extra fields):
  ```javascript
  {
    userId: string (links to Appwrite Auth),
    phone: string,
    address: string (optional),
    createdAt: datetime,
    lastLoginAt: datetime
  }
  ```

#### 3. Modify Existing Collections:

**students collection:**
- Remove: `clientCode`, `parentContact`
- Keep: `parentId` (now set during onboarding)
- No approval fields needed - children are active immediately

**sessions collection:**
- No changes needed (still created by admin)

**messages collection:**
- No changes needed (already uses studentId)

### User Deletion (CASCADE) Strategy:

When an admin deletes a user, the following should be deleted automatically:
1. **User account** (from Appwrite Auth)
2. **User extended data** (from users_extended collection)
3. **All children** linked to that parentId
4. **All sessions** for those children
5. **All session files** for those sessions
6. **All messages** for those children
7. **All achievements** for those children
8. **All session feedback** for those sessions
9. **Storage files** associated with sessions

This ensures complete data cleanup and GDPR compliance.

### Key Code Changes:

#### 1. Authentication Flow:
- **Remove:** `/link-client-code` page
- **Remove:** Client code validation APIs
- **Update:** `/signup` to collect phone number
- **Update:** After signup, redirect to `/onboarding` instead of `/link-client-code`
- **Update:** `lib/auth.js` to remove all client code utilities

#### 2. New Pages:
- **Create:** `/onboarding` - Multi-step form for parent to create child profile
- **Create:** `/admin/users` - List all parent users
- **Create:** `/admin/users/[userId]` - View parent details and their children

#### 3. Dashboard Updates:
- **Update:** `/dashboard` to handle multiple children (if parent adds more later)
- **Update:** Show "No sessions scheduled" state when child has no sessions
- **Add:** Child selector if parent has multiple children

#### 4. Admin Panel Updates:
- **Remove:** "Create Student" page (or repurpose for edge cases)
- **Update:** Main admin page to show recent activity instead of student list
- **Create:** Users management section
- **Update:** Session creation to work from user/child view

#### 5. Components to Create:
- `ChildProfileForm` - Reusable form for child data
- `UsersList` - Admin component to display parents with delete functionality
- `UserDetailCard` - Shows parent info and their children
- `SessionTemplateGenerator` - Move session generation logic to separate component
- `DeleteUserModal` - Confirmation dialog for user deletion with cascade warning

### Migration Strategy:

#### Phase 1: Database Preparation
1. Add new attributes to collections
2. Create users_extended collection
3. Add migration script for existing data

#### Phase 2: Parent Flow Implementation
1. Update signup page
2. Create onboarding flow
3. Update dashboard for no-sessions state
4. Test parent experience end-to-end

#### Phase 3: Admin Flow Implementation
1. Create users management pages
2. Add user deletion with cascade functionality
3. Update session creation flow from user/child view
4. Test admin experience end-to-end

#### Phase 4: Cleanup
1. Remove client code pages and APIs
2. Remove deprecated database attributes
3. Update all imports and dependencies
4. Clean up unused components

### Benefits of New System:

1. **Better User Experience:**
   - Parents don't need to wait for therapist
   - More intuitive onboarding
   - Parents own their data
   - Immediate access after signup

2. **Admin Control:**
   - See all users in one place
   - Full control to delete users and their data
   - Better oversight of system usage
   - Clean data management

3. **Scalability:**
   - Parents can add multiple children
   - No code generation/management overhead
   - Simpler database structure
   - Easy user management

4. **Flexibility:**
   - Parents update their own info
   - Therapists focus on therapy planning
   - System can grow with families
   - Easy to remove inactive users

### Risk Mitigation:

1. **Data Migration:**
   - Create backup before changes
   - Test migration scripts thoroughly
   - Keep old fields temporarily for rollback

2. **User Communication:**
   - Notify existing users of changes
   - Provide support during transition
   - Create help documentation

3. **Testing:**
   - Extensive testing of new flows
   - Beta test with small group
   - Monitor for issues post-launch

## Implementation Order:

1. **Week 1:** Database changes and migration scripts
2. **Week 2:** Parent onboarding flow
3. **Week 3:** Admin users management
4. **Week 4:** Testing and refinement
5. **Week 5:** Deployment and monitoring

## Next Steps:

1. Review and approve this plan
2. Create detailed technical specifications
3. Set up development environment for changes
4. Begin Phase 1 implementation
