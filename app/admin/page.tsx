"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus, 
  Clock, 
  Calendar,
  FileText,
  MapPin,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
  MessageCircle,
  Filter,
  BookOpen,
  User,
  Settings,
  Edit,
  Trash2,

  Phone,
  Mail,
  X,
  Save,
  ArrowLeft,
  Users
} from "lucide-react";

// Interface for Journey Session
interface JourneySession {
  id: string;
  sessionNumber: number;
  title: string;
  description: string;
  date: string;
  duration: string;
  status: 'completed' | 'available' | 'locked' | 'canceled';
  therapistNotes?: string;
  homework?: string[];
  achievements?: string[];
  isPaid?: boolean;
  sessionSummary?: string;
}

// Interface for Student
interface Student {
  id: string;
  name: string;
  age: number;
  photo: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'completed';
  sessionsCompleted: number;
  totalSessions: number;
  nextSession?: string;
  therapist: string;
  diagnosis: string[];
  parentContact: {
    name: string;
    phone: string;
    email: string;
  };
}



// Interface for File Data
interface FileData {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string;
}

// Mock data for journey sessions
const mockJourneySessions: JourneySession[] = [
  {
    id: "1",
    sessionNumber: 1,
    title: "Αρχική Αξιολόγηση & Εισαγωγή",
    description: "Αρχική αξιολόγηση των δεξιοτήτων ομιλίας και καθορισμός στόχων",
    date: "2024-01-15",
    duration: "45 λεπτά",
    status: "completed",
    therapistNotes: "Emma έδειξε εξαιρετική ανταπόκριση στις αρχικές ασκήσεις αναπνοής. Θα συνεχίσουμε με εξάσκηση του ήχου 'ρ'.",
    homework: ["Ασκήσεις αναπνοής", "Εξάσκηση ήχων"],
    achievements: ["Ολοκλήρωση αξιολόγησης", "Πρώτη επαφή"],
    isPaid: true,
    sessionSummary: "Επιτυχής αρχική συνεδρία με εξαιρετική ανταπόκριση από το παιδί."
  },
  {
    id: "2",
    sessionNumber: 2, 
    title: "Εξάσκηση Ήχου Ρ - Βασικές Τεχνικές",
    description: "Εισαγωγή στις βασικές τεχνικές για την εκφορά του ήχου 'ρ'",
    date: "2024-01-22",
    duration: "45 λεπτά",
    status: "completed",
    therapistNotes: "Σημαντική πρόοδος στην εκφορά του ήχου 'ρ'. Emma έδειξε μεγάλη προσπάθεια.",
    homework: ["Εξάσκηση με κάρτες", "Καθημερινή εξάσκηση"],
    achievements: ["Πρώτος σωστός ήχος 'ρ'"],
    isPaid: true,
    sessionSummary: "Εξαιρετική πρόοδος στην εκφορά του στόχου ήχου."
  },
  {
    id: "3",
    sessionNumber: 3,
    title: "Ενδυνάμωση & Επανάληψη",
    description: "Ενδυνάμωση των τεχνικών και επανάληψη των προηγούμενων μαθημάτων",
    date: "2024-01-29",
    duration: "45 λεπτά",
    status: "available",
    therapistNotes: "",
    homework: [],
    achievements: [],
    isPaid: false,
    sessionSummary: ""
  },
  {
    id: "4",
    sessionNumber: 4,
    title: "Προχωρημένες Τεχνικές",
    description: "Εφαρμογή προχωρημένων τεχνικών για τη βελτίωση της ομιλίας",
    date: "2024-02-05",
    duration: "45 λεπτά",
    status: "locked",
    therapistNotes: "",
    homework: [],
    achievements: [],
    isPaid: false,
    sessionSummary: ""
  }
];

// Mock data for students
const mockStudents: Student[] = [
  {
    id: "1",
    name: "Emma Παπαδόπουλου",
    age: 7,
    photo: "/api/placeholder/100/100",
    joinDate: "2024-01-15",
    status: "active",
    sessionsCompleted: 2,
    totalSessions: 12,
    nextSession: "2024-01-29",
    therapist: "Δρ. Μαρία Κωνσταντίνου", 
    diagnosis: ["Δυσαρθρία", "Καθυστέρηση Ομιλίας"],
    parentContact: {
      name: "Αννα Παπαδοπούλου",
      phone: "+30 697 123 4567",
      email: "anna.papa@email.com"
    }
  },
  {
    id: "2",
    name: "Νίκος Γεωργίου",
    age: 5,
    photo: "/api/placeholder/100/100",
    joinDate: "2024-01-20",
    status: "active",
    sessionsCompleted: 1,
    totalSessions: 8,
    nextSession: "2024-02-01",
    therapist: "Δρ. Μαρία Κωνσταντίνου",
    diagnosis: ["Τραυλισμός"],
    parentContact: {
      name: "Πέτρος Γεωργίου",
      phone: "+30 697 987 6543",
      email: "petros.geo@email.com"
    }
  }
];

