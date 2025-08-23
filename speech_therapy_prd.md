# Speech Therapy Web App - Product Requirements Document (PRD)

## Executive Summary

### Product Vision
A Next.js web application that bridges the gap between speech therapists and parents by providing a centralized platform for session management, progress tracking, and seamless communication focused on improving therapy outcomes for children.

### Problem Statement
Current speech therapy workflows lack efficient digital tools that:
- Enable parents to easily track their child's progress between sessions
- Provide clear communication channels between therapists and parents
- Organize session materials, homework, and payment tracking in one place
- Give parents visibility into what happens during therapy sessions

### Solution Overview
Our MVP delivers a dual-interface platform: a parent-focused dashboard centered around a visual "Journey Board" showing therapy progress, and an admin dashboard for therapists to manage students, sessions, and communications.

### Success Metrics
- **Parent Engagement**: 80% weekly active parent users
- **Session Completion**: 95% of assigned homework completed
- **Communication**: Average response time <24 hours between parents and therapists
- **User Satisfaction**: 4.5+ star rating from parent feedback

---

## Product Strategy

### Target Users

#### Primary Users - Parents
- **Demographics**: Parents of children (ages 3-12) receiving speech therapy
- **Tech Comfort**: Mixed (basic to intermediate smartphone/web users)
- **Primary Needs**: 
  - Understand child's progress
  - Access homework and practice materials
  - Communicate effectively with therapist
  - Track payment status

#### Secondary Users - Speech Therapists (Admins)
- **Demographics**: Licensed speech-language pathologists
- **Tech Comfort**: Intermediate (comfortable with professional software)
- **Primary Needs**:
  - Efficient session documentation
  - Parent communication management
  - Student progress tracking
  - Payment administration

### Market Positioning
**"The parental engagement platform that transforms speech therapy from isolated sessions into a collaborative journey."**

- **Direct Competitors**: None (most solutions focus solely on therapist workflows)
- **Indirect Competitors**: General practice management software, parent communication apps
- **Differentiation**: Parent-centric design with visual progress tracking

---

## Product Requirements

### Core Features (MVP)

#### 1. Authentication & User Management
**Objective**: Secure, role-based access with seamless onboarding

**Features**:
- Supabase Auth integration with email/password login
- Two distinct user roles: Parent and Admin (Teacher)
- Teacher-initiated parent account creation with magic link invites
- Profile management with basic information and avatars

**Acceptance Criteria**:
- Parents can only access their child's data
- Teachers can access all students under their care
- Secure password reset and email verification flows
- Mobile-responsive login experience

#### 2. Parent Dashboard & Journey Board
**Objective**: Provide parents with clear, visual progress tracking

**Features**:
- **Journey Board**: Visual timeline of all therapy sessions
- **Session Cards** displaying:
  - Session date and number
  - Status indicators (✔ Completed, 🔒 Locked, 🔓 Available)
  - Payment status badges (Paid/Unpaid)
  - Expandable content sections
- **Session Details**:
  - Teacher's session notes
  - Homework assignments and exercises
  - Supporting files (PDFs, images, videos)
  - Parent-teacher feedback thread per session
- **Mobile-first navigation dock**: Journey Board, Profile, Messages

**Acceptance Criteria**:
- Sessions display in chronological order
- Only unlocked sessions show full content
- Files load quickly and are mobile-viewable
- Parent feedback submits successfully with real-time updates

#### 3. Child Profile Management
**Objective**: Centralized child information and progress overview

**Features**:
- **Profile Card** containing:
  - Child's name, age, and photo
  - Therapy goals and focus areas
  - Overall progress indicator (X of Y sessions completed)
  - Key milestones and achievements
- **Progress Visualization**: Visual progress bar and completion metrics

**Acceptance Criteria**:
- Profile updates reflect immediately across the platform
- Progress calculations are accurate and real-time
- Images upload and display properly on all devices

#### 4. Communication System
**Objective**: Facilitate clear, organized parent-therapist communication

**Features**:
- **Session-level feedback**: Mini-threads within each session
- **Direct messaging**: Dedicated inbox for general communication
- **Real-time notifications**: In-app alerts for new messages
- **Message status tracking**: Read/unread indicators

**Acceptance Criteria**:
- Messages deliver instantly using Supabase Realtime
- Thread organization keeps session-specific and general communications separate
- Notification system works across desktop and mobile
- Message history persists and is searchable

#### 5. Admin (Teacher) Dashboard
**Objective**: Efficient student and session management for therapists

