"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

// TypeScript interfaces
interface Student {
  id: string;
  name: string;
  age: number;
  totalSessions: number;
  completedSessions: number;
  nextSession: string;
  therapyGoals: string[];
}

interface Message {
  id: string;
  sender: 'parent' | 'therapist';
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  studentId: string;
  studentName: string;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface JourneySession {
  id: string;
  studentId: string;
  title: string;
  date: string;
  duration: string;
  status: 'completed' | 'in-progress' | 'scheduled';
  therapistNotes: string;
  goals: string[];
  achievements: string[];
  materials: Array<{
    type: 'image' | 'video' | 'audio' | 'document';
    name: string;
    url: string;
    thumbnail?: string;
  }>;
  homework: string;
  nextSteps: string[];
  parentFeedback: string;
}

interface StudentFormData {
  id?: string;
  name?: string;
  age?: number;
  totalSessions?: number;
  completedSessions?: number;
  nextSession?: string;
  therapyGoals?: string[];
  sessionsPerWeek?: number;
  numberOfWeeks?: number;
  sessionDuration?: number;
  difficultyLevel?: string;
  parentContact?: string;
  emergencyContact?: string;
  medicalHistory?: string;
  currentChallenges?: string[];
  progressNotes?: string;
  weeklySchedule?: Array<{
    day?: string;
    time?: string;
    startTime?: string;
    endTime?: string;
  }>;
}

interface FileData {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  uploadDate: string;
  duration?: string;
  thumbnail?: string;
}

interface FeedbackComment {
  id: string;
  author: string;
  authorName?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface SessionFileData {
  id: string;
  name: string;
  description: string;
  url: string;
  size: string;
  uploadDate: string;
  duration?: string;
}

interface EditingData {
  id?: string;
  sessionNumber?: number;
  date?: string;
  title?: string;
  duration?: string;
  status?: string;
  isPaid?: boolean;
  sessionSummary?: string;
  skillsWorkedOn?: string[];
  nextSessionGoals?: string[];
  goals?: string[];
  achievements?: string[];
  homework?: string;
  nextSteps?: string[];
  therapistNotes?: string;
  parentFeedback?: string;
  materials?: {
    pdfs: SessionFileData[];
    videos: SessionFileData[];
    images: SessionFileData[];
  };
  feedback?: FeedbackComment[];
}
import { 
  Search, 
  Users, 
  User,
  Settings, 
  BookOpen, 
  Edit3, 
  Save, 
  X, 
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  FileText,
  Video,
  Image as ImageIcon,
  CheckCircle,
  Lock,
  PlayCircle,
  ChevronDown,
  MessageCircle,
  Star,
  Trophy,
  Zap,
  Award,
  Upload,
  Trash2,
  Download,
  Eye,
  Send,
  Folder,
  Edit,
  Info,
  Sparkles
} from "lucide-react";

// Mock data for students
const mockStudents = [
  {
    id: "1",
    name: "Εμμα Ιωάννου",
    age: 7,
    totalSessions: 12,
    completedSessions: 4,
    nextSession: "2024-01-15",
    therapyGoals: ["Βελτίωση άρθρωσης των 'Ρ' ήχων", "Ενίσχυση ανάπτυξης λεξιλογίου"]
  },
  {
    id: "2", 
    name: "Αλέξανδρος Παπαδόπουλος",
    age: 6,
    totalSessions: 8,
    completedSessions: 3,
    nextSession: "2024-01-16",
    therapyGoals: ["Διόρθωση τραυλισμού", "Βελτίωση ρυθμού ομιλίας"]
  },
  {
    id: "3",
    name: "Μαρία Κωνσταντίνου", 
    age: 5,
    totalSessions: 10,
    completedSessions: 2,
    nextSession: "2024-01-17",
    therapyGoals: ["Ανάπτυξη φωνολογικής συνείδησης", "Εμπλουτισμός λεξιλογίου"]
  },
  {
    id: "4",
    name: "Νίκος Γεωργίου",
    age: 8,
    totalSessions: 15,
    completedSessions: 8,
    nextSession: "2024-01-18", 
    therapyGoals: ["Βελτίωση κατανόησης γραπτού λόγου", "Ενίσχυση μνήμης εργασίας"]
  }
];

// Comprehensive mock sessions data with all editable content
const mockJourneySessions = [
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
        { id: "1", name: "Session_1_Assessment_Report.pdf", description: "Comprehensive assessment results and baseline measurements", url: "#", size: "2.4 MB", uploadDate: "2024-01-01" },
        { id: "2", name: "Home_Practice_Guide.pdf", description: "Daily practice instructions for parents", url: "#", size: "1.8 MB", uploadDate: "2024-01-01" }
      ],
      images: [
        { id: "3", name: "R_Sound_Flashcards_Set1.jpg", description: "Flashcards for 'R' sound practice - Set 1", url: "#", size: "856 KB", uploadDate: "2024-01-01" },
        { id: "4", name: "R_Sound_Flashcards_Set2.jpg", description: "Flashcards for 'R' sound practice - Set 2", url: "#", size: "742 KB", uploadDate: "2024-01-01" },
        { id: "5", name: "Practice_Chart.jpg", description: "Weekly practice tracking chart", url: "#", size: "324 KB", uploadDate: "2024-01-01" }
      ],
      videos: [
        { id: "6", name: "Assessment_Session_Recording.mp4", description: "Full session recording for review", url: "#", size: "245 MB", uploadDate: "2024-01-01", duration: "42:33" }
      ]
    },
    feedback: [
      { id: "1", author: "parent", authorName: "Μαρία Ιωάννου", message: "Emma really enjoyed the session! She's been practicing with the flashcards every day.", timestamp: "2024-01-02", isRead: true }
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
        { id: "7", name: "Week2_Progress_Report.pdf", description: "Detailed progress analysis and measurements", url: "#", size: "1.9 MB", uploadDate: "2024-01-08" }
      ],
      images: [
        { id: "8", name: "Breathing_Exercise_Cards.jpg", description: "Visual cards for breathing exercises", url: "#", size: "456 KB", uploadDate: "2024-01-08" },
        { id: "9", name: "R_Sound_Progress_Chart.jpg", description: "Visual progress tracking for R-sounds", url: "#", size: "298 KB", uploadDate: "2024-01-08" }
      ],
      videos: [
        { id: "10", name: "Breathing_Exercise_Demo.mp4", description: "Demonstration of proper breathing techniques", url: "#", size: "89 MB", uploadDate: "2024-01-08", duration: "12:45" }
      ]
    },
    feedback: []
  },
  {
    id: "3",
    sessionNumber: 3,
    date: "2024-01-15",
    status: "available" as const,
    isPaid: false,
    title: "Εξάσκηση Ήχου Ρ σε Επίπεδο Λέξης",
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
    id: "4",
    sessionNumber: 4,
    date: "2024-01-22", 
    status: "locked" as const,
    isPaid: false,
    title: "Εξάσκηση Επιπέδου Πρότασης & Παιχνίδια",
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

// Mock conversation data for all students  
const mockConversations: {[key: string]: Conversation} = {
  "1": {
    studentId: "1",
    studentName: "Εμμα Ιωάννου",
    messages: [
      { id: "1", sender: "parent", senderName: "Μαρία Ιωάννου", message: "Καλημέρα! Η Εμμα φαίνεται πολύ ενθουσιασμένη μετά τη συνεδρία.", timestamp: "2024-01-15 09:30", isRead: true },
      { id: "2", sender: "therapist", senderName: "Θεραπευτής", message: "Χαίρομαι να το ακούω! Η Εμμα έκανε εξαιρετική πρόοδο σήμερα. Πρακτικάρετε τις ασκήσεις που σας έδωσα;", timestamp: "2024-01-15 10:15", isRead: true },
      { id: "3", sender: "parent", senderName: "Μαρία Ιωάννου", message: "Ναι, κάνουμε τις ασκήσεις καθημερινά. Έχετε κάποια συμβουλή για να την κάνουμε πιο διασκεδαστική;", timestamp: "2024-01-15 14:20", isRead: false },
      { id: "4", sender: "therapist", senderName: "Θεραπευτής", message: "Σας προτείνω να προσθέσετε μουσική στις ασκήσεις. Θα σας στείλω κάποια παραδείγματα!", timestamp: "2024-01-15 15:45", isRead: false }
    ],
    lastMessage: "Σας προτείνω να προσθέσετε μουσική στις ασκήσεις. Θα σας στείλω κάποια παραδείγματα!",
    lastMessageTime: "15:45",
    unreadCount: 2
  },
  "2": {
    studentId: "2",
    studentName: "Αλέξανδρος Παπαδόπουλος",
    messages: [
      { id: "5", sender: "parent", senderName: "Άννα Παπαδοπούλου", message: "Γεια σας! Ο Αλέξανδρος είχε μια δύσκολη μέρα σήμερα.", timestamp: "2024-01-14 16:30", isRead: true },
      { id: "6", sender: "therapist", senderName: "Θεραπευτής", message: "Το κατανοώ. Οι δύσκολες μέρες είναι φυσιολογικές. Πώς αισθάνεται σήμερα;", timestamp: "2024-01-14 17:00", isRead: true },
      { id: "7", sender: "parent", senderName: "Άννα Παπαδοπούλου", message: "Σήμερα είναι καλύτερα! Θα θέλαμε να προγραμματίσουμε την επόμενη συνεδρία.", timestamp: "2024-01-15 11:00", isRead: false }
    ],
    lastMessage: "Σήμερα είναι καλύτερα! Θα θέλαμε να προγραμματίσουμε την επόμενη συνεδρία.",
    lastMessageTime: "11:00",
    unreadCount: 1
  },
  "3": {
    studentId: "3", 
    studentName: "Μαρία Κωνσταντίνου",
    messages: [
      { id: "8", sender: "parent", senderName: "Ελένη Κωνσταντίνου", message: "Καλησπέρα! Η Μαρία ρωτάει πότε θα δει πάλι τη δασκάλα της.", timestamp: "2024-01-13 18:00", isRead: true },
      { id: "9", sender: "therapist", senderName: "Θεραπευτής", message: "Πόσο γλυκό! Η επόμενη συνεδρία είναι την Τετάρτη. Πείτε της ότι ανυπομονώ να τη δω!", timestamp: "2024-01-13 18:30", isRead: true }
    ],
    lastMessage: "Πόσο γλυκό! Η επόμενη συνεδρία είναι την Τετάρτη. Πείτε της ότι ανυπομονώ να τη δω!",
    lastMessageTime: "18:30",
    unreadCount: 0
  },
  "4": {
    studentId: "4",
    studentName: "Νίκος Γεωργίου", 
    messages: [
      { id: "10", sender: "parent", senderName: "Κώστας Γεωργίου", message: "Γεια σας. Ο Νίκος έχει βελτιωθεί πάρα πολύ! Ευχαριστούμε για τη δουλειά σας.", timestamp: "2024-01-12 20:00", isRead: true },
      { id: "11", sender: "therapist", senderName: "Θεραπευτής", message: "Χαίρομαι πολύ! Ο Νίκος είναι πολύ συνεπής και προσπαθεί πάρα πολύ. Συγχαρητήρια!", timestamp: "2024-01-12 20:15", isRead: true },
      { id: "12", sender: "parent", senderName: "Κώστας Γεωργίου", message: "Μπορούμε να συζητήσουμε για τους μακροπρόθεσμους στόχους;", timestamp: "2024-01-15 13:45", isRead: false }
    ],
    lastMessage: "Μπορούμε να συζητήσουμε για τους μακροπρόθεσμους στόχους;",
    lastMessageTime: "13:45", 
    unreadCount: 1
  }
};

export default function AdminPage() {
  const [students, setStudents] = useState(mockStudents);
  const [selectedStudent, setSelectedStudent] = useState<Student>(mockStudents[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("journey");
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingData>({});
  const [journeySessions, setJourneySessions] = useState(mockJourneySessions);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [sessionEditorMode, setSessionEditorMode] = useState("overview"); // overview, materials, goals, feedback
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [newComment, setNewComment] = useState("");
  const [showStudentEditor, setShowStudentEditor] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormData, setStudentFormData] = useState<StudentFormData>({});
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [firstSessionModalOpen, setFirstSessionModalOpen] = useState(true);
  const [firstStudentModalOpen, setFirstStudentModalOpen] = useState(true);
  const router = useRouter();

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    return students.filter(student => 
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, students]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "locked":
        return <Lock className="w-5 h-5 text-gray-400" />;
      default:
        return <PlayCircle className="w-5 h-5 text-blue-600" />;
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

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case "star":
        return <Star className="w-4 h-4" />;
      case "zap":
        return <Zap className="w-4 h-4" />;
      case "trophy":
        return <Trophy className="w-4 h-4" />;
      case "award":
        return <Award className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
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

  const handleEditSession = useCallback((sessionId: string) => {
    const session = journeySessions.find(s => s.id === sessionId);
    if (session) {
      setEditingSession(sessionId);
      setEditingData({...session});
      setShowSessionEditor(true);
      setSessionEditorMode("overview");
    }
  }, [journeySessions]);

  const handleSaveSession = useCallback(() => {
    setJourneySessions(prev => 
      prev.map(session => {
        if (session.id === editingSession) {
          const updatedSession = { ...session };
          if (editingData.therapistNotes !== undefined) updatedSession.therapistNotes = editingData.therapistNotes;
          if (editingData.homework !== undefined) updatedSession.homework = editingData.homework;
          if (editingData.title !== undefined) (updatedSession as {title?: string}).title = editingData.title;
          if (editingData.date !== undefined) (updatedSession as {date?: string}).date = editingData.date;
          if (editingData.duration !== undefined) (updatedSession as {duration?: string}).duration = editingData.duration;
          if (editingData.status !== undefined) (updatedSession as {status?: string}).status = editingData.status;
          if (editingData.isPaid !== undefined) (updatedSession as {isPaid?: boolean}).isPaid = editingData.isPaid;
          if (editingData.sessionSummary !== undefined) (updatedSession as {sessionSummary?: string}).sessionSummary = editingData.sessionSummary;
          if (editingData.skillsWorkedOn !== undefined) (updatedSession as {skillsWorkedOn?: string[]}).skillsWorkedOn = editingData.skillsWorkedOn;
          if (editingData.nextSessionGoals !== undefined) (updatedSession as {nextSessionGoals?: string[]}).nextSessionGoals = editingData.nextSessionGoals;
          if (editingData.materials !== undefined) (updatedSession as {materials?: typeof editingData.materials}).materials = editingData.materials;
          if (editingData.feedback !== undefined) (updatedSession as {feedback?: typeof editingData.feedback}).feedback = editingData.feedback;
          return updatedSession;
        }
        return session;
      })
    );
    setEditingSession(null);
    setEditingData({});
    setShowSessionEditor(false);
  }, [editingSession, editingData]);

  const handleCancelEdit = useCallback(() => {
    setEditingSession(null);
    setEditingData({});
    setShowSessionEditor(false);
  }, []);

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student);
    setShowStudentSelector(false);
  }, []);

  const handleCreateNewSession = useCallback(() => {
    const newSession = {
      id: Date.now().toString(),
      sessionNumber: journeySessions.length + 1,
      date: new Date().toISOString().split('T')[0],
      status: "available" as const,
      isPaid: false,
      title: "",
      duration: "45 λεπτά",
      therapistNotes: "",
      sessionSummary: "",
      skillsWorkedOn: [],
      homework: "",
      nextSessionGoals: [],
      materials: { pdfs: [], images: [], videos: [] },
      feedback: []
    };
    setEditingData(newSession);
    setEditingSession(newSession.id);
    setShowSessionEditor(true);
    setSessionEditorMode("overview");
  }, [journeySessions]);

  const handleFileUpload = useCallback((sessionId: string, fileType: string, files: File[]) => {
    setUploadingFiles(prev => ({ ...prev, [`${sessionId}-${fileType}`]: true }));
    
    // Simulate file upload
    setTimeout(() => {
      const newFiles = files.map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        description: `Uploaded ${file.name}`,
        url: "#",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadDate: new Date().toISOString().split('T')[0],
        ...(fileType === 'videos' && { duration: "0:00" })
      }));

      setEditingData((prev: EditingData) => ({
        ...prev,
        materials: {
          pdfs: [],
          videos: [],
          images: [],
          ...prev.materials,
          [fileType]: [...(prev.materials?.[fileType as keyof NonNullable<typeof prev.materials>] || []), ...newFiles]
        }
      }));

      setUploadingFiles(prev => ({ ...prev, [`${sessionId}-${fileType}`]: false }));
    }, 2000);
  }, []);

  const handleDeleteFile = useCallback((fileType: string, fileId: string) => {
    setEditingData((prev: EditingData) => ({
      ...prev,
      materials: {
        pdfs: [],
        videos: [],
        images: [],
        ...prev.materials,
        [fileType]: prev.materials?.[fileType as keyof NonNullable<typeof prev.materials>]?.filter((file: SessionFileData) => file.id !== fileId) || []
      }
    }));
  }, []);

  const handleAddComment = useCallback((message: string) => {
    const newFeedback = {
      id: Date.now().toString(),
      author: "therapist",
      authorName: "Θεραπευτής",
      message,
      timestamp: new Date().toISOString().split('T')[0],
      isRead: false
    };

    setEditingData((prev: EditingData) => ({
      ...prev,
      feedback: [...(prev.feedback || []), newFeedback]
    }));
    setNewComment("");
  }, []);



  // Student Management Functions
  const handleCreateStudent = useCallback(() => {
    const newStudent = {
      id: Date.now().toString(),
      name: "",
      age: 5,
      totalSessions: 10,
      completedSessions: 0,
      nextSession: new Date().toISOString().split('T')[0],
      therapyGoals: []
    };
    setEditingStudent(null);
    setStudentFormData(newStudent);
    setShowStudentEditor(true);
  }, []);

  const handleEditStudent = useCallback((student: Student) => {
    setEditingStudent(student);
    setStudentFormData({...student});
    setShowStudentEditor(true);
  }, []);

  const handleSaveStudent = useCallback(() => {
    if (editingStudent) {
      // Update existing student
      const updatedStudent = { ...editingStudent, ...studentFormData };
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? updatedStudent : s));
      // Update selected student if it's the one being edited
      if (selectedStudent?.id === editingStudent.id) {
        setSelectedStudent(updatedStudent);
      }
    } else {
      // Create new student - assuming this has a complete student object in form data
      setStudents(prev => [...prev, studentFormData as Student]);
    }
    setShowStudentEditor(false);
    setEditingStudent(null);
    setStudentFormData({});
  }, [editingStudent, studentFormData, selectedStudent]);

  const handleCancelStudentEdit = useCallback(() => {
    setShowStudentEditor(false);
    setEditingStudent(null);
    setStudentFormData({});
  }, []);

  const handleDeleteStudent = useCallback((studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // If deleted student was selected, select first available student
    if (selectedStudent?.id === studentId) {
      const remainingStudents = students.filter(s => s.id !== studentId);
      setSelectedStudent(remainingStudents[0] || null);
    }
  }, [selectedStudent, students]);

  // Reset modal animation flags when modals open
  useEffect(() => {
    if (showSessionEditor) {
      setFirstSessionModalOpen(true);
    }
  }, [showSessionEditor]);

  useEffect(() => {
    if (showStudentEditor) {
      setFirstStudentModalOpen(true);
    }
  }, [showStudentEditor]);

  // Mobile-First Student Selector Component
  const MobileStudentSelector = () => (
    <AnimatePresence>
      {showStudentSelector && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setShowStudentSelector(false)}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="bg-white rounded-t-3xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-4 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">
                  Επιλογή Μαθητή
                </h2>
                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                  {students.length} Μαθητές
                </Badge>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Αναζήτηση..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleStudentSelect(student)}
                  className={`
                    p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 min-h-[80px] flex items-center
                    ${selectedStudent?.id === student.id 
                      ? "border-blue-500 bg-blue-50" 
                      : "border-gray-200 bg-white active:bg-gray-50"
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                        {student.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                      <p className="text-sm text-gray-600">Ηλικία {student.age} ετών</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {student.completedSessions}/{student.totalSessions}
                        </Badge>
                      </div>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
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

  // Comprehensive Session Editor Modal
  const SessionEditor = useMemo(() => {
    if (!showSessionEditor || !editingData) return null;

    return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelEdit();
          }}
        >
          <motion.div
            initial={firstSessionModalOpen ? { scale: 0.95, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onAnimationComplete={() => {
              if (firstSessionModalOpen) {
                setFirstSessionModalOpen(false);
              }
            }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Editor Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {editingData.sessionNumber ? `Επεξεργασία Συνεδρίας ${editingData.sessionNumber}` : 'Νέα Συνεδρία'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {selectedStudent?.name} • {editingData.date ? new Date(editingData.date).toLocaleDateString('el-GR') : 'Νέα ημερομηνία'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleSaveSession}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Αποθήκευση
                  </Button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>


            </div>

            {/* Editor Content - Single Scrollable Section */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 text-blue-500 mr-2" />
                    Πληροφορίες Συνεδρίας
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Τίτλος Συνεδρίας *
                      </label>
                      <Input
                        value={editingData.title || ""}
                        onChange={(e) => setEditingData({...editingData, title: e.target.value})}
                        placeholder="π.χ. Εξάσκηση Ήχου Ρ"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ημερομηνία *
                      </label>
                      <Input
                        type="date"
                        value={editingData.date || ""}
                        onChange={(e) => setEditingData({...editingData, date: e.target.value})}
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Κατάσταση
                      </label>
                      <select
                        value={editingData.status || "available"}
                        onChange={(e) => setEditingData({...editingData, status: e.target.value})}
                        className="w-full h-12 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="completed">Ολοκληρωμένη</option>
                        <option value="available">Διαθέσιμη</option>
                        <option value="locked">Κλειδωμένη</option>
                        <option value="canceled">Ακυρωμένη</option>
                      </select>
                    </div>
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={editingData.isPaid || false}
                        onChange={(e) => setEditingData({...editingData, isPaid: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Πληρωμένη συνεδρία</span>
                    </label>
                    </div>
                  </div>
                  </div>

                {/* Session Description */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Περιγραφή Συνεδρίας
                  </h3>
                    <Textarea
                      value={editingData.sessionSummary || ""}
                      onChange={(e) => setEditingData({...editingData, sessionSummary: e.target.value})}
                      placeholder="Συνοπτική περιγραφή των κυριότερων σημείων της συνεδρίας..."
                      className="min-h-[120px] text-base"
                      rows={5}
                    />
                  </div>

                {/* File Materials Section */}
                <div className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Folder className="w-6 h-6 mr-3 text-blue-600" />
                    Υλικό Συνεδρίας
                  </h2>

                {/* PDF Files Section */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <FileText className="w-5 h-5 text-red-500 mr-2" />
                        Έγγραφα PDF
                        <Badge variant="outline" className="ml-2">
                          {editingData.materials?.pdfs?.length || 0}
                        </Badge>
                      </h3>
                      <Button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = '.pdf';
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || []);
                            if (files.length && editingData.id) handleFileUpload(editingData.id, 'pdfs', files);
                          };
                          input.click();
                        }}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 h-auto min-h-[40px]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Προσθήκη PDF</span>
                        <span className="sm:hidden">Αρχεία PDF</span>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-2">
                      {editingData.materials?.pdfs?.map((file: SessionFileData) => (
                        <div
                          key={file.id}
                          className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-6 h-6 md:w-5 md:h-5 text-red-500 flex-shrink-0 mt-0.5 md:mt-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm md:text-sm font-medium text-gray-900 break-words md:truncate leading-tight">{file.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{file.size} • {file.uploadDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" className="flex-1 md:flex-none min-h-[36px]">
                              <Eye className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                              <span className="md:hidden">Προβολή</span>
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 md:flex-none min-h-[36px]">
                              <Download className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                              <span className="md:hidden">Λήψη</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFile('pdfs', file.id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300 flex-1 md:flex-none min-h-[36px]"
                            >
                              <Trash2 className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                              <span className="md:hidden">Διαγραφή</span>
                            </Button>
                          </div>
                        </div>
                      )) || []}

                      {uploadingFiles[`${editingData.id}-pdfs`] && (
                        <div className="flex items-center justify-center p-8 border-2 border-dashed border-red-300 rounded-lg">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
                            <p className="text-sm text-red-600">Μεταφόρτωση PDF...</p>
                  </div>
                        </div>
                      )}

                      {(!editingData.materials?.pdfs || editingData.materials.pdfs.length === 0) && !uploadingFiles[`${editingData.id}-pdfs`] && (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                          <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Δεν υπάρχουν έγγραφα PDF</p>
                          <p className="text-xs text-gray-500">Προσθέστε έγγραφα PDF κάνοντας κλικ στο κουμπί παραπάνω</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Video Files Section */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Video className="w-5 h-5 text-purple-500 mr-2" />
                        Βίντεο
                        <Badge variant="outline" className="ml-2">
                          {editingData.materials?.videos?.length || 0}
                        </Badge>
                    </h3>
                      <Button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = 'video/*';
                          input.onchange = (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || []);
                            if (files.length && editingData.id) handleFileUpload(editingData.id, 'videos', files);
                          };
                          input.click();
                        }}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 h-auto min-h-[40px]"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Προσθήκη Βίντεο</span>
                        <span className="sm:hidden">Αρχεία Βίντεο</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-6">
                    <div className="space-y-3 md:space-y-2">
                      {editingData.materials?.videos?.map((file: SessionFileData) => (
                        <div
                          key={file.id}
                          className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0">
                            <Video className="w-6 h-6 md:w-5 md:h-5 text-purple-500 flex-shrink-0 mt-0.5 md:mt-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm md:text-sm font-medium text-gray-900 break-words md:truncate leading-tight">{file.name}</p>
                              <p className="text-xs text-gray-500 mt-1">{file.size} • {file.uploadDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 md:gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" className="flex-1 md:flex-none min-h-[36px]">
                              <PlayCircle className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                              <span className="md:hidden">Αναπαραγωγή</span>
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1 md:flex-none min-h-[36px]">
                              <Download className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                              <span className="md:hidden">Λήψη</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteFile('videos', file.id)}
                              className="text-red-600 hover:text-red-700 hover:border-red-300 flex-1 md:flex-none min-h-[36px]"
                            >
                              <Trash2 className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                              <span className="md:hidden">Διαγραφή</span>
                            </Button>
                          </div>
                        </div>
                      )) || []}

                      {uploadingFiles[`${editingData.id}-videos`] && (
                        <div className="flex items-center justify-center p-8 border-2 border-dashed border-purple-300 rounded-lg">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                            <p className="text-sm text-purple-600">Μεταφόρτωση βίντεο...</p>
                  </div>
                </div>
              )}

                      {(!editingData.materials?.videos || editingData.materials.videos.length === 0) && !uploadingFiles[`${editingData.id}-videos`] && (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                          <Video className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Δεν υπάρχουν βίντεο</p>
                          <p className="text-xs text-gray-500">Προσθέστε αρχεία βίντεο κάνοντας κλικ στο κουμπί παραπάνω</p>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>

                {/* Gallery Section */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <ImageIcon className="w-5 h-5 text-blue-500 mr-2" />
                        Συλλογή Εικόνων
                          <Badge variant="outline" className="ml-2">
                          {editingData.materials?.images?.length || 0}
                          </Badge>
                      </h3>
                        <Button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.multiple = true;
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const files = Array.from((e.target as HTMLInputElement).files || []);
                              if (files.length && editingData.id) handleFileUpload(editingData.id, 'images', files);
                            };
                            input.click();
                          }}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 h-auto min-h-[40px]"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Προσθήκη Εικόνων</span>
                          <span className="sm:hidden">Εικόνες</span>
                        </Button>
                    </div>
                      </div>

                  <div className="p-4">
                      <div className="space-y-2">
                      {editingData.materials?.images?.map((file: SessionFileData) => (
                          <div
                            key={file.id}
                            className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0">
                              <ImageIcon className="w-6 h-6 md:w-5 md:h-5 text-blue-500 flex-shrink-0 mt-0.5 md:mt-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm md:text-sm font-medium text-gray-900 break-words md:truncate leading-tight">{file.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{file.size} • {file.uploadDate}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-2 flex-shrink-0">
                              <Button size="sm" variant="outline" className="flex-1 md:flex-none min-h-[36px]">
                                <Eye className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                                <span className="md:hidden">Προβολή</span>
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 md:flex-none min-h-[36px]">
                                <Download className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                                <span className="md:hidden">Λήψη</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteFile('images', file.id)}
                                className="text-red-600 hover:text-red-700 hover:border-red-300 flex-1 md:flex-none min-h-[36px]"
                              >
                                <Trash2 className="w-4 h-4 md:w-3 md:h-3 md:mr-0 mr-2" />
                                <span className="md:hidden">Διαγραφή</span>
                              </Button>
                            </div>
                          </div>
                        )) || []}

                      {uploadingFiles[`${editingData.id}-images`] && (
                          <div className="flex items-center justify-center p-8 border-2 border-dashed border-blue-300 rounded-lg">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                            <p className="text-sm text-blue-600">Μεταφόρτωση εικόνων...</p>
                            </div>
                          </div>
                        )}

                      {(!editingData.materials?.images || editingData.materials.images.length === 0) && !uploadingFiles[`${editingData.id}-images`] && (
                        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                          <ImageIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                          <p className="text-sm font-medium text-gray-700 mb-1">Δεν υπάρχουν εικόνες</p>
                          <p className="text-xs text-gray-500">Προσθέστε εικόνες κάνοντας κλικ στο κουμπί παραπάνω</p>
                        </div>
                      )}
                      </div>
                    </div>
                </div>
                </div>

                {/* Comments Section */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                      Συνομιλία Συνεδρίας
                    </h3>
                  </div>
                  
                  <div className="p-4">
                    {/* Feedback List */}
                    <div className="space-y-4 mb-6">
                      {editingData.feedback?.map((comment: FeedbackComment) => (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarFallback className="text-xs font-medium">
                              {comment.author === "parent" ? "Γ" : "Θ"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {comment.authorName || (comment.author === "parent" ? "Γονέας" : "Θεραπευτής")}
                                </span>
                                <span className="text-xs text-gray-500">{comment.timestamp}</span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.message}</p>
                            </div>
                          </div>
                        </div>
                      )) || []}
                    </div>

                    {editingData.feedback?.length === 0 && (
                      <div className="text-center py-8 bg-gray-50 rounded-xl mb-6">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">Δεν υπάρχουν σχόλια για αυτή τη συνεδρία</p>
                      </div>
                    )}

                    {/* Add Comment */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex space-x-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarFallback className="text-xs font-medium bg-blue-100 text-blue-700">
                            Θ
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Προσθέστε ένα σχόλιο..."
                            className="min-h-[80px] text-base"
                            rows={3}
                          />
                          <div className="flex justify-end mt-2">
                            <Button
                              onClick={() => handleAddComment(newComment)}
                              disabled={!newComment.trim()}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Send className="w-4 h-4 mr-2" />
                              Αποστολή
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
    </AnimatePresence>
  );
  }, [
    showSessionEditor,
    editingData,
    firstSessionModalOpen,
    selectedStudent,
    uploadingFiles,
    newComment,
    handleCancelEdit,
    handleSaveSession,
    handleFileUpload,
    handleDeleteFile,
    handleAddComment
  ]);

  // Student Editor Modal
  const StudentEditor = useMemo(() => {
    if (!showStudentEditor) return null;

    return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancelStudentEdit();
          }}
        >
          <motion.div
            initial={firstStudentModalOpen ? { scale: 0.95, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onAnimationComplete={() => {
              if (firstStudentModalOpen) {
                setFirstStudentModalOpen(false);
              }
            }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {editingStudent ? `Επεξεργασία Μαθητή` : 'Νέος Μαθητής'}
                  </h2>
                  <p className="text-green-100 text-sm">
                    {editingStudent ? 'Ενημέρωση στοιχείων μαθητή' : 'Δημιουργία νέου μαθητή'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={handleSaveStudent}
                    disabled={!studentFormData.name?.trim()}
                    className="bg-white text-green-600 hover:bg-gray-100"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingStudent ? 'Ενημέρωση' : 'Δημιουργία'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleCancelStudentEdit}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors active:scale-95 flex-shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 text-blue-500 mr-2" />
                    Βασικά Στοιχεία
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Όνομα Μαθητή *
                      </label>
                      <Input
                        value={studentFormData.name || ""}
                        onChange={(e) => setStudentFormData({...studentFormData, name: e.target.value})}
                        placeholder="π.χ. Εμμα Ιωάννου"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ηλικία *
                      </label>
                      <Input
                        type="number"
                        min="3"
                        max="18"
                        value={studentFormData.age || ""}
                        onChange={(e) => setStudentFormData({...studentFormData, age: parseInt(e.target.value) || 5})}
                        placeholder="5"
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Session Planning */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Calendar className="w-5 h-5 text-purple-500 mr-2" />
                    Λεπτομερής Προγραμματισμός Συνεδριών
                  </h3>
                  
                  {/* Basic Schedule Information */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Συνεδρίες ανά εβδομάδα *
                      </label>
                      <select
                        value={studentFormData.sessionsPerWeek || 2}
                        onChange={(e) => setStudentFormData({
                          ...studentFormData, 
                          sessionsPerWeek: parseInt(e.target.value),
                          totalSessions: (parseInt(e.target.value) * (studentFormData.numberOfWeeks || 10))
                        })}
                        className="w-full h-12 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={1}>1 φορά την εβδομάδα</option>
                        <option value={2}>2 φορές την εβδομάδα</option>
                        <option value={3}>3 φορές την εβδομάδα</option>
                        <option value={4}>4 φορές την εβδομάδα</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Αριθμός εβδομάδων *
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="52"
                        value={studentFormData.numberOfWeeks || ""}
                        onChange={(e) => setStudentFormData({
                          ...studentFormData, 
                          numberOfWeeks: parseInt(e.target.value) || 10,
                          totalSessions: ((studentFormData.sessionsPerWeek || 2) * (parseInt(e.target.value) || 10))
                        })}
                        placeholder="10"
                        className="h-12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Διάρκεια συνεδρίας *
                      </label>
                      <select
                        value={studentFormData.sessionDuration || 45}
                        onChange={(e) => setStudentFormData({...studentFormData, sessionDuration: parseInt(e.target.value)})}
                        className="w-full h-12 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={30}>30 λεπτά</option>
                        <option value={45}>45 λεπτά</option>
                        <option value={60}>60 λεπτά</option>
                        <option value={90}>90 λεπτά</option>
                      </select>
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ημερομηνία Έναρξης *
                      </label>
                      <Input
                        type="date"
                        value={studentFormData.nextSession || ""}
                        onChange={(e) => setStudentFormData({...studentFormData, nextSession: e.target.value})}
                      className="h-12 max-w-xs"
                      />
                  </div>

                  {/* Weekly Schedule */}
                  <div className="mb-6">
                    <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                      <Clock className="w-4 h-4 text-blue-500 mr-2" />
                      Εβδομαδιαίο Πρόγραμμα
                    </h4>
                    
                    <div className="space-y-3">
                      {Array.from({ length: studentFormData.sessionsPerWeek || 2 }, (_, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Συνεδρία {index + 1} - Ημέρα
                            </label>
                            <select
                              value={studentFormData.weeklySchedule?.[index]?.day || ""}
                              onChange={(e) => {
                                const newSchedule = [...(studentFormData.weeklySchedule || [])];
                                newSchedule[index] = { ...newSchedule[index], day: e.target.value };
                                setStudentFormData({...studentFormData, weeklySchedule: newSchedule});
                              }}
                              className="w-full h-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Επιλέξτε ημέρα</option>
                              <option value="monday">Δευτέρα</option>
                              <option value="tuesday">Τρίτη</option>
                              <option value="wednesday">Τετάρτη</option>
                              <option value="thursday">Πέμπτη</option>
                              <option value="friday">Παρασκευή</option>
                              <option value="saturday">Σάββατο</option>
                              <option value="sunday">Κυριακή</option>
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ώρα έναρξης
                      </label>
                      <Input
                              type="time"
                              value={studentFormData.weeklySchedule?.[index]?.startTime || ""}
                              onChange={(e) => {
                                const newSchedule = [...(studentFormData.weeklySchedule || [])];
                                newSchedule[index] = { ...newSchedule[index], startTime: e.target.value };
                                setStudentFormData({...studentFormData, weeklySchedule: newSchedule});
                              }}
                              className="h-10"
                      />
                    </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Ώρα λήξης
                            </label>
                            <Input
                              type="time"
                              value={studentFormData.weeklySchedule?.[index]?.endTime || ""}
                              onChange={(e) => {
                                const newSchedule = [...(studentFormData.weeklySchedule || [])];
                                newSchedule[index] = { ...newSchedule[index], endTime: e.target.value };
                                setStudentFormData({...studentFormData, weeklySchedule: newSchedule});
                              }}
                              className="h-10"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-1" />
                      Συνοπτικά Στοιχεία
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-blue-700 font-medium">Συνολικές συνεδρίες:</span>
                        <div className="text-blue-900 font-bold">{(studentFormData.sessionsPerWeek || 2) * (studentFormData.numberOfWeeks || 10)}</div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Εβδομάδες:</span>
                        <div className="text-blue-900 font-bold">{studentFormData.numberOfWeeks || 10}</div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Ανά εβδομάδα:</span>
                        <div className="text-blue-900 font-bold">{studentFormData.sessionsPerWeek || 2}</div>
                      </div>
                      <div>
                        <span className="text-blue-700 font-medium">Διάρκεια:</span>
                        <div className="text-blue-900 font-bold">{studentFormData.sessionDuration || 45} λεπτά</div>
                      </div>
                    </div>
                  </div>


                </div>

                {/* Therapy Goals */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 text-orange-500 mr-2" />
                    Στόχοι Θεραπείας
                  </h3>
                  
                  <Textarea
                    value={studentFormData.therapyGoals?.join(', ') || ""}
                    onChange={(e) => setStudentFormData({
                      ...studentFormData, 
                      therapyGoals: e.target.value.split(', ').filter((goal: string) => goal.trim())
                    })}
                    placeholder="Εισάγετε στόχους χωρισμένους με κόμμα π.χ. Βελτίωση άρθρωσης, Ενίσχυση λεξιλογίου..."
                    className="min-h-[100px] text-base"
                    rows={4}
                  />
                </div>

                {/* Preview Card */}
                {studentFormData.name && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Eye className="w-5 h-5 text-indigo-500 mr-2" />
                      Προεπισκόπηση
                    </h3>
                    
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                            {studentFormData.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{studentFormData.name}</h4>
                          <p className="text-sm text-gray-600">Ηλικία {studentFormData.age} ετών</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {studentFormData.completedSessions || 0}/{studentFormData.totalSessions} Συνεδρίες
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Έναρξη: {studentFormData.nextSession ? new Date(studentFormData.nextSession).toLocaleDateString('el-GR') : 'Μη καθορισμένη'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {studentFormData.therapyGoals && studentFormData.therapyGoals.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Στόχοι:</p>
                          <div className="flex flex-wrap gap-1">
                            {studentFormData.therapyGoals.slice(0, 3).map((goal: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                            {studentFormData.therapyGoals.length > 3 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                +{studentFormData.therapyGoals.length - 3} ακόμη
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
    </AnimatePresence>
  );
  }, [
    showStudentEditor,
    firstStudentModalOpen,
    editingStudent,
    studentFormData,
    handleCancelStudentEdit,
    handleSaveStudent
  ]);

  // Mobile-First Journey Board Tab
  const JourneyBoardTab = () => (
    <div className="space-y-4 pb-20 sm:pb-6">
      {/* Mobile Student Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-orange-50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-orange-500/10"></div>
          <CardContent className="relative p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {selectedStudent?.name}
                </h3>
                <p className="text-sm text-gray-600">Ταμπλό Πορείας Θεραπείας</p>
              </div>
              <Button 
                size="sm" 
                onClick={handleCreateNewSession}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Νέα Συνεδρία
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                  {selectedStudent?.completedSessions}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Ολοκληρωμένες</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">
                  {selectedStudent?.totalSessions - selectedStudent?.completedSessions}
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Υπολοίπονται</div>
              </div>
              <div className="bg-white/50 rounded-lg p-3">
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {Math.round((selectedStudent?.completedSessions / selectedStudent?.totalSessions) * 100)}%
                </div>
                <div className="text-xs sm:text-sm text-gray-600">Πρόοδος</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Mobile-Optimized Journey Timeline */}
      <div className="relative">
        {/* Mobile Timeline Line - Thinner and positioned for mobile */}
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-orange-500 opacity-30"></div>
        
        <div className="space-y-4 sm:space-y-6">
          {journeySessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Mobile Timeline Node */}
              <div className="absolute left-0 flex items-center">
                <div className={`
                  w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10
                  ${session.status === "completed" 
                    ? "bg-gradient-to-br from-green-400 to-green-600" 
                    : session.status === "available"
                    ? "bg-gradient-to-br from-blue-400 to-blue-600"
                    : "bg-gradient-to-br from-gray-300 to-gray-500"
                  }
                `}>
                  <div className="w-5 h-5 sm:w-6 sm:h-6">
                    {getStatusIcon(session.status)}
                  </div>
                </div>

                {/* Achievement Badge */}
                {session.achievement && (
                  <div className={`
                    absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getAchievementColor(session.achievement.type)} 
                    flex items-center justify-center text-white shadow-lg border-2 border-white
                  `}>
                    <div className="w-3 h-3 sm:w-4 sm:h-4">
                      {getAchievementIcon(session.achievement.icon)}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Session Card */}
              <div className="ml-16 sm:ml-24">
                <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                  <CardContent className="p-4 sm:p-6">
                    <div onClick={() => handleEditSession(session.id)}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 mb-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                            Συνεδρία {session.sessionNumber}
                          </h4>
                          <h5 className="text-sm sm:text-base text-gray-700 font-medium break-words">
                            {session.title || "Χωρίς τίτλο"}
                          </h5>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                          <Badge className={`${getStatusColor(session.status)} text-xs`}>
                            {session.status === "completed" ? "Ολοκληρωμένη" :
                             session.status === "available" ? "Διαθέσιμη" : "Κλειδωμένη"}
                          </Badge>
                          {session.isPaid && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Πληρωμένη
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSession(session.id);
                            }}
                            className="hover:bg-blue-50 hover:border-blue-300 w-full sm:w-auto min-h-[36px]"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            <span className="text-xs sm:text-sm">Επεξεργασία</span>
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {new Date(session.date).toLocaleDateString('el-GR')}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {session.duration}
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {session.skillsWorkedOn?.length || 0} δεξιότητες
                        </span>
                        <span className="flex items-center">
                          <Folder className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {(session.materials?.pdfs?.length || 0) + (session.materials?.images?.length || 0) + (session.materials?.videos?.length || 0)} αρχεία
                        </span>
                      </div>

                      {session.achievement && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 sm:p-4 mb-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full ${getAchievementColor(session.achievement.type)} flex items-center justify-center text-white flex-shrink-0`}>
                              <div className="w-3 h-3 sm:w-4 sm:h-4">
                                {getAchievementIcon(session.achievement.icon)}
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h6 className="font-semibold text-gray-900 text-sm sm:text-base">
                                {session.achievement.title}
                              </h6>
                              <p className="text-xs sm:text-sm text-gray-600 break-words">
                                {session.achievement.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {session.sessionSummary && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <h6 className="font-medium text-gray-900 mb-1 text-sm flex items-center">
                            <Info className="w-4 h-4 mr-1 text-blue-500" />
                            Περίληψη
                          </h6>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {session.sessionSummary}
                          </p>
                        </div>
                      )}

                      {session.skillsWorkedOn && session.skillsWorkedOn.length > 0 && (
                        <div className="mb-4">
                          <h6 className="font-medium text-gray-900 mb-2 text-sm sm:text-base flex items-center">
                            <Sparkles className="w-4 h-4 mr-1 text-purple-500" />
                            Δεξιότητες
                          </h6>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {session.skillsWorkedOn.slice(0, 3).map((skill: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs break-words">
                                {skill}
                              </Badge>
                            ))}
                            {session.skillsWorkedOn.length > 3 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                +{session.skillsWorkedOn.length - 3} ακόμη
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
                        Κλικ για πλήρη επεξεργασία
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  // Memoized event handlers for messages
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (newMessage.trim() && selectedConversation) {
      const selectedConversationData = mockConversations[selectedConversation];
      console.log('Sending message to', selectedConversationData.studentName, ':', newMessage);
      setNewMessage("");
    }
  }, [newMessage, selectedConversation]);

  const handleSelectConversation = useCallback((studentId: string) => {
    setSelectedConversation(studentId);
  }, []);

  const handleBackToConversationList = useCallback(() => {
    setSelectedConversation(null);
  }, []);

  const handleStudentMessageClick = useCallback((studentId: string) => {
    setActiveTab('messages');
    setSelectedConversation(studentId);
  }, []);

  // Mobile-Optimized Messages Tab with Conversation View
  const MessagesTab = useMemo(() => {
    const formatTime = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp: string) => {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Σήμερα';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Χθες';
      } else {
        return date.toLocaleDateString('el-GR');
      }
    };

    const selectedConversationData = selectedConversation ? mockConversations[selectedConversation] : null;

    if (selectedConversation && selectedConversationData) {
      // Show individual conversation view
      return (
    <div className="space-y-4 pb-20 sm:pb-6">
          {/* Conversation Header */}
          <div className="flex items-center space-x-3 bg-white rounded-xl border border-gray-200 p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToConversationList}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                {selectedConversationData.studentName.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedConversationData.studentName}</h3>
              <p className="text-sm text-gray-600">Συνεδρίες Λογοθεραπείας</p>
          </div>
          </div>

          {/* Messages Container */}
          <div className="bg-white rounded-xl border border-gray-200 h-[500px] flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversationData.messages.map((message: Message, index: number) => {
                const showDate = index === 0 || 
                  new Date(message.timestamp).toDateString() !== 
                  new Date(selectedConversationData.messages[index - 1].timestamp).toDateString();

                return (
                  <div key={message.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex justify-center mb-4">
                        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex ${message.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] md:max-w-[70%] ${
                        message.sender === 'therapist' 
                          ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                          : 'bg-gray-100 text-gray-900 rounded-r-2xl rounded-tl-2xl rounded-bl-md'
                      } p-3 shadow-sm`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-xs font-medium ${
                            message.sender === 'therapist' ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {message.senderName}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.message}</p>
                        <div className={`flex items-center justify-end mt-2 space-x-1 ${
                          message.sender === 'therapist' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          <span className="text-xs">{formatTime(message.timestamp)}</span>
                          {message.sender === 'therapist' && (
                            <CheckCircle className={`w-3 h-3 ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                          )}
                        </div>
                      </div>
                    </motion.div>
    </div>
  );
              })}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <div className="flex-1">
                  <Textarea
                    placeholder="Πληκτρολογήστε το μήνυμά σας..."
                    value={newMessage}
                    onChange={handleMessageChange}
                    className="min-h-[60px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 px-6 h-auto"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show conversation list
    return (
      <div className="space-y-4 pb-20 sm:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Μηνύματα</h2>
            <p className="text-gray-600 text-sm">Επικοινωνία με όλους τους μαθητές</p>
          </div>
        </div>

        {/* Conversation List */}
        <div className="space-y-3">
          {students.map((student) => {
            const conversation = mockConversations[student.id];
            return (
              <motion.div
                key={student.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectConversation(student.id)}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                      {student.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{student.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {conversation?.lastMessage || "Δεν υπάρχουν μηνύματα"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {conversation && conversation.unreadCount > 0 && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {conversation?.lastMessageTime || ""}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {students.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν συνομιλίες</h3>
            <p className="text-gray-600 mb-4">Δημιουργήστε μαθητές για να ξεκινήσετε συνομιλίες</p>
          </div>
        )}
      </div>
    );
  }, [selectedConversation, newMessage, students, handleSendMessage, handleMessageChange, handleSelectConversation, handleBackToConversationList]);

  // Students Management Tab
  const StudentsTab = () => (
    <div className="space-y-4 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Διαχείριση Μαθητών</h2>
          <p className="text-gray-600 text-sm">Δημιουργία και επεξεργασία μαθητών</p>
        </div>
        <Button 
          onClick={handleCreateStudent}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Νέος Μαθητής
        </Button>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => (
          <motion.div
            key={student.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                    {student.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{student.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Ηλικία {student.age} ετών</p>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditStudent(student)}
                  className="p-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Είστε σίγουρος ότι θέλετε να διαγράψετε τον μαθητή ${student.name};`)) {
                      handleDeleteStudent(student.id);
                    }
                  }}
                  className="p-2 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-gray-700">Πρόοδος Συνεδριών</span>
                <span className="text-xs text-gray-600">
                  {student.completedSessions}/{student.totalSessions}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(student.completedSessions / student.totalSessions) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Info Badges */}
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="outline" className="text-xs">
                {Math.round((student.completedSessions / student.totalSessions) * 100)}% Ολοκληρωμένο
              </Badge>
              <Badge variant="outline" className="text-xs">
                Επόμενη: {new Date(student.nextSession).toLocaleDateString('el-GR')}
              </Badge>
            </div>

            {/* Therapy Goals Preview */}
            {student.therapyGoals && student.therapyGoals.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Στόχοι:</p>
                <div className="flex flex-wrap gap-1">
                  {student.therapyGoals.slice(0, 2).map((goal: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs break-words line-clamp-1">
                      {goal.length > 20 ? goal.substring(0, 20) + '...' : goal}
                    </Badge>
                  ))}
                  {student.therapyGoals.length > 2 && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      +{student.therapyGoals.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedStudent(student);
                    setActiveTab('journey');
                  }}
                  className="text-xs flex-1 mr-2"
                >
                  <BookOpen className="w-3 h-3 mr-1" />
                  Προβολή Πορείας
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleStudentMessageClick(student.id)}
                  className="text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Μηνύματα
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {students.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Δεν υπάρχουν μαθητές</h3>
          <p className="text-gray-600 mb-4">Δημιουργήστε τον πρώτο σας μαθητή για να ξεκινήσετε</p>
          <Button onClick={handleCreateStudent} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Δημιουργία Μαθητή
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Student Selector Modal */}
      <MobileStudentSelector />
      
      {/* Comprehensive Session Editor Modal */}
      {SessionEditor}
      
      {/* Student Editor Modal */}
      {StudentEditor}

      {/* Mobile-First Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-40"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="hover:bg-blue-50 transition-colors p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <motion.div 
                className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600">Διαχείριση Συνεδριών & Μαθητών</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">Διαχειριστής</p>
              <p className="text-xs text-gray-500">Πλήρη δικαιώματα</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-purple-200">
                <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-semibold text-xs sm:text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Student Selection Bar - Only visible on Journey tab */}
      {activeTab === "journey" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-b border-gray-200 px-4 py-3 sm:hidden"
        >
        <button
          onClick={() => setShowStudentSelector(true)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold text-sm">
                {selectedStudent?.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-left min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">{selectedStudent?.name}</h3>
              <p className="text-sm text-gray-600">
                Πρόοδος: {selectedStudent?.completedSessions}/{selectedStudent?.totalSessions}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant="outline" className="text-xs">
              Αλλαγή
            </Badge>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </motion.div>
      )}

      {/* Desktop Student Selection Bar - Only visible on Journey tab */}
      {activeTab === "journey" && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ delay: 0.1 }}
          className="hidden sm:block bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 fixed top-40 left-0 right-0 z-20"
        >
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setShowStudentSelector(true)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                  {selectedStudent?.name.split(' ').map((n: string) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="text-left min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 text-lg truncate">{selectedStudent?.name}</h3>
                <p className="text-gray-600">
                  Πρόοδος: {selectedStudent?.completedSessions}/{selectedStudent?.totalSessions} • 
                  <span className="ml-1 font-medium text-blue-600">
                    {Math.round((selectedStudent?.completedSessions / selectedStudent?.totalSessions) * 100)}%
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                Αλλαγή Μαθητή
              </Badge>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </div>
          </button>
        </div>
      </motion.div>
      )}

      {/* Main Content */}
      <main className={`pb-20 sm:pb-8 ${activeTab === "journey" ? "sm:pt-52" : "sm:pt-32"}`}>
        <div className="px-4 py-4 sm:px-6 sm:py-8 max-w-6xl mx-auto">
          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "journey" && <JourneyBoardTab />}
            {activeTab === "students" && <StudentsTab />}
            {activeTab === "messages" && MessagesTab}
          </motion.div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg sm:hidden"
      >
        <div className="flex items-center justify-around py-2 px-4">
          {[
            { id: "journey", label: "Πορεία", icon: <BookOpen className="w-5 h-5" />, shortLabel: "Πορεία" },
            { id: "students", label: "Μαθητές", icon: <Users className="w-5 h-5" />, shortLabel: "Μαθητές" },
            { id: "messages", label: "Μηνύματα", icon: <MessageCircle className="w-5 h-5" />, shortLabel: "Μηνύματα" }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 min-h-[60px] ${
                activeTab === tab.id 
                  ? "text-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`transition-transform ${activeTab === tab.id ? "scale-110" : ""}`}>
                {tab.icon}
              </div>
              <span className="text-xs font-medium mt-1">{tab.shortLabel}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Desktop Tab Navigation (Hidden on Mobile) */}
      <div className="hidden sm:block fixed top-20 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/50 z-30 shadow-sm">
        <div className="flex flex-wrap gap-3 px-6 py-5 max-w-6xl mx-auto">
          {[
            { id: "journey", label: "Ταμπλό Πορείας", icon: <BookOpen className="w-4 h-4" /> },
            { id: "students", label: "Μαθητές", icon: <Users className="w-4 h-4" /> },
            { id: "messages", label: "Μηνύματα", icon: <MessageCircle className="w-4 h-4" /> }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {tab.icon}
              <span className="text-base">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
