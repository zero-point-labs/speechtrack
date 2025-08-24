"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Play,
  Download,
  Eye,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Video,
  Send
} from "lucide-react";

// Session Data Interface
interface SessionData {
  id: string;
  sessionNumber: number;
  title: string;
  date: string;
  duration: string;
  status: "completed" | "available" | "locked";
  isPaid: boolean;
  therapist: string;
  goals: string[];
  description: string;
  progress: {
    overall: number;
    pronunciation: number;
    vocabulary: number;
    fluency: number;
  };
  materials: {
    pdfs: Array<{
      id: string;
      name: string;
      url: string;
      uploadDate: string;
    }>;
    videos: Array<{
      id: string;
      name: string;
      url: string;
      thumbnail: string;
      duration: string;
      uploadDate: string;
    }>;
    images: Array<{
      id: string;
      name: string;
      url: string;
      uploadDate: string;
    }>;
  };
  feedback: Array<{
    id: string;
    text: string;
    date: string;
    type: "therapist" | "parent";
    author: string;
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    type: "bronze" | "silver" | "gold";
    earnedDate: string;
  }>;
}

// Mock session data
const mockSession: SessionData = {
  id: "session-1",
  sessionNumber: 1,
  title: "Εισαγωγή στις Βασικές Έννοιες",
  date: "2024-01-15",
  duration: "45 λεπτά",
  status: "completed",
  isPaid: true,
  therapist: "Μαριλένα Νέστωρος",
  goals: [
    "Βελτίωση προφοράς φωνημάτων /ρ/ και /λ/",
    "Επέκταση λεξιλογίου με νέες λέξεις",
    "Ανάπτυξη ροής ομιλίας"
  ],
  description: "Αυτή η συνεδρία εστιάζει στην εισαγωγή βασικών εννοιών λογοθεραπείας και στην αξιολόγηση της τρέχουσας κατάστασης του παιδιού.",
  progress: {
    overall: 78,
    pronunciation: 85,
    vocabulary: 70,
    fluency: 75
  },
  materials: {
    pdfs: [
      {
        id: "pdf-1",
        name: "Ασκήσεις Προφοράς.pdf",
        url: "/materials/pronunciation-exercises.pdf",
        uploadDate: "2024-01-15"
      },
      {
        id: "pdf-2",
        name: "Λεξιλόγιο Μάθημα 1.pdf",
        url: "/materials/vocabulary-lesson-1.pdf",
        uploadDate: "2024-01-15"
      }
    ],
    videos: [
      {
        id: "video-1",
        name: "Ασκήσεις Αναπνοής",
        url: "/videos/breathing-exercises.mp4",
        thumbnail: "/thumbnails/breathing.jpg",
        duration: "5:30",
        uploadDate: "2024-01-15"
      },
      {
        id: "video-2",
        name: "Παιχνίδι με Λέξεις",
        url: "/videos/word-games.mp4",
        thumbnail: "/thumbnails/words.jpg",
        duration: "8:15",
        uploadDate: "2024-01-15"
      }
    ],
    images: [
      {
        id: "img-1",
        name: "Κάρτες Λεξιλογίου",
        url: "/images/vocabulary-cards.jpg",
        uploadDate: "2024-01-15"
      },
      {
        id: "img-2",
        name: "Διάγραμμα Προόδου",
        url: "/images/progress-chart.jpg",
        uploadDate: "2024-01-15"
      }
    ]
  },
  feedback: [
    {
      id: "feedback-1",
      text: "Η Εμμα έδειξε εξαιρετική πρόοδο σήμερα. Κατάφερε να προφέρει σωστά το φώνημα /ρ/ σε 8 από 10 λέξεις.",
      date: "2024-01-15",
      type: "therapist",
      author: "Μαριλένα Νέστωρος"
    },
    {
      id: "feedback-2",
      text: "Παρατήρησα ότι η Εμμα εξασκήθηκε στο σπίτι με τις ασκήσεις. Μπράβο!",
      date: "2024-01-16",
      type: "parent",
      author: "Άννα Κ."
    }
  ],
  achievements: [
    {
      id: "achievement-1",
      title: "Πρώτος Στόχος",
      description: "Ολοκλήρωσε επιτυχώς την πρώτη συνεδρία",
      icon: "🏆",
      type: "bronze",
      earnedDate: "2024-01-15"
    }
  ]
};

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  // State management
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    materials: true
  });
  const [newComment, setNewComment] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Get session data (in real app, this would fetch from API based on sessionId)
  const session = useMemo(() => mockSession, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleCommentSubmit = useCallback(() => {
    if (newComment.trim()) {
      console.log('New comment:', newComment);
      setNewComment("");
    }
  }, [newComment]);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Πίσω</span>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Session {session.sessionNumber}: {session.title}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {session.duration}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        
        {/* Session Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-500" />
              <span>Στοιχεία Συνεδρίας</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Ημερομηνία</h4>
              <p className="text-gray-600">{new Date(session.date).toLocaleDateString('el-GR')}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Κατάσταση Πληρωμής</h4>
              <Badge className={`${session.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {session.isPaid ? 'Πληρωμένη' : 'Απλήρωτη'}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Περιγραφή</h4>
              <p className="text-gray-600">{session.description}</p>
            </div>
          </CardContent>
        </Card>



        {/* Materials Section */}
        <Card>
          <CardHeader className="pb-4">
            <button
              onClick={() => toggleSection('materials')}
              className="w-full flex items-center justify-between text-left group"
            >
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-500" />
                <span>Υλικό Συνεδρίας</span>
              </CardTitle>
              {expandedSections.materials ? (
                <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              )}
            </button>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.materials && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <CardContent className="pt-0 space-y-6">
                  
                  {/* PDFs */}
                  {session.materials.pdfs.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-red-500" />
                        Έγγραφα PDF
                      </h4>
                      <div className="space-y-2">
                        {session.materials.pdfs.map((pdf) => (
                          <div key={pdf.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{pdf.name}</p>
                              <p className="text-sm text-gray-600">
                                Ανέβηκε: {new Date(pdf.uploadDate).toLocaleDateString('el-GR')}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Προβολή</span>
                              </Button>
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Λήψη</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos */}
                  {session.materials.videos.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <Video className="w-4 h-4 mr-2 text-blue-500" />
                        Βίντεο
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {session.materials.videos.map((video) => (
                          <div key={video.id} className="bg-gray-50 rounded-lg overflow-hidden">
                            <div className="aspect-video bg-gray-200 flex items-center justify-center">
                              <Play className="w-12 h-12 text-gray-400" />
                            </div>
                            <div className="p-3">
                              <h5 className="font-medium text-gray-900 mb-1">{video.name}</h5>
                              <p className="text-sm text-gray-600 mb-3">Διάρκεια: {video.duration}</p>
                              <Button size="sm" className="w-full">
                                <Play className="w-4 h-4 mr-2" />
                                Αναπαραγωγή
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Images */}
                  {session.materials.images.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <ImageIcon className="w-4 h-4 mr-2 text-green-500" />
                        Εικόνες
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {session.materials.images.map((image, index) => (
                          <div 
                            key={image.id} 
                            className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                            onClick={() => setSelectedImageIndex(index)}
                          >
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>



        {/* Feedback Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span>Σχόλια & Ανατροφοδότηση</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Feedback */}
            <div className="space-y-3">
              {session.feedback.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-lg ${comment.type === 'therapist' ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-green-50 border-l-4 border-green-400'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{comment.author}</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant={comment.type === 'therapist' ? 'default' : 'secondary'}>
                        {comment.type === 'therapist' ? 'Θεραπευτής' : 'Γονέας'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.date).toLocaleDateString('el-GR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.text}</p>
                </div>
              ))}
            </div>

            {/* Add New Comment */}
            <div className="border-t pt-4">
              <h5 className="font-medium text-gray-900 mb-3">Προσθήκη σχολίου</h5>
              <div className="space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Γράψτε το σχόλιό σας εδώ..."
                  rows={3}
                />
                <Button 
                  onClick={handleCommentSubmit}
                  disabled={!newComment.trim()}
                  className="w-full sm:w-auto"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Αποστολή σχολίου
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Spacing for Mobile */}
        <div className="h-20 md:h-8"></div>

      </div>
    </div>
  );
}
