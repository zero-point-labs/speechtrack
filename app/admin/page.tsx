"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AdminRoute, useLogout } from "@/lib/auth-middleware";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { databases, appwriteConfig, Query } from "@/lib/appwrite.client";
import { motion, AnimatePresence } from "framer-motion";
import EnhancedProgressCard from "@/components/EnhancedProgressCard";
import { 
  Search, 
  Plus, 
  Clock, 
  Calendar,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
  MessageCircle,
  BookOpen,
  User,
  Edit,
  Trash2,
  Phone,
  Mail,
  X,
  Users,
  PlayCircle,
  Lock
} from "lucide-react";

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

// TypeScript interfaces for real data
interface Student {
  $id: string;
  name: string;
  age: number; // Legacy field - will be removed
  dateOfBirth?: string; // New field for age calculation
  status: string;
  totalSessions: number;
  completedSessions: number;
  clientCode: string;
  joinDate: string;
  parentContact: string;
  $createdAt: string;
}

interface Session {
  $id: string;
  studentId: string;
  sessionNumber: number;
  title: string;
  description: string;
  date: string;
  duration: string;
  status: string;
  isPaid: boolean;
  therapistNotes?: string;
  $createdAt: string;
}

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logout = useLogout();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("journey");
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [sessionsPerPage] = useState(12);
  const [loadingPage, setLoadingPage] = useState(false);
  const [studentsListLoaded, setStudentsListLoaded] = useState(false);

  // Load sessions for student with pagination
  const loadSessionsForStudent = useCallback(async (studentId: string, page: number = 1) => {
    try {
      setLoadingPage(page !== 1); // Show loading for page changes, not initial load
      
      // First, get total count of sessions for this student
      const totalCountResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          Query.equal('studentId', studentId),
          Query.limit(1) // We just need the total count
        ]
      );
      
      const totalCount = totalCountResponse.total;
      setTotalSessions(totalCount);
      setTotalPages(Math.ceil(totalCount / sessionsPerPage));
      
      // Get count of completed sessions
      const completedCountResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          Query.equal('studentId', studentId),
          Query.equal('status', 'completed'),
          Query.limit(1) // We just need the total count
        ]
      );
      
      setCompletedSessions(completedCountResponse.total);
      
      // Then get the paginated sessions
      const offset = (page - 1) * sessionsPerPage;
      const sessionsResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [
          Query.equal('studentId', studentId),
          Query.orderAsc('sessionNumber'),
          Query.limit(sessionsPerPage),
          Query.offset(offset)
        ]
      );
      
      console.log(`Loaded ${sessionsResponse.documents.length} sessions for student: ${studentId} (page ${page})`);
      setSessions(sessionsResponse.documents as Session[]);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingPage(false);
    }
  }, [sessionsPerPage]);

  // Main data loading function - simplified to avoid circular dependencies
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Debug: Check environment variables
      console.log('🔍 Checking Appwrite config:', {
        databaseId: appwriteConfig.databaseId,
        studentsCollection: appwriteConfig.collections.students,
        endpoint: appwriteConfig.endpoint
      });
      
      // Check if we have a student ID from URL
      const studentIdFromUrl = searchParams.get('studentId');
      console.log('🔍 Student ID from URL:', studentIdFromUrl);
      
      if (studentIdFromUrl) {
        // Load only the selected student from URL
        try {
          console.log('🔄 Loading selected student from URL...');
          const studentResponse = await databases.getDocument(
            appwriteConfig.databaseId!,
            appwriteConfig.collections.students!,
            studentIdFromUrl
          );
          
          const student = studentResponse as Student;
          console.log('✅ Loaded selected student:', student.name);
          setSelectedStudent(student);
          await loadSessionsForStudent(studentIdFromUrl, 1);
          
        } catch (error) {
          console.error('❌ Error loading selected student:', error);
          // If student not found, load students list as fallback
          await loadStudentsList();
        }
      } else {
        // Load students list to get the first one
        console.log('🔄 Loading students list...');
        await loadStudentsList();
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      console.error('Full error details:', error);
    } finally {
      setLoading(false);
    }
    
    // Helper function to load students list
    async function loadStudentsList() {
      try {
        console.log('🔄 Fetching students from database...');
        const studentsResponse = await databases.listDocuments(
          appwriteConfig.databaseId!,
          appwriteConfig.collections.students!,
          [Query.orderDesc('$createdAt')]
        );
        
        const studentsData = studentsResponse.documents as Student[];
        console.log(`✅ Loaded ${studentsData.length} students:`, studentsData.map(s => s.name));
        setStudents(studentsData);
        setStudentsListLoaded(true);
        
        // If no selected student, select the first one
        if (studentsData.length > 0) {
          console.log('🎯 Auto-selecting first student:', studentsData[0].name);
          setSelectedStudent(studentsData[0]);
          await loadSessionsForStudent(studentsData[0].$id, 1);
        } else {
          console.log('⚠️ No students found in database');
        }
      } catch (error) {
        console.error('❌ Error loading students list:', error);
        console.error('Students list error details:', error);
      }
    }
  }, [searchParams, loadSessionsForStudent]);

  // Load students list when student selector is opened
  const loadStudentsListExternal = useCallback(async () => {
    try {
      if (!studentsListLoaded) {
        console.log('🔄 Loading students for selector...');
        const studentsResponse = await databases.listDocuments(
          appwriteConfig.databaseId!,
          appwriteConfig.collections.students!,
          [Query.orderDesc('$createdAt')]
        );
        
        const studentsData = studentsResponse.documents as Student[];
        console.log(`✅ Loaded ${studentsData.length} students for selector`);
        setStudents(studentsData);
        setStudentsListLoaded(true);
      } else {
        console.log('ℹ️ Students already loaded, skipping...');
      }
    } catch (error) {
      console.error('❌ Error loading students list for selector:', error);
    }
  }, [studentsListLoaded]);

  // Load data from Appwrite - run only once on mount
  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, students]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'available':
        return <Circle className="w-4 h-4 text-blue-500" />;
      case 'locked':
        return <Circle className="w-4 h-4 text-gray-400" />;
      case 'canceled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Ολοκληρωμένη';
      case 'available':
        return 'Διαθέσιμη';
      case 'locked':
        return 'Κλειδωμένη';
      case 'canceled':
        return 'Ακυρωμένη';
      default:
        return 'Άγνωστη';
    }
  };

  const handleEditSession = useCallback((sessionId: string) => {
    const studentParam = selectedStudent ? `?studentId=${selectedStudent.$id}` : '';
    router.push(`/admin/edit/${sessionId}${studentParam}`);
  }, [router, selectedStudent]);

  const handleStudentSelect = useCallback(async (student: Student) => {
    setSelectedStudent(student);
    setShowStudentSelector(false);
    
    // Reset pagination to first page
    setCurrentPage(1);
    await loadSessionsForStudent(student.$id, 1);
    
    // Update URL to reflect selected student
    const newUrl = `/admin?studentId=${student.$id}`;
    window.history.replaceState(null, '', newUrl);
  }, [loadSessionsForStudent]);

  // Pagination handlers
  const handlePreviousPage = useCallback(async () => {
    if (currentPage > 1 && selectedStudent) {
      const newPage = currentPage - 1;
      await loadSessionsForStudent(selectedStudent.$id, newPage);
    }
  }, [currentPage, selectedStudent, loadSessionsForStudent]);

  const handleNextPage = useCallback(async () => {
    if (currentPage < totalPages && selectedStudent) {
      const newPage = currentPage + 1;
      await loadSessionsForStudent(selectedStudent.$id, newPage);
    }
  }, [currentPage, totalPages, selectedStudent, loadSessionsForStudent]);

  // URL parameter handling is now done in loadData() to avoid infinite loops
  // This effect was causing circular dependencies and infinite re-renders

  // Load students list when student selector is opened
  const handleOpenStudentSelector = useCallback(async () => {
    setShowStudentSelector(true);
    if (!studentsListLoaded) {
      await loadStudentsListExternal();
    }
  }, [studentsListLoaded, loadStudentsListExternal]);

  const handleCreateNewStudent = useCallback(() => {
    router.push('/admin/create-student');
  }, [router]);

  const handleCreateNewSession = useCallback(() => {
    if (selectedStudent) {
      // Create new session with timestamp as ID and redirect to edit page
      const newSessionId = Date.now().toString();
      const studentParam = `?studentId=${selectedStudent.$id}`;
      router.push(`/admin/edit/${newSessionId}${studentParam}`);
    }
  }, [router, selectedStudent]);

  // Parse parent contact info
  const getParentContact = useCallback((parentContactString: string) => {
    try {
      return JSON.parse(parentContactString);
    } catch {
      return { name: 'Άγνωστος', email: '', phone: '' };
    }
  }, []);

  // Mobile Student Selector Component
  const MobileStudentSelector = () => (
    <AnimatePresence>
      {showStudentSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowStudentSelector(false);
          }}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:w-[90%] sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Επιλογή Μαθητή</h2>
                <button
                  onClick={() => setShowStudentSelector(false)}
                  className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
            </div>

            {/* Search */}
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Αναζήτηση μαθητή..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:bg-white/30"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4">
              {filteredStudents.map((student, index) => (
                <motion.div
                  key={student.$id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-4 rounded-xl mb-3 cursor-pointer transition-all ${
                    selectedStudent?.$id === student.$id 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-600">{student.dateOfBirth ? calculateAge(student.dateOfBirth) : student.age} ετών • {student.completedSessions}/{student.totalSessions} συνεδρίες</p>
                      </div>
                    {selectedStudent?.$id === student.$id && (
                      <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση δεδομένων...</p>
        </div>
      </div>
    );
  }

  // Show "no students" state if loading is complete but no students found
  if (!loading && (!students || students.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν μαθητές</h3>
          <p className="text-gray-600 mb-6">Δημιουργήστε τον πρώτο μαθητή για να ξεκινήσετε</p>
          <Button onClick={handleCreateNewStudent} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Νέος Μαθητής
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 relative overflow-hidden">
      {/* Large Static Glows - Different positioning for admin */}
      <div className="absolute top-0 left-0 w-[750px] h-[750px] bg-gradient-to-br from-indigo-200/25 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[650px] h-[650px] bg-gradient-to-tl from-blue-200/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-sky-200/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
      {/* Mobile Student Selector Modal */}
      <MobileStudentSelector />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Πάνελ Διαχειριστή</h1>
                </div>

            {/* Student Selector - Desktop */}
            {activeTab === "journey" && selectedStudent && (
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedStudent.name.charAt(0)}
                    </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{selectedStudent.name}</p>
                    <p className="text-gray-600">{selectedStudent.dateOfBirth ? calculateAge(selectedStudent.dateOfBirth) : selectedStudent.age} ετών</p>
                    </div>
                              <Button
              variant="ghost" 
                                size="sm"
                    onClick={handleOpenStudentSelector}
                    className="ml-2"
                              >
                    <ChevronDown className="w-4 h-4" />
                              </Button>
                    </div>
                  </div>
                    )}

            {/* Student Selector - Mobile */}
            {activeTab === "journey" && selectedStudent && (
                            <Button
                variant="ghost"
                              size="sm"
                onClick={handleOpenStudentSelector}
                className="lg:hidden"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {selectedStudent.name.charAt(0)}
                          </div>
                  <ChevronDown className="w-4 h-4" />
                    </div>
              </Button>
            )}

            {/* Logout Button */}
            <Button onClick={logout} variant="outline" className="ml-4">
              Αποσύνδεση
            </Button>
                          </div>
                    </div>
                  </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("journey")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "journey"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Πορεία Θεραπείας
            </button>
        <button
              onClick={() => setActiveTab("students")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "students"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Μαθητές
        </button>
                  <button
              onClick={() => router.push('/admin/messages')}
              className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm"
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Μηνύματα
                  </button>
          </nav>
                </div>

        {/* Tab Content */}
              <div className="space-y-6">
          {activeTab === "journey" && selectedStudent && (
        <div className="space-y-8 pb-8 md:pb-0">
          {/* Journey Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
              <h2 className="text-2xl font-bold text-gray-900">Πορεία Θεραπείας</h2>
              <p className="text-gray-600">Διαχειριστείτε τις συνεδρίες του μαθητή σας</p>
                </div>
                <Button onClick={handleCreateNewSession} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Νέα Συνεδρία
            </Button>
                      </div>
                      
          <EnhancedProgressCard
            studentName={selectedStudent.name}
            completedSessions={completedSessions}
            totalSessions={totalSessions}
            remainingSessions={totalSessions - completedSessions}
            streak={selectedStudent.streak || 0}
            level={selectedStudent.level || "Αρχάριος"}
            achievements={selectedStudent.achievements || []}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loadingPage}
                  className="flex items-center space-x-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>Προηγούμενη</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || loadingPage}
                  className="flex items-center space-x-1"
                >
                  <span>Επόμενη</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
            
              <div className="flex items-center space-x-4">
                {loadingPage && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm">Φόρτωση...</span>
                </div>
                )}
                <span className="text-sm text-gray-600">
                  Σελίδα {currentPage} από {totalPages}
                </span>
                <span className="text-xs text-gray-500">
                  ({sessions.length} από {totalSessions} συνεδρίες)
                </span>
              </div>
                </div>
          )}

          {/* Timeline */}
          <div className="relative px-2 md:px-0">
            {/* Timeline Line */}
            <div className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500 opacity-30"></div>
            
            {/* Progress Line */}
            <motion.div 
              className="absolute left-5 md:left-8 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500"
              initial={{ height: 0 }}
              animate={{ 
                    height: totalSessions > 0 ? `${(completedSessions / totalSessions) * 100}%` : '0%'
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Session Cards */}
            <div className="space-y-6 md:space-y-8 pb-32 md:pb-8">
                  {sessions.map((session, index) => (
            <motion.div
                      key={session.$id}
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
                              : session.status === "cancelled"
                    ? "bg-gradient-to-br from-red-400 to-red-600"
                    : "bg-gradient-to-br from-gray-300 to-gray-500"
                  }
                    `}
                  >
                    {session.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />
                          ) : session.status === "cancelled" ? (
                      <X className="w-5 h-5 md:w-8 md:h-8 text-white" />
                    ) : (
                      <Lock className="w-4 h-4 md:w-6 md:h-6 text-white" />
                    )}
                  </motion.div>
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
                                : session.status === "cancelled"
                          ? "bg-gradient-to-br from-white to-red-50/30 border-red-200/50 hover:border-red-300"
                          : "bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200/50 hover:border-gray-300"
                        }
                      `}
                            onClick={(e) => {
                        e.preventDefault();
                              e.stopPropagation();
                              handleEditSession(session.$id);
                            }}
                    >
                      <div className="px-4 md:px-6 py-4 md:py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Main session info */}
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 text-base md:text-lg group-hover:text-blue-700 transition-colors">
                                      Συνεδρία {session.sessionNumber}
                              </h4>
                              <Badge 
                                variant={session.isPaid ? "default" : "destructive"}
                                className={`text-xs ${session.isPaid ? "bg-green-100 text-green-800 border-green-300" : ""}`}
                              >
                                {session.isPaid ? "Πληρωμένη" : "Απλήρωτη"}
                              </Badge>
                      </div>

                            <h5 className="font-medium text-gray-700 text-sm md:text-base mb-2 group-hover:text-gray-900 transition-colors line-clamp-1">
                              {session.title}
                            </h5>
                            
                            {/* Essential metadata */}
                            <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-600">
                        <span className="flex items-center">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                          {new Date(session.date).toLocaleDateString('el-GR')}
                        </span>
                        <span className="flex items-center">
                                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                      {session.duration} λεπτά
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
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                          </div>
                        </div>
                      </div>
                </Card>
            </motion.div>
                      </div>
                    </motion.div>
            ))}
                </div>
              </div>
        </div>
      )}

          {activeTab === "students" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Διαχείριση Μαθητών</h2>
                  <p className="text-gray-600">Διαχειριστείτε τους μαθητές σας και τα στοιχεία τους</p>
                </div>
                <Button onClick={handleCreateNewStudent} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Νέος Μαθητής
                </Button>
              </div>

              {/* Students Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => {
                  const parentContact = getParentContact(student.parentContact);
                  return (
                    <Card key={student.$id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {/* Student card header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{student.name}</h3>
                              <p className="text-sm text-gray-600">{student.dateOfBirth ? calculateAge(student.dateOfBirth) : student.age} ετών</p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Ενεργός
                          </Badge>
                        </div>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Πρόοδος</span>
                            <span>{student.completedSessions}/{student.totalSessions}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(student.completedSessions / student.totalSessions) * 100}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Parent Contact */}
                        <div className="text-sm text-gray-600 mb-4">
                          <p><strong>Γονέας:</strong> {parentContact.name}</p>
                          <p><strong>Email:</strong> {parentContact.email}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex space-x-2 pt-4 border-t border-gray-200">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/edit-student/${student.$id}`)}
                            className="flex-1"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Επεξεργασία
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/messages?student=${student.$id}`)}
                            className="flex-1"
                          >
                            <MessageCircle className="w-3 h-3 mr-1" />
                            Μηνύματα
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminPageContent />
    </AdminRoute>
  );
}
