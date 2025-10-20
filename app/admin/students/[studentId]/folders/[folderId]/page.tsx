"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-middleware";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { 
  ArrowLeft,
  Folder,
  FolderOpen,
  Plus,
  Calendar,
  Eye,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Play,
  Users,
  Home
} from "lucide-react";
import { motion } from "framer-motion";
import TutorialCard from "@/components/admin/TutorialCard";
import { FolderPageSkeleton } from "@/components/admin/FolderPageSkeleton";

// Greek language constants
const GREEK_TEXT = {
  // Header
  folderSessions: "Συνεδρίες Φακέλου",
  sessionsIn: "Συνεδρίες στο φάκελο",
  manageSessions: "Διαχείριση συνεδριών του φακέλου",
  
  // Navigation
  back: "Πίσω",
  dashboard: "Αρχική",
  adminPanel: "Πίνακας Διαχείρισης",
  folders: "Φάκελοι",
  
  // Session Management
  addSession: "Προσθήκη Συνεδρίας",
  sessionNumber: "Συνεδρία",
  sessionTitle: "Τίτλος",
  sessionDate: "Ημερομηνία",
  sessionDuration: "Διάρκεια",
  sessionStatus: "Κατάσταση",
  
  // Actions
  view: "Προβολή",
  edit: "Επεξεργασία",
  start: "Έναρξη",
  
  // Status
  locked: "Κλειδωμένη",
  unlocked: "Ξεκλείδωτη",
  completed: "Ολοκληρωμένη",
  active: "Ενεργή",
  
  // Messages
  loading: "Φόρτωση...",
  noSessions: "Δεν υπάρχουν συνεδρίες",
  noSessionsDescription: "Οι συνεδρίες για αυτόν τον φάκελο θα εμφανιστούν εδώ",
  
  // Session Info
  minutesAbbr: "λεπτά",
  isPaid: "Πληρωμένη",
  notPaid: "Απλήρωτη",
  
  // Error Messages
  folderNotFound: "Ο φάκελος δεν βρέθηκε",
  studentNotFound: "Ο μαθητής δεν βρέθηκε", 
  failedToLoad: "Αποτυχία φόρτωσης δεδομένων",
  failedToLoadSessions: "Αποτυχία φόρτωσης συνεδριών",
  
  // Statistics
  totalSessions: "Σύνολο Συνεδριών",
  completedSessions: "Ολοκληρωμένες",
  upcomingSessions: "Επόμενες",
  lockedSessions: "Κλειδωμένες"
};

interface Student {
  $id: string;
  name: string;
  age?: number;
  dateOfBirth?: string;
  parentId: string;
  status: string;
}