// Mock conversations data
const mockConversations = [
  {
    studentId: "1",
    studentName: "Emma Παπαδόπουλου",
    lastMessage: "Θα θέλαμε να μετακινήσουμε το επόμενο ραντεβού...",
    timestamp: "10:30",
    unreadCount: 2,
    messages: [
      { id: "1", sender: "parent", message: "Καλησπέρα! Πώς πήγε η σημερινή συνεδρία;", timestamp: "09:15", isRead: true },
      { id: "2", sender: "therapist", message: "Καλησπέρα! Η Emma τα πήγε εξαιρετικά σήμερα. Έκανε μεγάλη πρόοδο στις ασκήσεις αναπνοής.", timestamp: "09:20", isRead: true },
      { id: "3", sender: "parent", message: "Θα θέλαμε να μετακινήσουμε το επόμενο ραντεβού...", timestamp: "10:30", isRead: false },
      { id: "4", sender: "parent", message: "Είναι δυνατόν να το κάνουμε Παρασκευή αντί για Τετάρτη;", timestamp: "10:31", isRead: false }
    ]
  },
  {
    studentId: "2",
    studentName: "Νίκος Γεωργίου", 
    lastMessage: "Ευχαριστούμε για τις χθεσινές οδηγίες!",
    timestamp: "Χθες",
    unreadCount: 0,
    messages: [
      { id: "1", sender: "parent", message: "Ευχαριστούμε για τις χθεσινές οδηγίες!", timestamp: "18:45", isRead: true },
      { id: "2", sender: "therapist", message: "Παρακαλώ! Συνεχίστε με τις ασκήσεις στο σπίτι.", timestamp: "19:00", isRead: true }
    ]
  }
];

