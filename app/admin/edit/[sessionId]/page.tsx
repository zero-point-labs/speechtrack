"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { AdminRoute } from "@/lib/auth-middleware";
import { databases, storage, appwriteConfig, Query } from "@/lib/appwrite.client";
import { fileService } from "@/lib/fileService";
import FilePreview from "@/components/FilePreview";
// import FileUpload from "@/components/FileUpload"; // Unused import
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Save, 
  FileText,
  Video,
  Image as ImageIcon,
  Upload,
  Trash2,
  Download,
  Eye,
  PlayCircle,
  Folder,
  MessageCircle,
  Send,
  User,
  Trophy
} from "lucide-react";

// Types
interface SessionFileData {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  type: string;
}

interface SessionData {
  id: string;
  studentId: string;
  sessionNumber: number;
  title: string;
  date: string;
  duration: string;
  status: 'completed' | 'locked' | 'canceled';
  isPaid: boolean;
  therapistNotes: string;
  sessionSummary: string;
  achievement?: {
    type: 'milestone' | 'skill' | 'breakthrough';
    title: string;
    description: string;
    icon: 'star' | 'zap' | 'trophy' | 'award';
  };
  materials: {
    pdfs: SessionFileData[];
    videos: SessionFileData[];
    images: SessionFileData[];
  };
  feedback: Array<{
    id: string;
    author: string;
    message: string;
    timestamp: string;
    isRead: boolean;
  }>;
}

// Mock data for demonstration
const mockSessionData: SessionData = {
  id: "1",
  studentId: "1",
  sessionNumber: 1,
  title: "Αρχική Αξιολόγηση & Εισαγωγή",
  date: "2024-01-01",
  duration: "45 λεπτά",
  status: "completed",
  isPaid: true,
  therapistNotes: "Emma showed great enthusiasm during our first session. We completed a comprehensive assessment of her current speech patterns and identified areas for improvement.",
  sessionSummary: "During this initial session, we focused on building rapport and conducting a thorough speech assessment. Emma demonstrated strong listening skills and was eager to participate in all activities.",
  achievement: {
    type: "milestone",
    title: "Πρώτα Βήματα",
    description: "Ξεκίνησε το ταξίδι της λογοθεραπείας!",
    icon: "star"
  },
  materials: {
    pdfs: [
      { id: "1", name: "Session_1_Assessment_Report.pdf", size: "2.4 MB", uploadDate: "2024-01-01", type: "pdf" },
      { id: "2", name: "Home_Practice_Guide.pdf", size: "1.8 MB", uploadDate: "2024-01-01", type: "pdf" }
    ],
    videos: [
      { id: "3", name: "Breathing_Exercise_Demo.mp4", size: "245 MB", uploadDate: "2024-01-01", type: "video" }
    ],
    images: [
      { id: "4", name: "R_Sound_Flashcards_Set1.jpg", size: "856 KB", uploadDate: "2024-01-01", type: "image" },
      { id: "5", name: "Practice_Chart.jpg", size: "1.2 MB", uploadDate: "2024-01-01", type: "image" }
    ]
  },
  feedback: [
    { id: "1", author: "parent", message: "Emma really enjoyed the session! She's been practicing with the flashcards every day.", timestamp: "2024-01-02", isRead: true }
  ]
};

function SessionEditPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionId = params.sessionId as string;
  const studentId = searchParams.get('studentId');
  
  // Check if this is a new session based on sessionId (timestamp-based IDs are new sessions)
  const isNewSession = sessionId && /^\d{13}$/.test(sessionId); // 13-digit timestamp
  
  // Use empty data for new sessions, will load real data for existing ones
  const initialSessionData = {
    id: sessionId,
    studentId: "1",
    sessionNumber: 1,
    title: "",
    date: new Date().toISOString().split('T')[0],
    duration: "45 λεπτά",
    status: "locked" as const,
    isPaid: false,
    therapistNotes: "",
    sessionSummary: "",
    materials: { pdfs: [], videos: [], images: [] },
    feedback: []
  };
  
  const [sessionData, setSessionData] = useState<SessionData>(initialSessionData);

  const [newComment, setNewComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(!isNewSession);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Load session data from Appwrite if it's an existing session, or initialize new session
  useEffect(() => {
    if (!isNewSession && sessionId) {
      loadSessionData();
    } else if (isNewSession && studentId) {
      initializeNewSession();
    }
  }, [sessionId, isNewSession, studentId]);

  const initializeNewSession = async () => {
    try {
      setLoading(true);
      
      // Get the highest session number for this student to calculate next number
      const existingSessions = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        [Query.equal('studentId', studentId), Query.orderDesc('sessionNumber')]
      );
      
      const nextSessionNumber = existingSessions.documents.length > 0 
        ? (existingSessions.documents[0].sessionNumber || 0) + 1 
        : 1;
      
      console.log(`Initializing new session #${nextSessionNumber} for student:`, studentId);
      
      // Update session data with correct studentId and sessionNumber
      setSessionData(prev => ({
        ...prev,
        studentId: studentId,
        sessionNumber: nextSessionNumber,
        title: `Συνεδρία ${nextSessionNumber}`
      }));
      
    } catch (error) {
      console.error('Error initializing new session:', error);
      alert('Σφάλμα κατά την προετοιμασία νέας συνεδρίας.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionData = async () => {
    try {
      setLoading(true);
      
      // Load session from Appwrite
      const session = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.collections.sessions,
        sessionId
      );

      // Map database status to UI status
      const dbToUIStatusMapping = {
        'completed': 'completed',
        'available': 'locked', // Default available sessions to locked in UI
        'locked': 'locked',
        'cancelled': 'canceled'
      };
      
      const uiStatus = dbToUIStatusMapping[session.status] || 'locked';
      
      // Load session files from Appwrite Storage
      const materials = { pdfs: [], videos: [], images: [] };
      
      try {
        // Get files for this session from storage
        const files = await storage.listFiles(appwriteConfig.buckets.files);
        const sessionFiles = files.files.filter(file => 
          file.name.startsWith(`${session.$id}_`)
        );
        
        // Categorize files by type
        sessionFiles.forEach(file => {
          const fileType = file.mimeType || '';
          const fileData = {
            id: file.$id,
            name: file.name.replace(`${session.$id}_`, ''), // Remove session ID prefix from display name
            size: fileService.formatFileSize(file.sizeOriginal),
            uploadDate: new Date(file.$createdAt).toLocaleDateString('el-GR'),
            type: fileType
          };
          
          if (fileType.includes('pdf')) {
            materials.pdfs.push(fileData);
          } else if (fileType.includes('image')) {
            materials.images.push(fileData);
          } else if (fileType.includes('video')) {
            materials.videos.push(fileData);
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

      // Convert Appwrite session to UI format
              const sessionForUI: SessionData = {
          id: session.$id,
          studentId: session.studentId,
          sessionNumber: session.sessionNumber,
          title: session.title,
          date: session.date.split('T')[0], // Convert to date only
          duration: session.duration + ' λεπτά',
          status: uiStatus, // Use mapped status
          isPaid: session.isPaid || false,
          therapistNotes: session.therapistNotes || '',
          sessionSummary: session.sessionSummary || '',
          achievement,
          materials, // Use loaded materials
          feedback
        };

      setSessionData(sessionForUI);
      
    } catch (error) {
      console.error('Error loading session:', error);
      // Fallback to mock data if loading fails
      setSessionData(mockSessionData);
    } finally {
      setLoading(false);
    }
  };



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

  // Delete file handler
  const handleDeleteFile = async (fileType: string, fileId: string) => {
    try {
      // Delete from Appwrite storage
      await fileService.deleteFile(fileId);
      
      // Update UI state
      setSessionData(prev => ({
        ...prev,
        materials: {
          ...prev.materials,
          [fileType]: prev.materials[fileType].filter(f => f.id !== fileId)
        }
      }));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Σφάλμα κατά τη διαγραφή του αρχείου');
    }
  };

  // Delete comment function
  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το σχόλιο;')) {
      setSessionData(prev => ({
        ...prev,
        feedback: prev.feedback.filter(comment => comment.id !== commentId)
      }));
    }
  };

  // Save session handler
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Keep duration as string (remove ' λεπτά' suffix and convert to just the number as string)
      const durationString = sessionData.duration.replace(' λεπτά', '');
      
      // Map UI status to database status
      const statusMapping = {
        'completed': 'completed',
        'locked': 'available',
        'canceled': 'cancelled'
      };
      
      const dbStatus = statusMapping[sessionData.status] || 'available';
      
      // Prepare data for Appwrite
      const updateData = {
        title: sessionData.title,
        date: sessionData.date + 'T00:00:00.000Z', // Convert back to ISO string
        duration: durationString, // Keep as string, not number
        status: dbStatus, // Use mapped status
        therapistNotes: sessionData.therapistNotes,
        sessionSummary: sessionData.sessionSummary || '',
        achievement: sessionData.achievement ? JSON.stringify(sessionData.achievement) : null,
        feedback: JSON.stringify(sessionData.feedback || []),
        isPaid: sessionData.isPaid // Use the explicit isPaid value from the form
      };

      // Debug logging
      console.log('Saving session data:', {
        sessionSummary: updateData.sessionSummary,
        achievement: updateData.achievement,
        feedback: updateData.feedback,
        originalSessionData: {
          sessionSummary: sessionData.sessionSummary,
          achievement: sessionData.achievement,
          feedback: sessionData.feedback
        }
      });

      let finalSessionId = sessionId;
      
      if (isNewSession) {
        // Create new session with auto-generated unique ID
        const newSession = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.sessions,
          'unique()', // Let Appwrite generate unique ID
          {
            ...updateData,
            studentId: sessionData.studentId,
            sessionNumber: sessionData.sessionNumber
          }
        );
        
        // Update the sessionId to the newly created session's ID
        finalSessionId = newSession.$id;
        console.log('✅ Successfully created new session:', finalSessionId);
      } else {
        // Update existing session
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.collections.sessions,
          sessionId,
          updateData
        );
        console.log('✅ Successfully updated session:', sessionId);
      }
      
      // Success - redirect back to admin with student selected
      const redirectUrl = studentId ? `/admin?studentId=${studentId}` : '/admin';
      router.push(redirectUrl);
      
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Σφάλμα κατά την αποθήκευση της συνεδρίας. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                const redirectUrl = studentId ? `/admin?studentId=${studentId}` : '/admin';
                router.push(redirectUrl);
              }}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Επεξεργασία Συνεδρίας</h1>
              <p className="text-sm text-gray-500">Session {sessionData.sessionNumber}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Αποθήκευση</span>
                <span className="sm:hidden">Αποθήκευση</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Φόρτωση συνεδρίας...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="max-w-4xl mx-auto p-4 space-y-6 overflow-x-hidden">
        
        {/* Session Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Στοιχεία Συνεδρίας</h2>
                <Badge 
                  className={`${
                    sessionData.status === 'completed' ? 'bg-green-100 text-green-800' :
                    sessionData.status === 'canceled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {sessionData.status === 'completed' ? 'Ολοκληρωμένη ✓' :
                   sessionData.status === 'canceled' ? 'Ακυρωμένη ✕' : 'Κλειδωμένη 🔒'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Τίτλος Συνεδρίας</label>
                  <Input
                    value={sessionData.title}
                    onChange={(e) => setSessionData({...sessionData, title: e.target.value})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ημερομηνία</label>
                  <Input
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData({...sessionData, date: e.target.value})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Διάρκεια</label>
                  <Input
                    value={sessionData.duration}
                    onChange={(e) => setSessionData({...sessionData, duration: e.target.value})}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Κατάσταση</label>
                  <select 
                    value={sessionData.status}
                    onChange={(e) => setSessionData({...sessionData, status: e.target.value as 'completed' | 'locked' | 'canceled'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="locked">🔒 Κλειδωμένη</option>
                    <option value="completed">✓ Ολοκληρωμένη</option>
                    <option value="canceled">✕ Ακυρωμένη</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Κατάσταση Πληρωμής</label>
                  <div className="flex items-center space-x-3 h-10">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sessionData.isPaid}
                        onChange={(e) => setSessionData({...sessionData, isPaid: e.target.checked})}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className={`ml-2 text-sm font-medium ${sessionData.isPaid ? 'text-green-700' : 'text-gray-700'}`}>
                        {sessionData.isPaid ? 'Πληρωμένη ✓' : 'Απλήρωτη'}
                      </span>
                    </label>
                    <Badge className={`${sessionData.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sessionData.isPaid ? 'ΠΛΗΡΩΜΕΝΗ' : 'ΑΠΛΗΡΩΤΗ'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>



        {/* Session Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 text-blue-500 mr-2" />
                Περιγραφή Συνεδρίας
              </h3>
              <Textarea
                value={sessionData.sessionSummary}
                onChange={(e) => setSessionData({...sessionData, sessionSummary: e.target.value})}
                placeholder="Συνοπτική περιγραφή των κυριότερων σημείων της συνεδρίας..."
                className="min-h-[120px] text-base"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Achievement/Trophy Section */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                Επίτευγμα / Βραβείο
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Τύπος Επιτεύγματος</label>
                  <select 
                    value={sessionData.achievement?.type || ''}
                    onChange={(e) => {
                      const type = e.target.value as 'milestone' | 'skill' | 'breakthrough' | '';
                      if (type) {
                        setSessionData({
                          ...sessionData, 
                          achievement: {
                            type,
                            title: sessionData.achievement?.title || '',
                            description: sessionData.achievement?.description || '',
                            icon: sessionData.achievement?.icon || 'star'
                          }
                        });
                      } else {
                        setSessionData({...sessionData, achievement: undefined});
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Χωρίς επίτευγμα</option>
                    <option value="milestone">Ορόσημο (Milestone)</option>
                    <option value="skill">Δεξιότητα (Skill)</option>
                    <option value="breakthrough">Ανακάλυψη (Breakthrough)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Εικονίδιο</label>
                  <select 
                    value={sessionData.achievement?.icon || 'star'}
                    onChange={(e) => {
                      if (sessionData.achievement) {
                        setSessionData({
                          ...sessionData, 
                          achievement: {
                            ...sessionData.achievement,
                            icon: e.target.value as 'star' | 'zap' | 'trophy' | 'award'
                          }
                        });
                      }
                    }}
                    disabled={!sessionData.achievement}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="star">⭐ Αστέρι</option>
                    <option value="zap">⚡ Κεραυνός</option>
                    <option value="trophy">🏆 Τρόπαιο</option>
                    <option value="award">🥇 Μετάλλιο</option>
                  </select>
                </div>
              </div>
              
              {sessionData.achievement && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Τίτλος Επιτεύγματος</label>
                    <Input
                      value={sessionData.achievement.title}
                      onChange={(e) => setSessionData({
                        ...sessionData, 
                        achievement: {
                          ...sessionData.achievement!,
                          title: e.target.value
                        }
                      })}
                      placeholder="π.χ. Πρώτα Βήματα"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Περιγραφή Επιτεύγματος</label>
                    <Textarea
                      value={sessionData.achievement.description}
                      onChange={(e) => setSessionData({
                        ...sessionData, 
                        achievement: {
                          ...sessionData.achievement!,
                          description: e.target.value
                        }
                      })}
                      placeholder="Περιγράψτε το επίτευγμα..."
                      className="min-h-[80px]"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Materials Section */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Folder className="w-6 h-6 mr-3 text-blue-600" />
                Υλικό Συνεδρίας
              </h2>



              {/* PDF Files */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 text-red-500 mr-2" />
                    Έγγραφα PDF
                    <Badge variant="outline" className="ml-2">
                      {sessionData.materials.pdfs.length}
                    </Badge>
                  </h3>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.pdf,application/pdf';
                      input.onchange = async (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          try {
                            for (const file of files) {
                              if (file.type === 'application/pdf') {
                                const uploadedFile = await fileService.uploadFile(file, sessionData.id);
                                setSessionData(prev => ({
                                  ...prev,
                                  materials: {
                                    ...prev.materials,
                                    pdfs: [...prev.materials.pdfs, {
                                      id: uploadedFile.id,
                                      name: uploadedFile.name,
                                      size: fileService.formatFileSize(uploadedFile.size),
                                      uploadDate: new Date().toLocaleDateString('el-GR'),
                                      type: 'pdf'
                                    }]
                                  }
                                }));
                              }
                            }
                          } catch (error) {
                            console.error('Error uploading PDF:', error);
                            alert(`Σφάλμα κατά τη μεταφόρτωση του PDF: ${error.message}`);
                          }
                        }
                      };
                      input.click();
                    }}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Προσθήκη PDF
                  </Button>
                </div>

                <div className="space-y-3">
                  {sessionData.materials.pdfs.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0">
                        <FileText className="w-6 h-6 md:w-5 md:h-5 text-red-500 flex-shrink-0 mt-0.5 md:mt-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 break-words leading-tight">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{file.size} • {file.uploadDate}</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full md:w-auto text-xs h-9 px-3"
                          onClick={() => handleFilePreview(file)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span>Προβολή</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full md:w-auto text-xs h-9 px-3"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          <span>Λήψη</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFile('pdfs', file.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300 w-full md:w-auto text-xs h-9 px-3"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span>Διαγραφή</span>
                        </Button>
                      </div>
                    </div>
                  ))}



                  {sessionData.materials.pdfs.length === 0 && (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                      <FileText className="w-16 h-16 text-red-300 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Δεν υπάρχουν έγγραφα PDF</p>
                      <p className="text-xs text-gray-500">Προσθέστε έγγραφα PDF κάνοντας κλικ στο κουμπί παραπάνω</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video Files */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Video className="w-5 h-5 text-purple-500 mr-2" />
                    Βίντεο
                    <Badge variant="outline" className="ml-2">
                      {sessionData.materials.videos.length}
                    </Badge>
                  </h3>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.mp4,.mov,.avi,.mkv,.wmv,.flv,video/mp4,video/quicktime,video/x-msvideo';
                      input.onchange = async (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          try {
                            for (const file of files) {
                              if (file.type.startsWith('video/')) {
                                const uploadedFile = await fileService.uploadFile(file, sessionData.id);
                                setSessionData(prev => ({
                                  ...prev,
                                  materials: {
                                    ...prev.materials,
                                    videos: [...prev.materials.videos, {
                                      id: uploadedFile.id,
                                      name: uploadedFile.name,
                                      size: fileService.formatFileSize(uploadedFile.size),
                                      uploadDate: new Date().toLocaleDateString('el-GR'),
                                      type: 'video'
                                    }]
                                  }
                                }));
                              }
                            }
                          } catch (error) {
                            console.error('Error uploading videos:', error);
                            alert(`Σφάλμα κατά τη μεταφόρτωση των βίντεο: ${error.message}`);
                          }
                        }
                      };
                      input.click();
                    }}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Προσθήκη Βίντεο
                  </Button>
                </div>

                <div className="space-y-3">
                  {sessionData.materials.videos.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0">
                        <Video className="w-6 h-6 md:w-5 md:h-5 text-purple-500 flex-shrink-0 mt-0.5 md:mt-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 break-words leading-tight">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{file.size} • {file.uploadDate}</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full md:w-auto text-xs h-9 px-3"
                          onClick={() => handleFilePreview(file)}
                        >
                          <PlayCircle className="w-3 h-3 mr-1" />
                          <span>Αναπαραγωγή</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full md:w-auto text-xs h-9 px-3"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          <span>Λήψη</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFile('videos', file.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300 w-full md:w-auto text-xs h-9 px-3"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span>Διαγραφή</span>
                        </Button>
                      </div>
                    </div>
                  ))}



                  {sessionData.materials.videos.length === 0 && (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                      <Video className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Δεν υπάρχουν βίντεο</p>
                      <p className="text-xs text-gray-500">Προσθέστε αρχεία βίντεο κάνοντας κλικ στο κουμπί παραπάνω</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Files */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ImageIcon className="w-5 h-5 text-blue-500 mr-2" />
                    Συλλογή Εικόνων
                    <Badge variant="outline" className="ml-2">
                      {sessionData.materials.images.length}
                    </Badge>
                  </h3>
                  <Button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.accept = '.jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp';
                      input.onchange = async (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files || []);
                        if (files.length) {
                          try {
                            for (const file of files) {
                              if (file.type.startsWith('image/')) {
                                const uploadedFile = await fileService.uploadFile(file, sessionData.id);
                                setSessionData(prev => ({
                                  ...prev,
                                  materials: {
                                    ...prev.materials,
                                    images: [...prev.materials.images, {
                                      id: uploadedFile.id,
                                      name: uploadedFile.name,
                                      size: fileService.formatFileSize(uploadedFile.size),
                                      uploadDate: new Date().toLocaleDateString('el-GR'),
                                      type: 'image'
                                    }]
                                  }
                                }));
                              }
                            }
                          } catch (error) {
                            console.error('Error uploading images:', error);
                            alert(`Σφάλμα κατά τη μεταφόρτωση των εικόνων: ${error.message}`);
                          }
                        }
                      };
                      input.click();
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Προσθήκη Εικόνων
                  </Button>
                </div>

                <div className="space-y-3">
                  {sessionData.materials.images.map((file) => (
                    <div
                      key={file.id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0">
                        <ImageIcon className="w-6 h-6 md:w-5 md:h-5 text-blue-500 flex-shrink-0 mt-0.5 md:mt-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 break-words leading-tight">{file.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{file.size} • {file.uploadDate}</p>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full md:w-auto text-xs h-9 px-3"
                          onClick={() => handleFilePreview(file)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span>Προβολή</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full md:w-auto text-xs h-9 px-3"
                          onClick={() => handleFileDownload(file)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          <span>Λήψη</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFile('images', file.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300 w-full md:w-auto text-xs h-9 px-3"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span>Διαγραφή</span>
                        </Button>
                      </div>
                    </div>
                  ))}



                  {sessionData.materials.images.length === 0 && (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                      <ImageIcon className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Δεν υπάρχουν εικόνες</p>
                      <p className="text-xs text-gray-500">Προσθέστε εικόνες κάνοντας κλικ στο κουμπί παραπάνω</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section - Only show for existing sessions */}
        {!isNewSession && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="w-5 h-5 text-blue-500 mr-2" />
                  Συνομιλία Συνεδρίας
                </h3>
                
                <div className="space-y-4">
                  {sessionData.feedback.map((comment, index) => (
                    <div key={comment.id} className="flex space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4 group hover:bg-gray-100 transition-colors relative">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {comment.author === "parent" ? "Γονέας" : "Θεραπευτής"}
                              </span>
                              <span className="text-xs text-gray-500">{comment.timestamp}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Διαγραφή σχολίου"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-gray-700 text-sm leading-relaxed">{comment.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {sessionData.feedback.length === 0 && (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 text-sm">Δεν υπάρχουν ακόμα σχόλια για αυτή τη συνεδρία</p>
                    </div>
                  )}
                </div>

                {/* Add Comment */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg focus-within:border-blue-300 transition-colors">
                  <div className="p-4">
                    <Textarea
                      placeholder="Προσθέστε σχόλιο ή ερώτηση για αυτή τη συνεδρία..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="border-0 p-0 resize-none focus-visible:ring-0 placeholder:text-gray-400 min-h-[60px] bg-transparent"
                      rows={2}
                    />
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Το σχόλιό σας θα σταλεί στους γονείς
                      </span>
                      <Button 
                        size="sm" 
                        disabled={!newComment.trim()}
                        className="bg-blue-500 hover:bg-blue-600"
                        onClick={() => {
                          if (newComment.trim()) {
                            const newFeedback = {
                              id: Date.now().toString(),
                              author: "therapist",
                              message: newComment.trim(),
                              timestamp: new Date().toLocaleString('el-GR'),
                              isRead: false
                            };
                            
                            setSessionData({
                              ...sessionData,
                              feedback: [...sessionData.feedback, newFeedback]
                            });
                            
                            setNewComment("");
                          }
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Αποστολή
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          isOpen={showFilePreview}
          onClose={() => {
            setShowFilePreview(false);
            setPreviewFile(null);
          }}
          onDownload={() => handleFileDownload(previewFile)}
        />
      )}
    </div>
  );
}

export default function SessionEditPage() {
  return (
    <AdminRoute>
      <SessionEditPageContent />
    </AdminRoute>
  );
}
