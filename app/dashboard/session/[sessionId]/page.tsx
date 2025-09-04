"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ParentRoute } from "@/lib/auth-middleware";
import { databases, storage, appwriteConfig } from "@/lib/appwrite.client";
import { fileServiceSimple as fileService } from "@/lib/fileServiceSimple";
import FilePreview from "@/components/FilePreview";
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
  status: "completed" | "locked" | "canceled";
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

function SessionPageContent() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  // State management
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    materials: true
  });
  const [newComment, setNewComment] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Load session data from Appwrite
  useEffect(() => {
    const loadSessionData = async () => {
      try {
        setLoading(true);
        
        // Load session from Appwrite
        const session = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.sessions,
          sessionId
        );

        // Load session files using new R2 API
        const materials = { pdfs: [], videos: [], images: [] };
        
        try {
          // Get files for this session from our new API
          console.log('📁 Loading files for session:', session.$id);
          const sessionFiles = await fileService.getSessionFiles(session.$id);
          console.log('📁 Found files:', sessionFiles);
          
          // Categorize files by type
          sessionFiles.forEach((file: any) => {
            const fileData = {
              id: file.id,
              name: file.name,
              url: file.url,
              type: file.type,
              uploadDate: file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('el-GR') : 'Σήμερα',
              uploadDateRaw: file.uploadDate // Keep original for any additional formatting
            };
            
            if (file.type === 'pdf') {
              materials.pdfs.push(fileData);
            } else if (file.type === 'image') {
              materials.images.push(fileData);
            } else if (file.type === 'video') {
              materials.videos.push({
                ...fileData,
                thumbnail: file.url, // Use the same URL for thumbnail
                duration: "N/A" // Duration not available from metadata
              });
            }
          });
        } catch (error) {
          console.error('Error loading session files:', error);
        }

        // Parse JSON fields
        let achievement = null;
        let feedback = [];
        
        try {
          if (session.achievement) {
            achievement = JSON.parse(session.achievement);
          }
        } catch (error) {
          console.error('Error parsing achievement:', error);
        }
        
        try {
          if (session.feedback) {
            feedback = JSON.parse(session.feedback);
          }
        } catch (error) {
          console.error('Error parsing feedback:', error);
        }

        // Convert feedback to expected format for UI
        const formattedFeedback = feedback.map(f => ({
          id: f.id,
          text: f.message,
          date: f.timestamp,
          type: f.author === 'therapist' ? 'therapist' : 'parent',
          author: f.author === 'therapist' ? 'Μαριλένα Νέστωρος' : 'Γονέας'
        }));

        // Convert achievement to achievements array for UI
        const achievements = achievement ? [{
          id: Date.now().toString(),
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon === 'star' ? '⭐' : achievement.icon === 'trophy' ? '🏆' : achievement.icon === 'zap' ? '⚡' : '🥇',
          type: achievement.type === 'skill' ? 'bronze' : achievement.type === 'milestone' ? 'silver' : 'gold',
          earnedDate: new Date().toLocaleDateString('el-GR')
        }] : [];

        // Convert Appwrite session to UI format
        const sessionForUI: SessionData = {
          id: session.$id,
          sessionNumber: session.sessionNumber,
          title: session.title,
          date: session.date.split('T')[0], // Convert to date only
          duration: session.duration + ' λεπτά',
          status: session.status === 'completed' ? 'completed' : session.status === 'locked' ? 'locked' : 'locked',
          isPaid: session.isPaid || false,
          therapist: "Μαριλένα Νέστωρος", // Default therapist name
          goals: [], // TODO: Load from session goals
          description: session.sessionSummary || session.therapistNotes || session.title,
          progress: {
            overall: 78,
            pronunciation: 85,
            vocabulary: 70,
            fluency: 75
          },
          materials,
          feedback: formattedFeedback,
          achievements
        };

        setSessionData(sessionForUI);
        
      } catch (error) {
        console.error('Error loading session:', error);
        // Fallback to mock data if loading fails
        setSessionData(mockSession);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  // Get session data
  const session = sessionData;

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleCommentSubmit = useCallback(async () => {
    if (newComment.trim() && sessionData) {
      try {
        // Create new feedback entry
        const newFeedback = {
          id: Date.now().toString(),
          author: "parent",
          message: newComment.trim(),
          timestamp: new Date().toLocaleString('el-GR'),
          isRead: false
        };

        // Add to current feedback array
        const updatedFeedback = [...(sessionData.feedback.map(f => ({
          id: f.id,
          author: f.type === 'therapist' ? 'therapist' : 'parent',
          message: f.text,
          timestamp: f.date,
          isRead: false
        }))), newFeedback];

        // Update session in database
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.sessions,
          sessionId,
          {
            feedback: JSON.stringify(updatedFeedback)
          }
        );

        // Update local state
        setSessionData({
          ...sessionData,
          feedback: [...sessionData.feedback, {
            id: newFeedback.id,
            text: newFeedback.message,
            date: newFeedback.timestamp,
            type: 'parent',
            author: 'Γονέας'
          }]
        });

        setNewComment("");
      } catch (error) {
        console.error('Error saving comment:', error);
        alert('Σφάλμα κατά την αποθήκευση του σχολίου');
      }
    }
  }, [newComment, sessionData, sessionId]);

  // Handle file preview
  const handleFilePreview = useCallback((file: { id: string; name: string; type: string; url?: string }) => {
    const fileType = (file.type || '').toLowerCase();
    
    // For PDFs, navigate to dedicated viewing page for better mobile experience
    if (fileType.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
      router.push(`/dashboard/pdf/${file.id}`);
      return;
    }
    
    // For other files, use modal preview
    const fileForPreview = {
      ...file,
      type: fileType,
      url: file.url || fileService.getFileViewUrl(file.id)
    };
    setPreviewFile(fileForPreview);
    setShowFilePreview(true);
  }, [router]);

  // Handle file download
  const handleFileDownload = useCallback(async (file: { id: string; name: string; downloadUrl?: string }) => {
    try {
      const downloadUrl = file.downloadUrl || fileService.getFileDownloadUrl(file.id);
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
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Φόρτωση συνεδρίας...</p>
        </div>
      </div>
    );
  }

  // Show error state if no session data
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Η συνεδρία δεν βρέθηκε.</p>
          <Button onClick={handleBackClick} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Επιστροφή στο Dashboard
          </Button>
        </div>
      </div>
    );
  }



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

        {/* Achievement Section */}
        {session.achievements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span className="text-2xl">🏆</span>
                <span>Επίτευγμα / Βραβείο</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.achievements.map((achievement) => (
                <div key={achievement.id} className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl">
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-yellow-900 text-xl">{achievement.title}</h3>
                      <p className="text-yellow-700 capitalize">
                        {achievement.type === 'bronze' ? 'Δεξιότητα' : 
                         achievement.type === 'silver' ? 'Ορόσημο' : 'Ανακάλυψη'}
                      </p>
                    </div>
                  </div>
                  <p className="text-yellow-800 leading-relaxed">{achievement.description}</p>
                  <p className="text-yellow-600 text-sm mt-2">Κερδήθηκε: {achievement.earnedDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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
                                Ανέβηκε: {pdf.uploadDate}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleFilePreview(pdf)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Προβολή</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleFileDownload(pdf)}
                              >
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
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleFilePreview(video)}
                              >
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
                            onClick={() => handleFilePreview(image)}
                          >
                            <img
                              src={image.url}
                              alt={image.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder on error
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement.innerHTML = `
                                  <div class="w-full h-full flex items-center justify-center">
                                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  </div>
                                `;
                              }}
                            />
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
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
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

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={showFilePreview}
          onClose={() => { setShowFilePreview(false); setPreviewFile(null); }}
          onDownload={() => handleFileDownload(previewFile)}
        />
      )}
    </div>
  );
}

export default function SessionPage() {
  return (
    <ParentRoute>
      <SessionPageContent />
    </ParentRoute>
  );
}