export default function AdminPage() {
  const router = useRouter();
  const [students, setStudents] = useState(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student>(mockStudents[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("journey");
  const [journeySessions, setJourneySessions] = useState(mockJourneySessions);
  const [showStudentSelector, setShowStudentSelector] = useState(false);


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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-500";
      case 'available':
        return "bg-blue-500";
      case 'locked':
        return "bg-gray-400";
      case 'canceled':
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleEditSession = useCallback((sessionId: string) => {
    router.push(`/admin/edit/${sessionId}`);
  }, [router]);

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student);
    setShowStudentSelector(false);
  }, []);

  const handleCreateNewSession = useCallback(() => {
    const newSession: JourneySession = {
      id: Date.now().toString(),
      sessionNumber: journeySessions.length + 1,
      title: `Συνεδρία ${journeySessions.length + 1}`,
      description: "",
      date: new Date().toISOString().split('T')[0],
      duration: "45 λεπτά",
      status: "available",
      therapistNotes: "",
      homework: [],
      achievements: [],
      isPaid: false,
      sessionSummary: ""
    };
    
    setJourneySessions(prev => [...prev, newSession]);
    router.push(`/admin/edit/${newSession.id}`);
  }, [journeySessions, router]);

  const handleCreateNewStudent = useCallback(() => {
    router.push('/admin/create-student');
  }, [router]);

  const handleEditStudent = useCallback((student: Student) => {
    // For now, just log - we can implement edit functionality later
    console.log('Edit student:', student);
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // If we deleted the selected student, select the first remaining one
    if (selectedStudent.id === studentId) {
      const remainingStudents = students.filter(s => s.id !== studentId);
      setSelectedStudent(remainingStudents[0] || null);
    }
  }, [selectedStudent, students]);



  // Mobile-First Student Selector Component
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
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleStudentSelect(student)}
                  className={`p-4 rounded-xl mb-3 cursor-pointer transition-all ${
                    selectedStudent.id === student.id 
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
                      <p className="text-sm text-gray-600">{student.age} ετών • {student.sessionsCompleted}/{student.totalSessions} συνεδρίες</p>
                      </div>
                    {selectedStudent.id === student.id && (
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



  

  const handleStudentMessageClick = useCallback((studentId: string) => {
    router.push('/admin/messages');
  }, [router]);

  const handleMessagesClick = useCallback(() => {
    router.push('/admin/messages');
  }, [router]);

  

  // Students Management Tab
  const StudentsTab = () => (
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
        {students.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {student.name.charAt(0)}
                  </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.age} ετών</p>
                </div>
              </div>
                <Badge className={`${
                  student.status === 'active' ? 'bg-green-100 text-green-800' :
                  student.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {student.status === 'active' ? 'Ενεργός' :
                   student.status === 'inactive' ? 'Ανενεργός' : 'Ολοκληρώθηκε'}
                </Badge>
            </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Πρόοδος:</span>
                  <span className="font-medium">{student.sessionsCompleted}/{student.totalSessions}</span>
            </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Θεραπευτής:</span>
                  <span className="font-medium truncate ml-2">{student.therapist}</span>
            </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Επόμενη συνεδρία:</span>
                  <span className="font-medium">{student.nextSession || 'Μη προγραμματισμένη'}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditStudent(student)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Επεξεργασία
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStudentMessageClick(student.id)}
                  className="flex-1"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Μηνύματα
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDeleteStudent(student.id)}
                  className="text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Student Selector Modal */}
      <MobileStudentSelector />
      


      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">Πάνελ Διαχειριστή</h1>
            </div>
            
            {/* Student Selector - Desktop (only visible in journey tab) */}
            {activeTab === "journey" && (
              <div className="hidden lg:flex items-center space-x-4">
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedStudent?.name?.charAt(0)}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{selectedStudent?.name}</p>
                    <p className="text-gray-600">{selectedStudent?.age} ετών</p>
                  </div>
            <Button 
              variant="ghost" 
              size="sm" 
                    onClick={() => setShowStudentSelector(true)}
                    className="ml-2"
            >
                    <ChevronDown className="w-4 h-4" />
            </Button>
              </div>
            </div>
            )}

            {/* Student Selector - Mobile (only visible in journey tab) */}
            {activeTab === "journey" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStudentSelector(true)}
                className="lg:hidden"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {selectedStudent?.name?.charAt(0)}
            </div>
                  <ChevronDown className="w-4 h-4" />
          </div>
              </Button>
            )}
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
              onClick={handleMessagesClick}
              className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-sm relative"
            >
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Μηνύματα
              {mockConversations.reduce((acc, conv) => acc + conv.unreadCount, 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {mockConversations.reduce((acc, conv) => acc + conv.unreadCount, 0)}
                </span>
              )}
            </button>

          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
      {activeTab === "journey" && (
            <div className="space-y-6">
              {/* Journey Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Πορεία Θεραπείας</h2>
                  <p className="text-gray-600">Διαχειριστείτε τις συνεδρίες του μαθητή σας</p>
                </div>
                <Button onClick={handleCreateNewSession} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Νέα Συνεδρία
                </Button>
              </div>

              {/* Journey Timeline */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 sm:left-12 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                {/* Sessions */}
                <div className="space-y-6 sm:space-y-8">
                  {journeySessions.map((session, index) => (
        <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex items-start"
                    >
                      {/* Timeline Node */}
                      <div className={`${getStatusColor(session.status)} w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10`}>
                        {session.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        ) : session.status === 'available' ? (
                          <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        ) : (
                          <Circle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        )}
              </div>

                      {/* Session Card */}
                      <div className="ml-6 sm:ml-8 flex-1">
                        <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                          <CardContent className="p-4 sm:p-6">
                            <div onClick={() => handleEditSession(session.id)}>
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 mb-4">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                                    Συνεδρία {session.sessionNumber}: {session.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{session.description}</p>
            </div>
                                <div className="flex flex-col sm:items-end space-y-2">
                                  <Badge className={`${
                                    session.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    session.status === 'available' ? 'bg-blue-100 text-blue-800' :
                                    session.status === 'locked' ? 'bg-gray-100 text-gray-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {getStatusText(session.status)}
              </Badge>
                                  {session.isPaid && (
                                    <Badge className="bg-green-100 text-green-800">
                                      Πληρωμένη
                                    </Badge>
                                  )}
            </div>
        </div>

                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 space-y-2 sm:space-y-0">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    {new Date(session.date).toLocaleDateString('el-GR')}
        </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {session.duration}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <Button
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSession(session.id);
                                }}
                                className="hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto min-h-[36px]"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Επεξεργασία Συνεδρίας
                              </Button>
              </div>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
          ))}
        </div>
              </div>
            </div>
          )}

          {activeTab === "students" && <StudentsTab />}
          



        </div>
      </div>
    </div>
  );
}
