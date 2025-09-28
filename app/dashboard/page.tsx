"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ParentRoute, useLogout, useAuth } from "@/lib/auth-middleware";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { databases, storage, appwriteConfig, Query } from "@/lib/appwrite.client";
import { fileServiceSimple as fileService } from "@/lib/fileServiceSimple";
import FilePreview from "@/components/FilePreview";
import SessionSnakeBoard from "@/components/SessionSnakeBoard";
import FolderInfoModal from "@/components/FolderInfoModal";
import RotatingBanner from "@/components/RotatingBanner";
import ProfileEditor from "@/components/ProfileEditor";
import VideoThumbnail from "@/components/VideoThumbnail";

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  MessageCircle, 
  User, 
  Lock, 
  CheckCircle, 
  Calendar,
  FileText,
  Video,
  Image as ImageIcon,
  ArrowLeft,
  Eye,
  Download,
  Send,
  Clock,
  Target,
  Settings,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  PlayCircle,
  Award,
  X,
  Maximize2,
  ChevronDown,
  Phone,
  Mail,
  MapPin,
  Key,
  AlertCircle,
  FolderOpen,
  Edit3
} from "lucide-react";

// TypeScript interfaces

interface Student {
  $id: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  parentContact: string;
  therapyGoals?: string;
  idNumber?: string;
  status?: string;
  joinDate?: string;
}

interface Session {
  id: string;
  sessionNumber: number;
  status: "completed" | "locked" | "canceled";
  date?: string;
  title?: string;
}

interface Child {
  id: string;
  name: string;
  age: number; // Legacy field - will be removed
  dateOfBirth?: string; // New field for age calculation
  avatar: string;
  totalSessions: number;
  completedSessions: number;
  streak: number;
  level: string;
  nextSession: string;
  achievements: string[];
  progressData: {
    articulation: number;
    vocabulary: number;
    fluency: number;
    comprehension: number;
  };
}

interface SessionMaterial {
  id?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  url: string;
  description?: string;
  thumbnail?: string;
  size?: string;
  duration?: string;
}

