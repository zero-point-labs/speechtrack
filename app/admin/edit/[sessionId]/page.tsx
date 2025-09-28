"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { AdminRoute } from "@/lib/auth-middleware";
import { databases, storage, appwriteConfig, Query } from "@/lib/appwrite.client";
import { fileServiceSimple as fileService } from "@/lib/fileServiceSimple";
import sessionFolderService from "@/lib/sessionFolderService";
import FilePreview from "@/components/FilePreview";
// import FileUpload from "@/components/FileUpload"; // Unused import
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Trophy,
  Stethoscope,
  Plus,
  Edit,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import TutorialCard from "@/components/admin/TutorialCard";

// Types
interface SessionFileData {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  type: string;
}

// Therapist Node Interface
interface TherapistNode {
  id: string;
  type: 'clinical' | 'assessment' | 'planning' | 'internal' | 'observation';
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  timestamp: string;
  therapistId?: string;
}

interface SessionData {
  id: string;
  studentId: string;
  folderId?: string;
  sessionNumber: string; // Changed to string to match database format like "9 - 2025"
  title: string;
  date: string;
  duration: string;
  status: 'completed' | 'locked' | 'canceled';
  isPaid: boolean;
  isGESY: boolean;
  gesyNote?: string; // Store ΓεΣΥ note in the achievement field
  therapistNotes: string;
  sessionSummary: string;
  therapistNodes: TherapistNode[]; // NEW: Private therapist nodes (stored in therapistNotes field)
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
  folderId: "1",
  sessionNumber: "1 - 2024",
  title: "Αρχική Αξιολόγηση & Εισαγωγή",
  date: "2024-01-01",
  duration: "45 λεπτά",
  status: "completed",
  isPaid: true,
  isGESY: false,
  gesyNote: "",
  therapistNotes: "Emma showed great enthusiasm during our first session. We completed a comprehensive assessment of her current speech patterns and identified areas for improvement.",
  sessionSummary: "During this initial session, we focused on building rapport and conducting a thorough speech assessment. Emma demonstrated strong listening skills and was eager to participate in all activities.",
  therapistNodes: [], // NEW: Initialize empty therapist nodes
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

  // Function to get the correct back URL
  const getBackUrl = () => {
    // If we have both studentId and folderId, go to the folder sessions page
    if (sessionData.studentId && sessionData.folderId) {
      return `/admin/students/${sessionData.studentId}/folders/${sessionData.folderId}`;
    }
    // If we only have studentId from URL params, go to the student folders page
    else if (studentId) {
      return `/admin/students/${studentId}/folders`;
    }
    // Fallback to main admin page
    else {
      return '/admin';
    }
  };
  
  // Use empty data for new sessions, will load real data for existing ones
  const initialSessionData = {
    id: sessionId,
    studentId: studentId || "1",
    folderId: searchParams.get('folderId') || undefined,
    sessionNumber: "1",
    title: "",
    date: new Date().toISOString().split('T')[0],
    duration: "45 λεπτά",
    status: "locked" as const,
    isPaid: false,
    isGESY: false,
    gesyNote: "",
    therapistNotes: "",
    sessionSummary: "",
    therapistNodes: [], // NEW: Initialize empty therapist nodes
    materials: { pdfs: [], videos: [], images: [] },
    feedback: []
  };
  
  const [sessionData, setSessionData] = useState<SessionData>(initialSessionData);

