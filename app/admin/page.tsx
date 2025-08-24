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
  Users,
  PlayCircle,
  Lock
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
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);


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
    router.push(`/admin/edit-student/${student.id}`);
  }, [router]);

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
    router.push(`/admin/messages?student=${studentId}`);
  }, [router]);

  const handleMessagesClick = useCallback(() => {
    router.push('/admin/messages');
  }, [router]);

  const handleStudentCardClick = useCallback((student: Student) => {
    setSelectedStudentForModal(student);
  }, []);

  const handleCloseStudentModal = useCallback(() => {
    setSelectedStudentForModal(null);
  }, []);

  

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
          <Card 
            key={student.id} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleStudentCardClick(student)}
          >
            <CardContent className="p-6">
              {/* Student card header */}
              <div className="flex items-center justify-between mb-4">
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

              {/* Action buttons */}
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                      <Button
                        size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditStudent(student);
                  }}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Επεξεργασία
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStudentMessageClick(student.id);
                  }}
                  className="flex-1"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Μηνύματα
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
      
      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudentForModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center"
            onClick={handleCloseStudentModal}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 1 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "100%", opacity: 0, scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:w-[90%] sm:max-w-md h-[85vh] sm:h-auto sm:max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Pull Indicator */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
                  </div>
                  
              {/* Modal Header - Compact for Mobile */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-2xl">
                      {selectedStudentForModal.name.charAt(0)}
                    </div>
                            <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-bold truncate">{selectedStudentForModal.name}</h2>
                      <p className="text-blue-100 text-sm">{selectedStudentForModal.age} ετών</p>
                      <Badge className={`mt-1 text-xs ${
                        selectedStudentForModal.status === 'active' ? 'bg-green-500 text-white' :
                        selectedStudentForModal.status === 'inactive' ? 'bg-gray-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {selectedStudentForModal.status === 'active' ? 'Ενεργός' :
                         selectedStudentForModal.status === 'inactive' ? 'Ανενεργός' : 'Ολοκληρώθηκε'}
                      </Badge>
                      </div>
                          </div>
                  <button
                    onClick={handleCloseStudentModal}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                      </div>
                    </div>

              {/* Modal Content - Mobile Optimized Scrolling */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 sm:p-6 space-y-6">
                  
                  {/* Basic Information - Mobile Stacked */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-500" />
                      Βασικά Στοιχεία
                      </h3>
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Θεραπευτής</p>
                        <p className="font-medium text-gray-900">{selectedStudentForModal.therapist}</p>
                    </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Ημερομηνία εγγραφής</p>
                        <p className="font-medium text-gray-900">{new Date(selectedStudentForModal.joinDate).toLocaleDateString('el-GR')}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Επόμενη συνεδρία</p>
                        <p className="font-medium text-gray-900">{selectedStudentForModal.nextSession ? new Date(selectedStudentForModal.nextSession).toLocaleDateString('el-GR') : 'Μη προγραμματισμένη'}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Πρόοδος συνεδριών</p>
                        <p className="font-medium text-gray-900">{selectedStudentForModal.sessionsCompleted}/{selectedStudentForModal.totalSessions}</p>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(selectedStudentForModal.sessionsCompleted / selectedStudentForModal.totalSessions) * 100}%` }}
                          ></div>
                              </div>
                            </div>
                            </div>
                          </div>



                  {/* Parent Contact Information - Mobile Optimized */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-500" />
                      Στοιχεία Γονέα/Κηδεμόνα
                    </h3>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                  </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{selectedStudentForModal.parentContact.name}</p>
                          <p className="text-sm text-gray-600">Γονέας/Κηδεμόνας</p>
                              </div>
                            </div>
                      
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-600">Τηλέφωνο</p>
                              <p className="font-medium text-gray-900 truncate">{selectedStudentForModal.parentContact.phone}</p>
                          </div>
                        </div>
                    </div>

                        <div className="bg-white p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-gray-600">Email</p>
                              <p className="font-medium text-gray-900 truncate">{selectedStudentForModal.parentContact.email}</p>
                      </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="p-4 sm:p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <Button
                    onClick={() => {
                      handleCloseStudentModal();
                      handleEditStudent(selectedStudentForModal);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Επεξεργασία
                  </Button>
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => {
                        handleCloseStudentModal();
                        handleStudentMessageClick(selectedStudentForModal.id);
                      }}
                      variant="outline"
                      className="flex-1 py-3"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Μηνύματα
                    </Button>
                  <Button
                      onClick={() => {
                        handleCloseStudentModal();
                        handleDeleteStudent(selectedStudentForModal.id);
                      }}
                      variant="outline"
                      className="flex-1 py-3 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Διαγραφή
                  </Button>
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      


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
        <div className="space-y-8 pb-8 md:pb-0">
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
                      
          {/* Enhanced Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
      >
            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-orange-500/10"></div>
              <CardContent className="relative pt-8 pb-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-lg mb-4">
                    <div className="text-3xl">🎯</div>
              </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Το Λογοθεραπευτικό Ταξίδι του {selectedStudent?.name || 'Μαθητή'}</h3>
                  <p className="text-gray-600">Διαχείριση και παρακολούθηση προόδου</p>
            </div>
            
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#progressGradient)"
                        strokeWidth="3"
                        strokeDasharray={`${(journeySessions.filter(s => s.status === 'completed').length / journeySessions.length) * 100}, 100`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#F97316" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {Math.round((journeySessions.filter(s => s.status === 'completed').length / journeySessions.length) * 100)}%
                </div>
                        <div className="text-sm text-gray-600">Ολοκληρωμένο</div>
              </div>
                </div>
              </div>
                </div>

                <div className="flex flex-col md:grid md:grid-cols-3 gap-3 md:gap-4 text-center">
                  <div className="flex justify-between items-center md:flex-col md:justify-center">
                    <div className="text-sm text-gray-600 md:order-2 md:text-sm">Ολοκληρωμένες</div>
                    <div className="text-2xl md:text-2xl font-bold text-blue-600 md:order-1">{journeySessions.filter(s => s.status === 'completed').length}</div>
                  </div>
                  <div className="flex justify-between items-center md:flex-col md:justify-center">
                    <div className="text-sm text-gray-600 md:order-2 md:text-sm">Υπολοίπονται</div>
                    <div className="text-2xl md:text-2xl font-bold text-orange-600 md:order-1">{journeySessions.length - journeySessions.filter(s => s.status === 'completed').length}</div>
                  </div>
                  <div className="flex justify-between items-center md:flex-col md:justify-center">
                    <div className="text-sm text-gray-600 md:order-2 md:text-sm">Συνολικές</div>
                    <div className="text-2xl md:text-2xl font-bold text-purple-600 md:order-1">{journeySessions.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

          {/* Timeline */}
          <div className="relative px-2 md:px-0">
            {/* Timeline Line */}
            <div className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500 opacity-30"></div>
            
            {/* Progress Line */}
            <motion.div 
              className="absolute left-5 md:left-8 top-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500"
              initial={{ height: 0 }}
              animate={{ 
                height: `${(journeySessions.filter(s => s.status === 'completed').length / journeySessions.length) * 100}%` 
              }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />

            {/* Session Cards */}
            <div className="space-y-6 md:space-y-8 pb-32 md:pb-8">
          {journeySessions.map((session, index) => (
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
                    : session.status === "available"
                    ? "bg-gradient-to-br from-blue-400 to-blue-600"
                    : "bg-gradient-to-br from-gray-300 to-gray-500"
                  }
                    `}
                  >
                    {session.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />
                    ) : session.status === "available" ? (
                      <PlayCircle className="w-5 h-5 md:w-8 md:h-8 text-white" />
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
                          : session.status === "available"
                          ? "bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 hover:border-blue-300"
                          : "bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200/50 hover:border-gray-300"
                        }
                      `}
                            onClick={(e) => {
                        e.preventDefault();
                              e.stopPropagation();
                              handleEditSession(session.id);
                            }}
                    >
                      <div className="px-4 md:px-6 py-4 md:py-5">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Main session info */}
                            <div className="flex items-center flex-wrap gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 text-base md:text-lg group-hover:text-blue-700 transition-colors">
                                Session {session.sessionNumber}
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

          {activeTab === "students" && <StudentsTab />}
          



        </div>
      </div>
    </div>
  );
}
