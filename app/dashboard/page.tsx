"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronLeft,
  ChevronRight,
  Star,
  Trophy,
  Zap,
  PlayCircle,
  Award,
  X,
  Maximize2,
  ChevronDown
} from "lucide-react";

// TypeScript interfaces
interface Child {
  id: string;
  name: string;
  age: number;
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
  status: 'completed' | 'in-progress' | 'scheduled';
  isPaid?: boolean;
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
  nextSession: "2024-01-15"
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
    status: "available" as const,
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

// Mock conversation data for dashboard (single conversation with therapist)
const mockTherapistConversation = {
  therapistName: "Δρ. Μαρία Αντωνίου",
  messages: [
    { id: "1", sender: "therapist", message: "Καλημέρα! Πώς πήγε η εξάσκηση σήμερα;", timestamp: "2024-01-15 09:00", isRead: true },
    { id: "2", sender: "parent", message: "Καλημέρα! Η Εμμα ήταν πολύ ενθουσιασμένη και έκανε όλες τις ασκήσεις.", timestamp: "2024-01-15 09:15", isRead: true },
    { id: "3", sender: "therapist", message: "Τέλεια! Παρατήρησα μεγάλη βελτίωση στην τελευταία συνεδρία. Συνεχίστε έτσι!", timestamp: "2024-01-15 09:30", isRead: true },
    { id: "4", sender: "parent", message: "Ευχαριστούμε! Η Εμμα ρωτάει πότε θα μάθει νέες λέξεις.", timestamp: "2024-01-15 14:20", isRead: true },
    { id: "5", sender: "therapist", message: "Στην επόμενη συνεδρία θα εισάγουμε νέες λέξεις με τον ήχο 'Ρ'. Θα της αρέσει!", timestamp: "2024-01-15 15:45", isRead: false }
  ],
  unreadCount: 1
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("journey");
  const [newComment, setNewComment] = useState("");
  const [selectedImageIndexes, setSelectedImageIndexes] = useState<{[key: string]: number}>({});
  const [openAccordions, setOpenAccordions] = useState<{[key: string]: boolean}>({});
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [isGalleryFullscreen, setIsGalleryFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [firstModalOpen, setFirstModalOpen] = useState(true);
  const router = useRouter();

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
            {/* Mobile pull indicator */}
            <div className="md:hidden flex justify-center pt-3 pb-2">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>
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

              {/* Achievement Banner */}
              {selectedSession.achievement && (
                <div className="bg-white/10 rounded-lg p-4 flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${getAchievementColor(selectedSession.achievement.type)} flex items-center justify-center`}>
                    {getAchievementIcon(selectedSession.achievement.icon)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedSession.achievement.title}</h3>
                    <p className="text-blue-100 text-sm">{selectedSession.achievement.description}</p>
                  </div>
                </div>
              )}
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
                              <Button size="sm" variant="outline" className="min-h-[36px] text-xs active:scale-95">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                <span className="hidden sm:inline">Προεπισκόπηση</span>
                              </Button>
                              <Button size="sm" variant="outline" className="min-h-[36px] text-xs active:scale-95">
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
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{video.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mt-1">{video.description}</p>
                              </div>
                            </div>
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600 min-h-[36px] text-xs active:scale-95 flex-shrink-0">
                              <PlayCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                              <span className="hidden sm:inline">Αναπαραγωγή</span>
                            </Button>
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
                          ) : (
                            <img
                              src="https://via.placeholder.com/600x400/e5e7eb/9ca3af?text=Session+Image"
                              alt={selectedSession.materials.images[currentImageIndex]?.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onLoad={() => setIsLoading(prev => ({ ...prev, [`image-${selectedSession.id}`]: false }))}
                            />
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
                                src="https://via.placeholder.com/64x64/e5e7eb/9ca3af?text=Img"
                                alt={image.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
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
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    {feedback.author === "parent" ? "Γονέας" : "Θεραπευτής"}
                                  </span>
                                  <span className="text-xs text-gray-500">{feedback.timestamp}</span>
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
                            onClick={() => {
                              simulateLoading('comment-submit', 800);
                              setNewComment("");
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

  const JourneyBoard = () => (
    <div className="space-y-8 pb-8 md:pb-0">
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
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Το Λογοθεραπευτικό Ταξίδι της Εμμας</h3>
              <p className="text-gray-600">Κάνει αξιοθαύμαστη πρόοδο κάθε συνεδρία!</p>
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
                    strokeDasharray={`${(mockChild.completedSessions / mockChild.totalSessions) * 100}, 100`}
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
                      {Math.round((mockChild.completedSessions / mockChild.totalSessions) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Ολοκληρωμένο</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 text-center">
              <div className="px-1">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{mockChild.completedSessions}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Ολοκληρωμένες</div>
              </div>
              <div className="px-1">
                <div className="text-xl md:text-2xl font-bold text-orange-600">{mockChild.totalSessions - mockChild.completedSessions}</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Υπολοίπονται</div>
              </div>
              <div className="px-1">
                <div className="text-xl md:text-2xl font-bold text-purple-600">3</div>
                <div className="text-xs md:text-sm text-gray-600 leading-tight">Επιτεύγματα</div>
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
            height: `${(mockChild.completedSessions / mockSessions.length) * 100}%` 
          }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Session Cards */}
        <div className="space-y-6 md:space-y-8 pb-20 md:pb-8">
        {mockSessions.map((session, index) => (
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
                  w-10 h-10 md:w-16 md:h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10
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
                      : session.status === "available"
                      ? "bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 hover:border-blue-300"
                      : "bg-gradient-to-br from-gray-50 to-gray-100/30 border-gray-200/50 hover:border-gray-300"
                    }
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (session.status !== "locked") {
                      setSelectedSession(session as unknown as SessionData);
                    }
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
        ))}
        </div>
      </div>
    </div>
  );

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Child Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={mockChild.profileImage} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                {mockChild.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{mockChild.name}</h2>
              <p className="text-gray-600">Ηλικία {mockChild.age}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Στόχοι Θεραπείας</h3>
            <ul className="space-y-1">
              {mockChild.therapyGoals.map((goal, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Περίληψη Προόδου</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">Συνεδρίες που Ολοκληρώθηκαν</span>
                <span className="text-sm font-bold text-blue-900">
                  {mockChild.completedSessions}/{mockChild.totalSessions}
                </span>
              </div>
              <Progress 
                value={(mockChild.completedSessions / mockChild.totalSessions) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const MessagesTab = () => {
    const [newMessage, setNewMessage] = useState("");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIfMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };
      
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
      
      return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

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

    return (
      <div className={`${isMobile ? 'fixed inset-0 z-50' : 'relative h-[calc(100vh-200px)] rounded-xl border border-gray-200'} bg-white flex flex-col`}>
        {/* Chat Header with Back Button */}
        <div className="flex items-center space-x-3 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-white/50 transition-colors p-2"
              onClick={() => setActiveTab("journey")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
              ΔΜ
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{mockTherapistConversation.therapistName}</h3>
            <p className="text-sm text-gray-600">Λογοθεραπευτής</p>
          </div>
          {mockTherapistConversation.unreadCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800 text-xs flex-shrink-0">
              {mockTherapistConversation.unreadCount} νέα
            </Badge>
          )}
        </div>

        {/* Messages Container - Full Screen Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {mockTherapistConversation.messages.map((message: {id: string; sender: string; message: string; timestamp: string; isRead: boolean}, index: number) => {
            const showDate = index === 0 || 
              new Date(message.timestamp).toDateString() !== 
              new Date(mockTherapistConversation.messages[index - 1].timestamp).toDateString();

            return (
              <div key={message.id}>
                {/* Date separator */}
                {showDate && (
                  <div className="flex justify-center mb-4">
                    <span className="bg-white text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                )}

                {/* Message bubble */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.sender === 'parent' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[70%] ${
                    message.sender === 'parent' 
                      ? 'bg-blue-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
                      : 'bg-white text-gray-900 rounded-r-2xl rounded-tl-2xl rounded-bl-md border border-gray-200'
                  } p-3 shadow-sm`}>
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    <div className={`flex items-center justify-end mt-2 space-x-1 ${
                      message.sender === 'parent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">{formatTime(message.timestamp)}</span>
                      {message.sender === 'parent' && (
                        <CheckCircle className={`w-3 h-3 ${message.isRead ? 'text-blue-200' : 'text-blue-300'}`} />
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
          {/* Bottom padding to ensure last message is visible above input */}
          <div className="h-4"></div>
        </div>

        {/* Message Input - Fixed at Bottom */}
        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex space-x-3">
            <div className="flex-1">
              <Textarea
                placeholder="Πληκτρολογήστε το μήνυμά σας..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="min-h-[60px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                rows={2}
              />
            </div>
            <Button
              onClick={() => {
                if (newMessage.trim()) {
                  // Here you would send the message
                  console.log('Sending message:', newMessage);
                  setNewMessage("");
                }
              }}
              disabled={!newMessage.trim()}
              className="bg-blue-500 hover:bg-blue-600 px-4 h-auto flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const [isMobileMessagesFullscreen, setIsMobileMessagesFullscreen] = useState(false);

  useEffect(() => {
    const checkMobileMessagesFullscreen = () => {
      setIsMobileMessagesFullscreen(activeTab === "messages" && window.innerWidth < 768);
    };
    
    checkMobileMessagesFullscreen();
    window.addEventListener('resize', checkMobileMessagesFullscreen);
    
    return () => window.removeEventListener('resize', checkMobileMessagesFullscreen);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Modal */}
      {SessionModal}
      
      {/* Enhanced Header - Hidden when in mobile fullscreen messages */}
      {!isMobileMessagesFullscreen && (
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
                <p className="text-xs text-gray-500">Ταμπλό Θεραπείας</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{mockChild.name}</p>
              <p className="text-xs text-gray-500">Πρόοδος Συνεδριών: {mockChild.completedSessions}/{mockChild.totalSessions}</p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Avatar className="w-10 h-10 border-2 border-blue-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-semibold">
                  {mockChild.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </div>
        </div>
        </motion.header>
      )}

      {/* Desktop Navigation Tabs - Only visible on desktop and not in mobile fullscreen messages */}
      {!isMobileMessagesFullscreen && (
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
              
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors relative ${
                  activeTab === "messages"
                    ? "text-blue-600 border-blue-600 bg-blue-50/50"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Μηνύματα</span>
                {mockTherapistConversation.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {mockTherapistConversation.unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.nav>
      )}

      {/* Main Content - Hidden when in mobile fullscreen messages */}
      {!isMobileMessagesFullscreen && (
      <main className="pb-4 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {activeTab === "journey" && <JourneyBoard />}
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "messages" && <MessagesTab />}
        </div>
      </main>
      )}
      
      {/* Mobile Fullscreen Messages */}
      {isMobileMessagesFullscreen && <MessagesTab />}

      {/* Enhanced Mobile Navigation Dock - Only on mobile and not in fullscreen messages */}
      {!isMobileMessagesFullscreen && (
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200/50 md:hidden shadow-lg"
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
          
          <motion.button
            type="button"
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center py-3 px-4 rounded-xl transition-all duration-300 ${
              activeTab === "messages" 
                ? "text-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className={`w-6 h-6 mb-1 transition-transform ${activeTab === "messages" ? "scale-110" : ""}`} />
                                <span className="text-xs font-medium">Μηνύματα</span>
            {activeTab === "messages" && (
              <motion.div
                layoutId="activeTab"
                className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.button>
        </div>
      </motion.nav>
      )}

      {/* Desktop Sidebar (for future implementation) */}
      <div className="hidden md:block">
        {/* Placeholder for desktop sidebar navigation */}
      </div>
    </div>
  );
}