  const [newComment, setNewComment] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(!isNewSession);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);

  // Upload Progress State
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    fileName: string;
    progress: number;
    fileType: string;
  } | null>(null);

  // NEW: Therapist Nodes State
  const [newTherapistNode, setNewTherapistNode] = useState<Partial<TherapistNode>>({
    type: 'clinical',
    title: '',
    content: '',
    priority: 'medium'
  });
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // File input refs for mobile compatibility
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // File upload handlers
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      try {
        for (const file of files) {
          if (file.type === 'application/pdf') {
            // Show file size info for user awareness
            const fileSize = fileService.formatFileSize(file.size);
            const UPLOAD_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB
            const isLargeFile = file.size > UPLOAD_SIZE_LIMIT;
            
            if (isLargeFile) {
              console.log(`📤 Large file detected (${fileSize}): ${file.name} - Using direct upload method`);
            } else {
              console.log(`📤 Small file (${fileSize}): ${file.name} - Using traditional upload`);
            }

            const uploadedFile = await uploadWithProgress(file, 'pdf') as any;
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
          } else {
            alert('Παρακαλώ επιλέξτε μόνο αρχεία PDF');
          }
        }
      } catch (error) {
        console.error('Error uploading PDF:', error);
        alert(`Σφάλμα κατά τη μεταφόρτωση του PDF: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
      }
      // Reset input
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      try {
        for (const file of files) {
          if (file.type.startsWith('video/')) {
            // Show file size info for user awareness
            const fileSize = fileService.formatFileSize(file.size);
            const UPLOAD_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB
            const isLargeFile = file.size > UPLOAD_SIZE_LIMIT;
            
            if (isLargeFile) {
              console.log(`📤 Large video detected (${fileSize}): ${file.name} - Using direct upload method`);
            } else {
              console.log(`📤 Small video (${fileSize}): ${file.name} - Using traditional upload`);
            }

            const uploadedFile = await uploadWithProgress(file, 'video') as any;
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
          } else {
            alert('Παρακαλώ επιλέξτε μόνο αρχεία βίντεο');
          }
        }
      } catch (error) {
        console.error('Error uploading videos:', error);
        alert(`Σφάλμα κατά τη μεταφόρτωση των βίντεο: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
      }
      // Reset input
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      try {
        for (const file of files) {
          if (file.type.startsWith('image/')) {
            // Show file size info for user awareness
            const fileSize = fileService.formatFileSize(file.size);
            const UPLOAD_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB
            const isLargeFile = file.size > UPLOAD_SIZE_LIMIT;
            
            if (isLargeFile) {
              console.log(`📤 Large image detected (${fileSize}): ${file.name} - Using direct upload method`);
            } else {
              console.log(`📤 Small image (${fileSize}): ${file.name} - Using traditional upload`);
            }

            const uploadedFile = await uploadWithProgress(file, 'image') as any;
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
          } else {
            alert('Παρακαλώ επιλέξτε μόνο αρχεία εικόνων');
          }
        }
      } catch (error) {
        console.error('Error uploading images:', error);
        alert(`Σφάλμα κατά τη μεταφόρτωση των εικόνων: ${error instanceof Error ? error.message : 'Άγνωστο σφάλμα'}`);
      }
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // Upload helper function with progress
  const uploadWithProgress = async (file: File, fileType: 'pdf' | 'video' | 'image') => {
    try {
      const fileSize = fileService.formatFileSize(file.size);
      const UPLOAD_SIZE_LIMIT = 4 * 1024 * 1024; // 4MB
      const isLargeFile = file.size > UPLOAD_SIZE_LIMIT;
      
      // Start upload progress
      setUploadProgress({
        isUploading: true,
        fileName: file.name,
        progress: 0,
        fileType: fileType
      });

      let progressInterval: NodeJS.Timeout;

      if (isLargeFile) {
        // For large files, show different progress pattern (direct upload)
        console.log(`📤 Uploading large file (${fileSize}): ${file.name}`);
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev && prev.progress < 85) {
              return { ...prev, progress: prev.progress + 5 };
            }
            return prev;
          });
        }, 500);
      } else {
        // For small files, use faster progress (traditional upload)
        console.log(`📤 Uploading small file (${fileSize}): ${file.name}`);
        progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev && prev.progress < 90) {
              return { ...prev, progress: prev.progress + 10 };
            }
            return prev;
          });
        }, 200);
      }

      // Actual upload
      const uploadedFile = await fileService.uploadFile(file, sessionData.id);

      // Complete progress
      setUploadProgress(prev => prev ? { ...prev, progress: 100 } : null);
      
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);

      clearInterval(progressInterval);
      
      return uploadedFile;

    } catch (error) {
      setUploadProgress(null);
      throw error;
    }
  };

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
      
      const folderId = searchParams.get('folderId');
      
      // Get the highest session number for this folder to calculate next number
      const queryFilters = [Query.equal('studentId', studentId!), Query.orderDesc('sessionNumber')];
      
      // If we have a folderId, get sessions only from that folder
      if (folderId) {
        queryFilters.push(Query.equal('folderId', folderId));
      }
      
      const existingSessions = await databases.listDocuments(
        appwriteConfig.databaseId!,
        appwriteConfig.collections.sessions!,
        queryFilters
      );
      
      // Extract numeric session numbers from formatted strings like "8 - 2025"
      let nextSessionNumber = 1;
      if (existingSessions.documents.length > 0) {
        const numericSessions = existingSessions.documents
          .map(session => {
            const match = session.sessionNumber?.toString().match(/^(\d+)/);
            return match ? parseInt(match[1]) : 0;
          })
          .filter(num => num > 0);
        
        if (numericSessions.length > 0) {
          nextSessionNumber = Math.max(...numericSessions) + 1;
        }
      }
      
      console.log(`Initializing new session #${nextSessionNumber} for folder:`, folderId);
      
      // Format session number to match existing format (e.g., "9 - 2025")
      const currentYear = new Date().getFullYear();
      const formattedSessionNumber = `${nextSessionNumber} - ${currentYear}`;
      
      // Update session data with correct studentId, folderId, and sessionNumber
      setSessionData(prev => ({
        ...prev,
        studentId: studentId!,
        folderId: folderId || undefined,
        sessionNumber: formattedSessionNumber,
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
        appwriteConfig.databaseId!,
        appwriteConfig.collections.sessions!,
        sessionId
      );

      // Map database status to UI status
      const dbToUIStatusMapping: Record<string, 'completed' | 'locked' | 'canceled'> = {
        'completed': 'completed',
        'available': 'locked', // Legacy: convert old available sessions to locked in UI
        'locked': 'locked',
        'cancelled': 'canceled'
      };
      
      const uiStatus = dbToUIStatusMapping[session.status] || 'locked';
      
      // Load session files using new R2 API
      const materials: {
        pdfs: SessionFileData[];
        videos: SessionFileData[];
        images: SessionFileData[];
      } = { pdfs: [], videos: [], images: [] };
      
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
            size: fileService.formatFileSize(file.size || 0),
            uploadDate: file.uploadDate ? new Date(file.uploadDate).toLocaleDateString('el-GR') : 'Σήμερα',
            type: file.type
          };
          
          if (file.type === 'pdf') {
            materials.pdfs.push(fileData);
          } else if (file.type === 'image') {
            materials.images.push(fileData);
          } else if (file.type === 'video') {
            materials.videos.push(fileData);
          }
        });
      } catch (error) {
        console.error('Error loading session files:', error);
      }

      // Parse JSON fields - use achievement field for ΓεΣΥ note
      let gesyNote = '';
      let feedback = [];
      let therapistNodes: TherapistNode[] = [];
      
      // Extract ΓεΣΥ note from achievement field (repurposing for ΓεΣΥ note storage)
      try {
        if (session.achievement) {
          // If it's a JSON object (old achievement), ignore it
          // If it's a simple string, use it as ΓεΣΥ note
          const parsed = JSON.parse(session.achievement);
          if (typeof parsed === 'string') {
            gesyNote = parsed;
          }
          // Otherwise, ignore old achievement data
        }
      } catch (error) {
        // If parsing fails, treat as plain string (ΓεΣΥ note)
        gesyNote = session.achievement || '';
      }
      
      try {
        if (session.feedback) {
          feedback = JSON.parse(session.feedback);
        }
      } catch (error) {
        console.error('Error parsing feedback:', error);
      }
      
      try {
        // Check if therapistNotes contains JSON array (new format) or plain text (old format)
        const notesContent = session.therapistNotes || '';
        if (notesContent.trim().startsWith('[') || notesContent.trim().startsWith('{')) {
          // New structured format - parse as JSON
          therapistNodes = JSON.parse(notesContent);
        } else if (notesContent.trim().length > 0) {
          // Old plain text format - convert to structured format
          therapistNodes = [{
            id: 'legacy-note',
            type: 'internal',
            title: 'Παλαιές Σημειώσεις',
            content: notesContent,
            priority: 'medium',
            timestamp: new Date().toISOString(),
            therapistId: 'legacy'
          }];
        }
      } catch (error) {
        console.error('Error parsing therapist notes:', error);
        // If parsing fails, treat as plain text
        const notesContent = session.therapistNotes || '';
        if (notesContent.trim().length > 0) {
          therapistNodes = [{
            id: 'legacy-note-fallback',
            type: 'internal',
            title: 'Παλαιές Σημειώσεις (Αποκατάσταση)',
            content: notesContent,
            priority: 'medium',
            timestamp: new Date().toISOString(),
            therapistId: 'legacy'
          }];
        }
      }

            // Convert Appwrite session to UI format
      const sessionForUI: SessionData = {
        id: session.$id,
        studentId: session.studentId,
        folderId: session.folderId,
        sessionNumber: session.sessionNumber,
        title: session.title,
        date: session.date.split('T')[0], // Convert to date only
        duration: session.duration + ' λεπτά',
        status: uiStatus, // Use mapped status
        isPaid: session.isPaid || false,
        isGESY: session.isGESY || false,
        gesyNote, // Use extracted ΓεΣΥ note
        therapistNotes: '', // Legacy field now used for structured storage
        sessionSummary: session.sessionSummary || '',
        therapistNodes, // NEW: Include therapist nodes
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
  const handleFilePreview = (file: { id: string; name: string; type: string }) => {
    const fileType = (file.type || '').toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Check if mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    // For PDFs, navigate to dedicated viewing page for better mobile experience
    if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
      router.push(`/dashboard/pdf/${file.id}`);
      return;
    }
    
    // For videos on mobile, navigate to dedicated viewing page for better experience
    if (isMobile && (fileType.includes('video') || fileName.match(/\.(mp4|mov|avi|mkv|wmv|flv|webm)$/))) {
      router.push(`/dashboard/video/${file.id}`);
      return;
    }
    
    // For other files, use modal preview
    const fileForPreview = {
      ...file,
      type: fileType,
      url: fileService.getFileViewUrl(file.id)
    };
    setPreviewFile(fileForPreview);
    setShowFilePreview(true);
  };

  // Handle file download
  const handleFileDownload = async (file: { id: string; name: string }) => {
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
  const handleDeleteFile = async (fileType: keyof SessionData['materials'], fileId: string) => {
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

  // NEW: Therapist Nodes Helper Functions
  const addTherapistNode = () => {
    if (!newTherapistNode.title?.trim() || !newTherapistNode.content?.trim()) {
      alert('Παρακαλώ συμπληρώστε τίτλο και περιεχόμενο.');
      return;
    }

    const node: TherapistNode = {
      id: Date.now().toString(),
      type: newTherapistNode.type as TherapistNode['type'],
      title: newTherapistNode.title,
      content: newTherapistNode.content,
      priority: newTherapistNode.priority as TherapistNode['priority'],
      category: newTherapistNode.category,
      timestamp: new Date().toISOString(),
      therapistId: sessionData.studentId // Using studentId as placeholder, should be actual therapist ID
    };

    setSessionData(prev => ({
      ...prev,
      therapistNodes: [...prev.therapistNodes, node]
    }));

    // Reset form
    setNewTherapistNode({
      type: 'clinical',
      title: '',
      content: '',
      priority: 'medium'
    });
  };

  const deleteTherapistNode = (nodeId: string) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή τη σημείωση;')) {
      setSessionData(prev => ({
        ...prev,
        therapistNodes: prev.therapistNodes.filter(node => node.id !== nodeId)
      }));
    }
  };

  const updateTherapistNode = (nodeId: string, updates: Partial<TherapistNode>) => {
    setSessionData(prev => ({
      ...prev,
      therapistNodes: prev.therapistNodes.map(node =>
        node.id === nodeId ? { ...node, ...updates, timestamp: new Date().toISOString() } : node
      )
    }));
    setEditingNodeId(null);
  };

  // Save session handler
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Keep duration as string (remove ' λεπτά' suffix and convert to just the number as string)
      const durationString = sessionData.duration.replace(' λεπτά', '');
      
      // Map UI status to database status (no more "available" - use "locked" in database too)
      const statusMapping = {
        'completed': 'completed',
        'locked': 'locked', // Changed: use locked in DB instead of available
        'canceled': 'cancelled'
      };
      
      const dbStatus = statusMapping[sessionData.status] || 'locked';
      
      // Prepare data for Appwrite
      const updateData = {
        title: sessionData.title,
        date: sessionData.date + 'T00:00:00.000Z', // Convert back to ISO string
        duration: durationString, // Keep as string, not number
        status: dbStatus, // Use mapped status
        therapistNotes: JSON.stringify(sessionData.therapistNodes || []), // NEW: Store structured notes in therapistNotes field
        sessionSummary: sessionData.sessionSummary || '',
        achievement: sessionData.gesyNote || null, // Store ΓεΣΥ note in achievement field
        feedback: JSON.stringify(sessionData.feedback || []),
        isPaid: sessionData.isPaid, // Use the explicit isPaid value from the form
        isGESY: sessionData.isGESY // Add ΓεΣΥ status
      };

      // Debug logging
      console.log('Saving session data:', {
        sessionSummary: updateData.sessionSummary,
        gesyNote: updateData.achievement, // ΓεΣΥ note stored in achievement field
        feedback: updateData.feedback,
        originalSessionData: {
          sessionSummary: sessionData.sessionSummary,
          gesyNote: sessionData.gesyNote,
          feedback: sessionData.feedback
        }
      });

      let finalSessionId = sessionId;
      
      if (isNewSession) {
        console.log('📝 Creating new session with data:', {
          ...updateData,
          studentId: sessionData.studentId,
          folderId: sessionData.folderId,
          sessionNumber: sessionData.sessionNumber
        });
        
        // Create new session with auto-generated unique ID
        const newSession = await databases.createDocument(
          appwriteConfig.databaseId!,
          appwriteConfig.collections.sessions!,
          'unique()', // Let Appwrite generate unique ID
          {
            ...updateData,
            studentId: sessionData.studentId,
            folderId: sessionData.folderId, // Include folderId so session appears in folder
            sessionNumber: sessionData.sessionNumber // Already formatted as "X - YYYY"
          }
        );
        
        // Update the sessionId to the newly created session's ID
        finalSessionId = newSession.$id;
        console.log('✅ Successfully created new session:', finalSessionId);
        console.log('📁 Session created in folder:', sessionData.folderId);
        
        // Update folder statistics (totalSessions, completedSessions)
        if (sessionData.folderId) {
          try {
            console.log('📊 Updating folder statistics for:', sessionData.folderId);
            const updatedFolder = await sessionFolderService.updateFolderStats(sessionData.folderId);
            console.log('📊 Folder stats updated successfully:', updatedFolder);
          } catch (error) {
            console.error('⚠️ Failed to update folder stats:', error);
            console.error('Full error:', error);
            // Don't fail the session creation if stats update fails
          }
        }
      } else {
        // Update existing session
        await databases.updateDocument(
          appwriteConfig.databaseId!,
          appwriteConfig.collections.sessions!,
          sessionId,
          updateData
        );
        console.log('✅ Successfully updated session:', sessionId);
        
        // Update folder statistics if session has folderId (in case status changed)
        if (sessionData.folderId) {
          try {
            await sessionFolderService.updateFolderStats(sessionData.folderId);
            console.log('📊 Updated folder statistics after session update');
          } catch (error) {
            console.error('⚠️ Failed to update folder stats:', error);
            // Don't fail the session update if stats update fails
          }
        }
      }
      
      // Success - redirect back to the folder sessions page
      router.push(getBackUrl());
      
    } catch (error) {
      console.error('Error saving session:', error);
      alert('Σφάλμα κατά την αποθήκευση της συνεδρίας. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file inputs for mobile compatibility */}
      <input
        ref={pdfInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        onChange={handlePDFUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept=".mp4,.mov,.avi,.mkv,.wmv,.flv,video/mp4,video/quicktime,video/x-msvideo"
        onChange={handleVideoUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                router.push(getBackUrl());
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ΓεΣΥ</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sessionData.isGESY}
                          onChange={(e) => setSessionData({...sessionData, isGESY: e.target.checked})}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className={`ml-2 text-sm font-medium ${sessionData.isGESY ? 'text-green-700' : 'text-gray-700'}`}>
                          {sessionData.isGESY ? 'ΓεΣΥ ✓' : 'Χωρίς ΓεΣΥ'}
                        </span>
                      </label>
                      <Badge className={`${sessionData.isGESY ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {sessionData.isGESY ? 'ΓεΣΥ' : 'ΧΩΡΙΣ ΓεΣΥ'}
                      </Badge>
                    </div>
                    
                    {sessionData.isGESY && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Σημείωση ΓεΣΥ</label>
                        <Input
                          type="text"
                          placeholder="Προαιρετική σημείωση για το ΓεΣΥ..."
                          value={sessionData.gesyNote || ''}
                          onChange={(e) => setSessionData({...sessionData, gesyNote: e.target.value})}
                          className="text-sm"
                        />
                      </div>
                    )}
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


        {/* NEW: Therapist Nodes Section - ADMIN ONLY */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Stethoscope className="w-6 h-6 mr-3 text-purple-600" />
                  Θεραπευτικές Σημειώσεις
                  <Badge variant="outline" className="ml-2 text-xs bg-red-50 text-red-700 border-red-200">
                    ΙΔΙΩΤΙΚΟ
                  </Badge>
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {sessionData.therapistNodes.length} σημειώσεις
                </Badge>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-red-800 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Αυτές οι σημειώσεις είναι ορατές μόνο στους θεραπευτές και δεν εμφανίζονται στους γονείς.</span>
                </div>
                <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  💡 <strong>Αναβάθμιση:</strong> Οι παλαιές απλές σημειώσεις έχουν μετατραπεί σε δομημένες κατηγοριοποιημένες σημειώσεις.
                </div>
              </div>

              {/* Add New Node Form */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-purple-900 mb-4 flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Προσθήκη Νέας Σημείωσης
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">Τύπος</label>
                      <select
                        value={newTherapistNode.type}
                        onChange={(e) => setNewTherapistNode(prev => ({ ...prev, type: e.target.value as TherapistNode['type'] }))}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="clinical">🏥 Κλινική Παρατήρηση</option>
                        <option value="assessment">📊 Αξιολόγηση</option>
                        <option value="planning">📋 Σχεδιασμός Θεραπείας</option>
                        <option value="internal">🔒 Εσωτερική Σημείωση</option>
                        <option value="observation">👁️ Συμπεριφορική Παρατήρηση</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-2">Προτεραιότητα</label>
                      <select
                        value={newTherapistNode.priority}
                        onChange={(e) => setNewTherapistNode(prev => ({ ...prev, priority: e.target.value as TherapistNode['priority'] }))}
                        className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="low">🟢 Χαμηλή</option>
                        <option value="medium">🟡 Μέτρια</option>
                        <option value="high">🔴 Υψηλή</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-purple-700 mb-2">Τίτλος</label>
                    <Input
                      value={newTherapistNode.title || ''}
                      onChange={(e) => setNewTherapistNode(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="π.χ. Πρόοδος στην προφορά του R"
                      className="border-purple-300 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-purple-700 mb-2">Περιεχόμενο</label>
                    <Textarea
                      value={newTherapistNode.content || ''}
                      onChange={(e) => setNewTherapistNode(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Λεπτομερής περιγραφή της παρατήρησης ή σημείωσης..."
                      className="min-h-[80px] border-purple-300 focus:ring-purple-500"
                      rows={3}
                    />
                  </div>
                  
                  <Button
                    onClick={addTherapistNode}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Προσθήκη Σημείωσης
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Nodes */}
              <div className="space-y-3">
                {sessionData.therapistNodes.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 text-sm font-medium">Δεν υπάρχουν θεραπευτικές σημειώσεις</p>
                    <p className="text-xs text-gray-500 mt-1">Προσθέστε σημειώσεις που θα είναι ορατές μόνο στους θεραπευτές</p>
                  </div>
                ) : (
                  sessionData.therapistNodes.map((node) => (
                    <Card key={node.id} className="border-l-4 border-l-purple-500 bg-white hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline"
                              className={`text-xs ${
                                node.type === 'clinical' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                node.type === 'assessment' ? 'bg-green-50 text-green-700 border-green-200' :
                                node.type === 'planning' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                node.type === 'internal' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {node.type === 'clinical' && '🏥 Κλινική'}
                              {node.type === 'assessment' && '📊 Αξιολόγηση'}
                              {node.type === 'planning' && '📋 Σχεδιασμός'}
                              {node.type === 'internal' && '🔒 Εσωτερική'}
                              {node.type === 'observation' && '👁️ Παρατήρηση'}
                            </Badge>
                            
                            <Badge 
                              variant="secondary"
                              className={`text-xs ${
                                node.priority === 'high' ? 'bg-red-100 text-red-700' :
                                node.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}
                            >
                              {node.priority === 'high' && '🔴 Υψηλή'}
                              {node.priority === 'medium' && '🟡 Μέτρια'}  
                              {node.priority === 'low' && '🟢 Χαμηλή'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNodeId(node.id)}
                              className="w-8 h-8 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteTherapistNode(node.id)}
                              className="w-8 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mb-2">{node.title}</h4>
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">{node.content}</p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(node.timestamp).toLocaleString('el-GR')}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
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

              {/* File Size Information Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-900 mb-2">Μεταφόρτωση Αρχείων Χωρίς Όρια Μεγέθους</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• <strong>Μικρά αρχεία (&lt; 4MB):</strong> Γρήγορη παραδοσιακή μεταφόρτωση</p>
                      <p>• <strong>Μεγάλα αρχεία (&gt; 4MB):</strong> Έξυπνη μεταφόρτωση με αυτόματο fallback</p>
                      <p>• <strong>Υποστηρίζονται όλα τα μεγέθη:</strong> PDF, βίντεο και εικόνες χωρίς περιορισμούς</p>
                      <p className="text-orange-700 bg-orange-100 px-2 py-1 rounded text-xs">
                        💡 <strong>Σημείωση:</strong> Μεγάλα αρχεία μπορεί να χρειάζονται περισσότερο χρόνο μέχρι να ρυθμιστεί το CORS
                      </p>
                    </div>
                  </div>
                </div>
              </div>



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
                    disabled={uploadProgress?.isUploading}
                    onClick={() => pdfInputRef.current?.click()}
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
                    disabled={uploadProgress?.isUploading}
                    onClick={() => videoInputRef.current?.click()}
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
                    disabled={uploadProgress?.isUploading}
                    onClick={() => imageInputRef.current?.click()}
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

      {/* Upload Progress Modal */}
      {uploadProgress && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                {uploadProgress.fileType === 'pdf' && <FileText className="w-6 h-6 text-blue-600" />}
                {uploadProgress.fileType === 'video' && <Video className="w-6 h-6 text-purple-600" />}
                {uploadProgress.fileType === 'image' && <ImageIcon className="w-6 h-6 text-green-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-gray-900">Μεταφόρτωση αρχείου</h4>
                <p className="text-sm text-gray-600 truncate">{uploadProgress.fileName}</p>
              </div>
              <div className="flex-shrink-0">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Πρόοδος</span>
                <span className="font-medium text-gray-900">{uploadProgress.progress}%</span>
              </div>
              <Progress value={uploadProgress.progress} className="w-full h-2" />
              <p className="text-xs text-gray-500 text-center">
                {uploadProgress.progress < 100 ? (
                  uploadProgress.fileType === 'video' || uploadProgress.progress > 85 ? 
                    'Γίνεται άμεση μεταφόρτωση στο cloud...' : 
                    'Γίνεται μεταφόρτωση...'
                ) : '✅ Αρχείο προστέθηκε επιτυχώς!'}
              </p>
            </div>
          </div>
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

      {/* Tutorial Card */}
      <TutorialCard
        title="Οδηγός Επεξεργασίας Συνεδρίας"
        description="Μάθετε πώς να επεξεργάζεστε συνεδρίες, να προσθέτετε στόχους, δραστηριότητες και αρχεία."
        steps={[
          {
            title: "Επεξεργασία Βασικών Στοιχείων",
            description: "Αλλάξτε τον τίτλο, την περιγραφή, την ημερομηνία και τη διάρκεια της συνεδρίας.",
            action: "Χρησιμοποιήστε τα πεδία εισαγωγής στο επάνω μέρος της σελίδας"
          },
          {
            title: "Διαχείριση Στόχων",
            description: "Προσθέστε ή επεξεργαστείτε θεραπευτικούς στόχους για τη συνεδρία.",
            action: "Κάντε κλικ στο '+' στην ενότητα στόχων για να προσθέσετε νέους"
          },
          {
            title: "Προσθήκη Δραστηριοτήτων",
            description: "Δημιουργήστε δραστηριότητες και ασκήσεις για τον μαθητή.",
            action: "Περιγράψτε αναλυτικά κάθε δραστηριότητα και τον σκοπό της"
          },
          {
            title: "Ανέβασμα Αρχείων",
            description: "Προσθέστε PDF, εικόνες ή βίντεο που θα χρησιμοποιηθούν στη συνεδρία.",
            action: "Σύρετε αρχεία στην περιοχή ή κάντε κλικ για επιλογή"
          },
          {
            title: "Αποθήκευση Αλλαγών",
            description: "Πάντα να αποθηκεύετε τις αλλαγές σας πριν αλλάξετε σελίδα.",
            action: "Κάντε κλικ στο κουμπί 'Αποθήκευση' στο επάνω μέρος"
          }
        ]}
      />
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