**Features**:
- **Student Management**:
  - Add new students and create linked parent accounts
  - Setup Journey Boards with customizable session counts
  - View all student profiles and progress summaries
- **Session Management**:
  - Create and schedule sessions
  - Upload session materials (notes, files, multimedia)
  - Mark sessions as completed and update payment status
  - Unlock next sessions in the journey
- **Communication Hub**:
  - Respond to parent feedback within sessions
  - Access direct messaging with all parents
  - View message priorities and response queue

**Acceptance Criteria**:
- Bulk operations available for common tasks
- File uploads support multiple formats (PDF, JPG, PNG, MP4)
- Session status updates reflect immediately on parent dashboard
- Admin can manage multiple students efficiently

---

## Technical Architecture

### Technology Stack

#### Frontend
- **Framework**: Next.js 14 with App Router
- **UI Components**: shadcn/ui with Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion for micro-interactions
- **Enhanced Components**: Magic UI for advanced interactions

#### Backend & Database
- **Backend-as-a-Service**: Supabase
- **Database**: PostgreSQL (Supabase-managed)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

#### Hosting & Deployment
- **Hosting**: Vercel
- **Domain**: Custom domain with SSL
- **CDN**: Vercel Edge Network
- **Analytics**: Vercel Analytics

### Database Schema

#### Core Tables

```sql
-- User profiles extending Supabase auth
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  role text CHECK (role IN ('admin', 'parent')),
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  avatar_url text,
  created_at timestamp DEFAULT now()
);

-- Child profiles
children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id),
  full_name text NOT NULL,
  age integer,
  profile_picture text,
  therapy_goals text,
  total_sessions integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Therapy sessions
sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  session_number integer NOT NULL,
  date date NOT NULL,
  status text CHECK (status IN ('locked', 'available', 'completed')),
  is_paid boolean DEFAULT false,
  notes text,
  homework text,
  created_at timestamp DEFAULT now()
);

-- Session file attachments
session_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('pdf', 'image', 'video')),
  file_size bigint,
  created_at timestamp DEFAULT now()
);

-- Session feedback threads
session_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id),
  message text NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Direct messages
messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES children(id),
  sender_id uuid REFERENCES profiles(id),
  receiver_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
);
```

#### Security Implementation
**Row Level Security (RLS) Policies**:
- Parents access only their child's data
- Teachers access all children under their care
- Message privacy between authorized participants only
- File access restricted to session participants

### API Design

#### Key Endpoints
```
GET /api/children/[id] - Get child profile and progress
GET /api/sessions?child_id=[id] - Get sessions for a child
POST /api/sessions/[id]/feedback - Add session feedback
GET /api/messages?child_id=[id] - Get message thread
POST /api/files/upload - Upload session files
PATCH /api/sessions/[id] - Update session status (admin only)
```

---

## User Experience Design

### Design System

#### Brand Identity
- **Name Options**: ClearPath, VoiceSteps, Speech Journey, TalkTrack
- **Personality**: Friendly, trustworthy, clean, professional
- **Target Emotion**: Confidence and progress