interface SessionData {
  id: string;
  sessionNumber?: number;
  title: string;
  date: string;
  duration: string;
  status: 'completed' | 'locked' | 'canceled';
  isPaid?: boolean;
  isGESY?: boolean;
  gesyNote?: string;
  description: string;
  sessionSummary?: string;
  goals: string[];
  achievements: string[];
  achievement?: {
    type: string;
    icon: string;
    title: string;
    description: string;
  };
  materials: {
    pdfs: SessionMaterial[];
    images: SessionMaterial[];
    videos: SessionMaterial[];
  };
  feedback: Array<{
    id: string;
    author: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
  homework: string[];
  nextSteps: string[];
  therapistNotes: string;
  parentFeedback: string;
}

// Mock data for the child and sessions
const mockChild = {
  id: "1",
  name: "Εμμα Ιωάννου",
  age: 7,
  profileImage: "/placeholder-child.jpg",
  therapyGoals: ["Βελτίωση άρθρωσης των 'Ρ' ήχων", "Ενίσχυση ανάπτυξης λεξιλογίου", "Οικοδόμηση αυτοπεποίθησης στην επικοινωνία"],
  totalSessions: 12,
  completedSessions: 4,
  nextSession: "2024-01-15",
  status: "active",
  joinDate: "2024-01-15",
  therapist: "Μαριλένα Νέστωρος",
  diagnosis: ["Δυσαρθρία", "Καθυστέρηση Ομιλίας"],
  parentContact: {
    name: "Αννα Παπαδοπούλου",
    phone: "+30 697 123 4567",
    email: "anna.papa@email.com"
  }
};

const mockSessions = [
  {
    id: "1",
    sessionNumber: 1,
    date: "2024-01-01",
    status: "completed" as const,
    isPaid: true,
    title: "Αρχική Αξιολόγηση & Εισαγωγή",
    duration: "45 λεπτά",
    achievement: {
      type: "milestone",
      title: "Πρώτα Βήματα",
      description: "Ξεκίνησε το ταξίδι της λογοθεραπείας!",
      icon: "star"
    },
    therapistNotes: "Emma showed great enthusiasm during our first session. We completed a comprehensive assessment of her current speech patterns and identified areas for improvement. She particularly struggles with 'R' sounds but shows strong motivation to improve.",
    sessionSummary: "During this initial session, we focused on building rapport and conducting a thorough speech assessment. Emma demonstrated strong listening skills and was eager to participate in all activities.",
    skillsWorkedOn: ["Initial assessment", "Rapport building", "Sound identification", "Baseline measurements"],
    homework: "Practice 'R' sound exercises 10 minutes daily using the provided flashcards. Focus on words like 'red', 'run', and 'rabbit'. Record progress in the practice log.",
    nextSessionGoals: ["Continue R-sound practice", "Introduce breathing exercises", "Work on confidence building"],
    materials: {
      pdfs: [
        { id: "1", name: "Session_1_Assessment_Report.pdf", description: "Comprehensive assessment results and baseline measurements", url: "#" },
        { id: "2", name: "Home_Practice_Guide.pdf", description: "Daily practice instructions for parents", url: "#" }
      ],
      images: [
        { id: "3", name: "R_Sound_Flashcards_Set1.jpg", description: "Flashcards for 'R' sound practice - Set 1", url: "#" },
        { id: "4", name: "R_Sound_Flashcards_Set2.jpg", description: "Flashcards for 'R' sound practice - Set 2", url: "#" },
        { id: "5", name: "Practice_Chart.jpg", description: "Weekly practice tracking chart", url: "#" }
      ],
      videos: []
    },
    feedback: [
      { id: "1", author: "parent", message: "Emma really enjoyed the session! She's been practicing with the flashcards every day.", timestamp: "2024-01-02" }
    ]
  },
  {
    id: "2",
    sessionNumber: 2,
    date: "2024-01-08",
    status: "completed" as const,
    isPaid: true,
    title: "Εξάσκηση Ήχου Ρ & Ασκήσεις Αναπνοής",
    duration: "45 λεπτά",
    achievement: {
      type: "skill",
      title: "Ανακάλυψη Ήχου",
      description: "Μπορεί να παράγει τον ήχο 'Ρ' σωστά 6/10 φορές!",
      icon: "zap"
    },
    therapistNotes: "Excellent progress on 'R' sounds! Emma is beginning to produce the sound correctly in isolation. We also worked on proper breathing techniques to support speech production.",
    sessionSummary: "Emma showed remarkable improvement from last week. She can now produce the 'R' sound correctly 6 out of 10 times when given visual cues. We introduced breathing exercises to help with speech clarity.",
    skillsWorkedOn: ["R-sound production", "Breathing exercises", "Visual cue recognition", "Self-monitoring"],
    homework: "Continue 'R' sound practice and add breathing exercises. Practice 5 deep breaths before each speech exercise session. Use the new breathing cards provided.",
    nextSessionGoals: ["Increase R-sound accuracy", "Practice R-sounds in simple words", "Continue breathing work"],
    materials: {
      pdfs: [
        { id: "6", name: "Week2_Progress_Report.pdf", description: "Detailed progress analysis and measurements", url: "#" },
        { id: "7", name: "Breathing_Exercises_Guide.pdf", description: "Step-by-step breathing techniques for speech", url: "#" }
      ],
      images: [
        { id: "8", name: "Breathing_Exercise_Cards.jpg", description: "Visual cards for breathing exercises", url: "#" },
        { id: "9", name: "R_Sound_Progress_Chart.jpg", description: "Visual progress tracking for R-sounds", url: "#" }
      ],
      videos: [
        { id: "10", name: "Breathing_Exercise_Demo.mp4", description: "Demonstration of proper breathing techniques", url: "#" }
      ]
    },
    feedback: []
  },
  {
    id: "3",
    sessionNumber: 3,
    date: "2024-01-15",
    status: "completed" as const,
    isPaid: false,
    title: "Εξάσκηση Ήχου Ρ σε Επίπεδο Λέξης",
    duration: "45 λεπτά",
    therapistNotes: "Emma is now producing 'R' sounds correctly in simple words 70% of the time. We focused on words beginning with 'R' and introduced some words with 'R' in the middle position.",
    sessionSummary: "Significant progress! Emma can now use R-sounds in words consistently. We practiced with word cards and introduced self-monitoring techniques.",
    skillsWorkedOn: ["R-sounds in words", "Self-monitoring", "Word-level practice", "Confidence building"],
    homework: "Practice word lists provided. Focus on slow, deliberate pronunciation. Record yourself saying 5 words and bring the recording to the next session.",
    nextSessionGoals: ["Move to sentence level", "Introduce conversational practice", "Continue building confidence"],
    materials: {
      pdfs: [
        { id: "11", name: "R_Words_Practice_List.pdf", description: "Comprehensive word list for daily practice", url: "#" },
        { id: "12", name: "Self_Monitoring_Guide.pdf", description: "Teaching self-correction techniques", url: "#" }
      ],
      images: [
        { id: "13", name: "Word_Practice_Cards_Set1.jpg", description: "R-sound word cards - Beginning sounds", url: "#" },
        { id: "14", name: "Word_Practice_Cards_Set2.jpg", description: "R-sound word cards - Middle sounds", url: "#" },
        { id: "15", name: "Progress_Photos_Week3.jpg", description: "Emma practicing with word cards", url: "#" }
      ],
      videos: []
    },
    feedback: [
      { id: "2", author: "parent", message: "Should we be concerned that Emma sometimes gets frustrated during practice?", timestamp: "2024-01-16" },
      { id: "3", author: "therapist", message: "That's completely normal! Try shorter practice sessions (5 minutes instead of 10) and lots of praise for effort, not just correct sounds.", timestamp: "2024-01-16" }
    ]
  },
  {
    id: "4",
    sessionNumber: 4,
    date: "2024-01-22",
    status: "completed" as const,
    isPaid: true,
    title: "Εξάσκηση Επιπέδου Πρότασης & Παιχνίδια",
    duration: "45 λεπτά",
    achievement: {
      type: "breakthrough",
      title: "Δάσκαλος Προτάσεων",
      description: "Επιτυχής χρήση Ρ-ήχων σε προτάσεις!",
      icon: "trophy"
    },
    therapistNotes: "Great session! Emma is ready to practice 'R' sounds in short sentences. We played speech games to make practice more enjoyable and reduce any frustration.",
    sessionSummary: "Emma successfully transitioned to sentence-level practice. She showed great enthusiasm for the games and her confidence has noticeably improved.",
    skillsWorkedOn: ["R-sounds in sentences", "Game-based learning", "Confidence building", "Social communication"],
    homework: "Practice the sentence cards 2-3 times daily. Remember to focus on effort over perfection. Play the 'R' sound board game with family members.",
    nextSessionGoals: ["Conversational practice", "Reduce support cues", "Maintain motivation"],
    materials: {
      pdfs: [
        { id: "16", name: "Sentence_Practice_Guide.pdf", description: "Daily sentence practice instructions", url: "#" },
        { id: "17", name: "Speech_Games_Rules.pdf", description: "How to play speech therapy games at home", url: "#" }
      ],
      images: [
        { id: "18", name: "Sentence_Cards_Set1.jpg", description: "Practice sentences with R-sounds", url: "#" },
        { id: "19", name: "Board_Game_Setup.jpg", description: "R-sound board game layout", url: "#" },
        { id: "20", name: "Emma_Playing_Game.jpg", description: "Emma enjoying the speech game", url: "#" },
        { id: "21", name: "Game_Pieces.jpg", description: "Game pieces and cards", url: "#" }
      ],
      videos: [
        { id: "22", name: "Game_Demo_Video.mp4", description: "How to play the R-sound board game", url: "#" }
      ]
    },
    feedback: []
  },
  {
    id: "5",
    sessionNumber: 5,
    date: "2024-01-29",
    status: "locked" as const,
    isPaid: false,
    title: "Εξάσκηση Συνομιλίας",
    duration: "45 λεπτά",
    therapistNotes: "",
    sessionSummary: "",
    skillsWorkedOn: [],
    homework: "",
    nextSessionGoals: [],
    materials: { pdfs: [], images: [], videos: [] },
    feedback: []
  },
  {
    id: "6",
    sessionNumber: 6,
    date: "2024-02-05",
    status: "locked" as const,
    isPaid: false,
    title: "Ανάγνωση Φωναχτά & Έκφραση",
    duration: "45 λεπτά",
    therapistNotes: "",
    sessionSummary: "",
    skillsWorkedOn: [],
    homework: "",
    nextSessionGoals: [],
    materials: { pdfs: [], images: [], videos: [] },
    feedback: []
  }
];

// Note: Mock conversation data has been replaced with real Appwrite data integration

function DashboardContent() {
  const logout = useLogout();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("journey");
  const [newComment, setNewComment] = useState("");
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<{[key: string]: number}>({});
  const [openAccordions, setOpenAccordions] = useState<{[key: string]: boolean}>({});
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isGalleryFullscreen, setIsGalleryFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [firstModalOpen, setFirstModalOpen] = useState(true);
  const [progressView, setProgressView] = useState<'board'>('board');
  const [linkedStudent, setLinkedStudent] = useState<Student | null>(null);
  const [checkingStudent, setCheckingStudent] = useState(true);
  const [previewFile, setPreviewFile] = useState<{ id: string; name: string; type: string; url: string } | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [showFolderInfo, setShowFolderInfo] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [extendedUserData, setExtendedUserData] = useState<any>(null);
  const router = useRouter();

  // State for real data
  const [realSessions, setRealSessions] = useState([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionsPerPage] = useState(12);
  const [loadingPage, setLoadingPage] = useState(false);

  // Global mystery session completion status
  const [globalMysteryStatus, setGlobalMysteryStatus] = useState({
    middleCompleted: false,
    finalCompleted: false,
    middleSessionNumber: -1,
    finalSessionNumber: -1
  });

  // Check for linked student (including admin students)
  useEffect(() => {
    const checkLinkedStudent = async () => {
      if (!user || !user.id) return;

      try {
        setCheckingStudent(true);
        
        // 👤 ADMIN STUDENT: Admin users also need to find their student record
        // Find student linked to this parent (works for both regular users and admins)
        const studentQuery = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.collections.students,
          [
            Query.equal('parentId', user.id)
          ]
        );

        if (studentQuery.documents.length > 0) {
          const student = studentQuery.documents[0];
          console.log(`🔍 Found student for user ${user.id}:`, student.name, `(ID: ${student.$id})`);
          setLinkedStudent(student as any); // Type assertion to bypass TypeScript issues
          
          // Load sessions for this student
          await loadSessionsForStudent(student.$id, 1);
        } else {
          console.log(`⚠️ No student found for user ${user.id}`);
          
          // 👤 ADMIN AUTO-SETUP: If admin user has no student, try to create one
          if (isAdmin) {
            console.log('🔧 Admin user detected, trying to create admin student...');
            try {
              const response = await fetch('/api/admin/admin-student');
              const data = await response.json();
              
              if (data.success && data.data) {
                console.log(`✅ Created admin student: ${data.data.studentId}`);
                setLinkedStudent({
                  $id: data.data.studentId,
                  name: data.data.student.name,
                  ...data.data.student
                } as any);
                
                // Load sessions for the new admin student
                await loadSessionsForStudent(data.data.studentId, 1);
              } else {
                console.error('❌ Failed to create admin student:', data.error);
                setLinkedStudent(null);
              }
            } catch (error) {
              console.error('❌ Error creating admin student:', error);
              setLinkedStudent(null);
            }
          } else {
            setLinkedStudent(null);
          }
        }
      } catch (error) {
        console.error('Error checking linked student:', error);
        setLinkedStudent(null);
      } finally {
        setCheckingStudent(false);
      }
    };

    checkLinkedStudent();
    
    // Also load extended user data
    if (user?.id && !isAdmin) {
      loadExtendedUserData();
    }
  }, [user?.id, isAdmin]);

  // Load extended user data for profile info
  const loadExtendedUserData = async () => {
    try {
      if (!user?.id) return;

      const usersExtendedCollectionId = appwriteConfig.collections.usersExtended || '68aef5f19770fc264f6d';
      const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';

      const extendedDataResponse = await databases.listDocuments(
        databaseId,
        usersExtendedCollectionId,
        [Query.equal('userId', user.id)]
      );

      if (extendedDataResponse.documents.length > 0) {
        setExtendedUserData(extendedDataResponse.documents[0]);
      }
    } catch (error) {
      console.error('Error loading extended user data:', error);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (updatedData: { phone: string; address?: string; profilePicture?: string }) => {
    try {
      if (!user?.id) throw new Error('User ID not found');

      // Update users_extended collection
      const usersExtendedCollectionId = appwriteConfig.collections.usersExtended || '68aef5f19770fc264f6d';
      const databaseId = appwriteConfig.databaseId || '68ab99977aad1233b50c';

      // First, get the user's extended data document
      const extendedDataResponse = await databases.listDocuments(
        databaseId,
        usersExtendedCollectionId,
        [Query.equal('userId', user.id)]
      );

      if (extendedDataResponse.documents.length > 0) {
        // Update existing document
        const extendedDoc = extendedDataResponse.documents[0];
        await databases.updateDocument(
          databaseId,
          usersExtendedCollectionId,
          extendedDoc.$id,
          {
            phone: updatedData.phone,
            address: updatedData.address || '',
            profilePicture: updatedData.profilePicture || ''
          }
        );
      } else {
        // Create new extended data document
        await databases.createDocument(
          databaseId,
          usersExtendedCollectionId,
          'unique()',
          {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: updatedData.phone,
            address: updatedData.address || '',
            profilePicture: updatedData.profilePicture || '',
            createdAt: new Date().toISOString()
          }
        );
      }

      // Reload extended user data to show updated info
      await loadExtendedUserData();
      setEditingProfile(false);
      
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };


  // Load global mystery session completion status
  const loadGlobalMysteryStatus = useCallback(async (studentId: string, totalSessionsCount: number) => {
    try {
      if (totalSessionsCount === 0) return;
      
      // Calculate mystery sessions based on total count
      const middleSessionNumber = Math.floor((totalSessionsCount - 1) / 2) + 1;
      const finalSessionNumber = totalSessionsCount;
      
      // Get active folder for student
      const activeFolders = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessionFolders,
        [
          Query.equal('studentId', studentId),
          Query.equal('isActive', true),
          Query.limit(1)
        ]
      );
      
      // Build base queries for either active folder or all sessions
      const baseQueries = [Query.equal('studentId', studentId)];
      if (activeFolders.documents.length > 0) {
        baseQueries.push(Query.equal('folderId', activeFolders.documents[0].$id));
      }
      
      // Fetch all completed sessions for this student/folder
      const completedSessions = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          ...baseQueries,
          Query.equal('status', 'completed')
        ]
      );
      
      // Helper function to extract numeric session number from string
      const getSessionNumber = (sessionNumber) => {
        if (typeof sessionNumber === 'string' && sessionNumber.includes(' - ')) {
          const num = parseInt(sessionNumber.split(' - ')[0]);
          return isNaN(num) ? 0 : num;
        }
        return typeof sessionNumber === 'number' ? sessionNumber : parseInt(sessionNumber) || 0;
      };
      
      // Find middle and final sessions by comparing numeric values
      const middleCompleted = completedSessions.documents.some(session => 
        getSessionNumber(session.sessionNumber) === middleSessionNumber
      );
      
      const finalCompleted = completedSessions.documents.some(session => 
        getSessionNumber(session.sessionNumber) === finalSessionNumber
      );
      
      console.log(`🎁 Mystery Status: Middle (${middleSessionNumber}): ${middleCompleted}, Final (${finalSessionNumber}): ${finalCompleted}`);
      
      setGlobalMysteryStatus({
        middleCompleted,
        finalCompleted,
        middleSessionNumber,
        finalSessionNumber
      });
      
    } catch (error) {
      console.error('Error loading global mystery status:', error);
    }
  }, []);

  // 🚀 OPTIMIZED: Load sessions for student with pagination using new combined API
  const loadSessionsForStudent = useCallback(async (studentId: string, page: number = 1) => {
    try {
      setLoadingPage(page !== 1); // Show loading for page changes, not initial load
      
      console.log('🚀 Loading optimized dashboard data for student:', studentId, 'page:', page);
      
      // ===== SINGLE OPTIMIZED API CALL =====
      // This replaces 6-8 separate database queries with 1 efficient call
      const response = await fetch(`/api/dashboard-data/${studentId}?page=${page}&limit=${sessionsPerPage}`);
      
      if (!response.ok) {
        throw new Error(`Dashboard API error: ${response.status}`);
      }
      
      const { success, data, meta } = await response.json();
      
      if (!success) {
        throw new Error('Dashboard API returned unsuccessful response');
      }
      
      console.log(`✅ Dashboard data loaded in ${meta.queriesExecuted} optimized queries (vs 8+ in old approach)`);
      
      // ===== UPDATE ALL STATE FROM SINGLE RESPONSE =====
      
      // Update session counts and pagination
      setTotalSessions(data.totalSessions);
      setCompletedSessions(data.completedSessions);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      
      // Update mystery status
      setGlobalMysteryStatus({
        middleCompleted: data.mysteryStatus.middleCompleted,
        finalCompleted: data.mysteryStatus.finalCompleted,
        middleSessionNumber: data.mysteryStatus.middleSessionNumber,
        finalSessionNumber: data.mysteryStatus.finalSessionNumber
      });
      
      // ===== PROCESS SESSIONS FOR UI =====

        // Extract clean session number for display
        const getDisplaySessionNumber = (sessionNumber) => {
          if (typeof sessionNumber === 'string' && sessionNumber.includes(' - ')) {
            const num = parseInt(sessionNumber.split(' - ')[0]);
            return isNaN(num) ? sessionNumber : num;
          }
          return sessionNumber;
        };

      // Convert sessions to UI format
      const formattedSessions = data.sessions.map(session => ({
        id: session.id,
          sessionNumber: getDisplaySessionNumber(session.sessionNumber),
          title: session.title,
        description: session.notes || '',
          date: session.date,
          duration: session.duration + ' λεπτά',
          status: session.status === 'cancelled' ? 'canceled' : session.status,
          isLocked: session.status === 'locked',
        // 🔧 FIX: Use real data from API instead of hardcoded values
        isPaid: session.isPaid || false,
        isGESY: session.isGESY || false,
        gesyNote: session.gesyNote || '',
        therapistNotes: session.notes || '',
          homework: [],
        achievements: session.achievement ? [session.achievement] : [],
        sessionSummary: session.notes || '',
        achievement: session.achievement,
        // Use file counts for now - actual files loaded on demand
        materials: {
          pdfs: [], // Will be loaded when session is opened
          images: [],
          videos: []
        },
        // Quick access to file counts for UI badges
        fileCounts: session.fileCounts,
        feedback: session.feedback || []
      }));
      
      setRealSessions(formattedSessions);
      
      console.log(`📊 Loaded ${formattedSessions.length} sessions with file counts:`, 
        formattedSessions.map(s => `${s.title}: ${s.fileCounts?.total || 0} files`));
      
    } catch (error) {
      console.error('❌ Error loading optimized dashboard data:', error);
      
      // Fallback to show error state instead of breaking
      setRealSessions([]);
      setTotalSessions(0);
      setCompletedSessions(0);
      setTotalPages(1);
    } finally {
      setLoadingPage(false);
    }
  }, [sessionsPerPage]);

  // Calculate real stats from session data
  const calculateStats = useCallback(() => {
    if (totalSessions > 0) {
      const remainingCount = totalSessions - completedSessions;
      const completionPercentage = Math.round((completedSessions / totalSessions) * 100);
      
      return {
        completed: completedSessions,
        remaining: remainingCount,
        total: totalSessions,
        percentage: completionPercentage
      };
    }
    
    // Fallback to mock data if no real sessions
    return {
      completed: mockChild.completedSessions,
      remaining: mockChild.totalSessions - mockChild.completedSessions,
      total: mockChild.totalSessions,
      percentage: Math.round((mockChild.completedSessions / mockChild.totalSessions) * 100)
    };
  }, [totalSessions, completedSessions]);

  // Pagination handlers
  const handlePreviousPage = useCallback(async () => {
    if (currentPage > 1 && linkedStudent) {
      const newPage = currentPage - 1;
      await loadSessionsForStudent(linkedStudent.$id, newPage);
    }
  }, [currentPage, linkedStudent, loadSessionsForStudent]);

  const handleNextPage = useCallback(async () => {
    if (currentPage < totalPages && linkedStudent) {
      const newPage = currentPage + 1;
      await loadSessionsForStudent(linkedStudent.$id, newPage);
    }
  }, [currentPage, totalPages, linkedStudent, loadSessionsForStudent]);

  // Handle file preview
  const handleFilePreview = (file: { $id: string; name: string; type: string }) => {
    // Create file object with proper URL for preview
    const fileType = file.type || '';
    const fileName = file.name || '';
    
    const fileForPreview = {
      ...file,
      type: fileType,
      url: fileService.getFileViewUrl(file.id) // Always use view URL for preview
    };
    setPreviewFile(fileForPreview);
    setShowFilePreview(true);
  };

  // Handle file download
  const handleFileDownload = async (file: { $id: string; name: string }) => {
    try {
      const downloadUrl = fileService.getFileDownloadUrl(file.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Σφάλμα κατά τη λήψη του αρχείου');
    }
  };

  // Debug logging - uncomment to debug renders
  // console.log("Dashboard render - activeTab:", activeTab, "selectedSession:", selectedSession?.id, "modalActiveTab:", modalActiveTab);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedSession) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function to reset scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedSession]);

  // Reset first modal open flag when a new session is selected
  useEffect(() => {
    if (selectedSession) {
      setFirstModalOpen(true);
    }
  }, [selectedSession?.id]);



  // Loading simulation for async content
  const simulateLoading = useCallback((key: string, duration: number = 1000) => {
    setIsLoading(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setIsLoading(prev => ({ ...prev, [key]: false }));
    }, duration);
  }, []);

  // Section expansion toggle
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const getSelectedImageIndex = useCallback((sessionId: string) => {
    return selectedImageIndexes[sessionId] || 0;
  }, [selectedImageIndexes]);

  const setSelectedImageIndex = useCallback((sessionId: string, index: number) => {
    setSelectedImageIndexes(prev => ({
      ...prev,
      [sessionId]: index
    }));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "locked":
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return null; // No icon for available sessions
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "available":
        return "bg-blue-100 text-blue-800";
      case "locked":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-red-600" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-blue-600" />;
      case "video":
        return <Video className="w-4 h-4 text-purple-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "star":
        return <Star className="w-5 h-5" />;
      case "zap":
        return <Zap className="w-5 h-5" />;
      case "trophy":
        return <Trophy className="w-5 h-5" />;
      case "award":
        return <Award className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "milestone":
        return "bg-blue-500";
      case "skill":
        return "bg-purple-500";
      case "breakthrough":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleCloseModal = useCallback(() => {
    setSelectedSession(null);
  }, []);

  const SessionModal = useMemo(() => {
    if (!selectedSession) return null;

    const currentImageIndex = getSelectedImageIndex(selectedSession.id);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="session-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={handleCloseModal}
        >
          <motion.div
            key={`session-modal-${selectedSession.id}`}
            initial={firstModalOpen ? { opacity: 0, y: "100%" } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onAnimationComplete={() => {
              if (firstModalOpen) {
                setFirstModalOpen(false);
              }
            }}
            className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] md:h-[calc(100vh-4rem)] max-h-[80vh] md:max-h-[90vh] flex flex-col overflow-hidden relative mt-16 md:mt-0"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-xl font-bold">{selectedSession.sessionNumber}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold truncate">{selectedSession.title}</h2>
                    <p className="text-blue-100 text-xs sm:text-sm truncate">
                      {new Date(selectedSession.date).toLocaleDateString('el-GR')} • {selectedSession.duration}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>


            </div>

            {/* Modal Content - Single Scrollable Section */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-6 min-h-0">
              <div className="space-y-6">
                {/* Session Information Header */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Τίτλος Συνεδρίας</h3>
                      <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedSession.title}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Ημερομηνία</h3>
                      <p className="text-base text-gray-900">{new Date(selectedSession.date).toLocaleDateString('el-GR')}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Κατάσταση</h3>
                      <Badge className={`${getStatusColor(selectedSession.status)} text-xs`}>
                        {selectedSession.status === "completed" ? "Ολοκληρωμένη" :
                         selectedSession.status === "in-progress" ? "Σε εξέλιξη" :
                         selectedSession.status === "scheduled" ? "Προγραμματισμένη" : "Κλειδωμένη"}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Κατάσταση Πληρωμής</h3>
                      <Badge className={selectedSession.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {selectedSession.isPaid ? "Πληρωμένη" : "Απλήρωτη"}
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">ΓεΣΥ</h3>
                      <div className="space-y-1">
                        <Badge className={selectedSession.isGESY ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}>
                          {selectedSession.isGESY ? "ΓεΣΥ" : "Χωρίς ΓεΣΥ"}
                        </Badge>
                        {selectedSession.isGESY && selectedSession.gesyNote && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            {selectedSession.gesyNote}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Summary */}
                {selectedSession.sessionSummary && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6"
                  >
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-green-900 text-sm sm:text-base">Περιγραφή Συνεδρίας</h3>
                    </div>
                    <div className={`text-green-800 leading-relaxed text-sm sm:text-base ${!expandedSections['summary'] ? 'line-clamp-3' : ''}`}>
                      {selectedSession.sessionSummary}
                    </div>
                    {selectedSession.sessionSummary.length > 120 && (
                      <button
                        onClick={() => toggleSection('summary')}
                        className="text-green-600 text-sm font-medium mt-2 flex items-center active:scale-95 transition-transform"
                      >
                        {expandedSections['summary'] ? 'Λιγότερα' : 'Περισσότερα'}
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${expandedSections['summary'] ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Achievement Section */}
                {selectedSession.achievement && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 sm:p-6"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <div className="text-xl sm:text-2xl">
                          {selectedSession.achievement.icon === 'star' ? '⭐' :
                           selectedSession.achievement.icon === 'zap' ? '⚡' :
                           selectedSession.achievement.icon === 'trophy' ? '🏆' : '🥇'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-yellow-900 text-lg sm:text-xl">{selectedSession.achievement.title}</h3>
                        <p className="text-yellow-700 text-sm sm:text-base capitalize">
                          {selectedSession.achievement.type === 'milestone' ? 'Ορόσημο' :
                           selectedSession.achievement.type === 'skill' ? 'Δεξιότητα' : 'Ανακάλυψη'}
                        </p>
                      </div>
                    </div>
                    <p className="text-yellow-800 leading-relaxed text-sm sm:text-base">
                      {selectedSession.achievement.description}
                    </p>
                  </motion.div>
                )}

                {/* PDF Preview */}
                {selectedSession.materials.pdfs.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2" />
                        Έγγραφα PDF ({selectedSession.materials.pdfs.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {selectedSession.materials.pdfs.map((pdf: SessionMaterial, index: number) => (
                        <motion.div 
                          key={pdf.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{pdf.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">{pdf.description}</p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="min-h-[36px] text-xs active:scale-95"
                                onClick={() => handleFilePreview(pdf)}
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Προεπισκόπηση</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="min-h-[36px] text-xs active:scale-95"
                                onClick={() => handleFileDownload(pdf)}
                              >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Λήψη</span>
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Video Preview */}
                {selectedSession.materials.videos.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                        <Video className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mr-2" />
                        Βίντεο ({selectedSession.materials.videos.length})
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {selectedSession.materials.videos.map((video: SessionMaterial, index: number) => (
                        <motion.div 
                          key={video.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                          onClick={() => handleFilePreview(video)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className="w-12 h-8 sm:w-16 sm:h-10 rounded-lg overflow-hidden flex-shrink-0">
                                <VideoThumbnail 
                                  videoUrl={video.url}
                                  videoName={video.name}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate group-hover:text-purple-600 transition-colors">{video.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">{video.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-purple-600 flex-shrink-0">
                              <PlayCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Gallery Preview */}
                {selectedSession.materials.images.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
                        Συλλογή Εικόνων ({selectedSession.materials.images.length})
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsGalleryFullscreen(true)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-xs sm:text-sm min-h-[36px] px-3 rounded-lg hover:bg-blue-50 active:scale-95 transition-all"
                      >
                        <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Πλήρης Οθόνη</span>
                        <span className="sm:hidden">Μεγέθυνση</span>
                      </button>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6">
                      {/* Main Image */}
                      <div className="relative mb-4">
                        <div className="aspect-video bg-white rounded-lg overflow-hidden shadow-md">
                          {isLoading[`image-${selectedSession.id}`] ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <div className="animate-pulse flex space-x-4">
                                <div className="rounded-full bg-gray-300 h-6 w-6"></div>
                                <div className="flex-1 space-y-2 py-1">
                                  <div className="h-2 bg-gray-300 rounded"></div>
                                  <div className="space-y-2">
                                    <div className="h-2 bg-gray-300 rounded"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : selectedSession.materials.images[currentImageIndex] ? (
                            <img
                              src={selectedSession.materials.images[currentImageIndex].url}
                              alt={selectedSession.materials.images[currentImageIndex].name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onLoad={() => setIsLoading(prev => ({ ...prev, [`image-${selectedSession.id}`]: false }))}
                              onError={(e) => {
                                // Fallback to placeholder on error
                                e.currentTarget.src = "https://via.placeholder.com/600x400/e5e7eb/9ca3af?text=Image+Not+Found";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                              <div className="text-center">
                                <ImageIcon className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                                <p>No images available</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Navigation Arrows */}
                        {selectedSession.materials.images.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : selectedSession.materials.images.length - 1;
                                setSelectedImageIndex(selectedSession.id, newIndex);
                              }}
                              className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-95"
                            >
                              <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                const newIndex = currentImageIndex < selectedSession.materials.images.length - 1 ? currentImageIndex + 1 : 0;
                                setSelectedImageIndex(selectedSession.id, newIndex);
                              }}
                              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all active:scale-95"
                            >
                              <ChevronRight className="w-5 h-5 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        )}

                        {/* Image indicator dots for mobile */}
                        {selectedSession.materials.images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:hidden">
                            {selectedSession.materials.images.map((_: SessionMaterial, index: number) => (
                              <button
                                key={index}
                                onClick={() => setSelectedImageIndex(selectedSession.id, index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Image Info */}
                      <div className="text-center mb-4 px-2">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                          {selectedSession.materials.images[currentImageIndex]?.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                          {selectedSession.materials.images[currentImageIndex]?.description}
                        </p>
                      </div>

                      {/* Thumbnail Strip - Hidden on mobile in favor of dots */}
                      {selectedSession.materials.images.length > 1 && (
                        <div className="hidden sm:flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                          {selectedSession.materials.images.map((image: SessionMaterial, index: number) => (
                            <button
                              key={image.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setSelectedImageIndex(selectedSession.id, index);
                              }}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all active:scale-95 ${
                                index === currentImageIndex
                                  ? 'border-blue-500 shadow-lg'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <img
                                src={image.url}
                                alt={image.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  // Fallback to placeholder on error
                                  e.currentTarget.src = "https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=Img";
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}



                {/* Comment Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center text-sm sm:text-base">
                      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mr-2" />
                      Συνομιλία Συνεδρίας
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    {selectedSession.feedback.length > 0 ? (
                      <div className="space-y-4 mb-6">
                        {selectedSession.feedback.map((feedback: {id: string; author: string; message: string; timestamp: string; isRead: boolean}, index: number) => (
                          <motion.div 
                            key={feedback.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex space-x-3"
                          >
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                              <AvatarFallback className="text-xs sm:text-sm font-medium">
                                {feedback.author === "parent" ? "P" : "T"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    {feedback.author === "parent" ? "Γονέας" : "Θεραπευτής"}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-1 sm:mt-0">{feedback.timestamp}</span>
                                </div>
                                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{feedback.message}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-center py-6 sm:py-8 bg-gray-50 rounded-xl mb-6"
                      >
                        <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 text-sm sm:text-base">Δεν υπάρχουν ακόμα σχόλια για αυτή τη συνεδρία</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Ξεκινήστε τη συνομιλία παρακάτω!</p>
                      </motion.div>
                    )}

                    {/* Comment Input */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                      className="bg-gray-50 border-2 border-gray-200 rounded-xl focus-within:border-blue-300 transition-colors"
                    >
                      <div className="p-3 sm:p-4">
                        <Textarea
                          placeholder="Κάντε μια ερώτηση ή μοιραστείτε σχόλια για αυτή τη συνεδρία..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="border-0 p-0 resize-none focus-visible:ring-0 placeholder:text-gray-400 min-h-[60px] sm:min-h-[80px] text-sm sm:text-base bg-transparent"
                          rows={2}
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 pt-3 border-t border-gray-200 gap-2 sm:gap-0">
                          <span className="text-xs text-gray-500 order-2 sm:order-1">
                            Το μήνυμά σας θα σταλεί στον θεραπευτή
                          </span>
                          <Button 
                            size="sm" 
                            disabled={!newComment.trim()}
                            className="bg-blue-500 hover:bg-blue-600 min-h-[40px] text-sm active:scale-95 w-full sm:w-auto order-1 sm:order-2"
                            onClick={async () => {
                              if (newComment.trim()) {
                                simulateLoading('comment-submit', 800);
                                
                                const newFeedback = {
                                  id: Date.now().toString(),
                                  author: "parent",
                                  message: newComment.trim(),
                                  timestamp: new Date().toLocaleString('el-GR'),
                                  isRead: false
                                };
                                
                                // Update local state immediately for UI
                                setSelectedSession({
                                  ...selectedSession,
                                  feedback: [...selectedSession.feedback, newFeedback]
                                });
                                
                                // TODO: Save to database
                                // This would require an API endpoint to update session feedback
                                
                                setNewComment("");
                              }
                            }}
                          >
                            {isLoading['comment-submit'] ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-2" />
                                <span className="sm:hidden">Αποστολή</span>
                                <span className="hidden sm:inline">Αποστολή Μηνύματος</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }, [
    selectedSession, 
    firstModalOpen, 
    selectedImageIndexes, 
    expandedSections, 
    isLoading, 
    newComment, 
    handleCloseModal, 
    getSelectedImageIndex,
    setSelectedImageIndex,
    toggleSection,
    simulateLoading,
    setNewComment,
    setIsGalleryFullscreen,
    getAchievementColor,
    getAchievementIcon
  ]);

  const JourneyBoard = () => {

    return (
      <div className="space-y-8 pb-8 md:pb-0">

        {/* Rotating Banner */}
        <RotatingBanner className="mb-6" />

        {/* Progress Display - Board View Only */}
        <SessionSnakeBoard
          sessions={realSessions.map(session => ({
            id: session.id,
            sessionNumber: session.sessionNumber || 0,
            title: session.title,
            date: session.date,
            duration: session.duration,
            status: session.status as 'completed' | 'locked' | 'available' | 'canceled',
            isPaid: session.isPaid,
            isGESY: session.isGESY,
            gesyNote: session.gesyNote,
            achievement: session.achievement
          }))}
          studentName={linkedStudent?.name || "Εμμας"}
          currentPage={currentPage}
          totalPages={totalPages}
          totalSessions={totalSessions}
          completedSessions={completedSessions}
          globalMysteryStatus={globalMysteryStatus}
          onPageChange={async (page) => {
            if (linkedStudent) {
              await loadSessionsForStudent(linkedStudent.$id, page);
            }
          }}
          loading={loadingPage}
        />


      {/* Timeline */}
      <div className="relative px-2 md:px-0">
        {/* Timeline Line */}
        <div className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500 opacity-30"></div>
        
        {/* Progress Line */}
        <motion.div 
          className="absolute left-5 md:left-8 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500"
          initial={{ height: 0 }}
          animate={{ 
            height: `${calculateStats().percentage}%`
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Session Cards */}
        <div className="space-y-6 md:space-y-8 pb-32 md:pb-8">
        {realSessions.length > 0 ? (
          realSessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline Node */}
            <div className="absolute left-0 flex items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 + 0.3 }}
                className={`
                  w-10 h-10 md:w-16 md:h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-[5] md:z-10
                  ${session.status === "completed" 
                    ? "bg-gradient-to-br from-green-400 to-green-600" 
                    : session.status === "canceled"
                    ? "bg-gradient-to-br from-red-400 to-red-600"
                    : "bg-gradient-to-br from-gray-300 to-gray-500"
                  }
                `}
              >
                {session.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />
                ) : session.status === "canceled" ? (
                  <X className="w-5 h-5 md:w-8 md:h-8 text-white" />
                ) : (
                  <Lock className="w-4 h-4 md:w-6 md:h-6 text-white" />
                )}
              </motion.div>

              {/* Achievement Badge */}
              {session.achievement && session.status === "completed" && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.6 }}
                  className={`
                    absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full ${getAchievementColor(session.achievement.type)} 
                    flex items-center justify-center text-white shadow-lg border-2 border-white
                  `}
                >
                  {getAchievementIcon(session.achievement.icon)}
                </motion.div>
              )}
            </div>

            {/* Session Card */}
            <div className="ml-16 md:ml-24">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={`
                    overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer group
                    ${session.status === "completed" 
                      ? "bg-gradient-to-br from-white to-green-50/30 border-green-200/50 hover:border-green-300" 
                      : session.status === "canceled"
                      ? "bg-gradient-to-br from-white to-red-50/30 border-red-200/50 hover:border-red-300"
                      : "bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200/50 hover:border-gray-300"
                    }
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (session.status !== "locked") {
                      router.push(`/dashboard/session/${session.id}`);
                    }
                  }}
                >
                  <div className="px-4 md:px-6 py-4 md:py-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Main session info */}
                        <div className="flex items-center flex-wrap gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 text-base md:text-lg group-hover:text-blue-700 transition-colors">
                            {session.title}
                          </h4>
                          <Badge 
                            variant={session.isPaid ? "default" : "destructive"}
                            className={`text-xs ${session.isPaid ? "bg-green-100 text-green-800 border-green-300" : ""}`}
                          >
                            {session.isPaid ? "Πληρωμένη" : "Απλήρωτη"}
                          </Badge>
                          {session.achievement && session.status === "completed" && (
                            <div className={`
                              inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium text-white
                              ${getAchievementColor(session.achievement.type)}
                            `}>
                              {getAchievementIcon(session.achievement.icon)}
                              <span className="hidden sm:inline ml-1">{session.achievement.title}</span>
                            </div>
                          )}
                        </div>
                        
                        <h5 className="font-medium text-gray-700 text-sm md:text-base mb-2 group-hover:text-gray-900 transition-colors line-clamp-1">
                          Συνεδρία {session.sessionNumber}
                        </h5>
                        
                        {/* Essential metadata */}
                        <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            {new Date(session.date).toLocaleDateString('el-GR')}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            {session.duration}
                          </span>
                        </div>

                        {session.status === "locked" && (
                          <div className="text-center py-3 mt-2">
                            <Lock className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Ολοκληρώστε τις προηγούμενες συνεδρίες για ξεκλείδωμα</p>
                          </div>
                        )}
                      </div>

                      {/* Hover indicator */}
                      {session.status !== "locked" && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
          ))
        ) : (
          /* No Sessions State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-16"
          >
            <Card className="max-w-md mx-auto shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Δεν έχουν προγραμματιστεί συνεδρίες ακόμα
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Ο θεραπευτής θα προγραμματίσει τις συνεδρίες σας σύντομα. 
                    Θα λάβετε ειδοποίηση όταν οι συνεδρίες γίνουν διαθέσιμες.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Η εγγραφή σας έχει ολοκληρωθεί</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>Αναμονή για προγραμματισμό συνεδριών</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800 text-center">
                    <strong>Συμβουλή:</strong> Μπορείτε να επικοινωνήσετε με τον θεραπευτή 
                    μέσω της καρτέλας "Μηνύματα" για οποιεσδήποτε ερωτήσεις.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        </div>
      </div>
    </div>
  );
  };

  const ProfileTab = () => {
    // Parse parent contact info from user auth and users_extended data
    const getParentContactInfo = () => {
      return {
        name: user?.name || 'Δεν υπάρχουν στοιχεία',
        phone: extendedUserData?.phone || user?.phone || '-',
        email: user?.email || '-',
        profilePicture: extendedUserData?.profilePicture || ''
      };
    };

    const parentContact = getParentContactInfo();
    
    // Debug: Log contact info to understand the data structure
    console.log('Debug - linkedStudent:', linkedStudent);
    console.log('Debug - user:', user);
    console.log('Debug - parentContact:', parentContact);
    // Find next session (first locked session, or if none, first available)
    const nextSession = realSessions.find(s => s.status === 'locked') || 
                       realSessions.find(s => s.status === 'available') ||
                       realSessions.find(s => s.status === 'completed');

    return (
      <div className="space-y-6 pb-32 md:pb-8">
        {/* Account Settings */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ρυθμίσεις Λογαριασμού</h3>
                <p className="text-sm text-gray-600">Διαχείριση προφίλ και αποσύνδεση</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setEditingProfile(!editingProfile)}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  {editingProfile ? 'Ακύρωση' : 'Επεξεργασία'}
                </Button>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto"
                >
                  Αποσύνδεση
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Editor or Child Profile Card */}
        {editingProfile ? (
          <ProfileEditor
            user={user}
            linkedStudent={linkedStudent}
            parentContact={parentContact}
            onSave={handleProfileUpdate}
            onCancel={() => setEditingProfile(false)}
          />
        ) : linkedStudent ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  {parentContact.profilePicture ? (
                    <AvatarImage src={parentContact.profilePicture} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                      {linkedStudent.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{linkedStudent.name}</h2>
                  <p className="text-gray-600">Ηλικία {linkedStudent.dateOfBirth ? calculateAge(linkedStudent.dateOfBirth) : linkedStudent.age} ετών</p>
                  <Badge className={`mt-1 ${
                    linkedStudent.status === 'active' ? 'bg-green-100 text-green-800' :
                    linkedStudent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {linkedStudent.status === 'active' ? 'Ενεργός' :
                     linkedStudent.status === 'inactive' ? 'Ανενεργός' : 'Ολοκληρώθηκε'}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Βασικά Στοιχεία</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <User className="w-3 h-3" />
                        Θεραπευτής:
                      </span>
                      <span className="font-medium">Μαριλένα Νέστωρος</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Ημερομηνία εγγραφής:
                      </span>
                      <span className="font-medium">{new Date(linkedStudent.joinDate).toLocaleDateString('el-GR')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Επόμενη συνεδρία:
                      </span>
                      <span className={`font-medium ${nextSession ? 'text-blue-600' : 'text-gray-400'}`}>
                        {nextSession ? new Date(nextSession.date).toLocaleDateString('el-GR') : 'Δεν υπάρχει'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Trophy className="w-3 h-3" />
                        Κατάσταση:
                      </span>
                      <Badge className={`${
                        linkedStudent.status === 'active' ? 'bg-green-100 text-green-800' :
                        linkedStudent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {linkedStudent.status === 'active' ? 'Ενεργός' :
                         linkedStudent.status === 'inactive' ? 'Ανενεργός' : 'Ολοκληρώθηκε'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Περίληψη Προόδου
                  </h3>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">Συνεδρίες που Ολοκληρώθηκαν</span>
                        <span className="text-lg font-bold text-blue-900">
                          {calculateStats().completed}/{calculateStats().total}
                        </span>
                      </div>
                      <Progress 
                        value={calculateStats().percentage} 
                        className="h-3 bg-blue-100"
                      />
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-blue-700">Πρόοδος</span>
                        <span className="font-semibold text-blue-800">{calculateStats().percentage}%</span>
                      </div>
                      {calculateStats().remaining > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-blue-700">Υπολειπόμενες συνεδρίες</span>
                          <span className="font-medium text-blue-800">{calculateStats().remaining}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Therapy Goals Section */}
              {linkedStudent.therapyGoals && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-green-500" />
                    Θεραπευτικοί Στόχοι (Από τον Θεραπευτή)
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="prose prose-sm max-w-none text-gray-700">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {linkedStudent.therapyGoals}
                      </p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700 italic">
                        ✨ Αυτοί οι στόχοι έχουν τεθεί από τον θεραπευτή σας και θα αναθεωρούνται κατά τη διάρκεια της θεραπείας.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Student ID Number */}
              {linkedStudent.idNumber && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Key className="w-4 h-4 mr-2 text-purple-500" />
                    Αριθμός Ταυτότητας
                  </h3>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {linkedStudent.idNumber}
                    </p>
                  </div>
                </div>
              )}

              {/* Parent/Guardian Contact */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  Στοιχεία Γονέα/Κηδεμόνα
                </h3>
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-gray-900">{parentContact.name}</p>
                      <p className="text-sm text-gray-600">Γονέας/Κηδεμόνας</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 group">
                      <Phone className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">Τηλέφωνο</p>
                        {parentContact.phone !== '-' ? (
                          <a
                            href={`tel:${parentContact.phone}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {parentContact.phone}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">Δεν υπάρχει</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 group">
                      <Mail className="w-4 h-4 text-gray-500 group-hover:text-blue-500 transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">Email</p>
                        {parentContact.email !== '-' ? (
                          <a
                            href={`mailto:${parentContact.email}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all"
                          >
                            {parentContact.email}
                          </a>
                        ) : (
                          <p className="text-sm font-medium text-gray-400">Δεν υπάρχει</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {(parentContact.phone !== '-' || parentContact.email !== '-') && (
                    <div className="flex gap-3 pt-3 border-t border-gray-200">
                      {parentContact.phone !== '-' && (
                        <Button
                          onClick={() => window.open(`tel:${parentContact.phone}`, '_self')}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 flex-1 justify-center hover:bg-green-50 hover:border-green-300 hover:text-green-700"
                        >
                          <Phone className="w-4 h-4" />
                          <span>Κλήση</span>
                        </Button>
                      )}
                      {parentContact.email !== '-' && (
                        <Button
                          onClick={() => window.open(`mailto:${parentContact.email}`, '_self')}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 flex-1 justify-center hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Φόρτωση στοιχείων...</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // MessagesTab component removed - functionality disabled


  // Main component logic continues here

  // Show loading while checking for linked student
  if (checkingStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show client code linking prompt if no student is linked
  if (!linkedStudent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 bg-gradient-to-r from-blue-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <Key className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {user?.name}!</h1>
            <p className="text-gray-600">Connect to your child's therapy program</p>
          </div>

          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center space-x-2 text-xl">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <span>Client Code Required</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      To access your child's therapy sessions and progress, you need to link your account using a <strong>client code</strong> provided by your speech therapist.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <Button
                  onClick={() => router.push('/link-client-code')}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700 text-white font-medium text-base"
                >
                  <Key className="mr-2 w-4 h-4" />
                  Enter Client Code
                </Button>
                
                <Button
                  onClick={logout}
                  variant="outline"
                  className="w-full h-12"
                >
                  Logout
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have a client code?{" "}
                  <span className="text-blue-600">Contact your speech therapist</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 relative overflow-hidden">
      {/* Large Static Glows */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-blue-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-sky-200/25 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-cyan-200/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
      {/* Session Modal */}
      {SessionModal}
      
      {/* Enhanced Header */}
      {(
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 py-4 sticky top-0 z-50"
        >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden hover:bg-blue-50 transition-colors"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SpeechTrack
                </h1>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 👤 ADMIN PANEL: Admin-only navigation button */}
            {isAdmin && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => router.push('/admin')}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Button>
              </motion.div>
            )}
            
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{linkedStudent?.name || 'Φόρτωση...'}</p>
              <p className="text-xs text-gray-500">Πρόοδος Συνεδριών: {calculateStats().completed}/{calculateStats().total}</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="w-10 h-10 border-2 border-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                  {linkedStudent?.name ? linkedStudent.name.split(' ').map(n => n[0]).join('') : 'Φ'}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
        </div>
        </motion.header>
      )}

      {/* Desktop Navigation Tabs */}
      {(
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="hidden md:block bg-white border-b border-gray-200 sticky top-[73px] z-40"
        >
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex space-x-1">

              <button
                onClick={() => setActiveTab("journey")}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "journey"
                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Πορεία Θεραπείας</span>
              </button>
              
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <User className="w-4 h-4" />
                <span>Προφίλ Παιδιού</span>
              </button>

              {/* Folder Info Button */}
              <button
                onClick={() => setShowFolderInfo(true)}
                className="flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Φάκελοι</span>
              </button>

            </div>
          </div>
        </motion.nav>
      )}

      {/* Main Content */}
      {(
      <main className="pb-4 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {activeTab === "journey" && <JourneyBoard />}
          {activeTab === "profile" && <ProfileTab />}
        </div>
      </main>
      )}
      


      {/* Enhanced Mobile Navigation Dock */}
      {(
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 md:hidden shadow-lg z-50"
      >
        <div className="flex items-center justify-around py-3 px-4 max-w-sm mx-auto">


          <motion.button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setActiveTab("journey");
            }}
            className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 ${
              activeTab === "journey" 
                ? "text-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BookOpen className={`w-6 h-6 mb-1 transition-transform ${activeTab === "journey" ? "scale-110" : ""}`} />
                                <span className="text-xs font-medium">Πορεία</span>
            {activeTab === "journey" && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
          
          <motion.button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 ${
              activeTab === "profile" 
                ? "text-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User className={`w-6 h-6 mb-1 transition-transform ${activeTab === "profile" ? "scale-110" : ""}`} />
                                <span className="text-xs font-medium">Προφίλ</span>
            {activeTab === "profile" && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>

          {/* Mobile Folder Info Button */}
          <motion.button
            type="button"
            onClick={() => setShowFolderInfo(true)}
            className="flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FolderOpen className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Φάκελοι</span>
          </motion.button>
          

        </div>
      </motion.nav>
      )}

      {/* Desktop Sidebar (for future implementation) */}
      <div className="hidden md:block">
        {/* Placeholder for desktop sidebar navigation */}
      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={showFilePreview}
          onClose={() => { setShowFilePreview(false); setPreviewFile(null); }}
          onDownload={() => handleFileDownload(previewFile)}
        />
      )}

      {/* Folder Info Modal */}
      {linkedStudent && (
        <FolderInfoModal
          isOpen={showFolderInfo}
          onClose={() => setShowFolderInfo(false)}
          studentId={linkedStudent.$id}
          studentName={linkedStudent.name}
        />
      )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ParentRoute>
      <DashboardContent />
    </ParentRoute>
  );
}