interface SessionFolder {
  $id: string;
  studentId: string;
  name: string;
  description?: string;
  isActive: boolean;
  totalSessions: number;
  completedSessions: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

interface Session {
  $id: string;
  studentId: string;
  folderId: string;
  sessionNumber: number;
  title: string;
  description?: string;
  date: string;
  duration: string;
  status: 'locked' | 'unlocked' | 'completed';
  isPaid: boolean;
  therapistNotes?: string;
}

// 🔧 Helper function to extract numeric session number for display
const getDisplaySessionNumber = (sessionNumber: string | number): string => {
  if (typeof sessionNumber === 'number') return sessionNumber.toString();
  if (typeof sessionNumber === 'string') {
    const match = sessionNumber.match(/(\d+)/);
    return match ? match[1] : sessionNumber;
  }
  return sessionNumber?.toString() || '0';
};

export default function FolderSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  
  const studentId = params.studentId as string;
  const folderId = params.folderId as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [folder, setFolder] = useState<SessionFolder | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router]);

  // 🚀 OPTIMIZED: Load all data with single API call
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log('🚀 OPTIMIZATION: Loading optimized folder complete data...');
      console.log('🔍 DEBUGGING: Calling optimized API:', `/api/admin/folder-complete-data/${folderId}`);
      
      // ===== SINGLE OPTIMIZED API CALL =====
      // This replaces 4 separate queries with 1 efficient call
      const response = await fetch(`/api/admin/folder-complete-data/${folderId}`);
      
      if (!response.ok) {
        throw new Error(`Folder API error: ${response.status}`);
      }
      
      const { success, data, meta } = await response.json();
      
      if (!success) {
        throw new Error('Folder API returned unsuccessful response');
      }
      
      console.log(`✅ Folder complete data loaded in ${meta.loadTime}ms (${meta.improvement})`);
      
      // ===== UPDATE ALL STATE FROM SINGLE RESPONSE =====
      
      // Set student data
      setStudent({
        $id: data.student.id,
        name: data.student.name,
        age: data.student.age,
        dateOfBirth: data.student.dateOfBirth,
        parentId: data.student.parentId,
        status: data.student.status
      } as Student);
      
      // Set folder data with fresh statistics
      setFolder({
        $id: data.folder.id,
        studentId: data.folder.studentId,
        name: data.folder.name,
        description: data.folder.description,
        isActive: data.folder.isActive,
        totalSessions: data.folder.totalSessions, // Fresh calculated stats
        completedSessions: data.folder.completedSessions,
        startDate: data.folder.startDate,
        status: data.folder.status
      } as SessionFolder);
      
      // Set sessions data (already sorted by API)
      const formattedSessions = data.sessions.map((session: any) => ({
        $id: session.id,
        folderId: session.folderId,
        studentId: session.studentId,
        sessionNumber: session.sessionNumber, // Keep original format
        title: session.title,
        description: session.description,
        date: session.date,
        duration: session.duration,
        status: session.status,
        isPaid: session.isPaid,
        isGESY: session.isGESY,
        therapistNotes: session.therapistNotes,
        achievement: session.achievement,
        feedback: session.feedback
      }));
      
      setSessions(formattedSessions);
      
      console.log(`📊 Loaded folder "${data.folder.name}" with ${data.sessions.length} sessions`);

    } catch (error) {
      console.error("❌ Error loading optimized folder data:", error);
      setError(GREEK_TEXT.failedToLoad);
    } finally {
      setLoading(false);
    }
  };

  // Reload data when page becomes visible (e.g., when returning from session edit)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && studentId && folderId && isAuthenticated && isAdmin) {
        console.log('📄 Page became visible - refreshing folder data');
        loadData();
      }
    };

    const handleFocus = () => {
      if (studentId && folderId && isAuthenticated && isAdmin) {
        console.log('🔄 Window focused - refreshing folder data');
        loadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [studentId, folderId, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (studentId && folderId && isAuthenticated && isAdmin) {
      loadData();
    }
  }, [studentId, folderId, isAuthenticated, isAdmin]);

  // Status badge helper
  const getSessionStatusBadge = (session: Session) => {
    switch (session.status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            {GREEK_TEXT.completed}
          </Badge>
        );
      case 'unlocked':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">
            <Play className="w-3 h-3 mr-1" />
            {GREEK_TEXT.unlocked}
          </Badge>
        );
      case 'locked':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">
            <Clock className="w-3 h-3 mr-1" />
            {GREEK_TEXT.locked}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {session.status}
          </Badge>
        );
    }
  };

  // Show loading while checking auth
  if (authLoading || loading) {
    return <FolderPageSkeleton />;
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  // Only show "not found" if we're not loading and the data is actually missing
  if (!loading && (!student || !folder)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 px-4">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {!student ? GREEK_TEXT.studentNotFound : GREEK_TEXT.folderNotFound}
          </h2>
          <Button onClick={() => router.back()} variant="outline">
            {GREEK_TEXT.back}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-Friendly Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4">
            {/* Back button and title */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push(`/admin/students/${studentId}/folders`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.back}</span>
              </Button>
              
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2 sm:gap-3">
                  {folder.isActive ? (
                    <FolderOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0" />
                  ) : (
                    <Folder className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-600 flex-shrink-0" />
                  )}
                  <span className="leading-tight">
                    {folder.name} - {student.name}
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {GREEK_TEXT.manageSessions}
                </p>
                {folder.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {folder.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Home className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.dashboard}</span>
              </Button>
              <Button
                onClick={() => router.push("/admin")}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.adminPanel}</span>
              </Button>
              <Button
                onClick={() => router.push(`/admin/students/${studentId}/folders`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] flex-1 sm:flex-none justify-center"
              >
                <Folder className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.folders}</span>
              </Button>
              <Button
                onClick={() => {
                  // Generate a timestamp-based session ID (like the existing sessions)
                  const newSessionId = Date.now().toString();
                  // Navigate directly to edit page for new session
                  router.push(`/admin/edit/${newSessionId}?studentId=${studentId}&folderId=${folderId}`);
                }}
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] bg-green-600 hover:bg-green-700 flex-1 sm:flex-none justify-center"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">{GREEK_TEXT.addSession}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm sm:text-base"
          >
            {error}
          </motion.div>
        )}

        {/* Folder Info Card */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{folder.totalSessions}</p>
                <p className="text-sm text-gray-600">{GREEK_TEXT.totalSessions}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{folder.completedSessions}</p>
                <p className="text-sm text-gray-600">{GREEK_TEXT.completedSessions}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {sessions.filter(s => s.status === 'locked').length}
                </p>
                <p className="text-sm text-gray-600">{GREEK_TEXT.lockedSessions}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {sessions.filter(s => s.status === 'cancelled' || s.status === 'canceled').length}
                </p>
                <p className="text-sm text-gray-600">Ακυρωμένες</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {GREEK_TEXT.noSessions}
              </h3>
              <p className="text-gray-600 mb-6">
                {GREEK_TEXT.noSessionsDescription}
              </p>
              <Button
                onClick={() => router.push(`/admin/create-session?studentId=${studentId}&folderId=${folderId}`)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4" />
                {GREEK_TEXT.addSession}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.$id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Session Info */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Session Number Circle */}
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 text-lg ${
                        session.status === 'completed' ? 'bg-green-600' :
                        session.status === 'unlocked' ? 'bg-blue-600' : 'bg-gray-400'
                      }`}>
                        {getDisplaySessionNumber(session.sessionNumber)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                            {session.title}
                          </h3>
                          {getSessionStatusBadge(session)}
                        </div>
                        
                        {session.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {session.description}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.date).toLocaleDateString('el-GR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.duration}
                          </span>
                          <span className={`flex items-center gap-1 ${
                            session.isPaid ? 'text-green-600' : 'text-orange-600'
                          }`}>
                            <CheckCircle className="w-3 h-3" />
                            {session.isPaid ? GREEK_TEXT.isPaid : GREEK_TEXT.notPaid}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => router.push(`/admin/edit/${session.$id}`)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-1 min-h-[40px] text-xs sm:text-sm"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{GREEK_TEXT.view}</span>
                      </Button>
                      
                      {session.status === 'unlocked' && (
                        <Button
                          onClick={() => router.push(`/dashboard/session/${session.$id}`)}
                          size="sm"
                          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 min-h-[40px] text-xs sm:text-sm"
                        >
                          <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{GREEK_TEXT.start}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tutorial Card */}
        <TutorialCard
          title="Οδηγός Διαχείρισης Συνεδριών Φακέλου"
          description="Μάθετε πώς να προβάλλετε, επεξεργάζεστε και διαχειρίζεστε τις συνεδρίες μέσα σε κάθε φάκελο."
          steps={[
            {
              title: "Προβολή Συνεδριών",
              description: "Δείτε όλες τις συνεδρίες του φακέλου με αριθμό, τίτλο, ημερομηνία και κατάσταση.",
              action: "Οι συνεδρίες εμφανίζονται σε χρονολογική σειρά"
            },
            {
              title: "Επεξεργασία Συνεδρίας",
              description: "Κάντε κλικ στο κουμπί 'Επεξεργασία' για να αλλάξετε στόχους, δραστηριότητες και σημειώσεις.",
              action: "Μπορείτε να προσαρμόσετε κάθε συνεδρία στις ανάγκες του μαθητή"
            },
            {
              title: "Κατάσταση Συνεδριών",
              description: "Παρακολουθήστε την πρόοδο: Κλειδωμένες, Ενεργές, Ολοκληρωμένες ή Ακυρωμένες συνεδρίες.",
              action: "Οι κλειδωμένες συνεδρίες ξεκλειδώνουν αυτόματα μετά την προηγούμενη"
            },
            {
              title: "Έναρξη Συνεδρίας",
              description: "Χρησιμοποιήστε το κουμπί 'Έναρξη' για συνεδρίες που είναι έτοιμες προς χρήση.",
              action: "Αυτό θα μεταφέρει στη σελίδα συνεδρίας για τον μαθητή"
            }
          ]}
        />
      </div>
    </div>
  );
}