#### Color Palette
- **Primary**: Calming Blue (#3B82F6) - trust and learning
- **Secondary**: Warm Orange (#F97316) - encouragement and energy  
- **Background**: Clean Gray (#F9FAFB) - clarity and focus
- **Text**: Professional Gray (#374151) - readability
- **Success**: Progress Green (#22C55E) - achievement
- **Warning**: Attention Orange (#F59E0B) - unpaid status

#### Typography
- **Headings**: Inter (clean, modern)
- **Body**: Inter (consistency and readability)
- **Sizes**: Mobile-first responsive scale

### User Interface Architecture

#### Parent Dashboard (Mobile-First)
**Bottom Navigation Dock**:
1. **Journey Board** (default) - Timeline of sessions
2. **Profile** - Child information and progress overview  
3. **Messages** - Communication center

**Journey Board Layout**:
- Session cards in chronological order
- Expandable accordions for session details
- Clear visual hierarchy with status indicators
- Touch-friendly interaction zones

#### Admin Dashboard (Desktop-Optimized)
**Sidebar Navigation**:
- Students overview
- Session management
- Messages center
- Settings

**Main Content Areas**:
- Student grid with quick actions
- Session editor with rich media upload
- Communication panel with threading

### User Flows

#### Parent Onboarding Flow
1. Receive invitation email from therapist
2. Set password and complete profile
3. View child profile and therapy goals
4. Explore first available session
5. Submit first feedback/question

#### Session Completion Flow (Teacher)
1. Complete therapy session with child
2. Upload session notes and materials
3. Assign homework exercises
4. Mark session as completed
5. Unlock next session in journey
6. Update payment status

---

## Business Requirements

### Scalability Planning
**MVP Target**: Support 1 therapist, ~50 students
**Growth Plan**: 
- Phase 2: Multi-therapist practices (5-10 therapists)
- Phase 3: SaaS model for independent therapists
- Phase 4: Therapy center enterprise solution

### Resource Requirements
**Supabase Free Tier Limits**:
- 500 MB database storage
- 1 GB file storage  
- 50K monthly active users
- 500K edge function invocations

**Estimated Usage (50 students)**:
- ~100 users (parents + therapist)
- ~200 MB database (sessions, messages)
- ~800 MB files (documents, images, videos)
- ~10K monthly requests

**Cost Projection**: Free for MVP, ~$25/month at scale

### Compliance & Security
- **HIPAA Consideration**: While not technically required for educational therapy, implement privacy-first practices
- **Data Protection**: All PII encrypted, secure file storage, audit logging
- **Child Privacy**: No direct child accounts, parent-mediated access only

---

## Development Roadmap

### Phase 1: MVP Development (8-10 weeks)
**Weeks 1-2: Foundation**
- Next.js app setup with Supabase integration
- Authentication system and user roles
- Basic database schema implementation
- Core UI component library setup

**Weeks 3-4: Parent Dashboard**
- Journey Board with session timeline
- Session detail views and file display
- Child profile pages
- Mobile-responsive navigation

**Weeks 5-6: Admin Dashboard** 
- Student management interface
- Session creation and editing
- File upload and management
- Payment status tracking

**Weeks 7-8: Communication System**
- Session feedback threading
- Direct messaging interface
- Real-time notifications
- Message status tracking

**Weeks 9-10: Polish & Testing**
- UI/UX refinements
- Performance optimization
- Security testing
- User acceptance testing

### Phase 2: Enhancement & Growth (4-6 weeks)
- Advanced progress analytics
- Email notifications
- Mobile app (React Native/PWA)
- Multi-therapist support
- Automated session reminders

### Phase 3: Platform Expansion (8-12 weeks)
- SaaS multi-tenancy
- Payment processing integration
- Advanced reporting and analytics
- API for third-party integrations
- Marketplace for therapy resources

---

## Risk Assessment & Mitigation

### Technical Risks
**Risk**: Supabase vendor lock-in
**Mitigation**: Design abstracted data layer for potential migration

**Risk**: File storage costs scaling rapidly
**Mitigation**: Implement compression and CDN optimization

**Risk**: Real-time messaging performance at scale
**Mitigation**: Implement message batching and optimize subscriptions

### Business Risks
**Risk**: Low parent adoption/engagement
**Mitigation**: Extensive user testing and iterative UX improvements

**Risk**: Therapist workflow disruption
**Mitigation**: Gradual rollout with comprehensive training

**Risk**: Competitor entry with more resources
**Mitigation**: Focus on parent experience differentiation and rapid iteration

### Security Risks
**Risk**: Unauthorized access to child data
**Mitigation**: Comprehensive RLS policies and regular security audits

**Risk**: File upload vulnerabilities
**Mitigation**: Server-side validation, file type restrictions, virus scanning

---

## Success Metrics & KPIs

### User Engagement
- **Parent Weekly Active Users**: Target 80%
- **Session Interaction Rate**: Parents viewing >90% of completed sessions
- **Message Response Rate**: <24 hour average response time
- **Homework Completion Rate**: >75% of assigned exercises

### Product Performance
- **Page Load Speed**: <2 seconds on mobile
- **Uptime**: 99.9% availability
- **Error Rate**: <0.5% of user actions
- **File Upload Success**: >99% success rate

### Business Metrics
- **Customer Satisfaction**: 4.5+ stars from parent feedback
- **Therapist Efficiency**: 25% reduction in administrative time
- **Parent Communication**: 40% increase in parent-therapist interactions
- **Session Attendance**: Maintain >95% session completion rate

---

## Appendix

### Glossary
- **Journey Board**: Visual timeline showing all therapy sessions for a child
- **Session Card**: Individual session display with expandable content
- **RLS**: Row Level Security - database-level access control
- **MVP**: Minimum Viable Product - core features for initial release

### References
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [ASHA Guidelines for Speech Therapy](https://www.asha.org/)